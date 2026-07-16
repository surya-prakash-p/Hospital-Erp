"use client";

import { useState } from "react";
import { ShieldCheck, Plus, CheckCircle, AlertCircle, Info, RefreshCw, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const INITIAL_CLAIMS = [
  { id: "CLM-809", patient: "Surya Prakash", company: "Star Health Insurance", policy: "STAR-IND-9021", amount: 45000, status: "Approved", preauth: "Yes", settlement: 42000 },
  { id: "CLM-810", patient: "Rajesh Kumar", company: "HDFC ERGO", policy: "HDFC-MED-1022", amount: 18000, status: "Pre-Auth Pending", preauth: "Pending", settlement: 0 },
];

export default function InsurancePage() {
  const [claims, setClaims] = useState(INITIAL_CLAIMS);
  const [toasts, setToasts] = useState([]);

  // Form states
  const [patient, setPatient] = useState("");
  const [company, setCompany] = useState("");
  const [policy, setPolicy] = useState("");
  const [amount, setAmount] = useState("");
  const [preauth, setPreauth] = useState("Yes");

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleCreateClaim = (e) => {
    e.preventDefault();
    if (!patient.trim() || !company.trim() || !amount) {
      showToast("Patient, Insurance Company, and Claim Amount are required", "error");
      return;
    }

    const newClaim = {
      id: `CLM-${Math.floor(800 + Math.random() * 200)}`,
      patient: patient.trim(),
      company: company.trim(),
      policy: policy.trim() || "N/A",
      amount: parseFloat(amount),
      status: preauth === "Yes" ? "Pre-Auth Approved" : "Pre-Auth Pending",
      preauth,
      settlement: 0
    };

    setClaims(prev => [newClaim, ...prev]);
    showToast(`Claim successfully filed for ${patient}!`, "success");

    setPatient("");
    setCompany("");
    setPolicy("");
    setAmount("");
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
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Insurance & Claims Desk</h2>
        <p className="text-muted-foreground mt-1">Submit insurance claims, request pre-authorization, and monitor settlement status</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Claim Form */}
        <Card className="lg:col-span-1 border-t-4 border-t-indigo-600 shadow-md">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-sm font-serif">Submit Claim Request</CardTitle>
            <CardDescription className="text-xs">File a new insurance pre-authorization request.</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleCreateClaim} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="claim-patient" className="text-xs font-semibold">Patient Name *</Label>
                <Input
                  id="claim-patient"
                  placeholder="e.g. John Doe"
                  value={patient}
                  onChange={(e) => setPatient(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="claim-company" className="text-xs font-semibold">Insurance Company *</Label>
                <Input
                  id="claim-company"
                  placeholder="e.g. Star Health Insurance"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="claim-policy" className="text-xs font-semibold">Policy Details ID</Label>
                  <Input
                    id="claim-policy"
                    placeholder="e.g. STAR-IND-102"
                    value={policy}
                    onChange={(e) => setPolicy(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="claim-amount" className="text-xs font-semibold">Estimated Amount *</Label>
                  <Input
                    id="claim-amount"
                    type="number"
                    placeholder="₹"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="claim-preauth" className="text-xs font-semibold">Pre-Authorization Status</Label>
                <select
                  id="claim-preauth"
                  value={preauth}
                  onChange={(e) => setPreauth(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
                >
                  <option value="Yes">Yes (Approved)</option>
                  <option value="Pending">Pending (Pre-Auth Requested)</option>
                </select>
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9 text-xs font-semibold mt-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Submit Claim Request
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Claims Timeline List */}
        <Card className="lg:col-span-2 shadow-xs border-slate-200">
          <CardHeader className="bg-slate-50 border-b py-3">
            <CardTitle className="text-base font-serif">Insurance Settlement Board</CardTitle>
            <CardDescription className="text-xs">Monitor recent pre-authorization claims and payouts.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y text-xs">
              <div className="grid grid-cols-5 px-6 py-2.5 font-bold text-slate-500 bg-slate-50/60 uppercase tracking-wider">
                <div>Claim ID / Patient</div>
                <div>Company & Policy</div>
                <div>Claim Amount</div>
                <div className="text-center">Pre-Auth status</div>
                <div className="text-right">Settled Amount</div>
              </div>
              {claims.map((claim) => (
                <div key={claim.id} className="grid grid-cols-5 px-6 py-4 items-center hover:bg-slate-50/20 transition-colors">
                  <div className="font-semibold text-slate-800">
                    {claim.patient}
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{claim.id}</span>
                  </div>
                  <div className="text-slate-600 font-medium">
                    {claim.company}
                    <span className="text-[10px] text-slate-400 block font-normal mt-0.5">{claim.policy}</span>
                  </div>
                  <div className="text-slate-600 font-bold">₹{claim.amount.toLocaleString()}</div>
                  <div className="text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                      claim.status.includes("Approved") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100 animate-pulse"
                    }`}>
                      {claim.status}
                    </span>
                  </div>
                  <div className="text-right font-bold text-emerald-600">
                    {claim.settlement > 0 ? `₹${claim.settlement.toLocaleString()}` : "₹0 (Pending)"}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
