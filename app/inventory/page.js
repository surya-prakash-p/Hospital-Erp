"use client";

import { useState } from "react";
import { Box, Plus, CheckCircle, AlertCircle, Info, RefreshCw, ShoppingBag, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const INITIAL_ITEMS = [
  { id: "INV-501", name: "Surgical Gloves (Box of 100)", category: "Consumable", qty: 45, alertLimit: 20, price: 650, vendor: "Synergy Med" },
  { id: "INV-502", name: "IV Infusion Pump Set", category: "Equipment", qty: 8, alertLimit: 5, price: 12500, vendor: "CureTech India" },
  { id: "INV-503", name: "Syringes 5ml (Box of 50)", category: "Consumable", qty: 12, alertLimit: 15, price: 350, vendor: "Synergy Med" }, // low stock
];

export default function InventoryPage() {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [toasts, setToasts] = useState([]);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Consumable");
  const [qty, setQty] = useState("");
  const [alertLimit, setAlertLimit] = useState("");
  const [price, setPrice] = useState("");
  const [vendor, setVendor] = useState("");

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!name.trim() || !qty || !price || !vendor.trim()) {
      showToast("Item Name, Quantity, Price, and Vendor are required", "error");
      return;
    }

    const newItem = {
      id: `INV-${Math.floor(500 + Math.random() * 50)}`,
      name: name.trim(),
      category,
      qty: parseInt(qty),
      alertLimit: alertLimit ? parseInt(alertLimit) : 10,
      price: parseFloat(price),
      vendor: vendor.trim()
    };

    setItems(prev => [newItem, ...prev]);
    showToast(`${name} added to hospital inventory catalog!`, "success");

    setName("");
    setQty("");
    setAlertLimit("");
    setPrice("");
    setVendor("");
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

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Logistics & Equipment Inventory</h2>
        <p className="text-muted-foreground mt-1">Monitor consumables stock alerts, medical equipment logs, and purchase orders</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Entry Form */}
        <Card className="lg:col-span-1 border-t-4 border-t-indigo-600 shadow-md">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-sm font-serif">Add Stock Catalog</CardTitle>
            <CardDescription className="text-xs">Add new surgical items, consumables, or equipment.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="inv-name" className="text-xs font-semibold">Item Name *</Label>
                <Input
                  id="inv-name"
                  placeholder="e.g. IV Infusion Tubing"
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

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9 text-xs font-semibold mt-2">
                <ShoppingBag className="w-3.5 h-3.5" /> Save Item to Catalog
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Inventory listing */}
        <Card className="lg:col-span-2 shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-base font-serif">Clinical Stock Inventory List</CardTitle>
            <CardDescription className="text-xs">Monitor current consumable volumes and equipment catalog.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-xs">
              <div className="grid grid-cols-5 px-6 py-2.5 font-bold text-slate-500 bg-slate-50/60 uppercase tracking-wider">
                <div>Item ID / Description</div>
                <div>Category</div>
                <div>Stock Status</div>
                <div>Vendor Source</div>
                <div className="text-right">Unit Price</div>
              </div>
              {items.map((item) => {
                const isLow = item.qty <= item.alertLimit;
                return (
                  <div key={item.id} className="grid grid-cols-5 px-6 py-4 items-center hover:bg-slate-50/20 transition-colors">
                    <div className="font-semibold text-slate-800">
                      {item.name}
                      <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{item.id}</span>
                    </div>
                    <div className="text-slate-600 font-medium">{item.category}</div>
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
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
