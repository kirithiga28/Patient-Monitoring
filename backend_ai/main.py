import os
import cv2
import numpy as np
import base64
import time
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
from ultralytics import YOLO

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
    # Look for service account credentials file
    cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-credentials.json")
    if os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase Admin SDK successfully initialized.")
    else:
        # Fallback to default application credentials
        firebase_admin.initialize_app()
        db = firestore.client()
        print("Firebase Admin SDK initialized using default settings.")
except Exception as e:
    print(f"Warning: Firebase Admin could not be initialized: {e}")
    print("AI detections will run locally without auto-pushing to Firestore.")

# Load YOLOv8 Model (downloads automatically if not present locally)
try:
    model = YOLO("yolov8n.pt")
    print("YOLOv8 Model loaded successfully.")
except Exception as e:
    print(f"Error loading YOLOv8: {e}")
    model = None

class FramePayload(BaseModel):
    frame_base64: str
    patient_id: str
    patient_name: str
    room_code: str
    hospital_id: str

@app.get("/")
def read_root():
    return {"status": "Active", "engine": "YOLOv8 & OpenCV", "service": "Patient Behavior Tracker"}

@app.post("/analyze")
def analyze_frame(payload: FramePayload):
    if not model:
        raise HTTPException(status_code=500, detail="YOLOv8 engine not loaded")

    try:
        # Decode base64 image frame
        img_data = base64.b64decode(payload.frame_base64.split(",")[-1])
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise HTTPException(status_code=400, detail="Invalid image frame data")

        # Run YOLOv8 detection
        results = model(img, classes=[0], verbose=False) # class 0 is person
        detections = []
        abnormal_event = None
        severity = "Low"

        for result in results:
            boxes = result.boxes
            for box in boxes:
                xyxy = box.xyxy[0].cpu().numpy() # [x1, y1, x2, y2]
                conf = float(box.conf[0].cpu().numpy())
                
                x1, y1, x2, y2 = map(int, xyxy)
                width = x2 - x1
                height = y2 - y1
                aspect_ratio = width / height if height > 0 else 0

                # Simple Heuristic Activity Classifications
                activity = "Standing"
                confidence = conf

                if aspect_ratio > 1.2:
                    # Width is significantly greater than height -> Horizontal orientation (Fall)
                    activity = "Fall Detected"
                    abnormal_event = "Fall Detected"
                    severity = "Critical"
                elif aspect_ratio > 0.8:
                    activity = "Sitting"
                else:
                    activity = "Walking"

                detections.append({
                    "activity": activity,
                    "confidence": f"{int(confidence * 100)}%",
                    "bbox": [x1, y1, x2, y2]
                })

        # Default detection if no person found
        if not detections:
            detections.append({
                "activity": "Sleeping",
                "confidence": "95%",
                "bbox": []
            })

        # If abnormal human behavior is identified, auto-register Firestore alert
        primary_activity = detections[0]["activity"]
        primary_confidence = detections[0]["confidence"]

        if abnormal_event and db:
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
                "notes": f"AI flagged {abnormal_event} with {primary_confidence} confidence."
            })
            print(f"Firestore Alert Registered: {abnormal_event} for Room {payload.room_code}")

        return {
            "activity": primary_activity,
            "confidence": primary_confidence,
            "detections": detections,
            "alert_created": abnormal_event is not None
        }

    except Exception as e:
        print(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
