"use client";

import { useState, useEffect } from "react";
import { HeartHandshake, CheckCircle, AlertCircle, Info, Calendar, Plus, RefreshCw, UserCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getQueue } from "@/lib/hospital-service";

const INITIAL_SURGERIES = [
  { id: "SURG-309", patient: "Surya Prakash", surgeon: "Dr. Rajesh Kumar", assistant: "Nurse Mary", date: "2026-07-17 09:30 AM", room: "OT-1", type: "Angioplasty", status: "Scheduled" },
  { id: "SURG-310", patient: "Muthu Vel", surgeon: "Dr. Anita Roy", assistant: "Nurse Sarah", date: "2026-07-16 02:00 PM", room: "OT-2", type: "Appendectomy", status: "Ongoing" },
];

export default function OTPage() {
  const [surgeries, setSurgeries] = useState(INITIAL_SURGERIES);
  const [queue, setQueue] = useState([]);
  const [toasts, setToasts] = useState([]);

  // Form states
  const [patient, setPatient] = useState("");
  const [surgeon, setSurgeon] = useState("");
  const [assistant, setAssistant] = useState("");
  const [room, setRoom] = useState("OT-1");
  const [date, setDate] = useState("");
  const [surgType, setSurgType] = useState("");

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    async function loadData() {
      const q = await getQueue();
      setQueue(q);
    }
    loadData();
  }, []);

  const handleBookSurgery = (e) => {
    e.preventDefault();
    if (!patient || !surgeon || !date || !surgType) {
      showToast("Patient, Surgeon, Date, and Surgery Type are required", "error");
      return;
    }

    const newSurg = {
      id: `SURG-${Math.floor(300 + Math.random() * 700)}`,
      patient,
      surgeon,
      assistant: assistant || "On-duty Nurses",
      room,
      date,
      type: surgType,
      status: "Scheduled"
    };

    setSurgeries(prev => [newSurg, ...prev]);
    showToast(`Surgery scheduled for ${patient} in ${room}!`, "success");

    setPatient("");
    setSurgeon("");
    setAssistant("");
    setDate("");
    setSurgType("");
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Toast notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg shadow-lg border text-xs font-semibold animate-in slide-in-from-top-2 duration-200
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

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Operation Theatre (OT)</h2>
        <p className="text-muted-foreground mt-1">Schedule surgical cases, allocate OT rooms, and assign surgical staff</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scheduler form */}
        <Card className="lg:col-span-1 border-t-4 border-t-indigo-600 shadow-md">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-sm font-serif">Book OT Slot</CardTitle>
            <CardDescription className="text-xs">Schedule surgical procedures and allocate operating rooms.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleBookSurgery} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="surg-patient" className="text-xs font-semibold">Patient Name *</Label>
                <select
                  id="surg-patient"
                  value={patient}
                  onChange={(e) => setPatient(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                  required
                >
                  <option value="">Select Patient...</option>
                  {queue.map(q => (
                    <option key={q.name} value={q.patient_name}>{q.patient_name}</option>
                  ))}
                  <option value="Demo Case">Demo Case Inpatient</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="surg-doc" className="text-xs font-semibold">Chief Surgeon *</Label>
                  <Input
                    id="surg-doc"
                    placeholder="e.g. Dr. Kumar"
                    value={surgeon}
                    onChange={(e) => setSurgeon(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="surg-assistant" className="text-xs font-semibold">Assistant</Label>
                  <Input
                    id="surg-assistant"
                    placeholder="e.g. Nurse Mary"
                    value={assistant}
                    onChange={(e) => setAssistant(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="surg-room" className="text-xs font-semibold">OT Room</Label>
                  <select
                    id="surg-room"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
                  >
                    <option value="OT-1">OT-1 (Cardiac)</option>
                    <option value="OT-2">OT-2 (General)</option>
                    <option value="OT-3">OT-3 (Ortho)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="surg-date" className="text-xs font-semibold">Date & Time *</Label>
                  <Input
                    id="surg-date"
                    placeholder="e.g. 2026-07-17 09:30 AM"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="surg-type" className="text-xs font-semibold">Surgery Category *</Label>
                <Input
                  id="surg-type"
                  placeholder="e.g. Bypass Angioplasty"
                  value={surgType}
                  onChange={(e) => setSurgType(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9 text-xs font-semibold mt-2">
                <Plus className="w-3.5 h-3.5" /> Book Surgery Slot
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Schedule timeline */}
        <Card className="lg:col-span-2 shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-base font-serif">Today's Surgery Schedule</CardTitle>
            <CardDescription className="text-xs">Scheduled and ongoing clinical operations list.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-xs">
              <div className="grid grid-cols-5 px-6 py-2.5 font-bold text-slate-500 bg-slate-50/60 uppercase tracking-wider">
                <div>Case ID / Patient</div>
                <div>Surgeon</div>
                <div>Procedural Type</div>
                <div>Date & Time</div>
                <div className="text-right">Status</div>
              </div>
              {surgeries.map((surg) => (
                <div key={surg.id} className="grid grid-cols-5 px-6 py-4 items-center hover:bg-slate-50/20 transition-colors">
                  <div className="font-semibold text-slate-800">
                    {surg.patient}
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{surg.id} | {surg.room}</span>
                  </div>
                  <div className="text-slate-600 font-medium">{surg.surgeon} <span className="text-[10px] text-slate-400 block font-normal">{surg.assistant}</span></div>
                  <div className="text-slate-600 font-semibold">{surg.type}</div>
                  <div className="text-slate-500 font-medium">{surg.date}</div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      surg.status === "Ongoing" ? "bg-amber-50 text-amber-700 animate-pulse" : "bg-indigo-50 text-indigo-700"
                    }`}>
                      {surg.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
