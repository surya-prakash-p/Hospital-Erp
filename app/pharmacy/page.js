"use client";

import { useState, useEffect } from "react";
import { Pill, CheckCircle, AlertCircle, Info, Activity, PackageCheck, Plus, Layers, PlusCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getQueue, updateWalkIn, getMedicines, createMedicine, updateMedicineStock } from "@/lib/hospital-service";

export default function PharmacyPage() {
  const [queue, setQueue] = useState([]);
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [activeTab, setActiveTab] = useState("queue"); // "queue" or "inventory"
  const [toasts, setToasts] = useState([]);

  // New medicine form state
  const [medName, setMedName] = useState("");
  const [medStock, setMedStock] = useState("");
  const [medPrice, setMedPrice] = useState("");
  const [isSubmittingMed, setIsSubmittingMed] = useState(false);

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Load all queue and medicine data
  async function loadAllData() {
    try {
      const q = await getQueue();
      setQueue(q);
      const meds = await getMedicines();
      setMedicines(meds);
    } catch (err) {
      showToast("Error loading data from server", "error");
      console.error(err);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSelectWalkIn = (item) => {
    setSelectedWalkIn(item);
  };

  // Dispense medications & decrement matching stocks
  const handleDispense = async (e) => {
    e?.preventDefault();
    if (!selectedWalkIn) {
      showToast("Please select a patient from the queue", "error");
      return;
    }

    try {
      showToast("Preparing and dispensing medication...", "info");

      // Update visit status in Frappe
      await updateWalkIn(selectedWalkIn.name, {
        pharmacy_status: "Completed",
        appointment_status: "Billing"
      });

      // Deduct stock for matching medicines found in the prescription
      const prescriptionText = (selectedWalkIn.prescription || "").toLowerCase();
      let deductedCount = 0;

      for (const med of medicines) {
        if (prescriptionText.includes(med.medicine_name.toLowerCase())) {
          try {
            // Deduct a standard course of 10 tablets
            await updateMedicineStock(med.medicine_name, -10);
            deductedCount++;
          } catch (stockErr) {
            console.error(`Failed to deduct stock for ${med.medicine_name}:`, stockErr);
          }
        }
      }

      if (deductedCount > 0) {
        showToast(`Dispensed! Decremented stock for ${deductedCount} matching medicines.`, "success");
      } else {
        showToast("Medications dispensed! Routed to Billing.", "success");
      }

      // Reload queue and clear select state
      await loadAllData();
      setSelectedWalkIn(null);
    } catch (err) {
      showToast(err.message || "Failed to dispense medicines", "error");
      console.error(err);
    }
  };

  // Add new medicine to inventory
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!medName.trim() || !medStock || !medPrice) {
      showToast("All fields are required", "error");
      return;
    }

    setIsSubmittingMed(true);
    try {
      await createMedicine({
        medicine_name: medName.trim(),
        stock: parseInt(medStock),
        price: parseFloat(medPrice)
      });
      showToast(`${medName} added to pharmacy inventory!`, "success");
      setMedName("");
      setMedStock("");
      setMedPrice("");
      await loadAllData();
    } catch (err) {
      showToast(err.message || "Failed to add medicine", "error");
    } finally {
      setIsSubmittingMed(false);
    }
  };

  // Restock an existing medicine quickly
  const handleQuickRestock = async (medName) => {
    try {
      showToast(`Restocking ${medName}...`, "info");
      await updateMedicineStock(medName, 50); // Add 50 qty
      showToast(`Restocked 50 units of ${medName}!`, "success");
      await loadAllData();
    } catch (err) {
      showToast(err.message || "Failed to restock", "error");
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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Pharmacy Portal</h2>
          <p className="text-muted-foreground mt-1">Dispense medication and track stock levels</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-sm font-medium">
          <button
            onClick={() => setActiveTab("queue")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "queue" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Prescriptions ({pendingPharmacy.length})
          </button>
          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "inventory" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
            }`}
          >
            Inventory Management
          </button>
        </div>
      </div>

      {activeTab === "queue" ? (
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

                    {/* Stock Alert Warning */}
                    <div className="space-y-1 bg-amber-50 border border-amber-100 rounded-md p-3 text-xs text-amber-800 flex gap-2">
                      <Info className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <span className="font-semibold">Stock Verification:</span> Fulfilling this prescription will automatically deduct **10 units** of stock for any matching medicines from the inventory.
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inventory Form (Left) */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-indigo-500" />
                  Add New Medicine
                </CardTitle>
                <CardDescription>Enter new pharmaceutical items into the active inventory.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleAddMedicine} className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="med_name" className="text-xs font-semibold">Medicine Name *</Label>
                    <Input
                      id="med_name"
                      placeholder="e.g. Paracetamol 650mg"
                      value={medName}
                      onChange={(e) => setMedName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="med_stock" className="text-xs font-semibold">Initial Stock *</Label>
                      <Input
                        id="med_stock"
                        type="number"
                        placeholder="e.g. 100"
                        value={medStock}
                        onChange={(e) => setMedStock(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="med_price" className="text-xs font-semibold">Price per Unit (₹) *</Label>
                      <Input
                        id="med_price"
                        type="number"
                        step="0.01"
                        placeholder="e.g. 20"
                        value={medPrice}
                        onChange={(e) => setMedPrice(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmittingMed}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9 text-sm mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    {isSubmittingMed ? "Saving..." : "Add to Inventory"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Table (Right) */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="flex flex-col h-[500px]">
              <CardHeader className="bg-slate-50 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    Pharmacy Stock Status
                  </CardTitle>
                  <CardDescription>Real-time listing of active drug levels in the dispensary database.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={loadAllData} className="gap-1 text-xs">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Sync
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto flex-1">
                <div className="min-w-full divide-y divide-slate-200">
                  <div className="bg-slate-50 grid grid-cols-4 px-6 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <div>Medicine Name</div>
                    <div className="text-center">Stock Level</div>
                    <div className="text-center">Unit Price (₹)</div>
                    <div className="text-right">Actions</div>
                  </div>
                  <div className="divide-y divide-slate-200 bg-white">
                    {medicines.map((med) => {
                      const isLow = med.stock <= 50;
                      const isOut = med.stock === 0;
                      return (
                        <div key={med.medicine_name} className="grid grid-cols-4 px-6 py-3 items-center text-sm">
                          <div className="font-medium text-slate-900">{med.medicine_name}</div>
                          <div className="text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                isOut
                                  ? "bg-rose-100 text-rose-700"
                                  : isLow
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {med.stock} units
                            </span>
                          </div>
                          <div className="text-center text-slate-600 font-medium">₹{med.price}</div>
                          <div className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickRestock(med.medicine_name)}
                              className="h-7 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            >
                              +50 Stock
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {medicines.length === 0 && (
                      <div className="text-center text-muted-foreground py-20 text-sm">
                        No medicines configured in inventory.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
