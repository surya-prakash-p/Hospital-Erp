"use client";

import React, { useState } from "react";
import { Pill, PlusCircle, AlertTriangle, ExternalLink, RefreshCw, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PharmacyStockManager({ data, onRestockExecuted, onActionClick }) {
  const [restockQtyMap, setRestockQtyMap] = useState({});
  const [loadingMed, setLoadingMed] = useState(null);

  if (!data || !data.medicines) return null;

  const handleRestock = async (medName) => {
    const qty = restockQtyMap[medName] || 100;
    setLoadingMed(medName);

    try {
      const res = await fetch("/api/copilot/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "restock_medicine",
          payload: { medicineName: medName, restockQty: qty }
        })
      });
      const result = await res.json();
      onRestockExecuted?.(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMed(null);
    }
  };

  return (
    <Card className="border-slate-200 shadow-md rounded-2xl overflow-hidden my-4">
      <CardHeader className="py-3 px-5 bg-slate-50 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Pill className="w-4 h-4 text-pink-500" />
          {data.title || "Pharmacy Inventory & Restock Manager"}
        </CardTitle>
        <span className="text-[10px] font-bold bg-pink-50 text-pink-700 px-2.5 py-0.5 rounded-full border border-pink-100">
          {data.medicines.length} Medicines Flagged
        </span>
      </CardHeader>

      <CardContent className="p-0 overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider border-b">
            <tr>
              <th className="px-4 py-3">Medicine Name</th>
              <th className="px-4 py-3">Batch & Supplier</th>
              <th className="px-4 py-3">Current Stock</th>
              <th className="px-4 py-3">Reorder Level</th>
              <th className="px-4 py-3">Expiry Date</th>
              <th className="px-4 py-3 text-right">Quick Restock Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.medicines.map((med, idx) => (
              <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-bold text-slate-900 block">{med.name}</span>
                  <span className="text-[10px] text-slate-400">Unit Price: ₹{med.price}/ea</span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <span className="block font-mono text-[11px]">{med.batch_number}</span>
                  <span className="text-[10px] text-slate-400">{med.supplier}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`font-extrabold px-2.5 py-1 rounded-full text-[11px] inline-block ${
                    med.status.includes("Low") 
                      ? "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse" 
                      : "bg-amber-50 text-amber-800 border border-amber-200"
                  }`}>
                    {med.current_stock} Units
                  </span>
                </td>
                <td className="px-4 py-3 font-semibold text-slate-700">{med.reorder_level} Units</td>
                <td className="px-4 py-3 font-mono text-slate-600">{med.exp_date}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Input
                      type="number"
                      placeholder="Qty"
                      defaultValue={100}
                      onChange={(e) => setRestockQtyMap({ ...restockQtyMap, [med.name]: e.target.value })}
                      className="w-16 h-7 text-xs text-center"
                    />
                    <Button
                      size="sm"
                      disabled={loadingMed === med.name}
                      onClick={() => handleRestock(med.name)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-[11px] font-bold px-3 gap-1 shadow-sm"
                    >
                      {loadingMed === med.name ? <RefreshCw className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                      Restock
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data.quick_actions && (
          <div className="p-3 bg-slate-50 border-t flex gap-2 justify-end">
            {data.quick_actions.map((act, i) => (
              <Button
                key={i}
                size="sm"
                variant="outline"
                onClick={() => onActionClick?.(act)}
                className="h-8 text-xs font-semibold text-slate-700 border-slate-200 bg-white hover:bg-slate-100"
              >
                {act.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
