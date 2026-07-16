"use client";

import { useState, useEffect } from "react";
import { BedDouble, DoorOpen, CheckCircle, AlertCircle, Info, RefreshCw, UserPlus, LogOut, Layers, Paintbrush } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getQueue } from "@/lib/hospital-service";

const INITIAL_ROOMS = [
  // ICU Rooms
  { id: "ICU-101", ward: "ICU", roomNo: "101", type: "ICU", beds: 4, occupied: 2, status: "Partial", patient: "Surya Prakash", floor: "1" },
  { id: "ICU-102", ward: "ICU", roomNo: "102", type: "ICU", beds: 4, occupied: 0, status: "Available", patient: null, floor: "1" },

  // Private Rooms
  { id: "PVT-301", ward: "Private", roomNo: "301", type: "Private", beds: 1, occupied: 1, status: "Occupied", patient: "Vikram Shah", floor: "3" },
  { id: "PVT-302", ward: "Private", roomNo: "302", type: "Private", beds: 1, occupied: 0, status: "Available", patient: null, floor: "3" },
  { id: "PVT-303", ward: "Private", roomNo: "303", type: "Private", beds: 1, occupied: 0, status: "Cleaning", patient: null, floor: "3" },
  { id: "PVT-304", ward: "Private", roomNo: "304", type: "Private", beds: 1, occupied: 1, status: "Occupied", patient: "Anita Roy", floor: "3" },

  // General Male
  { id: "GEN-M-201", ward: "General Male", roomNo: "201", type: "General", beds: 6, occupied: 3, status: "Partial", patient: null, floor: "2" },
  { id: "GEN-M-202", ward: "General Male", roomNo: "202", type: "General", beds: 6, occupied: 0, status: "Available", patient: null, floor: "2" },

  // General Female
  { id: "GEN-F-203", ward: "General Female", roomNo: "203", type: "General", beds: 6, occupied: 4, status: "Partial", patient: null, floor: "2" },
  { id: "GEN-F-204", ward: "General Female", roomNo: "204", type: "General", beds: 6, occupied: 1, status: "Partial", patient: null, floor: "2" },

  // Operation Theater
  { id: "OT-401", ward: "OT", roomNo: "401", type: "OT", beds: 1, occupied: 0, status: "Available", patient: null, floor: "4" },
  { id: "OT-402", ward: "OT", roomNo: "402", type: "OT", beds: 1, occupied: 0, status: "Cleaning", patient: null, floor: "4" },

  // Emergency
  { id: "ER-101", ward: "Emergency", roomNo: "E-01", type: "Emergency", beds: 3, occupied: 2, status: "Partial", patient: null, floor: "G" },
  { id: "ER-102", ward: "Emergency", roomNo: "E-02", type: "Emergency", beds: 3, occupied: 0, status: "Available", patient: null, floor: "G" },
];

const WARD_COLORS = {
  "ICU": "text-rose-700 bg-rose-50 border-rose-200",
  "Private": "text-violet-700 bg-violet-50 border-violet-200",
  "General Male": "text-blue-700 bg-blue-50 border-blue-200",
  "General Female": "text-pink-700 bg-pink-50 border-pink-200",
  "OT": "text-amber-700 bg-amber-50 border-amber-200",
  "Emergency": "text-red-700 bg-red-50 border-red-200",
};

