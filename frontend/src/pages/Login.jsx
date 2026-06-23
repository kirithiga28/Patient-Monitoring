import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to authenticate. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans p-4 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10 transition-all duration-300">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-4xl shadow-lg shadow-blue-500/20">
            🏥
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-1 text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Well Care Hospital
        </h1>

        <p className="text-center text-slate-400 text-xs mb-6">
          Monitoring System Portal
        </p>

        {error && (
          <div className="bg-red-950/50 border border-red-500/50 text-red-200 p-3 rounded-lg text-xs mb-4">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Username
            </label>
            <input
              type="text"
              placeholder="Enter username (doctor)"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold hover:from-blue-500 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-lg shadow-blue-600/30 transition disabled:opacity-50 mt-4 cursor-pointer text-xs uppercase tracking-wider"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Logging in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
