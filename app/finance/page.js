"use client";

import { useState, useEffect } from "react";
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  PlusCircle, 
  DollarSign, 
  Calendar, 
  Tag, 
  CreditCard, 
  Search, 
  Trash2, 
  RefreshCw, 
  Printer, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Layers
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getQueue } from "@/lib/hospital-service";

const MOCK_FINANCE_ENTRIES = [];

export default function FinancePage() {
  const [queue, setQueue] = useState([]);
  const [customTx, setCustomTx] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  
  // Form state
  const [newTx, setNewTx] = useState({
    title: "",
    type: "Expense",
    category: "Salary",
    amount: "",
    method: "UPI",
    date: new Date().toISOString().split("T")[0],
    notes: ""
  });

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    loadAllFinanceData();
  }, []);

  async function loadAllFinanceData() {
    setLoading(true);
    try {
      // Load completed queue patients
      const q = await getQueue();
      setQueue(q.filter(item => item.payment_received === 1));

      // Load custom transactions from local storage
      const stored = localStorage.getItem("hospital_custom_finance");
      if (stored) {
        setCustomTx(JSON.parse(stored));
      } else {
        localStorage.setItem("hospital_custom_finance", JSON.stringify(MOCK_FINANCE_ENTRIES));
        setCustomTx(MOCK_FINANCE_ENTRIES);
      }
    } catch (e) {
      showToast("Error loading finance records", "error");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Handle transaction recording
  const handleRecordTransaction = (e) => {
    e.preventDefault();
    if (!newTx.title.trim() || !newTx.amount || parseFloat(newTx.amount) <= 0) {
      showToast("Please provide a valid Title and Amount", "error");
      return;
    }

    const txEntry = {
      id: "tx-" + Date.now(),
      title: newTx.title.trim(),
      type: newTx.type,
      category: newTx.category,
      amount: parseFloat(newTx.amount),
      method: newTx.method,
      date: newTx.date,
      notes: newTx.notes.trim()
    };

    const updated = [txEntry, ...customTx];
    setCustomTx(updated);
    localStorage.setItem("hospital_custom_finance", JSON.stringify(updated));

    // Reset Form
    setNewTx({
      title: "",
      type: "Expense",
      category: "Salary",
      amount: "",
      method: "UPI",
      date: new Date().toISOString().split("T")[0],
      notes: ""
    });

    showToast("Transaction noted successfully!", "success");
  };

  // Handle transaction deletion
  const handleDeleteTransaction = (id) => {
    const updated = customTx.filter(tx => tx.id !== id);
    setCustomTx(updated);
    localStorage.setItem("hospital_custom_finance", JSON.stringify(updated));
    showToast("Transaction entry deleted", "info");
  };

  // Combine clinical revenue and custom transactions
  const allTransactions = [...customTx].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Compute metrics from customTx
  const totalClinicalIncome = customTx
    .filter(tx => tx.type === "Income" && tx.category === "Clinical Services")
    .reduce((acc, tx) => acc + tx.amount, 0);

  const totalCustomIncome = customTx
    .filter(tx => tx.type === "Income" && tx.category !== "Clinical Services")
    .reduce((acc, tx) => acc + tx.amount, 0);
  
  const totalRevenue = totalClinicalIncome + totalCustomIncome;
  const totalExpenses = customTx.filter(tx => tx.type === "Expense").reduce((acc, tx) => acc + tx.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  // Filtered transactions for the display ledger
  const filteredTransactions = allTransactions.filter(tx => {
    const matchesSearch = tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          tx.method.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "All" || tx.type === typeFilter;
    const matchesCategory = categoryFilter === "All" || tx.category === categoryFilter;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  // Calculate payment method share
  const paymentMethodsCounts = allTransactions.reduce((acc, tx) => {
    acc[tx.method] = (acc[tx.method] || 0) + tx.amount;
    return acc;
  }, {});

  const printSummaryReport = () => {
    const printWindow = window.open("", "_blank", "width=850,height=900");
    printWindow.document.write(`
      <html>
        <head>
          <title>Thangam Hospital - Financial Ledger</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            body { font-family: sans-serif; padding: 40px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
          </style>
        </head>
        <body>
          <div class="text-center pb-6 border-b">
            <img src="/thangam_logo.png" alt="Thangam Hospital Logo" class="h-12 object-contain mx-auto mb-2" />
            <h1 class="text-2xl font-bold text-slate-800">THANGAM HOSPITAL</h1>
            <p class="text-xs text-slate-500">Financial Ledger Summary Statement</p>
            <p class="text-[10px] text-slate-400">Date: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="grid grid-cols-3 gap-4 my-8">
            <div class="border p-4 rounded text-center">
              <span class="text-xs font-semibold text-slate-400 block uppercase">Total Revenue</span>
              <span class="text-lg font-bold text-slate-800">₹${totalRevenue.toLocaleString()}</span>
            </div>
            <div class="border p-4 rounded text-center">
              <span class="text-xs font-semibold text-slate-400 block uppercase">Total Expenses</span>
              <span class="text-lg font-bold text-rose-600">₹${totalExpenses.toLocaleString()}</span>
            </div>
            <div class="border p-4 rounded text-center">
              <span class="text-xs font-semibold text-slate-400 block uppercase">Net Profit</span>
              <span class="text-lg font-bold text-emerald-600">₹${netProfit.toLocaleString()}</span>
            </div>
          </div>
          
          <h2 class="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Transaction Flow</h2>
          <table>
            <thead>
              <tr class="bg-slate-50 text-left text-xs font-bold text-slate-500">
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Category</th>
                <th>Method</th>
                <th class="text-right">Amount</th>
              </tr>
            </thead>
            <tbody class="text-xs">
              ${filteredTransactions.map(tx => `
                <tr>
                  <td>${tx.date}</td>
                  <td class="font-semibold">${tx.title}</td>
                  <td class="${tx.type === 'Income' ? 'text-emerald-600' : 'text-rose-600'} font-bold">${tx.type}</td>
                  <td>${tx.category}</td>
                  <td>${tx.method}</td>
                  <td class="text-right font-bold">₹${tx.amount.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
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
  };

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

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Finance Ledger</h2>
          <p className="text-muted-foreground mt-1">Manage, note, and view revenues, expenses and profits for Thangam Hospital.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadAllFinanceData} className="gap-1 text-xs h-9 border-slate-200">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={printSummaryReport} className="gap-1 text-xs h-9 border-slate-200">
            <Printer className="w-3.5 h-3.5" />
            Print Summary
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6 w-full animate-pulse mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-24 bg-slate-200/80 rounded-xl" />
            <div className="h-24 bg-slate-200/80 rounded-xl" />
            <div className="h-24 bg-slate-200/80 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-[400px] lg:col-span-2 bg-slate-200/60 rounded-xl" />
            <div className="h-[400px] lg:col-span-1 bg-slate-200/60 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Summary Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Revenue */}
            <Card className="border-l-4 border-l-indigo-500 shadow-xs relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Gross Revenue</p>
                    <h3 className="text-2xl font-bold font-serif text-slate-900 mt-2">₹{totalRevenue.toLocaleString()}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <span className="font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">₹{totalClinicalIncome.toLocaleString()}</span> from clinical billings
                    </p>
                  </div>
                  <div className="p-2 bg-indigo-50 text-indigo-500 rounded-lg">
                    <ArrowUpRight className="w-5 h-5" />
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none">
                  <Wallet className="w-24 h-24 text-indigo-500" />
                </div>
              </CardContent>
            </Card>

            {/* Total Expenses */}
            <Card className="border-l-4 border-l-rose-500 shadow-xs relative overflow-hidden">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Expenditures</p>
                    <h3 className="text-2xl font-bold font-serif text-slate-900 mt-2">₹{totalExpenses.toLocaleString()}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Includes staff salaries, restocking & utilities.
                    </p>
                  </div>
                  <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
                    <ArrowDownRight className="w-5 h-5" />
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none">
                  <ArrowDownRight className="w-24 h-24 text-rose-500" />
                </div>
              </CardContent>
            </Card>

            {/* Net Profit */}
            <Card className={`border-l-4 ${netProfit >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'} shadow-xs relative overflow-hidden`}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Operating Profit</p>
                    <h3 className={`text-2xl font-bold font-serif ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'} mt-2`}>
                      ₹{netProfit.toLocaleString()}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Margin: {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%
                    </p>
                  </div>
                  <div className={`p-2 ${netProfit >= 0 ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'} rounded-lg`}>
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 translate-x-2 translate-y-2 opacity-5 pointer-events-none">
                  <TrendingUp className="w-24 h-24 text-slate-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            {/* Ledger Table (Left side) */}
            <Card className="lg:col-span-2 flex flex-col h-[580px]">
              <CardHeader className="bg-slate-50 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-6 shrink-0">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-500" />
                    Transaction Ledger
                  </CardTitle>
                  <CardDescription className="text-xs">Search and inspect all financial activities.</CardDescription>
                </div>
                
                {/* Filters */}
                <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                  <div className="relative shrink-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <Input 
                      placeholder="Search description..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-[150px] pl-8 h-8 text-[11px]"
                    />
                  </div>
                  <select 
                    value={typeFilter} 
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="h-8 border border-input rounded-md px-2 text-[11px] bg-white focus:outline-none"
                  >
                    <option value="All">All Types</option>
                    <option value="Income">Incomes Only</option>
                    <option value="Expense">Expenses Only</option>
                  </select>
                  <select 
                    value={categoryFilter} 
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-8 border border-input rounded-md px-2 text-[11px] bg-white focus:outline-none"
                  >
                    <option value="All">All Categories</option>
                    <option value="Clinical Services">Clinical Services</option>
                    <option value="Salary">Salary</option>
                    <option value="Medical Supplies">Medical Supplies</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Ambulance">Ambulance</option>
                    <option value="Rent">Rent</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </CardHeader>
              
              <CardContent className="p-0 overflow-y-auto flex-1">
                <div className="min-w-full divide-y divide-slate-200">
                  <div className="bg-slate-50/70 grid grid-cols-12 px-6 py-2.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider border-b">
                    <div className="col-span-2">Date</div>
                    <div className="col-span-4">Description</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-2">Payment</div>
                    <div className="col-span-2 text-right">Amount</div>
                  </div>
                  
                  <div className="divide-y divide-slate-200 bg-white">
                    {filteredTransactions.map((tx, idx) => {
                      const isPatient = tx.id.startsWith("tx-consult-") || tx.id.startsWith("tx-lab-") || tx.id.startsWith("tx-pharm-") || tx.id.startsWith("tx-billing-");
                      return (
                        <div key={tx.id || idx} className="grid grid-cols-12 px-6 py-3 items-center text-xs hover:bg-slate-50/50 transition-colors">
                          <div className="col-span-2 text-slate-500 font-mono text-[10px]">{tx.date}</div>
                          <div className="col-span-4 pr-3">
                            <span className="font-semibold text-slate-900 block truncate" title={tx.title}>{tx.title}</span>
                            <span className="text-[10px] text-slate-400 block truncate" title={tx.notes}>{tx.notes}</span>
                          </div>
                          <div className="col-span-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium border
                              ${tx.category === "Clinical Services" ? "bg-teal-50 text-teal-700 border-teal-100" : ""}
                              ${tx.category === "Salary" ? "bg-purple-50 text-purple-700 border-purple-100" : ""}
                              ${tx.category === "Medical Supplies" ? "bg-amber-50 text-amber-700 border-amber-100" : ""}
                              ${tx.category === "Utilities" ? "bg-orange-50 text-orange-700 border-orange-100" : ""}
                              ${tx.category === "Maintenance" ? "bg-sky-50 text-sky-700 border-sky-100" : ""}
                              ${tx.category === "Ambulance" ? "bg-rose-50 text-rose-700 border-rose-100" : ""}
                              ${tx.category === "Rent" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : ""}
                              ${tx.category === "Others" ? "bg-slate-50 text-slate-700 border-slate-100" : ""}`}
                            >
                              {tx.category}
                            </span>
                          </div>
                          <div className="col-span-2 text-slate-600 font-medium flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {tx.method}
                          </div>
                          <div className="col-span-2 text-right flex items-center justify-end gap-2.5">
                            <span className={`font-bold text-sm ${tx.type === "Income" ? "text-emerald-600" : "text-rose-600"}`}>
                              {tx.type === "Income" ? "+" : "-"}₹{tx.amount.toLocaleString()}
                            </span>
                            {!isPatient ? (
                              <button 
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition-colors"
                                title="Delete record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <div className="w-7 h-7 shrink-0" /> // spacer for delete button alignment
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {filteredTransactions.length === 0 && (
                      <div className="text-center text-muted-foreground py-20 text-xs">
                        No transactions matches filters.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Note Transaction Form (Right side) */}
            <Card className="lg:col-span-1 h-[580px] flex flex-col">
              <CardHeader className="bg-slate-50 border-b py-4 px-6 shrink-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                  Note Transaction
                </CardTitle>
                <CardDescription className="text-xs">Log a manual expense or income flow here.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 overflow-y-auto flex-1">
                <form onSubmit={handleRecordTransaction} className="space-y-4">
                  {/* Title */}
                  <div className="space-y-1">
                    <Label htmlFor="tx-title" className="text-xs font-semibold block mb-1.5">Description / Title *</Label>
                    <Input 
                      id="tx-title" 
                      placeholder="e.g. Rent Payment, Vendor Purchase" 
                      value={newTx.title}
                      onChange={(e) => setNewTx(prev => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Flow Type */}
                  <div className="space-y-1">
                    <Label htmlFor="tx-type" className="text-xs font-semibold block mb-1.5">Transaction Type *</Label>
                    <select 
                      id="tx-type"
                      value={newTx.type}
                      onChange={(e) => {
                        const typeVal = e.target.value;
                        setNewTx(prev => ({ 
                          ...prev, 
                          type: typeVal,
                          // auto set category defaults based on type
                          category: typeVal === "Income" ? "Rent" : "Salary" 
                        }));
                      }}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="Expense">Expense (Outflow)</option>
                      <option value="Income">Income (Inflow)</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <Label htmlFor="tx-category" className="text-xs font-semibold block mb-1.5">Category *</Label>
                    <select 
                      id="tx-category"
                      value={newTx.category}
                      onChange={(e) => setNewTx(prev => ({ ...prev, category: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {newTx.type === "Expense" ? (
                        <>
                          <option value="Salary">Salary</option>
                          <option value="Medical Supplies">Medical Supplies</option>
                          <option value="Utilities">Utilities</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Ambulance">Ambulance</option>
                          <option value="Others">Others</option>
                        </>
                      ) : (
                        <>
                          <option value="Rent">Rent</option>
                          <option value="Others">Others</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Amount */}
                    <div className="space-y-1">
                      <Label htmlFor="tx-amount" className="text-xs font-semibold block mb-1.5">Amount (₹) *</Label>
                      <Input 
                        id="tx-amount" 
                        type="number"
                        min="1"
                        placeholder="e.g. 5000" 
                        value={newTx.amount}
                        onChange={(e) => setNewTx(prev => ({ ...prev, amount: e.target.value }))}
                        required
                      />
                    </div>

                    {/* Method */}
                    <div className="space-y-1">
                      <Label htmlFor="tx-method" className="text-xs font-semibold block mb-1.5">Payment Method *</Label>
                      <select 
                        id="tx-method"
                        value={newTx.method}
                        onChange={(e) => setNewTx(prev => ({ ...prev, method: e.target.value }))}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="UPI">UPI</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <Label htmlFor="tx-date" className="text-xs font-semibold block mb-1.5">Transaction Date *</Label>
                    <Input 
                      id="tx-date" 
                      type="date"
                      value={newTx.date}
                      onChange={(e) => setNewTx(prev => ({ ...prev, date: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Remarks */}
                  <div className="space-y-1">
                    <Label htmlFor="tx-notes" className="text-xs font-semibold block mb-1.5">Remarks / Notes</Label>
                    <textarea 
                      id="tx-notes"
                      placeholder="Optional notes or description details..."
                      rows="2"
                      value={newTx.notes}
                      onChange={(e) => setNewTx(prev => ({ ...prev, notes: e.target.value }))}
                      className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9">
                    Add Transaction Flow
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
