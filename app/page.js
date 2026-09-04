"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users, Calendar, Heart, BedDouble, UserRound, DollarSign, Receipt, AlertCircle, FlaskConical, Clock, ArrowUpRight, ArrowDownRight, RefreshCw, Activity, PlusCircle, CheckCircle, Pill, TrendingUp, Sparkles } from "lucide-react";
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
  const [hoveredDay, setHoveredDay] = useState(null);

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
  const pendingBillsCount = queue.filter(q => q.appointment_status === "Billing").length;
  const labReportsPending = queue.filter(q => q.need_lab_test === 1 && q.lab_test_status !== "Completed").length;

  // Compute metrics dynamically from state
  const todaysAppointments = queue.length;
  const occupiedBeds = 0;
  const totalBeds = 45;
  const bedAvailability = `${totalBeds - occupiedBeds} Available`;
  const todaysRevenue = `₹${(queue.filter(q => q.payment_received === 1).reduce((acc, q) => acc + (q.bill_amount || 0), 0)).toLocaleString()}`;
  const emergencyCases = 0;

  // Dynamic Weekly Patient Flow Calculation
  const weeklyFlow = useMemo(() => {
    const days = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();

    // 7 trailing days ending with today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = dayNames[d.getDay()];
      const isToday = i === 0;

      // Filter queue / walk-ins that match this date
      const dayQueue = (queue || []).filter(item => {
        const itemDate = item.creation ? item.creation.split(" ")[0] : (item.date || "");
        return itemDate === dateStr;
      });

      let opdVal = 0;
      let ipdVal = 0;

      if (isToday) {
        opdVal = (queue || []).filter(q => q.appointment_status !== "IPD Admission").length;
        ipdVal = (queue || []).filter(q => q.appointment_status === "IPD Admission" || q.need_ipd).length;
      } else {
        opdVal = dayQueue.filter(q => q.appointment_status !== "IPD Admission").length;
        ipdVal = dayQueue.filter(q => q.appointment_status === "IPD Admission" || q.need_ipd).length;
      }

      days.push({
        date: dateStr,
        day: dayLabel,
        displayDate: `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`,
        opd: opdVal,
        ipd: ipdVal,
        total: opdVal + ipdVal,
        isToday
      });
    }

    const currentMax = Math.max(...days.map(d => Math.max(d.opd, d.ipd)));
    const maxVal = currentMax > 0 ? currentMax + 5 : 10;
    const totalWeeklyOPD = days.reduce((acc, d) => acc + d.opd, 0);
    const totalWeeklyIPD = days.reduce((acc, d) => acc + d.ipd, 0);
    const totalAll = totalWeeklyOPD + totalWeeklyIPD;
    const peakDay = totalAll > 0 
      ? days.reduce((prev, curr) => (curr.total > prev.total ? curr : prev), days[0])
      : null;

    // Construct SVG coordinates (viewBox 0 0 500 130, padding left/right 35, top 15, bottom 25)
    const svgWidth = 500;
    const svgHeight = 130;
    const plotWidth = svgWidth - 70;
    const plotHeight = svgHeight - 40;

    const points = days.map((d, idx) => {
      const x = 35 + idx * (plotWidth / 6);
      const yOpd = 15 + plotHeight - (d.opd / maxVal) * plotHeight;
      const yIpd = 15 + plotHeight - (d.ipd / maxVal) * plotHeight;
      return { ...d, x, yOpd, yIpd };
    });

    // Helper to generate SVG path string
    const generatePath = (type) => {
      return points.reduce((acc, pt, idx, arr) => {
        const y = type === 'opd' ? pt.yOpd : pt.yIpd;
        if (idx === 0) return `M ${pt.x} ${y}`;
        const prev = arr[idx - 1];
        const prevY = type === 'opd' ? prev.yOpd : prev.yIpd;
        const cp1x = prev.x + (pt.x - prev.x) / 2;
        const cp2x = prev.x + (pt.x - prev.x) / 2;
        return `${acc} C ${cp1x} ${prevY}, ${cp2x} ${y}, ${pt.x} ${y}`;
      }, "");
    };

    const opdPath = generatePath('opd');
    const ipdPath = generatePath('ipd');
    const opdArea = `${opdPath} L ${points[points.length - 1].x} ${svgHeight - 20} L ${points[0].x} ${svgHeight - 20} Z`;
    const ipdArea = `${ipdPath} L ${points[points.length - 1].x} ${svgHeight - 20} L ${points[0].x} ${svgHeight - 20} Z`;

    return {
      days,
      points,
      maxVal,
      totalWeeklyOPD,
      totalWeeklyIPD,
      totalAll,
      peakDay,
      opdPath,
      ipdPath,
      opdArea,
      ipdArea
    };
  }, [queue]);

  const dashboardStats = [
    { title: "Total Patients", value: patientsCount, icon: Users, color: "text-blue-600 bg-blue-50 border-blue-100", trend: "+8% this week", isTrendUp: true, href: "/reception" },
    { title: "Today's Appointments", value: todaysAppointments, icon: Calendar, color: "text-indigo-600 bg-indigo-50 border-indigo-100", trend: "+3 pending", isTrendUp: true, href: "/consultation" },
    { title: "OP Patients (OPD)", value: opCount, icon: Activity, color: "text-emerald-600 bg-emerald-50 border-emerald-100", trend: "Active queue", isTrendUp: true, href: "/consultation" },
    { title: "Doctors Available", value: `${doctorsAvailable}/${doctorsList.length}`, icon: UserRound, color: "text-purple-600 bg-purple-50 border-purple-100", trend: "On-duty logs", isTrendUp: true, href: "/doctors" },
    { title: "Today's Revenue", value: todaysRevenue, icon: DollarSign, color: "text-amber-600 bg-amber-50 border-amber-100", trend: "Settle completed", isTrendUp: true, href: "/billing" },
    { title: "Pending Bills", value: pendingBillsCount, icon: Receipt, color: "text-slate-600 bg-slate-50 border-slate-100", trend: "Needs checkout", isTrendUp: false, href: "/billing" },
    { title: "Lab Reports Pending", value: labReportsPending, icon: FlaskConical, color: "text-violet-600 bg-violet-50 border-violet-100", trend: "Diagnostic panel", isTrendUp: true, href: "/lab" },
  ];

  if (loading && queue.length === 0) {
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
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={stat.title} 
              onClick={() => stat.href && router.push(stat.href)}
              className={`hover:shadow-md transition-all duration-300 border border-slate-200/60 flex flex-col justify-between ${stat.href ? 'cursor-pointer hover:border-indigo-200' : ''}`}
            >
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

      {/* Middle row: Interactive actions and dynamic analytics */}
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

        {/* Dynamic Weekly Patient Flow Chart */}
        <Card className="lg:col-span-2 shadow-xs border-slate-200 flex flex-col justify-between">
          <CardHeader className="bg-slate-50/50 border-b py-3 flex flex-row items-center justify-between flex-wrap gap-2">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-serif">Weekly Patient Flow</CardTitle>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <CardDescription className="text-xs">
                {weeklyFlow.totalAll > 0 ? (
                  <>Real-time 7-day volume: <strong>{weeklyFlow.totalWeeklyOPD}</strong> OPD • <strong>{weeklyFlow.totalWeeklyIPD}</strong> IPD • Peak: <strong>{weeklyFlow.peakDay?.day}</strong> ({weeklyFlow.peakDay?.total} pts)</>
                ) : (
                  <>Real-time 7-day volume: <strong>0</strong> OPD • <strong>0</strong> IPD • Queue is clear</>
                )}
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <div className="flex items-center gap-1.5 text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> 
                <span>OPD ({weeklyFlow.totalWeeklyOPD})</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 shadow-2xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> 
                <span>IPD ({weeklyFlow.totalWeeklyIPD})</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 flex flex-col justify-between min-h-[170px] relative">
            
            {/* Interactive SVG Spline chart */}
            <div className="relative w-full">
              <svg viewBox="0 0 500 130" className="w-full overflow-visible">
                <defs>
                  <linearGradient id="opd-grad-dyn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="ipd-grad-dyn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                <line x1="30" y1="15" x2="475" y2="15" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="30" y1="55" x2="475" y2="55" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="30" y1="95" x2="475" y2="95" stroke="#f1f5f9" strokeDasharray="3 3" />
                <line x1="30" y1="110" x2="475" y2="110" stroke="#e2e8f0" strokeWidth="1" />

                {/* OPD Area and Stroke */}
                <path d={weeklyFlow.opdArea} fill="url(#opd-grad-dyn)" />
                <path d={weeklyFlow.opdPath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />

                {/* IPD Area and Stroke */}
                <path d={weeklyFlow.ipdArea} fill="url(#ipd-grad-dyn)" />
                <path d={weeklyFlow.ipdPath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />

                {/* Interactive Points on Day Coordinates */}
                {weeklyFlow.points.map((pt, idx) => (
                  <g 
                    key={pt.date} 
                    className="cursor-pointer transition-transform group"
                    onMouseEnter={() => setHoveredDay(pt)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {/* Vertical guideline on hover */}
                    {hoveredDay?.date === pt.date && (
                      <line x1={pt.x} y1="10" x2={pt.x} y2="110" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
                    )}

                    {/* OPD Marker */}
                    <circle 
                      cx={pt.x} 
                      cy={pt.yOpd} 
                      r={hoveredDay?.date === pt.date ? "5.5" : "3.5"} 
                      fill="#ffffff" 
                      stroke="#4f46e5" 
                      strokeWidth={hoveredDay?.date === pt.date ? "3" : "2"} 
                      className="transition-all"
                    />

                    {/* IPD Marker */}
                    <circle 
                      cx={pt.x} 
                      cy={pt.yIpd} 
                      r={hoveredDay?.date === pt.date ? "5" : "3"} 
                      fill="#ffffff" 
                      stroke="#10b981" 
                      strokeWidth={hoveredDay?.date === pt.date ? "3" : "2"} 
                      className="transition-all"
                    />

                    {/* Day X-Axis Label */}
                    <text 
                      x={pt.x} 
                      y="124" 
                      textAnchor="middle" 
                      fill={pt.isToday ? "#4f46e5" : "#64748b"} 
                      fontSize="9" 
                      fontWeight={pt.isToday ? "800" : "600"}
                    >
                      {pt.isToday ? "Today" : pt.day}
                    </text>
                  </g>
                ))}
              </svg>

              {/* Hover Floating Tooltip */}
              {hoveredDay && (
                <div 
                  className="absolute z-20 top-0 bg-slate-900/90 backdrop-blur-xs text-white px-3 py-1.5 rounded-xl text-[11px] shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-2 border border-slate-700 animate-in fade-in duration-100"
                  style={{ left: `${(hoveredDay.x / 500) * 100}%` }}
                >
                  <div className="font-bold text-slate-200 border-b border-slate-700/80 pb-0.5 mb-1 flex items-center gap-1.5">
                    <span>{hoveredDay.day}, {hoveredDay.displayDate}</span>
                    {hoveredDay.isToday && <span className="text-[9px] bg-blue-600 px-1 rounded text-white font-bold">TODAY</span>}
                  </div>
                  <div className="flex items-center gap-3 font-semibold">
                    <span className="text-indigo-300">OPD: <strong className="text-white">{hoveredDay.opd}</strong></span>
                    <span className="text-emerald-300">IPD: <strong className="text-white">{hoveredDay.ipd}</strong></span>
                    <span className="text-slate-300">Total: <strong className="text-white">{hoveredDay.total}</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom footnote */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 mt-1 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Hover over any day node to view exact patient volumes</span>
              </span>
              <span className="font-semibold text-slate-700">
                Today: <strong className="text-indigo-600">{weeklyFlow.days[weeklyFlow.days.length - 1]?.opd} OPD</strong> • <strong className="text-emerald-600">{weeklyFlow.days[weeklyFlow.days.length - 1]?.ipd} IPD</strong>
              </span>
            </div>

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
