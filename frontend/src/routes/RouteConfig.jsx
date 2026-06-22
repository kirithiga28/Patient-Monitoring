import React from "react";
import Dashboard from "../pages/Dashboard";
import Patients from "../pages/Patients";
import AddPatient from "../pages/AddPatient";
import Alerts from "../pages/Alerts";
import Reports from "../pages/Reports";
import AIPredictions from "../pages/AIPredictions";
import Cameras from "../pages/Cameras";
import Doctors from "../pages/Doctors";
import Nurses from "../pages/Nurses";
import Settings from "../pages/Settings";
import PoseTestingSuite from "../pages/PoseTestingSuite";
import MobileAccessQR from "../pages/system/MobileAccessQR";

// Import modules
import {
  PatientProfile,
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
  NotificationCenter,
  AppointmentManagement
} from "../pages/clinical/ClinicalModule";

import {
  BedManagement,
  StaffManagement,
  UserManagement,
  DeviceManagement,
  AnalyticsDashboard
} from "../pages/admin/AdminModule";

import {
  AuditLogs,
  SystemOverview
} from "../pages/system/SystemModule";

export const routesConfig = {
  // Core pages
  dashboard: { component: Dashboard, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  patients: { component: Patients, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  patientprofile: { component: PatientProfile, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  addpatient: { component: AddPatient, roles: ["super_admin", "hospital_admin", "nurse"] },
  cameras: { component: Cameras, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  livecameras: { component: LiveCameraMonitoring, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  testing: { component: PoseTestingSuite, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  predictions: { component: AIPredictions, roles: ["super_admin", "hospital_admin", "doctor"] },
  alerts: { component: Alerts, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  reports: { component: Reports, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  doctors: { component: Doctors, roles: ["super_admin", "hospital_admin"] },
  nurses: { component: Nurses, roles: ["super_admin", "hospital_admin"] },
  settings: { component: Settings, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  
  // Patient Management
  medicalrecords: { component: MedicalRecords, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  patientvitals: { component: PatientVitals, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  icumonitoring: { component: ICUMonitoring, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  observationward: { component: ObservationWardMonitor, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  criticalpatient: { component: CriticalPatientMonitor, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },

  // Monitoring & AI
  activityhistory: { component: ActivityHistory, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },

  // Clinical Operations
  emergencyalerts: { component: EmergencyAlerts, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  notificationcenter: { component: NotificationCenter, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  appointments: { component: AppointmentManagement, roles: ["super_admin", "hospital_admin", "doctor"] },


  // Administration
  bedmanagement: { component: BedManagement, roles: ["super_admin", "hospital_admin"] },
  staffmanagement: { component: StaffManagement, roles: ["super_admin", "hospital_admin"] },
  usermanagement: { component: UserManagement, roles: ["super_admin", "hospital_admin"] },
  devicemanagement: { component: DeviceManagement, roles: ["super_admin", "hospital_admin"] },
  analytics: { component: AnalyticsDashboard, roles: ["super_admin", "hospital_admin", "doctor"] },

  // System
  auditlogs: { component: AuditLogs, roles: ["super_admin", "hospital_admin"] },
  systemoverview: { component: SystemOverview, roles: ["super_admin", "hospital_admin"] },
  mobileqr: { component: MobileAccessQR, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] }
};

export function getRouteComponent(page, userRole) {
  const route = routesConfig[page];
  if (!route) return null;
  
  if (userRole === "super_admin" || route.roles.includes(userRole)) {
    const Component = route.component;
    return <Component />;
  }
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400 text-center p-8 bg-slate-900 border border-slate-800 rounded-2xl">
      <span className="text-5xl mb-4">🚫</span>
      <h2 className="text-xl font-bold text-white">Access Denied</h2>
      <p className="text-xs text-slate-500 mt-2">You do not have the required permissions to view this clinical module.</p>
    </div>
  );
}
