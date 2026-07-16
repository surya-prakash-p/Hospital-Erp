"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Users, Calendar, Heart, BedDouble, UserRound, DollarSign, Receipt, AlertCircle, FlaskConical, Clock, ArrowUpRight, ArrowDownRight, RefreshCw, Activity, PlusCircle, CheckCircle, Pill } from "lucide-react";
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

  // Mock static counts for non-db modules for high fidelity
  const todaysAppointments = queue.length + 3;
  const occupiedBeds = 14;
  const totalBeds = 45;
  const bedAvailability = `${totalBeds - occupiedBeds} Available`;
  const todaysRevenue = `₹${(queue.filter(q => q.payment_received === 1).reduce((acc, q) => acc + (q.bill_amount || 0), 0) + 3400).toLocaleString()}`;
  const emergencyCases = 2;

  const dashboardStats = [
    { title: "Total Patients", value: patientsCount, icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100", trend: "+8% this week", isTrendUp: true },
    { title: "Today's Appointments", value: todaysAppointments, icon: Calendar, color: "text-indigo-600 bg-indigo-50 border-indigo-100", trend: "+3 pending", isTrendUp: true },
    { title: "OP Patients (OPD)", value: opCount, icon: Activity, color: "text-emerald-600 bg-emerald-50 border-emerald-100", trend: "Active queue", isTrendUp: true },
    { title: "IP Patients (IPD)", value: ipCount, icon: Heart, color: "text-pink-600 bg-pink-50 border-pink-100", trend: "Ward admitted", isTrendUp: true },
    { title: "Doctors Available", value: `${doctorsAvailable}/${doctorsList.length}`, icon: UserRound, color: "text-purple-600 bg-purple-50 border-purple-100", trend: "On-duty logs", isTrendUp: true },
    { title: "Bed Availability", value: bedAvailability, icon: BedDouble, color: "text-teal-600 bg-teal-50 border-teal-100", trend: "14 Occupied", isTrendUp: false },
    { title: "Today's Revenue", value: todaysRevenue, icon: DollarSign, color: "text-amber-600 bg-amber-50 border-amber-100", trend: "Settle completed", isTrendUp: true },
    { title: "Pending Bills", value: pendingBillsCount, icon: Receipt, color: "text-slate-600 bg-slate-50 border-slate-100", trend: "Needs checkout", isTrendUp: false },
    { title: "Emergency Cases", value: emergencyCases, icon: AlertCircle, color: "text-rose-600 bg-rose-50 border-rose-100", trend: "Active in ER", isTrendUp: false },
    { title: "Lab Reports Pending", value: labReportsPending, icon: FlaskConical, color: "text-violet-600 bg-violet-50 border-violet-100", trend: "Diagnostic panel", isTrendUp: true },
  ];

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
        {/* Skeleton Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Hospital Overview Dashboard</h2>
          <p className="text-muted-foreground mt-1">Real-time clinical metrics, queue loads, and billing logs</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadDashboardData} className="gap-1 border-slate-200">
          <RefreshCw className="w-3.5 h-3.5" /> Sync Data
        </Button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="hover:shadow-md transition-all duration-300 border border-slate-200/60 flex flex-col justify-between">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{stat.title}</span>
                <div className={`p-1.5 rounded-lg border ${stat.color} shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-xl font-bold text-slate-800 tracking-tight font-serif mt-1">{stat.value}</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold mt-1">
                  {stat.isTrendUp ? <ArrowUpRight className="w-3 h-3 text-emerald-500" /> : <ArrowDownRight className="w-3 h-3 text-slate-400" />}
                  <span>{stat.trend}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
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
            <Button onClick={() => router.push('/reception')} className="w-full justify-start gap-2 bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs font-semibold">
              <PlusCircle className="w-4 h-4" /> Register Patient Walk-In
            </Button>
            <Button onClick={() => router.push('/doctors')} variant="outline" className="w-full justify-start gap-2 h-9 text-xs border-slate-200">
              <UserRound className="w-4 h-4 text-indigo-500" /> Manage Doctors Catalog
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
            {queue.map((item) => {
              const activeStatus = item.appointment_status;
              const hasLab = item.need_lab_test === 1;
              return (
                <div key={item.name} className="grid grid-cols-5 px-6 py-3 items-center hover:bg-slate-50/40 transition-colors">
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
