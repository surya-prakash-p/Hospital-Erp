"use client";

import { useState, useEffect } from "react";
import { FlaskConical, CheckCircle, AlertCircle, Info, Activity, Save, Upload, Image as ImageIcon, Trash2, Printer, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getQueue, updateWalkIn, getLabTests, saveInvoiceToProfile } from "@/lib/hospital-service";
import { jsPDF } from "jspdf";

export default function LabPage() {
  const [queue, setQueue] = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [labResult, setLabResult] = useState("");
  const [labImages, setLabImages] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
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
        const tests = await getLabTests();
        setLabTests(tests || []);
      } catch (err) {
        showToast("Error loading lab queue", "error");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSelectWalkIn = (item) => {
    setSelectedWalkIn(item);
    setLabResult(item.lab_result || "");
    
    // Resolve stored locally references
    let resolvedField = item.lab_test_image;
    if (resolvedField === "stored_locally") {
      resolvedField = typeof window !== 'undefined' ? localStorage.getItem(`hospital_scan_images_${item.name}`) : "";
    }
    
    // Parse resolvedField as a JSON string of test-to-image mapping
    try {
      if (resolvedField && resolvedField.startsWith("{")) {
        setLabImages(JSON.parse(resolvedField));
      } else {
        // Fallback: if it's a single image, set it to the first selected test
        const tests = item.lab_test_name ? item.lab_test_name.split(",").map(t => t.trim()).filter(Boolean) : [];
        if (tests.length > 0 && resolvedField) {
          setLabImages({ [tests[0]]: resolvedField });
        } else {
          setLabImages({});
        }
      }
    } catch (e) {
      setLabImages({});
    }

    if (item.lab_test_name) {
      const tests = item.lab_test_name.split(",").map(t => t.trim()).filter(Boolean);
      setSelectedTests(tests);
    } else {
      setSelectedTests([]);
    }
  };

  const handleSubmitResult = async (e) => {
    e?.preventDefault();
    if (!selectedWalkIn) {
      showToast("Please select a patient from the queue", "error");
      return;
    }

    if (selectedTests.length === 0) {
      showToast("Please select at least one lab test", "error");
      return;
    }

    if (!labResult.trim()) {
      showToast("Lab test result cannot be empty", "error");
      return;
    }

    try {
      showToast("Saving lab results...", "info");

      // Determine next queue status
      const nextStatus = selectedWalkIn.need_medicines === 1 ? "Pharmacy" : "Billing";
      const testNamesStr = selectedTests.join(", ");

      await updateWalkIn(selectedWalkIn.name, {
        lab_result: labResult.trim(),
        lab_test_image: JSON.stringify(labImages),
        lab_test_status: "Completed",
        appointment_status: nextStatus,
        lab_test_name: testNamesStr
      });

      // Save lab invoice to profile automatically on stage completion
      const totalFee = selectedTests.reduce((sum, name) => {
        const testObj = labTests.find(t => t.test_name === name);
        return sum + (testObj?.fee || 450);
      }, 0);

      saveInvoiceToProfile(selectedWalkIn.mobile_number, {
        name: `Lab Diagnostics - ${testNamesStr}`,
        bill_amount: totalFee,
        payment_method: "UPI",
        walkinData: {
          name: selectedWalkIn.name,
          patient_name: selectedWalkIn.patient_name,
          mobile_number: selectedWalkIn.mobile_number,
          doctor: selectedWalkIn.doctor,
          docFee: 0,
          labFee: totalFee,
          pharmacy_bill_amount: 0,
          need_lab_test: 1,
          lab_test_name: testNamesStr,
          deptAlreadyPaid: 0,
          netBalance: totalFee,
          paymentMethod: "UPI"
        }
      });

      // Save all uploaded report scans to the patient's profile documents
      Object.entries(labImages).forEach(([testName, base64Str]) => {
        if (base64Str) {
          saveInvoiceToProfile(selectedWalkIn.mobile_number, {
            name: `Lab Report Scan - ${testName}`,
            bill_amount: 0,
            type: "report",
            image: base64Str
          });
        }
      });

      showToast(`Lab results recorded! Patient routed to ${nextStatus}`, "success");

      // Reload queue and clear select state
      const updatedQueue = await getQueue();
      setQueue(updatedQueue);
      setSelectedWalkIn(null);
      setLabResult("");
      setLabImages({});
      setSelectedTests([]);
    } catch (err) {
      showToast(err.message || "Failed to update lab results", "error");
      console.error(err);
    }
  };

  const handlePrintLabInvoice = () => {
    if (!selectedWalkIn) return;
    if (selectedTests.length === 0) {
      showToast("Please select at least one lab test", "error");
      return;
    }
    
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
      doc.text("Phone: +91 422 2345678 | Email: billing@thangam.org", 105, posY, { align: "center" });
      posY += 8;

      // Line separator
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(20, posY, 190, posY);
      posY += 8;

      // Invoice Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(147, 51, 234); // purple-600
      doc.text("LABORATORY DIAGNOSTIC INVOICE", 20, posY);
      posY += 8;

      // Meta Info Table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Visit/Walk-in ID:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(selectedWalkIn.name, 50, posY);

      doc.setFont("helvetica", "bold");
      doc.text("Patient Name:", 115, posY);
      doc.setFont("helvetica", "normal");
      doc.text(selectedWalkIn.patient_name || "", 145, posY);
      posY += 6;

      doc.setFont("helvetica", "bold");
      doc.text("Date & Time:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleString(), 50, posY);

      doc.setFont("helvetica", "bold");
      doc.text("Mobile Number:", 115, posY);
      doc.setFont("helvetica", "normal");
      doc.text(selectedWalkIn.mobile_number || "", 145, posY);
      posY += 8;

      // Line separator
      doc.line(20, posY, 190, posY);
      posY += 8;

      // Doctor
      doc.setFont("helvetica", "bold");
      doc.text("Consulting Doctor:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(selectedWalkIn.doctor || "General OPD", 55, posY);
      posY += 8;

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

      // Print tests
      let grandTotal = 0;
      doc.setFont("helvetica", "normal");
      selectedTests.forEach(testName => {
        const testObj = labTests.find(t => t.test_name === testName);
        const testFee = testObj?.fee || 450;
        grandTotal += testFee;

        doc.text(`Lab Test: ${testName}`, 22, posY);
        doc.text("1", 120, posY, { align: "center" });
        doc.text(`INR ${testFee.toFixed(2)}`, 145, posY, { align: "right" });
        doc.text(`INR ${testFee.toFixed(2)}`, 185, posY, { align: "right" });
        posY += 7;
      });

      // Totals Area
      posY += 3;
      doc.line(20, posY, 190, posY);
      posY += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("GRAND TOTAL (LAB DIAGNOSTICS):", 105, posY);
      doc.text(`INR ${grandTotal.toFixed(2)}`, 185, posY, { align: "right" });
      posY += 12;

      // Stamp
      doc.setDrawColor(147, 51, 234); // purple-600
      doc.setLineWidth(0.8);
      doc.rect(75, posY, 60, 12);
      doc.setTextColor(147, 51, 234);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("LAB DIAGNOSTICS INVOICED", 105, posY + 7, { align: "center" });
      posY += 20;

      // Footer
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Generated digitally via Thangam Hospital Lab Desk. No signature required.", 105, posY + 10, { align: "center" });

      // Print instead of download
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);

      showToast("Lab invoice opened for printing!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to print invoice", "error");
    }
  };

  const handleMarkLabPayment = () => {
    if (!selectedWalkIn) return;
    if (selectedTests.length === 0) {
      showToast("Please select at least one lab test", "error");
      return;
    }
    const testNamesStr = selectedTests.join(", ");
    const totalFee = selectedTests.reduce((sum, name) => {
      const testObj = labTests.find(t => t.test_name === name);
      return sum + (testObj?.fee || 450);
    }, 0);
    const now = Date.now();

    // Save to dept payments log
    const storedPayments = localStorage.getItem("hospital_dept_payments");
    const deptPayments = storedPayments ? JSON.parse(storedPayments) : [];
    deptPayments.unshift({
      id: `dp-lab-${now}`,
      walkInId: selectedWalkIn.name,
      patientName: selectedWalkIn.patient_name,
      mobile: selectedWalkIn.mobile_number,
      department: "Lab",
      description: `Lab Test — ${testNamesStr}`,
      amount: totalFee,
      method: "UPI",
      date: new Date().toISOString().split("T")[0],
      status: "Paid"
    });
    localStorage.setItem("hospital_dept_payments", JSON.stringify(deptPayments));

    // Also record in finance ledger
    const storedFinance = localStorage.getItem("hospital_custom_finance");
    const financeEntries = storedFinance ? JSON.parse(storedFinance) : [];
    financeEntries.unshift({
      id: `tx-lab-${now}`,
      title: `Lab Diagnostics — ${selectedWalkIn.patient_name}`,
      type: "Income",
      category: "Clinical Services",
      amount: totalFee,
      method: "UPI",
      date: new Date().toISOString().split("T")[0],
      notes: `Payment received at Lab desk. Tests: ${testNamesStr}. Walk-in: ${selectedWalkIn.name}`
    });
    localStorage.setItem("hospital_custom_finance", JSON.stringify(financeEntries));

    // Save lab invoice to profile
    saveInvoiceToProfile(selectedWalkIn.mobile_number, {
      name: `Lab Diagnostics - ${testNamesStr}`,
      bill_amount: totalFee,
      payment_method: "UPI",
      walkinData: {
        name: selectedWalkIn.name,
        patient_name: selectedWalkIn.patient_name,
        mobile_number: selectedWalkIn.mobile_number,
        doctor: selectedWalkIn.doctor,
        docFee: 0,
        labFee: totalFee,
        pharmacy_bill_amount: 0,
        need_lab_test: 1,
        lab_test_name: testNamesStr,
        deptAlreadyPaid: 0,
        netBalance: totalFee,
        paymentMethod: "UPI"
      }
    });

    showToast(`Payment of ₹${totalFee} received & recorded!`, "success");
  };

  const pendingTests = queue
    .filter((q) => q.appointment_status === "Lab Test")
    .sort((a, b) => new Date(a.creation || 0) - new Date(b.creation || 0));

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
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Lab Station</h2>
          <p className="text-muted-foreground mt-1">Manage and process lab requests</p>
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
                <span>Pending Lab Tests</span>
                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {pendingTests.length} Pending
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto flex-1">
              <div className="divide-y">
                {pendingTests.map((item, index) => {
                  const isActive = selectedWalkIn && selectedWalkIn.name === item.name;
                  return (
                    <div
                      key={`${item.name}-${index}`}
                      onClick={() => handleSelectWalkIn(item)}
                      className={`p-4 border-b hover:bg-slate-50 cursor-pointer transition-colors border-l-4 flex items-center gap-3
                        ${isActive ? "border-l-purple-600 bg-purple-50/30" : "border-l-transparent bg-white"}`}
                    >
                      <div className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${isActive ? "bg-purple-600 text-white shadow-sm" : "bg-purple-100 text-purple-700"}`}>
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-slate-950 text-sm truncate">{item.patient_name}</h4>
                          <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100">Token #{index + 1}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {item.mobile_number} | Doctor: {item.doctor}
                        </p>
                        <div className="mt-1.5 text-xs font-semibold text-purple-700 bg-purple-50/80 border border-purple-100 px-2 py-0.5 rounded w-fit">
                          Test: {item.lab_test_name || "Diagnostic Panel"}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {pendingTests.length === 0 && (
                  <div className="text-center text-muted-foreground py-20 text-sm">
                    No pending lab requests.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results input panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="bg-slate-50 border-b">
              <CardTitle className="text-lg flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-purple-500" />
                Lab Diagnostic Results Entry
              </CardTitle>
              <CardDescription>Enter test values and submit results for clinical diagnosis verification.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {selectedWalkIn ? (
                <form onSubmit={handleSubmitResult} className="space-y-4">
                  {/* Selected Patient Banner */}
                  <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-slate-900">Patient: </span>
                      {selectedWalkIn.patient_name} ({selectedWalkIn.mobile_number})
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">Referrer: </span>
                      <span className="font-mono text-slate-700 font-bold">{selectedWalkIn.doctor}</span>
                    </div>
                  </div>

                  {/* Multi-Test Selector */}
                  <div className="space-y-2 border rounded-xl p-4 bg-slate-50/50">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Select Lab Tests performed</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {labTests.map((t) => {
                        const isChecked = selectedTests.includes(t.test_name);
                        return (
                          <label key={t.test_name} className={`flex items-start gap-2.5 border p-2.5 rounded-lg cursor-pointer transition-all duration-200 ${isChecked ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold shadow-xs' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                if (isChecked) {
                                  setSelectedTests(prev => prev.filter(name => name !== t.test_name));
                                } else {
                                  setSelectedTests(prev => [...prev, t.test_name]);
                                }
                              }}
                              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer mt-0.5"
                            />
                            <div className="text-[11px] leading-tight">
                              <div>{t.test_name}</div>
                              <div className="text-[9px] text-muted-foreground font-normal mt-0.5">₹{t.fee}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-1 bg-amber-50 border border-amber-100 rounded-md p-3 text-xs text-amber-800 flex gap-2">
                    <Info className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <span className="font-semibold">Workflow Alert:</span> Submitting these results will complete the lab request stage and route the patient to the next clinical station.
                    </div>
                  </div>

                  {/* Results Field */}
                  <div className="space-y-2">
                    <Label htmlFor="results" className="font-semibold">Lab Results / Observations *</Label>
                    <textarea
                      id="results"
                      className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-950"
                      placeholder="Input diagnostic values, e.g. Hb: 13.5 g/dL, RBC count: 4.8 million/mcL, or Fasting Sugar: 95 mg/dL..."
                      value={labResult}
                      onChange={(e) => setLabResult(e.target.value)}
                      required
                    />
                  </div>

                  {/* Premium Multiple Image Upload Area */}
                  <div className="space-y-3">
                    <Label className="font-semibold flex items-center gap-1.5 border-b pb-1 text-slate-700 uppercase tracking-wider text-[11px]">
                      <ImageIcon className="w-4 h-4 text-purple-500" />
                      Attach Test Scan Reports (Optional)
                    </Label>
                    
                    <div className="space-y-3">
                      {selectedTests.length > 0 ? (
                        selectedTests.map((testName) => {
                          const testImage = labImages[testName] || "";
                          return (
                            <div key={testName} className="border rounded-lg p-3 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                              <div className="text-xs font-semibold text-slate-800">
                                {testName}
                              </div>
                              
                              <div>
                                {!testImage ? (
                                  <div>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => document.getElementById(`file-upload-input-${testName}`).click()}
                                      className="border-purple-600 text-purple-700 hover:bg-purple-50 text-[11px] h-8 font-medium"
                                    >
                                      <Upload className="w-3.5 h-3.5 mr-1" />
                                      Upload Scan
                                    </Button>
                                    <input
                                      id={`file-upload-input-${testName}`}
                                      type="file"
                                      accept="image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (file.size > 2 * 1024 * 1024) { // 2MB Limit
                                          showToast("Image size must be less than 2MB", "error");
                                          return;
                                        }
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setLabImages(prev => ({ ...prev, [testName]: reader.result }));
                                          showToast(`Scan report for ${testName} uploaded & processed!`, "success");
                                        };
                                        reader.readAsDataURL(file);
                                      }}
                                      className="hidden"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <img
                                          src={testImage}
                                          alt="Lab Test Preview"
                                          className="h-10 w-16 rounded object-cover border border-slate-200 cursor-pointer hover:opacity-85 transition-opacity"
                                        />
                                      </DialogTrigger>
                                      <DialogContent className="max-w-4xl p-1 bg-white/5 border-none shadow-none">
                                        <DialogTitle className="sr-only">Image Preview</DialogTitle>
                                        <img src={testImage} alt="Full Size Report Scan" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setLabImages(prev => {
                                        const copy = { ...prev };
                                        delete copy[testName];
                                        return copy;
                                      })}
                                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1 h-7 text-xs font-semibold"
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-xs text-slate-500 italic">Please select at least one test to upload report scans.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                    <Button
                      type="button"
                      onClick={handlePrintLabInvoice}
                      variant="outline"
                      className="border-purple-600 text-purple-600 hover:bg-purple-50 gap-1.5 h-9 text-sm"
                    >
                      <Printer className="w-4 h-4" />
                      Print Invoice
                    </Button>
                    <Button
                      type="button"
                      onClick={handleMarkLabPayment}
                      variant="outline"
                      className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 gap-1.5 h-9 text-sm"
                    >
                      <BadgeCheck className="w-4 h-4" />
                      Payment Received
                    </Button>
                    <Button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5 h-9 text-sm"
                    >
                      <Save className="w-4 h-4" />
                      Save & Complete Lab Stage
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center text-muted-foreground py-20">
                  <Activity className="w-8 h-8 mx-auto mb-2 text-purple-300 animate-pulse" />
                  Please select a pending lab test request from the queue.
                </div>
              )}
            </CardContent>
          </Card>
          </div>
        </div>
      )}
    </div>
  );
}
