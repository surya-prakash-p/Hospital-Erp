"use client";

import { useState, useEffect } from "react";
import { Activity, CheckCircle, AlertCircle, Info, Upload, Trash2, ShieldCheck, ZoomIn, Eye, RefreshCw, Sliders } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getQueue } from "@/lib/hospital-service";

const SCAN_TYPES = ["X-Ray (Chest)", "CT Scan (Brain)", "MRI (Spine)", "Ultrasound (Abdomen)", "ECG (Cardiac)"];

export default function RadiologyPage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Active Scan state
  const [selectedPatient, setSelectedPatient] = useState("");
  const [selectedScanType, setSelectedScanType] = useState("X-Ray (Chest)");
  const [scanImage, setScanImage] = useState("");
  const [findings, setFindings] = useState("");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);

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

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) { // 3MB limit
      showToast("Scan image must be smaller than 3MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setScanImage(reader.result);
      showToast("Radiology scan uploaded to Lightbox!", "success");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveScanReport = (e) => {
    e.preventDefault();
    if (!selectedPatient || !findings.trim()) {
      showToast("Please select a patient and enter diagnostic findings", "error");
      return;
    }

    showToast(`Radiology Report for ${selectedScanType} saved successfully!`, "success");
    // Reset Form
    setSelectedPatient("");
    setScanImage("");
    setFindings("");
    setBrightness(100);
    setContrast(100);
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

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Radiology & Medical Imaging</h2>
          <p className="text-muted-foreground mt-1">Review X-Rays, CT Scans, MRIs, and ECG diagnostic reports</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadData} className="gap-1 border-slate-200">
          <RefreshCw className="w-3.5 h-3.5" /> Sync Orders
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Diagnostic report inputs */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-t-4 border-t-indigo-600 shadow-md">
            <CardHeader className="bg-slate-50/50 border-b py-3">
              <CardTitle className="text-base font-serif">Report Entry Form</CardTitle>
              <CardDescription className="text-xs">Record radiologist observations and upload scans.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <form onSubmit={handleSaveScanReport} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="scan-patient" className="text-xs font-semibold text-slate-700">Patient *</Label>
                  <select
                    id="scan-patient"
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                    required
                  >
                    <option value="">Choose Patient...</option>
                    {queue.map(q => (
                      <option key={q.name} value={q.patient_name}>{q.patient_name} ({q.mobile_number})</option>
                    ))}
                    <option value="John Doe">John Doe (Demo Scan)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="scan-type" className="text-xs font-semibold text-slate-700">Scan Modality *</Label>
                  <select
                    id="scan-type"
                    value={selectedScanType}
                    onChange={(e) => setSelectedScanType(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-slate-950"
                  >
                    {SCAN_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* Upload Scan */}
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700 block">Upload Scan Image</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('radiology-image-upload').click()}
                      className="h-9 text-xs border-slate-200 gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Browse Scans
                    </Button>
                    <input
                      id="radiology-image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    {scanImage && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                        <CheckCircle className="w-3.5 h-3.5" /> Loaded
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="scan-findings" className="text-xs font-semibold text-slate-700">Diagnostic Findings *</Label>
                  <textarea
                    id="scan-findings"
                    className="flex min-h-[90px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-slate-950"
                    placeholder="Enter observations e.g. Lungs clear, no active infiltrates..."
                    value={findings}
                    onChange={(e) => setFindings(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9 text-xs font-semibold mt-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Save Diagnostic Report
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Digital Lightbox Viewport */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-950 text-white border-slate-800 shadow-xl overflow-hidden flex flex-col h-[520px]">
            <CardHeader className="bg-slate-900 border-b border-slate-800 py-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-serif text-slate-200">Digital Lightbox Viewport</CardTitle>
                <CardDescription className="text-[10px] text-slate-400">Simulate anatomical scan review and contrast filters.</CardDescription>
              </div>
              <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg text-[10px]">
                <span className="px-2 text-slate-400 font-mono">Zoom: 100%</span>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
              {/* Scan viewport panel */}
              <div className="flex-1 flex items-center justify-center p-6 bg-radial from-slate-900 to-slate-950 relative overflow-hidden">
                {scanImage ? (
                  <div className="relative max-w-full max-h-[300px] rounded-lg overflow-hidden border border-slate-800 shadow-2xl transition-all">
                    <img
                      src={scanImage}
                      alt="Radiology Viewport"
                      style={{
                        filter: `brightness(${brightness}%) contrast(${contrast}%) grayscale(100%)`
                      }}
                      className="object-contain max-h-[300px] transition-all"
                    />
                    {/* Anatomical Marker overlay */}
                    <div className="absolute top-2 left-2 bg-black/60 px-1 py-0.5 rounded text-[8px] font-mono text-slate-300">R</div>
                  </div>
                ) : (
                  <div className="text-center space-y-3 max-w-xs text-slate-500 animate-pulse select-none">
                    <Activity className="w-12 h-12 mx-auto text-slate-700" />
                    <p className="text-xs font-semibold">Lightbox Empty</p>
                    <p className="text-[10px] leading-relaxed">Upload a chest X-Ray, CT scan, or MRI image in the report form to inspect details.</p>
                  </div>
                )}
              </div>

              {/* Viewport Control filters */}
              <div className="bg-slate-900 border-t border-slate-800 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="font-bold uppercase tracking-wider text-[10px]">Viewport Filters</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Brightness</span>
                      <span>{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={brightness}
                      onChange={(e) => setBrightness(e.target.value)}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Contrast</span>
                      <span>{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="150"
                      value={contrast}
                      onChange={(e) => setContrast(e.target.value)}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