const STATUS_STYLES = {
  "Available": "bg-emerald-50 text-emerald-700 border-emerald-100",
  "Occupied": "bg-rose-50 text-rose-700 border-rose-100",
  "Partial": "bg-amber-50 text-amber-700 border-amber-100",
  "Cleaning": "bg-slate-50 text-slate-600 border-slate-200",
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [activeWard, setActiveWard] = useState("All");
  const [queue, setQueue] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null); // room id or null
  const [assignPatient, setAssignPatient] = useState("");

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  async function loadData() {
    setLoading(true);
    try {
      const q = await getQueue();
      setQueue(q);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const wards = ["All", "ICU", "Private", "General Male", "General Female", "OT", "Emergency"];
  const filtered = activeWard === "All" ? rooms : rooms.filter(r => r.ward === activeWard);

  // Metrics
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === "Available").length;
  const occupiedRooms = rooms.filter(r => r.status === "Occupied" || r.status === "Partial").length;
  const cleaningRooms = rooms.filter(r => r.status === "Cleaning").length;
  const totalBeds = rooms.reduce((acc, r) => acc + r.beds, 0);
  const occupiedBeds = rooms.reduce((acc, r) => acc + r.occupied, 0);

  const handleAssign = (e) => {
    e.preventDefault();
    if (!assignPatient) { showToast("Please enter a patient name", "error"); return; }
    setRooms(prev => prev.map(r => r.id === showAssignModal
      ? { ...r, occupied: r.occupied + 1, status: r.occupied + 1 >= r.beds ? "Occupied" : "Partial", patient: r.patient ? r.patient + ", " + assignPatient : assignPatient }
      : r
    ));
    showToast(`Patient ${assignPatient} assigned to room ${showAssignModal}!`, "success");
    setShowAssignModal(null);
    setAssignPatient("");
  };

  const handleDischarge = (roomId) => {
    setRooms(prev => prev.map(r => r.id === roomId
      ? { ...r, occupied: Math.max(0, r.occupied - 1), status: r.occupied - 1 <= 0 ? "Cleaning" : "Partial", patient: null }
      : r
    ));
    showToast(`Room ${roomId} updated to Cleaning status.`, "info");
  };

  const handleMarkClean = (roomId) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: "Available" } : r));
    showToast(`Room ${roomId} marked as Available!`, "success");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div key={t.id} className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg shadow-lg border text-xs font-semibold animate-in slide-in-from-top-2 duration-200
            ${t.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : ""}
            ${t.type === "error" ? "bg-rose-50 text-rose-800 border-rose-200" : ""}
            ${t.type === "info" ? "bg-indigo-50 text-indigo-800 border-indigo-200" : ""}`}
          >
            {t.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
            {t.type === "error" && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            {t.type === "info" && <Info className="w-4 h-4 text-indigo-500 shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-base font-bold text-slate-800 font-serif flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-500" /> Assign Patient to Room {showAssignModal}
            </h3>
            <form onSubmit={handleAssign} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Select Patient</Label>
                <select
                  value={assignPatient}
                  onChange={(e) => setAssignPatient(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
                >
                  <option value="">Select from queue...</option>
                  {queue.map(q => (
                    <option key={q.name} value={q.patient_name}>{q.patient_name}</option>
                  ))}
                  <option value="New Walk-in Patient">New Walk-in Patient</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1 h-9 text-xs" onClick={() => setShowAssignModal(null)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs font-semibold">Assign Room</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight font-serif">Room Management</h2>
          <p className="text-slate-300 text-xs font-medium mt-1">Manage ward rooms, bed capacity, patient allocation, and room status</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-center backdrop-blur-md">
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Total Rooms</p>
            <h4 className="text-xl font-bold font-serif text-indigo-300 mt-0.5">{totalRooms}</h4>
          </div>
          <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-center backdrop-blur-md">
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Beds Occupied</p>
            <h4 className="text-xl font-bold font-serif text-rose-300 mt-0.5">{occupiedBeds}/{totalBeds}</h4>
          </div>
          <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-center backdrop-blur-md">
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Available</p>
            <h4 className="text-xl font-bold font-serif text-emerald-300 mt-0.5">{availableRooms}</h4>
          </div>
          <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-center backdrop-blur-md">
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Cleaning</p>
            <h4 className="text-xl font-bold font-serif text-amber-300 mt-0.5">{cleaningRooms}</h4>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Ward Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {wards.map(ward => (
          <button
            key={ward}
            onClick={() => setActiveWard(ward)}
            className={`px-3.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
              activeWard === ward
                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-200 hover:text-indigo-600"
            }`}
          >
            {ward}
          </button>
        ))}
        <Button variant="outline" size="sm" onClick={loadData} className="ml-auto gap-1 border-slate-200 h-8 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Reload
        </Button>
      </div>

      {/* Rooms Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((room) => {
          const pct = room.beds > 0 ? Math.round((room.occupied / room.beds) * 100) : 0;
          const wardColor = WARD_COLORS[room.ward] || "text-slate-700 bg-slate-50 border-slate-200";
          const statusStyle = STATUS_STYLES[room.status] || STATUS_STYLES["Available"];

          return (
            <Card key={room.id} className={`border shadow-sm hover:shadow-md transition-all duration-200 flex flex-col ${
              room.status === "Available" ? "border-emerald-100" :
              room.status === "Occupied" ? "border-rose-100" :
              room.status === "Cleaning" ? "border-slate-200" : "border-amber-100"
            }`}>
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${wardColor}`}>
                      {room.ward}
                    </span>
                    <div className="flex items-center gap-1.5 mt-2">
                      <DoorOpen className="w-4 h-4 text-slate-500 shrink-0" />
                      <h4 className="text-base font-bold text-slate-800 font-serif">Room {room.roomNo}</h4>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">Floor {room.floor} · {room.type}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${statusStyle}`}>
                    {room.status}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="px-4 pb-4 flex flex-col gap-3 flex-1">
                {/* Bed occupancy bar */}
                <div>
                  <div className="flex justify-between text-[10px] mb-1 font-semibold text-slate-500">
                    <span>Beds: {room.occupied}/{room.beds}</span>
                    <span>{pct}% full</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        pct === 0 ? "bg-emerald-400" :
                        pct < 50 ? "bg-amber-400" :
                        pct < 100 ? "bg-orange-500" : "bg-rose-500"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Patient info if occupied */}
                {room.patient && (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-[10px] text-slate-600 font-semibold">
                    👤 {room.patient}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 mt-auto pt-1">
                  {room.status !== "Occupied" && room.occupied < room.beds && room.status !== "Cleaning" && (
                    <Button
                      size="sm"
                      onClick={() => setShowAssignModal(room.id)}
                      className="flex-1 h-7 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1"
                    >
                      <UserPlus className="w-3 h-3" /> Assign
                    </Button>
                  )}
                  {(room.status === "Occupied" || room.status === "Partial") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDischarge(room.id)}
                      className="flex-1 h-7 text-[10px] border-rose-200 text-rose-600 hover:bg-rose-50 font-bold gap-1"
                    >
                      <LogOut className="w-3 h-3" /> Discharge
                    </Button>
                  )}
                  {room.status === "Cleaning" && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkClean(room.id)}
                      className="flex-1 h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
                    >
                      <Paintbrush className="w-3 h-3" /> Mark Clean
                    </Button>
                  )}
                  {room.status === "Available" && room.occupied === 0 && (
                    <Button
                      size="sm"
                      onClick={() => setShowAssignModal(room.id)}
                      className="flex-1 h-7 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold gap-1"
                    >
                      <UserPlus className="w-3 h-3" /> Assign Patient
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
