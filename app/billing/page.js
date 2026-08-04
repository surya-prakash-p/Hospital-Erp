"use client";

import { useState, useEffect } from "react";
import { Receipt, CheckCircle, AlertCircle, Info, Activity, CreditCard, Printer, Download, BadgeCheck, TrendingDown, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQueue, updateWalkIn, getPatient, updatePatientHistory, getLabTests } from "@/lib/hospital-service";
import { jsPDF } from "jspdf";

const DOCTOR_FEES = {
  "Dr. Rajesh": 500,
  "Dr. Priya": 1000,
  "Dr. Vignesh": 600
};

export default function BillingPage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [toasts, setToasts] = useState([]);
  const [settledInvoice, setSettledInvoice] = useState(null);
  const [deptPayments, setDeptPayments] = useState([]);
  const [labTests, setLabTests] = useState([]);

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
        const labs = await getLabTests();
        setLabTests(labs);
      } catch (err) {
        showToast("Error loading billing queue", "error");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getLabFee = (testName) => {
    if (!testName) return 0;
    const names = testName.split(",").map(n => n.trim()).filter(Boolean);
    if (names.length === 0) return 0;
    let total = 0;
    names.forEach(name => {
      const test = labTests.find(t => t.test_name === name);
      total += test ? test.fee : 450;
    });
    return total;
  };

  // Load department-level payments from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("hospital_dept_payments");
    if (raw) setDeptPayments(JSON.parse(raw));
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

    const originalQueue = [...queue];
    const targetWalkIn = { ...selectedWalkIn };
    const targetWalkInName = selectedWalkIn.name;

    // Calculate fee breakdown
    const docFee = DOCTOR_FEES[targetWalkIn.doctor] || 500;
    const labFee = targetWalkIn.need_lab_test === 1 ? getLabFee(targetWalkIn.lab_test_name) : 0;
    const pharmFee = targetWalkIn.need_medicines === 1 ? (targetWalkIn.pharmacy_bill_amount || 0) : 0;
    const grandTotal = docFee + labFee + pharmFee;

    // Subtract payments already collected at department level
    const currentDeptPayments = JSON.parse(localStorage.getItem("hospital_dept_payments") || "[]");
    const deptAlreadyPaid = currentDeptPayments
      .filter(p => p.walkInId === targetWalkInName)
      .reduce((s, p) => s + (p.amount || 0), 0);
    const netBalance = Math.max(0, grandTotal - deptAlreadyPaid);

    // Optimistically update states instantly
    setQueue(prev => prev.filter(q => q.name !== targetWalkInName));
    showToast("Processing payment & invoice...", "info");

    // Instantly trigger receipt modal view
    setSettledInvoice({
      ...targetWalkIn,
      grandTotal,
      labFee,
      deptAlreadyPaid,
      netBalance,
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
    setSelectedWalkIn(null);

    try {
      // 1. Update walk-in record — store gross total for records but mark as completed
      await updateWalkIn(targetWalkInName, {
        bill_amount: grandTotal,
        payment_received: 1,
        payment_method: paymentMethod,
        appointment_status: "Completed"
      });

      // 2. Record only the net balance in finance (dept payments already recorded separately)
      if (netBalance > 0) {
        const storedFinance = localStorage.getItem("hospital_custom_finance");
        const financeEntries = storedFinance ? JSON.parse(storedFinance) : [];
        const deptPaidNote = deptAlreadyPaid > 0
          ? ` (Gross ₹${grandTotal} − Dept Paid ₹${deptAlreadyPaid})`
          : "";
        financeEntries.unshift({
          id: `tx-billing-${Date.now()}`,
          title: `Patient Billing — ${targetWalkIn.patient_name}`,
          type: "Income",
          category: "Clinical Services",
          amount: netBalance,
          method: paymentMethod,
          date: new Date().toISOString().split("T")[0],
          notes: `Settled at Billing desk. Doctor: ${targetWalkIn.doctor}. Lab included: ${targetWalkIn.need_lab_test === 1 ? "Yes" : "No"}. Pharmacy: ${targetWalkIn.need_medicines === 1 ? "Yes" : "No"}.${deptPaidNote}`
        });
        localStorage.setItem("hospital_custom_finance", JSON.stringify(financeEntries));
      }

      // Save persistent patient invoice to patient profile documents tab
      const patientMobile = targetWalkIn.mobile_number;
      if (patientMobile) {
        const existingInvoicesRaw = localStorage.getItem(`hospital_patient_invoices_${patientMobile}`);
        const existingInvoices = existingInvoicesRaw ? JSON.parse(existingInvoicesRaw) : [];
        
        const invoiceDoc = {
          id: Date.now(),
          type: 'invoice',
          name: `Invoice_${targetWalkIn.patient_name}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`,
          date: new Date().toLocaleDateString('en-GB'),
          walkinData: {
            doctor: targetWalkIn.doctor || "",
            lab_test_name: targetWalkIn.lab_test_name || "",
            need_lab_test: targetWalkIn.need_lab_test || 0,
            pharmacy_bill_amount: targetWalkIn.pharmacy_bill_amount || 0,
            dispensed_medicines: targetWalkIn.dispensed_medicines || [],
            docFee,
            labFee,
            grandTotal,
            deptAlreadyPaid,
            netBalance,
            paymentMethod
          }
        };
        existingInvoices.unshift(invoiceDoc);
        localStorage.setItem(`hospital_patient_invoices_${patientMobile}`, JSON.stringify(existingInvoices));
      }

      // 3. Fetch current patient profile and compile history entry
      const patientProfile = await getPatient(targetWalkIn.mobile_number);
      if (patientProfile) {
        const todayStr = new Date().toISOString().split("T")[0];
        const newHistoryLog = `
Visit Date: ${todayStr}
Doctor: ${targetWalkIn.doctor}
Diagnosis: ${targetWalkIn.diagnosis || "General Consultation Checkup"}
Prescription: ${targetWalkIn.prescription || "None"}
Lab Test: ${targetWalkIn.need_lab_test === 1 ? `${targetWalkIn.lab_test_name} (Results: ${targetWalkIn.lab_result || "normal"})` : "None"}
Bill Total: ₹${grandTotal}${deptAlreadyPaid > 0 ? ` (Dept Paid: ₹${deptAlreadyPaid} | Balance Collected: ₹${netBalance})` : ""} (${paymentMethod})
Status: Completed.
`;
        
        const currentHistory = patientProfile.medical_history || "";
        const updatedHistory = currentHistory + "\n" + newHistoryLog;
        await updatePatientHistory(targetWalkIn.mobile_number, updatedHistory);
      }

      const toastMsg = netBalance === 0
        ? `Bill fully settled! All ₹${grandTotal} was collected at department level.`
        : `Balance of ₹${netBalance} collected. Total visit: ₹${grandTotal}.`;
      showToast(toastMsg, "success");

      // Reload queue in background
      const updatedQueue = await getQueue();
      setQueue(updatedQueue);
    } catch (err) {
      // Rollback on failure
      setQueue(originalQueue);
      setSettledInvoice(null);
      showToast(err.message || "Failed to settle payment", "error");
      console.error(err);
    }
  };

  const handleDownloadPDF = () => {
    if (!settledInvoice) return;
    
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      let posY = 20;

      // Header
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("THANGAM HOSPITAL", 105, posY, { align: "center" });
      posY += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("123 Health City Road, Coimbatore - 641012", 105, posY, { align: "center" });
      posY += 5;
      doc.text("Phone: +91 422 2345678 | Email: billing@thangam.org | GSTIN: 33AAACT1234A1Z0", 105, posY, { align: "center" });
      posY += 8;

      // Line separator
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(20, posY, 190, posY);
      posY += 8;

      // Invoice Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("PATIENT BILLING INVOICE", 20, posY);
      posY += 8;

      // Meta Info Table (Grid)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("Invoice ID:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(settledInvoice.name, 50, posY);

      doc.setFont("helvetica", "bold");
      doc.text("Patient Name:", 115, posY);
      doc.setFont("helvetica", "normal");
      doc.text(settledInvoice.patient_name, 145, posY);
      posY += 6;

      doc.setFont("helvetica", "bold");
      doc.text("Date & Time:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(settledInvoice.date || new Date().toLocaleString(), 50, posY);

      doc.setFont("helvetica", "bold");
      doc.text("Mobile Number:", 115, posY);
      doc.setFont("helvetica", "normal");
      doc.text(settledInvoice.mobile_number, 145, posY);
      posY += 8;

      // Line separator
      doc.line(20, posY, 190, posY);
      posY += 8;

      // Doctor & Diagnosis
      doc.setFont("helvetica", "bold");
      doc.text("Consulting Doctor:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(settledInvoice.doctor, 55, posY);
      posY += 6;

      if (settledInvoice.diagnosis) {
        doc.setFont("helvetica", "bold");
        doc.text("Diagnosis:", 20, posY);
        doc.setFont("helvetica", "normal");
        const diagnosisLines = doc.splitTextToSize(settledInvoice.diagnosis, 130);
        doc.text(diagnosisLines, 55, posY);
        posY += (diagnosisLines.length * 4) + 2;
      } else {
        posY += 2;
      }

      // Line separator
      doc.line(20, posY, 190, posY);
      posY += 8;

      // Table Headers
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(20, posY - 4, 170, 7, "F");
      doc.text("Description", 22, posY);
      doc.text("Qty", 120, posY, { align: "center" });
      doc.text("Unit Price", 145, posY, { align: "right" });
      doc.text("Amount", 185, posY, { align: "right" });
      posY += 8;

      // Add rows
      const docFee = DOCTOR_FEES[settledInvoice.doctor] || 500;
      
      // Row 1: Consultation
      doc.setFont("helvetica", "normal");
      doc.text(`Consultation Fee (${settledInvoice.doctor})`, 22, posY);
      doc.text("1", 120, posY, { align: "center" });
      doc.text(`INR ${docFee.toFixed(2)}`, 145, posY, { align: "right" });
      doc.text(`INR ${docFee.toFixed(2)}`, 185, posY, { align: "right" });
      posY += 7;

      // Row 2: Lab Test
      if (settledInvoice.need_lab_test === 1) {
        const currentLabFee = settledInvoice.labFee || getLabFee(settledInvoice.lab_test_name);
        doc.text(`Lab Diagnostic Panel (${settledInvoice.lab_test_name})`, 22, posY);
        doc.text("1", 120, posY, { align: "center" });
        doc.text(`INR ${currentLabFee.toFixed(2)}`, 145, posY, { align: "right" });
        doc.text(`INR ${currentLabFee.toFixed(2)}`, 185, posY, { align: "right" });
        posY += 7;
      }

      // Row 3: Pharmacy Medications
      if (settledInvoice.need_medicines === 1) {
        const pharmTotal = settledInvoice.pharmacy_bill_amount || 0;
        doc.text("Pharmacy Medication Package", 22, posY);
        doc.text("-", 120, posY, { align: "center" });
        doc.text(`INR ${pharmTotal.toFixed(2)}`, 145, posY, { align: "right" });
        doc.text(`INR ${pharmTotal.toFixed(2)}`, 185, posY, { align: "right" });
        posY += 6;

        // Sub-items of medicines
        if (settledInvoice.dispensed_medicines && settledInvoice.dispensed_medicines.length > 0) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139); // slate-500
          
          settledInvoice.dispensed_medicines.forEach(med => {
            const itemTotal = med.qty * (med.price || 0);
            doc.text(`- ${med.medicine_name} (x${med.qty}) @ INR ${med.price || 0}/ea`, 26, posY);
            doc.text(`INR ${itemTotal.toFixed(2)}`, 185, posY, { align: "right" });
            posY += 5;
          });
          
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(15, 23, 42);
          posY += 2;
        } else {
          posY += 1;
        }
      }

      // Totals Area
      posY += 3;
      doc.line(20, posY, 190, posY);
      posY += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("GRAND TOTAL:", 130, posY);
      doc.text(`INR ${settledInvoice.grandTotal.toFixed(2)}`, 185, posY, { align: "right" });
      posY += 12;

      // Paid Stamp / Footer
      doc.setDrawColor(16, 185, 129); // emerald-500
      doc.setLineWidth(0.8);
      doc.rect(75, posY, 60, 12);
      
      doc.setTextColor(16, 185, 129);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(`PAID VIA ${settledInvoice.paymentMethod.toUpperCase()}`, 105, posY + 7.5, { align: "center" });

      posY += 22;
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.text("Thank you for choosing Thangam Hospital. Get well soon!", 105, posY, { align: "center" });

      // Save the PDF
      doc.save(`Invoice-${settledInvoice.name}.pdf`);
      showToast("Invoice PDF downloaded successfully!", "success");
    } catch (pdfErr) {
      showToast("Error generating invoice PDF", "error");
      console.error(pdfErr);
    }
  };

  const handlePrintInvoice = () => {
    if (!settledInvoice) return;
    try {
      const printContent = document.getElementById("printable-invoice").innerHTML;
      const printWindow = window.open("", "_blank", "width=850,height=900");
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${settledInvoice.name}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              body {
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                padding: 40px;
                background: white;
                color: #0f172a;
              }
              .border-b { border-bottom-width: 1px; }
              .border-t { border-top-width: 1px; }
              .border-dashed { border-style: dashed; }
              .font-mono { font-family: monospace; }
            </style>
          </head>
          <body>
            <div class="max-w-2xl mx-auto border border-slate-100 p-8 rounded-xl shadow-sm">
              ${printContent}
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (printErr) {
      showToast("Error printing invoice", "error");
      console.error(printErr);
    }
  };

  const pendingBilling = queue
    .filter((q) => q.appointment_status === "Billing")
    .sort((a, b) => new Date(a.creation || 0) - new Date(b.creation || 0));

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Toast notifications container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
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
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto flex flex-col p-6 border relative animate-in zoom-in-95 duration-150">
            
            {/* Printable Invoice Container */}
            <div id="printable-invoice" className="bg-white p-4 border border-slate-100 rounded-lg">
              {/* Invoice Header */}
              <div className="text-center pb-5 border-b border-slate-200">
                <img src="/thangam_logo.png" alt="Thangam Hospital Logo" className="w-12 h-12 object-contain mx-auto mb-2" />
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
                    <p className="text-[9px] text-muted-foreground font-bold uppercase mb-1">Attached Lab Diagnostic Scan(s)</p>
                    <div className="flex flex-col gap-2">
                      {(() => {
                        let resolvedField = settledInvoice.lab_test_image;
                        if (resolvedField === "stored_locally") {
                          resolvedField = typeof window !== 'undefined' ? localStorage.getItem(`hospital_scan_images_${settledInvoice.name}`) : "";
                        }
                        if (!resolvedField) return null;
                        
                        if (resolvedField.startsWith("{")) {
                          try {
                            const parsed = JSON.parse(resolvedField);
                            return Object.entries(parsed).map(([test, src]) => (
                              src && (
                                <div key={test} className="space-y-1">
                                  <p className="text-[9px] font-semibold text-slate-500">{test}</p>
                                  <img src={src} alt={test} className="max-h-24 rounded border border-slate-200 object-contain bg-white mx-auto" />
                                </div>
                              )
                            ));
                          } catch (e) {
                            return null;
                          }
                        } else {
                          return <img src={resolvedField} alt="Lab Report" className="max-h-24 rounded border border-slate-200 object-contain bg-white mx-auto" />;
                        }
                      })()}
                    </div>
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
                      <span className="font-medium">₹{settledInvoice.labFee || getLabFee(settledInvoice.lab_test_name)}</span>
                    </div>
                  )}
                  {settledInvoice.need_medicines === 1 && (
                    <>
                      <div className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-600">Pharmacy Medication Package</span>
                        <span className="font-medium">₹{settledInvoice.pharmacy_bill_amount || 0}</span>
                      </div>
                      {settledInvoice.dispensed_medicines && settledInvoice.dispensed_medicines.length > 0 && (
                        <div className="pl-3 pr-1 space-y-1 py-1 text-[11px] text-slate-500">
                          {settledInvoice.dispensed_medicines.map((med, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>- {med.medicine_name} (x{med.qty}) @ ₹{med.price || 0}/ea</span>
                              <span>₹{(med.qty * (med.price || 0)).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between py-1 border-t border-slate-100 text-slate-600 mt-1">
                    <span>Gross Total</span>
                    <span className="font-medium">₹{settledInvoice.grandTotal}</span>
                  </div>
                  {settledInvoice.deptAlreadyPaid > 0 && (
                    <div className="flex justify-between py-1 text-emerald-700 bg-emerald-50 px-1 rounded text-xs font-semibold">
                      <span>Already Paid at Dept. Level</span>
                      <span>− ₹{settledInvoice.deptAlreadyPaid}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
                    <span>{settledInvoice.netBalance === 0 ? "Balance Due (Fully Settled)" : "Balance Collected at Billing"}</span>
                    <span>₹{settledInvoice.netBalance ?? settledInvoice.grandTotal}</span>
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
                onClick={handleDownloadPDF}
                className="h-9 text-sm bg-teal-600 hover:bg-teal-700 text-white gap-1.5 font-semibold shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
              <Button 
                onClick={handlePrintInvoice}
                className="h-9 text-sm bg-slate-900 hover:bg-slate-800 text-white gap-1.5 font-semibold shadow-sm"
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
      ) : (
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
                {pendingBilling.map((item, index) => {
                  const isActive = selectedWalkIn && selectedWalkIn.name === item.name;
                  return (
                    <div
                      key={`${item.name}-${index}`}
                      onClick={() => handleSelectWalkIn(item)}
                      className={`p-4 border-b hover:bg-slate-50 cursor-pointer transition-colors border-l-4 flex items-center gap-3
                        ${isActive ? "border-l-teal-600 bg-teal-50/30" : "border-l-transparent bg-white"}`}
                    >
                      <div className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${isActive ? "bg-teal-600 text-white shadow-sm" : "bg-teal-100 text-teal-700"}`}>
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-slate-950 text-sm truncate">{item.patient_name}</h4>
                          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">Token #{index + 1}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
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
                            <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Attached Lab Report Scan(s)</span>
                            <div className="flex flex-wrap gap-3 mt-1">
                              {(() => {
                                let resolvedField = selectedWalkIn.lab_test_image;
                                if (resolvedField === "stored_locally") {
                                  resolvedField = typeof window !== 'undefined' ? localStorage.getItem(`hospital_scan_images_${selectedWalkIn.name}`) : "";
                                }
                                if (!resolvedField) return null;
                                
                                if (resolvedField.startsWith("{")) {
                                  try {
                                    const parsed = JSON.parse(resolvedField);
                                    return Object.entries(parsed).map(([test, src]) => (
                                      src && (
                                        <div key={test} className="space-y-1">
                                          <p className="text-[9px] font-semibold text-slate-500">{test}</p>
                                          <img src={src} alt={test} className="max-h-36 rounded border border-slate-200 object-contain bg-white" />
                                        </div>
                                      )
                                    ));
                                  } catch (e) {
                                    return null;
                                  }
                                } else {
                                  return <img src={resolvedField} alt="Lab Test Attachment" className="max-h-36 rounded border border-slate-200 object-contain bg-white" />;
                                }
                              })()}
                            </div>
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
                    
                    {(() => {
                      const docFee = DOCTOR_FEES[selectedWalkIn.doctor] || 500;
                      const labFee = selectedWalkIn.need_lab_test === 1 ? getLabFee(selectedWalkIn.lab_test_name) : 0;
                      const pharmFee = selectedWalkIn.need_medicines === 1 ? (selectedWalkIn.pharmacy_bill_amount || 0) : 0;
                      const grossTotal = docFee + labFee + pharmFee;

                      // Find dept payments already made for this walk-in
                      const patientDeptPaid = deptPayments
                        .filter(p => p.walkInId === selectedWalkIn.name)
                        .reduce((s, p) => s + (p.amount || 0), 0);
                      const patientDeptPayments = deptPayments.filter(p => p.walkInId === selectedWalkIn.name);
                      const netDue = Math.max(0, grossTotal - patientDeptPaid);

                      return (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between text-slate-600">
                            <span>Consultation Fee ({selectedWalkIn.doctor})</span>
                            <span>₹{docFee}</span>
                          </div>

                          {selectedWalkIn.need_lab_test === 1 && (
                            <div className="flex justify-between text-slate-600">
                              <span>Lab Test Fee ({selectedWalkIn.lab_test_name})</span>
                              <span>₹{labFee}</span>
                            </div>
                          )}

                          {selectedWalkIn.need_medicines === 1 && (
                            <>
                              <div className="flex justify-between text-slate-600 font-semibold">
                                <span>Pharmacy Dispensed Package</span>
                                <span>₹{pharmFee}</span>
                              </div>
                              {selectedWalkIn.dispensed_medicines && selectedWalkIn.dispensed_medicines.length > 0 && (
                                <div className="pl-4 pr-1 space-y-1.5 pt-1 pb-1">
                                  {selectedWalkIn.dispensed_medicines.map((med, idx) => (
                                    <div key={idx} className="flex justify-between text-xs text-slate-500">
                                      <span>- {med.medicine_name} (x{med.qty}) @ ₹{med.price || 0}/ea</span>
                                      <span>₹{(med.qty * (med.price || 0)).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          )}

                          <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-100">
                            <span>Gross Total</span>
                            <span>₹{grossTotal}</span>
                          </div>

                          {patientDeptPaid > 0 && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-emerald-700 font-semibold bg-emerald-50 px-2 py-1.5 rounded border border-emerald-100">
                                <span className="flex items-center gap-1.5">
                                  <BadgeCheck className="w-3.5 h-3.5" />
                                  Already Paid at Dept. Level
                                </span>
                                <span>− ₹{patientDeptPaid.toLocaleString("en-IN")}</span>
                              </div>
                              {patientDeptPayments.map((p) => (
                                <div key={p.id} className="flex justify-between text-xs text-emerald-600 pl-6">
                                  <span>{p.department}: {p.description}</span>
                                  <span>− ₹{p.amount.toLocaleString("en-IN")}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className={`flex justify-between font-bold text-base pt-3 border-t border-slate-200 ${netDue === 0 ? "text-emerald-600" : "text-slate-900"}`}>
                            <span>{netDue === 0 ? "✓ Fully Paid — Balance Due" : "Balance Due"}</span>
                            <span>₹{netDue.toLocaleString("en-IN")}</span>
                          </div>
                        </div>
                      );
                    })()}
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
      )}

      {/* Department Payments Tracker */}
      {deptPayments.length > 0 && (
        <div className="space-y-3 mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Department-Level Payments Received
            </h3>
            <div className="flex gap-4 text-xs">
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-semibold">
                Collected ₹{deptPayments.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString("en-IN")}
              </span>
              <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                Due ₹{Math.max(0, pendingBilling.reduce((s, q) => {
                  const docFee = DOCTOR_FEES[q.doctor] || 500;
                  const labFee = q.need_lab_test === 1 ? getLabFee(q.lab_test_name) : 0;
                  const pharmFee = q.need_medicines === 1 ? (q.pharmacy_bill_amount || 0) : 0;
                  const gross = docFee + labFee + pharmFee;
                  const paid = deptPayments.filter(p => p.walkInId === q.name).reduce((a, p) => a + (p.amount || 0), 0);
                  return s + Math.max(0, gross - paid);
                }, 0)).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                  <th className="text-right px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deptPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 text-slate-500">{pay.date}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-slate-800">{pay.patientName}</p>
                      <p className="text-slate-400">{pay.mobile}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                        pay.department === "Consultation" ? "bg-indigo-50 text-indigo-700" :
                        pay.department === "Lab" ? "bg-purple-50 text-purple-700" :
                        "bg-pink-50 text-pink-700"
                      }`}>{pay.department}</span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-[180px] truncate" title={pay.description}>{pay.description}</td>
                    <td className="px-4 py-2.5 text-slate-500">{pay.method}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-600">₹{(pay.amount || 0).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-semibold text-[11px]">
                        <BadgeCheck className="w-3 h-3" /> Paid
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
