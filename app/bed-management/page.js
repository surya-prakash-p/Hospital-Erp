"use client";

import { useState, useEffect } from "react";
import { BedDouble, CheckCircle, AlertCircle, Info, RefreshCw, PlusCircle, ArrowRightLeft, LogOut, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getQueue } from "@/lib/hospital-service";

// Pre-seeded mock beds array
const INITIAL_BEDS_DATA = [
  { id: "ICU-01", ward: "ICU", room: "101", status: "Occupied", patient: "Surya Prakash", admittedDate: "2026-07-15" },
  { id: "ICU-02", ward: "ICU", room: "101", status: "Available", patient: null, admittedDate: null },
  { id: "ICU-03", ward: "ICU", room: "102", status: "Cleaning", patient: null, admittedDate: null },
  { id: "ICU-04", ward: "ICU", room: "102", status: "Available", patient: null, admittedDate: null },
  
  { id: "GEN-01", ward: "General Male", room: "201", status: "Occupied", patient: "Rajesh Kumar", admittedDate: "2026-07-16" },
  { id: "GEN-02", ward: "General Male", room: "201", status: "Available", patient: null, admittedDate: null },
  { id: "GEN-03", ward: "General Male", room: "202", status: "Occupied", patient: "Muthu Vel", admittedDate: "2026-07-14" },
  { id: "GEN-04", ward: "General Male", room: "202", status: "Available", patient: null, admittedDate: null },
  
  { id: "GEN-05", ward: "General Female", room: "203", status: "Occupied", patient: "Priya Sundar", admittedDate: "2026-07-16" },
  { id: "GEN-06", ward: "General Female", room: "203", status: "Available", patient: null, admittedDate: null },
  
  { id: "PVT-301", ward: "Private Rooms", room: "301", status: "Occupied", patient: "Vikram Shah", admittedDate: "2026-07-13" },
  { id: "PVT-302", ward: "Private Rooms", room: "302", status: "Available", patient: null, admittedDate: null },
  { id: "PVT-303", ward: "Private Rooms", room: "303", status: "Cleaning", patient: null, admittedDate: null },
];

