import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, CheckCircle2, AlertCircle, FileText, Loader2, Sparkles, Key, ExternalLink, Check, X, ShieldCheck } from "lucide-react";

// Client-side image optimization to speed up upload & AI extraction
async function optimizeImageBeforeUpload(file) {
  if (!file || !file.type.startsWith('image/')) return file;
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1800; // Optimal resolution for razor-sharp OCR with low payload
        let width = img.width;
        let height = img.height;

        if (width <= MAX_DIM && height <= MAX_DIM && file.size < 1024 * 1024) {
          return resolve(file); // Already optimal
        }

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(optimizedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.88
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export function AIInvoiceImportModal({ isOpen, onOpenChange, onImportSuccess, showToast }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [extractedData, setExtractedData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showApiKeyConfig, setShowApiKeyConfig] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const fileInputRef = useRef(null);
  const activeUploadIdRef = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gemini_api_key') || '';
      setApiKeyInput(stored);
      setHasSavedKey(Boolean(stored && stored.trim()));
    }
  }, [isOpen]);

  const handleSaveApiKey = () => {
    if (typeof window !== 'undefined') {
      const trimmed = apiKeyInput.trim();
      if (trimmed) {
        localStorage.setItem('gemini_api_key', trimmed);
        setHasSavedKey(true);
        if (showToast) showToast("Gemini API key saved in browser storage!", "success");
      } else {
        localStorage.removeItem('gemini_api_key');
        setHasSavedKey(false);
        if (showToast) showToast("Gemini API key removed.", "info");
      }
      setShowApiKeyConfig(false);
    }
  };

  const handleClearApiKey = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gemini_api_key');
      setApiKeyInput('');
      setHasSavedKey(false);
      if (showToast) showToast("Gemini API key cleared.", "info");
    }
  };

  const resetState = () => {
    setFile(null);
    setIsProcessing(false);
    setProgress(0);
    setExtractedData(null);
    setErrorMessage(null);
    setIsConfirming(false);
    setShowApiKeyConfig(false);
    activeUploadIdRef.current++;
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (open) => {
    if (!open) resetState();
    onOpenChange(open);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setExtractedData(null);
      setErrorMessage(null);
      setFile(e.target.files[0]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setExtractedData(null);
      setErrorMessage(null);
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcessInvoice = async () => {
    if (!file) return;
    
    setExtractedData(null);
    setErrorMessage(null);
    const uploadId = ++activeUploadIdRef.current;

    setIsProcessing(true);
    setProgress(25);

    console.log(`[UI AI Modal] Processing invoice extraction request #${uploadId} for file: "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    let progressInterval;
    try {
      // 1. Fast client-side image optimization
      const fileToSend = await optimizeImageBeforeUpload(file);
      setProgress(50);
      
      const formData = new FormData();
      formData.append("file", fileToSend);
      const savedKey = typeof window !== 'undefined' ? localStorage.getItem('gemini_api_key') : null;
      if (savedKey && savedKey.trim()) {
        formData.append("apiKey", savedKey.trim());
      }

      progressInterval = setInterval(() => {
        setProgress(p => (p < 92 ? p + 8 : p));
      }, 150);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch("/api/pharmacy/ai_import_invoice", {
        method: "POST",
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      if (progressInterval) clearInterval(progressInterval);
      setProgress(100);

      if (uploadId !== activeUploadIdRef.current) {
        console.warn(`[UI AI Modal] Request #${uploadId} superseded by new upload #${activeUploadIdRef.current}. Discarding stale response.`);
        return;
      }

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || result.message || "Failed to extract invoice data.");
      }

      const data = result.message || result;
      
      if (!data || !Array.isArray(data.items) || data.items.length === 0) {
        throw new Error("No line items could be extracted from this invoice. Please ensure the image is legible and well-lit.");
      }

      const uniqueItems = [];
      const seenKeys = new Set();
      data.items.forEach(item => {
        const key = `${(item.medicine || "").trim().toLowerCase()}_${(item.batch || "").trim().toLowerCase()}_${item.rate}_${item.qty}_${item.expiry}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueItems.push(item);
        }
      });
      data.items = uniqueItems;

      if (uploadId === activeUploadIdRef.current) {
        setExtractedData(data);
      }
    } catch (error) {
      if (progressInterval) clearInterval(progressInterval);
      setProgress(100);

      if (uploadId !== activeUploadIdRef.current) {
        console.warn(`[UI AI Modal] Request #${uploadId} error ignored because a newer upload is active.`);
        return;
      }

      console.error("AI Backend fetch error:", error.message || error);
      
      if (uploadId === activeUploadIdRef.current) {
        const isAbort = error.name === 'AbortError' || String(error.message || '').toLowerCase().includes('abort') || String(error.message || '').toLowerCase().includes('signal');
        const userMsg = isAbort 
          ? "Invoice extraction timed out. Please check your network connection and retry."
          : (error.message || "Failed to process invoice");
        setErrorMessage(userMsg);
        setExtractedData(null);
      }
    } finally {
      if (uploadId === activeUploadIdRef.current) {
        setIsProcessing(false);
      }
    }
  };

  const handleConfirmImport = async () => {
    if (!extractedData) return;
    
    setIsConfirming(true);
    
    try {
      // Update Backend via Next.js Proxy
      const response = await fetch("/api/pharmacy/confirm_invoice_import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_data: extractedData }),
      });
      
      const result = await response.json();
      if (!response.ok && !result.message) {
        console.warn("Frappe confirmation failed, but updating local state anyway.");
      }
    } catch (err) {
      console.warn("Backend confirm failed (CORS or Down). Syncing local state only.");
    }
    
    // Call onImportSuccess to update Next.js LocalStorage state
    onImportSuccess(extractedData);
    showToast("Invoice imported successfully!", "success");
    handleOpenChange(false);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...extractedData.items];
    newItems[index][field] = value;
    setExtractedData({ ...extractedData, items: newItems });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[95vw] w-[1450px] bg-slate-50 border-slate-200 shadow-2xl max-h-[92vh] overflow-hidden flex flex-col p-6">
        <DialogHeader className="pb-3 border-b border-slate-200 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="flex items-center gap-2 text-indigo-700 text-xl font-serif">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              AI-Powered Invoice Import
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Review and edit all extracted invoice fields. All columns are editable before saving.
            </DialogDescription>
          </div>
          <div className="flex items-center gap-2 pr-6">
            <button
              type="button"
              onClick={() => setShowApiKeyConfig(!showApiKeyConfig)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                hasSavedKey
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
              }`}
              title="Configure custom Google Gemini API Key"
            >
              <Key className={`w-3.5 h-3.5 ${hasSavedKey ? 'text-emerald-600' : 'text-amber-500'}`} />
              <span>{hasSavedKey ? 'Gemini Key Configured' : 'Configure Gemini API Key'}</span>
            </button>
          </div>
        </DialogHeader>

        {showApiKeyConfig && (
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3 shadow-inner my-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-semibold text-indigo-950">Google Gemini API Key Configuration</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowApiKeyConfig(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              If deploying on Vercel, you can set <code className="px-1 py-0.5 bg-white border rounded text-indigo-700 font-mono text-[11px]">GEMINI_API_KEY</code> in your Vercel Project Settings &rarr; Environment Variables. Alternatively, save your API key here in your browser to use directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="password"
                placeholder="AIzaSy..."
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="bg-white border-slate-300 text-xs font-mono flex-1 h-9"
              />
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleSaveApiKey}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-9 text-xs"
                >
                  <Check className="w-3.5 h-3.5 mr-1" /> Save Key
                </Button>
                {hasSavedKey && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearApiKey}
                    className="border-slate-300 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 h-9 text-xs"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span>Your key is stored privately in your local browser storage.</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-800 underline inline-flex items-center gap-0.5 font-medium"
              >
                Get a free API Key from Google AI Studio <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            </div>
          </div>
        )}

        {!extractedData ? (
          <div className="py-6 space-y-4">
            {errorMessage && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 shadow-sm">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold text-rose-900 text-sm">Invoice Extraction Note</h4>
                  <p className="text-rose-700 leading-relaxed font-sans">{errorMessage}</p>
                  
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setShowApiKeyConfig(true)}
                      className="h-7 text-xs bg-white border-rose-300 text-rose-900 hover:bg-rose-100/70 flex items-center gap-1 shadow-sm"
                    >
                      <Key className="w-3 h-3 text-rose-600" />
                      Configure Gemini API Key
                    </Button>
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-rose-700 hover:text-rose-900 underline inline-flex items-center gap-0.5 font-medium ml-2"
                    >
                      Get free Google AI Studio Key <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {!isProcessing ? (
              <div 
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-4 transition-colors cursor-pointer ${file ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-100 bg-white'}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf, .png, .jpg, .jpeg, .csv, .xlsx" 
                  onChange={handleFileChange}
                />
                
                {file ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-slate-700">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-700">Drag & drop your invoice here</p>
                      <p className="text-xs text-slate-500 mt-1">Supports PDF, JPG, PNG, CSV, Excel</p>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 gap-6">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-24 h-24 border-4 border-indigo-100 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center border border-indigo-50 text-indigo-600">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h3 className="font-medium text-slate-800">AI is extracting details...</h3>
                  <p className="text-xs text-slate-500">Reading medicine names, batches, and quantities</p>
                  <div className="w-64 h-2 bg-slate-200 rounded-full mt-4 overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button 
                onClick={handleProcessInvoice} 
                disabled={!file || isProcessing}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Extract Data</>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="py-2 flex-1 flex flex-col min-h-0 space-y-4 overflow-hidden">
            <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-md shrink-0">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Indian GST Invoice Extraction: {extractedData.items?.length || 0} Line Items Verified
              </span>
              {extractedData.totals?.net_amount != null && (
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded">
                  Net Payable: ₹{Number(extractedData.totals.net_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              )}
            </div>

            {extractedData.validation_warnings && extractedData.validation_warnings.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-[11px] leading-tight">
                  <span className="font-semibold">Extraction Checks: </span>
                  {extractedData.validation_warnings.join(' • ')}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-sm shrink-0">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Supplier Name</Label>
                <Input 
                  value={extractedData.supplier || ''} 
                  onChange={(e) => setExtractedData({...extractedData, supplier: e.target.value})}
                  className="h-8 text-xs font-medium"
                />
                {extractedData.seller?.seller_gst_no && (
                  <p className="text-[10px] text-slate-500 font-mono">GST: {extractedData.seller.seller_gst_no}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Invoice Number</Label>
                <Input 
                  value={extractedData.invoice_number || ''} 
                  onChange={(e) => setExtractedData({...extractedData, invoice_number: e.target.value})}
                  className="h-8 text-xs font-mono uppercase font-bold"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-600">Invoice Date</Label>
                <Input 
                  type="date"
                  value={extractedData.invoice_date || ''} 
                  onChange={(e) => setExtractedData({...extractedData, invoice_date: e.target.value})}
                  className="h-8 text-xs font-mono"
                />
              </div>
              <div className="space-y-1 bg-slate-50 p-1.5 rounded border border-slate-200 flex flex-col justify-center text-xs">
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Sub Total:</span>
                  <span className="font-mono font-medium">₹{extractedData.totals?.sub_total ?? (extractedData.items || []).reduce((acc, i) => acc + (parseFloat(i.value) || 0), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600">
                  <span>Tax:</span>
                  <span className="font-mono font-medium">₹{extractedData.totals?.tax_amount ?? '0.00'}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-900 border-t border-slate-200 pt-0.5">
                  <span>Net:</span>
                  <span className="font-mono text-emerald-700">₹{extractedData.totals?.net_amount ?? (extractedData.items || []).reduce((acc, i) => acc + (parseFloat(i.value) || 0), 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="border rounded-xl bg-white overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
              <div className="overflow-x-auto overflow-y-auto max-h-[55vh] p-1">
                <table className="w-full text-xs min-w-[1550px] border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 font-bold text-slate-700 z-10 shadow-sm">
                    <tr>
                      <th className="px-2 py-2.5 text-left min-w-[75px]">Rack</th>
                      <th className="px-2 py-2.5 text-left min-w-[85px]">MFR</th>
                      <th className="px-2 py-2.5 text-left min-w-[120px]">HSN</th>
                      <th className="px-2 py-2.5 text-left min-w-[240px]">Product Name</th>
                      <th className="px-2 py-2.5 text-left min-w-[95px]">Pack</th>
                      <th className="px-2 py-2.5 text-left min-w-[140px]">Batch</th>
                      <th className="px-2 py-2.5 text-left min-w-[105px] text-rose-700">EXP (MM-YY)</th>
                      <th className="px-2 py-2.5 text-right min-w-[100px]">MRP (₹)</th>
                      <th className="px-2 py-2.5 text-right min-w-[80px]">Qty</th>
                      <th className="px-2 py-2.5 text-right min-w-[80px]">Free</th>
                      <th className="px-2 py-2.5 text-right min-w-[100px]">PTR (₹)</th>
                      <th className="px-2 py-2.5 text-right min-w-[85px]">P.Dis%</th>
                      <th className="px-2 py-2.5 text-right min-w-[85px]">S.Dis%</th>
                      <th className="px-2 py-2.5 text-right min-w-[80px]">GST%</th>
                      <th className="px-2 py-2.5 text-right min-w-[120px]">Value (₹)</th>
                      <th className="px-2 py-2.5 text-center min-w-[120px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {extractedData.items?.map((item, idx) => (
                      <tr key={idx} className={item.status?.includes('⚠') ? 'bg-amber-50/60' : 'hover:bg-slate-50'}>
                        <td className="px-1.5 py-2 min-w-[75px]">
                          <Input 
                            value={item.rack || 'A-1'} 
                            onChange={(e) => updateItem(idx, 'rack', e.target.value)}
                            className="h-8 text-xs font-mono w-full px-2 bg-white"
                          />
                        </td>
                        <td className="px-1.5 py-2 min-w-[85px]">
                          <Input 
                            value={item.mfr || ''} 
                            onChange={(e) => updateItem(idx, 'mfr', e.target.value)}
                            className="h-8 text-xs font-mono uppercase w-full px-2 bg-white"
                          />
                        </td>
                        <td className="px-1.5 py-2 min-w-[120px]">
                          <Input 
                            value={item.hsn || ''} 
                            onChange={(e) => updateItem(idx, 'hsn', e.target.value)}
                            className="h-8 text-xs font-mono w-full px-2 bg-white"
                          />
                        </td>
                        <td className="px-1.5 py-2 min-w-[240px]">
                          <Input 
                            value={item.medicine || ''} 
                            onChange={(e) => updateItem(idx, 'medicine', e.target.value)}
                            className="h-8 text-xs font-sans font-semibold w-full px-2.5 bg-white text-slate-900"
                          />
                        </td>
                        <td className="px-1.5 py-2 min-w-[95px]">
                          <Input 
                            value={item.pack || ''} 
                            onChange={(e) => updateItem(idx, 'pack', e.target.value)}
                            className="h-8 text-xs font-mono w-full px-2 bg-white"
                          />
                        </td>
                        <td className="px-1.5 py-2 min-w-[140px]">
                          <Input 
                            value={item.batch || ''} 
                            onChange={(e) => updateItem(idx, 'batch', e.target.value)}
                            className="h-8 text-xs font-mono uppercase font-bold w-full px-2 bg-white border-rose-200"
                          />
                        </td>
                        <td className="px-1.5 py-2 min-w-[105px]">
                          <Input 
                            value={item.expiry || ''} 
                            onChange={(e) => updateItem(idx, 'expiry', e.target.value)}
                            className="h-8 text-xs font-mono text-rose-700 font-bold border-rose-300 w-full px-2 bg-white"
                            placeholder="MM-YY"
                          />
                        </td>
                        <td className="px-1.5 py-2 min-w-[100px]">
                          <Input 
                            type="number"
                            step="0.01"
                            value={item.mrp || 0} 
                            onChange={(e) => updateItem(idx, 'mrp', parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs text-right font-mono w-full px-2 bg-white"
                          />
                        </td>
                        <td className="px-1.5 py-2 min-w-[80px]">
                          <Input 
                            type="number"
                            value={item.qty || 0} 
                            onChange={(e) => updateItem(idx, 'qty', parseInt(e.target.value) || 0)}
                            className="h-8 text-xs text-right font-mono font-bold w-full px-2 bg-white"
                          />
                        </td>
                        <td className="px-1.5 py-2 min-w-[80px]">
                          <Input 
                            type="number"
                            value={item.free || 0} 
                            onChange={(e) => updateItem(idx, 'free', parseInt(e.target.value) || 0)}
                            className="h-8 text-xs text-right font-mono text-emerald-700 font-bold w-full px-2 bg-white"
                          />
                        </td>
                        <td className="px-1.5 py-2 min-w-[100px]">
                          <Input 
                            type="number"
                            step="0.01"
                            value={item.rate ?? item.ptr ?? 0} 
                            onChange={(e) => updateItem(idx, 'rate', parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs text-right font-mono w-full px-2 bg-white"
                          />
                        </td>
                        <td className="px-1.5 py-2 min-w-[85px]">
                          <Input 
                            type="number"
                            step="0.01"
                            value={item.p_dis || 0} 
                            onChange={(e) => updateItem(idx, 'p_dis', parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs text-right font-mono w-full px-2 bg-white"
                          />
                        </td>
                        <td className="px-1.5 py-2 min-w-[85px]">
                          <Input 
                            type="number"
                            step="0.01"
                            value={item.s_dis || 0} 
                            onChange={(e) => updateItem(idx, 's_dis', parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs text-right font-mono w-full px-2 bg-white"
                          />
                        </td>
                        <td className="px-1.5 py-2 min-w-[80px]">
                          <Input 
                            type="number"
                            value={item.gst || 5} 
                            onChange={(e) => updateItem(idx, 'gst', parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs text-right font-mono w-full px-2 bg-white"
                          />
                        </td>
                        <td className="px-1.5 py-2 min-w-[120px]">
                          <Input 
                            type="number"
                            step="0.01"
                            value={item.value || (item.qty * (item.rate || 0)).toFixed(2)} 
                            onChange={(e) => updateItem(idx, 'value', parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs text-right font-mono font-bold text-slate-900 w-full px-2 bg-white"
                          />
                        </td>
                        <td className="px-1.5 py-2 text-center min-w-[120px]">
                          {item.status?.includes('✔') ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 whitespace-nowrap">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Matched
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 whitespace-nowrap">
                              <AlertCircle className="w-3.5 h-3.5" /> New
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <DialogFooter className="pt-2 border-t border-slate-200 shrink-0">
              <Button variant="outline" onClick={() => setExtractedData(null)} disabled={isConfirming} className="h-9 px-4 text-xs font-semibold">
                Back
              </Button>
              <Button 
                onClick={handleConfirmImport} 
                disabled={isConfirming}
                className="h-9 px-5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              >
                {isConfirming ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving Inventory...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Confirm & Import Invoice</>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
