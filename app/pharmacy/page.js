"use client";

import { useState, useEffect } from "react";
import { Pill, CheckCircle, AlertCircle, Info, Activity, PackageCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getQueue, updateWalkIn } from "@/lib/hospital-service";

export default function PharmacyPage() {
  const [queue, setQueue] = useState([]);
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Load queue data
  useEffect(() => {
    async function loadData() {
      try {
        const q = await getQueue();
        setQueue(q);
      } catch (err) {
        showToast("Error loading pharmacy queue", "error");
        console.error(err);
      }
    }
    loadData();
  }, []);

  const handleSelectWalkIn = (item) => {
    setSelectedWalkIn(item);
  };

  const handleDispense = async (e) => {
    e?.preventDefault();
    if (!selectedWalkIn) {
      showToast("Please select a patient from the queue", "error");
      return;
    }

    try {
      showToast("Preparing and dispensing medication...", "info");

      await updateWalkIn(selectedWalkIn.name, {
        pharmacy_status: "Completed",
        appointment_status: "Billing"
      });

      showToast(`Medications package checked off & dispensed! Routed to Billing`, "success");

      // Reload queue and clear select state
      const updatedQueue = await getQueue();
      setQueue(updatedQueue);
      setSelectedWalkIn(null);
    } catch (err) {
      showToast(err.message || "Failed to dispense medicines", "error");
      console.error(err);
    }
  };

  const pendingPharmacy = queue.filter((q) => q.appointment_status === "Pharmacy");

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Toast notifications container */}
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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Pharmacy</h2>
          <p className="text-muted-foreground mt-1">Dispense prescribed medications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="flex flex-col h-[500px]">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Prescriptions to Dispense</span>
                <span className="bg-pink-100 text-pink-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {pendingPharmacy.length} Pending
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              <div className="divide-y">
                {pendingPharmacy.map((item) => {
                  const isActive = selectedWalkIn && selectedWalkIn.name === item.name;
                  return (
                    <div
                      key={item.name}
                      onClick={() => handleSelectWalkIn(item)}
                      className={`p-4 border-b hover:bg-slate-50 cursor-pointer transition-colors border-l-4 
                        ${isActive ? "border-l-pink-600 bg-pink-50/30" : "border-l-transparent bg-white"}`}
                    >
                      <div>
                        <h4 className="font-semibold text-slate-950 text-sm">{item.patient_name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.mobile_number} | Assigned: {item.doctor}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {pendingPharmacy.length === 0 && (
                  <div className="text-center text-muted-foreground py-20 text-sm">
                    No pending prescriptions.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prescription review and dispensation panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Pill className="w-5 h-5 text-pink-500" />
                Medication Dispensation Form
              </CardTitle>
              <CardDescription>Review doctor prescriptions and check off packaged medications.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {selectedWalkIn ? (
                <div className="space-y-4">
                  {/* Selected Patient Banner */}
                  <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">Patient: </span>
                      {selectedWalkIn.patient_name} ({selectedWalkIn.mobile_number})
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">ID: </span>
                      {selectedWalkIn.name}
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                    <Label className="text-xs font-semibold text-slate-500">Doctor Diagnosis Notes</Label>
                    <p className="text-sm font-medium text-slate-800">{selectedWalkIn.diagnosis || "General Consultation Checkup"}</p>
                  </div>

                  {/* Prescription */}
                  <div className="space-y-2">
                    <Label className="font-semibold text-pink-700">Prescribed Medications</Label>
                    <pre className="p-4 bg-pink-50/20 border border-pink-100 rounded text-sm text-slate-800 font-mono whitespace-pre-wrap min-h-[100px]">
                      {selectedWalkIn.prescription || "No detailed medications typed. Standard OTC packages may apply."}
                    </pre>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-md p-3 text-xs text-emerald-800 flex gap-2">
                    <Info className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <span className="font-semibold">Pharmacist Check:</span> Verify dosage guidelines with the patient before clicking dispense. The patient will be routed to the checkout counter.
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <Button
                      onClick={handleDispense}
                      className="bg-pink-600 hover:bg-pink-700 text-white gap-1.5 h-9 text-sm"
                    >
                      <PackageCheck className="w-4 h-4" />
                      Dispense & Send to Checkout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-20">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-pink-300 animate-pulse" />
                  Please select a pending prescription from the queue to dispense.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
