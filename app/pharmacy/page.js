"use client";

import { useState, useEffect } from "react";
import { Pill, CheckCircle, AlertCircle, Info, Activity, PackageCheck, Plus, Layers, PlusCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getQueue, updateWalkIn, getMedicines, createMedicine, updateMedicineStock } from "@/lib/hospital-service";

export default function PharmacyPage() {
  const [queue, setQueue] = useState([]);
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [activeTab, setActiveTab] = useState("queue"); // "queue" or "inventory"
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editable prescription and custom quantities
  const [editPrescription, setEditPrescription] = useState("");
  const [dispenseItems, setDispenseItems] = useState([]);
  const [selectedAddMed, setSelectedAddMed] = useState("");

  // New medicine form state
  const [newMedData, setNewMedData] = useState({
    medicine_name: "", generic_name: "", batch_number: "", mfg_date: "", exp_date: "",
    shelf_life: "", manufacturer: "", supplier: "", category: "Tablet", strength: "",
    pack_size: "", purchase_price: "", mrp: "", price: "", opening_stock: "",
    stock: "", reorder_level: "", rack_location: "", storage: "Room Temperature", barcode: "", is_recalled: false
  });
  const [isSubmittingMed, setIsSubmittingMed] = useState(false);

  const handleMedChange = (field, value) => {
    setNewMedData(prev => ({ ...prev, [field]: value }));
  };

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
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSelectWalkIn = (item) => {
    setSelectedWalkIn(item);
    setEditPrescription(item.prescription || "");
    
    // Auto-detect matching inventory medicines from doctor's typed prescription
    const text = (item.prescription || "").toLowerCase();
    const items = [];
    medicines.forEach(med => {
      if (text.includes(med.medicine_name.toLowerCase())) {
        items.push({
          medicine_name: med.medicine_name,
          qty: 10, // default tablets count
          stock: med.stock,
          price: med.price || 0
        });
      }
    });
    setDispenseItems(items);
  };

  const handleUpdateItemQty = (index, delta) => {
    setDispenseItems(prev => 
      prev.map((item, idx) => {
        if (idx === index) {
          return { ...item, qty: Math.max(1, item.qty + delta) };
        }
        return item;
      })
    );
  };

  const handleRemoveDispenseItem = (index) => {
    setDispenseItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Dispense medications & decrement matching stocks optimistically
  const handleDispense = async (isOutsidePurchase = false) => {
    if (!selectedWalkIn) return;
    const targetWalkInName = selectedWalkIn.name;
    const originalQueue = [...queue];

    // Optimistically update local states
    setQueue(prev => prev.filter(q => q.name !== targetWalkInName));
    
    // Deduct stock levels in UI by exact quantities (skip if outside purchase)
    if (!isOutsidePurchase) {
      setMedicines(prev => 
        prev.map(med => {
          const itemToDeduct = dispenseItems.find(i => i.medicine_name === med.medicine_name);
          if (itemToDeduct) {
            return { ...med, stock: Math.max(0, med.stock - itemToDeduct.qty) };
          }
          return med;
        })
      );
    }

    showToast(isOutsidePurchase ? "Marking as Outside Purchase..." : "Dispensing medications (updating)...", "info");
    setSelectedWalkIn(null);

    try {
      const pharmacyBillAmount = isOutsidePurchase ? 0 : dispenseItems.reduce((acc, item) => acc + (item.qty * item.price), 0);

      // Update visit status and save edited prescription text and exact bill amount in Frappe
      await updateWalkIn(targetWalkInName, {
        prescription: editPrescription,
        pharmacy_status: isOutsidePurchase ? "Completed (Outside Purchase)" : "Completed",
        appointment_status: "Billing",
        pharmacy_bill_amount: pharmacyBillAmount,
        dispensed_medicines: isOutsidePurchase ? [] : dispenseItems
      });

      // Deduct stock for matching medicines by their selected quantities (skip if outside purchase)
      let deductedCount = 0;
      if (!isOutsidePurchase) {
        for (const item of dispenseItems) {
          try {
            await updateMedicineStock(item.medicine_name, -item.qty);
            deductedCount++;
          } catch (stockErr) {
            console.error(`Failed to deduct stock for ${item.medicine_name}:`, stockErr);
          }
        }
      }

      if (isOutsidePurchase) {
        showToast(`Marked as Outside Purchase. Routed to Billing.`, "success");
      } else if (deductedCount > 0) {
        showToast(`Medication dispensed! Fulfill logs complete.`, "success");
      } else {
        showToast("Medications dispensed! Routed to Billing.", "success");
      }

      // Sync final state in background
      await loadAllData();
    } catch (err) {
      // Rollback on server failure
      setQueue(originalQueue);
      showToast("Failed to process transaction. Server error.", "error");
    }
  };

  // Add new medicine to inventory optimistically
  const handleAddMedicine = async (e) => {
    e.preventDefault();
    if (!newMedData.medicine_name.trim() || !newMedData.stock || !newMedData.price) {
      showToast("Medicine Name, Stock, and Selling Price are required", "error");
      return;
    }

    const newMed = {
      ...newMedData,
      name: newMedData.medicine_name.trim(),
      medicine_name: newMedData.medicine_name.trim(),
      stock: parseInt(newMedData.stock) || 0,
      opening_stock: parseInt(newMedData.opening_stock) || parseInt(newMedData.stock) || 0,
      reorder_level: parseInt(newMedData.reorder_level) || 0,
      purchase_price: parseFloat(newMedData.purchase_price) || 0,
      mrp: parseFloat(newMedData.mrp) || 0,
      price: parseFloat(newMedData.price) || 0,
      is_recalled: newMedData.is_recalled ? 1 : 0
    };

    const originalMeds = [...medicines];
    
    // Optimistically insert medicine in local list
    setMedicines(prev => [...prev, newMed]);
    showToast(`Adding ${newMed.medicine_name} to catalog...`, "info");
    
    setNewMedData({
      medicine_name: "", generic_name: "", batch_number: "", mfg_date: "", exp_date: "",
      shelf_life: "", manufacturer: "", supplier: "", category: "Tablet", strength: "",
      pack_size: "", purchase_price: "", mrp: "", price: "", opening_stock: "",
      stock: "", reorder_level: "", rack_location: "", storage: "Room Temperature", barcode: "", is_recalled: false
    });
    setIsAddModalOpen(false);

    setIsSubmittingMed(true);
    try {
      await createMedicine(newMed);
      showToast(`${newMed.medicine_name} added to pharmacy inventory!`, "success");
      await loadAllData();
    } catch (err) {
      // Rollback
      setMedicines(originalMeds);
      showToast(err.message || "Failed to add medicine", "error");
    } finally {
      setIsSubmittingMed(false);
    }
  };

  // Restock an existing medicine quickly with Optimistic UI updates
  const handleQuickRestock = async (medicineName) => {
    const originalMeds = [...medicines];

    // Optimistically update stock value instantly
    setMedicines(prev => 
      prev.map(med => 
        med.medicine_name === medicineName ? { ...med, stock: med.stock + 50 } : med
      )
    );
    showToast(`Restocking ${medicineName}...`, "info");

    try {
      await updateMedicineStock(medicineName, 50); // Add 50 qty
      showToast(`Restocked 50 units of ${medicineName}!`, "success");
      await loadAllData();
    } catch (err) {
      // Rollback
      setMedicines(originalMeds);
      showToast(err.message || "Failed to restock", "error");
    }
  };

  const pendingPharmacy = queue
    .filter((q) => q.appointment_status === "Pharmacy")
    .sort((a, b) => new Date(a.creation || 0) - new Date(b.creation || 0));

  const filteredMedicines = medicines.filter(med => 
    med.medicine_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (med.generic_name && med.generic_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (med.batch_number && med.batch_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

      {loading ? (
        <div className="flex flex-col gap-6 w-full animate-pulse mt-6">
          <div className="flex gap-4 w-full">
            <div className="h-24 flex-1 bg-slate-200/80 rounded-xl" />
            <div className="h-24 flex-1 bg-slate-200/80 rounded-xl" />
            <div className="h-24 flex-1 bg-slate-200/80 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            <div className="h-96 lg:col-span-1 bg-slate-200/60 rounded-xl" />
            <div className="h-96 lg:col-span-2 bg-slate-200/60 rounded-xl" />
          </div>
        </div>
      ) : activeTab === "queue" ? (
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
                  {pendingPharmacy.map((item, index) => {
                    const isActive = selectedWalkIn && selectedWalkIn.name === item.name;
                    return (
                      <div
                        key={item.name}
                        onClick={() => handleSelectWalkIn(item)}
                        className={`p-4 border-b hover:bg-slate-50 cursor-pointer transition-colors border-l-4 flex items-center gap-3
                          ${isActive ? "border-l-pink-600 bg-pink-50/30" : "border-l-transparent bg-white"}`}
                      >
                        <div className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${isActive ? "bg-pink-600 text-white shadow-sm" : "bg-pink-100 text-pink-700"}`}>
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-slate-950 text-sm truncate">{item.patient_name}</h4>
                            <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100">Token #{index + 1}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {item.mobile_number} | Doctor: {item.doctor}
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
                      <Label htmlFor="edit-prescription" className="font-semibold text-pink-700">Prescription Details (Editable)</Label>
                      <textarea
                        id="edit-prescription"
                        className="flex min-h-[90px] w-full rounded-md border border-pink-200 bg-white px-3 py-2 text-xs shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500 font-mono"
                        value={editPrescription}
                        onChange={(e) => setEditPrescription(e.target.value)}
                      />
                    </div>

                    {/* Interactive Dispense List */}
                    <div className="space-y-3 bg-slate-50 p-4 border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                          Deduct Stock Quantities
                        </span>
                        
                        <select
                          value={selectedAddMed}
                          onChange={(e) => {
                            const medName = e.target.value;
                            if (!medName) return;
                            const med = medicines.find(m => m.medicine_name === medName);
                            if (med) {
                              if (!dispenseItems.some(i => i.medicine_name === medName)) {
                                setDispenseItems(prev => [...prev, { medicine_name: medName, qty: 10, stock: med.stock, price: med.price || 0 }]);
                              }
                            }
                            setSelectedAddMed("");
                          }}
                          className="h-6 text-[10px] bg-white border border-slate-200 rounded px-1 cursor-pointer font-medium"
                        >
                          <option value="">+ Add Medicine</option>
                          {medicines.map(med => (
                            <option key={med.medicine_name} value={med.medicine_name}>
                              {med.medicine_name} ({med.stock} left)
                            </option>
                          ))}
                        </select>
                      </div>

                      {dispenseItems.length > 0 ? (
                        <div className="space-y-2">
                          {dispenseItems.map((item, idx) => (
                            <div key={item.medicine_name} className="flex items-center justify-between bg-white p-2 border border-slate-200 rounded shadow-sm text-xs">
                              <div>
                                <span className="font-semibold text-slate-800">{item.medicine_name}</span>
                                <div className="text-[10px] text-slate-400 mt-0.5">Current Stock: {item.stock} units</div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] text-slate-500 font-medium">Rate: ₹{item.price}</span>
                                <span className="text-xs font-bold text-slate-700">₹{(item.qty * (item.price || 0)).toFixed(2)}</span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {/* Qty Adjust Buttons */}
                                <div className="flex items-center border border-slate-200 rounded overflow-hidden select-none">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemQty(idx, -1)}
                                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 font-bold border-r border-slate-200 h-6 flex items-center justify-center text-slate-600"
                                  >
                                    -
                                  </button>
                                  <span className="px-2.5 font-semibold text-slate-800 text-xs">{item.qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemQty(idx, 1)}
                                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 font-bold border-l border-slate-200 h-6 flex items-center justify-center text-slate-600"
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveDispenseItem(idx)}
                                  className="text-rose-500 hover:text-rose-700 font-bold text-lg h-6 flex items-center justify-center w-4"
                                  title="Remove item"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No matching pharmacy inventory items found. Use "+ Add Medicine" to select.</p>
                      )}
                      {dispenseItems.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center px-1">
                          <span className="text-sm font-semibold text-slate-600">Total Medicines Bill:</span>
                          <span className="text-base font-bold text-emerald-600">
                            ₹{dispenseItems.reduce((acc, item) => acc + (item.qty * (item.price || 0)), 0).toFixed(2)}
                          </span>
                        </div>
                      )}
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
                        onClick={() => handleDispense(true)}
                        variant="outline"
                        className="text-slate-700 h-9 text-sm"
                      >
                        Outside Purchase (Bill ₹0)
                      </Button>
                      <Button
                        onClick={() => handleDispense(false)}
                        className="bg-pink-600 hover:bg-pink-700 text-white gap-1.5 h-9 text-sm"
                        disabled={dispenseItems.length === 0}
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
        <div className="grid grid-cols-1 gap-6">
          {/* Inventory Table (Full Width) */}
          <div className="space-y-6">
            <Card className="flex flex-col h-[700px]">
              <CardHeader className="bg-slate-50 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    Pharmacy Stock Status
                  </CardTitle>
                  <CardDescription>Real-time listing of active drug levels in the dispensary database.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Input 
                    placeholder="Search medicine, generic or batch..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[300px] h-9 text-sm"
                  />
                  <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9 text-sm">
                        <PlusCircle className="w-4 h-4" />
                        Add New Medicine
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle>Add New Medicine</DialogTitle>
                        <DialogDescription>Enter new pharmaceutical items into the active inventory.</DialogDescription>
                      </DialogHeader>
                      <div className="overflow-y-auto flex-1 pr-2 py-4">
                        <form id="add-medicine-form" onSubmit={handleAddMedicine} className="space-y-6">
                          {/* General Information */}
                          <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 border-b pb-1">General Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <Label htmlFor="medicine_name" className="text-xs font-semibold">Medicine Name *</Label>
                                <Input id="medicine_name" placeholder="e.g. Paracetamol 650mg" value={newMedData.medicine_name} onChange={(e) => handleMedChange("medicine_name", e.target.value)} required />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="generic_name" className="text-xs font-semibold">Generic Name</Label>
                                <Input id="generic_name" placeholder="e.g. Paracetamol" value={newMedData.generic_name} onChange={(e) => handleMedChange("generic_name", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="manufacturer" className="text-xs font-semibold">Manufacturer</Label>
                                <Input id="manufacturer" placeholder="e.g. Micro Labs" value={newMedData.manufacturer} onChange={(e) => handleMedChange("manufacturer", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="supplier" className="text-xs font-semibold">Supplier</Label>
                                <Input id="supplier" placeholder="e.g. ABC Pharma Distributors" value={newMedData.supplier} onChange={(e) => handleMedChange("supplier", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="category" className="text-xs font-semibold">Category</Label>
                                <select id="category" value={newMedData.category} onChange={(e) => handleMedChange("category", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                  <option>Tablet</option>
                                  <option>Capsule</option>
                                  <option>Syrup</option>
                                  <option>Injection</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="strength" className="text-xs font-semibold">Strength</Label>
                                <Input id="strength" placeholder="e.g. 650 mg" value={newMedData.strength} onChange={(e) => handleMedChange("strength", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="pack_size" className="text-xs font-semibold">Pack Size</Label>
                                <Input id="pack_size" placeholder="e.g. 15 Tablets" value={newMedData.pack_size} onChange={(e) => handleMedChange("pack_size", e.target.value)} />
                              </div>
                              <div className="space-y-1 flex items-center space-x-2 pt-6">
                                <input type="checkbox" id="is_recalled" checked={newMedData.is_recalled} onChange={(e) => handleMedChange("is_recalled", e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                <Label htmlFor="is_recalled" className="text-xs font-semibold text-rose-600">Batch Recalled</Label>
                              </div>
                            </div>
                          </div>

                          {/* Inventory & Batch */}
                          <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 border-b pb-1">Inventory & Batch Details</h3>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <Label htmlFor="batch_number" className="text-xs font-semibold">Batch Number</Label>
                                <Input id="batch_number" placeholder="e.g. DL65024001" value={newMedData.batch_number} onChange={(e) => handleMedChange("batch_number", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="mfg_date" className="text-xs font-semibold">MFG Date</Label>
                                <Input id="mfg_date" type="date" value={newMedData.mfg_date} onChange={(e) => handleMedChange("mfg_date", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="exp_date" className="text-xs font-semibold">EXP Date</Label>
                                <Input id="exp_date" type="date" value={newMedData.exp_date} onChange={(e) => handleMedChange("exp_date", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="shelf_life" className="text-xs font-semibold">Shelf Life</Label>
                                <Input id="shelf_life" placeholder="e.g. 36 Months" value={newMedData.shelf_life} onChange={(e) => handleMedChange("shelf_life", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="opening_stock" className="text-xs font-semibold">Opening Stock</Label>
                                <Input id="opening_stock" type="number" placeholder="e.g. 500" value={newMedData.opening_stock} onChange={(e) => handleMedChange("opening_stock", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="stock" className="text-xs font-semibold">Current Stock *</Label>
                                <Input id="stock" type="number" placeholder="e.g. 320" value={newMedData.stock} onChange={(e) => handleMedChange("stock", e.target.value)} required />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="reorder_level" className="text-xs font-semibold">Reorder Level</Label>
                                <Input id="reorder_level" type="number" placeholder="e.g. 100" value={newMedData.reorder_level} onChange={(e) => handleMedChange("reorder_level", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="rack_location" className="text-xs font-semibold">Rack Location</Label>
                                <Input id="rack_location" placeholder="e.g. Rack A-02" value={newMedData.rack_location} onChange={(e) => handleMedChange("rack_location", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="storage" className="text-xs font-semibold">Storage</Label>
                                <Input id="storage" placeholder="e.g. Room Temperature" value={newMedData.storage} onChange={(e) => handleMedChange("storage", e.target.value)} />
                              </div>
                            </div>
                          </div>

                          {/* Pricing */}
                          <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 border-b pb-1">Pricing Information</h3>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <Label htmlFor="purchase_price" className="text-xs font-semibold">Purchase Price (₹)</Label>
                                <Input id="purchase_price" type="number" step="0.01" placeholder="e.g. 18" value={newMedData.purchase_price} onChange={(e) => handleMedChange("purchase_price", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="mrp" className="text-xs font-semibold">MRP (₹)</Label>
                                <Input id="mrp" type="number" step="0.01" placeholder="e.g. 35" value={newMedData.mrp} onChange={(e) => handleMedChange("mrp", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="price" className="text-xs font-semibold">Selling Price (₹) *</Label>
                                <Input id="price" type="number" step="0.01" placeholder="e.g. 32" value={newMedData.price} onChange={(e) => handleMedChange("price", e.target.value)} required />
                              </div>
                            </div>
                          </div>
                        </form>
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t mt-auto">
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button type="submit" form="add-medicine-form" disabled={isSubmittingMed} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                          {isSubmittingMed ? "Saving..." : "Save Medicine"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={loadAllData} className="gap-1 text-xs h-9">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sync
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto flex-1">
                <div className="min-w-full divide-y divide-slate-200">
                  <div className="bg-slate-50 grid grid-cols-12 px-6 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-3">Medicine</div>
                    <div className="col-span-2">Batch & EXP</div>
                    <div className="col-span-3 text-center">Stock & Alerts</div>
                    <div className="col-span-2 text-center">Price</div>
                    <div className="col-span-2 text-right">Actions</div>
                  </div>
                  <div className="divide-y divide-slate-200 bg-white">
                    {filteredMedicines.map((med) => {
                      const today = new Date();
                      const expDate = med.exp_date ? new Date(med.exp_date) : null;
                      const daysToExpire = expDate ? Math.ceil((expDate - today) / (1000 * 60 * 60 * 24)) : null;

                      let expiryAlert = null;
                      if (expDate && daysToExpire < 0) {
                        expiryAlert = <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-rose-200 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Expired</span>;
                      } else if (expDate && daysToExpire <= 30) {
                        expiryAlert = <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-orange-200 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Exp &lt;30d</span>;
                      } else if (expDate && daysToExpire <= 90) {
                        expiryAlert = <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-200 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Exp &lt;90d</span>;
                      }

                      const stock = med.stock || 0;
                      const reorder = med.reorder_level || 50;
                      let stockAlert = null;
                      if (stock === 0) {
                        stockAlert = <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-rose-200">Out of Stock</span>;
                      } else if (stock <= reorder / 2) {
                        stockAlert = <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-orange-200">Low Stock</span>;
                      } else if (stock <= reorder) {
                        stockAlert = <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-200">Near Reorder</span>;
                      } else {
                        stockAlert = <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-200">In Stock</span>;
                      }

                      const isRecalled = med.is_recalled == 1 || med.is_recalled === true;

                      return (
                        <div key={med.medicine_name} className={`grid grid-cols-12 px-6 py-3 items-center text-sm ${isRecalled ? 'bg-red-50/50' : ''}`}>
                          <div className="col-span-3">
                            <div className="font-semibold text-slate-900 flex items-center gap-1">
                              {med.medicine_name}
                              {isRecalled && <AlertCircle className="w-3.5 h-3.5 text-rose-600" title="Batch Recalled" />}
                            </div>
                            <div className="text-[10px] text-slate-500">{med.rack_location || 'No Rack'}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-xs font-mono text-slate-700">{med.batch_number || 'N/A'}</div>
                            <div className="text-[10px] text-slate-500">{med.exp_date ? new Date(med.exp_date).toLocaleDateString() : 'N/A'}</div>
                          </div>
                          <div className="col-span-3 text-center flex flex-col items-center gap-1">
                            <div className="flex gap-1 flex-wrap justify-center">
                              {stockAlert}
                              {expiryAlert}
                            </div>
                            <span className="text-xs font-medium text-slate-700">{stock} units</span>
                          </div>
                          <div className="col-span-2 text-center flex flex-col">
                            <span className="text-sm font-semibold text-slate-700">₹{med.price}</span>
                            {med.mrp && <span className="text-[10px] text-slate-400 line-through">MRP: ₹{med.mrp}</span>}
                          </div>
                          <div className="col-span-2 text-right">
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

                    {filteredMedicines.length === 0 && (
                      <div className="text-center text-muted-foreground py-20 text-sm">
                        No medicines found.
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
