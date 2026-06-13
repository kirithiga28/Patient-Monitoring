import { useState } from "react";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Patients from "./components/Patients";
import AddPatient from "./components/AddPatient";
import Alerts from "./components/Alerts";
import Reports from "./components/Reports";
import Settings from "./components/Settings";
import AIPredictions from "./components/AIPredictions";

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [page, setPage] = useState("dashboard");

  if (!loggedIn) {
    return <Login setLoggedIn={setLoggedIn} />;
  }

  return (
    <div className="flex bg-slate-100 min-h-screen">
      <Sidebar setPage={setPage} />

      <div className="flex-1 p-8">
        {page === "dashboard" && <Dashboard />}
        {page === "patients" && <Patients />}
        {page === "addpatient" && <AddPatient />}
        {page === "alerts" && <Alerts />}
        {page === "reports" && <Reports />}
        {page === "predictions" && <AIPredictions />}
        {page === "settings" && <Settings />}
      </div>
    </div>
  );
}