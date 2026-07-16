"use client";

import { useState, useEffect } from "react";
import { Calendar, Plus, CheckCircle, AlertCircle, Info, RefreshCw, XCircle, Clock, Award } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getQueue, getDoctors } from "@/lib/hospital-service";

const INITIAL_APPOINTMENTS = [
  { token: "T-01", patient: "Surya Prakash", doctor: "Dr. Rajesh Kumar", time: "2026-07-17 10:00 AM", status: "Confirmed" },
  { token: "T-02", patient: "Muthu Vel", doctor: "Dr. Anita Roy", time: "2026-07-17 10:30 AM", status: "Confirmed" },
];

export default function BookAppointmentsPage() {
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [doctors, setDoctors] = useState([]);
  const [queue, setQueue] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [patient, setPatient] = useState("");
  const [doctor, setDoctor] = useState("");
  const [time, setTime] = useState("");

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  async function loadData() {
    setLoading(true);
    try {
      const activeQueue = await getQueue();
      setQueue(activeQueue);
      const activeDocs = await getDoctors();
      setDoctors(activeDocs);
      if (activeDocs.length > 0) {
        setDoctor(activeDocs[0].name);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleBook = (e) => {
    e.preventDefault();
    if (!patient || !doctor || !time) {
      showToast("All fields are required", "error");
      return;
    }

    const docObj = doctors.find(d => d.name === doctor);
    const docDisplayName = docObj ? docObj.doctor_name : doctor;

    const nextToken = `T-0${appointments.length + 1}`;
    const newAppt = {
      token: nextToken,
      patient,
      doctor: docDisplayName,
      time,
      status: "Confirmed"
    };

    setAppointments(prev => [...prev, newAppt]);
    showToast(`Appointment booked successfully! Token: ${nextToken}`, "success");

    setPatient("");
    setTime("");
  };

  const handleCancel = (token, name) => {
    setAppointments(prev => prev.map(a => a.token === token ? { ...a, status: "Cancelled" } : a));
    showToast(`Appointment ${token} for ${name} cancelled.`, "error");
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

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Appointment Scheduler</h2>
          <p className="text-muted-foreground mt-1">Book consultations, schedule appointments, and assign ticket tokens</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-1 border-slate-200">
          <RefreshCw className="w-3.5 h-3.5" /> Sync Schedule
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Booking Form */}
        <Card className="lg:col-span-1 border-t-4 border-t-indigo-600 shadow-md">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-sm font-serif">Schedule Consultation</CardTitle>
            <CardDescription className="text-xs">Schedule appointment slots and calculate queue token tickets.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleBook} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="appt-patient" className="text-xs font-semibold">Select Patient *</Label>
                <select
                  id="appt-patient"
                  value={patient}
                  onChange={(e) => setPatient(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
                  required
                >
                  <option value="">Select Patient...</option>
                  {queue.map(q => (
                    <option key={q.name} value={q.patient_name}>{q.patient_name}</option>
                  ))}
                  <option value="Walk-in Guest">Walk-in Guest</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="appt-doctor" className="text-xs font-semibold">Select Consultation Doctor *</Label>
                <select
                  id="appt-doctor"
                  value={doctor}
                  onChange={(e) => setDoctor(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
                  required
                >
                  {doctors.map(d => (
                    <option key={d.name} value={d.name}>{d.doctor_name} ({d.specialization})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="appt-time" className="text-xs font-semibold">Scheduled Date & Time *</Label>
                <Input
                  id="appt-time"
                  placeholder="e.g. 2026-07-17 10:00 AM"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9 text-xs font-semibold mt-2">
                <Calendar className="w-3.5 h-3.5" /> Book Appointment
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Appointments Queue list */}
        <Card className="lg:col-span-2 shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-base font-serif">Today's Appointment Queue</CardTitle>
            <CardDescription className="text-xs">Active consultation bookings and token tickets.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-xs">
              <div className="grid grid-cols-5 px-6 py-2.5 font-bold text-slate-500 bg-slate-50/60 uppercase tracking-wider">
                <div>Token / Patient</div>
                <div>Consulting Doctor</div>
                <div>Scheduled Time</div>
                <div className="text-center">Status</div>
                <div className="text-right">Actions</div>
              </div>
              {appointments.map((appt) => (
                <div key={appt.token} className="grid grid-cols-5 px-6 py-4 items-center hover:bg-slate-50/20 transition-colors">
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px] border border-indigo-100">
                      {appt.token}
                    </span>
                    <span>{appt.patient}</span>
                  </div>
                  <div className="text-slate-600 font-medium">{appt.doctor}</div>
                  <div className="text-slate-500 font-medium">{appt.time}</div>
                  <div className="text-center font-bold">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase ${
                      appt.status === "Confirmed" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                  <div className="text-right">
                    {appt.status === "Confirmed" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(appt.token, appt.patient)}
                        className="h-7 text-[10px] text-rose-600 hover:text-rose-700 border-rose-200 font-bold"
                      >
                        Cancel
                      </Button>
                    )}
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
