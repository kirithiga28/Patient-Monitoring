export default function Settings() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        Settings
      </h1>

      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <div>
          <label className="font-bold">
            Notification Alerts
          </label>

          <select className="w-full border p-3 rounded-lg mt-2">
            <option>Enabled</option>
            <option>Disabled</option>
          </select>
        </div>

        <div>
          <label className="font-bold">
            Theme
          </label>

          <select className="w-full border p-3 rounded-lg mt-2">
            <option>Light</option>
            <option>Dark</option>
          </select>
        </div>

        <div>
          <label className="font-bold">
            User Role
          </label>

          <select className="w-full border p-3 rounded-lg mt-2">
            <option>Doctor</option>
            <option>Nurse</option>
            <option>Admin</option>
          </select>
        </div>
      </div>
    </div>
  );
}