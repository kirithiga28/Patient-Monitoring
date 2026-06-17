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

export const routesConfig = {
  dashboard: { component: Dashboard, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  patients: { component: Patients, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  addpatient: { component: AddPatient, roles: ["super_admin", "hospital_admin", "nurse"] },
  alerts: { component: Alerts, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  reports: { component: Reports, roles: ["super_admin", "hospital_admin", "doctor", "nurse"] },
  predictions: { component: AIPredictions, roles: ["super_admin", "hospital_admin", "doctor"] },
  cameras: {
    component: Cameras,
    roles: [
      "super_admin",
      "hospital_admin",
      "doctor",
      "nurse"
    ]
  },
  doctors: { component: Doctors, roles: ["super_admin", "hospital_admin"] },
  nurses: { component: Nurses, roles: ["super_admin", "hospital_admin"] },
  settings: { component: Settings, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] },
  testing: { component: PoseTestingSuite, roles: ["super_admin", "hospital_admin", "doctor", "nurse", "caregiver"] }
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
