"use client";

import { useState } from "react";
import { Heart, Plus, CheckCircle, AlertCircle, Info, RefreshCw, Droplet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const INITIAL_STOCK = {
  "A+": 12, "A-": 4, "B+": 18, "B-": 6, "AB+": 9, "AB-": 2, "O+": 24, "O-": 8
};

const INITIAL_DONORS = [
  { id: "DON-01", name: "Surya Prakash", group: "O+", phone: "9876543210", date: "2026-07-16" },
  { id: "DON-02", name: "Muthu Vel", group: "A+", phone: "9876543211", date: "2026-07-15" }
];

export default function BloodBankPage() {
  const [stock, setStock] = useState(INITIAL_STOCK);
  const [donors, setDonors] = useState(INITIAL_DONORS);
  const [toasts, setToasts] = useState([]);

  // Form states
  const [donorName, setDonorName] = useState("");
  const [donorGroup, setDonorGroup] = useState("O+");
  const [donorPhone, setDonorPhone] = useState("");
  const [issueGroup, setIssueGroup] = useState("O+");
  const [issueQty, setIssueQty] = useState("");

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleRegisterDonor = (e) => {
    e.preventDefault();
    if (!donorName.trim() || !donorPhone.trim()) {
      showToast("Donor Name and Mobile number are required", "error");
      return;
    }

    const newDon = {
      id: `DON-${Math.floor(10 + Math.random() * 90)}`,
      name: donorName.trim(),
      group: donorGroup,
      phone: donorPhone.trim(),
      date: new Date().toISOString().split("T")[0]
    };

    setDonors(prev => [newDon, ...prev]);
    // Add 1 unit to stock optimistically
    setStock(prev => ({ ...prev, [donorGroup]: prev[donorGroup] + 1 }));
    showToast(`Donor registered! 1 unit added to ${donorGroup} stock.`, "success");

    setDonorName("");
    setDonorPhone("");
  };

  const handleIssueBlood = (e) => {
    e.preventDefault();
    const qty = parseInt(issueQty);
    if (!qty || qty <= 0) {
      showToast("Please enter a valid quantity", "error");
      return;
    }

    if (stock[issueGroup] < qty) {
      showToast(`Insufficient stock of ${issueGroup}. Only ${stock[issueGroup]} units available.`, "error");
      return;
    }

    setStock(prev => ({ ...prev, [issueGroup]: prev[issueGroup] - qty }));
    showToast(`Successfully issued ${qty} units of ${issueGroup}!`, "success");
    setIssueQty("");
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
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Blood Bank Inventory</h2>
        <p className="text-muted-foreground mt-1">Manage blood unit storage capacity, donor registrations, and issues</p>
      </div>

      {/* Grid of Blood Types Stock */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {Object.entries(stock).map(([grp, qty]) => (
          <Card key={grp} className="overflow-hidden border-slate-200 hover:shadow-md transition-all">
            <CardContent className="p-4 flex flex-col items-center justify-between text-center min-h-[90px]">
              <div className="flex items-center justify-center gap-1">
                <Droplet className="w-4 h-4 fill-rose-600 text-rose-600 animate-pulse" />
                <span className="font-bold text-slate-800 text-sm">{grp}</span>
              </div>
              <div className="text-xl font-bold text-slate-700 tracking-tight font-serif mt-2">{qty} Units</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donor Form */}
        <Card className="shadow-md border-t-4 border-t-rose-600">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-sm font-serif">Log Blood Donation</CardTitle>
            <CardDescription className="text-xs">Register donor profile and increase stock.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleRegisterDonor} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="donor-name" className="text-xs font-semibold">Donor Name *</Label>
                <Input
                  id="donor-name"
                  placeholder="e.g. John Doe"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="donor-phone" className="text-xs font-semibold">Mobile Number *</Label>
                <Input
                  id="donor-phone"
                  placeholder="10-digit mobile"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="donor-group" className="text-xs font-semibold">Blood Group *</Label>
                <select
                  id="donor-group"
                  value={donorGroup}
                  onChange={(e) => setDonorGroup(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
                >
                  {Object.keys(stock).map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white gap-1 h-9 text-xs font-semibold mt-2">
                <Plus className="w-3.5 h-3.5" /> Save Donation Log
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Issue Form */}
        <Card className="shadow-md border-t-4 border-t-indigo-600">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-sm font-serif">Issue Blood Units</CardTitle>
            <CardDescription className="text-xs">Deduct blood storage units for patient surgery requirements.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleIssueBlood} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="issue-group" className="text-xs font-semibold">Required Blood Group *</Label>
                <select
                  id="issue-group"
                  value={issueGroup}
                  onChange={(e) => setIssueGroup(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
                >
                  {Object.keys(stock).map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="issue-qty" className="text-xs font-semibold">Volume (Units) *</Label>
                <Input
                  id="issue-qty"
                  type="number"
                  placeholder="e.g. 2"
                  value={issueQty}
                  onChange={(e) => setIssueQty(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-1 h-9 text-xs font-semibold mt-2">
                <CheckCircle className="w-3.5 h-3.5" /> Issue Blood Units
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Donor timeline */}
        <Card className="shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-base font-serif">Recent Donor History</CardTitle>
            <CardDescription className="text-xs">Registry logs of recent local donations.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-xs max-h-[220px] overflow-y-auto">
              {donors.map(don => (
                <div key={don.id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50/20">
                  <div>
                    <p className="font-semibold text-slate-800">{don.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{don.id} | {don.phone}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 font-bold border border-rose-100 text-[10px]">
                    {don.group}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
