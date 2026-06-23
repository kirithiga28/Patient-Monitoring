import React from "react";
import Dashboard from "../pages/Dashboard";
import Patients from "../pages/Patients";
import Reports from "../pages/Reports";
import Cameras from "../pages/Cameras";
import Settings from "../pages/Settings";
import DoctorProfile from "../pages/DoctorProfile";

import PatientProfile from "../pages/PatientProfile";
import {
  MedicalRecords,
  PatientVitals,
  ICUMonitoring,
  ObservationWardMonitor,
  CriticalPatientMonitor
} from "../pages/patient/PatientModule";

import {
  LiveCameraMonitoring,
  ActivityHistory
} from "../pages/ai/AIModule";

import {
  EmergencyAlerts,
  NotificationCenter
} from "../pages/clinical/ClinicalModule";

export const routesConfig = {
  dashboard: { component: Dashboard },
  patients: { component: Patients },
  patientprofile: { component: PatientProfile },
  medicalrecords: { component: MedicalRecords },
  patientvitals: { component: PatientVitals },
  
  livecameras: { component: LiveCameraMonitoring },
  icumonitoring: { component: ICUMonitoring },
  observationward: { component: ObservationWardMonitor },
  criticalpatient: { component: CriticalPatientMonitor },
  activityhistory: { component: ActivityHistory },

  cameras: { component: Cameras },
  emergencyalerts: { component: EmergencyAlerts },
  notificationcenter: { component: NotificationCenter },
  reports: { component: Reports },
  settings: { component: Settings },
  doctorprofile: { component: DoctorProfile }
};

export function getRouteComponent(page, userRole) {
  const route = routesConfig[page];
  if (!route) return null;
  
  const Component = route.component;
  return <Component />;
}
