"use client";

import { CompactStats } from "@/components/compact-stats";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Box, Plus, CheckCircle, AlertCircle, Info, ShoppingBag,
  ShieldAlert, Calendar, Download, RefreshCw, X
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const INITIAL_ITEMS = [
  { id: "MED-101", name: "Paracetamol 650mg (Strip of 10)", category: "Medicine", qty: 120, alertLimit: 30, price: 32, vendor: "Apex Pharma", batch: "PC-8812", expiryDate: "2027-04-15" },
  { id: "MED-102", name: "Amoxicillin 500mg (Strip of 10)", category: "Medicine", qty: 14, alertLimit: 25, price: 85, vendor: "Cipla Health", batch: "AM-7731", expiryDate: "2026-11-10" },
  { id: "INV-501", name: "Surgical Gloves (Box of 100)", category: "Consumable", qty: 45, alertLimit: 20, price: 650, vendor: "Synergy Med", batch: "SG-2026A", expiryDate: "2027-06-30" },
  { id: "INV-502", name: "IV Infusion Pump Set", category: "Equipment", qty: 8, alertLimit: 5, price: 12500, vendor: "CureTech India", batch: "IV-9921", expiryDate: "2028-12-31" },
  { id: "INV-503", name: "Syringes 5ml (Box of 50)", category: "Consumable", qty: 12, alertLimit: 15, price: 350, vendor: "Synergy Med", batch: "SY-4410", expiryDate: "2026-10-25" },
];

