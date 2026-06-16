import { useAuth } from "../context/AuthContext";
import Login from "./Login";

export default function PrivateRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg font-semibold">Loading Well Care System...</p>
      </div>
    );
  }

  return currentUser ? children : <Login />;
}
