"use client";

import { useState, useEffect } from "react";
import { CompactStats } from "@/components/compact-stats";
import { Clock, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQueue, getPatients, getDoctors, getMedicines } from "@/lib/hospital-service";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [patientsCount, setPatientsCount] = useState(0);
  const [doctorsList, setDoctorsList] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const q = await getQueue();
      setQueue(q || []);
      const pts = await getPatients();
      setPatientsCount(Object.keys(pts || {}).length);
      const docs = await getDoctors();
      setDoctorsList(docs || []);
      const meds = await getMedicines();
      setMedicinesList(meds || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
    // Live polling for dashboard data every 10s
    const timer = setInterval(() => {
      loadDashboardData();
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Compute metrics dynamically from state
  const opCount = queue.filter(q => q.appointment_status === "Doctor Consultation").length;
  const ipCount = queue.filter(q => q.appointment_status === "IPD Admission" || q.appointment_status === "Pharmacy").length;
  const doctorsAvailable = doctorsList.filter(d => d.status === "Available" || !d.status).length;
  const labReportsPending = queue.filter(q => q.need_lab_test === 1 && q.lab_test_status !== "Completed").length;

  // Compute metrics dynamically from state
  const todaysAppointments = queue.length;
  const occupiedBeds = 0;
  const totalBeds = 45;
  const bedAvailability = `${totalBeds - occupiedBeds} Available`;
  const emergencyCases = 0;

  const dashboardStats = [
    { title: "Total Patients", value: patientsCount, href: "/reception" },
    { title: "Today's Appointments", value: todaysAppointments, href: "/consultation" },
    { title: "OP Patients (OPD)", value: opCount, href: "/consultation" },
    { title: "Doctors Available", value: `${doctorsAvailable}/${doctorsList.length}`, href: "/doctors" },
    { title: "Lab Reports Pending", value: labReportsPending, href: "/lab" },
  ];

  if (loading && queue.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        {/* Skeleton Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,10rem)] gap-2">
          {dashboardStats.map((_, i) => (
            <div key={i} className="h-24 bg-slate-200/80 rounded-xl" />
          ))}
        </div>
        {/* Queue placeholder */}
        <div className="h-64 bg-slate-200/60 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <CompactStats stats={dashboardStats} />

      {/* Bottom Row: Active Queue Tracker */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b py-3">
          <CardTitle className="text-base font-serif">Active Patient Registry Queue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y text-xs">
            <div className="grid grid-cols-5 px-6 py-2.5 font-bold text-slate-500 uppercase bg-slate-50/60 tracking-wider">
              <div>Patient</div>
              <div>Assigned Doctor</div>
              <div className="text-center">Active Department</div>
              <div className="text-center">Lab test</div>
              <div className="text-right">Action State</div>
            </div>
            {queue.map((item, index) => {
              const activeStatus = item.appointment_status;
              const hasLab = item.need_lab_test === 1;
              return (
                <div key={`${item.name}-${index}`} className="grid grid-cols-5 px-6 py-3 items-center hover:bg-slate-50/40 transition-colors">
                  <div className="font-semibold text-slate-800">{item.patient_name} <span className="text-[10px] text-slate-400 block font-normal">{item.mobile_number}</span></div>
                  <div className="text-slate-600 font-medium">{item.doctor}</div>
                  <div className="text-center font-medium">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${
                      activeStatus === "Doctor Consultation" ? "bg-indigo-50 text-indigo-700" :
                      activeStatus === "Pharmacy" ? "bg-pink-50 text-pink-700" :
                      activeStatus === "Billing" ? "bg-teal-50 text-teal-700" : "bg-slate-100 text-slate-700"
                    }`}>
                      {activeStatus}
                    </span>
                  </div>
                  <div className="text-center font-semibold">
                    {hasLab ? (
                      <span className={`px-1.5 py-0.5 rounded text-[10px] border ${
                        item.lab_test_status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-purple-50 text-purple-700 border-purple-100 animate-pulse"
                      }`}>
                        {item.lab_test_status === "Completed" ? "Report Ready" : "Testing"}
                      </span>
                    ) : "No order"}
                  </div>
                  <div className="text-right font-medium text-slate-500">
                    {activeStatus === "Completed" ? (
                      <span className="text-emerald-600 flex items-center justify-end gap-1 font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Settled
                      </span>
                    ) : (
                      <span className="text-amber-600 flex items-center justify-end gap-1 font-bold">
                        <Clock className="w-3.5 h-3.5 animate-spin duration-1000" /> Routing
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {queue.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                No active visits logged in queue today.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
