import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { systemService } from "../services/systemService";

export default function Settings() {
  const { hospitalId, logout } = useAuth();
  const [theme, setTheme] = useState("Dark");
  const [notifications, setNotifications] = useState("Enabled");
  const [saving, setSaving] = useState(false);

  // Hospital settings state
  const [settings, setSettings] = useState({
    hospitalName: "",
    hospitalCode: "",
    contactNumber: "",
    address: "",
    email: ""
  });

  useEffect(() => {
    // Listen to settings in Firestore
    const unsubscribe = systemService.listenSettings(hospitalId, (data) => {
      setSettings({
        hospitalName: data.hospitalName || "Well Care Hospital",
        hospitalCode: data.hospitalCode || hospitalId || "WHC-2026-1001",
        contactNumber: data.contactNumber || "+1-555-0199",
        address: data.address || "123 Health Ave, Medical City",
        email: data.email || "contact@wellcare.com"
      });
    });

    return () => unsubscribe();
  }, [hospitalId]);

  const handleInputChange = (e) => {
    setSettings({
      ...settings,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await systemService.saveSettings(hospitalId, settings);
      alert("Hospital settings saved successfully.");
    } catch (err) {
      console.error(err);
      alert("Failed to save hospital settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl font-sans text-slate-100 animate-fade-in space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          System Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Customize monitoring workspace preference and review profile metadata.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-4">
        <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-850 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hospital Information (Editable)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Hospital Name</label>
              <input
                name="hospitalName"
                value={settings.hospitalName}
                onChange={handleInputChange}
                required
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Hospital Code</label>
              <input
                name="hospitalCode"
                value={settings.hospitalCode}
                onChange={handleInputChange}
                required
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Contact Number</label>
              <input
                name="contactNumber"
                value={settings.contactNumber}
                onChange={handleInputChange}
                required
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400 font-semibold">Hospital Email</label>
              <input
                name="email"
                type="email"
                value={settings.email}
                onChange={handleInputChange}
                required
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-slate-400 font-semibold">Address</label>
              <input
                name="address"
                value={settings.address}
                onChange={handleInputChange}
                required
                className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            FCM Cloud Notification Alerts
          </label>
          <select 
            value={notifications}
            onChange={(e) => setNotifications(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs"
          >
            <option value="Enabled">Enabled (Browser Web Push + Audio alarms)</option>
            <option value="Disabled">Disabled</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Interface Theme Preference
          </label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl text-white outline-none focus:border-blue-500 text-xs"
          >
            <option value="Dark">Clinical Dark Theme</option>
            <option value="Light">Clinical Light Theme</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
        >
          {saving ? "Saving settings..." : "💾 Save Settings"}
        </button>
      </form>

      <div className="pt-6 border-t border-slate-800">
        <button
          onClick={logout}
          className="w-full py-3 bg-red-950/40 border border-red-500/30 text-red-400 hover:bg-red-950/60 font-bold rounded-xl text-xs transition cursor-pointer"
        >
          Sign Out of System Session
        </button>
      </div>
    </div>
  );
}
