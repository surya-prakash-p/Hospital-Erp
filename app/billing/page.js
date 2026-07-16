"use client";

import { useState, useEffect } from "react";
import { Receipt, CheckCircle, AlertCircle, Info, Activity, CreditCard, Printer } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQueue, updateWalkIn, getPatient, updatePatientHistory } from "@/lib/hospital-service";

const DOCTOR_FEES = {
  "Dr. Rajesh": 500,
  "Dr. Priya": 1000,
  "Dr. Vignesh": 600
};

export default function BillingPage() {
  const [queue, setQueue] = useState([]);
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [toasts, setToasts] = useState([]);
  const [settledInvoice, setSettledInvoice] = useState(null);

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
        showToast("Error loading billing queue", "error");
        console.error(err);
      }
    }
    loadData();
  }, []);

  const handleSelectWalkIn = (item) => {
    setSelectedWalkIn(item);
  };

  const handleSettleBill = async (e) => {
    e?.preventDefault();
    if (!selectedWalkIn) {
      showToast("Please select a patient from the queue", "error");
      return;
    }

    try {
      showToast("Recording payment and compiling visit report...", "info");

      // Calculate fee breakdown
      const docFee = DOCTOR_FEES[selectedWalkIn.doctor] || 500;
      const labFee = selectedWalkIn.need_lab_test === 1 ? 450 : 0;
      const pharmFee = selectedWalkIn.need_medicines === 1 ? 250 : 0;
      const grandTotal = docFee + labFee + pharmFee;

      // 1. Update walk-in record to Completed
      await updateWalkIn(selectedWalkIn.name, {
        bill_amount: grandTotal,
        payment_received: 1,
        payment_method: paymentMethod,
        appointment_status: "Completed"
      });

      // 2. Fetch current patient profile and compile history entry
      const patientProfile = await getPatient(selectedWalkIn.mobile_number);
      if (patientProfile) {
        const todayStr = new Date().toISOString().split("T")[0];
        const newHistoryLog = `
Visit Date: ${todayStr}
Doctor: ${selectedWalkIn.doctor}
Diagnosis: ${selectedWalkIn.diagnosis || "General Consultation Checkup"}
Prescription: ${selectedWalkIn.prescription || "None"}
Lab Test: ${selectedWalkIn.need_lab_test === 1 ? `${selectedWalkIn.lab_test_name} (Results: ${selectedWalkIn.lab_result || "normal"})` : "None"}
Bill Total: ₹${grandTotal} (${paymentMethod})
Status: Completed.
`;
        
        const currentHistory = patientProfile.medical_history || "";
        const updatedHistory = currentHistory + "\n" + newHistoryLog;
        await updatePatientHistory(selectedWalkIn.mobile_number, updatedHistory);
      }

      showToast(`Payment of ₹${grandTotal} settled successfully! Visit history logged.`, "success");

      // Trigger settled invoice view before clearing state
      setSettledInvoice({
        ...selectedWalkIn,
        grandTotal,
        paymentMethod,
        date: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        })
      });

      // Reload queue and clear select state
      const updatedQueue = await getQueue();
      setQueue(updatedQueue);
      setSelectedWalkIn(null);
    } catch (err) {
      showToast(err.message || "Failed to settle payment", "error");
      console.error(err);
    }
  };

  const pendingBilling = queue.filter((q) => q.appointment_status === "Billing");

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Toast notifications container - adjusted to be medium size */}
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

      {/* Proper invoice generator modal overlay */}
      {settledInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto flex flex-col p-6 border relative">
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-invoice, #printable-invoice * {
                  visibility: visible !important;
                }
                #printable-invoice {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  max-width: 100% !important;
                  padding: 40px !important;
                  box-shadow: none !important;
                  border: none !important;
                  background: white !important;
                  color: black !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}} />
            
            {/* Printable Invoice Container */}
            <div id="printable-invoice" className="bg-white p-4 border border-slate-100 rounded-lg">
              {/* Invoice Header */}
              <div className="text-center pb-5 border-b border-slate-200">
                <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">Thangam Hospital</h2>
                <p className="text-[11px] text-muted-foreground mt-1">123 Health City Road, Coimbatore - 641012</p>
                <p className="text-[10px] text-muted-foreground">Phone: +91 422 2345678 | Email: billing@thangam.org</p>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-200">
                <div>
                  <p className="text-muted-foreground">Invoice ID:</p>
                  <p className="font-mono font-bold text-slate-900">{settledInvoice.name}</p>
                  <p className="text-muted-foreground mt-2">Date & Time:</p>
                  <p className="font-medium text-slate-800">{settledInvoice.date}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Patient Name:</p>
                  <p className="font-bold text-slate-900">{settledInvoice.patient_name}</p>
                  <p className="text-muted-foreground mt-2">Mobile Number:</p>
                  <p className="font-medium text-slate-800">{settledInvoice.mobile_number}</p>
                </div>
              </div>

              {/* Clinical Details */}
              <div className="py-3 text-xs border-b border-slate-200 bg-slate-50/50 px-2 rounded">
                <p className="text-muted-foreground">Consulting Doctor: <span className="font-semibold text-slate-800">{settledInvoice.doctor}</span></p>
                {settledInvoice.diagnosis && (
                  <p className="text-muted-foreground mt-1">Diagnosis: <span className="text-slate-800">{settledInvoice.diagnosis}</span></p>
                )}
                {settledInvoice.need_lab_test === 1 && settledInvoice.lab_test_image && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200">
                    <p className="text-[9px] text-muted-foreground font-bold uppercase mb-1">Attached Lab Diagnostic Scan</p>
                    <img
                      src={settledInvoice.lab_test_image}
                      alt="Lab Report"
                      className="max-h-24 rounded border border-slate-200 object-contain bg-white mx-auto"
                    />
                  </div>
                )}
              </div>

              {/* Table of Charges */}
              <div className="py-4 space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Clinical Charges</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">Consultation Fee ({settledInvoice.doctor})</span>
                    <span className="font-medium">₹{DOCTOR_FEES[settledInvoice.doctor] || 500}</span>
                  </div>
                  {settledInvoice.need_lab_test === 1 && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Lab Diagnostic Panel ({settledInvoice.lab_test_name})</span>
                      <span className="font-medium">₹450</span>
                    </div>
                  )}
                  {settledInvoice.need_medicines === 1 && (
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-600">Pharmacy Medication Package</span>
                      <span className="font-medium">₹250</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-3">
                    <span>Total Paid</span>
                    <span>₹{settledInvoice.grandTotal}</span>
                  </div>
                </div>
              </div>

              {/* Paid stamp */}
              <div className="flex flex-col items-center justify-center pt-4 pb-2 border-t border-slate-100 border-dashed">
                <div className="border-2 border-emerald-500 text-emerald-600 font-bold uppercase tracking-widest text-[10px] px-3 py-1 rounded rotate-[-2deg] select-none">
                  Paid via {settledInvoice.paymentMethod}
                </div>
                <p className="text-[10px] text-muted-foreground mt-4 italic">Thank you for choosing Thangam Hospitals. Get well soon!</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex gap-3 justify-end no-print">
              <Button 
                variant="outline" 
                onClick={() => setSettledInvoice(null)}
                className="h-9 text-sm text-slate-600 border-slate-200"
              >
                Close & Return
              </Button>
              <Button 
                onClick={() => window.print()}
                className="h-9 text-sm bg-slate-900 hover:bg-slate-800 text-white gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Print Invoice
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Billing & Pay</h2>
          <p className="text-muted-foreground mt-1">Manage patient invoices and payments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="flex flex-col h-[500px]">
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Pending Bills</span>
                <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {pendingBilling.length} Pending
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              <div className="divide-y">
                {pendingBilling.map((item) => {
                  const isActive = selectedWalkIn && selectedWalkIn.name === item.name;
                  return (
                    <div
                      key={item.name}
                      onClick={() => handleSelectWalkIn(item)}
                      className={`p-4 border-b hover:bg-slate-50 cursor-pointer transition-colors border-l-4 
                        ${isActive ? "border-l-teal-600 bg-teal-50/30" : "border-l-transparent bg-white"}`}
                    >
                      <div>
                        <h4 className="font-semibold text-slate-955 text-sm">{item.patient_name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.mobile_number} | Doctor: {item.doctor}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {pendingBilling.length === 0 && (
                  <div className="text-center text-muted-foreground py-20 text-sm">
                    No pending bills.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice details and settling panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-teal-500" />
                Checkout & Invoice Settle
              </CardTitle>
              <CardDescription>Compile billable clinical items and record payments.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {selectedWalkIn ? (
                <div className="space-y-6">
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

                  {/* Summary of Clinical Visit */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded border border-slate-100 space-y-1">
                      <span className="font-bold text-slate-500 uppercase tracking-wider block">Diagnosis</span>
                      <p className="font-medium text-slate-800">{selectedWalkIn.diagnosis || "General Consultation Checkup"}</p>
                    </div>

                    <div className="bg-slate-50 p-3 rounded border border-slate-100 space-y-1">
                      <span className="font-bold text-slate-500 uppercase tracking-wider block">Prescription</span>
                      <p className="font-medium text-slate-800 truncate" title={selectedWalkIn.prescription}>
                        {selectedWalkIn.prescription || "None"}
                      </p>
                    </div>

                    {selectedWalkIn.need_lab_test === 1 && (
                      <div className="bg-slate-50 p-3 rounded border border-slate-100 space-y-2 md:col-span-2">
                        <span className="font-bold text-purple-600 uppercase tracking-wider block">Lab Diagnostic Report</span>
                        <p className="font-medium text-slate-800">
                          Test: <span className="font-semibold">{selectedWalkIn.lab_test_name}</span> | Results: <span className="font-mono bg-purple-50 px-1 py-0.5 rounded text-purple-700">{selectedWalkIn.lab_result || "normal"}</span>
                        </p>
                        {selectedWalkIn.lab_test_image && (
                          <div className="mt-2 pt-2 border-t border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Attached Lab Report Image</span>
                            <img
                              src={selectedWalkIn.lab_test_image}
                              alt="Lab Test Attachment"
                              className="max-h-36 rounded border border-slate-200 object-contain bg-white"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Invoice Itemization */}
                  <div className="space-y-3 pt-2">
                    <h3 className="font-semibold text-sm text-slate-900 border-b pb-1.5 flex items-center justify-between">
                      <span>Itemized Bill Breakdown</span>
                      <span className="text-xs text-muted-foreground">Currency: INR (₹)</span>
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-slate-600">
                        <span>Consultation Fee ({selectedWalkIn.doctor})</span>
                        <span>₹{DOCTOR_FEES[selectedWalkIn.doctor] || 500}</span>
                      </div>

                      {selectedWalkIn.need_lab_test === 1 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Lab Test Fee ({selectedWalkIn.lab_test_name})</span>
                          <span>₹450</span>
                        </div>
                      )}

                      {selectedWalkIn.need_medicines === 1 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Pharmacy Dispensed Package</span>
                          <span>₹250</span>
                        </div>
                      )}

                      <div className="flex justify-between font-bold text-base text-slate-900 pt-3 border-t border-slate-100">
                        <span>Grand Total Due</span>
                        <span>
                          ₹{(DOCTOR_FEES[selectedWalkIn.doctor] || 500) + 
                            (selectedWalkIn.need_lab_test === 1 ? 450 : 0) + 
                            (selectedWalkIn.need_medicines === 1 ? 250 : 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment selector */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4 items-end">
                    <div className="space-y-1">
                      <Label htmlFor="payment-method" className="text-xs font-semibold">Payment Method *</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger id="payment-method" className="h-9 text-sm">
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UPI">UPI (GPay / PhonePe / Paytm)</SelectItem>
                          <SelectItem value="Cash">Cash payment</SelectItem>
                          <SelectItem value="Card">Credit / Debit Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleSettleBill}
                      className="bg-teal-600 hover:bg-teal-700 text-white gap-1.5 h-9 text-sm"
                    >
                      <CreditCard className="w-4 h-4" />
                      Record Payment & Settle Invoice
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-20">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-teal-300 animate-pulse" />
                  Please select a pending bill from the queue to process checkout.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
