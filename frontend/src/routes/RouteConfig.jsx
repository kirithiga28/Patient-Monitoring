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

// Import new modularized screens
import {
  AdminDashboard,
  HospitalManagement,
  DepartmentManagement,
  RoomManagement,
  BedManagement,
  UserManagement,
  RolePermissionManagement
} from "../pages/admin/AdminModule";

import {
  PatientAdmission,
  PatientDischarge,
  PatientTransfer,
  PatientMedicalHistory,
  PatientVitalsMonitoring,
  PatientPrescriptions,
  PatientTreatmentPlan,
  PatientLabReports,
  PatientScanReports,
  PatientEmergencyProfile
} from "../pages/patient/PatientModule";

import {
  DoctorSchedule,
  DoctorAppointments,
  DoctorNotes,
  DoctorConsultationRecords
} from "../pages/doctor/DoctorModule";

import {
  NurseAssignmentBoard,
  NurseShiftManagement,
  MedicationAdministrationRecord
} from "../pages/nurse/NurseModule";

import {
  RealTimeActivityAnalytics,
  FallDetectionCenter,
  AbnormalActivityReview,
  AIIncidentInvestigation,
  LiveMultiCameraMonitoringWall,
  AIDetectionHistory
} from "../pages/ai/AIModule";

import {
  EmergencyResponseCenter,
  CodeBlueAlerts,
  AmbulanceCoordination
} from "../pages/emergency/EmergencyModule";

import {
  HospitalAnalyticsDashboard,
  OccupancyAnalytics,
  PatientRecoveryAnalytics,
  AIAccuracyDashboard
} from "../pages/analytics/AnalyticsModule";

import {
  InternalMessaging,
  Announcements,
  NotificationCenter
} from "../pages/communication/CommunicationModule";

import {
  AuditLogs,
  BackupRecovery,
  ApiConfiguration,
  SecurityMonitoring
} from "../pages/system/SystemModule";

export const routesConfig = {
  // Existing screens
  dashboard: { component: Dashboard, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  patients: { component: Patients, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  addpatient: { component: AddPatient, roles: ["super_admin", "hospital_admin", "nurse"] },
  alerts: { component: Alerts, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  reports: { component: Reports, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  predictions: { component: AIPredictions, roles: ["super_admin", "hospital_admin", "doctor"] },
  cameras: { component: Cameras, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  doctors: { component: Doctors, roles: ["super_admin", "hospital_admin"] },
  nurses: { component: Nurses, roles: ["super_admin", "hospital_admin"] },
  settings: { component: Settings, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  testing: { component: PoseTestingSuite, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },

  // Admin Module (7 screens)
  admindashboard: { component: AdminDashboard, roles: ["super_admin", "hospital_admin"] },
  hospitalmanagement: { component: HospitalManagement, roles: ["super_admin", "hospital_admin"] },
  departmentmanagement: { component: DepartmentManagement, roles: ["super_admin", "hospital_admin"] },
  roommanagement: { component: RoomManagement, roles: ["super_admin", "hospital_admin"] },
  bedmanagement: { component: BedManagement, roles: ["super_admin", "hospital_admin"] },
  usermanagement: { component: UserManagement, roles: ["super_admin", "hospital_admin"] },
  rolepermissions: { component: RolePermissionManagement, roles: ["super_admin", "hospital_admin"] },

  // Patient Management (10 screens)
  admission: { component: PatientAdmission, roles: ["super_admin", "hospital_admin", "nurse"] },
  discharge: { component: PatientDischarge, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  transfer: { component: PatientTransfer, roles: ["super_admin", "hospital_admin", "nurse"] },
  medicalhistory: { component: PatientMedicalHistory, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  vitalsmonitoring: { component: PatientVitalsMonitoring, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  prescriptions: { component: PatientPrescriptions, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  treatmentplan: { component: PatientTreatmentPlan, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  labreports: { component: PatientLabReports, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  scanreports: { component: PatientScanReports, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  emergencyprofile: { component: PatientEmergencyProfile, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },

  // Doctor Module (4 screens)
  doctorschedule: { component: DoctorSchedule, roles: ["super_admin", "hospital_admin", "doctor"] },
  doctorappointments: { component: DoctorAppointments, roles: ["super_admin", "hospital_admin", "doctor"] },
  doctornotes: { component: DoctorNotes, roles: ["super_admin", "hospital_admin", "doctor"] },
  consultations: { component: DoctorConsultationRecords, roles: ["super_admin", "hospital_admin", "doctor"] },

  // Nurse Module (3 screens)
  nurseassignments: { component: NurseAssignmentBoard, roles: ["super_admin", "hospital_admin", "nurse"] },
  nurseshifts: { component: NurseShiftManagement, roles: ["super_admin", "hospital_admin", "nurse"] },
  mar: { component: MedicationAdministrationRecord, roles: ["super_admin", "hospital_admin", "nurse"] },

  // AI Monitoring Module (6 screens)
  activityanalytics: { component: RealTimeActivityAnalytics, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  fallcenter: { component: FallDetectionCenter, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  abnormalreview: { component: AbnormalActivityReview, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  incidentinvestigation: { component: AIIncidentInvestigation, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  "camera-wall": { component: LiveMultiCameraMonitoringWall, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  detectionhistory: { component: AIDetectionHistory, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },

  // Emergency Module (3 screens)
  emergencycenter: { component: EmergencyResponseCenter, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  codeblue: { component: CodeBlueAlerts, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  ambulances: { component: AmbulanceCoordination, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },

  // Analytics Module (4 screens)
  hospitalanalytics: { component: HospitalAnalyticsDashboard, roles: ["super_admin", "hospital_admin", "doctor"] },
  occupancyanalytics: { component: OccupancyAnalytics, roles: ["super_admin", "hospital_admin"] },
  recoveryanalytics: { component: PatientRecoveryAnalytics, roles: ["super_admin", "hospital_admin", "doctor"] },
  accuracyanalytics: { component: AIAccuracyDashboard, roles: ["super_admin", "hospital_admin"] },

  // Communication Module (3 screens)
  messaging: { component: InternalMessaging, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  announcements: { component: Announcements, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  notificationcenter: { component: NotificationCenter, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },

  // System Module (4 screens)
  auditlogs: { component: AuditLogs, roles: ["super_admin", "hospital_admin"] },
  backups: { component: BackupRecovery, roles: ["super_admin", "hospital_admin"] },
  apiconfig: { component: ApiConfiguration, roles: ["super_admin", "hospital_admin"] },
  securitymonitoring: { component: SecurityMonitoring, roles: ["super_admin", "hospital_admin"] }
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
