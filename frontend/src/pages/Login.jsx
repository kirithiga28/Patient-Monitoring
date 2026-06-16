import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { userService } from "../services/userService";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor");
  const [hospitalId, setHospitalId] = useState("hosp_default");
  const [hospitalName, setHospitalName] = useState("Well Care City Hospital");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Create user in firebase auth
        const authInstance = getAuth();
        const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
        const user = userCredential.user;

        // Save profile in users collection using userService
        const userDocData = {
          email: email,
          name: name || email.split("@")[0],
          role: role,
          hospitalId: hospitalId,
          hospitalName: hospitalId === "hosp_default" ? "Well Care City Hospital" : hospitalName,
          assignedPatients: [],
          assignedRooms: [],
          status: "active"
        };
        await userService.saveUserProfile(user.uid, userDocData);

        // Also add hospital details if it's a new tenant
        await userService.registerHospitalTenant(hospitalId, hospitalName);

        // Authenticate context session
        window.location.reload();
      } else {
        await login(email, password);
      }
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

        <h1 className="text-3xl font-extrabold text-white mb-1 text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Well Care Hospital
        </h1>

        <p className="text-center text-slate-400 text-sm mb-6">
          Real-Time Patient AI Monitor
        </p>

        {error && (
          <div className="bg-red-950/50 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm mb-4">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Dr. Rajesh Mehta"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@hospital.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>

          {isSignUp && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Access Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="hospital_admin">Hospital Admin</option>
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="caregiver">Caregiver</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Hospital Code
                </label>
                <input
                  type="text"
                  placeholder="hosp_01"
                  required
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                />
              </div>

              {hospitalId !== "hosp_default" && (
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Hospital Name
                  </label>
                  <input
                    type="text"
                    placeholder="General Health Clinic"
                    required
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                  />
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:from-blue-500 hover:to-cyan-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-lg shadow-blue-600/30 transition disabled:opacity-50 mt-4 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                Processing...
              </span>
            ) : isSignUp ? (
              "Register & Initialize Tenant"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="text-center mt-6 text-slate-400 text-sm">
          {isSignUp ? (
            <p>
              Already have an account?{" "}
              <button
                onClick={() => setIsSignUp(false)}
                className="text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Sign In
              </button>
            </p>
          ) : (
            <p>
              Register a new hospital tenant?{" "}
              <button
                onClick={() => setIsSignUp(true)}
                className="text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Sign Up
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
