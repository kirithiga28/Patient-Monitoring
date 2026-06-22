import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { communicationService } from "../../services/communicationService";
import { alertService } from "../../services/alertService";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";

// 38. Internal Messaging
export function InternalMessaging() {
  const { hospitalId, userData } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return communicationService.listenMessages(hospitalId, (list) => {
      setMessages(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      await communicationService.sendMessage({
        sender: userData?.name || "Dr. Staff Member",
        text: inputText,
        hospitalId: hospitalId || "hosp_default"
      });
      setInputText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Staff Internal Messaging</h1>
        <p className="text-slate-400 text-xs mt-1">Real-time chat board for clinician rounding notes and coordination.</p>
      </div>

      <Card className="flex flex-col h-[480px]">
        <CardHeader>
          <CardTitle>Rounding Chat Channel</CardTitle>
        </CardHeader>
        
        {/* Messages viewport */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-slate-950/40">
          {loading ? (
            <div className="text-center text-slate-500 text-xs py-12">Loading messages...</div>
          ) : messages.map((m) => (
            <div key={m.id} className="bg-slate-900 border border-slate-850 p-3 rounded-xl max-w-lg space-y-1">
              <div className="flex justify-between items-center text-[10px] font-extrabold">
                <span className="text-blue-400">{m.sender}</span>
                <span className="text-slate-500">{m.time}</span>
              </div>
              <p className="text-xs text-slate-200">{m.text}</p>
            </div>
          ))}
        </div>

        {/* Input box */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-800 bg-slate-900 flex gap-3">
          <input
            type="text"
            placeholder="Type your clinical update..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-950/60 border border-slate-800 focus:border-blue-500/80 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-blue-500/20 transition"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Send Update
          </button>
        </form>
      </Card>
    </div>
  );
}

// 39. Announcements
export function Announcements() {
  const { hospitalId } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return communicationService.listenAnnouncements(hospitalId, (list) => {
      setAnnouncements(list);
      setLoading(false);
    });
  }, [hospitalId]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Board Announcements</h1>
        <p className="text-slate-400 text-xs mt-1">Review standard operating procedures updates, shifts directives, and clinic news.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {announcements.map((a) => (
          <Card key={a.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle>{a.title}</CardTitle>
              <span className="text-[10px] text-slate-500 font-mono">{a.date}</span>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-slate-300 leading-normal">{a.content}</p>
              <div className="text-[10px] text-slate-500 font-extrabold uppercase">
                Author: {a.author}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// 40. Notification Center
export function NotificationCenter() {
  const { hospitalId } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return alertService.listenAlerts("doctor", hospitalId, (list) => {
      setAlerts(list);
      setLoading(false);
    });
  }, [hospitalId]);

  const columns = [
    { key: "patientName", label: "Patient" },
    { key: "alertType", label: "Incident Alert Title", className: "font-bold text-red-400" },
    { key: "room", label: "Room" },
    { key: "severity", label: "Severity" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-slate-400 border border-slate-850">
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">System Notification Center</h1>
        <p className="text-slate-400 text-xs mt-1">Consolidated hub tracking all dispatch notifications and telemetry alarms.</p>
      </div>

      <DataTable
        columns={columns}
        data={alerts}
        searchKey="patientName"
        searchPlaceholder="Search notification alerts..."
        loading={loading}
      />
    </div>
  );
}