export default function BedManagementPage() {
  const [beds, setBeds] = useState(INITIAL_BEDS_DATA);
  const [activeWard, setActiveWard] = useState("All");
  const [queue, setQueue] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Forms state
  const [selectedBedId, setSelectedBedId] = useState("");
  const [assignPatient, setAssignPatient] = useState("");
  const [transferFromBed, setTransferFromBed] = useState("");
  const [transferToBed, setTransferToBed] = useState("");

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
      const q = await getQueue();
      setQueue(q);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Handle assigning bed
  const handleAssignBed = (e) => {
    e.preventDefault();
    if (!selectedBedId || !assignPatient) {
      showToast("Please select a bed and patient", "error");
      return;
    }

    setBeds(prev => 
      prev.map(b => b.id === selectedBedId ? {
        ...b,
        status: "Occupied",
        patient: assignPatient,
        admittedDate: new Date().toISOString().split("T")[0]
      } : b)
    );
    showToast(`Bed ${selectedBedId} assigned to ${assignPatient}!`, "success");
    setSelectedBedId("");
    setAssignPatient("");
  };

  // Handle Bed Transfer
  const handleTransferBed = (e) => {
    e.preventDefault();
    if (!transferFromBed || !transferToBed) {
      showToast("Please select both source and destination beds", "error");
      return;
    }

    const sourceBed = beds.find(b => b.id === transferFromBed);
    const destBed = beds.find(b => b.id === transferToBed);

    if (!sourceBed || sourceBed.status !== "Occupied") {
      showToast("Source bed must be occupied", "error");
      return;
    }
    if (!destBed || destBed.status !== "Available") {
      showToast("Destination bed must be available", "error");
      return;
    }

    setBeds(prev => 
      prev.map(b => {
        if (b.id === transferFromBed) {
          return { ...b, status: "Available", patient: null, admittedDate: null };
        }
        if (b.id === transferToBed) {
          return { ...b, status: "Occupied", patient: sourceBed.patient, admittedDate: sourceBed.admittedDate };
        }
        return b;
      })
    );
    showToast(`Transferred patient from ${transferFromBed} to ${transferToBed}!`, "success");
    setTransferFromBed("");
    setTransferToBed("");
  };

  // Release Bed
  const handleReleaseBed = (bedId) => {
    setBeds(prev => 
      prev.map(b => b.id === bedId ? { ...b, status: "Available", patient: null, admittedDate: null } : b)
    );
    showToast(`Released Bed ${bedId}!`, "success");
  };

  // Filter beds
  const filteredBeds = activeWard === "All" ? beds : beds.filter(b => b.ward === activeWard);

  // Compute metrics
  const totalCount = beds.length;
  const occupiedCount = beds.filter(b => b.status === "Occupied").length;
  const availableCount = beds.filter(b => b.status === "Available").length;
  const cleaningCount = beds.filter(b => b.status === "Cleaning").length;

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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Bed & Room Management</h2>
          <p className="text-muted-foreground mt-1">Track ward lists, allocate beds, and handle patient transfers</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-1 border-slate-200">
          <RefreshCw className="w-3.5 h-3.5" /> Sync Wards
        </Button>
      </div>

      {/* Bed Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Bed Capacity</p>
              <h4 className="text-2xl font-bold text-slate-800 mt-1 font-serif">{totalCount} Wards</h4>
            </div>
            <div className="p-2 bg-slate-100 border rounded-lg text-slate-500">
              <BedDouble className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Occupied Beds</p>
              <h4 className="text-2xl font-bold text-rose-600 mt-1 font-serif">{occupiedCount} Beds</h4>
            </div>
            <div className="p-2 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Available Beds</p>
              <h4 className="text-2xl font-bold text-emerald-600 mt-1 font-serif">{availableCount} Beds</h4>
            </div>
            <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Under Cleaning</p>
              <h4 className="text-2xl font-bold text-amber-600 mt-1 font-serif">{cleaningCount} Rooms</h4>
            </div>
            <div className="p-2 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg">
              <RefreshCw className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Actions */}
        <div className="lg:col-span-1 space-y-6">
          {/* Bed Allocation Form */}
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b py-3">
              <CardTitle className="text-sm font-serif">Bed Allocation Form</CardTitle>
              <CardDescription className="text-xs">Assign an available bed to an inpatient visit.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleAssignBed} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="select-bed" className="text-xs font-semibold text-slate-700">Select Available Bed *</Label>
                  <select
                    id="select-bed"
                    value={selectedBedId}
                    onChange={(e) => setSelectedBedId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                    required
                  >
                    <option value="">Choose Bed...</option>
                    {beds.filter(b => b.status === "Available").map(b => (
                      <option key={b.id} value={b.id}>{b.id} - Ward: {b.ward} (Rm {b.room})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="assign-patient" className="text-xs font-semibold text-slate-700">Select Inpatient *</Label>
                  <select
                    id="assign-patient"
                    value={assignPatient}
                    onChange={(e) => setAssignPatient(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                    required
                  >
                    <option value="">Select Inpatient...</option>
                    {queue.map(q => (
                      <option key={q.name} value={q.patient_name}>{q.patient_name} ({q.mobile_number})</option>
                    ))}
                    <option value="Sample Patient">Sample Patient Demo</option>
                  </select>
                </div>
                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-1 h-9 text-xs font-semibold mt-2">
                  <PlusCircle className="w-3.5 h-3.5" /> Allocate Bed
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Bed Transfer Form */}
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="bg-slate-50/50 border-b py-3">
              <CardTitle className="text-sm font-serif">Bed Transfer / Relocate</CardTitle>
              <CardDescription className="text-xs">Transfer an occupied patient to another ward/bed.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleTransferBed} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="transfer-from" className="text-xs font-semibold text-slate-700">From Occupied Bed *</Label>
                  <select
                    id="transfer-from"
                    value={transferFromBed}
                    onChange={(e) => setTransferFromBed(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                    required
                  >
                    <option value="">Choose Occupied Bed...</option>
                    {beds.filter(b => b.status === "Occupied").map(b => (
                      <option key={b.id} value={b.id}>{b.id} - Patient: {b.patient}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="transfer-to" className="text-xs font-semibold text-slate-700">To Available Bed *</Label>
                  <select
                    id="transfer-to"
                    value={transferToBed}
                    onChange={(e) => setTransferToBed(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                    required
                  >
                    <option value="">Choose Destination Bed...</option>
                    {beds.filter(b => b.status === "Available").map(b => (
                      <option key={b.id} value={b.id}>{b.id} - Ward: {b.ward} (Rm {b.room})</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-1.5 h-9 text-xs font-semibold mt-2">
                  <ArrowRightLeft className="w-3.5 h-3.5" /> Execute Bed Transfer
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Interactive Ward Grids */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-xs border-slate-200 flex flex-col h-[520px]">
            <CardHeader className="bg-slate-50/50 border-b py-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-serif">Bed Layout Map</CardTitle>
                <CardDescription className="text-xs">Click ward tabs to filter ward configurations.</CardDescription>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 border rounded-lg text-[10px] font-bold">
                {["All", "ICU", "General Male", "General Female", "Private Rooms"].map((ward) => (
                  <button
                    key={ward}
                    onClick={() => setActiveWard(ward)}
                    className={`px-2 py-1 rounded transition-colors ${
                      activeWard === ward ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {ward === "All" ? "All" : ward.split(" ")[0]}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="p-6 overflow-y-auto flex-1 bg-slate-50/20">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredBeds.map((bed) => {
                  const isOccupied = bed.status === "Occupied";
                  const isCleaning = bed.status === "Cleaning";
                  return (
                    <div
                      key={bed.id}
                      className={`border rounded-xl p-4 flex flex-col justify-between shadow-xs min-h-[120px] transition-all bg-white relative
                        ${isOccupied ? "border-rose-100 hover:border-rose-300" : ""}
                        ${isCleaning ? "border-amber-100 hover:border-amber-300" : ""}
                        ${bed.status === "Available" ? "border-emerald-100 hover:border-emerald-300" : ""}`}
                    >
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800 font-sans text-xs">{bed.id}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase
                            ${isOccupied ? "bg-rose-50 text-rose-700" : ""}
                            ${isCleaning ? "bg-amber-50 text-amber-700 animate-pulse" : ""}
                            ${bed.status === "Available" ? "bg-emerald-50 text-emerald-700" : ""}`}
                          >
                            {bed.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">Room {bed.room} | {bed.ward}</p>
                      </div>

                      <div className="border-t pt-2 mt-3 text-xs">
                        {isOccupied ? (
                          <div>
                            <p className="font-semibold text-slate-700 truncate">{bed.patient}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">Admitted: {bed.admittedDate}</p>
                            {/* Release action button */}
                            <button
                              type="button"
                              onClick={() => handleReleaseBed(bed.id)}
                              className="text-[9px] font-bold text-rose-600 hover:text-rose-800 hover:underline mt-2 flex items-center gap-0.5"
                            >
                              <LogOut className="w-2.5 h-2.5" /> Release Bed
                            </button>
                          </div>
                        ) : isCleaning ? (
                          <p className="text-[10px] text-slate-400 italic">Sanitizing Room...</p>
                        ) : (
                          <p className="text-[10px] text-emerald-600 font-medium">Ready for allocation</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
