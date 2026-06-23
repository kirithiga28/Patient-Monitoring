import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, signup, forgotPassword } = useAuth();
  const [view, setView] = useState("login"); // login, register, forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Registration states
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [medRegNo, setMedRegNo] = useState("");
  const [hospitalCode, setHospitalCode] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await signup(email.trim(), password, {
        fullName,
        mobile,
        medRegNo,
        hospitalCode
      });
      setSuccess("Account registered successfully! Redirecting...");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to register account.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await forgotPassword(email.trim());
      setSuccess("Password reset instructions have been sent to your email.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to send password reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 font-sans p-4 relative overflow-y-auto">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md my-8 relative z-10 transition-all duration-300">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-3xl shadow-lg shadow-blue-500/20">
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
          <div className="bg-red-950/50 border border-red-500/30 text-red-300 p-3 rounded-xl text-xs mb-4">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="bg-green-950/50 border border-green-500/30 text-green-300 p-3 rounded-xl text-xs mb-4">
            ✅ {success}
          </div>
        )}

        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Doctor Email Address
              </label>
              <input
                type="email"
                placeholder="doctor@wellcare.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-805 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/10 transition text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-805 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/10 transition text-xs"
              />
            </div>

            <div className="flex justify-between items-center text-[10px] pt-1">
              <button
                type="button"
                onClick={() => { setView("register"); setError(""); setSuccess(""); }}
                className="text-blue-400 hover:text-blue-300 transition cursor-pointer font-bold"
              >
                Create Account (Sign Up)
              </button>
              <button
                type="button"
                onClick={() => { setView("forgot"); setError(""); setSuccess(""); }}
                className="text-slate-500 hover:text-slate-400 transition cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold hover:from-blue-500 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 shadow-lg shadow-blue-600/20 transition disabled:opacity-50 mt-4 cursor-pointer text-xs uppercase tracking-wider"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Authenticating...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        )}

        {view === "register" && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Dr. Jane Doe"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-805 focus:border-blue-500/80 p-2.5 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500/10 transition text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="jane.doe@wellcare.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-805 focus:border-blue-500/80 p-2.5 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500/10 transition text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="+1-555-0199"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-805 focus:border-blue-500/80 p-2.5 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500/10 transition text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Medical Reg Number
                </label>
                <input
                  type="text"
                  placeholder="MED-89172"
                  required
                  value={medRegNo}
                  onChange={(e) => setMedRegNo(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-805 focus:border-blue-500/80 p-2.5 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500/10 transition text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Hospital Code (Tenant Scope)
              </label>
              <input
                type="text"
                placeholder="WHC-2026-1001"
                required
                value={hospitalCode}
                onChange={(e) => setHospitalCode(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-805 focus:border-blue-500/80 p-2.5 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500/10 transition text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-805 focus:border-blue-500/80 p-2.5 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500/10 transition text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-805 focus:border-blue-500/80 p-2.5 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500/10 transition text-xs"
                />
              </div>
            </div>

            <div className="text-[10px] text-center pt-2">
              <span className="text-slate-400">Already registered? </span>
              <button
                type="button"
                onClick={() => { setView("login"); setError(""); setSuccess(""); }}
                className="text-blue-400 hover:text-blue-300 transition cursor-pointer font-bold"
              >
                Sign In Instead
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold hover:from-blue-500 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 shadow-lg shadow-blue-600/20 transition disabled:opacity-50 mt-4 cursor-pointer text-xs uppercase tracking-wider"
            >
              {loading ? "Creating Account..." : "Register & Sign Up"}
            </button>
          </form>
        )}

        {view === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Enter Doctor Email Address
              </label>
              <input
                type="email"
                placeholder="doctor@wellcare.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-805 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/10 transition text-xs"
              />
            </div>

            <div className="flex justify-between items-center text-[10px] pt-1">
              <button
                type="button"
                onClick={() => { setView("login"); setError(""); setSuccess(""); }}
                className="text-blue-400 hover:text-blue-300 transition cursor-pointer font-bold"
              >
                Back to Sign In
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold hover:from-blue-500 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 shadow-lg shadow-blue-600/20 transition disabled:opacity-50 mt-4 cursor-pointer text-xs uppercase tracking-wider"
            >
              {loading ? "Sending link..." : "Send Password Reset Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
