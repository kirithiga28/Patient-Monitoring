# Patient Monitoring Repository Analysis

This document provides a comprehensive audit of the initial `patient-monitoring` repository architecture, outlining functional gaps, database structure limits, scalability challenges, and a structured implementation plan.

---

## 1. Architectural Review

The project is divided into two distinct components:

### Frontend (`frontend/`)
- **Framework**: React + Vite, using Tailwind CSS.
- **Routing**: Single-page application using state-based rendering (`page` state inside [App.jsx](file:///C:/Users/meena/.gemini/antigravity-ide/scratch/patient-monitoring/frontend/src/App.jsx)) instead of a structured router (e.g., React Router).
- **Database Access**: Queries Firestore collections directly inside components (e.g., `collection(db, "patients")` in `Dashboard.jsx` and `Patients.jsx`).
- **Authentication**: Simple Firebase Auth integration in `Login.jsx` using local states, without global contexts to handle user scopes.

### Backend (`backend/`)
- **Framework**: Express.js server in `server.js` with static lists of patients.
- **Role**: Disconnected from the database and frontend client (the frontend directly interacts with Firebase, bypassing this server).

---

## 2. Identified Functional Gaps & Broken Areas

- **Simulated Alerts**: In [Alerts.jsx](file:///C:/Users/meena/.gemini/antigravity-ide/scratch/patient-monitoring/frontend/src/components/Alerts.jsx), alerts are generated using a client-side `setInterval` timer pulling from a mock array, rather than reading from a database collection.
- **Static AI Predictions**: [AIPredictions.jsx](file:///C:/Users/meena/.gemini/antigravity-ide/scratch/patient-monitoring/frontend/src/components/AIPredictions.jsx) utilizes a hardcoded array of patient risk levels and recommendations, without connection to live patient vitals.
- **Static PDF Reports**: The reports center only prints mock rows and does not represent real patients or telemetry histories.
- **Role Selection dropdown**: The role selection select-box in `Login.jsx` is not bound to a user database and has no effect on user permissions or routing.

---

## 3. Scalability & Code Integrity Challenges

- **Monolithic Data Layer**: Directly writing queries in components makes maintaining databases hard.
- **Single-Tenant Structure**: There is no separation of hospital boundaries. All patient and alert data are pooled in a single Firestore project, posing data privacy risks.
- **No Role-Based Access Control**: Any logged-in user has full read/write/delete privileges over all patient data, violating HIPAA/clinical privacy protocols.

---

## 4. Missing Enterprise Capabilities

1. **Multi-Tenancy (Multi-Hospital Isolation)**: Separation of clinical databases using a tenant-key filter (`hospitalId`).
2. **Real-time Alert Pipeline**: Automated event triggers that stream from camera nodes, run inference, evaluate risk thresholds, and insert records into Firestore.
3. **Hardware Telemetry Mappings**: Camera management models mapping USB/IP/RTSP video resources to specific patient rooms.
4. **Vitals History Logs**: Recording and graphing chronological vitals streams (SpO2, Heart Rate, Respiratory Rate).
5. **Firestore Security Rules**: Database rules checking tenant IDs and roles.

---

## 5. Development Implementation Roadmap

We propose addressing these upgrades across 5 progressive phases:

### Phase 1 — Data Isolation & Architecture Upgrade
- Abstract Firestore database operations into dedicated services.
- Introduce `AuthContext` to scope authentication details.
- Add `hospitalId` parameter filters to all database collection queries.

### Phase 2 — Access Control & Protected Routings
- Fetch user profiles from a Firestore `users` collection.
- Lock dashboard tabs and editing triggers based on roles.

### Phase 3 — Hardware Integrations & AI Pipeline
- Implement a Camera Management dashboard displaying webcam capture streams.
- Create a Python FastAPI microservice using YOLOv8 to identify falls and insert alerts.

### Phase 4 — Vitals History & Analytics Charts
- Log vital stats to history collections.
- RenderLineCharts displaying trends on patient dashboard overlays.

### Phase 5 — Auditing, Rules & Mobile Scoping
- Deploy custom rules preventing tenant cross-reads.
- Create the Expo React Native app structure under `mobile/` with shared Firebase libraries.
