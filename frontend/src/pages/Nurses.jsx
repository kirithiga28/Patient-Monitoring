import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { userService } from "../services/userService";
import { patientService } from "../services/patientService";

export default function Nurses() {
  const { role, hospitalId } = useAuth();
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedNurse, setSelectedNurse] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    shift: "Morning",
    assignedRooms: []
  });

  const availableRooms = ["101", "105", "108", "110", "112", "115", "118", "120", "122", "125"];

  useEffect(() => {
    const unsubUsers = userService.listenUsers(role, hospitalId, (usersList) => {
      setUsers(usersList.filter(u => u.role === "nurse"));
      setLoading(false);
    });

    const unsubPatients = patientService.listenPatients(role, hospitalId, null, null, (patientList) => {
      setPatients(patientList);
    });

    return () => {
      unsubUsers();
      unsubPatients();
    };
  }, [role, hospitalId]);

  const handleRoomToggle = (room) => {
    setFormData(prev => {
      const alreadyAssigned = prev.assignedRooms.includes(room);
      return {
        ...prev,
        assignedRooms: alreadyAssigned 
          ? prev.assignedRooms.filter(r => r !== room)
          : [...prev.assignedRooms, room]
      };
    });
  };

  const handleSaveNurse = async (e) => {
    e.preventDefault();
    try {
      if (editing && selectedNurse) {
        await userService.updateUser(selectedNurse.id, formData);
        alert("Nurse Roster Updated");
        setEditing(false);
        setSelectedNurse(null);
      } else {
        const mockUid = "nurse_" + Math.random().toString(36).substr(2, 9);
        await userService.saveUserProfile(mockUid, {
          ...formData,
          role: "nurse",
          hospitalId,
          status: "active"
        });
        alert("Nurse Registered Successfully");
      }
      setIsAdding(false);
      setFormData({ name: "", email: "", shift: "Morning", assignedRooms: [] });
    } catch (error) {
      console.error(error);
      alert("Failed to save nurse profile");
    }
  };

  const handleDeleteNurse = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this nurse account?");
    if (!confirmDelete) return;

    try {
      await userService.deleteUser(id);
      alert("Nurse Account Deleted");
    } catch (error) {
      console.error(error);
      alert("Failed to delete nurse account");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-2"></div>
        <p className="text-sm">Retrieving Ward Nursing Registry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Nurse Staff Management
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Map nurse schedules, shift rosters, and assign specific rooms for monitoring rounds.
          </p>
        </div>

        {(role === "super_admin" || role === "hospital_admin") && (
          <button
            onClick={() => {
              if (isAdding) {
                setIsAdding(false);
                setEditing(false);
                setSelectedNurse(null);
                setFormData({ name: "", email: "", shift: "Morning", assignedRooms: [] });
              } else {
                setIsAdding(true);
              }
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            {isAdding ? "Close Panel" : "➕ Register Nurse Roster"}
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleSaveNurse} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4 max-w-2xl">
          <h2 className="text-lg font-bold">{editing ? "Modify Nurse Details" : "Register Nurse Staff"}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="Nurse Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950/60 border border-slate-800 p-3 rounded-xl outline-none focus:border-blue-500 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="nurse@hospital.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-950/60 border border-slate-800 p-3 rounded-xl outline-none focus:border-blue-500 text-xs text-white"
              />
            </div>

            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-400 block mb-1">Shift Hours</label>
              <select
                value={formData.shift}
                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                className="w-full bg-slate-950/60 border border-slate-800 p-3 rounded-xl outline-none focus:border-blue-500 text-xs text-white"
              >
                <option value="Morning">Morning Shift (06:00 AM - 02:00 PM)</option>
                <option value="Evening">Evening Shift (02:00 PM - 10:00 PM)</option>
                <option value="Night">Night Shift (10:00 PM - 06:00 AM)</option>
              </select>
            </div>

            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-400 block mb-2">Assign Ward Room Numbers</label>
              <div className="grid grid-cols-5 gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                {availableRooms.map(room => (
                  <label key={room} className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.assignedRooms.includes(room)}
                      onChange={() => handleRoomToggle(room)}
                      className="rounded accent-blue-600"
                    />
                    <span>Room {room}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            {editing ? "Save Changes" : "Add Nurse Staff"}
          </button>
        </form>
      )}

      {/* Grid of registered nurses */}
      <div className="grid md:grid-cols-3 gap-6">
        {users.map((nurse) => (
          <div key={nurse.id} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow hover:border-slate-700 transition flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-extrabold text-lg text-slate-100">{nurse.name}</h3>
                <span className="text-[10px] font-black bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded">
                  {nurse.shift} Shift
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <p><span className="text-slate-500 font-semibold">Email:</span> {nurse.email}</p>
                <p><span className="text-slate-500 font-semibold">Assigned Ward Coverage:</span> {nurse.assignedRooms?.length || 0} room(s)</p>
                <div className="mt-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-850 max-h-24 overflow-y-auto">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">ROOM PATROL COVERAGE:</span>
                  {nurse.assignedRooms && nurse.assignedRooms.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {nurse.assignedRooms.map(r => (
                        <span key={r} className="text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300">Room {r}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-600">No rooms mapped.</p>
                  )}
                </div>
              </div>
            </div>

            {(role === "super_admin" || role === "hospital_admin") && (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedNurse(nurse);
                    setFormData({
                      name: nurse.name || "",
                      email: nurse.email || "",
                      shift: nurse.shift || "Morning",
                      assignedRooms: nurse.assignedRooms || []
                    });
                    setEditing(true);
                    setIsAdding(true);
                  }}
                  className="flex-1 py-2 bg-yellow-600/20 text-yellow-400 border border-yellow-600/30 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteNurse(nurse.id)}
                  className="px-3 bg-slate-950 hover:bg-red-950/40 hover:text-red-400 hover:border-red-500/20 text-slate-400 border border-slate-850 rounded-xl text-xs transition cursor-pointer"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}

        {users.length === 0 && (
          <p className="text-center text-slate-500 py-12 text-sm col-span-3">No active ward nurses registered.</p>
        )}
      </div>
    </div>
  );
}