export default function InventoryPage() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [toasts, setToasts] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All"); // "All", "Low Stock", "Expiring"

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Medicine");
  const [qty, setQty] = useState("");
  const [alertLimit, setAlertLimit] = useState("");
  const [price, setPrice] = useState("");
  const [vendor, setVendor] = useState("");
  const [batch, setBatch] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  const nameInputRef = useRef(null);

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const isExpiringSoon = (dateStr) => {
    if (!dateStr) return false;
    const exp = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
    return diffDays <= 60; // Expiring in next 60 days or already expired
  };

  const handleExportCSV = () => {
    const exportData = filteredItems;
    const headers = ["Item ID", "Item Name", "Category", "Batch", "Expiry Date", "Stock Qty", "Alert Limit", "Unit Price", "Vendor", "Stock Status"];
    const rows = exportData.map(item => [
      `"${item.id}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.batch || "N/A"}"`,
      `"${item.expiryDate || "N/A"}"`,
      item.qty,
      item.alertLimit,
      item.price,
      `"${item.vendor.replace(/"/g, '""')}"`,
      item.qty <= item.alertLimit ? "Low Stock" : "Stable"
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inventory_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Inventory exported to CSV successfully! (Alt + D)", "success");
  };

  // Keyboard Shortcuts for Inventory Page
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isAlt = e.altKey;
      const key = e.key;

      if (key === 'Escape') {
        setStatusFilter("All");
        return;
      }

      // Alt + A -> Focus Add Medicine / Item input
      if (isAlt && (key.toLowerCase() === 'a' || key === '+')) {
        e.preventDefault();
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
        showToast("Add Medicine / Item: Enter item name (Alt + A)", "info");
        return;
      }

      // Alt + L -> Toggle Low Stock filter
      if (isAlt && key.toLowerCase() === 'l') {
        e.preventDefault();
        setStatusFilter(prev => {
          const next = prev === "Low Stock" ? "All" : "Low Stock";
          showToast(next === "Low Stock" ? "Filtered: Low Stock Items (Alt + L)" : "Cleared Low Stock filter", "info");
          return next;
        });
        return;
      }

      // Alt + E -> Toggle Expiry filter
      if (isAlt && key.toLowerCase() === 'e') {
        e.preventDefault();
        setStatusFilter(prev => {
          const next = prev === "Expiring" ? "All" : "Expiring";
          showToast(next === "Expiring" ? "Filtered: Expiring Soon Items (Alt + E)" : "Cleared Expiry filter", "info");
          return next;
        });
        return;
      }

      // Alt + D -> Export Inventory CSV
      if (isAlt && key.toLowerCase() === 'd') {
        e.preventDefault();
        handleExportCSV();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items]);

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!name.trim() || !qty || !price || !vendor.trim()) {
      showToast("Item Name, Quantity, Price, and Vendor are required", "error");
      return;
    }

    const isMed = category === "Medicine";
    const newItem = {
      id: `${isMed ? "MED" : "INV"}-${Math.floor(500 + Math.random() * 50)}`,
      name: name.trim(),
      category,
      qty: parseInt(qty),
      alertLimit: alertLimit ? parseInt(alertLimit) : 10,
      price: parseFloat(price),
      vendor: vendor.trim(),
      batch: batch.trim() || `BT-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: expiryDate || "2027-12-31"
    };

    setItems(prev => [newItem, ...prev]);
    showToast(`${name} added to hospital inventory catalog!`, "success");

    setName("");
    setQty("");
    setAlertLimit("");
    setPrice("");
    setVendor("");
    setBatch("");
    setExpiryDate("");
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (statusFilter === "Low Stock") {
        return item.qty <= item.alertLimit;
      }
      if (statusFilter === "Expiring") {
        return isExpiringSoon(item.expiryDate);
      }
      return true;
    });
  }, [items, statusFilter]);

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

      {/* Top Header & Inventory Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-100 p-3 rounded-xl border border-slate-300 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-tight">Hospital Inventory Control</h1>
            <p className="text-xs text-slate-500 font-medium">Manage clinical medicines, batches, consumables, and statutory alert thresholds.</p>
          </div>
        </div>

        {/* Quick Action Buttons with Shortcuts */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              nameInputRef.current?.focus();
              nameInputRef.current?.select();
            }}
            className="px-3 py-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs flex items-center gap-1.5 cursor-pointer transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Medicine</span>
            <span className="text-[9px] bg-indigo-800 text-indigo-100 px-1 rounded font-mono">Alt + A</span>
          </button>

          <button
            type="button"
            onClick={() => {
              const nextStatus = statusFilter === "Low Stock" ? "All" : "Low Stock";
              setStatusFilter(nextStatus);
              showToast(nextStatus === "Low Stock" ? "Filtered: Low Stock Items" : "Cleared Low Stock filter", "info");
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border shadow-2xs flex items-center gap-1.5 cursor-pointer transition ${
              statusFilter === "Low Stock"
                ? "bg-amber-600 text-white border-amber-700 shadow-inner"
                : "bg-white hover:bg-amber-50 text-amber-800 border-amber-300"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
            <span>Low Stock</span>
            <span className={`text-[9px] px-1 rounded font-mono ${
              statusFilter === "Low Stock" ? "bg-amber-800 text-amber-100" : "bg-amber-100 text-amber-800 border border-amber-200"
            }`}>
              Alt + L
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              const nextStatus = statusFilter === "Expiring" ? "All" : "Expiring";
              setStatusFilter(nextStatus);
              showToast(nextStatus === "Expiring" ? "Filtered: Expiring Soon Items" : "Cleared Expiry filter", "info");
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border shadow-2xs flex items-center gap-1.5 cursor-pointer transition ${
              statusFilter === "Expiring"
                ? "bg-rose-600 text-white border-rose-700 shadow-inner"
                : "bg-white hover:bg-rose-50 text-rose-800 border border-rose-300"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-rose-500" />
            <span>Expiry</span>
            <span className={`text-[9px] px-1 rounded font-mono ${
              statusFilter === "Expiring" ? "bg-rose-800 text-rose-100" : "bg-rose-100 text-rose-800 border border-rose-200"
            }`}>
              Alt + E
            </span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export</span>
            <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded font-mono border border-slate-200">
              Alt + D
            </span>
          </button>

          {statusFilter !== "All" && (
            <button
              type="button"
              onClick={() => setStatusFilter("All")}
              className="px-2.5 py-1.5 text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg flex items-center gap-1 cursor-pointer transition"
            >
              <X className="w-3.5 h-3.5 text-slate-600" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      <CompactStats stats={[
        { title: "Total Items", value: items.length },
        { title: "Inventory Valuation", value: `₹${items.reduce((total, item) => total + item.qty * item.price, 0).toLocaleString("en-IN")}` },
        { title: "Low Stock", value: items.filter(item => item.qty > 0 && item.qty <= item.alertLimit).length },
        { title: "Out Of Stock", value: items.filter(item => item.qty === 0).length },
      ]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Entry Form */}
        <Card className="lg:col-span-1 border-t-4 border-t-indigo-600 shadow-md">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-sm font-serif">Add Stock / Medicine Catalog</CardTitle>
            <CardDescription className="text-xs">Add new medications, surgical items, or consumables (Alt + A).</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="inv-name" className="text-xs font-semibold">Medicine / Item Name *</Label>
                <Input
                  id="inv-name"
                  ref={nameInputRef}
                  placeholder="e.g. Paracetamol 650mg"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="inv-category" className="text-xs font-semibold">Category</Label>
                  <select
                    id="inv-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
                  >
                    <option value="Medicine">Medicine</option>
                    <option value="Consumable">Consumable</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Surgical Item">Surgical Item</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-qty" className="text-xs font-semibold">Stock Qty *</Label>
                  <Input
                    id="inv-qty"
                    type="number"
                    placeholder="Units"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="inv-batch" className="text-xs font-semibold">Batch No.</Label>
                  <Input
                    id="inv-batch"
                    placeholder="e.g. BT-9021"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-expiry" className="text-xs font-semibold">Expiry Date</Label>
                  <Input
                    id="inv-expiry"
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="inv-price" className="text-xs font-semibold">Unit Price *</Label>
                  <Input
                    id="inv-price"
                    type="number"
                    placeholder="₹"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="inv-alert" className="text-xs font-semibold">Low Limit Alert</Label>
                  <Input
                    id="inv-alert"
                    type="number"
                    placeholder="e.g. 10"
                    value={alertLimit}
                    onChange={(e) => setAlertLimit(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="inv-vendor" className="text-xs font-semibold">Contracted Vendor *</Label>
                <Input
                  id="inv-vendor"
                  placeholder="e.g. Synergy Med Systems"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9 text-xs font-semibold mt-2 cursor-pointer">
                <ShoppingBag className="w-3.5 h-3.5" /> Save Item to Catalog
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Inventory listing */}
        <Card className="lg:col-span-2 shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50 border-b py-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-serif">Clinical Stock &amp; Medicine Inventory List</CardTitle>
              <CardDescription className="text-xs">
                {statusFilter === "All" && "Showing all active inventory items."}
                {statusFilter === "Low Stock" && "Filtered: Showing only items at or below alert limit (Alt + L)."}
                {statusFilter === "Expiring" && "Filtered: Showing items expiring within 60 days (Alt + E)."}
              </CardDescription>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
              {filteredItems.length} items
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-xs">
              <div className="grid grid-cols-6 px-6 py-2.5 font-bold text-slate-500 bg-slate-50/60 uppercase tracking-wider text-[11px]">
                <div>Item ID / Description</div>
                <div>Category</div>
                <div>Batch / Expiry</div>
                <div>Stock Status</div>
                <div>Vendor Source</div>
                <div className="text-right">Unit Price</div>
              </div>
              {filteredItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No items found matching the selected filter ({statusFilter}).
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.qty <= item.alertLimit;
                  const isExp = isExpiringSoon(item.expiryDate);
                  return (
                    <div key={item.id} className="grid grid-cols-6 px-6 py-3.5 items-center hover:bg-slate-50/40 transition-colors">
                      <div className="font-semibold text-slate-800">
                        {item.name}
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{item.id}</span>
                      </div>
                      <div className="text-slate-600 font-medium">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          item.category === "Medicine" ? "bg-indigo-100 text-indigo-800" : "bg-slate-100 text-slate-700"
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      <div className="text-slate-600">
                        <span className="font-mono text-[11px] block">{item.batch || "N/A"}</span>
                        <span className={`text-[10px] font-medium ${isExp ? "text-rose-600 font-bold" : "text-slate-400"}`}>
                          Exp: {item.expiryDate || "N/A"}
                        </span>
                      </div>
                      <div className="font-semibold">
                        {isLow ? (
                          <span className="text-rose-600 flex items-center gap-0.5 font-bold">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> Low Stock ({item.qty})
                          </span>
                        ) : (
                          <span className="text-emerald-600 flex items-center gap-0.5 font-bold">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" /> Stable ({item.qty})
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 font-medium">{item.vendor}</div>
                      <div className="text-right font-bold text-slate-700">₹{item.price.toLocaleString()}</div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
