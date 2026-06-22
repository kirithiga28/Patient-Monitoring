import time
import math

class ActivityDetectionService:
    def __init__(self):
        # Maps patient_id -> dict of tracking variables
        self.patient_states = {}

    def get_or_create_state(self, patient_id):
        if patient_id not in self.patient_states:
            self.patient_states[patient_id] = {
                "pose_history": [],
                "ankle_history": [],
                "last_active_time": time.time(),
                "last_pose_coords": None,
                "last_yolo_coords": None,
                "in_bed": True,
                "fall_alert_sent": False,
                "bed_exit_sent": False,
                "inactivity_sent": False,
                "sudden_move_sent": False
            }
        return self.patient_states[patient_id]

    def calculate_angle(self, p1, p2, p3):
        v1_x = p1.x - p2.x
        v1_y = p1.y - p2.y
        v1_z = p1.z - p2.z
        
        v2_x = p3.x - p2.x
        v2_y = p3.y - p2.y
        v2_z = p3.z - p2.z
        
        dot = v1_x * v2_x + v1_y * v2_y + v1_z * v2_z
        mag1 = math.sqrt(v1_x**2 + v1_y**2 + v1_z**2)
        mag2 = math.sqrt(v2_x**2 + v2_y**2 + v2_z**2)
        
        if mag1 * mag2 == 0:
            return 180.0
            
        cos_angle = dot / (mag1 * mag2)
        cos_angle = max(-1.0, min(1.0, cos_angle))
        return math.degrees(math.acos(cos_angle))

    def classify_pose(self, landmarks, state):
        if not landmarks or len(landmarks) < 33:
            return "Unknown", 0.0

        # Extract key landmarks
        nose = landmarks[0]
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        left_wrist = landmarks[15]
        right_wrist = landmarks[16]
        left_hip = landmarks[23]
        right_hip = landmarks[24]
        left_knee = landmarks[25]
        right_knee = landmarks[26]
        left_ankle = landmarks[27]
        right_ankle = landmarks[28]

        # Calculate midpoints/averages
        mid_shoulder_x = (left_shoulder.x + right_shoulder.x) / 2
        mid_shoulder_y = (left_shoulder.y + right_shoulder.y) / 2
        mid_hip_x = (left_hip.x + right_hip.x) / 2
        mid_hip_y = (left_hip.y + right_hip.y) / 2
        mid_knee_x = (left_knee.x + right_knee.x) / 2
        mid_knee_y = (left_knee.y + right_knee.y) / 2
        mid_ankle_x = (left_ankle.x + right_ankle.x) / 2
        mid_ankle_y = (left_ankle.y + right_ankle.y) / 2

        # Update ankle movement history
        state["ankle_history"].append((left_ankle.x, left_ankle.y, right_ankle.x, right_ankle.y))
        if len(state["ankle_history"]) > 5:
            state["ankle_history"].pop(0)

        # 1. Check if Lying Down / Fall Candidate (Horizontal checks)
        dx_torso = mid_hip_x - mid_shoulder_x
        dy_torso = mid_hip_y - mid_shoulder_y
        torso_len = math.sqrt(dx_torso**2 + dy_torso**2)

        dx_body = mid_ankle_x - nose.x
        dy_body = mid_ankle_y - nose.y
        body_len = math.sqrt(dx_body**2 + dy_body**2)

        is_horizontal = False
        if body_len > 0.05:
            is_horizontal = (abs(dy_body) / body_len < 0.55) or (abs(dy_torso) / (torso_len + 1e-6) < 0.5)
        else:
            is_horizontal = abs(mid_shoulder_y - mid_ankle_y) < 0.22

        if is_horizontal:
            is_low_in_frame = (mid_hip_y > 0.60) or (mid_shoulder_y > 0.60) or (mid_ankle_y > 0.75)
            horiz_factor = 1.0 - (abs(dy_body) / (body_len + 1e-6) if body_len > 0 else 0)
            confidence = min(0.99, max(0.5, 0.7 + 0.29 * horiz_factor))
            
            if is_low_in_frame:
                return "Fall Detected", confidence
            else:
                return "Lying Down", confidence

        # 2. Check if Hands Raised / Hands Up / Left Hand / Right Hand
        left_hand_raised = left_wrist.y < left_shoulder.y
        right_hand_raised = right_wrist.y < right_shoulder.y

        if left_hand_raised and right_hand_raised:
            # Both hands raised
            return "Both Hands Raised", 0.95
        elif left_hand_raised:
            return "Left Hand Raised", 0.90
        elif right_hand_raised:
            return "Right Hand Raised", 0.90

        # 3. Check if Sitting
        left_knee_angle = self.calculate_angle(left_hip, left_knee, left_ankle)
        right_knee_angle = self.calculate_angle(right_hip, right_knee, right_ankle)
        avg_knee_angle = (left_knee_angle + right_knee_angle) / 2
        
        is_sitting_angle = 70.0 <= avg_knee_angle <= 115.0
        is_hip_lowered = (mid_hip_y > mid_shoulder_y + 0.10) and (abs(mid_hip_y - mid_knee_y) < 0.20)
        
        if is_sitting_angle and is_hip_lowered:
            angle_dev = abs(avg_knee_angle - 90.0)
            confidence = min(0.99, max(0.5, 0.95 - (angle_dev / 45.0) * 0.4))
            return "Sitting", confidence

        # 4. Check if Walking / Standing
        is_vertical = (mid_shoulder_y < mid_hip_y) and (mid_hip_y < mid_knee_y) and (mid_knee_y < mid_ankle_y)
        
        if is_vertical or (mid_ankle_y > mid_hip_y + 0.25):
            is_walking = False
            if len(state["ankle_history"]) >= 3:
                movement = sum(
                    abs(curr[0] - prev[0]) + abs(curr[1] - prev[1]) + abs(curr[2] - prev[2]) + abs(curr[3] - prev[3])
                    for prev, curr in zip(state["ankle_history"][:-1], state["ankle_history"][1:])
                )
                if movement > 0.05:
                    is_walking = True
            
            if is_walking:
                return "Walking", 0.85
            
            return "Standing", 0.92

        # 5. Check if Hands Down
        left_hand_down = left_wrist.y >= left_shoulder.y
        right_hand_down = right_wrist.y >= right_shoulder.y
        if left_hand_down and right_hand_down:
            return "Hands Down", 0.90

        return "Hands Down", 0.75

    def process_landmarks(self, patient_id, landmarks):
        state = self.get_or_create_state(patient_id)
        
        # 1. Classify raw pose
        raw_activity, raw_confidence = self.classify_pose(landmarks, state)
        
        # Add to history
        state["pose_history"].append(raw_activity)
        if len(state["pose_history"]) > 6:
            state["pose_history"].pop(0)
            
        activity = raw_activity
        confidence = raw_confidence
        alert_type = None
        severity = "Low"
        
        # Calculate joint movement since last frame for Sudden Movement & Inactivity
        current_time = time.time()
        current_coords = [(landmarks[idx].x, landmarks[idx].y) for idx in [0, 11, 12, 23, 24]]
        
        movement = 0.0
        if state["last_pose_coords"] is not None:
            movement = sum(math.sqrt((old[0] - new[0])**2 + (old[1] - new[1])**2) for old, new in zip(state["last_pose_coords"], current_coords))
            
            # Reset active timer if moving normally
            if movement > 0.04:
                state["last_active_time"] = current_time
                state["inactivity_sent"] = False
                
        state["last_pose_coords"] = current_coords

        # Check Sudden Movement
        if movement > 0.38:
            activity = "Sudden Movement"
            confidence = 0.95
            if not state["sudden_move_sent"]:
                alert_type = "Sudden Movement"
                severity = "High"
                state["sudden_move_sent"] = True
        else:
            state["sudden_move_sent"] = False

        # Check Emergency Gesture (Both Hands Raised / Hands Up)
        if raw_activity == "Both Hands Raised" or raw_activity == "Hands Up":
            activity = "Both Hands Raised"
            alert_type = "Emergency Gesture"
            severity = "Critical"

        # Check Fall Verification
        consecutive_falls = sum(1 for p in state["pose_history"][-3:] if p == "Fall Detected")
        has_vertical_past = any(
            p in ["Standing", "Sitting", "Walking", "Hands Raised", "Hands Down", "Left Hand Raised", "Right Hand Raised", "Both Hands Raised"] 
            for p in state["pose_history"][:-2]
        )
        
        if consecutive_falls >= 3:
            if has_vertical_past or (landmarks[23].y > 0.65 or landmarks[24].y > 0.65):
                activity = "Fall Detected"
                if not state["fall_alert_sent"]:
                    alert_type = "Fall Detected"
                    severity = "Critical"
                    state["fall_alert_sent"] = True
            else:
                activity = "Lying Down"
        else:
            if raw_activity == "Fall Detected":
                activity = "Lying Down"
            if raw_activity != "Fall Detected" and state["fall_alert_sent"]:
                state["fall_alert_sent"] = False

        # Lying Down vs Sleeping (Sleeping is Lying Down + completely static)
        if activity == "Lying Down":
            consecutive_horizontal = sum(1 for p in state["pose_history"][-2:] if p in ["Lying Down", "Fall Detected", "Sleeping"])
            if consecutive_horizontal < 2:
                vertical_poses = [p for p in state["pose_history"][:-1] if p in ["Standing", "Sitting", "Walking", "Hands Raised", "Hands Down", "Left Hand Raised", "Right Hand Raised", "Both Hands Raised"]]
                activity = vertical_poses[-1] if vertical_poses else "Standing"
            else:
                # If horizontal and inactive for > 15s, classify as Sleeping
                inactive_duration = current_time - state["last_active_time"]
                if inactive_duration > 15.0:
                    activity = "Sleeping"

        # Stateful Bed Exit Detection
        if activity == "Lying Down" or activity == "Sleeping":
            state["in_bed"] = True
            state["bed_exit_sent"] = False
            
        consecutive_vertical = sum(1 for p in state["pose_history"][-2:] if p in ["Standing", "Sitting", "Walking", "Hands Raised", "Hands Down", "Left Hand Raised", "Right Hand Raised", "Both Hands Raised"])
        if state["in_bed"] and consecutive_vertical >= 2:
            if not state["bed_exit_sent"]:
                alert_type = "Bed Exit"
                severity = "High"
                state["bed_exit_sent"] = True
                state["in_bed"] = False

        consecutive_lying = sum(1 for p in state["pose_history"][-2:] if p in ["Lying Down", "Fall Detected", "Sleeping"])
        if consecutive_lying >= 2:
            state["in_bed"] = True
            state["bed_exit_sent"] = False

        # Check Prolonged Inactivity
        inactive_duration = current_time - state["last_active_time"]
        if inactive_duration > 30.0 and not state["inactivity_sent"]:
            alert_type = "Prolonged Inactivity"
            severity = "High"
            state["inactivity_sent"] = True
            activity = "Inactivity Warning"
            confidence = 0.99

        return activity, confidence, alert_type, severity

    def process_yolo(self, patient_id, yolo_activity, yolo_confidence, bbox):
        state = self.get_or_create_state(patient_id)
        state["pose_history"].append(yolo_activity)
        if len(state["pose_history"]) > 6:
            state["pose_history"].pop(0)
            
        activity = yolo_activity
        confidence = yolo_confidence
        alert_type = None
        severity = "Low"
        
        consecutive_falls = sum(1 for p in state["pose_history"][-3:] if p == "Fall Detected")
        has_vertical_past = any(p in ["Standing", "Sitting"] for p in state["pose_history"][:-2])

        if consecutive_falls >= 3:
            if has_vertical_past:
                activity = "Fall Detected"
                if not state["fall_alert_sent"]:
                    alert_type = "Fall Detected"
                    severity = "Critical"
                    state["fall_alert_sent"] = True
            else:
                activity = "Sleeping"
        else:
            if yolo_activity == "Fall Detected":
                activity = "Sleeping"
            if yolo_activity != "Fall Detected" and state["fall_alert_sent"]:
                state["fall_alert_sent"] = False

        if activity == "Sleeping":
            state["in_bed"] = True
            state["bed_exit_sent"] = False
            
        consecutive_vertical = sum(1 for p in state["pose_history"][-2:] if p in ["Standing", "Sitting"])
        if state["in_bed"] and consecutive_vertical >= 2:
            if not state["bed_exit_sent"]:
                alert_type = "Bed Exit"
                severity = "High"
                state["bed_exit_sent"] = True
                state["in_bed"] = False

        consecutive_lying = sum(1 for p in state["pose_history"][-2:] if p in ["Sleeping", "Fall Detected"])
        if consecutive_lying >= 2:
            state["in_bed"] = True
            state["bed_exit_sent"] = False

        current_time = time.time()
        movement = 0.0
        if bbox is not None:
            center = ((bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2)
            if state["last_yolo_coords"] is not None and isinstance(state["last_yolo_coords"], tuple):
                old_center = state["last_yolo_coords"]
                movement = math.sqrt((old_center[0] - center[0])**2 + (old_center[1] - center[1])**2)
                if movement > 15:
                    state["last_active_time"] = current_time
                    state["inactivity_sent"] = False
                    state["sudden_move_sent"] = False
            state["last_yolo_coords"] = center
            
        if movement > 120:  # Sudden movement threshold for YOLO pixel shifts
            activity = "Sudden Movement"
            confidence = 0.95
            if not state["sudden_move_sent"]:
                alert_type = "Sudden Movement"
                severity = "High"
                state["sudden_move_sent"] = True

        inactive_duration = current_time - state["last_active_time"]
        if inactive_duration > 30.0 and not state["inactivity_sent"]:
            alert_type = "Prolonged Inactivity"
            severity = "High"
            state["inactivity_sent"] = True
            activity = "Inactivity Warning"
            confidence = 0.99

        return activity, confidence, alert_type, severity
