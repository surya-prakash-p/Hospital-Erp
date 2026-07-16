"use client";

import { useState } from "react";
import { Truck, CheckCircle, AlertCircle, Info, Phone, Navigation, Plus, RefreshCw, UserCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const INITIAL_AMBULANCES = [
  { id: "AMB-01", plate: "TN-37-BY-1022", driver: "Arul Murugan", phone: "9876543220", status: "Available", location: "Hospital Bay" },
  { id: "AMB-02", plate: "TN-37-BY-1023", driver: "Ganesh Pillai", phone: "9876543221", status: "On Trip", location: "Gandhipuram Signal" },
  { id: "AMB-03", plate: "TN-37-BY-1024", driver: "Siva Kumar", phone: "9876543222", status: "Available", location: "Hospital Bay" },
];

export default function AmbulancePage() {
  const [fleet, setFleet] = useState(INITIAL_AMBULANCES);
  const [toasts, setToasts] = useState([]);

  // Form states
  const [locationInput, setLocationInput] = useState("");
  const [driverSelect, setDriverSelect] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleDispatch = (e) => {
    e.preventDefault();
    if (!driverSelect || !locationInput || !contactPhone) {
      showToast("All fields are required to dispatch emergency ambulance", "error");
      return;
    }

    // Set designated ambulance status to "On Trip"
    setFleet(prev => 
      prev.map(a => a.id === driverSelect ? { ...a, status: "On Trip", location: locationInput } : a)
    );
    showToast(`Ambulance ${driverSelect} dispatched to ${locationInput}!`, "success");

    setLocationInput("");
    setContactPhone("");
    setDriverSelect("");
  };

  const handleReturn = (ambId) => {
    setFleet(prev => 
      prev.map(a => a.id === ambId ? { ...a, status: "Available", location: "Hospital Bay" } : a)
    );
    showToast(`Ambulance ${ambId} returned to bay. Status set to Available!`, "success");
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
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Ambulance Emergency Dispatch</h2>
        <p className="text-muted-foreground mt-1">Dispatch ER pickup vehicles, monitor GPS locations, and manage fleet drivers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dispatcher Form */}
        <Card className="lg:col-span-1 border-t-4 border-t-indigo-600 shadow-md">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-sm font-serif">Emergency Trip Dispatcher</CardTitle>
            <CardDescription className="text-xs">Dispatch active vehicles to pickup locations.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleDispatch} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="dispatcher-select" className="text-xs font-semibold">Select Available Vehicle *</Label>
                <select
                  id="dispatcher-select"
                  value={driverSelect}
                  onChange={(e) => setDriverSelect(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
                  required
                >
                  <option value="">Select vehicle...</option>
                  {fleet.filter(a => a.status === "Available").map(a => (
                    <option key={a.id} value={a.id}>{a.id} - Driver: {a.driver}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="dispatcher-loc" className="text-xs font-semibold">Pickup Location *</Label>
                <Input
                  id="dispatcher-loc"
                  placeholder="e.g. Hope College Cross, Block 2"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="dispatcher-phone" className="text-xs font-semibold">Emergency Caller Contact *</Label>
                <Input
                  id="dispatcher-phone"
                  placeholder="e.g. 9876543209"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white gap-1.5 h-9 text-xs font-semibold mt-2">
                <Navigation className="w-3.5 h-3.5" /> Dispatch Emergency Vehicle
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Fleet Monitor Grid */}
        <Card className="lg:col-span-2 shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-base font-serif">Active Ambulance Fleet</CardTitle>
            <CardDescription className="text-xs">Monitor current GPS location markers and trip states.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-xs">
              <div className="grid grid-cols-5 px-6 py-2.5 font-bold text-slate-500 bg-slate-50/60 uppercase tracking-wider">
                <div>Vehicle ID / Plate</div>
                <div>Driver & Phone</div>
                <div>Current Location</div>
                <div className="text-center">Status</div>
                <div className="text-right">Actions</div>
              </div>
              {fleet.map((amb) => {
                const isOnTrip = amb.status === "On Trip";
                return (
                  <div key={amb.id} className="grid grid-cols-5 px-6 py-4 items-center hover:bg-slate-50/20 transition-colors">
                    <div className="font-semibold text-slate-800">
                      {amb.id}
                      <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{amb.plate}</span>
                    </div>
                    <div className="text-slate-600 font-medium">
                      {amb.driver}
                      <span className="text-[10px] text-slate-400 block font-normal flex items-center gap-0.5 mt-0.5">
                        <Phone className="w-2.5 h-2.5" /> {amb.phone}
                      </span>
                    </div>
                    <div className="text-slate-600 font-medium">{amb.location}</div>
                    <div className="text-center font-bold">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase ${
                        isOnTrip ? "bg-rose-50 text-rose-700 animate-pulse border border-rose-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                      }`}>
                        {amb.status}
                      </span>
                    </div>
                    <div className="text-right">
                      {isOnTrip && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReturn(amb.id)}
                          className="h-7 text-[10px] text-indigo-600 hover:text-indigo-700 border-indigo-200 font-bold"
                        >
                          Return to Bay
                        </Button>
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
  );
}
