import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, signup, forgotPassword } = useAuth();
  const [view, setView] = useState("login"); // "login", "register", "forgot"

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [medRegNo, setMedRegNo] = useState("");
  const [hospitalCode, setHospitalCode] = useState("WHC-2026-1001");
  const [department, setDepartment] = useState("General Medicine");
  const [qualification, setQualification] = useState("MBBS, MD");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");

  // Email validation RFC-compliant regex
  const validateEmailFormat = (val) => {
    if (!val || typeof val !== "string") return false;
    const trimmed = val.trim();
    if (/\s/.test(trimmed)) return false;
    if (/\.\./.test(trimmed)) return false;
    if (trimmed.includes(",")) return false;

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(trimmed)) return false;

    const parts = trimmed.split("@");
    if (parts.length !== 2) return false;
    const domain = parts[1];

    const domainParts = domain.split(".");
    if (domainParts.length < 2) return false;

    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) return false;
    if (tld.toLowerCase() === "cm") return false;
    if (tld.toLowerCase() === "c") return false;

    const tldRegex = /^[a-zA-Z]{2,6}$/;
    return tldRegex.test(tld);
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    if (val.length > 0 && !validateEmailFormat(val)) {
      setEmailError("Please enter a valid email address.");
    } else {
      setEmailError("");
    }
  };

  const handleViewChange = (newView) => {
    setView(newView);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setEmailError("");
    setError("");
    setSuccess("");
  };

  // Password validation: minimum 8 characters (letters, numbers, or combination allowed)
  const isPasswordValid = password.length >= 8;

  // Live password validation state: show error if typing and length < 8
  const showPasswordLengthError = password.length > 0 && password.length < 8;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateEmailFormat(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);

    try {
      await login(email.trim(), password);
      setSuccess("Login successful! Redirecting...");
    } catch (err) {
      console.error("Login component error:", err);
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!validateEmailFormat(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!isPasswordValid) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await signup(email.trim(), password, {
        fullName: fullName.trim(),
        mobile: mobile.trim(),
        medRegNo: medRegNo.trim(),
        hospitalCode: hospitalCode.trim(),
        department,
        qualification
      });
      setSuccess("Account registered successfully! Redirecting to doctor workspace...");
    } catch (err) {
      console.error("Registration component error:", err);
      setError(err.message || "Failed to register account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateEmailFormat(email)) {
      setError("Please enter a valid email address.");
      return;
    }

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
          AI Patient Monitoring System Portal
        </p>

        {error && (
          <div className="bg-red-950/60 border border-red-500/40 text-red-300 p-3 rounded-xl text-xs mb-4 flex items-center shadow-lg">
            <span className="mr-2 text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-950/60 border border-green-500/40 text-green-300 p-3 rounded-xl text-xs mb-4 flex items-center shadow-lg">
            <span className="mr-2 text-base">✅</span>
            <span>{success}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Doctor Email Address
              </label>
              <input
                type="email"
                placeholder="doctor@gmail.com"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full bg-slate-950/60 p-3 rounded-xl text-white outline-none transition text-xs ${
                  emailError
                    ? "border-2 border-red-500 focus:border-red-500 ring-2 ring-red-500/20"
                    : "border border-slate-800 focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20"
                }`}
              />
              {emailError && (
                <p className="text-red-400 text-[10px] font-bold mt-1">
                  {emailError}
                </p>
              )}
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
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition text-xs"
              />
            </div>

            <div className="flex justify-between items-center text-[10px] pt-1">
              <button
                type="button"
                onClick={() => handleViewChange("register")}
                className="text-blue-400 hover:text-blue-300 transition cursor-pointer font-bold"
              >
                Create Account (Sign Up)
              </button>
              <button
                type="button"
                onClick={() => handleViewChange("forgot")}
                className="text-slate-400 hover:text-slate-300 transition cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold hover:from-blue-500 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-lg shadow-blue-600/20 transition disabled:opacity-50 mt-4 cursor-pointer text-xs uppercase tracking-wider"
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

        {/* REGISTER / SIGN UP FORM */}
        {view === "register" && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Dr. John Smith"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 p-2.5 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500/20 transition text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="doctor@gmail.com"
                  required
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className={`w-full bg-slate-950/60 p-2.5 rounded-xl text-white outline-none transition text-xs ${
                    emailError
                      ? "border-2 border-red-500 focus:border-red-500 ring-2 ring-red-500/20"
                      : "border border-slate-800 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20"
                  }`}
                />
                {emailError && (
                  <p className="text-red-400 text-[10px] font-bold mt-1">
                    {emailError}
                  </p>
                )}
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
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 p-2.5 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500/20 transition text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Medical Reg No.
                </label>
                <input
                  type="text"
                  placeholder="MED-89172"
                  value={medRegNo}
                  onChange={(e) => setMedRegNo(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 p-2.5 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500/20 transition text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/80 p-2.5 rounded-xl text-white outline-none transition text-xs"
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Surgery">Surgery</option>
                  <option value="ICU Care">ICU Care</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Qualification
                </label>
                <input
                  type="text"
                  placeholder="MBBS, MD"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 p-2.5 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500/20 transition text-xs"
                />
              </div>
            </div>

            {/* PASSWORD FIELD WITH LIVE RED VALIDATION MESSAGE & RED BORDER */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                placeholder="•••••••• (min 8 characters)"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-slate-950/60 p-2.5 rounded-xl text-white outline-none transition text-xs ${
                  showPasswordLengthError
                    ? "border-2 border-red-500 focus:border-red-500 ring-2 ring-red-500/20"
                    : "border border-slate-800 focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20"
                }`}
              />
              {showPasswordLengthError && (
                <p className="text-red-400 text-[11px] font-medium mt-1 animate-pulse">
                  Password must contain at least 8 characters.
                </p>
              )}
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 p-2.5 rounded-xl text-white outline-none focus:ring-1 focus:ring-blue-500/20 transition text-xs"
              />
            </div>

            <div className="text-[10px] text-center pt-2">
              <span className="text-slate-400">Already registered? </span>
              <button
                type="button"
                onClick={() => handleViewChange("login")}
                className="text-blue-400 hover:text-blue-300 transition cursor-pointer font-bold"
              >
                Sign In Instead
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || showPasswordLengthError || !!emailError || !email || !isPasswordValid}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold hover:from-blue-500 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-lg shadow-blue-600/20 transition disabled:opacity-50 mt-4 cursor-pointer text-xs uppercase tracking-wider"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Creating Account...
                </span>
              ) : (
                "Register Doctor Account"
              )}
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {view === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Enter Doctor Email Address
              </label>
              <input
                type="email"
                placeholder="doctor@gmail.com"
                required
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full bg-slate-950/60 p-3 rounded-xl text-white outline-none transition text-xs ${
                  emailError
                    ? "border-2 border-red-500 focus:border-red-500 ring-2 ring-red-500/20"
                    : "border border-slate-800 focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20"
                }`}
              />
              {emailError && (
                <p className="text-red-400 text-[10px] font-bold mt-1">
                  {emailError}
                </p>
              )}
            </div>

            <div className="flex justify-between items-center text-[10px] pt-1">
              <button
                type="button"
                onClick={() => handleViewChange("login")}
                className="text-blue-400 hover:text-blue-300 transition cursor-pointer font-bold"
              >
                Back to Sign In
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold hover:from-blue-500 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-lg shadow-blue-600/20 transition disabled:opacity-50 mt-4 cursor-pointer text-xs uppercase tracking-wider"
            >
              {loading ? "Sending link..." : "Send Password Reset Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
