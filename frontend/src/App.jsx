import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import MainLayout from "./layouts/MainLayout";
import { getRouteComponent } from "./routes/RouteConfig";

export default function App() {
  const { currentUser, loading, role } = useAuth();
  const [page, setPage] = useState("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="font-semibold text-sm tracking-wider uppercase text-slate-400">Loading Well Care System...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <MainLayout currentPage={page} setPage={setPage}>
      {getRouteComponent(page, role)}
    </MainLayout>
  );
}