"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserRound, Receipt, Clock, PlusCircle, CheckCircle, Pill } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getQueue, getPatients, getDoctors, getMedicines } from "@/lib/hospital-service";

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState([]);
  const [patientsCount, setPatientsCount] = useState(0);
  const [doctorsList, setDoctorsList] = useState([]);
  const [medicinesList, setMedicinesList] = useState([]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const q = await getQueue();
      setQueue(q);
      const pts = await getPatients();
      setPatientsCount(Object.keys(pts).length);
      const docs = await getDoctors();
      setDoctorsList(docs);
      const meds = await getMedicines();
      setMedicinesList(meds);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute metrics dynamically from state
  const opCount = queue.filter(q => q.appointment_status === "Doctor Consultation").length;
  const ipCount = queue.filter(q => q.appointment_status === "IPD Admission" || q.appointment_status === "Pharmacy").length;
  const doctorsAvailable = doctorsList.filter(d => d.status === "Available" || !d.status).length;
  const pendingBillsCount = queue.filter(q => q.appointment_status === "Billing").length;
  const labReportsPending = queue.filter(q => q.need_lab_test === 1 && q.lab_test_status !== "Completed").length;

  // Compute metrics dynamically from state
  const todaysAppointments = queue.length;
  const occupiedBeds = 0;
  const totalBeds = 45;
  const bedAvailability = `${totalBeds - occupiedBeds} Available`;
  const todaysRevenue = `₹${(queue.filter(q => q.payment_received === 1).reduce((acc, q) => acc + (q.bill_amount || 0), 0)).toLocaleString()}`;
  const emergencyCases = 0;

  const dashboardStats = [
    { title: "Total Patients", value: patientsCount, href: "/reception" },
    { title: "Today's Appointments", value: todaysAppointments, href: "/consultation" },
    { title: "OP Patients (OPD)", value: opCount, href: "/consultation" },
    { title: "Doctors Available", value: `${doctorsAvailable}/${doctorsList.length}`, href: "/doctors" },
    { title: "Today's Revenue", value: todaysRevenue, href: "/billing" },
    { title: "Pending Bills", value: pendingBillsCount, href: "/billing" },
    { title: "Lab Reports Pending", value: labReportsPending, href: "/lab" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        {/* Skeleton Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          {dashboardStats.map((_, i) => (
            <div key={i} className="h-24 bg-slate-200/80 rounded-xl" />
          ))}
        </div>
        {/* Skeleton Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200/60 rounded-xl" />
          <div className="h-64 bg-slate-200/60 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {dashboardStats.map((stat) => (
          <Link
            key={stat.title}
            href={stat.href}
            className="flex min-w-0 flex-col justify-between gap-2 rounded-lg border border-slate-200 bg-white p-3 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
          >
            <span className="text-xs font-medium leading-4 text-slate-500">{stat.title}</span>
            <span className="break-words text-2xl font-semibold leading-7 tracking-tight text-slate-900 tabular-nums">{stat.value}</span>
          </Link>
        ))}
      </div>

      {/* Middle row: Interactive actions and simulated analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actions panel */}
        <Card className="lg:col-span-1 shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b py-3">
            <CardTitle className="text-base font-serif">Quick Actions Hub</CardTitle>
            <CardDescription className="text-xs">Access primary clinic modules immediately.</CardDescription>
          </CardHeader>
          <CardContent className="p-5 space-y-2">
            <Button onClick={() => router.push('/patient-registry')} className="w-full justify-start gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs font-semibold">
              <PlusCircle className="w-4 h-4" /> Register Patient Walk-In
            </Button>
            <Button onClick={() => router.push('/doctors')} variant="outline" className="w-full justify-start gap-2 h-9 text-xs border-slate-200">
              <UserRound className="w-4 h-4 text-indigo-500" /> Manage Doctors Registry
            </Button>
            <Button onClick={() => router.push('/pharmacy')} variant="outline" className="w-full justify-start gap-2 h-9 text-xs border-slate-200">
              <Pill className="w-4 h-4 text-pink-500" /> Pharmacy & Stock Levels
            </Button>
            <Button onClick={() => router.push('/billing')} variant="outline" className="w-full justify-start gap-2 h-9 text-xs border-slate-200">
              <Receipt className="w-4 h-4 text-teal-500" /> Invoices & Checkout Desk
            </Button>
          </CardContent>
        </Card>

        {/* Analytics simulated SVG charts */}
        <Card className="lg:col-span-2 shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b py-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-serif">Weekly Patient Flow</CardTitle>
              <CardDescription className="text-xs">Simulated load comparison between Outpatients & Inpatients.</CardDescription>
            </div>
            <div className="flex gap-4 text-[10px] font-bold uppercase select-none">
              <div className="flex items-center gap-1 text-indigo-600">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> OPD
              </div>
              <div className="flex items-center gap-1 text-emerald-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> IPD
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 flex items-center justify-center min-h-[160px]">
            {/* Beautiful SVG Wave chart */}
            <svg viewBox="0 0 500 120" className="w-full overflow-visible">
              <defs>
                <linearGradient id="opd-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="ipd-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* OPD Curve */}
              <path d="M 0 100 Q 80 40 160 80 T 320 30 T 500 60 L 500 120 L 0 120 Z" fill="url(#opd-grad)" />
              <path d="M 0 100 Q 80 40 160 80 T 320 30 T 500 60" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
              {/* IPD Curve */}
              <path d="M 0 110 Q 80 90 160 105 T 320 85 T 500 95 L 500 120 L 0 120 Z" fill="url(#ipd-grad)" />
              <path d="M 0 110 Q 80 90 160 105 T 320 85 T 500 95" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
              {/* Labels */}
              <text x="10" y="115" fill="#94a3b8" fontSize="8" fontWeight="bold">Mon</text>
              <text x="130" y="115" fill="#94a3b8" fontSize="8" fontWeight="bold">Wed</text>
              <text x="290" y="115" fill="#94a3b8" fontSize="8" fontWeight="bold">Fri</text>
              <text x="450" y="115" fill="#94a3b8" fontSize="8" fontWeight="bold">Sun</text>
            </svg>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Active Queue Tracker */}
      <Card className="shadow-xs border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b py-3">
          <CardTitle className="text-base font-serif">Active Patient Registry Queue</CardTitle>
          <CardDescription className="text-xs">Real-time routing logs of today's hospital visits.</CardDescription>
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
