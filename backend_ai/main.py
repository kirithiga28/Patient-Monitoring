import os
import cv2
import numpy as np
import base64
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
from ultralytics import YOLO
import mediapipe as mp
from activityDetectionService import ActivityDetectionService

app = FastAPI(title="Well Care Patient Monitor AI Microservice")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin SDK
db = None
try:
    cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-credentials.json")
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase Admin SDK successfully initialized.")
    else:
        firebase_admin.initialize_app()
        db = firestore.client()
        print("Firebase Admin SDK initialized using default settings.")
except Exception as e:
    print(f"Warning: Firebase Admin could not be initialized: {e}")
    print("AI detections will run locally without auto-pushing to Firestore.")

# Load YOLOv8 Model as fallback
try:
    yolo_model = YOLO("yolov8n.pt")
    print("YOLOv8 Model loaded successfully as fallback.")
except Exception as e:
    print(f"Error loading YOLOv8: {e}")
    yolo_model = None

# Initialize MediaPipe Pose solutions
mp_pose = mp.solutions.pose
pose_estimator = mp_pose.Pose(
    static_image_mode=False,
    model_complexity=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)
mp_drawing = mp.solutions.drawing_utils

# Initialize Activity Detection service helper
activity_service = ActivityDetectionService()

class FramePayload(BaseModel):
    frame_base64: str
    patient_id: str
    patient_name: str
    room_code: str
    hospital_id: str

@app.get("/")
def read_root():
    return {
        "status": "Active",
        "engine": "MediaPipe Pose & YOLOv8 Fallback",
        "service": "Abnormal Patient Activity Tracker"
    }

@app.post("/analyze")
def analyze_frame(payload: FramePayload):
    try:
        # Decode base64 image frame
        img_data = base64.b64decode(payload.frame_base64.split(",")[-1])
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image frame data")

        # Convert to RGB for MediaPipe Pose processing
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        results = pose_estimator.process(img_rgb)
        
        activity = "Standing"
        confidence = 0.90
        abnormal_event = None
        severity = "Low"
        pose_found = False

        if results.pose_landmarks:
            pose_found = True
            landmarks = results.pose_landmarks.landmark
            # Process statefully with MediaPipe keypoints
            activity, confidence, alert_type, severity = activity_service.process_landmarks(
                payload.patient_id,
                landmarks
            )
            
            # Mandatory debug logs
            print("Pose detected")
            print("Landmarks count:", len(landmarks))
            print("Detected activity:", activity)
            
            if alert_type:
                abnormal_event = alert_type
            
            # Draw visual skeleton overlay on the frame
            mp_drawing.draw_landmarks(
                img,
                results.pose_landmarks,
                mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=2, circle_radius=2), # joints
                mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=2, circle_radius=2)  # connections
            )

            # Draw bounding box around pose landmarks
            h, w, _ = img.shape
            xs = [lm.x for lm in landmarks]
            ys = [lm.y for lm in landmarks]
            x_min = max(0, int(min(xs) * w))
            y_min = max(0, int(min(ys) * h))
            x_max = min(w, int(max(xs) * w))
            y_max = min(h, int(max(ys) * h))
            
            cv2.rectangle(img, (x_min, y_min), (x_max, y_max), (0, 255, 255), 2)
            cv2.putText(img, f"{activity} {int(confidence * 100)}%", (x_min, y_min - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2)

        # Fallback to YOLO person detection if no pose landmarks extracted
        if not pose_found and yolo_model:
            results_yolo = yolo_model(img, classes=[0], verbose=False)
            detections = []
            
            for result in results_yolo:
                boxes = result.boxes
                for box in boxes:
                    xyxy = box.xyxy[0].cpu().numpy()
                    conf = float(box.conf[0].cpu().numpy())
                    
                    x1, y1, x2, y2 = map(int, xyxy)
                    width = x2 - x1
                    height = y2 - y1
                    aspect_ratio = width / height if height > 0 else 0

                    # Standard YOLO heuristical checks
                    yolo_activity = "Standing"
                    if aspect_ratio > 1.25:
                        yolo_activity = "Fall Detected"
                    elif aspect_ratio > 0.8:
                        yolo_activity = "Sitting"
                    
                    detections.append({
                        "activity": yolo_activity,
                        "confidence": conf,
                        "bbox": [x1, y1, x2, y2]
                    })
                    
                    # Draw fallback bounding box overlay
                    cv2.rectangle(img, (x1, y1), (x2, y2), (0, 165, 255), 2)
                    cv2.putText(img, f"Fallback: {yolo_activity}", (x1, y1 - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 165, 255), 1)

            if detections:
                det = detections[0]
                activity, confidence, alert_type, severity = activity_service.process_yolo(
                    payload.patient_id,
                    det["activity"],
                    det["confidence"],
                    det["bbox"]
                )
                if alert_type:
                    abnormal_event = alert_type
            else:
                # If no one is seen, run stateful tracking with "Sleeping" and no bbox
                activity, confidence, alert_type, severity = activity_service.process_yolo(
                    payload.patient_id,
                    "Sleeping",
                    0.95,
                    None
                )
                if alert_type:
                    abnormal_event = alert_type

        # Format confidence display
        conf_str = f"{int(confidence * 100)}%" if isinstance(confidence, float) else str(confidence)

        # Write to activities logs history collection in Firestore
        if db:
            try:
                activity_ref = db.collection("activities").document()
                activity_ref.set({
                    "patientId": payload.patient_id,
                    "patientName": payload.patient_name,
                    "room": payload.room_code,
                    "activity": activity,
                    "confidence": conf_str,
                    "timestamp": firestore.SERVER_TIMESTAMP,
                    "hospitalId": payload.hospital_id
                })

                # Create Firestore Alert automatically on anomalies
                if abnormal_event:
                    alert_ref = db.collection("alerts").document()
                    alert_ref.set({
                        "patientId": payload.patient_id,
                        "patientName": payload.patient_name,
                        "room": payload.room_code,
                        "alertType": abnormal_event,
                        "severity": severity,
                        "status": "Open",
                        "timestamp": firestore.SERVER_TIMESTAMP,
                        "hospitalId": payload.hospital_id,
                        "resolvedBy": "",
                        "notes": f"AI flagged {abnormal_event} with {conf_str} confidence."
                    })
                    print(f"Firestore Alert Registered: {abnormal_event} for Patient: {payload.patient_name}")
            except Exception as fs_err:
                print(f"Firestore operations error: {fs_err}")

        # Re-encode frame with drawing overlays back to base64
        _, buffer = cv2.imencode(".jpg", img)
        annotated_base64 = base64.b64encode(buffer).decode("utf-8")

        raw_lm_list = []
        if pose_found:
            raw_lm_list = [{"x": float(lm.x), "y": float(lm.y), "z": float(lm.z), "visibility": float(lm.visibility)} for lm in results.pose_landmarks.landmark]

        return {
            "activity": activity,
            "confidence": conf_str,
            "alert_created": abnormal_event is not None,
            "annotated_frame_base64": f"data:image/jpeg;base64,{annotated_base64}",
            "landmarks_count": len(results.pose_landmarks.landmark) if pose_found else 0,
            "ai_status": "MediaPipe Active" if pose_found else "YOLO Fallback Active",
            "raw_landmarks": raw_lm_list
        }

    except Exception as e:
        print(f"Frame analysis execution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
