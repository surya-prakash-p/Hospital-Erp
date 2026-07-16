"use client";

import { useState, useEffect } from "react";
import { FlaskConical, CheckCircle, AlertCircle, Info, Activity, Save, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getQueue, updateWalkIn } from "@/lib/hospital-service";

export default function LabPage() {
  const [queue, setQueue] = useState([]);
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [labResult, setLabResult] = useState("");
  const [labImage, setLabImage] = useState("");
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
        showToast("Error loading lab queue", "error");
        console.error(err);
      }
    }
    loadData();
  }, []);

  const handleSelectWalkIn = (item) => {
    setSelectedWalkIn(item);
    setLabResult(item.lab_result || "");
    setLabImage(item.lab_test_image || "");
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB Limit
      showToast("Image size must be less than 2MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLabImage(reader.result);
      showToast("Lab report image uploaded & processed!", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitResult = async (e) => {
    e?.preventDefault();
    if (!selectedWalkIn) {
      showToast("Please select a patient from the queue", "error");
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

      await updateWalkIn(selectedWalkIn.name, {
        lab_result: labResult.trim(),
        lab_test_image: labImage,
        lab_test_status: "Completed",
        appointment_status: nextStatus
      });

      showToast(`Lab results recorded! Patient routed to ${nextStatus}`, "success");

      // Reload queue and clear select state
      const updatedQueue = await getQueue();
      setQueue(updatedQueue);
      setSelectedWalkIn(null);
      setLabResult("");
      setLabImage("");
    } catch (err) {
      showToast(err.message || "Failed to update lab results", "error");
      console.error(err);
    }
  };

  const pendingTests = queue.filter((q) => q.appointment_status === "Lab Test");

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
                {pendingTests.map((item) => {
                  const isActive = selectedWalkIn && selectedWalkIn.name === item.name;
                  return (
                    <div
                      key={item.name}
                      onClick={() => handleSelectWalkIn(item)}
                      className={`p-4 border-b hover:bg-slate-50 cursor-pointer transition-colors border-l-4 
                        ${isActive ? "border-l-purple-600 bg-purple-50/30" : "border-l-transparent bg-white"}`}
                    >
                      <div>
                        <h4 className="font-semibold text-slate-950 text-sm">{item.patient_name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.mobile_number} | Assigned: {item.doctor}
                        </p>
                        <div className="mt-2 text-xs font-semibold text-purple-700 bg-purple-50/80 border border-purple-100 px-2 py-0.5 rounded w-fit">
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
                      <span className="font-semibold text-slate-900">Ordered Test: </span>
                      <span className="font-mono text-purple-700 font-bold">{selectedWalkIn.lab_test_name || "Diagnostic Panel"}</span>
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

                  {/* Premium Image Upload Area */}
                  <div className="space-y-2">
                    <Label className="font-semibold flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-purple-500" />
                      Attach Test Report Image (Optional)
                    </Label>
                    
                    {!labImage ? (
                      <div 
                        className="border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-xl p-6 bg-slate-50/50 hover:bg-purple-50/10 cursor-pointer transition-all duration-200 flex flex-col items-center justify-center group relative min-h-[120px]"
                        onClick={() => document.getElementById('file-upload-input').click()}
                      >
                        <Upload className="w-8 h-8 text-slate-400 group-hover:text-purple-500 group-hover:scale-110 transition-all duration-300" />
                        <span className="text-sm font-semibold text-slate-700 mt-2">Click to Upload Diagnostic Scan</span>
                        <span className="text-[10px] text-slate-400 mt-1">PNG, JPG, or GIF (max. 2MB)</span>
                        <input
                          id="file-upload-input"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    ) : (
                      <div className="relative group border border-slate-200 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center p-2 min-h-[120px]">
                        <img
                          src={labImage}
                          alt="Lab Test Preview"
                          className="max-h-[140px] rounded-lg shadow-sm object-contain bg-white"
                        />
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => document.getElementById('file-upload-input').click()}
                            className="bg-white text-slate-900 rounded-lg p-2 text-xs font-semibold shadow hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => setLabImage("")}
                            className="bg-rose-600 text-white rounded-lg p-2 text-xs font-semibold shadow hover:bg-rose-700 transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
                        <input
                          id="file-upload-input"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
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
    </div>
  );
}
