"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { 
  Pill, CheckCircle, AlertCircle, Info, Activity, PackageCheck, Plus, Layers, 
  PlusCircle, Printer, ShieldAlert, Search, FileText, Download, 
  Trash2, Eye, ClipboardList, ShoppingCart, DollarSign, Calendar,
  ArrowRight, X, Loader2, ChevronDown, Edit3, Sliders, ShoppingBag, MoreHorizontal, RotateCcw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  getQueue, updateWalkIn, getMedicines, createMedicine, updateMedicine, 
  saveInvoiceToProfile, getDrugRegister, createDrugRegisterEntry, 
  dispenseMedicineFEFO, getPurchaseOrders, createPurchaseOrder, 
  receiveGoods, getMedicineHistory, adjustStock, deactivateMedicine, executeDirectSale, getStockMovementLogs, createPharmacyAuditLog,
  recordFinanceTransaction, executeSalesReturn, getSalesReturns
} from "@/lib/hospital-service";

export default function PharmacyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "dashboard");

  useEffect(() => {
    if (tabParam && ["dashboard", "inventory", "dispensing", "registers", "logistics"].includes(tabParam)) {
      setActiveTab(tabParam);
    } else if (!tabParam) {
      setActiveTab("dashboard");
    }
  }, [tabParam]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    router.push(`/pharmacy?tab=${newTab}`);
  };
  const [medicines, setMedicines] = useState([]);
  const [queue, setQueue] = useState([]);
  const [drugRegister, setDrugRegister] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [medicineHistory, setMedicineHistory] = useState(null);
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  
  // Custom enhanced states
  const [userRole, setUserRole] = useState("Administrator"); // Administrator, Pharmacist, Store Manager
  const [activeMenuMed, setActiveMenuMed] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  
  // Stock Adjustment States
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustingMed, setAdjustingMed] = useState(null);
  const [adjustmentData, setAdjustmentData] = useState({
    medicine: "", batch_number: "", adjustment_type: "Add Stock", quantity: 0, reason: "", remarks: ""
  });

  // Edit Medicine States
  const [showEditMedModal, setShowEditMedModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  
  // Workdesk Dispensation Action Modals
  const [showWorkdeskDeleteModal, setShowWorkdeskDeleteModal] = useState(false);
  const [workdeskDeleteIndex, setWorkdeskDeleteIndex] = useState(null);
  const [workdeskDeleteReason, setWorkdeskDeleteReason] = useState("Doctor Cancelled");

  const [showWorkdeskEditModal, setShowWorkdeskEditModal] = useState(false);
  const [workdeskEditIndex, setWorkdeskEditIndex] = useState(null);
  const [workdeskEditReason, setWorkdeskEditReason] = useState("");
  const [workdeskEditQty, setWorkdeskEditQty] = useState("");

  const [showWorkdeskPartialModal, setShowWorkdeskPartialModal] = useState(false);
  const [workdeskPartialIndex, setWorkdeskPartialIndex] = useState(null);
  const [workdeskPartialQty, setWorkdeskPartialQty] = useState("");

  // OTC Sale States
  const [showOTCSaleModal, setShowOTCSaleModal] = useState(false);
  const [otcCustomerType, setOtcCustomerType] = useState("Walk-in"); // Walk-in, Registered
  const [otcCustomerName, setOtcCustomerName] = useState("");
  const [otcCustomerMobile, setOtcCustomerMobile] = useState("");
  const [otcCustomerAge, setOtcCustomerAge] = useState("");
  const [otcCustomerGender, setOtcCustomerGender] = useState("Male");
  const [otcSearchQuery, setOtcSearchQuery] = useState("");
  const [otcSelectedPatient, setOtcSelectedPatient] = useState(null);
  const [otcBasket, setOtcBasket] = useState([]);
  const [otcPaymentMethod, setOtcPaymentMethod] = useState("Cash");

  // Sales Return (Medicine Return) States
  const [showSalesReturnModal, setShowSalesReturnModal] = useState(false);
  const [salesReturnsList, setSalesReturnsList] = useState([]);
  const [returnItems, setReturnItems] = useState([]);
  const [returnReason, setReturnReason] = useState("Doctor Changed Prescription");
  const [returnMethod, setReturnMethod] = useState("Cash");
  const [returnRestock, setReturnRestock] = useState(true);
  const [returnNotes, setReturnNotes] = useState("");
  const [showReturnReceiptModal, setShowReturnReceiptModal] = useState(false);
  const [latestReturnRecord, setLatestReturnRecord] = useState(null);
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  
  // Direct Return specific inputs
  const [directReturnMed, setDirectReturnMed] = useState(null);
  const [directReturnMedSearch, setDirectReturnMedSearch] = useState("");
  const [directReturnQty, setDirectReturnQty] = useState(10);
  const [directReturnBatch, setDirectReturnBatch] = useState("");
  const [directReturnPrice, setDirectReturnPrice] = useState("");
  const [directReturnReason, setDirectReturnReason] = useState("Doctor Changed Prescription");
  const [directReturnPatient, setDirectReturnPatient] = useState("");
  const [directReturnMobile, setDirectReturnMobile] = useState("");

  // Queue sub-filters
  const [queueSearchQuery, setQueueSearchQuery] = useState("");
  const [queueFilterTab, setQueueFilterTab] = useState("Waiting");

  // Slide-over active tab
  const [detailActiveTab, setDetailActiveTab] = useState("batches");
  const [isMounted, setIsMounted] = useState(false);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [invoiceFilter, setInvoiceFilter] = useState("All");
  const [showImportedInvoicesModal, setShowImportedInvoicesModal] = useState(false);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);

  // Registers Tab filter
  const [selectedRegister, setSelectedRegister] = useState("All Categories");

  // Dispense Form states
  const [dispenseItems, setDispenseItems] = useState([]);
  const [customAddMedName, setCustomAddMedName] = useState("");
  const [customAddQty, setCustomAddQty] = useState(1);
  const [showMedSearchDropdown, setShowMedSearchDropdown] = useState(false);
  const [pharmacistName, setPharmacistName] = useState("Rahul Sharma, RPh");
  const [dispensePaymentMode, setDispensePaymentMode] = useState("Pay at Pharmacy Desk"); // "Pay at Pharmacy Desk" or "Forward to Central Billing"
  const [showDispenseReceiptModal, setShowDispenseReceiptModal] = useState(false);
  const [showDispenseWorkdeskModal, setShowDispenseWorkdeskModal] = useState(false);
  const [showSubmitDispenseModal, setShowSubmitDispenseModal] = useState(false);
  const [selectedSubmitAction, setSelectedSubmitAction] = useState("Pay at Pharmacy Desk"); // "Pay at Pharmacy Desk", "Forward to Central Billing Desk", "Outside Purchase"
  const [latestDispenseRecord, setLatestDispenseRecord] = useState(null);

  // Add Medicine Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMedData, setNewMedData] = useState({
    medicine_name: "", generic_name: "", brand: "", manufacturer: "", strength: "",
    dosage_form: "Tablet", category: "Regular Medicine", min_stock: 50, max_stock: 500,
    reorder_level: 100, rack_location: "Rack A-01", purchase_price: "", selling_price: "", mrp: "", gst: 12.0, hsn_code: "30049099",
    batch_number: "", supplier: "ABC Pharma", mfg_date: "", expiry_date: "", pack_size: 10, no_of_packs: 10, tablets_per_strip: 10,
    invoice_number: "", invoice_date: ""
  });

  // Add Batch to Existing Medicine State
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [addBatchMed, setAddBatchMed] = useState(null);
  const [newBatchData, setNewBatchData] = useState({
    batch_number: "", supplier: "ABC Pharma", mfg_date: "", exp_date: "",
    pack_size: 30, no_of_packs: 10, purchase_price: "", mrp: "", rack_location: "Rack A-01",
    invoice_number: "", invoice_date: ""
  });

  // PO & GRN States
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poSupplier, setPoSupplier] = useState("ABC Pharma");
  const [poItems, setPoItems] = useState([]);
  const [poAddMedName, setPoAddMedName] = useState("");
  const [poAddQty, setPoAddQty] = useState(100);

  const [isGRNModalOpen, setIsGRNModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [grnItems, setGrnItems] = useState([]);
  const [grnAddMedName, setGrnAddMedName] = useState("");
  const [grnAddPackSize, setGrnAddPackSize] = useState(30);
  const [grnAddPacksQty, setGrnAddPacksQty] = useState(10);
  const [grnAddQty, setGrnAddQty] = useState(300);
  const [grnAddPrice, setGrnAddPrice] = useState("");

  // Supplier States
  const [suppliers, setSuppliers] = useState([
    { name: "ABC Pharma", licNo: "DL-COI-90823H", type: "Verified", isNarcotics: false, code: "SUP-1001", status: "Active" },
    { name: "XYZ Distributors", licNo: "DL-COI-12093H", type: "Verified", isNarcotics: false, code: "SUP-1002", status: "Active" },
    { name: "Special Drugs Ltd", licNo: "DL-NDPS-0032A (Narcotic)", type: "Narcotics Lic", isNarcotics: true, code: "SUP-1003", status: "Active" }
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hospital_suppliers');
      if (saved) {
        try {
          setSuppliers(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      localStorage.setItem('hospital_suppliers', JSON.stringify(suppliers));
    }
  }, [suppliers, isMounted]);

  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [editingSupplierIndex, setEditingSupplierIndex] = useState(null);
  const [expandedAdvSection, setExpandedAdvSection] = useState(null); // 'regulatory', 'banking', 'documents', 'performance', or null
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [newSupplierData, setNewSupplierData] = useState({
    supplierName: "",
    supplierCode: "",
    supplierType: "Distributor",
    contactPerson: "",
    mobileNumber: "",
    email: "",
    gstNumber: "",
    drugLicenseNumber: "",
    status: "Active",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    paymentTerms: "Net 30",
    creditLimit: "",
    preferredSupplier: false,
    leadTime: "",
    regulatoryNDPS: "",
    bankName: "",
    bankAccount: "",
    bankIFSC: "",
    documentsUploaded: "",
    performanceSLA: "95%"
  });

  // Purchase Suggestions States
  const [suggSearchQuery, setSuggSearchQuery] = useState("");
  const [suggFilterStatus, setSuggFilterStatus] = useState("All");
  const [suggFilterCategory, setSuggFilterCategory] = useState("All");
  const [suggFilterSupplier, setSuggFilterSupplier] = useState("All");
  const [selectedSuggestions, setSelectedSuggestions] = useState([]);
  const [showPOSuggModal, setShowPOSuggModal] = useState(false);
  const [poSuggItem, setPoSuggItem] = useState(null);
  const [suggMenuMed, setSuggMenuMed] = useState(null);
  const [editedSuggQty, setEditedSuggQty] = useState({});
  
  // New States for Workflow Enhancements
  const [showBulkPOModal, setShowBulkPOModal] = useState(false);
  const [bulkPOItems, setBulkPOItems] = useState([]);
  const [poAddSearch, setPoAddSearch] = useState("");
  const [showExpiringReportModal, setShowExpiringReportModal] = useState(false);
  const [expiringReportTimeframe, setExpiringReportTimeframe] = useState({ type: 'Months', value: 3 });

  const openAddSupplierModal = () => {
    setEditingSupplierIndex(null);
    const nextCode = `SUP-${1000 + suppliers.length + 1}`;
    setNewSupplierData({
      supplierName: "",
      supplierCode: nextCode,
      supplierType: "Distributor",
      contactPerson: "",
      mobileNumber: "",
      email: "",
      gstNumber: "",
      drugLicenseNumber: "",
      status: "Active",
      addressLine1: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      paymentTerms: "Net 30",
      creditLimit: "",
      preferredSupplier: false,
      leadTime: "",
      regulatoryNDPS: "",
      bankName: "",
      bankAccount: "",
      bankIFSC: "",
      documentsUploaded: "",
      performanceSLA: "95%"
    });
    setExpandedAdvSection(null);
    setShowAdvanced(false);
    setIsAddSupplierModalOpen(true);
  };

  const openEditSupplierModal = (index) => {
    setEditingSupplierIndex(index);
    const sup = suppliers[index];
    setNewSupplierData({
      supplierName: sup.name || "",
      supplierCode: sup.code || "",
      supplierType: sup.supplierType || "Distributor",
      contactPerson: sup.contactPerson || "",
      mobileNumber: sup.mobileNumber || "",
      email: sup.email || "",
      gstNumber: sup.gstNumber || "",
      drugLicenseNumber: sup.licNo || "",
      status: sup.status || "Active",
      addressLine1: sup.addressLine1 || "",
      city: sup.city || "",
      state: sup.state || "",
      pincode: sup.pincode || "",
      country: sup.country || "India",
      paymentTerms: sup.paymentTerms || "Net 30",
      creditLimit: sup.creditLimit || "",
      preferredSupplier: sup.preferredSupplier || false,
      leadTime: sup.leadTime || "",
      regulatoryNDPS: sup.regulatoryNDPS || "",
      bankName: sup.bankName || "",
      bankAccount: sup.bankAccount || "",
      bankIFSC: sup.bankIFSC || "",
      documentsUploaded: sup.documentsUploaded || "",
      performanceSLA: sup.performanceSLA || "95%"
    });
    setExpandedAdvSection(null);
    setShowAdvanced(false);
    setIsAddSupplierModalOpen(true);
  };

  const deleteSupplier = (index) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      setSuppliers(prev => prev.filter((_, i) => i !== index));
      showToast("Supplier deleted successfully", "success");
    }
  };
  
  // Loading & Toasts
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  async function loadAllData() {
    try {
      setLoading(true);
      const [meds, q, reg, pos, returns] = await Promise.all([
        getMedicines(),
        getQueue(),
        getDrugRegister(),
        getPurchaseOrders(),
        getSalesReturns()
      ]);
      setMedicines(meds || []);
      setQueue(q || []);
      setDrugRegister(reg || []);
      setPurchaseOrders(pos || []);
      setSalesReturnsList(returns || []);
    } catch (err) {
      showToast("Error loading data from Frappe", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setIsMounted(true);
    loadAllData();
    
    // Always sync with Frappe bench periodically
    const syncInterval = setInterval(() => {
      loadAllData();
    }, 30000);
    
    return () => clearInterval(syncInterval);
  }, []);

  // Update specific details when a medicine is selected
  useEffect(() => {
    if (selectedMedicine) {
      getMedicineHistory(selectedMedicine.medicine_name).then(history => {
        setMedicineHistory(history);
      });
    } else {
      setMedicineHistory(null);
    }
  }, [selectedMedicine, medicines]);

  // Compute Expiry State badge color and name
  const getExpiryAlert = (expDate) => {
    const today = new Date();
    const exp = new Date(expDate);
    const diffMs = exp - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return { label: "Expired", color: "bg-rose-100 text-rose-800 border-rose-200" };
    if (diffDays <= 7) return { label: "Expires in 7d", color: "bg-orange-100 text-orange-800 border-orange-200" };
    if (diffDays <= 30) return { label: "Expires in 30d", color: "bg-amber-100 text-amber-800 border-amber-200" };
    if (diffDays <= 90) return { label: "Expires in 3M", color: "bg-yellow-100 text-yellow-800 border-yellow-200" };
    if (diffDays <= 180) return { label: "Expires in 6M", color: "bg-sky-100 text-sky-800 border-sky-200" };
    return { label: "Stable", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
  };

  // 1. Dashboard Metrics
  const metrics = useMemo(() => {
    // Hide deactivated medicines from dashboard totals unless we count all, but standard is active medicines
    const activeMeds = medicines.filter(m => !m.disabled);
    const totalMeds = activeMeds.length;
    const lowStock = activeMeds.filter(m => m.stock < m.min_stock && m.stock > 0).length;
    const outOfStock = activeMeds.filter(m => m.stock === 0).length;
    
    let expiringCount = 0;
    const today = new Date();
    activeMeds.forEach(m => {
      (m.batches || []).forEach(b => {
        const diffMs = new Date(b.exp_date) - today;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 180) expiringCount++;
      });
    });

    const totalRevenue = drugRegister
      .filter(r => Number(r.quantity) > 0)
      .reduce((acc, r) => {
        const med = activeMeds.find(m => m.medicine_name === r.medicine || m.name === r.medicine);
        const unitPrice = Number(r.price || r.unit_price || r.rate) || Number(med?.selling_price || med?.mrp || 0);
        return acc + (Number(r.quantity) * unitPrice);
      }, 0);

    const todaySalesRevenue = drugRegister
      .filter(r => {
        const d = new Date(r.dispensing_date);
        return Number(r.quantity) > 0 && d.toDateString() === today.toDateString();
      })
      .reduce((acc, r) => {
        const med = activeMeds.find(m => m.medicine_name === r.medicine || m.name === r.medicine);
        const unitPrice = Number(r.price || r.unit_price || r.rate) || Number(med?.selling_price || med?.mrp || 0);
        return acc + (Number(r.quantity) * unitPrice);
      }, 0);

    const todayDispensing = drugRegister.filter(r => {
      const d = new Date(r.dispensing_date);
      return d.toDateString() === today.toDateString();
    }).reduce((acc, curr) => acc + curr.quantity, 0);

    let todayReturnsCount = 0;
    let todayReturnsAmount = 0;
    (salesReturnsList || []).forEach(ret => {
      const d = new Date(ret.return_date || ret.date || ret.creation || Date.now());
      if (d.toDateString() === today.toDateString()) {
        const qty = (ret.items || []).reduce((sum, it) => sum + Number(it.return_qty || 0), 0);
        todayReturnsCount += qty > 0 ? qty : 1;
        todayReturnsAmount += Number(ret.total_refund || 0);
      }
    });

    drugRegister.forEach(r => {
      const d = new Date(r.dispensing_date);
      if (Number(r.quantity) < 0 && d.toDateString() === today.toDateString()) {
        if (!salesReturnsList || salesReturnsList.length === 0) {
          todayReturnsCount += Math.abs(Number(r.quantity));
          const med = activeMeds.find(m => m.medicine_name === r.medicine || m.name === r.medicine);
          const unitPrice = Number(r.price || r.unit_price || r.rate) || Number(med?.selling_price || med?.mrp || 0);
          todayReturnsAmount += Math.abs(Number(r.quantity)) * unitPrice;
        }
      }
    });

    const pendingPOs = purchaseOrders.filter(po => po.status !== "Received").length;
    const inventoryValuation = activeMeds.reduce((acc, m) => acc + ((m.stock || 0) * (m.purchase_price || 0)), 0);

    // Compute Outside Purchases and Partials from walk-in records completed today
    let outsidePurchases = 0;
    let partialDispenses = 0;
    
    queue.forEach(q => {
      const d = new Date(q.modified || q.creation || Date.now());
      if (d.toDateString() === today.toDateString()) {
        const dispensed = q.dispensed_medicines || [];
        dispensed.forEach(item => {
          if (item.source === "Outside Purchase" || item.dispense_status === "Outside Purchase") {
            outsidePurchases += (item.qty || 0);
          }
          if (item.dispense_status === "Partially Dispensed") {
            partialDispenses += 1;
          }
        });
      }
    });

    const pendingPrescriptions = queue.filter(q => q.pharmacy_status !== "Completed" && q.appointment_status !== "Billing" && q.appointment_status !== "Completed" && q.prescription && q.prescription.trim().length > 0).length;

    // Chart Data calculations
    const healthyStock = totalMeds - lowStock - outOfStock;
    const stockStatusData = [
      { name: 'Healthy', value: healthyStock, fill: '#10b981' },
      { name: 'Low', value: lowStock, fill: '#f59e0b' },
      { name: 'Out', value: outOfStock, fill: '#ef4444' }
    ];

    const categoryMap = {};
    activeMeds.forEach(m => {
      const cat = m.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const COLORS = ['#6366f1', '#8b5cf6', '#14b8a6', '#f43f5e', '#f59e0b', '#3b82f6', '#10b981', '#06b6d4'];
    const categoryData = Object.keys(categoryMap).map((name, i) => ({ 
      name, 
      value: categoryMap[name],
      fill: COLORS[i % COLORS.length]
    }));

    // Mock trend using last 7 days of drugRegister
    const trendMap = {};
    const past7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    past7Days.forEach(d => trendMap[d] = 0);
    
    drugRegister.forEach(r => {
      const d = new Date(r.dispensing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (trendMap[d] !== undefined) {
        trendMap[d] += Math.abs(Number(r.quantity) || 0);
      }
    });
    const dispensingTrendData = past7Days.map(date => ({ date, amount: trendMap[date] }));

    return { 
      totalMeds, lowStock, outOfStock, expiringCount, totalRevenue, todaySalesRevenue, todayDispensing,
      todayReturnsCount, todayReturnsAmount,
      pendingPOs, inventoryValuation, outsidePurchases, partialDispenses, pendingPrescriptions,
      stockStatusData, categoryData, dispensingTrendData, activeMeds
    };
  }, [medicines, drugRegister, purchaseOrders, queue, salesReturnsList]);

  // Critical Alerts list derived from real medicine stock and expiry
  const criticalAlerts = useMemo(() => {
    const alerts = [];
    const today = new Date();
    const activeMeds = medicines.filter(m => !m.disabled);

    activeMeds.forEach(med => {
      if (med.stock === 0) {
        alerts.push({
          id: `out-${med.name || med.medicine_name}`,
          type: 'Out of Stock',
          medicine_name: med.medicine_name,
          category: med.category || 'Regular Medicine',
          stock: 0,
          reorder_level: med.reorder_level || med.min_stock || 0,
          date: null
        });
      } else if (med.stock < med.min_stock) {
        alerts.push({
          id: `low-${med.name || med.medicine_name}`,
          type: 'Low Stock',
          medicine_name: med.medicine_name,
          category: med.category || 'Regular Medicine',
          stock: med.stock,
          reorder_level: med.reorder_level || med.min_stock,
          date: null
        });
      }

      (med.batches || []).forEach(b => {
        if (!b.exp_date || b.current_stock <= 0) return;
        const diffMs = new Date(b.exp_date) - today;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= 180) {
          alerts.push({
            id: `exp-${med.name || med.medicine_name}-${b.batch_number}`,
            type: 'Expiring Soon',
            medicine_name: `${med.medicine_name} (${b.batch_number})`,
            category: med.category || 'Regular Medicine',
            stock: b.current_stock,
            reorder_level: null,
            date: b.exp_date,
            diffDays
          });
        }
      });
    });

    return alerts.slice(0, 8);
  }, [medicines]);

  // Recent Medicine Sales from drugRegister
  const recentSales = useMemo(() => {
    return drugRegister
      .filter(r => Number(r.quantity) > 0)
      .sort((a, b) => new Date(b.dispensing_date) - new Date(a.dispensing_date))
      .slice(0, 8)
      .map(r => {
        const med = medicines.find(m => m.medicine_name === r.medicine || m.name === r.medicine);
        const unitPrice = Number(r.price || r.unit_price || r.rate) || Number(med?.selling_price || med?.mrp || 0);
        const amount = Number(r.quantity) * unitPrice;
        return {
          ...r,
          unitPrice,
          amount
        };
      });
  }, [drugRegister, medicines]);

  // Drug Schedule matching helper
  const isCategoryMatch = (med, filter) => {
    if (!filter || filter === "All") return true;

    const cat = (med.category || "").trim();
    const stype = (med.schedule_type || "").trim();
    const isCtrl = med.controlled_drug === 1;

    if (filter === "Schedule H") {
      return cat === "Schedule H" || stype === "Schedule H";
    }
    if (filter === "Schedule H1") {
      return cat === "Schedule H1" || stype === "Schedule H1";
    }
    if (filter === "Schedule X") {
      return cat === "Schedule X" || stype === "Schedule X";
    }
    if (filter === "Controlled Drug") {
      return cat === "Controlled Drug" || isCtrl;
    }
    if (filter === "OTC") {
      return cat === "OTC";
    }
    if (filter === "Regular Medicine") {
      return (
        cat === "Regular Medicine" ||
        stype === "None" ||
        (!["Schedule H", "Schedule H1", "Schedule X", "Controlled Drug", "OTC"].includes(cat) && !isCtrl)
      );
    }

    return cat === filter;
  };

  // Extract all imported invoices
  const importedInvoices = useMemo(() => {
    if (!isMounted) return [];
    const map = new Map();

    if (typeof window !== 'undefined') {
      try {
        const grns = JSON.parse(localStorage.getItem('hospital_goods_receipts')) || [];
        grns.forEach(grn => {
          const invNo = (grn.invoice_number || "").trim();
          if (invNo) {
            const key = invNo.toLowerCase();
            if (!map.has(key)) {
              map.set(key, {
                invoice_number: invNo,
                supplier: grn.supplier || "Supplier",
                invoice_date: grn.invoice_date || grn.received_date || "",
                total_amount: grn.total_amount || 0,
                items: [...(grn.items || [])],
                item_count: (grn.items || []).length
              });
            } else {
              const existing = map.get(key);
              (grn.items || []).forEach(it => {
                if (!existing.items.some(x => (x.medicine || "").toLowerCase() === (it.medicine || "").toLowerCase())) {
                  existing.items.push(it);
                }
              });
              existing.item_count = existing.items.length;
            }
          }
        });
      } catch (e) {
        console.warn("Could not read hospital_goods_receipts:", e);
      }
    }

    medicines.forEach(m => {
      const invNo = (m.invoice_number || "").trim();
      if (invNo) {
        const key = invNo.toLowerCase();
        const itemObj = {
          medicine: m.medicine_name,
          batch_number: m.batch_number || (m.batches?.[0]?.batch_number) || "BATCH-01",
          quantity: m.stock || 0,
          pack: m.pack_size || "10'S",
          exp_date: m.expiry_date || m.exp_date || "",
          purchase_price: m.purchase_price || 0,
          mrp: m.selling_price || m.mrp || 0,
          rack: m.rack_location || "A-1"
        };
        if (!map.has(key)) {
          map.set(key, {
            invoice_number: invNo,
            supplier: m.supplier || "Supplier",
            invoice_date: m.invoice_date || "",
            total_amount: (m.stock || 0) * (m.purchase_price || 0),
            items: [itemObj],
            item_count: 1
          });
        } else {
          const existing = map.get(key);
          if (!existing.items.some(x => (x.medicine || "").toLowerCase() === (m.medicine_name || "").toLowerCase())) {
            existing.items.push(itemObj);
            existing.item_count = existing.items.length;
            existing.total_amount += (m.stock || 0) * (m.purchase_price || 0);
          }
        }
      }

      (m.batches || []).forEach(b => {
        const bInvNo = (b.invoice_number || "").trim();
        if (bInvNo) {
          const key = bInvNo.toLowerCase();
          const itemObj = {
            medicine: m.medicine_name,
            batch_number: b.batch_number || "BATCH-01",
            quantity: b.current_stock || 0,
            pack: b.pack_size || "10'S",
            exp_date: b.exp_date || "",
            purchase_price: b.purchase_price || 0,
            mrp: b.mrp || 0,
            rack: b.rack_location || "A-1"
          };
          if (!map.has(key)) {
            map.set(key, {
              invoice_number: bInvNo,
              supplier: b.supplier || m.supplier || "Supplier",
              invoice_date: b.invoice_date || m.invoice_date || "",
              total_amount: (b.current_stock || 0) * (b.purchase_price || 0),
              items: [itemObj],
              item_count: 1
            });
          } else {
            const existing = map.get(key);
            if (!existing.items.some(x => (x.medicine || "").toLowerCase() === (m.medicine_name || "").toLowerCase())) {
              existing.items.push(itemObj);
              existing.item_count = existing.items.length;
              existing.total_amount += (b.current_stock || 0) * (b.purchase_price || 0);
            }
          }
        }
      });
    });

    return Array.from(map.values());
  }, [medicines, isMounted]);

  // Filtered inventory list
  const filteredMedicines = useMemo(() => {
    return medicines.filter(med => {
      const matchesSearch = 
        (med.medicine_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (med.generic_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (med.brand || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (med.barcode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (med.qrcode || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (med.batches || []).some(b => (b.batch_number || "").toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = isCategoryMatch(med, categoryFilter);
      
      let matchesStatus = true;
      if (statusFilter === "Low Stock") matchesStatus = med.stock < med.min_stock;
      else if (statusFilter === "Reorder Required") matchesStatus = med.stock <= med.reorder_level;
      else if (statusFilter === "Out Of Stock") matchesStatus = med.stock === 0;
      else if (statusFilter === "Controlled") matchesStatus = med.controlled_drug === 1;
      else if (statusFilter === "Expiring / Expired") {
        const today = new Date();
        matchesStatus = (med.batches || []).some(b => {
          if (!b.exp_date) return false;
          const diffMs = new Date(b.exp_date) - today;
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          return diffDays <= 180;
        });
      }

      let matchesInvoice = true;
      if (invoiceFilter && invoiceFilter !== "All") {
        const invTarget = invoiceFilter.trim().toLowerCase();
        const directMatch = med.invoice_number && med.invoice_number.trim().toLowerCase() === invTarget;
        const batchMatch = (med.batches || []).some(b => b.invoice_number && b.invoice_number.trim().toLowerCase() === invTarget);
        
        const currentInv = importedInvoices.find(inv => (inv.invoice_number || "").trim().toLowerCase() === invTarget);
        const nameMatch = currentInv ? (currentInv.items || []).some(it => {
          const itName = (it.medicine || it.medicine_name || it.product_name || "").trim().toLowerCase();
          const mName = (med.medicine_name || "").trim().toLowerCase();
          return itName && (itName === mName || itName.includes(mName) || mName.includes(itName));
        }) : false;

        const registerMatch = (drugRegister || []).some(reg => 
          Boolean(reg.reference && reg.reference.trim().toLowerCase() === invTarget &&
          reg.medicine && (reg.medicine.trim().toLowerCase() === (med.medicine_name || "").trim().toLowerCase()))
        );

        matchesInvoice = directMatch || batchMatch || nameMatch || registerMatch;
      }

      return matchesSearch && matchesCategory && matchesStatus && matchesInvoice;
    });
  }, [medicines, searchQuery, categoryFilter, statusFilter, invoiceFilter, importedInvoices, drugRegister]);

  // Auto PO recommendations list
  const purchaseRecommendations = useMemo(() => {
    // calculate pending PO quantities
    const pendingPoQty = {};
    purchaseOrders.forEach(po => {
      if (po.status !== "Received" && po.status !== "Completed") {
        (po.items || []).forEach(item => {
          pendingPoQty[item.medicine] = (pendingPoQty[item.medicine] || 0) + (item.quantity || 0);
        });
      }
    });

    let recs = medicines.map(m => {
      const pendingQty = pendingPoQty[m.medicine_name] || 0;
      const calcSuggested = Math.max(0, (m.max_stock || 500) - (m.stock + pendingQty));
      const suggested = editedSuggQty[m.medicine_name] !== undefined ? editedSuggQty[m.medicine_name] : calcSuggested;
      
      return {
        medicine: m.medicine_name,
        generic: m.generic_name,
        current_stock: m.stock,
        min_stock: m.min_stock,
        reorder_level: m.reorder_level || m.min_stock,
        max_stock: m.max_stock,
        suggested: suggested,
        price: m.purchase_price || 0.0,
        supplier: m.supplier || "ABC Pharma",
        category: m.category || "Regular Medicine",
        controlled_drug: m.controlled_drug || 0,
        sleeping_pill: m.sleeping_pill || 0
      };
    }).filter(m => m.current_stock <= m.reorder_level);

    // Apply filters and search
    recs = recs.filter(r => {
      const matchesSearch = 
        (r.medicine || "").toLowerCase().includes(suggSearchQuery.toLowerCase()) ||
        (r.generic || "").toLowerCase().includes(suggSearchQuery.toLowerCase()) ||
        (r.supplier || "").toLowerCase().includes(suggSearchQuery.toLowerCase());
      
      const matchesSupplier = suggFilterSupplier === "All" || r.supplier === suggFilterSupplier;
      const matchesCategory = suggFilterCategory === "All" || r.category === suggFilterCategory;
      
      let matchesStatus = true;
      if (suggFilterStatus === "Low Stock") matchesStatus = r.current_stock > 0 && r.current_stock < r.min_stock;
      else if (suggFilterStatus === "Out Of Stock") matchesStatus = r.current_stock === 0;
      else if (suggFilterStatus === "Controlled Drug") matchesStatus = r.controlled_drug === 1;
      else if (suggFilterStatus === "Schedule H") matchesStatus = r.category === "Schedule H";
      else if (suggFilterStatus === "Sleeping Pill") matchesStatus = r.sleeping_pill === 1 || r.category === "Sleeping Pill";

      return matchesSearch && matchesSupplier && matchesCategory && matchesStatus;
    });

    return recs;
  }, [medicines, purchaseOrders, suggSearchQuery, suggFilterSupplier, suggFilterCategory, suggFilterStatus, editedSuggQty]);

  // Helper to count distinct medicines/items in a prescription
  const getPrescriptionDistinctItems = (prescriptionText, dispensedMeds = []) => {
    if (dispensedMeds && dispensedMeds.length > 0) {
      const names = new Set(dispensedMeds.map(d => (d.medicine_name || d.medicine || "").trim().toLowerCase()).filter(Boolean));
      if (names.size > 0) return names.size;
    }
    if (!prescriptionText || typeof prescriptionText !== "string") return 0;
    const lines = prescriptionText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return 0;

    const distinct = new Set();
    lines.forEach(line => {
      const parts = line.includes(";") ? line.split(";") : [line];
      parts.forEach(p => {
        const clean = p.replace(/^[\d\.\-\*\•\)\s]+/, "").trim();
        if (!clean) return;
        const nameOnly = clean.split(/[—\-:\(\[\d]/)[0].trim().toLowerCase();
        if (nameOnly.length > 1) {
          distinct.add(nameOnly);
        }
      });
    });
    return distinct.size || lines.length;
  };

  // Helper to parse prescription into structured item list
  const parsePrescriptionDetails = (prescriptionText, medicinesCatalog, dispensedMeds = []) => {
    if (dispensedMeds && dispensedMeds.length > 0) {
      return dispensedMeds.map((d, i) => {
        const med = medicinesCatalog.find(m => m.medicine_name?.toLowerCase() === (d.medicine_name || d.medicine)?.toLowerCase());
        return {
          id: `rx-disp-${i}`,
          medicine_name: d.medicine_name || d.medicine,
          strength: med?.strength || d.strength || "-",
          prescribed_qty: d.qty || d.quantity || 1,
          qty: d.qty || d.quantity || 1,
          dispensed_qty: d.dispensed_qty || d.qty || 1,
          dispense_status: d.dispense_status || "Dispensed",
          price: d.price || Number(med?.selling_price) || Number(med?.mrp) || 0,
          stock: med?.stock ?? (d.stock || 0),
          category: med?.category || d.category || "Regular Medicine",
          source: d.source || "Hospital Pharmacy",
          dosage: d.dosage || "1-0-1",
          frequency: d.frequency || "Twice daily",
          duration: d.duration || "5 days",
          timing_instructions: d.timing_instructions || "Morning - Night [1-0-1]",
          food_instructions: d.food_instructions || "After Food"
        };
      });
    }

    if (!prescriptionText || typeof prescriptionText !== "string") return [];
    
    // Split on newlines, or split on closing parenthesis followed by medicine name if single line
    let lines = prescriptionText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 1 && lines[0].includes(") ") && lines[0].includes("—")) {
      const splitLines = lines[0].split(/(?<=\))\s+(?=[A-Za-z0-9])/).map(l => l.trim()).filter(Boolean);
      if (splitLines.length > 1) {
        lines = splitLines;
      }
    }

    const cleanStr = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

    const fallbackPriceMap = {
      dolo: 20,
      paracetamol: 20,
      calpol: 20,
      pantocid: 95,
      pantoprazole: 90,
      pan: 90,
      amoxicillin: 95,
      mox: 95,
      azithromycin: 120,
      cetirizine: 15,
      okacet: 15,
      alprazolam: 15,
      xanax: 15,
      fentanyl: 300,
      zolpidem: 50,
      metformin: 45,
      telmisartan: 60,
      atorvastatin: 85
    };

    return lines.map((line, idx) => {
      let qty = 1;
      let duration = "5 days";
      let timing = "Morning - Night";
      let food = "After Food";
      let dosage = "1-0-1";

      const qtyMatch = line.match(/(?:—|-)\s*(\d+)\s*(?:units|tabs|tablets|caps|bottles|strips|nos|qty)?/i);
      if (qtyMatch) {
        qty = parseInt(qtyMatch[1], 10) || 1;
      }

      const durationMatch = line.match(/(\d+\s*(?:days|weeks|months|day))/i);
      if (durationMatch) {
        duration = durationMatch[1];
      }

      const timingCodeMatch = line.match(/\[([0-1]-[0-1]-[0-1])\]/);
      if (timingCodeMatch) {
        dosage = timingCodeMatch[1];
      }

      if (line.includes("Morning") || line.includes("Afternoon") || line.includes("Night")) {
        const timings = [];
        if (line.includes("Morning")) timings.push("Morning");
        if (line.includes("Afternoon")) timings.push("Afternoon");
        if (line.includes("Night")) timings.push("Night");
        timing = timings.join(" - ");
      }

      if (line.toLowerCase().includes("after food")) {
        food = "After Food";
      } else if (line.toLowerCase().includes("before food")) {
        food = "Before Food";
      } else if (line.toLowerCase().includes("with food")) {
        food = "With Food";
      }

      const nameMatch = line.split(/[—\-(]/)[0].trim().replace(/^[\d\.\*\•\)\s]+/, "");
      let searchName = nameMatch || line;
      if (/^[A-Za-z]+\d+/.test(searchName) && !searchName.includes(" ")) {
        searchName = searchName.replace(/^([A-Za-z]+)(\d+.*)$/, "$1 $2");
      }
      const cleanSearch = cleanStr(searchName);

      const foundMed = medicinesCatalog.find(m => {
        const mClean = cleanStr(m.medicine_name);
        const gClean = cleanStr(m.generic_name);
        const bClean = cleanStr(m.brand);
        return (
          mClean === cleanSearch ||
          (cleanSearch.length >= 3 && mClean.includes(cleanSearch)) ||
          (mClean.length >= 3 && cleanSearch.includes(mClean)) ||
          (gClean && (gClean === cleanSearch || cleanSearch.includes(gClean) || gClean.includes(cleanSearch))) ||
          (bClean && (bClean === cleanSearch || cleanSearch.includes(bClean) || bClean.includes(cleanSearch)))
        );
      });

      const finalMedName = foundMed ? foundMed.medicine_name : searchName;
      const parsedStrength = foundMed?.strength || (searchName.match(/\d+\s*(?:mg|g|ml|mcg|iu)/i)?.[0] || "");
      const strength = parsedStrength === "-" ? "" : parsedStrength;
      const stock = foundMed ? (foundMed.stock ?? 100) : 100;
      
      let price = foundMed ? (Number(foundMed.selling_price) || Number(foundMed.mrp) || Number(foundMed.price) || 0) : 0;
      if (price === 0) {
        for (const [key, val] of Object.entries(fallbackPriceMap)) {
          if (cleanSearch.includes(key)) {
            price = val;
            break;
          }
        }
        if (price === 0) price = 25.0;
      }

      const category = foundMed ? (foundMed.category || "Regular Medicine") : "Regular Medicine";

      return {
        id: `rx-item-${idx}`,
        medicine_name: finalMedName,
        strength: strength,
        prescribed_qty: qty,
        qty: qty,
        dispensed_qty: qty,
        dispense_status: stock > 0 ? "Dispensed" : "Out of Stock",
        price: price,
        stock: stock,
        category: category,
        source: "Hospital Pharmacy",
        dosage: dosage,
        frequency: timing,
        duration: duration,
        timing_instructions: `${timing} [${dosage}]`,
        food_instructions: food
      };
    });
  };

  // Counts for Prescriptions Queue tabs
  const queueSummary = useMemo(() => {
    const validQueue = queue.filter(q => q.prescription && q.prescription.trim().length > 0);
    const activeQueue = validQueue.filter(q => q.pharmacy_status !== "Completed" && q.appointment_status !== "Billing" && q.appointment_status !== "Completed").length;
    const completed = validQueue.filter(q => q.pharmacy_status === "Completed" || q.appointment_status === "Billing" || q.appointment_status === "Completed").length;
    const waiting = validQueue.filter(q => q.pharmacy_status !== "Completed" && q.appointment_status !== "Billing" && q.appointment_status !== "Completed" && (!selectedWalkIn || selectedWalkIn.name !== q.name)).length;

    return { activeQueue, completed, waiting };
  }, [queue, selectedWalkIn]);


  const filteredQueue = useMemo(() => {
    return queue.filter(q => {
      if (!q.prescription || q.prescription.trim().length === 0) return false;
      
      const search = queueSearchQuery.trim().toLowerCase();
      const matchesSearch = !search ||
        (q.patient_name || "").toLowerCase().includes(search) ||
        (q.mobile_number || q.phone || q.patient_mobile || "").toLowerCase().includes(search);
        
      if (!matchesSearch) return false;

      const isCompleted = q.pharmacy_status === "Completed" || q.appointment_status === "Billing" || q.appointment_status === "Completed";

      if (queueFilterTab === "Waiting") {
        return !isCompleted;
      }
      if (queueFilterTab === "Completed") {
        return isCompleted;
      }
      
      // Default: show only active pending prescriptions
      return !isCompleted;
    });
  }, [queue, queueSearchQuery, queueFilterTab]);

  // Live drug registers
  const activeRegisterLogs = useMemo(() => {
    const filtered = drugRegister.filter(log => {
      if (selectedRegister === "Sales Returns") {
        return Number(log.quantity) < 0 || log.doctor === "Sales Return" || (log.invoice_number && log.invoice_number.includes("RET-"));
      }
      if (selectedRegister === "All Categories") return true;
      if (selectedRegister === "Schedule H") return log.drug_category === "Schedule H";
      if (selectedRegister === "Schedule H1") return log.drug_category === "Schedule H1" || log.drug_category === "Sleeping Pill";
      if (selectedRegister === "Sleeping Pill") return log.drug_category === "Sleeping Pill" || log.sleeping_pill === 1;
      if (selectedRegister === "Controlled Drug") return log.drug_category === "Controlled Drug" || log.controlled_drug === 1;
      return true;
    });

    // Deduplicate to avoid rendering identical rows
    const uniqueLogs = [];
    const seen = new Set();
    for (const log of filtered) {
      // Use name from Frappe if available, otherwise a composite key
      const key = log.name || `${log.invoice_number}-${log.medicine}-${log.batch_number}-${log.dispensing_date}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueLogs.push(log);
      }
    }
    return uniqueLogs;
  }, [drugRegister, selectedRegister]);

  // Handle selected prescription dispensing queue
  const handleSelectQueueItem = (item) => {
    setSelectedWalkIn(item);
    if (item && item.dispensed_medicines && item.dispensed_medicines.length > 0) {
      const parsed = parsePrescriptionDetails(item.prescription, medicines, item.dispensed_medicines);
      setDispenseItems(parsed);
    } else {
      // Only medicines added by the pharmacist via search & add appear in the table
      setDispenseItems([]);
    }
    setShowDispenseWorkdeskModal(true);
  };

  const handleClearSelectedQueueItem = () => {
    setSelectedWalkIn(null);
    setDispenseItems([]);
    setShowDispenseWorkdeskModal(false);
  };

  const handleUpdateDispenseQty = (index, delta) => {
    setDispenseItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const currentQty = typeof item.qty === 'number' ? item.qty : (parseInt(item.qty, 10) || 1);
        const newQty = Math.max(1, currentQty + delta);
        return { 
          ...item, 
          qty: newQty,
          dispensed_qty: item.dispense_status === "Partially Dispensed" ? Math.min(newQty, item.dispensed_qty || newQty) : newQty
        };
      }
      return item;
    }));
  };

  const handleItemQtyChange = (index, val) => {
    const parsed = parseInt(val, 10);
    const newQty = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    setDispenseItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { 
          ...item, 
          qty: newQty, 
          dispensed_qty: item.dispense_status === "Partially Dispensed" ? Math.min(item.dispensed_qty || newQty, newQty) : newQty
        };
      }
      return item;
    }));
  };

  const handleRemoveDispenseItem = (index) => {
    setDispenseItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const confirmWorkdeskDelete = async () => {
    if (workdeskDeleteIndex === null) return;
    const item = dispenseItems[workdeskDeleteIndex];
    if (item) {
      try {
        await createPharmacyAuditLog({
          action: "Delete Medicine",
          medicine: item.medicine_name,
          patient: selectedWalkIn?.patient_name,
          reason: workdeskDeleteReason,
          performed_by: pharmacistName
        });
      } catch (err) {
        console.error("Audit error", err);
      }
    }
    setDispenseItems(prev => prev.filter((_, idx) => idx !== workdeskDeleteIndex));
    setShowWorkdeskDeleteModal(false);
    setWorkdeskDeleteIndex(null);
  };

  const confirmWorkdeskEdit = async () => {
    if (workdeskEditIndex === null) return;
    const item = dispenseItems[workdeskEditIndex];
    if (!item) return;
    const oldQty = item.qty;
    const newQty = Math.max(1, parseInt(workdeskEditQty, 10) || 1);
    try {
      await createPharmacyAuditLog({
        action: "Edit Quantity",
        medicine: item.medicine_name,
        patient: selectedWalkIn?.patient_name,
        details: `Changed Qty from ${oldQty} to ${newQty}`,
        reason: workdeskEditReason || "Adjusted at workdesk",
        performed_by: pharmacistName
      });
    } catch (err) {
      console.error("Audit error", err);
    }
    setDispenseItems(prev => prev.map((it, idx) => {
      if (idx === workdeskEditIndex) {
        return { ...it, qty: newQty, dispensed_qty: it.dispense_status === "Partially Dispensed" ? Math.min(it.dispensed_qty || newQty, newQty) : newQty };
      }
      return it;
    }));
    setShowWorkdeskEditModal(false);
    setWorkdeskEditIndex(null);
  };

  const confirmWorkdeskPartial = () => {
    if (workdeskPartialIndex === null) return;
    const newDispensedQty = Math.max(1, parseInt(workdeskPartialQty, 10) || 1);
    setDispenseItems(prev => prev.map((it, idx) => {
      if (idx === workdeskPartialIndex) {
        return { ...it, dispense_status: "Partially Dispensed", dispensed_qty: Math.min(newDispensedQty, it.qty) };
      }
      return it;
    }));
    setShowWorkdeskPartialModal(false);
    setWorkdeskPartialIndex(null);
  };

  const handleMarkNotAvailable = async (index) => {
    const item = dispenseItems[index];
    await createPharmacyAuditLog({
      action: "Mark Not Available",
      medicine: item.medicine_name,
      patient: selectedWalkIn?.patient_name,
      performed_by: pharmacistName
    });
    setDispenseItems(prev => prev.map((it, idx) => {
      if (idx === index) return { ...it, dispense_status: "Out of Stock", dispensed_qty: 0 };
      return it;
    }));
  };

  const handleAddCustomDispenseMed = (medToUse = null, qtyToUse = null, instructionsToUse = null) => {
    const medQuery = (typeof medToUse === "string" ? medToUse : customAddMedName).trim();
    if (!medQuery) return;

    const cleanStr = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanSearch = cleanStr(medQuery);

    const med = medicines.find(m => {
      const mClean = cleanStr(m.medicine_name);
      const gClean = cleanStr(m.generic_name);
      const bClean = cleanStr(m.brand);
      return (
        mClean === cleanSearch ||
        (cleanSearch.length >= 3 && mClean.includes(cleanSearch)) ||
        (mClean.length >= 3 && cleanSearch.includes(mClean)) ||
        (gClean && (gClean === cleanSearch || cleanSearch.includes(gClean))) ||
        (bClean && (bClean === cleanSearch || cleanSearch.includes(bClean)))
      );
    });

    if (med && med.disabled) {
      showToast("Warning: Selected medicine is deactivated.", "error");
      return;
    }

    const medName = med ? med.medicine_name : medQuery;
    
    if (dispenseItems.some(item => cleanStr(item.medicine_name) === cleanStr(medName))) {
      showToast(`${medName} is already added to the list`, "info");
      return;
    }

    const qty = parseInt(qtyToUse ?? customAddQty, 10) || 1;
    let unitPrice = med ? (Number(med.selling_price) || Number(med.mrp) || Number(med.price) || 0) : 0;

    if (unitPrice === 0) {
      const fallbackPriceMap = {
        dolo: 20, paracetamol: 20, calpol: 20, pantocid: 95, pantoprazole: 90,
        pan: 90, amoxicillin: 95, mox: 95, azithromycin: 120, cetirizine: 15,
        okacet: 15, alprazolam: 15, xanax: 15, fentanyl: 300, zolpidem: 50,
        metformin: 45, telmisartan: 60, atorvastatin: 85
      };
      for (const [key, val] of Object.entries(fallbackPriceMap)) {
        if (cleanSearch.includes(key)) {
          unitPrice = val;
          break;
        }
      }
      if (unitPrice === 0) unitPrice = 25.0;
    }

    const parsedStrength = med?.strength || (medQuery.match(/\d+\s*(?:mg|g|ml|mcg|iu)/i)?.[0] || "");
    const strength = parsedStrength === "-" ? "" : parsedStrength;
    const stock = med ? (med.stock ?? 100) : 100;

    setDispenseItems(prev => [...prev, {
      id: `item-${Date.now()}-${Math.random()}`,
      medicine_name: medName,
      strength: strength,
      prescribed_qty: instructionsToUse?.prescribed_qty || qty,
      qty: qty,
      price: unitPrice,
      stock: stock,
      category: med?.category || "Regular Medicine",
      source: "Hospital Pharmacy",
      dispense_status: stock > 0 ? "Dispensed" : "Out of Stock",
      dispensed_qty: qty,
      dosage: instructionsToUse?.dosage || "1-0-1",
      frequency: instructionsToUse?.frequency || "Twice daily",
      duration: instructionsToUse?.duration || "5 days",
      timing_instructions: instructionsToUse?.timing_instructions || "Morning - Night [1-0-1]",
      food_instructions: instructionsToUse?.food_instructions || "After Food",
      remaining_qty: 0,
      remaining_action: "Pending"
    }]);

    setCustomAddMedName("");
    setCustomAddQty(1);
    showToast(`Added ${medName} to dispensation list`, "success");
  };

  const executeOutsidePurchase = async () => {
    if (userRole === "Store Manager") {
      showToast("Access Denied: Store Managers cannot dispense medicines.", "error");
      return;
    }
    if (dispenseItems.length === 0) {
      showToast("No medicines added to dispense", "error");
      return;
    }

    showToast("Processing Outside Purchase. No invoice will be generated...", "info");

    try {
      const pName = selectedWalkIn?.patient_name || "Walk-in Customer";

      const outsideItems = dispenseItems.map(item => ({
        ...item,
        source: "Outside Purchase",
        dispense_status: "Outside Purchase",
        price: 0,
        dispensed_qty: item.qty
      }));
      
      if (selectedWalkIn) {
        await updateWalkIn(selectedWalkIn.name, {
          pharmacy_status: "Completed",
          appointment_status: "Billing",
          prescription: selectedWalkIn.prescription,
          bill_amount: selectedWalkIn.bill_amount + 0,
          pharmacy_bill_amount: 0,
          dispensed_medicines: outsideItems
        });

        saveInvoiceToProfile(selectedWalkIn.mobile_number, {
          name: `Pharmacy Dispensation - Outside Purchase`,
          bill_amount: 0,
          payment_method: "None",
          walkinData: {
            name: selectedWalkIn.name,
            patient_name: pName,
            mobile_number: selectedWalkIn.mobile_number,
            doctor: selectedWalkIn.doctor,
            pharmacy_bill_amount: 0,
            dispensed_medicines: outsideItems,
            netBalance: 0
          },
          remarks: "All items purchased from outside pharmacy. No hospital invoice generated."
        });

        await createPharmacyAuditLog({
          action: "Global Outside Purchase",
          medicine: "All Items",
          patient: pName,
          reason: "Patient chose to buy from outside",
          performed_by: pharmacistName
        });

      } else {
        showToast("Error: No patient selected for Outside Purchase", "error");
        return;
      }

      showToast(`Outside purchase successfully recorded for ${pName}`, "success");
      setDispenseItems([]);
      setSelectedWalkIn(null);
      setShowDispenseWorkdeskModal(false);
      loadAllData();
      
    } catch (error) {
      console.error(error);
      showToast("Failed to process Outside Purchase", "error");
    }
  };

  const handleDirectQuickDispense = async (item) => {
    if (userRole === "Store Manager") {
      showToast("Access Denied: Store Managers cannot dispense medicines.", "error");
      return;
    }
    if (!item) return;

    try {
      const pName = item.patient_name || "Walk-in Customer";
      const prescribedItems = parsePrescriptionDetails(item.prescription, medicines).map(it => ({
        ...it,
        source: "Outside Purchase",
        dispense_status: "Outside Purchase",
        price: 0,
        dispensed_qty: it.qty || 1
      }));

      await updateWalkIn(item.name, {
        pharmacy_status: "Completed",
        appointment_status: "Billing",
        prescription: item.prescription,
        bill_amount: item.bill_amount || 0,
        pharmacy_bill_amount: 0,
        dispensed_medicines: prescribedItems
      });

      saveInvoiceToProfile(item.mobile_number, {
        name: `Pharmacy Dispensation - Completed (₹0)`,
        bill_amount: 0,
        payment_method: "None",
        walkinData: {
          name: item.name,
          patient_name: pName,
          mobile_number: item.mobile_number,
          doctor: item.doctor,
          pharmacy_bill_amount: 0,
          dispensed_medicines: prescribedItems,
          netBalance: 0
        },
        remarks: "Prescription dispensed with zero pharmacy billing (Moved to billing desk)."
      });

      await createPharmacyAuditLog({
        action: "Quick Dispense",
        medicine: "All Prescribed Items",
        patient: pName,
        reason: "Direct Dispense (₹0 / Moved to Billing)",
        performed_by: pharmacistName
      });

      showToast(`Prescription dispensed (₹0) & moved to Billing for ${pName}`, "success");
      loadAllData();
    } catch (error) {
      console.error("Quick dispense error:", error);
      showToast("Failed to dispense prescription", "error");
    }
  };

  // Dispensing execution with compliance validation
  const executeDispensing = async (overrideMode = null) => {
    if (userRole === "Store Manager") {
      showToast("Access Denied: Store Managers cannot dispense medicines.", "error");
      return;
    }
    if (dispenseItems.length === 0) {
      showToast("No medicines added to dispense", "error");
      return;
    }

    const activePaymentMode = overrideMode || dispensePaymentMode;
    const isPayAtPharmacy = activePaymentMode === "Pay at Pharmacy Desk";

    // Verify stock availability (only for hospital pharmacy items)
    const outOfStockMeds = dispenseItems.filter(item => {
      if (item.source === "Outside Purchase" || item.dispense_status === "Outside Purchase") return false;
      const targetQty = item.dispense_status === "Partially Dispensed" ? item.dispensed_qty : item.qty;
      return targetQty > item.stock;
    });

    if (outOfStockMeds.length > 0) {
      showToast(`Warning: Insufficient stock for ${outOfStockMeds.map(i=>i.medicine_name).join(", ")}`, "error");
      return;
    }

    showToast("Processing FEFO stocks & updating drug registers...", "info");
    
    try {
      const pName = selectedWalkIn?.patient_name || "Walk-in Customer";
      const pMobile = selectedWalkIn?.mobile_number || "";
      const docName = selectedWalkIn?.doctor || "Self (OTC)";

      // 1. Deduct stock using FEFO and create register logs
      const response = await dispenseMedicineFEFO(
        selectedWalkIn?.name || "OTC",
        dispenseItems.map(item => ({
          medicine_name: item.medicine_name,
          qty: item.prescribed_qty || item.qty,
          source: item.source,
          dispense_status: item.dispense_status,
          dispensed_qty: item.dispense_status === "Partially Dispensed" ? item.dispensed_qty : item.qty,
          remaining_qty: item.prescribed_qty - (item.dispense_status === "Partially Dispensed" ? item.dispensed_qty : item.qty),
          remaining_action: item.remaining_action
        })),
        pName,
        pMobile,
        docName,
        pharmacistName
      );

      // Bill calculation: outside purchase items are ₹0
      const billAmt = dispenseItems.reduce((acc, item) => {
        if (item.source === "Outside Purchase" || item.dispense_status === "Outside Purchase") return acc;
        const qty = item.dispense_status === "Partially Dispensed" ? item.dispensed_qty : item.qty;
        return acc + (qty * item.price);
      }, 0);

      // Check if there are any remaining pending items for partial dispensing
      const hasPendingRemaining = dispenseItems.some(item => 
        item.dispense_status === "Partially Dispensed" && item.remaining_action === "Pending"
      );

      // 2. Update patient consultation status if from queue
      if (selectedWalkIn) {
        let nextWalkInStatus = "Completed";
        let nextAppointmentStatus = "Billing";
        let newPrescriptionText = selectedWalkIn.prescription;

        if (hasPendingRemaining) {
          nextWalkInStatus = "Pending";
          nextAppointmentStatus = "Pharmacy"; // patient stays in pharmacy
          
          // Re-generate prescription text containing only the remaining balance
          newPrescriptionText = dispenseItems
            .filter(item => item.dispense_status === "Partially Dispensed" && item.remaining_action === "Pending")
            .map(item => {
              const remainingQty = item.prescribed_qty - item.dispensed_qty;
              return `${item.medicine_name} x ${remainingQty} tablets (Waiting for Remaining Medicines)`;
            })
            .join("\n");
        }

        await updateWalkIn(selectedWalkIn.name, {
          pharmacy_status: nextWalkInStatus,
          appointment_status: nextAppointmentStatus,
          prescription: newPrescriptionText,
          bill_amount: (selectedWalkIn.bill_amount || 0) + (isPayAtPharmacy ? 0 : billAmt),
          pharmacy_bill_amount: billAmt,
          pharmacy_payment_status: isPayAtPharmacy ? "Paid" : "ForwardedToBilling",
          pharmacy_paid_amount: isPayAtPharmacy ? billAmt : 0,
          pharmacy_due_amount: isPayAtPharmacy ? 0 : billAmt,
          dispensed_medicines: dispenseItems
        });

        // Save invoice to patient portal profile
        saveInvoiceToProfile(selectedWalkIn.mobile_number, {
          name: `Pharmacy Dispensation - ${dispenseItems.map(i=> `${i.medicine_name} (x${i.source === 'Outside Purchase' ? 0 : (i.dispense_status === 'Partially Dispensed' ? i.dispensed_qty : i.qty)})`).join(", ")}`,
          bill_amount: billAmt,
          payment_method: isPayAtPharmacy ? (otcPaymentMethod || "Cash") : "Pending at Central Billing",
          walkinData: {
            name: selectedWalkIn.name,
            patient_name: selectedWalkIn.patient_name,
            mobile_number: selectedWalkIn.mobile_number,
            doctor: selectedWalkIn.doctor,
            pharmacy_bill_amount: billAmt,
            pharmacy_payment_status: isPayAtPharmacy ? "Paid" : "ForwardedToBilling",
            pharmacy_paid_amount: isPayAtPharmacy ? billAmt : 0,
            dispensed_medicines: dispenseItems,
            netBalance: isPayAtPharmacy ? 0 : billAmt
          }
        });

        // Record department payment and finance income ONLY if paid at pharmacy desk
        if (typeof window !== 'undefined' && isPayAtPharmacy && billAmt > 0) {
          // Log into dept payments for Central Billing reconciliation
          const storedPayments = localStorage.getItem("hospital_dept_payments");
          const deptPayments = storedPayments ? JSON.parse(storedPayments) : [];
          deptPayments.unshift({
            id: `dp-pharm-${Date.now()}`,
            walkInId: selectedWalkIn.name,
            patientName: pName,
            mobile: pMobile,
            department: "Pharmacy",
            description: `Pharmacy Dispensed Medicines (${dispenseItems.filter(i=>i.source!=="Outside Purchase").map(i=>i.medicine_name).join(", ")})`,
            amount: billAmt,
            method: otcPaymentMethod || "Cash",
            date: new Date().toISOString().split("T")[0],
            status: "Paid"
          });
          localStorage.setItem("hospital_dept_payments", JSON.stringify(deptPayments));

          // Log into Finance Ledger
          const storedFinance = localStorage.getItem("hospital_custom_finance");
          const financeEntries = storedFinance ? JSON.parse(storedFinance) : [];
          const rxTx = {
            id: `tx-rx-${response.invoiceNumber}`,
            title: `Pharmacy Sale — ${selectedWalkIn.patient_name}`,
            type: "Income",
            category: "Pharmacy Income",
            amount: billAmt,
            method: otcPaymentMethod || "Cash",
            date: new Date().toISOString().split("T")[0],
            notes: `Invoice: ${response.invoiceNumber} | Paid at Pharmacy Counter | Doctor: ${docName} | Items: ${dispenseItems.filter(i=>i.source!=="Outside Purchase").map(i=>`${i.medicine_name} ×${i.dispense_status==="Partially Dispensed"?i.dispensed_qty:i.qty}`).join(", ")}`
          };
          financeEntries.unshift(rxTx);
          localStorage.setItem("hospital_custom_finance", JSON.stringify(financeEntries));
          recordFinanceTransaction(rxTx).catch(() => null);
        }
      }

      showToast(`Transaction completed. Invoice ${response.invoiceNumber} generated!`, "success");
      
      // Enrich receipt items with unit_price and line_total from dispenseItems (authoritative price source)
      const enrichedReceiptItems = (response.dispensedReceipt || []).map(receiptItem => {
        const srcItem = dispenseItems.find(
          d => (d.medicine_name || "").toLowerCase() === (receiptItem.medicine_name || "").toLowerCase()
        );
        const unitPrice = srcItem?.price || 0;
        const dispQty = receiptItem.dispensed_qty || receiptItem.requested_qty || 0;
        return {
          ...receiptItem,
          unit_price: unitPrice,
          line_total: receiptItem.source === "Outside Purchase" ? 0 : (dispQty * unitPrice)
        };
      });

      setLatestDispenseRecord({
        invoiceNumber: response.invoiceNumber,
        patientName: pName,
        patientMobile: pMobile,
        doctorName: docName,
        items: enrichedReceiptItems,
        dispenseItems: dispenseItems,
        totalVal: billAmt,
        paymentMethod: isPayAtPharmacy ? (otcPaymentMethod || "Cash") : "Pending at Central Billing",
        paymentMode: isPayAtPharmacy ? "Paid at Pharmacy Desk" : "Forwarded to Central Billing Desk",
        isPaidAtPharmacy: isPayAtPharmacy,
        pharmacistName: pharmacistName,
        date: new Date().toLocaleString("en-IN")
      });
      setShowDispenseReceiptModal(true);
      setShowDispenseWorkdeskModal(false);

      setSelectedWalkIn(null);
      setDispenseItems([]);
      loadAllData();
    } catch (e) {
      console.error(e);
      showToast("Dispensation failed", "error");
    }
  };

  // Open Sales Return Modal
  const handleOpenSalesReturn = (prefillLog = null) => {
    if (userRole === "Store Manager") {
      showToast("Access Denied: Store Managers cannot process sales returns.", "error");
      return;
    }
    setReturnNotes("");
    setReturnReason("Doctor Changed Prescription");
    setReturnMethod("Cash");
    setReturnRestock(true);
    setDirectReturnPatient(prefillLog?.patient_name || "");
    setDirectReturnMobile(prefillLog?.patient_id || "");
    setDirectReturnMed(null);
    setDirectReturnMedSearch("");
    setDirectReturnQty(10);
    setDirectReturnBatch("");
    setDirectReturnPrice("");
    setDirectReturnReason("Doctor Changed Prescription");

    if (prefillLog) {
      const med = medicines.find(m => m.medicine_name === prefillLog.medicine);
      const unitPrice = med ? (Number(med.selling_price) || Number(med.mrp) || 20) : 20;
      const soldQty = Math.abs(Number(prefillLog.quantity) || 1);

      setReturnItems([{
        medicine_name: prefillLog.medicine,
        batch_number: prefillLog.batch_number || "RETURN",
        sold_qty: null,
        return_qty: soldQty,
        unit_price: unitPrice,
        refund_amount: soldQty * unitPrice,
        reason: "Doctor Changed Prescription",
        selected: true
      }]);
    } else {
      setReturnItems([]);
    }
    setShowSalesReturnModal(true);
  };

  // Add Direct Return Medicine Item
  const handleAddDirectReturnItem = () => {
    if (!directReturnMed) {
      showToast("Please select a medicine to return", "warning");
      return;
    }
    const qty = parseInt(directReturnQty, 10);
    if (isNaN(qty) || qty <= 0) {
      showToast("Please enter a valid return quantity (e.g. 5, 10 tablets)", "warning");
      return;
    }

    const medName = directReturnMed.medicine_name || directReturnMed.name;
    const unitPrice = parseFloat(directReturnPrice) || Number(directReturnMed.selling_price) || Number(directReturnMed.mrp) || 10;
    const batchNo = directReturnBatch || (directReturnMed.batches?.[0]?.batch_number) || (directReturnMed.batch_number) || "RETURN";

    const newItem = {
      medicine_name: medName,
      batch_number: batchNo,
      sold_qty: null,
      return_qty: qty,
      unit_price: unitPrice,
      refund_amount: parseFloat((qty * unitPrice).toFixed(2)),
      reason: directReturnReason || returnReason || "Doctor Changed Prescription",
      selected: true
    };

    setReturnItems(prev => {
      const existingIdx = prev.findIndex(i => i.medicine_name.toLowerCase() === medName.toLowerCase() && i.batch_number === batchNo);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].return_qty + qty;
        updated[existingIdx] = {
          ...updated[existingIdx],
          return_qty: newQty,
          refund_amount: parseFloat((newQty * updated[existingIdx].unit_price).toFixed(2)),
          selected: true
        };
        return updated;
      }
      return [...prev, newItem];
    });

    showToast(`Added ${qty} units of ${medName} to return list`, "success");
    setDirectReturnMed(null);
    setDirectReturnMedSearch("");
    setDirectReturnQty(10);
    setDirectReturnBatch("");
    setDirectReturnPrice("");
  };

  // Remove item from return list
  const handleRemoveReturnItem = (idx) => {
    setReturnItems(prev => prev.filter((_, i) => i !== idx));
  };

  // Update return qty for an item
  const handleUpdateReturnQty = (idx, newQty) => {
    setReturnItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      const parsed = parseInt(newQty, 10);
      const validQty = Math.max(1, isNaN(parsed) ? 1 : parsed);
      return {
        ...item,
        return_qty: validQty,
        refund_amount: parseFloat((validQty * item.unit_price).toFixed(2))
      };
    }));
  };

  // Toggle item selection
  const handleToggleReturnItem = (idx) => {
    setReturnItems(prev => prev.map((item, i) => {
      if (i !== idx) return item;
      return {
        ...item,
        selected: !item.selected
      };
    }));
  };

  // Execute Sales Return
  const handleExecuteSalesReturn = async () => {
    const selectedItems = returnItems.filter(i => i.selected && i.return_qty > 0);
    if (selectedItems.length === 0) {
      showToast("Please add at least one medicine with a valid return quantity > 0", "error");
      return;
    }

    for (const item of selectedItems) {
      if (item.return_qty <= 0) {
        showToast(`Return quantity for ${item.medicine_name} must be greater than 0`, "error");
        return;
      }
    }

    const totalRefund = selectedItems.reduce((acc, curr) => acc + curr.refund_amount, 0);
    const patientName = directReturnPatient.trim() || "Walk-in Customer";
    const patientId = directReturnMobile.trim() || "N/A";
    const invoiceNumber = `RET-INV-${Date.now().toString().slice(-6)}`;

    try {
      setIsSubmittingReturn(true);

      const returnPayload = {
        invoice_number: invoiceNumber,
        patient_name: patientName,
        patient_id: patientId,
        items: selectedItems.map(i => ({
          medicine_name: i.medicine_name,
          batch_number: i.batch_number,
          sold_qty: i.return_qty,
          return_qty: i.return_qty,
          unit_price: i.unit_price,
          refund_amount: i.refund_amount,
          reason: i.reason || returnReason
        })),
        total_refund: totalRefund,
        refund_method: returnMethod,
        restock_inventory: returnRestock,
        pharmacist: pharmacistName || "Rahul Sharma, RPh",
        notes: returnNotes
      };

      const result = await executeSalesReturn(returnPayload);

      // Record financial refund
      try {
        const refId = `tx-ret-${result.return_id}`;
        const refundTx = {
          id: refId,
          title: `Medicine Return Refund — ${patientName}`,
          type: "Refund",
          category: "Pharmacy Refund",
          patient: patientName,
          patient_name: patientName,
          date: new Date().toISOString().split("T")[0],
          amount: Math.abs(totalRefund),
          method: returnMethod || "Cash",
          status: "Processed",
          reference_id: result.return_id,
          notes: `Sales return (${result.return_id}) for ${invoiceNumber}. Items: ${selectedItems.map(i => `${i.medicine_name} (${i.return_qty} units)`).join(", ")}`
        };
        const currentCustom = JSON.parse(localStorage.getItem("hospital_custom_finance") || "[]");
        const updatedCustom = [refundTx, ...currentCustom.filter(t => t.id !== refId)];
        localStorage.setItem("hospital_custom_finance", JSON.stringify(updatedCustom));
        recordFinanceTransaction(refundTx).catch(() => null);
      } catch (fe) {
        console.warn("Finance refund record warning:", fe);
      }

      showToast(`Sales return completed! ${returnRestock ? 'Restocked to inventory.' : ''} Refund: INR ${totalRefund.toLocaleString('en-IN')}`, "success");
      setLatestReturnRecord(result);
      setShowSalesReturnModal(false);
      setShowReturnReceiptModal(true);
      await loadAllData();
    } catch (e) {
      console.error(e);
      showToast("Sales return processing failed", "error");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Print Return Receipt via Hidden Iframe (No Popup / No New Tab)
  const printReturnReceipt = (record) => {
    if (!record) return;
    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const itemsHtml = (record.items || []).map((item, idx) => `
        <tr>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${idx + 1}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;"><strong>${item.medicine_name}</strong><br><small style="color: #64748b;">Batch: ${item.batch_number || 'N/A'}</small></td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.return_qty}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">INR ${Number(item.unit_price).toFixed(2)}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; color: #0f172a;">INR ${Number(item.refund_amount).toFixed(2)}</td>
          <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; color: #64748b;">${item.reason || record.notes || 'N/A'}</td>
        </tr>
      `).join("");

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Sales Return Voucher - ${record.return_id}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 15px; margin-bottom: 20px; }
            .title { font-size: 22px; font-weight: bold; color: #0369a1; margin: 0; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .doc-type { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 12px; border-radius: 4px; font-weight: bold; font-size: 13px; margin-top: 10px; border: 1px solid #fecaca; }
            .grid { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; }
            .col { flex: 1; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
            th { background: #f8fafc; padding: 10px; border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }
            .total-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: right; margin-bottom: 30px; }
            .total-amount { font-size: 20px; font-weight: bold; color: #059669; }
            .footer { display: flex; justify-content: space-between; margin-top: 60px; font-size: 12px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            .sign-box { text-align: center; width: 200px; }
            .sign-line { border-top: 1px dashed #94a3b8; margin-top: 40px; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">THANGAM HOSPITAL</div>
            <div class="subtitle">Central Pharmacy Department • Medicine Sales Return & Refund Voucher</div>
            <div class="doc-type">OFFICIAL CREDIT NOTE / SALES RETURN RECEIPT</div>
          </div>

          <div class="grid">
            <div class="col">
              <div><strong>Return Voucher #:</strong> ${record.return_id}</div>
              <div><strong>Original Invoice #:</strong> ${record.invoice_number}</div>
              <div><strong>Return Date:</strong> ${new Date(record.return_date).toLocaleString('en-IN')}</div>
              <div><strong>Restocked to Inventory:</strong> ${record.restock_inventory ? 'Yes (Returned to Batch Stock)' : 'No (Scrapped/Quarantine)'}</div>
            </div>
            <div class="col" style="text-align: right;">
              <div><strong>Patient / Customer:</strong> ${record.patient_name}</div>
              <div><strong>Patient ID / Mobile:</strong> ${record.patient_id}</div>
              <div><strong>Refund Method:</strong> ${record.refund_method}</div>
              <div><strong>Authorized Pharmacist:</strong> ${record.pharmacist}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 40px;">#</th>
                <th>Medicine Name & Batch</th>
                <th style="text-align: center; width: 80px;">Return Qty</th>
                <th style="text-align: right; width: 100px;">Unit Rate</th>
                <th style="text-align: right; width: 120px;">Refund Total</th>
                <th style="width: 140px;">Return Reason</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-box">
            <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">TOTAL REFUND PROCESSED (${(record.refund_method || 'CASH').toUpperCase()})</div>
            <div class="total-amount">INR ${Number(record.total_refund).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>

          <div class="footer">
            <div class="sign-box">
              <div class="sign-line">Customer Signature / Acknowledgment</div>
            </div>
            <div class="sign-box">
              <div class="sign-line">Authorized Pharmacist Signature</div>
              <div style="font-size: 10px; color: #64748b;">${record.pharmacist}</div>
            </div>
          </div>
        </body>
        </html>
      `);
      doc.close();
      iframe.contentWindow.focus();
      setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 250);
    } catch (e) {
      console.error(e);
      showToast("Print failed", "error");
    }
  };

  // Add new medicine record with mandatory Batch Number & Pack Size calculation
  const handleAddNewMedicine = async (e) => {
    e.preventDefault();
    if (!newMedData.medicine_name || !newMedData.generic_name || !newMedData.selling_price && !newMedData.mrp) {
      showToast("Medicine Name, Generic Formula, and MRP are required", "error");
      return;
    }

    // MANDATORY BATCH NUMBER CHECK
    if (!newMedData.batch_number || !newMedData.batch_number.trim()) {
      showToast("Batch Number is mandatory when adding a medicine batch", "error");
      return;
    }

    if (!newMedData.expiry_date) {
      showToast("Expiry Date is mandatory for medicine batch", "error");
      return;
    }

    const packSize = parseInt(newMedData.pack_size) || 10;
    const noOfPacks = parseFloat(newMedData.no_of_packs) || 10;
    const totalUnits = packSize * noOfPacks;

    try {
      const data = {
        ...newMedData,
        generic_name: newMedData.generic_name || newMedData.medicine_name,
        brand: newMedData.brand || "",
        hsn_code: newMedData.hsn_code || "30049099",
        gst: parseFloat(newMedData.gst) != null ? parseFloat(newMedData.gst) : 12.0,
        gst_percent: parseFloat(newMedData.gst) != null ? parseFloat(newMedData.gst) : 12.0,
        tablets_per_strip: parseInt(newMedData.tablets_per_strip) || 10,
        purchase_price: parseFloat(newMedData.purchase_price) || 0.0,
        selling_price: parseFloat(newMedData.mrp || newMedData.selling_price) || 0.0,
        mrp: parseFloat(newMedData.mrp || newMedData.selling_price) || 0.0,
        min_stock: parseInt(newMedData.min_stock) || 50,
        max_stock: parseInt(newMedData.max_stock) || 500,
        reorder_level: parseInt(newMedData.reorder_level) || 100,
        rack_location: newMedData.rack_location || "Rack A-01",
        prescription_required: newMedData.category !== "OTC" ? 1 : 0,
        controlled_drug: newMedData.category === "Controlled Drug" ? 1 : 0,
        sleeping_pill: newMedData.category === "Sleeping Pill" ? 1 : 0,
        stock: totalUnits,
        current_stock: totalUnits
      };

      await createMedicine(data);

      if (typeof window !== 'undefined') {
         const batches = JSON.parse(localStorage.getItem('hospital_batches')) || [];
         batches.unshift({
           batch_number: newMedData.batch_number.trim().toUpperCase(),
           medicine: data.medicine_name,
           medicine_name: data.medicine_name,
           hsn_code: data.hsn_code,
           gst: data.gst,
           supplier: newMedData.supplier || "ABC Pharma",
           invoice_number: newMedData.invoice_number || "",
           invoice_date: newMedData.invoice_date || "",
           mfg_date: newMedData.mfg_date || null,
           exp_date: newMedData.expiry_date,
           expiry_date: newMedData.expiry_date,
           pack_size: packSize,
           no_of_packs: noOfPacks,
           total_units: totalUnits,
           current_stock: totalUnits,
           purchase_price: data.purchase_price,
           mrp: data.mrp,
           selling_price: data.selling_price,
           rack_location: data.rack_location || "Rack A-01"
         });
         localStorage.setItem('hospital_batches', JSON.stringify(batches));
      }

      showToast(`Successfully registered ${newMedData.medicine_name} (Batch: ${newMedData.batch_number.toUpperCase()}, Total: ${totalUnits} units)!`, "success");
      setIsAddModalOpen(false);
      setNewMedData({
        medicine_name: "", generic_name: "", brand: "", manufacturer: "", strength: "",
        dosage_form: "Tablet", category: "Regular Medicine", min_stock: 50, max_stock: 500,
        reorder_level: 100, rack_location: "Rack A-01", purchase_price: "", selling_price: "", mrp: "", gst: 12.0, hsn_code: "30049099",
        batch_number: "", supplier: "ABC Pharma", mfg_date: "", expiry_date: "", pack_size: 10, no_of_packs: 10, tablets_per_strip: 10,
        invoice_number: "", invoice_date: ""
      });
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast("Failed to create medicine entry", "error");
    }
  };

  // Add a new batch to an existing medicine catalog item
  const handleAddBatchToExistingMedicine = async (e) => {
    e.preventDefault();
    if (!addBatchMed) return;
    if (!newBatchData.batch_number || !newBatchData.batch_number.trim()) {
      showToast("Batch Number is mandatory", "error");
      return;
    }
    if (!newBatchData.exp_date) {
      showToast("Expiry Date is mandatory", "error");
      return;
    }
    const packSize = parseInt(newBatchData.pack_size) || 1;
    const noOfPacks = parseFloat(newBatchData.no_of_packs) || 0;
    const totalUnits = packSize * noOfPacks;

    try {
      const batches = JSON.parse(localStorage.getItem('hospital_batches')) || [];
      const batchNoUpper = newBatchData.batch_number.trim().toUpperCase();
      const existingBatch = batches.find(b => b.medicine === addBatchMed.medicine_name && b.batch_number === batchNoUpper);
      
      if (existingBatch) {
        showToast(`Batch ${batchNoUpper} already exists for ${addBatchMed.medicine_name}.`, "error");
        return;
      }

      batches.unshift({
        batch_number: batchNoUpper,
        medicine: addBatchMed.medicine_name,
        supplier: newBatchData.supplier || "ABC Pharma",
        invoice_number: newBatchData.invoice_number || "",
        invoice_date: newBatchData.invoice_date || "",
        mfg_date: newBatchData.mfg_date || null,
        exp_date: newBatchData.exp_date,
        pack_size: packSize,
        no_of_packs: noOfPacks,
        total_units: totalUnits,
        current_stock: totalUnits,
        purchase_price: parseFloat(newBatchData.purchase_price) || addBatchMed.purchase_price || 0,
        mrp: parseFloat(newBatchData.mrp) || addBatchMed.selling_price || 0,
        selling_price: parseFloat(newBatchData.mrp) || addBatchMed.selling_price || 0,
        rack_location: newBatchData.rack_location || addBatchMed.rack_location || "Rack A-01"
      });

      localStorage.setItem('hospital_batches', JSON.stringify(batches));

      await createStockMovementLog({
        medicine: addBatchMed.medicine_name,
        batch: batchNoUpper,
        previous_stock: 0,
        updated_stock: totalUnits,
        adjustment_type: "Add Batch",
        quantity: totalUnits,
        reason: "New Batch Added to Inventory",
        remarks: `Supplier: ${newBatchData.supplier || "ABC Pharma"}${newBatchData.invoice_number ? ` | Inv #${newBatchData.invoice_number}` : ''} | Pack Size: ${packSize} x ${noOfPacks} packs`,
        performed_by: pharmacistName
      });

      showToast(`Batch ${batchNoUpper} added successfully to ${addBatchMed.medicine_name}!`, "success");
      setShowAddBatchModal(false);
      setAddBatchMed(null);
      setNewBatchData({
        batch_number: "", supplier: "ABC Pharma", mfg_date: "", exp_date: "",
        pack_size: 30, no_of_packs: 10, purchase_price: "", mrp: "", rack_location: "Rack A-01",
        invoice_number: "", invoice_date: ""
      });
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast("Failed to add batch", "error");
    }
  };

  // Dynamic Register Print Handler supporting All Schedules (Schedule H, H1, X, OTC, Controlled, Regular, All)
  const handlePrintRegister = (scheduleFilter = categoryFilter) => {
    let reportTitle = "Pharmacy Drug Register";
    let badgeBg = "#fee2e2";
    let badgeColor = "#991b1b";

    if (scheduleFilter === "All" || !scheduleFilter) {
      reportTitle = "Master Pharmacy Drug Register (All Schedules)";
      badgeBg = "#e0e7ff";
      badgeColor = "#3730a3";
    } else if (scheduleFilter === "Schedule H") {
      reportTitle = "Statutory Schedule H Drug Register";
      badgeBg = "#fee2e2";
      badgeColor = "#991b1b";
    } else if (scheduleFilter === "Schedule H1") {
      reportTitle = "Statutory Schedule H1 Drug Register";
      badgeBg = "#fed7aa";
      badgeColor = "#9a3412";
    } else if (scheduleFilter === "Schedule X") {
      reportTitle = "Statutory Schedule X Narcotics Register";
      badgeBg = "#fef08a";
      badgeColor = "#854d0e";
    } else if (scheduleFilter === "Controlled Drug") {
      reportTitle = "Statutory Controlled Drug Register";
      badgeBg = "#f3e8ff";
      badgeColor = "#6b21a8";
    } else if (scheduleFilter === "OTC") {
      reportTitle = "OTC Medicine Inventory Register";
      badgeBg = "#d1fae5";
      badgeColor = "#065f46";
    } else if (scheduleFilter === "Regular Medicine") {
      reportTitle = "Regular Medicine Inventory Register";
      badgeBg = "#e2e8f0";
      badgeColor = "#334155";
    } else {
      reportTitle = `${scheduleFilter} Drug Register`;
    }

    // Always use exact filtered list currently displayed on screen for 100% parity
    const targetMeds = (scheduleFilter === categoryFilter && (!searchQuery || searchQuery.trim() === "")) 
      ? filteredMedicines 
      : medicines.filter(m => isCategoryMatch(m, scheduleFilter));

    if (targetMeds.length === 0) {
      showToast(`No medicines found for schedule: "${scheduleFilter === "All" ? "All Schedules" : scheduleFilter}"`, "error");
      return;
    }

    const reportRows = [];
    targetMeds.forEach(med => {
      const medBatches = med.batches && med.batches.length > 0 
        ? med.batches 
        : [{
            batch_number: "N/A",
            pack_size: 10,
            no_of_packs: 0,
            total_units: med.stock || 0,
            current_stock: med.stock || 0,
            supplier: "N/A",
            mfg_date: "N/A",
            exp_date: "N/A",
            rack_location: med.rack_location || "N/A"
          }];

      medBatches.forEach(b => {
        const pSize = b.pack_size || 10;
        const cStock = b.current_stock !== undefined ? b.current_stock : 0;
        const nPacks = b.no_of_packs !== undefined ? b.no_of_packs : (pSize > 0 ? (cStock / pSize) : cStock);
        reportRows.push({
          medicine_name: med.medicine_name,
          generic_name: med.generic_name || "N/A",
          schedule: med.category || "Regular",
          batch_number: b.batch_number || "N/A",
          pack_size: pSize,
          no_of_packs: typeof nPacks === 'number' ? (Number.isInteger(nPacks) ? nPacks : nPacks.toFixed(1)) : nPacks,
          total_units: cStock,
          supplier: b.supplier || "Default Supplier",
          mfg_date: b.mfg_date || "N/A",
          exp_date: b.exp_date || "N/A",
          current_stock: cStock,
          rack_location: b.rack_location || med.rack_location || "N/A"
        });
      });
    });

    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${reportTitle} - THANGAM HOSPITAL</title>
            <style>
              @page {
                size: A4 landscape;
                margin: 10mm;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
                color: #0f172a;
                margin: 0;
                padding: 15px;
                background: #fff;
                font-size: 11px;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #4338ca;
                padding-bottom: 10px;
                margin-bottom: 15px;
              }
              .hospital-title {
                font-size: 22px;
                font-weight: 800;
                color: #1e1b4b;
                margin: 0;
                letter-spacing: 0.5px;
              }
              .pharmacy-subtitle {
                font-size: 13px;
                font-weight: 600;
                color: #4f46e5;
                margin-top: 3px;
              }
              .report-title {
                font-size: 15px;
                font-weight: 700;
                color: #0f172a;
                margin-top: 6px;
                display: inline-block;
                background: ${badgeBg};
                color: ${badgeColor};
                padding: 3px 10px;
                border-radius: 4px;
              }
              .meta-info {
                text-align: right;
                font-size: 11px;
                color: #475569;
                line-height: 1.4;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
              }
              th, td {
                border: 1px solid #cbd5e1;
                padding: 6px 8px;
                text-align: left;
              }
              th {
                background-color: #f1f5f9;
                font-weight: 700;
                color: #1e293b;
                font-size: 10.5px;
                text-transform: uppercase;
              }
              tr:nth-child(even) {
                background-color: #f8fafc;
              }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .font-mono { font-family: ui-monospace, monospace; }
              .badge-batch {
                background: #e2e8f0;
                padding: 2px 5px;
                border-radius: 3px;
                font-weight: 600;
              }
              .footer {
                margin-top: 25px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                font-size: 10px;
                color: #64748b;
                border-top: 1px solid #e2e8f0;
                padding-top: 10px;
              }
              .sign-box {
                text-align: center;
                width: 220px;
                border-top: 1px dashed #94a3b8;
                padding-top: 5px;
                margin-top: 25px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1 class="hospital-title">THANGAM HOSPITAL</h1>
                <div class="pharmacy-subtitle">Central Pharmacy & Statutory Drug Store</div>
                <div class="report-title">${reportTitle}</div>
              </div>
              <div class="meta-info">
                <div><strong>Print Date:</strong> ${dateStr}</div>
                <div><strong>Print Time:</strong> ${timeStr}</div>
                <div><strong>Generated By:</strong> ${pharmacistName || "Chief Pharmacist"}</div>
                <div><strong>Total Batches Logged:</strong> ${reportRows.length}</div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 30px;">#</th>
                  <th>Medicine Name</th>
                  <th>Generic Name</th>
                  <th>Batch Number</th>
                  <th class="text-center">Pack Size</th>
                  <th class="text-center">No. of Packs</th>
                  <th class="text-center">Total Units</th>
                  <th>Supplier</th>
                  <th class="text-center">MFG Date</th>
                  <th class="text-center">EXP Date</th>
                  <th class="text-center">Current Stock</th>
                  <th>Rack Location</th>
                </tr>
              </thead>
              <tbody>
                ${reportRows.map((r, idx) => `
                  <tr>
                    <td class="text-center font-mono">${idx + 1}</td>
                    <td><strong>${r.medicine_name}</strong></td>
                    <td>${r.generic_name}</td>
                    <td class="font-mono"><span class="badge-batch">${r.batch_number}</span></td>
                    <td class="text-center font-mono">${r.pack_size}</td>
                    <td class="text-center font-mono">${r.no_of_packs}</td>
                    <td class="text-center font-mono"><strong>${r.total_units}</strong></td>
                    <td>${r.supplier}</td>
                    <td class="text-center font-mono">${r.mfg_date}</td>
                    <td class="text-center font-mono">${r.exp_date}</td>
                    <td class="text-center font-mono"><strong>${r.current_stock}</strong></td>
                    <td class="font-mono">${r.rack_location}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="footer">
              <div>Verified &amp; Printed in accordance with statutory Drugs and Cosmetics Rules, Government of India.</div>
              <div class="sign-box">Authorized Registered Pharmacist Signature &amp; Stamp</div>
            </div>
          </body>
        </html>
      `;

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(htmlContent);
      doc.close();
      iframe.contentWindow.focus();
      setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 250);
    } catch (e) {
      console.error(e);
      showToast("Print failed", "error");
    }
  };

  // Download report of medicines whose stock levels are below reorder limits
  const downloadReorderReport = () => {
    if (purchaseRecommendations.length === 0) {
      showToast("No medicines currently require reordering", "info");
      return;
    }

    const headers = ["Medicine", "Generic Name", "Current Stock", "Reorder Level", "Suggested PO", "Unit Price (INR)", "Estimated Cost (INR)", "Supplier"];
    const rows = purchaseRecommendations.map(rec => [
      `"${(rec.medicine || "").replace(/"/g, '""')}"`,
      `"${(rec.generic || "").replace(/"/g, '""')}"`,
      rec.current_stock,
      rec.min_stock,
      rec.suggested,
      rec.price,
      rec.suggested * rec.price,
      `"${(rec.supplier || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `low_stock_reorder_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Reorder report downloaded successfully", "success");
  };

  const handleAddPOItem = () => {
    if (!poAddMedName) return;
    const med = medicines.find(m => m.medicine_name === poAddMedName);
    if (!med) return;

    if (poItems.some(i => i.medicine === med.medicine_name)) {
      showToast("Item already in PO list", "info");
      return;
    }

    setPoItems(prev => [...prev, {
      medicine: med.medicine_name,
      quantity: poAddQty,
      purchase_price: med.purchase_price || 0.0
    }]);

    setPoAddMedName("");
    setPoAddQty(100);
  };

  const handleCreateCustomPO = async (e) => {
    e.preventDefault();
    if (poItems.length === 0) {
      showToast("Please add at least one medicine item to the PO", "error");
      return;
    }

    try {
      await createPurchaseOrder({
        supplier: poSupplier,
        items: poItems
      });
      showToast(`Purchase Order created successfully for ${poSupplier}`, "success");
      setIsPOModalOpen(false);
      setPoItems([]);
      loadAllData();
    } catch (err) {
      showToast("Failed to create PO", "error");
    }
  };

  // Goods Received Processing
  const handleOpenGRNModal = (po) => {
    setSelectedPO(po);
    // Prefill receipt items from PO items (po.items may be absent in Frappe list mode)
    const items = (po.items || []).map(item => {
      const catMed = medicines.find(m => m.medicine_name === item.medicine);
      return {
        medicine: item.medicine,
        batch_number: `BATCH-${(item.medicine || "MED").split(" ")[0].toUpperCase()}-${Math.floor(1000 + Math.random()*9000)}`,
        mfg_date: new Date().toISOString().split("T")[0],
        exp_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split("T")[0],
        quantity: item.quantity || 0,
        purchase_price: item.purchase_price || 0,
        selling_price: catMed?.selling_price || ((item.purchase_price || 0) * 1.2),
        rack_location: catMed?.rack_location || "Rack A-01"
      };
    });
    setGrnItems(items);
    setGrnAddMedName("");
    setGrnAddQty(100);
    setGrnAddPrice("");
    setIsGRNModalOpen(true);
  };

  const handleAddGRNItem = () => {
    if (!grnAddMedName) return;
    const catMed = medicines.find(m => m.medicine_name === grnAddMedName);
    const price = parseFloat(grnAddPrice) || catMed?.purchase_price || 0;
    const pSize = parseInt(grnAddPackSize) || 30;
    const nPacks = parseFloat(grnAddPacksQty) || 10;
    const totUnits = pSize * nPacks;

    const newItem = {
      medicine: grnAddMedName,
      batch_number: `BATCH-${grnAddMedName.split(" ")[0].toUpperCase()}-${Math.floor(1000 + Math.random()*9000)}`,
      mfg_date: new Date().toISOString().split("T")[0],
      exp_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split("T")[0],
      pack_size: pSize,
      no_of_packs: nPacks,
      quantity: totUnits,
      purchase_price: price,
      selling_price: catMed?.selling_price || price * 1.2,
      mrp: catMed?.selling_price || price * 1.2,
      rack_location: catMed?.rack_location || "Rack A-01"
    };
    setGrnItems(prev => [...prev, newItem]);
    setGrnAddMedName("");
    setGrnAddPackSize(30);
    setGrnAddPacksQty(10);
    setGrnAddQty(300);
    setGrnAddPrice("");
  };

  const handleRemoveGRNItem = (index) => {
    setGrnItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateGRNItem = (index, field, value) => {
    setGrnItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const updated = { ...item, [field]: value };
        if (field === 'pack_size' || field === 'no_of_packs') {
          const ps = parseInt(field === 'pack_size' ? value : updated.pack_size) || 1;
          const np = parseFloat(field === 'no_of_packs' ? value : updated.no_of_packs) || 0;
          updated.quantity = ps * np;
        }
        return updated;
      }
      return item;
    }));
  };

  // Supplier CSV Import Logic
  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const rows = text.split('\n').filter(r => r.trim());
      
      if (rows.length < 2) {
        showToast("Invalid CSV or empty file.", "error");
        return;
      }
      
      const newMeds = [...medicines];
      const newBatches = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('hospital_batches')) || []) : [];
      const newRegisters = [...drugRegister];
      let updatedCount = 0;
      
      const now = new Date().toISOString();
      const today = now.split('T')[0];

      for (let i = 1; i < rows.length; i++) {
        // Simple CSV split (assuming no quoted commas for standard supplier template)
        const cols = rows[i].split(',').map(c => c.trim());
        if (cols.length < 6) continue;
        
        const [medName, batchNo, qtyStr, pPriceStr, sPriceStr, expDate] = cols;
        const qty = parseInt(qtyStr) || 0;
        const pPrice = parseFloat(pPriceStr) || 0;
        const sPrice = parseFloat(sPriceStr) || 0;
        
        if (!medName || qty <= 0) continue;
        
        // 1. Update Medicine
        let medIndex = newMeds.findIndex(m => m.medicine_name.toLowerCase() === medName.toLowerCase());
        if (medIndex === -1) {
          // Add new medicine
          const medObj = {
            name: `MED-${10000 + newMeds.length}`,
            medicine_name: medName,
            generic_name: medName,
            category: "Regular Medicine",
            stock: qty,
            min_stock: 50,
            max_stock: 200,
            selling_price: sPrice,
            disabled: 0,
            batches: []
          };
          newMeds.push(medObj);
          medIndex = newMeds.length - 1;
        } else {
          newMeds[medIndex].stock = (newMeds[medIndex].stock || 0) + qty;
          newMeds[medIndex].selling_price = sPrice > 0 ? sPrice : newMeds[medIndex].selling_price;
        }
        
        // 2. Update Batches
        const newBatchObj = {
          name: `BATCH-${batchNo}`,
          medicine: newMeds[medIndex].name || medName,
          medicine_name: medName,
          batch_number: batchNo,
          current_stock: qty,
          mfg_date: today,
          exp_date: expDate || today,
          purchase_price: pPrice,
          selling_price: sPrice
        };
        newBatches.push(newBatchObj);
        
        if (!newMeds[medIndex].batches) newMeds[medIndex].batches = [];
        const existingBatchInMed = newMeds[medIndex].batches.findIndex(b => b.batch_number === batchNo);
        if (existingBatchInMed >= 0) {
          newMeds[medIndex].batches[existingBatchInMed].current_stock += qty;
        } else {
          newMeds[medIndex].batches.push({ ...newBatchObj });
        }
        
        // 3. Log to Drug Register (Compliance)
        newRegisters.unshift({
          name: `GRN-CSV-${Date.now()}-${i}`,
          date: today,
          medicine: medName,
          batch: batchNo,
          type: "PURCHASE_IN",
          qty_in: qty,
          qty_out: 0,
          balance: newMeds[medIndex].stock,
          reference: "Supplier CSV Import",
          supplier: "Imported CSV",
          user: pharmacistName || "Admin",
          category: newMeds[medIndex].category
        });
        
        updatedCount++;
      }
      
      if (updatedCount > 0) {
        if (typeof window !== 'undefined') {
          const medsObj = {};
          newMeds.forEach(m => { medsObj[m.name || m.medicine_name] = m; });
          localStorage.setItem('hospital_medicines', JSON.stringify(medsObj));
          localStorage.setItem('hospital_batches', JSON.stringify(newBatches));
          localStorage.setItem('hospital_drug_register', JSON.stringify(newRegisters));
        }
        setMedicines(newMeds);
        setDrugRegister(newRegisters);
        showToast(`Successfully imported and updated ${updatedCount} records from CSV.`, "success");
        loadAllData();
      } else {
        showToast("No valid rows found in CSV.", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input so same file can be uploaded again if needed
  };

  const handleLogGRN = async () => {
    if (grnItems.length === 0) {
      showToast("Please add at least one medicine item before logging the receipt", "error");
      return;
    }
    const missingExp = grnItems.find(i => !i.exp_date);
    if (missingExp) {
      showToast(`Expiry date is required for ${missingExp.medicine}`, "error");
      return;
    }
    try {
      const grnResult = await receiveGoods({
        purchase_order: selectedPO.name,
        supplier: selectedPO.supplier,
        items: grnItems
      });

      // ---- Finance Recording: log purchase expense ----
      const totalPurchaseAmt = grnItems.reduce((acc, i) => acc + ((i.quantity || 0) * (i.purchase_price || 0)), 0);
      if (typeof window !== 'undefined' && totalPurchaseAmt > 0) {
        const now = Date.now();
        const storedFinance = localStorage.getItem("hospital_custom_finance");
        const financeEntries = storedFinance ? JSON.parse(storedFinance) : [];
        const grnTx = {
          id: `tx-grn-${now}`,
          title: `Medicine Purchase — GRN for PO ${selectedPO.name}`,
          type: "Expense",
          category: "Pharmacy Procurement",
          amount: totalPurchaseAmt,
          method: "Credit",
          date: new Date().toISOString().split("T")[0],
          notes: `Supplier: ${selectedPO.supplier} | Items: ${grnItems.map(i => `${i.medicine} (×${i.quantity})`).join(", ")}`
        };
        financeEntries.unshift(grnTx);
        localStorage.setItem("hospital_custom_finance", JSON.stringify(financeEntries));
        recordFinanceTransaction(grnTx).catch(() => null);

        // ---- Compliance Audit: log GRN in drug register for controlled items ----
        const reg = localStorage.getItem('hospital_drug_register');
        const drugReg = reg ? JSON.parse(reg) : [];
        const now2 = Date.now();
        grnItems.forEach((item, idx) => {
          const catMed = medicines.find(m => m.medicine_name === item.medicine);
          const cat = catMed?.category || "Regular Medicine";
          // Log all medicines to compliance register
          drugReg.unshift({
            name: `GRN-REG-${now2}-${idx}`,
            patient_name: "Stock Receipt",
            patient_id: "PURCHASE",
            doctor: "N/A (Goods Receipt)",
            medicine: item.medicine,
            drug_category: cat,
            batch_number: item.batch_number,
            quantity: item.quantity,
            invoice_number: selectedPO.name,
            dispensing_date: new Date().toISOString(),
            pharmacist: pharmacistName,
            transaction_type: "PURCHASE_IN",
            supplier: selectedPO.supplier
          });
        });
        localStorage.setItem('hospital_drug_register', JSON.stringify(drugReg));
      }

      showToast(`Goods Receipt logged! ₹${grnItems.reduce((a,i)=>a+(i.quantity||0)*(i.purchase_price||0),0).toLocaleString("en-IN")} purchase recorded in Finance.`, "success");
      setIsGRNModalOpen(false);
      setSelectedPO(null);
      setGrnItems([]);
      loadAllData();
    } catch (e) {
      console.error(e);
      showToast("Failed to log goods receipt", "error");
    }
  };

  // PDF Generation - Invoice Print Format
  const generatePDFInvoice = async (invNo, pName, pMobile, docName, items, totalVal, paymentMethod = "Cash", isPaidAtCounter = true) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
      let posY = 15;

      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("THANGAM HOSPITAL", 74, posY, { align: "center" });
      posY += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("123 Health City Road, Coimbatore - 641012", 74, posY, { align: "center" });
      posY += 4;
      doc.text("Phone: +91 422 2345678 | GSTIN: 33AAAAA1111A1Z1", 74, posY, { align: "center" });
      posY += 6;

      // Divider
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(10, posY, 138, posY);
      posY += 6;

      // Invoice Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(79, 70, 229); // indigo-600
      doc.text("PHARMACY DISPENSING INVOICE", 10, posY);
      posY += 6;

      // Metadata
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`Invoice No: ${invNo}`, 10, posY);
      doc.text(`Date: ${new Date().toLocaleString("en-IN")}`, 85, posY);
      posY += 4;
      doc.text(`Patient Name: ${pName}`, 10, posY);
      doc.text(`ID/Mobile: ${pMobile}`, 85, posY);
      posY += 4;
      doc.text(`Prescribed By: Dr. ${docName.replace("Dr. ", "")}`, 10, posY);
      doc.text(`Payment Method: ${paymentMethod}`, 85, posY);
      posY += 6;

      doc.line(10, posY, 138, posY);
      posY += 5;

      // Items table header
      doc.setFont("helvetica", "bold");
      doc.setFillColor(248, 250, 252);
      doc.rect(10, posY - 3, 128, 5, "F");
      doc.text("Medicine / Batch Details", 12, posY);
      doc.text("Qty", 80, posY, { align: "center" });
      doc.text("Deducted Batch", 100, posY, { align: "center" });
      doc.text("Total", 135, posY, { align: "right" });
      posY += 5;
      doc.line(10, posY - 2, 138, posY - 2);

      doc.setFont("helvetica", "normal");
      (items || []).forEach(item => {
        const medName = item.medicine_name;
        const totalQty = item.requested_qty || item.qty || 1;
        const isOutside = item.source === "Outside Purchase" || item.dispense_status === "Outside Purchase";
        const isPartial = item.dispense_status === "Partially Dispensed";
        
        let batchNames = "";
        let price = 0;
        let lineTotal = 0;
        let qtyStr = String(totalQty);

        if (isOutside) {
          batchNames = "Outside Purchase";
          qtyStr = `${totalQty} (Outside)`;
          lineTotal = 0;
        } else {
          batchNames = (item.deductions || []).map(d => `${d.batch_number} (x${d.qty})`).join(", ");
          // Use pre-computed line_total if available; fallback to unit_price * qty; then 0
          if (item.line_total !== undefined) {
            lineTotal = item.line_total;
          } else if (item.unit_price !== undefined) {
            lineTotal = totalQty * item.unit_price;
          } else {
            // Prescription items: lookup from medicine catalog
            const medsLocal = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
            const price = medsLocal[medName]?.selling_price || 0;
            lineTotal = totalQty * price;
          }

          if (isPartial) {
            const dispensedQty = item.dispensed_qty || totalQty;
            qtyStr = `${dispensedQty} / ${totalQty}`;
            lineTotal = isPartial ? (dispensedQty * (item.unit_price || 0)) : lineTotal;
          }
        }

        doc.setFont("helvetica", "bold");
        doc.text(medName, 12, posY);
        doc.setFont("helvetica", "normal");
        doc.text(qtyStr, 80, posY, { align: "center" });
        doc.text(batchNames || "N/A", 100, posY, { align: "center", maxWidth: 32 });
        doc.text(isOutside ? "Outside (₹0)" : `₹${lineTotal.toFixed(2)}`, 135, posY, { align: "right" });
        posY += 6;
        
        if (isOutside) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(7);
          doc.setTextColor(156, 163, 175);
          doc.text("Medicine Purchased Outside Hospital - Dispensing Fee: ₹0", 12, posY - 2);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          posY += 3;
        }
      });

      doc.line(10, posY, 138, posY);
      posY += 6;

      // Grand total
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("GRAND TOTAL (incl. GST):", 65, posY);
      doc.text(`INR ${Number(totalVal || 0).toFixed(2)}`, 135, posY, { align: "right" });
      posY += 10;

      // Bottom Stamp
      if (isPaidAtCounter) {
        doc.setDrawColor(16, 185, 129); // emerald-500
        doc.setLineWidth(0.5);
        doc.rect(45, posY, 58, 10);
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(9);
        doc.text("PAID & DISPENSED", 74, posY + 6, { align: "center" });
      } else {
        doc.setDrawColor(245, 158, 11); // amber-500
        doc.setLineWidth(0.5);
        doc.rect(36, posY, 76, 10);
        doc.setTextColor(217, 119, 6);
        doc.setFontSize(8.5);
        doc.text("FORWARDED TO BILLING DESK", 74, posY + 6, { align: "center" });
      }

      doc.save(`pharmacy_invoice_${invNo}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    }
  };

  // Print Dispensation Receipt via Hidden Iframe (No Popup / No New Tab)
  const printDispenseReceipt = (record) => {
    if (!record) return;
    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const isPaid = record.isPaidAtPharmacy;
      const rowsHtml = (record.items || []).map(item => {
        const isOutside = item.source === "Outside Purchase" || item.dispense_status === "Outside Purchase";
        const totalQty = item.requested_qty || item.qty || 1;
        const batchNames = isOutside ? "Outside Purchase" : (item.deductions || []).map(d => `${d.batch_number} (x${d.qty})`).join(", ") || "Batch Stored";
        const lineTotal = isOutside ? 0 : (item.line_total !== undefined ? item.line_total : (totalQty * (item.unit_price || 0)));

        return `
          <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600;">${item.medicine_name}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center;">${totalQty}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b;">${batchNames}</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${isOutside ? 'Outside (₹0)' : '₹' + lineTotal.toFixed(2)}</td>
          </tr>
        `;
      }).join("");

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Thangam Hospital - Pharmacy Invoice ${record.invoiceNumber}</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #0f172a; max-width: 600px; margin: 0 auto; }
              .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
              .hosp-name { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px; }
              .hosp-sub { font-size: 11px; color: #64748b; margin-top: 3px; }
              .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-top: 8px; }
              .badge-paid { background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
              .badge-fwd { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px; margin-bottom: 16px; }
              .label { color: #64748b; font-size: 11px; font-weight: 500; }
              .val { font-weight: 600; color: #0f172a; }
              table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
              th { background: #f8fafc; padding: 8px; text-align: left; font-size: 11px; color: #475569; border-bottom: 2px solid #cbd5e1; }
              .total-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; padding: 10px 0; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; margin-bottom: 16px; }
              .stamp { text-align: center; margin: 16px auto; padding: 8px 16px; width: fit-content; border-radius: 6px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
              .stamp-paid { border: 2px dashed #16a34a; color: #16a34a; }
              .stamp-fwd { border: 2px dashed #d97706; color: #d97706; }
              .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 20px; font-style: italic; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="hosp-name">THANGAM HOSPITAL</div>
              <div class="hosp-sub">123 Health City Road, Coimbatore - 641012 | GSTIN: 33AAAAA1111A1Z1</div>
              <div class="hosp-sub">Pharmacy Dispensing & Outpatient Bill</div>
              <div class="badge ${isPaid ? 'badge-paid' : 'badge-fwd'}">
                ${isPaid ? 'PAID AT PHARMACY COUNTER' : 'FORWARDED TO CENTRAL BILLING (DUE AT BILLING DESK)'}
              </div>
            </div>
            
            <div class="grid">
              <div><span class="label">Invoice No:</span> <span class="val">${record.invoiceNumber}</span></div>
              <div><span class="label">Date:</span> <span class="val">${record.date || new Date().toLocaleString()}</span></div>
              <div><span class="label">Patient Name:</span> <span class="val">${record.patientName}</span></div>
              <div><span class="label">Mobile/ID:</span> <span class="val">${record.patientMobile}</span></div>
              <div><span class="label">Doctor:</span> <span class="val">${record.doctorName}</span></div>
              <div><span class="label">Payment Mode:</span> <span class="val">${record.paymentMethod || 'Cash'}</span></div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Medicine / Details</th>
                  <th style="text-align: center;">Qty</th>
                  <th style="text-align: center;">Deducted Batch</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="total-row">
              <span>GRAND TOTAL (incl. GST):</span>
              <span>₹${(record.totalVal || 0).toFixed(2)}</span>
            </div>

            <div class="stamp ${isPaid ? 'stamp-paid' : 'stamp-fwd'}">
              ${isPaid ? 'PAID & DISPENSED' : 'FORWARDED TO BILLING DESK'}
            </div>

            <div class="footer">
              Pharmacist: ${record.pharmacistName || 'Registered Pharmacist, RPh'}<br />
              Thank you for choosing Thangam Hospital. Get well soon!
            </div>
          </body>
        </html>
      `);
      doc.close();
      iframe.contentWindow.focus();
      setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }, 250);
    } catch (e) {
      console.error(e);
      showToast("Print failed", "error");
    }
  };

  // PDF Generation - GRN / Purchase Bill
  const downloadGRNInvoice = async (po) => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
    let posY = 15;

    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("THANGAM HOSPITAL", 74, posY, { align: "center" });
    posY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text("123 Health City Road, Coimbatore - 641012", 74, posY, { align: "center" });
    posY += 4;
    doc.text("Phone: +91 422 2345678 | GSTIN: 33AAAAA1111A1Z1", 74, posY, { align: "center" });
    posY += 6;

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(10, posY, 138, posY);
    posY += 6;

    // Invoice Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.text("GOODS RECEIPT / PURCHASE BILL", 10, posY);
    posY += 6;

    // Metadata
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`PO Reference: ${po.name}`, 10, posY);
    doc.text(`Date: ${new Date(po.date).toLocaleDateString("en-IN")}`, 138, posY, { align: "right" });
    posY += 5;
    doc.text(`Supplier: ${po.supplier}`, 10, posY);
    doc.text(`Status: ${po.status}`, 138, posY, { align: "right" });
    posY += 8;

    // Table Header
    doc.setFont("helvetica", "bold");
    doc.setFillColor(248, 250, 252);
    doc.rect(10, posY, 128, 6, "F");
    doc.text("Item / Medicine", 12, posY + 4);
    doc.text("Qty", 90, posY + 4, { align: "center" });
    doc.text("Price", 110, posY + 4, { align: "right" });
    doc.text("Total", 136, posY + 4, { align: "right" });
    posY += 8;

    // Table Rows
    doc.setFont("helvetica", "normal");
    const items = po.items || [];
    items.forEach(item => {
      doc.text(item.medicine || "-", 12, posY);
      doc.text(item.quantity?.toString() || "0", 90, posY, { align: "center" });
      doc.text(`${(item.purchase_price || 0).toFixed(2)}`, 110, posY, { align: "right" });
      doc.text(`${((item.quantity || 0) * (item.purchase_price || 0)).toFixed(2)}`, 136, posY, { align: "right" });
      posY += 6;
    });

    // Divider
    doc.setDrawColor(226, 232, 240);
    doc.line(10, posY, 138, posY);
    posY += 6;

    // Total
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("TOTAL AMOUNT", 90, posY);
    doc.text(`Rs. ${po.total_amount?.toFixed(2)}`, 136, posY, { align: "right" });

    // Download
    doc.save(`GRN_Bill_${po.name}.pdf`);
    } catch (e) {
      console.error("GRN PDF error", e);
    }
  };

  // ============================================================================
  // PO GENERATION FROM SUGGESTIONS
  // ============================================================================
  const handleCreatePOFromSuggestion = () => {
    if (!poSuggItem) return;
    const { medicine, supplier, suggested, price } = poSuggItem;
    
    const newPO = {
      name: `PO-${supplier.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
      supplier: supplier,
      date: new Date().toISOString().split("T")[0],
      status: "Draft",
      total_amount: suggested * price,
      items: [{
        medicine: medicine,
        quantity: suggested,
        purchase_price: price,
        amount: suggested * price
      }]
    };
    
    if (typeof window !== 'undefined') {
      const updatedPOs = [newPO, ...purchaseOrders];
      localStorage.setItem('hospital_purchase_orders', JSON.stringify(updatedPOs));
      setPurchaseOrders(updatedPOs);
    }
    
    showToast(`Purchase Order created as Draft for ${medicine}`, "success");
    setShowPOSuggModal(false);
    setPoSuggItem(null);
  };

  const handleBulkGeneratePOs = () => {
    if (userRole !== "Store Manager" && userRole !== "Administrator") {
      showToast("Access Denied: Only Store Managers or Admins can generate POs.", "error");
      return;
    }
    
    if (purchaseRecommendations.length === 0) {
      showToast("No suggestions available.", "error");
      return;
    }

    // Instead of generating POs directly, we open the edit modal with the current suggestions
    // We make a deep copy so edits don't mutate the useMemo array
    setBulkPOItems(JSON.parse(JSON.stringify(purchaseRecommendations)));
    setShowBulkPOModal(true);
  };

  const handleConfirmAndDownloadBulkPOs = async () => {
    const bySupplier = {};
    bulkPOItems.forEach(rec => {
      // Only include items where suggested > 0
      if (rec.suggested > 0) {
        if (!bySupplier[rec.supplier]) bySupplier[rec.supplier] = [];
        bySupplier[rec.supplier].push(rec);
      }
    });

    if (Object.keys(bySupplier).length === 0) {
      showToast("No items with valid quantities to order.", "error");
      return;
    }

    const newPOs = [];
    Object.keys(bySupplier).forEach(supplier => {
      const items = bySupplier[supplier].map(rec => ({
        medicine: rec.medicine,
        quantity: rec.suggested,
        current_stock: rec.current_stock,
        supplier: rec.supplier,
        purchase_price: rec.price,
        amount: rec.suggested * rec.price
      }));
      const totalAmt = items.reduce((sum, item) => sum + item.amount, 0);
      newPOs.push({
        name: `PO-${supplier.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
        supplier: supplier,
        date: new Date().toISOString().split("T")[0],
        status: "Draft",
        total_amount: totalAmt,
        items: items
      });
    });

    if (typeof window !== 'undefined') {
      const updatedPOs = [...newPOs, ...purchaseOrders];
      localStorage.setItem('hospital_purchase_orders', JSON.stringify(updatedPOs));
      setPurchaseOrders(updatedPOs);
    }
    
    // Generate PDF for the bulk PO request
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      let posY = 20;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Bulk Purchase Order Request", 105, posY, { align: "center" });
      posY += 10;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 105, posY, { align: "center" });
      posY += 15;

      newPOs.forEach((po) => {
        if (posY > 250) { doc.addPage(); posY = 20; }
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Supplier: ${po.supplier}`, 14, posY);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`PO Ref: ${po.name} (Draft)`, 140, posY);
        posY += 8;

        const tableData = po.items.map((item, i) => [
          i + 1,
          item.medicine,
          item.supplier,
          item.current_stock,
          item.quantity
        ]);

        autoTable(doc, {
          startY: posY,
          head: [["#", "Medicine", "Supplier", "Current Stock", "Order Qty"]],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
          styles: { fontSize: 8 }
        });
        
        posY = doc.lastAutoTable.finalY + 15;
      });

      doc.save(`Bulk_Purchase_Orders_${new Date().toISOString().split("T")[0]}.pdf`);
      showToast(`Successfully generated ${newPOs.length} Draft Purchase Orders and downloaded PDF`, "success");
    } catch (e) {
      console.error("Bulk PO PDF failed", e);
    }
    setShowBulkPOModal(false);
  };

  const handleDownloadExpiringReport = async () => {
    const { type, value } = expiringReportTimeframe;
    const thresholdDays = type === 'Months' ? value * 30 : value;
    const today = new Date();
    
    const expiringItems = [];
    
    medicines.forEach(med => {
      if (med.batches && Array.isArray(med.batches)) {
        med.batches.forEach(b => {
          if (!b.exp_date || b.current_stock <= 0) return;
          const expDate = new Date(b.exp_date);
          const diffTime = expDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= thresholdDays) {
            expiringItems.push({
              medicine: med.medicine_name,
              category: med.category,
              batch: b.batch_number,
              qty: b.current_stock,
              expiry: b.exp_date,
              daysLeft: diffDays
            });
          }
        });
      }
    });

    if (expiringItems.length === 0) {
      showToast("No medicines found expiring within this timeframe.", "info");
      return;
    }

    // Sort by days left ascending
    expiringItems.sort((a, b) => a.daysLeft - b.daysLeft);

    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      let posY = 20;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Expiring Medicines Report", 105, posY, { align: "center" });
      posY += 10;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Timeframe: Expiring within ${value} ${type}`, 105, posY, { align: "center" });
      posY += 5;
      doc.text(`Generated On: ${new Date().toLocaleDateString()}`, 105, posY, { align: "center" });
      posY += 15;

      const tableData = expiringItems.map((item, i) => [
        i + 1,
        item.medicine,
        item.batch,
        item.qty,
        new Date(item.expiry).toLocaleDateString(),
        item.daysLeft < 0 ? "Expired" : `${item.daysLeft} days`
      ]);

      autoTable(doc, {
        startY: posY,
        head: [["#", "Medicine", "Batch No", "Stock Qty", "Expiry Date", "Status"]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] }, // Orange theme for expiring
        styles: { fontSize: 9 }
      });

      doc.save(`Expiring_Medicines_Report_${new Date().toISOString().split("T")[0]}.pdf`);
      showToast("Expiring report generated successfully", "success");
    } catch (e) {
      console.error("Expiring report PDF failed", e);
    }
    setShowExpiringReportModal(false);
  };

  // PDF Export for Government Compliance Registers
  const exportRegisterPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      let posY = 20;

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("THANGAM HOSPITAL - PHARMACY DEPT", 148, posY, { align: "center" });
    posY += 7;

    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38); // Red for statutory records
    doc.text(`COMPLIANCE DRUG RECORDS: ${selectedRegister.toUpperCase()}`, 148, posY, { align: "center" });
    posY += 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Report Generated On: ${new Date().toLocaleString("en-IN")} | Compliance Standard: Drugs & Cosmetics Act`, 148, posY, { align: "center" });
    posY += 10;

    doc.line(15, posY, 282, posY);
    posY += 6;

    // Grid columns
    doc.setFont("helvetica", "bold");
    doc.setFillColor(241, 245, 249);
    doc.rect(15, posY - 4, 267, 7, "F");
    doc.text("Dispensing Date", 17, posY);
    doc.text("Patient Name (Mobile)", 55, posY);
    doc.text("Prescribing Doctor", 100, posY);
    doc.text("Medication Name", 140, posY);
    doc.text("Category", 185, posY);
    doc.text("Batch", 215, posY);
    doc.text("Qty", 245, posY);
    doc.text("Invoice ID", 258, posY);
    posY += 5;
    doc.line(15, posY - 2, 282, posY - 2);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    activeRegisterLogs.forEach(log => {
      const dateStr = new Date(log.dispensing_date).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
      });
      doc.text(dateStr, 17, posY);
      doc.text(`${log.patient_name} (${log.patient_id})`, 55, posY, { maxWidth: 42 });
      doc.text(log.doctor || "N/A", 100, posY);
      doc.text(log.medicine, 140, posY);
      doc.text(log.drug_category || "Regular", 185, posY);
      doc.text(log.batch_number, 215, posY);
      doc.text(String(log.quantity), 245, posY);
      doc.text(log.invoice_number, 258, posY);
      posY += 8;

      if (posY > 185) {
        doc.addPage();
        posY = 20;
      }
    });

    // Signature lines
    posY += 12;
    if (posY > 185) {
      doc.addPage();
      posY = 30;
    }
    doc.line(15, posY, 282, posY);
    posY += 10;
    doc.setFont("helvetica", "bold");
    doc.text("Registered Pharmacist Signature", 20, posY);
    doc.text("Chief Compliance Officer / Inspector", 220, posY);
    posY += 4;
    doc.setFont("helvetica", "italic");
    doc.text("Name: _________________________", 20, posY);
    doc.text("Stamp & Date: _________________________", 220, posY);

    doc.save(`${selectedRegister.replace(" ", "_")}_Register_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (e) {
      console.error("Export register PDF failed", e);
    }
  };

  // CSV Export for Government Compliance Registers
  const exportRegisterCSV = () => {
    const headers = ["Dispensing Date", "Patient Name", "Patient Mobile", "Doctor", "Medicine", "Category", "Batch Number", "Quantity", "Invoice ID", "Pharmacist"];
    const rows = activeRegisterLogs.map(log => [
      new Date(log.dispensing_date).toISOString(),
      log.patient_name,
      log.patient_id,
      log.doctor,
      log.medicine,
      log.drug_category,
      log.batch_number,
      log.quantity,
      log.invoice_number,
      log.pharmacist
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedRegister.replace(" ", "_")}_Register_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-300 font-sans">
      
      {/* Toast Alert System */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg border text-xs font-semibold animate-in slide-in-from-top-2 duration-200
              ${t.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : ""}
              ${t.type === "error" ? "bg-rose-50 text-rose-800 border-rose-200" : ""}
              ${t.type === "info" ? "bg-slate-900 text-white border-slate-800" : ""}`}
          >
            {t.type === "success" && <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
            {t.type === "error" && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
            {t.type === "info" && <Info className="w-4 h-4 text-indigo-400 shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Add New Medicine Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col p-0 rounded-2xl bg-white border border-slate-200 shadow-2xl">
              {/* Header */}
              <div className="p-5 px-6 border-b border-slate-100 bg-white shrink-0 pr-12">
                <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">Add New Medicine</DialogTitle>
              </div>

              {/* Form Body */}
              <form onSubmit={handleAddNewMedicine} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs bg-white">
                {/* 1. Medicine Information */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-blue-600">Medicine Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="med-name" className="text-xs text-slate-700 font-medium">Medicine Name <span className="text-red-500">*</span></Label>
                      <Input
                        id="med-name"
                        placeholder="e.g. Paracetamol 650mg"
                        value={newMedData.medicine_name || ""}
                        onChange={(e) => setNewMedData(p => ({ ...p, medicine_name: e.target.value }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="med-generic" className="text-xs text-slate-700 font-medium">Generic Formula <span className="text-red-500">*</span></Label>
                      <Input
                        id="med-generic"
                        placeholder="e.g. Paracetamol"
                        value={newMedData.generic_name || ""}
                        onChange={(e) => setNewMedData(p => ({ ...p, generic_name: e.target.value }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="med-brand" className="text-xs text-slate-700 font-medium">Brand / Trade Name</Label>
                      <Input
                        id="med-brand"
                        placeholder="e.g. Calpol 650"
                        value={newMedData.brand || ""}
                        onChange={(e) => setNewMedData(p => ({ ...p, brand: e.target.value }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="med-cat" className="text-xs text-slate-700 font-medium">Drug Category <span className="text-red-500">*</span></Label>
                      <select
                        id="med-cat"
                        value={newMedData.category || "Regular Medicine"}
                        onChange={(e) => setNewMedData(p => ({ ...p, category: e.target.value }))}
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500 text-slate-800 transition"
                      >
                        <option value="Regular Medicine">Regular Medicine</option>
                        <option value="Schedule H">Schedule H</option>
                        <option value="Schedule H1">Schedule H1</option>
                        <option value="Schedule X">Schedule X</option>
                        <option value="OTC">OTC</option>
                        <option value="Controlled Drug">Controlled Drug</option>
                        <option value="Sleeping Pill">Sleeping Pill</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="med-form" className="text-xs text-slate-700 font-medium">Dosage Form</Label>
                      <select
                        id="med-form"
                        value={newMedData.dosage_form || "Tablet"}
                        onChange={(e) => setNewMedData(p => ({ ...p, dosage_form: e.target.value }))}
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500 text-slate-800 transition"
                      >
                        <option value="Tablet">Tablet</option>
                        <option value="Capsule">Capsule</option>
                        <option value="Syrup">Syrup</option>
                        <option value="Injection">Injection</option>
                        <option value="Ointment">Ointment</option>
                        <option value="Drops">Drops</option>
                        <option value="Powder">Powder</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {(newMedData.dosage_form === "Tablet" || newMedData.dosage_form === "Capsule" || !newMedData.dosage_form) ? (
                      <div className="space-y-1.5">
                        <Label htmlFor="med-tabs-per-strip" className="text-xs text-slate-700 font-medium">Tabs / Strip <span className="text-red-500">*</span></Label>
                        <Input
                          id="med-tabs-per-strip"
                          type="number"
                          min="1"
                          placeholder="10"
                          value={newMedData.tablets_per_strip ?? 10}
                          onChange={(e) => setNewMedData(p => ({ ...p, tablets_per_strip: parseInt(e.target.value) || 1 }))}
                          className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                          required
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <Label htmlFor="med-rack-alt" className="text-xs text-slate-700 font-medium">Rack Location</Label>
                        <Input
                          id="med-rack-alt"
                          placeholder="Rack A-01"
                          value={newMedData.rack_location || "Rack A-01"}
                          onChange={(e) => setNewMedData(p => ({ ...p, rack_location: e.target.value }))}
                          className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. INITIAL INVENTORY BATCH DETAILS */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-blue-600 uppercase tracking-wide">INITIAL INVENTORY BATCH DETAILS</h4>
                    <span className="text-[10px] font-bold text-blue-600 tracking-wide">* BATCH NUMBER MANDATORY</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="med-batch" className="text-xs text-slate-700 font-medium">Batch Number <span className="text-red-500">*</span></Label>
                      <Input
                        id="med-batch"
                        placeholder="E.G. PCM-2026-A"
                        value={newMedData.batch_number || ""}
                        onChange={(e) => setNewMedData(p => ({ ...p, batch_number: e.target.value }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs font-mono uppercase focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="med-supplier" className="text-xs text-slate-700 font-medium">Supplier <span className="text-red-500">*</span></Label>
                      <select
                        id="med-supplier"
                        value={newMedData.supplier || "ABC Pharma"}
                        onChange={(e) => setNewMedData(p => ({ ...p, supplier: e.target.value }))}
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500 text-slate-800 transition"
                      >
                        {suppliers.map(s => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="med-inv-number" className="text-xs text-slate-700 font-medium">Invoice Number</Label>
                      <Input
                        id="med-inv-number"
                        placeholder="E.G. PUR/2026/015"
                        value={newMedData.invoice_number || ""}
                        onChange={(e) => setNewMedData(p => ({ ...p, invoice_number: e.target.value }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs font-mono uppercase focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="med-inv-date" className="text-xs text-slate-700 font-medium">Invoice Date</Label>
                      <Input
                        id="med-inv-date"
                        type="date"
                        placeholder="dd-mm-yyyy"
                        value={newMedData.invoice_date || ""}
                        onChange={(e) => setNewMedData(p => ({ ...p, invoice_date: e.target.value }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="med-exp-date" className="text-xs text-slate-700 font-medium">EXP Date (Month &amp; Year) <span className="text-red-500">*</span></Label>
                      <Input
                        id="med-exp-date"
                        type="month"
                        value={newMedData.expiry_date || ""}
                        onChange={(e) => setNewMedData(p => ({ ...p, expiry_date: e.target.value }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="med-rack" className="text-xs text-slate-700 font-medium">Rack Location</Label>
                      <Input
                        id="med-rack"
                        placeholder="Rack A-01"
                        value={newMedData.rack_location || "Rack A-01"}
                        onChange={(e) => setNewMedData(p => ({ ...p, rack_location: e.target.value }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="med-pack-size" className="text-xs text-slate-700 font-medium">Pack Size (Units/Pack) <span className="text-red-500">*</span></Label>
                      <Input
                        id="med-pack-size"
                        type="number"
                        min="1"
                        placeholder="10"
                        value={newMedData.pack_size ?? 10}
                        onChange={(e) => setNewMedData(p => ({ ...p, pack_size: parseInt(e.target.value) || 0 }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs font-mono font-semibold focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="med-no-packs" className="text-xs text-slate-700 font-medium">No. of Packs <span className="text-red-500">*</span></Label>
                      <Input
                        id="med-no-packs"
                        type="number"
                        min="0"
                        step="0.5"
                        placeholder="10"
                        value={newMedData.no_of_packs ?? 10}
                        onChange={(e) => setNewMedData(p => ({ ...p, no_of_packs: parseFloat(e.target.value) || 0 }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs font-mono font-semibold focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        required
                      />
                    </div>
                  </div>

                  {/* AUTOMATIC TOTAL STOCK CALCULATION Banner */}
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-blue-600 block text-[10px] uppercase tracking-wider font-bold">
                        AUTOMATIC TOTAL STOCK CALCULATION
                      </span>
                      <span className="font-medium text-slate-700 text-xs mt-0.5 block">
                        Pack Size: <strong>{newMedData.pack_size || 0}</strong> tablets &nbsp;×&nbsp; No. of Packs: <strong>{newMedData.no_of_packs || 0}</strong>
                      </span>
                    </div>
                    <div className="text-right pl-4 border-l border-blue-200">
                      <span className="text-[10px] text-blue-600 block uppercase tracking-wider font-bold">TOTAL UNITS</span>
                      <span className="text-lg font-black font-mono text-blue-700 block">
                        {(parseInt(newMedData.pack_size) || 0) * (parseFloat(newMedData.no_of_packs) || 0)} units
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Pricing & Safety Thresholds */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-semibold text-blue-600">Pricing &amp; Thresholds</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="med-pur" className="text-xs text-slate-700 font-medium">Purchase Price (₹) <span className="text-red-500">*</span></Label>
                      <Input
                        id="med-pur"
                        type="number"
                        step="0.01"
                        placeholder="₹"
                        value={newMedData.purchase_price || ""}
                        onChange={(e) => setNewMedData(p => ({ ...p, purchase_price: e.target.value }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="med-mrp" className="text-xs text-slate-700 font-medium">MRP (₹) <span className="text-red-500">*</span></Label>
                      <Input
                        id="med-mrp"
                        type="number"
                        step="0.01"
                        placeholder="₹"
                        value={newMedData.mrp || newMedData.selling_price || ""}
                        onChange={(e) => setNewMedData(p => ({ ...p, mrp: e.target.value, selling_price: e.target.value }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs font-semibold focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="med-hsn" className="text-xs text-slate-700 font-medium flex items-center justify-between">
                        <span>HSN Code</span>
                        <span className="text-[10px] text-slate-400 font-normal">e.g. 3004 / 30049099</span>
                      </Label>
                      <Input
                        id="med-hsn"
                        placeholder="30049099"
                        value={newMedData.hsn_code || ""}
                        onChange={(e) => setNewMedData(p => ({ ...p, hsn_code: e.target.value }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="med-gst" className="text-xs text-slate-700 font-medium">GST Rate (%)</Label>
                      <select
                        id="med-gst"
                        value={newMedData.gst ?? 12}
                        onChange={(e) => setNewMedData(p => ({ ...p, gst: parseFloat(e.target.value) || 0 }))}
                        className="flex h-10 w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs focus:bg-white focus:outline-none focus:border-blue-500 text-slate-800 font-medium transition"
                      >
                        <option value={0}>0% - Exempted / Nil Rated</option>
                        <option value={5}>5% - Essential Drugs / Life Saving</option>
                        <option value={12}>12% - Standard Pharma Rate (Default)</option>
                        <option value={18}>18% - Supplements / Disinfectants</option>
                        <option value={28}>28% - Specialty / Luxury</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="med-min" className="text-xs text-slate-700 font-medium">Min Stock</Label>
                      <Input
                        id="med-min"
                        type="number"
                        placeholder="50"
                        value={newMedData.min_stock ?? 50}
                        onChange={(e) => setNewMedData(p => ({ ...p, min_stock: e.target.value }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="med-max" className="text-xs text-slate-700 font-medium">Max Stock</Label>
                      <Input
                        id="med-max"
                        type="number"
                        placeholder="500"
                        value={newMedData.max_stock ?? 500}
                        onChange={(e) => setNewMedData(p => ({ ...p, max_stock: e.target.value }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="med-reorder" className="text-xs text-slate-700 font-medium">Reorder Level</Label>
                      <Input
                        id="med-reorder"
                        type="number"
                        placeholder="100"
                        value={newMedData.reorder_level ?? 100}
                        onChange={(e) => setNewMedData(p => ({ ...p, reorder_level: e.target.value }))}
                        className="h-10 bg-slate-50/60 border-slate-200 rounded-lg text-xs focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-white">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddModalOpen(false)}
                    className="h-10 px-5 text-xs rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="h-10 px-6 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                  >
                    Save Medicine &amp; Register Batch
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add New Batch to Existing Medicine Dialog */}
          <Dialog open={showAddBatchModal} onOpenChange={setShowAddBatchModal}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-serif text-base">Add New Batch to Inventory</DialogTitle>
                <DialogDescription className="text-xs">
                  {addBatchMed ? `Registering additional batch for ${addBatchMed.medicine_name}` : "Add medicine batch"}
                </DialogDescription>
              </DialogHeader>
              {addBatchMed && (
                <form onSubmit={handleAddBatchToExistingMedicine} className="space-y-4 pt-2">
                  <div className="bg-slate-100 p-2.5 rounded-md text-xs font-medium text-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-bold">{addBatchMed.medicine_name}</span>
                      <span className="text-[10px] text-slate-500 block">{addBatchMed.generic_name} • {addBatchMed.category}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold">
                      Current: {addBatchMed.stock} units
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="add-batch-no" className="text-xs font-bold text-rose-700">Batch Number *</Label>
                      <Input 
                        id="add-batch-no" placeholder="e.g. PCM-2026-B" 
                        value={newBatchData.batch_number || ""} 
                        onChange={(e) => setNewBatchData(p => ({ ...p, batch_number: e.target.value }))}
                        className="font-mono uppercase border-rose-300 focus:border-rose-500"
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="add-batch-supplier" className="text-xs font-semibold">Supplier *</Label>
                      <select
                        id="add-batch-supplier"
                        value={newBatchData.supplier || "ABC Pharma"}
                        onChange={(e) => setNewBatchData(p => ({ ...p, supplier: e.target.value }))}
                        className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
                      >
                        {suppliers.map(s => (
                          <option key={s.name} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="add-batch-inv-no" className="text-xs font-semibold">Invoice Number</Label>
                      <Input 
                        id="add-batch-inv-no" placeholder="e.g. PUR/2026/015" 
                        value={newBatchData.invoice_number || ""} 
                        onChange={(e) => setNewBatchData(p => ({ ...p, invoice_number: e.target.value }))}
                        className="font-mono uppercase bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="add-batch-inv-date" className="text-xs font-semibold">Invoice Date</Label>
                      <Input 
                        id="add-batch-inv-date" type="date"
                        value={newBatchData.invoice_date || ""} 
                        onChange={(e) => setNewBatchData(p => ({ ...p, invoice_date: e.target.value }))}
                        className="font-mono bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="add-batch-exp" className="text-xs font-bold text-rose-700">EXP Date (Month & Year) *</Label>
                    <Input 
                      id="add-batch-exp" type="month"
                      value={newBatchData.exp_date || ""} 
                      onChange={(e) => setNewBatchData(p => ({ ...p, exp_date: e.target.value }))}
                      className="border-rose-300 font-mono"
                      placeholder="YYYY-MM"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="add-batch-size" className="text-xs font-semibold">Pack Size (Units/Pack) *</Label>
                      <Input 
                        id="add-batch-size" type="number" min="1" placeholder="e.g. 30"
                        value={newBatchData.pack_size ?? 30} 
                        onChange={(e) => setNewBatchData(p => ({ ...p, pack_size: parseInt(e.target.value) || 0 }))}
                        className="font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="add-batch-packs" className="text-xs font-semibold">No. of Packs *</Label>
                      <Input 
                        id="add-batch-packs" type="number" min="0" step="0.5" placeholder="e.g. 10"
                        value={newBatchData.no_of_packs ?? 10} 
                        onChange={(e) => setNewBatchData(p => ({ ...p, no_of_packs: parseFloat(e.target.value) || 0 }))}
                        className="font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="bg-indigo-600 text-white rounded-md p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="opacity-80 block text-[10px] uppercase font-semibold">Auto Calculated Total</span>
                      <span className="font-medium">
                        {newBatchData.pack_size || 0} tabs × {newBatchData.no_of_packs || 0} packs
                      </span>
                    </div>
                    <div className="text-right pl-3 border-l border-indigo-400 font-mono font-bold text-sm">
                      {(parseInt(newBatchData.pack_size) || 0) * (parseFloat(newBatchData.no_of_packs) || 0)} units
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="add-batch-pur" className="text-xs font-semibold">Purchase Pr. (₹)</Label>
                      <Input 
                        id="add-batch-pur" type="number" placeholder="₹"
                        value={newBatchData.purchase_price || addBatchMed.purchase_price || ""} 
                        onChange={(e) => setNewBatchData(p => ({ ...p, purchase_price: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="add-batch-mrp" className="text-xs font-semibold">MRP (₹)</Label>
                      <Input 
                        id="add-batch-mrp" type="number" placeholder="₹"
                        value={newBatchData.mrp || addBatchMed.selling_price || ""} 
                        onChange={(e) => setNewBatchData(p => ({ ...p, mrp: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="add-batch-rack" className="text-xs font-semibold">Rack</Label>
                      <Input 
                        id="add-batch-rack" placeholder="Rack A-01"
                        value={newBatchData.rack_location || addBatchMed.rack_location || ""} 
                        onChange={(e) => setNewBatchData(p => ({ ...p, rack_location: e.target.value }))}
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs">
                    Save New Batch
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>

      {/* Tabs navigation content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        {/* ========================================================
            TAB: DASHBOARD
            ======================================================== */}
        <TabsContent value="dashboard" className="space-y-6 focus-visible:outline-none">
          
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 shrink-0 cursor-pointer">
                  <Pill className="w-4 h-4" />
                  <span>Medicine Operations</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl shadow-lg border border-slate-200 bg-white">
                <DropdownMenuItem
                  onClick={() => {
                    if (userRole === "Pharmacist") {
                      showToast("Access Denied: Pharmacists cannot create new medication catalog records.", "error");
                    } else {
                      setIsAddModalOpen(true);
                    }
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span>Add Medicine</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    if (userRole === "Store Manager") {
                      showToast("Access Denied: Store Managers cannot initiate medicine sales.", "error");
                    } else {
                      setOtcBasket([]);
                      setOtcCustomerName("");
                      setOtcCustomerMobile("");
                      setOtcCustomerAge("");
                      setOtcCustomerGender("Male");
                      setOtcCustomerType("Walk-in");
                      setOtcSelectedPatient(null);
                      setOtcSearchQuery("");
                      setShowOTCSaleModal(true);
                    }
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Direct Medicine Sale</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenSalesReturn()}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Return Sold Medicine</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 8 KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Revenue */}
            <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Revenue</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  ₹{metrics.totalRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Lifetime sales across counters</p>
              </div>
            </Card>

            {/* Card 2: Today's Sales */}
            <Card className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-xl p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Today's Sales</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  ₹{metrics.todaySalesRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{metrics.todayDispensing} units dispensed today</p>
              </div>
            </Card>

            {/* Card 3: Total Medicines */}
            <Card 
              onClick={() => { setStatusFilter("All"); setCategoryFilter("All"); setSearchQuery(""); handleTabChange("inventory"); }}
              className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-xl p-4 flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Medicines</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Pill className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  {metrics.totalMeds}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Active items in catalog</p>
              </div>
            </Card>

            {/* Card 4: Low Stock */}
            <Card 
              onClick={() => { setStatusFilter("Low Stock"); handleTabChange("inventory"); }}
              className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-xl p-4 flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Low Stock</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-amber-600 tracking-tight">
                  {metrics.lowStock}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Below minimum stock level</p>
              </div>
            </Card>

            {/* Card 5: Out of Stock */}
            <Card 
              onClick={() => { setStatusFilter("Out Of Stock"); handleTabChange("inventory"); }}
              className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-xl p-4 flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Out of Stock</span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                  <ShieldAlert className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-rose-600 tracking-tight">
                  {metrics.outOfStock}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">0 units available</p>
              </div>
            </Card>

            {/* Card 6: Expiring Soon */}
            <Card 
              onClick={() => { setStatusFilter("Expiring / Expired"); handleTabChange("inventory"); }}
              className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-xl p-4 flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Expiring Soon</span>
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-orange-600 tracking-tight">
                  {metrics.expiringCount}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Within next 180 days</p>
              </div>
            </Card>

            {/* Card 7: Pending Prescriptions */}
            <Card 
              onClick={() => { setQueueFilterTab("Waiting"); handleTabChange("dispensing"); }}
              className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-xl p-4 flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Prescriptions</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                  <ClipboardList className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  {metrics.pendingPrescriptions}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Waiting in queue</p>
              </div>
            </Card>

            {/* Card 8: Today's Returns */}
            <Card 
              onClick={() => { setSelectedRegister("Sales Returns"); handleTabChange("registers"); }}
              className="bg-white border-slate-200/80 shadow-xs hover:shadow-sm transition-all rounded-xl p-4 flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Today's Returns</span>
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 tracking-tight">
                  {metrics.todayReturnsCount}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {metrics.todayReturnsAmount > 0 ? `₹${metrics.todayReturnsAmount.toLocaleString("en-IN")} refunded` : "0 return items today"}
                </p>
              </div>
            </Card>
          </div>

          {/* Middle Tier: Charts (2 columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inventory by Category */}
            <Card className="shadow-xs border-slate-200/80 bg-white rounded-xl">
              <CardHeader className="p-5 border-b border-slate-100 pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                  <PieChart className="w-4 h-4 text-indigo-500" />
                  Inventory by Category
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">Distribution of active catalog items by category</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                {metrics.categoryData.length > 0 ? (
                  <div className="h-64 flex flex-col justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {metrics.categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                          itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2 pt-2 border-t border-slate-100">
                      {metrics.categoryData.map((c, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.fill }} />
                          <span>{c.name}:</span>
                          <span className="font-semibold text-slate-800">{c.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-xs text-slate-400">No inventory data available</div>
                )}
              </CardContent>
            </Card>

            {/* Sales / Dispensing Trend */}
            <Card className="shadow-xs border-slate-200/80 bg-white rounded-xl">
              <CardHeader className="p-5 border-b border-slate-100 pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  Sales & Dispensing Trend
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">Daily units dispensed over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metrics.dispensingTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={8} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                        labelStyle={{ color: '#64748b', fontSize: '11px', marginBottom: '4px' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        name="Units Dispensed"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#colorTrend)"
                        activeDot={{ r: 5, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Tier: Critical Alerts & Recent Medicine Sales (2 columns) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Critical Alerts */}
            <Card className="shadow-xs border-slate-200/80 bg-white rounded-xl flex flex-col">
              <CardHeader className="p-5 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-rose-600">
                    <ShieldAlert className="w-4 h-4" />
                    Critical Alerts
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">Low stock, out of stock & expiring medicines</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleTabChange("inventory")}
                  className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8 px-2.5"
                >
                  View Inventory
                </Button>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
                  {criticalAlerts.length > 0 ? (
                    criticalAlerts.map((alert, idx) => (
                      <div key={idx} className="p-3.5 px-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-xs">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              alert.type === 'Out of Stock'
                                ? 'bg-rose-100 text-rose-600'
                                : alert.type === 'Low Stock'
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-orange-100 text-orange-600'
                            }`}
                          >
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              <span>{alert.medicine_name}</span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                  alert.type === 'Out of Stock'
                                    ? 'bg-rose-100 text-rose-800'
                                    : alert.type === 'Low Stock'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-orange-100 text-orange-800'
                                }`}
                              >
                                {alert.type}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {alert.category}
                              {alert.date ? ` • Exp: ${new Date(alert.date).toLocaleDateString("en-IN")}` : ` • Reorder: ${alert.reorder_level}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`font-bold font-mono ${alert.stock === 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                            {alert.stock} units
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center text-xs text-slate-400 flex flex-col items-center">
                      <CheckCircle className="w-8 h-8 text-emerald-400 mb-2 opacity-50" />
                      No critical alerts. All stocks and expiry dates are healthy!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Medicine Sales */}
            <Card className="shadow-xs border-slate-200/80 bg-white rounded-xl flex flex-col">
              <CardHeader className="p-5 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                    <ClipboardList className="w-4 h-4 text-emerald-600" />
                    Recent Medicine Sales
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">Latest dispensed medicine transactions</CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setSelectedRegister("All Categories"); handleTabChange("registers"); }}
                  className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 h-8 px-2.5"
                >
                  View Registers
                </Button>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <div className="divide-y divide-slate-100 max-h-[340px] overflow-y-auto">
                  {recentSales.length > 0 ? (
                    recentSales.map((sale, idx) => (
                      <div key={idx} className="p-3.5 px-5 flex items-center justify-between hover:bg-slate-50/70 transition-colors text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Pill className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{sale.medicine}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span>
                                {new Date(sale.dispensing_date).toLocaleDateString("en-IN", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                              <span>•</span>
                              <span>{sale.patient_name || "Walk-in"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-semibold text-slate-900 font-mono">
                            {sale.quantity} units
                          </div>
                          <div className="text-[11px] font-bold text-emerald-600 font-mono mt-0.5">
                            ₹{sale.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center text-xs text-slate-400 flex flex-col items-center">
                      <ClipboardList className="w-8 h-8 text-slate-300 mb-2" />
                      No recent medicine sales recorded.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 focus-visible:outline-none">
          <Card className="shadow-xs border-slate-200 bg-white">
            <CardHeader className="bg-slate-50 border-b border-slate-200/60 p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-serif text-slate-800">Inventory Control Panel</CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">Monitor medicine master records, batches, rack placements, and statutory levels.</CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    if (userRole === "Pharmacist") {
                      showToast("Access Denied: Pharmacists cannot create new medication catalog records.", "error");
                    } else {
                      setIsAddModalOpen(true);
                    }
                  }}
                  size="sm" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 font-semibold shadow-xs h-9 text-xs px-4 rounded-lg cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </Button>
              </div>
              
              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="relative w-full sm:max-w-[240px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <Input
                    placeholder="Search name, generic, batch..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 text-xs border-slate-200 shadow-sm"
                  />
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="flex flex-col">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="h-9 rounded-md border border-indigo-200 bg-white px-3 py-1 text-xs focus:outline-none shadow-sm flex-1 sm:flex-none sm:w-[170px] font-medium text-slate-800"
                    >
                      <option value="All">Drug Schedule: All</option>
                      <option value="Regular Medicine">Regular Medicine</option>
                      <option value="Schedule H">Schedule H</option>
                      <option value="Schedule H1">Schedule H1</option>
                      <option value="Schedule X">Schedule X</option>
                      <option value="OTC">OTC</option>
                      <option value="Controlled Drug">Controlled Drug</option>
                    </select>
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs focus:outline-none shadow-sm flex-1 sm:flex-none sm:w-[140px]"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Reorder Required">Reorder Required</option>
                    <option value="Out Of Stock">Out Of Stock</option>
                    <option value="Controlled">Controlled Drugs</option>
                    <option value="Expiring / Expired">Expiring / Expired</option>
                  </select>

                  <select
                    value={invoiceFilter}
                    onChange={(e) => setInvoiceFilter(e.target.value)}
                    className={`h-9 rounded-md border px-3 py-1 text-xs focus:outline-none shadow-sm flex-1 sm:flex-none sm:w-[180px] font-medium ${
                      invoiceFilter !== "All" ? "border-indigo-500 bg-indigo-50/80 text-indigo-900 font-bold" : "border-slate-200 bg-white text-slate-800"
                    }`}
                  >
                    <option value="All">All Invoices {isMounted && importedInvoices.length > 0 ? `(${importedInvoices.length})` : ""}</option>
                    {importedInvoices.map((inv) => (
                      <option key={inv.invoice_number} value={inv.invoice_number}>
                        {inv.invoice_number} ({inv.supplier})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prominent Drug Schedule Register Print Button for All Schedules */}
                <Button 
                  onClick={() => handlePrintRegister(categoryFilter)}
                  size="sm"
                  className={`font-bold gap-1.5 shadow-sm h-9 text-xs px-3 border transition-all ${
                    categoryFilter === "Schedule H"
                      ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-700"
                      : categoryFilter === "Schedule H1"
                      ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-700"
                      : categoryFilter === "Schedule X"
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-700"
                      : categoryFilter === "Controlled Drug"
                      ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-700"
                      : categoryFilter === "OTC"
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700"
                  }`}
                >
                  <Printer className="w-4 h-4" /> {
                    categoryFilter === "All" ? "Print Register (All Schedules)" : `Print ${categoryFilter} Register`
                  }
                </Button>

                {statusFilter === "Expiring / Expired" && (
                  <Button 
                    onClick={() => setShowExpiringReportModal(true)} 
                    size="sm" 
                    variant="outline"
                    className="gap-1.5 border-orange-200 text-orange-700 hover:bg-orange-50 bg-white h-9 px-3 text-xs font-medium shadow-sm w-full sm:w-auto"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Expiring List
                  </Button>
                )}

                {(searchQuery || categoryFilter !== "All" || statusFilter !== "All" || invoiceFilter !== "All") && (
                  <Button
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("All");
                      setStatusFilter("All");
                      setInvoiceFilter("All");
                    }}
                    variant="ghost"
                    size="sm"
                    className="text-xs h-9 text-slate-500 hover:text-slate-800"
                  >
                    Reset Filters
                  </Button>
                )}
              </div>

              {/* Active Invoice Filter Banner */}
              {invoiceFilter !== "All" && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2.5 px-3.5 flex items-center justify-between text-xs text-indigo-950 shadow-xs animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="p-1 rounded bg-indigo-600 text-white font-bold text-[10px] uppercase tracking-wide flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Invoice Filter Active
                    </span>
                    <span className="font-bold text-sm text-indigo-900 font-mono">Invoice #{invoiceFilter}</span>
                    {(() => {
                      const meta = importedInvoices.find(inv => inv.invoice_number.toLowerCase() === invoiceFilter.toLowerCase());
                      return meta ? (
                        <span className="text-slate-600 font-medium">
                          • Supplier: <strong>{meta.supplier}</strong> • Date: <strong>{meta.invoice_date || 'Recent'}</strong> • Net: <strong>₹{meta.total_amount?.toLocaleString("en-IN") || '0'}</strong>
                        </span>
                      ) : null;
                    })()}
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2 py-0.5 rounded-full text-[11px]">
                      {filteredMedicines.length} Medicines Found
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setInvoiceFilter("All")}
                    className="h-7 text-xs bg-white text-indigo-700 hover:bg-indigo-100 font-semibold gap-1 px-2.5 border-indigo-300 shadow-xs"
                  >
                    Clear Invoice Filter
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto min-h-[320px] pb-16">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="px-4 py-3">Medicine</th>
                      <th className="px-3 py-3">Schedule</th>
                      <th className="px-3 py-3 font-mono">Batch No.</th>
                      <th className="px-3 py-3 text-center">Pack Size</th>
                      <th className="px-3 py-3 text-center font-bold">Total Units</th>
                      <th className="px-3 py-3 text-center">Expiry</th>
                      <th className="px-3 py-3">Rack</th>
                      <th className="px-3 py-3 text-center">Stock Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredMedicines.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                          No medicines found matching the selected filters.
                        </td>
                      </tr>
                    ) : (
                      filteredMedicines.map((med, index) => {
                        const isOut = med.stock === 0;
                        const isLow = med.stock < med.min_stock;
                        const isReorder = med.stock <= med.reorder_level;
                        const isLastRow = index >= filteredMedicines.length - 2 || filteredMedicines.length <= 2;

                        const primaryBatch = (med.batches && med.batches.length > 0) ? med.batches[0] : null;
                        const batchCount = med.batches ? med.batches.length : 0;

                        // Expiring warning checks
                        const today = new Date();
                        let badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
                        let badgeLabel = "Available";
                        
                        if (isOut) {
                          badgeColor = "bg-rose-50 text-rose-800 border-rose-200";
                          badgeLabel = "Out Of Stock";
                        } else if (isLow) {
                          badgeColor = "bg-red-50 text-red-800 border-red-200";
                          badgeLabel = "Low Stock";
                        } else if (isReorder) {
                          badgeColor = "bg-yellow-50 text-yellow-800 border-yellow-200";
                          badgeLabel = "Reorder";
                        }

                        if (med.controlled_drug === 1) {
                          badgeColor = "bg-purple-50 text-purple-800 border-purple-200";
                          badgeLabel = "Controlled Drug";
                        }

                        const anyExpired = (med.batches || []).some(b => b.exp_date && new Date(b.exp_date) <= today);
                        const anyExpiring = (med.batches || []).some(b => {
                          if (!b.exp_date) return false;
                          const diff = new Date(b.exp_date) - today;
                          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
                          return days > 0 && days <= 90;
                        });

                        if (anyExpired && !isOut) {
                          badgeColor = "bg-orange-50 text-orange-800 border-orange-200";
                          badgeLabel = "Expired Batch";
                        } else if (anyExpiring && !isLow && !isOut) {
                          badgeColor = "bg-amber-50 text-amber-800 border-amber-200";
                          badgeLabel = "Expiring Soon";
                        }

                        if (med.disabled) {
                          badgeColor = "bg-slate-100 text-slate-500 border-slate-200";
                          badgeLabel = "Deactivated";
                        }

                        return (
                          <tr key={med.medicine_name} className={`hover:bg-slate-50/50 transition-colors ${med.disabled ? "bg-slate-50/50 opacity-60" : ""}`}>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{med.medicine_name}</div>
                              <div className="text-[10px] text-slate-500">{med.generic_name} • {med.brand || "Generics"}</div>
                            </td>
                            <td className="px-3 py-3 font-medium text-slate-700">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                med.category === "Schedule H" || med.category === "Schedule H1" || med.category === "Schedule X"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : med.category === "OTC"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}>
                                {med.category || "Regular"}
                              </span>
                            </td>
                            <td className="px-3 py-3 font-mono text-[11px]">
                              {primaryBatch ? (
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px]">
                                    {primaryBatch.batch_number}
                                  </span>
                                  {batchCount > 1 && (
                                    <span className="text-[9px] text-slate-500 font-semibold bg-slate-100 px-1 rounded">
                                      +{batchCount - 1} more
                                    </span>
                                  )}
                                </div>
                              ) : med.batch_number ? (
                                <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded text-[10px]">
                                  {med.batch_number}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No Batch</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center font-mono text-slate-600">
                              {primaryBatch ? `${primaryBatch.pack_size || med.pack_size || "10'S"} tabs/pack` : `${med.pack_size || "10'S"}`}
                            </td>
                            <td className="px-3 py-3 text-center font-mono font-black text-slate-900 text-sm">
                              {med.stock ?? (primaryBatch?.current_stock || 0)}
                            </td>
                            <td className="px-3 py-3 text-center font-mono text-[11px] text-slate-600">
                              {(primaryBatch && primaryBatch.exp_date) ? primaryBatch.exp_date : (med.expiry_date || med.exp_date || "12-2028")}
                            </td>
                            <td className="px-3 py-3 text-slate-600 font-mono text-[11px]">
                              {primaryBatch ? (primaryBatch.rack_location || med.rack_location || "A-1") : (med.rack_location || "A-1")}
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                                {badgeLabel}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right relative">
                              <div className="inline-block text-left">
                                <Button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (activeMenuMed === med.medicine_name) {
                                      setActiveMenuMed(null);
                                    } else {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      const spaceBelow = window.innerHeight - rect.bottom;
                                      const menuHeight = 240;
                                      const openUp = spaceBelow < menuHeight && rect.top > menuHeight;
                                      setMenuPos({
                                        top: openUp ? Math.max(10, rect.top - menuHeight) : (rect.bottom + 4),
                                        left: Math.max(10, rect.right - 192)
                                      });
                                      setActiveMenuMed(med.medicine_name);
                                    }
                                  }} 
                                  variant="outline" size="sm" className="h-7 text-[10px] gap-1 border-slate-200 bg-white font-medium shadow-xs"
                                >
                                  Actions <ChevronDown className="w-3 h-3" />
                                </Button>
                                
                                {activeMenuMed === med.medicine_name && (
                                  <>
                                    <div 
                                      className="fixed inset-0 z-[90]" 
                                      onClick={() => setActiveMenuMed(null)}
                                    />
                                    <div 
                                      style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
                                      className="fixed z-[100] w-48 rounded-md shadow-2xl bg-white border border-slate-200 divide-y divide-slate-100 focus:outline-none text-left"
                                    >
                                      <div className="py-1">
                                        <button
                                          onClick={() => {
                                            setSelectedMedicine(med);
                                            setDetailActiveTab("batches");
                                            setActiveMenuMed(null);
                                          }}
                                          className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 w-full"
                                        >
                                          <Eye className="w-3.5 h-3.5 text-indigo-500" /> View Details &amp; Batches
                                        </button>

                                        <button
                                          onClick={() => {
                                            setAddBatchMed(med);
                                            setNewBatchData({
                                              batch_number: "",
                                              supplier: "ABC Pharma",
                                              mfg_date: "",
                                              exp_date: "",
                                              pack_size: primaryBatch?.pack_size || 30,
                                              no_of_packs: 10,
                                              purchase_price: med.purchase_price || "",
                                              mrp: med.selling_price || "",
                                              rack_location: med.rack_location || "Rack A-01"
                                            });
                                            setShowAddBatchModal(true);
                                            setActiveMenuMed(null);
                                          }}
                                          className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-emerald-700 font-semibold hover:bg-emerald-50 w-full"
                                        >
                                          <PlusCircle className="w-3.5 h-3.5 text-emerald-600" /> + Add New Batch
                                        </button>
                                        
                                        <button
                                          onClick={() => {
                                            if (userRole === "Pharmacist") {
                                              showToast("Access Denied: Pharmacists cannot edit inventory records.", "error");
                                            } else {
                                              setEditingMed(med);
                                              setShowEditMedModal(true);
                                            }
                                            setActiveMenuMed(null);
                                          }}
                                          className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 w-full"
                                        >
                                          <Edit3 className="w-3.5 h-3.5 text-blue-500" /> Edit Medicine
                                        </button>
                                        
                                        <button
                                          onClick={() => {
                                            if (userRole === "Store Manager") {
                                              showToast("Access Denied: Store Managers cannot adjust stock.", "error");
                                            } else {
                                              setAdjustingMed(med);
                                              setAdjustmentData({
                                                medicine: med.medicine_name,
                                                batch_number: med.batches && med.batches.length > 0 ? med.batches[0].batch_number : "",
                                                adjustment_type: "Add Stock",
                                                quantity: 0,
                                                reason: "",
                                                remarks: ""
                                              });
                                              setShowAdjustModal(true);
                                            }
                                            setActiveMenuMed(null);
                                          }}
                                          className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 w-full"
                                        >
                                          <Sliders className="w-3.5 h-3.5 text-amber-500" /> Stock Adjustment
                                        </button>
                                      </div>

                                      <div className="py-1">
                                        <button
                                          onClick={() => {
                                            setSelectedMedicine(med);
                                            setDetailActiveTab("batches");
                                            setActiveMenuMed(null);
                                          }}
                                          className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 w-full"
                                        >
                                          <ClipboardList className="w-3.5 h-3.5 text-purple-500" /> View Batch History
                                        </button>
                                        
                                        <button
                                          onClick={() => {
                                            setSelectedMedicine(med);
                                            setDetailActiveTab("history");
                                            setActiveMenuMed(null);
                                          }}
                                          className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 w-full"
                                        >
                                          <Activity className="w-3.5 h-3.5 text-emerald-500" /> View Stock Movement
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================
            TAB: PRESCRIPTIONS DISPENSING QUEUE
            ======================================================== */}
        {/* ========================================================
            TAB: PRESCRIPTIONS DISPENSING QUEUE
            ======================================================== */}
        <TabsContent value="dispensing" className="space-y-6 focus-visible:outline-none">
          {/* Top Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Prescriptions Queue</h1>
              <p className="text-xs text-slate-500 mt-0.5">Consultation profiles ready for pharmacy checkout.</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-3.5 rounded-lg shadow-xs gap-1.5 shrink-0 cursor-pointer">
                  <Pill className="w-4 h-4" />
                  <span>Medicine Operations</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-80 ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl shadow-lg border border-slate-200 bg-white">
                <DropdownMenuItem
                  onClick={() => {
                    if (userRole === "Store Manager") {
                      showToast("Access Denied: Store Managers cannot initiate medicine sales.", "error");
                    } else {
                      setOtcBasket([]);
                      setOtcCustomerName("");
                      setOtcCustomerMobile("");
                      setOtcCustomerAge("");
                      setOtcCustomerGender("Male");
                      setOtcCustomerType("Walk-in");
                      setOtcSelectedPatient(null);
                      setOtcSearchQuery("");
                      setShowOTCSaleModal(true);
                    }
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Direct Medicine Sale</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleOpenSalesReturn()}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4 text-rose-600" />
                  <span>Return Sold Medicine</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search & Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <Input
                placeholder="Search name or phone number..."
                value={queueSearchQuery}
                onChange={(e) => setQueueSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 text-xs border-slate-200 bg-slate-50/50 focus:bg-white rounded-lg"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              {[
                { id: "Waiting", label: "Active Queue", count: queueSummary.activeQueue },
                { id: "Completed", label: "Completed", count: queueSummary.completed }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setQueueFilterTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    queueFilterTab === tab.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.25 rounded-full text-[10px] ${
                    queueFilterTab === tab.id ? "bg-indigo-700/80 text-white" : "bg-white text-slate-600 border border-slate-200"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Prescriptions Table */}
          <Card className="shadow-xs border-slate-200/80 bg-white rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-slate-50/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="px-4 py-3 text-center w-12">#</th>
                    <th className="px-4 py-3">Patient Details</th>
                    <th className="px-3 py-3">UHID</th>
                    <th className="px-3 py-3">Doctor</th>
                    <th className="px-3 py-3 text-center">Items</th>
                    <th className="px-3 py-3 text-center">Status</th>
                    {queueFilterTab !== "Completed" && (
                      <>
                        <th className="px-4 py-3 text-center w-24">Action</th>
                        <th className="px-4 py-3 text-center w-28">Dispense</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={queueFilterTab === "Completed" ? 6 : 8} className="px-5 py-12 text-center text-slate-400">
                        <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-60" />
                        No prescriptions found matching the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((item, idx) => {
                      const isCompleted = item.pharmacy_status === "Completed" || item.appointment_status === "Billing" || item.appointment_status === "Completed";
                      const isSelected = selectedWalkIn?.name === item.name;
                      const distinctItemsCount = getPrescriptionDistinctItems(item.prescription, item.dispensed_medicines);
                      const uhid = item.patient || item.patient_id || item.uhid || item.name;

                      return (
                        <tr 
                          key={`${item.name}-${idx}`}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            isSelected ? "bg-indigo-50/50 border-l-4 border-indigo-600" : ""
                          }`}
                        >
                          <td className="px-4 py-3.5 text-center font-mono text-slate-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-900">{item.patient_name}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span>{item.gender || "Patient"}</span>
                              {item.age ? <span>• {item.age} yrs</span> : null}
                              <span>• Mob: {item.mobile_number || item.phone || "N/A"}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3.5 font-mono text-[11px] text-slate-600">
                            <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                              {uhid}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-slate-700 font-medium">
                            {item.doctor || "General Physician"}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <span className="font-semibold text-slate-700 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-full text-[11px] inline-flex items-center gap-1">
                              <Pill className="w-3 h-3 text-indigo-600" />
                              {distinctItemsCount} {distinctItemsCount === 1 ? "item" : "items"}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              isCompleted
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {isCompleted ? "Completed" : "Waiting"}
                            </span>
                          </td>
                          {queueFilterTab !== "Completed" && (
                            <>
                              <td className="px-4 py-3.5 text-center">
                                <Button
                                  size="sm"
                                  onClick={() => handleSelectQueueItem(item)}
                                  className="h-8 px-3.5 text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 gap-1.5"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  View
                                </Button>
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <Button
                                  size="sm"
                                  onClick={() => handleDirectQuickDispense(item)}
                                  className="h-8 px-3 text-xs font-semibold rounded-lg shadow-xs transition-all cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 whitespace-nowrap"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Dispense
                                </Button>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ========================================================
            TAB: DRUG REGISTERS
            ======================================================== */}
        <TabsContent value="registers" className="space-y-4 focus-visible:outline-none">
          <Card className="shadow-xs border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-200/60 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-serif">Government Compliance Records</CardTitle>
                <CardDescription className="text-[10px]">Compliance records tracking Controlled and Scheduled substances under the Drugs Act.</CardDescription>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <select
                  value={selectedRegister}
                  onChange={(e) => setSelectedRegister(e.target.value)}
                  className="h-8 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none font-semibold text-slate-800"
                >
                  <option value="All Categories">All Categories Register</option>
                  <option value="Schedule H">Schedule H Register</option>
                  <option value="Schedule H1">Schedule H1 Register</option>
                  <option value="Sleeping Pill">Sleeping Pill Register</option>
                  <option value="Controlled Drug">Controlled Drug Register</option>
                  <option value="Sales Returns">Sales Returns & Refunds</option>
                </select>

                <Button onClick={exportRegisterPDF} size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-slate-200 text-slate-700 bg-white font-medium">
                  <Printer className="w-3.5 h-3.5" /> PDF
                </Button>
                <Button onClick={exportRegisterCSV} size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-slate-200 text-slate-700 bg-white font-medium">
                  <Download className="w-3.5 h-3.5" /> CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                      <th className="px-4 py-2.5">Date & Time</th>
                      <th className="px-4 py-2.5">Patient Details</th>
                      <th className="px-4 py-2.5">Prescribed By</th>
                      <th className="px-4 py-2.5">Medicine Name</th>
                      <th className="px-4 py-2.5">Batch</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5">Invoice ID</th>
                      <th className="px-4 py-2.5">Pharmacist</th>
                      <th className="px-4 py-2.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {activeRegisterLogs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-5 py-8 text-center text-slate-400">
                          No transactions recorded in the {selectedRegister} Register yet.
                        </td>
                      </tr>
                    ) : (
                      activeRegisterLogs.map((log, index) => {
                        const date = new Date(log.dispensing_date).toLocaleString("en-IN", {
                          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        });
                        const isReturn = Number(log.quantity) < 0 || log.doctor === "Sales Return" || (log.invoice_number && log.invoice_number.includes("RET-"));
                        return (
                          <tr key={index} className={`hover:bg-slate-50/50 ${isReturn ? "bg-rose-50/30" : ""}`}>
                            <td className="px-4 py-3 font-mono text-slate-600">{date}</td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-800">{log.patient_name}</div>
                              <div className="text-[10px] text-slate-500">Mob: {log.patient_id}</div>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700">{log.doctor}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{log.medicine}</td>
                            <td className="px-4 py-3 font-mono text-slate-500">{log.batch_number}</td>
                            <td className="px-4 py-3 text-center font-mono font-bold">
                              {isReturn ? (
                                <span className="text-rose-600 font-bold">{log.quantity}</span>
                              ) : (
                                <span className="text-slate-800 font-bold">{log.quantity}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono text-indigo-600">{log.invoice_number}</td>
                            <td className="px-4 py-3 text-slate-600 font-medium">{(log.pharmacist || log.user || "Admin").split(",")[0]}</td>
                            <td className="px-4 py-3 text-center">
                              {isReturn ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
                                  Return Refund
                                </span>
                              ) : (
                                <Button 
                                  size="xs" 
                                  variant="outline" 
                                  onClick={() => handleOpenSalesReturn(log)}
                                  className="h-6 text-[10px] gap-1 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 font-semibold shadow-2xs whitespace-nowrap"
                                >
                                  <RotateCcw className="w-3 h-3" /> Return Item
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ========================================================
            TAB: LOGISTICS & PROCUREMENT (POs, GRN & Suggestions)
            ======================================================== */}
        <TabsContent value="logistics" className="space-y-6 focus-visible:outline-none">
          {/* Purchase Suggestions */}
          <Card className="shadow-xs border-slate-200 bg-white">
            <CardHeader className="bg-slate-50 border-b border-slate-200/60 p-4 space-y-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-serif flex items-center gap-2 text-slate-800">
                    <ShoppingCart className="w-4 h-4 text-indigo-600" />
                    Purchase Suggestions
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">Medicines that require replenishment based on current stock, reorder level, and maximum stock.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 h-9 shadow-xs rounded-lg cursor-pointer flex items-center gap-1.5">
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Generate Purchase Orders</span>
                        <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 p-1.5 bg-white border border-slate-200 shadow-lg rounded-lg z-50">
                      <DropdownMenuItem 
                        onClick={handleBulkGeneratePOs}
                        className="flex items-start gap-2.5 text-xs p-2 cursor-pointer text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-md transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900">Review &amp; Edit Purchase Orders</div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Auto-generate orders from system suggestions</div>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="my-1 border-slate-100" />
                      <DropdownMenuItem 
                        onClick={() => setIsPOModalOpen(true)}
                        className="flex items-start gap-2.5 text-xs p-2 cursor-pointer text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-md transition-colors"
                      >
                        <PlusCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900">Create Manual PO</div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5">Select supplier and custom items manually</div>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {purchaseRecommendations.length > 0 && (
                    <Button onClick={downloadReorderReport} size="sm" variant="outline" className="h-9 text-xs border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-lg">
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                  <Input
                    placeholder="Search suggestions..."
                    value={suggSearchQuery}
                    onChange={(e) => setSuggSearchQuery(e.target.value)}
                    className="w-52 h-8 pl-8 text-xs border-slate-200 shadow-2xs"
                  />
                </div>
                
                <select
                  value={suggFilterCategory}
                  onChange={(e) => setSuggFilterCategory(e.target.value)}
                  className="h-8 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs focus:outline-none shadow-2xs text-slate-700"
                >
                  <option value="All">All Categories</option>
                  <option value="Regular Medicine">Regular Medicine</option>
                  <option value="Schedule H">Schedule H</option>
                  <option value="Schedule H1">Schedule H1</option>
                  <option value="Sleeping Pill">Sleeping Pill</option>
                  <option value="Controlled Drug">Controlled Drug</option>
                  <option value="OTC">OTC</option>
                </select>

                <select
                  value={suggFilterStatus}
                  onChange={(e) => setSuggFilterStatus(e.target.value)}
                  className="h-8 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs focus:outline-none shadow-2xs text-slate-700"
                >
                  <option value="All">All Statuses</option>
                  <option value="Low Stock">Low Stock</option>
                  <option value="Out Of Stock">Out Of Stock</option>
                  <option value="Controlled Drug">Controlled Drug</option>
                  <option value="Schedule H">Schedule H</option>
                  <option value="Sleeping Pill">Sleeping Pill</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {purchaseRecommendations.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <ShoppingCart className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-slate-700 text-sm">All Stocks Healthy</div>
                    <div className="text-xs mt-1 text-slate-500">No medicines currently require replenishment.</div>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                        <th className="px-4 py-3">Medicine</th>
                        <th className="px-4 py-3 text-center">Current Stock</th>
                        <th className="px-4 py-3 text-center">Reorder Level</th>
                        <th className="px-4 py-3 text-center">Suggested Qty</th>
                        <th className="px-4 py-3">Preferred Supplier</th>
                        <th className="px-4 py-3 text-right">Est. Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {purchaseRecommendations.map(rec => {
                        const isOut = rec.current_stock === 0;
                        const isLow = rec.current_stock < rec.min_stock && !isOut;
                        let stockBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                        if (isOut) { stockBadgeColor = "bg-rose-50 text-rose-700 border-rose-200"; }
                        else if (isLow) { stockBadgeColor = "bg-orange-50 text-orange-700 border-orange-200"; }
                        else if (rec.current_stock <= rec.reorder_level) { stockBadgeColor = "bg-amber-50 text-amber-700 border-amber-200"; }

                        return (
                          <tr key={rec.medicine} className="hover:bg-slate-50/50 group transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{rec.medicine}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{rec.generic}</div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stockBadgeColor}`}>
                                {rec.current_stock}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-slate-500">{rec.reorder_level}</td>
                            <td className="px-4 py-3 text-center">
                              <Input
                                type="number"
                                min="0"
                                className="w-20 h-8 mx-auto text-center font-mono font-bold text-indigo-600 border-indigo-200 focus:border-indigo-500 text-xs px-1 rounded-md"
                                value={rec.suggested}
                                onChange={(e) => {
                                  const newQty = parseInt(e.target.value) || 0;
                                  setEditedSuggQty(prev => ({ ...prev, [rec.medicine]: newQty }));
                                }}
                              />
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-700">{rec.supplier}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">₹{(rec.suggested * rec.price).toLocaleString("en-IN")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Purchase Orders List */}
            <Card className="lg:col-span-2 shadow-xs border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-200/60 py-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-serif">Purchase Orders (Statutory Replenishment)</CardTitle>
                  <CardDescription className="text-[10px]">Track supply chains from purchase recommendation to goods arrival</CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Dialog open={isPOModalOpen} onOpenChange={setIsPOModalOpen}>
                    <DialogTrigger asChild>
                      <Button size="xs" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] px-2.5 py-1 shadow-sm">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Create Manual PO
                      </Button>
                    </DialogTrigger>
                    {/* ... dialog content remains the same */}
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-serif text-sm">Create Replenishment Purchase Order</DialogTitle>
                      <DialogDescription>Select supplier and items to procure</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateCustomPO} className="space-y-4 pt-2 text-xs">
                      <div className="space-y-1">
                        <Label className="font-semibold text-slate-700">Contracted Supplier</Label>
                        <select
                          value={poSupplier}
                          onChange={(e) => setPoSupplier(e.target.value)}
                          className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
                        >
                          {suppliers.map((sup) => (
                            <option key={sup.name} value={sup.name}>
                              {sup.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* PO items builder */}
                      <div className="space-y-2 border p-3 rounded-lg bg-slate-50/50">
                        <div className="font-bold text-[10px] text-slate-400 uppercase">Add Procurement Item</div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1 space-y-1">
                            <Label className="text-[10px] font-semibold text-slate-600">Medicine</Label>
                            <select
                              value={poAddMedName}
                              onChange={(e) => setPoAddMedName(e.target.value)}
                              className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs focus:outline-none"
                            >
                              <option value="">Select...</option>
                              {medicines.map(m => (
                                <option key={m.medicine_name} value={m.medicine_name}>{m.medicine_name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="w-20 space-y-1">
                            <Label className="text-[10px] font-semibold text-slate-600">Quantity</Label>
                            <Input 
                              type="number" value={poAddQty}
                              onChange={(e) => setPoAddQty(parseInt(e.target.value) || 1)}
                              className="h-8 text-xs border-slate-200"
                            />
                          </div>
                          <Button onClick={handleAddPOItem} type="button" variant="outline" size="sm" className="h-8 text-xs border-slate-200 bg-white">
                            Add
                          </Button>
                        </div>
                      </div>

                      {/* Added Items table */}
                      <div className="border rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                        <div className="grid grid-cols-6 bg-slate-50 font-bold p-2 border-b text-[10px] text-slate-500 uppercase">
                          <div className="col-span-3">Item</div>
                          <div className="col-span-1 text-center">Qty</div>
                          <div className="col-span-1 text-right">Price</div>
                          <div className="col-span-1 text-right"></div>
                        </div>
                        {poItems.length === 0 ? (
                          <div className="p-4 text-center text-slate-400 text-[10px]">No items added yet.</div>
                        ) : (
                          poItems.map((item, index) => (
                            <div key={item.medicine} className="grid grid-cols-6 p-2 border-b items-center text-[10px]">
                              <div className="col-span-3 font-semibold text-slate-800">{item.medicine}</div>
                              <div className="col-span-1 text-center font-mono">{item.quantity}</div>
                              <div className="col-span-1 text-right font-mono">₹{item.purchase_price}</div>
                              <div className="col-span-1 text-right">
                                <button onClick={() => setPoItems(prev => prev.filter((_, i) => i !== index))} type="button" className="text-rose-500 hover:text-rose-800">
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-9 text-xs">
                        Submit Purchase Order
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
              </CardHeader>
              <CardContent className="p-0">
                {purchaseOrders.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No Purchase Orders logged.
                  </div>
                ) : (
                  <div className="divide-y text-xs">
                    <div className="grid grid-cols-[1.2fr_1.5fr_1fr_1.2fr_1fr_1.8fr] px-6 py-3 font-bold text-slate-500 bg-slate-50/50 uppercase tracking-wider">
                      <div>PO Reference</div>
                      <div>Supplier</div>
                      <div>Date</div>
                      <div className="text-right">Total Cost</div>
                      <div className="text-center">Status</div>
                      <div className="text-right">Actions</div>
                    </div>
                    {purchaseOrders.map(po => {
                      return (
                        <div key={po.name} className="grid grid-cols-[1.2fr_1.5fr_1fr_1.2fr_1fr_1.8fr] px-6 py-4 items-center hover:bg-slate-50/30 transition-colors">
                          <div className="font-semibold text-slate-900 font-mono">{po.name}</div>
                          <div className="text-slate-600 font-medium">{po.supplier}</div>
                          <div className="text-slate-500">{new Date(po.date).toLocaleDateString("en-IN")}</div>
                          <div className="text-right font-bold text-slate-700">₹{po.total_amount.toLocaleString("en-IN")}</div>
                          <div className="text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border 
                              ${po.status === 'Received' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : ''}
                              ${po.status === 'Submitted' ? 'bg-indigo-50 text-indigo-800 border-indigo-200 animate-pulse' : ''}
                              ${po.status === 'Draft' ? 'bg-slate-100 text-slate-700 border-slate-200' : ''}`}
                            >
                              {po.status}
                            </span>
                          </div>
                          <div className="text-right flex items-center justify-end gap-2.5 w-full">
                            {po.status === "Submitted" ? (
                              <Button
                                onClick={() => handleOpenGRNModal(po)}
                                size="xs" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] h-7 px-3 shadow-sm transition-all shrink-0"
                              >
                                Log Goods Receipt
                              </Button>
                            ) : (
                              <>
                                <span className="text-[10px] text-emerald-600 bg-emerald-50/80 px-2 py-1 rounded-md font-semibold flex items-center gap-1.5 shrink-0 border border-emerald-100/50 shadow-sm">
                                  <CheckCircle className="w-3 h-3 text-emerald-500" /> Fulfilled
                                </span>
                                <Button 
                                  onClick={() => downloadGRNInvoice(po)}
                                  size="xs" variant="outline" className="h-7 text-[10px] px-2.5 bg-white border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 shadow-sm transition-all shrink-0"
                                >
                                  <Download className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> Bill
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* GRN Form Modal */}
            <Dialog open={isGRNModalOpen} onOpenChange={setIsGRNModalOpen}>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle className="font-serif text-sm">Goods Receipt &amp; Batch Registration</DialogTitle>
                  <DialogDescription>Verify quantities, assign batch numbers &amp; expiry dates to update live inventory. Purchase amounts will be recorded in Finance.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2 text-xs max-h-[75vh] overflow-y-auto pr-1">
                  {selectedPO && (
                    <div className="flex justify-between border-b pb-2 text-[10px] text-slate-500 font-bold uppercase">
                      <span>PO: {selectedPO.name}</span>
                      <span>Supplier: {selectedPO.supplier}</span>
                    </div>
                  )}

                  {/* Item Table */}
                  <div className="border rounded-lg overflow-hidden overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-slate-50 border-b font-bold uppercase text-slate-500">
                          <th className="p-2">Medicine</th>
                          <th className="p-2">Batch No. *</th>
                          <th className="p-2">EXP Date (MM-YY) *</th>
                          <th className="p-2 text-center">Qty</th>
                          <th className="p-2 text-right">Price (₹)</th>
                          <th className="p-2 text-right">Rack</th>
                          <th className="p-2 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {grnItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                              No items yet — use the form below to add medicines to this receipt.
                            </td>
                          </tr>
                        ) : grnItems.map((item, index) => (
                          <tr key={index} className="hover:bg-slate-50/50">
                            <td className="p-2 font-semibold text-slate-900 min-w-[120px]">{item.medicine}</td>
                            <td className="p-2">
                              <Input 
                                value={item.batch_number || ""} 
                                onChange={(e) => handleUpdateGRNItem(index, 'batch_number', e.target.value)}
                                className="h-7 text-[10px] w-28 border-slate-200 font-mono uppercase" 
                              />
                            </td>
                            <td className="p-2">
                              <Input 
                                type="month" value={item.exp_date || ""} 
                                onChange={(e) => handleUpdateGRNItem(index, 'exp_date', e.target.value)}
                                className="h-7 text-[10px] w-28 border-slate-200 border-amber-300 bg-amber-50/20 font-mono" 
                              />
                            </td>
                            <td className="p-2 text-center">
                              <Input
                                type="number" min="1" value={item.quantity || ""}
                                onChange={(e) => handleUpdateGRNItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                className="h-7 text-[10px] w-16 border-slate-200 font-mono text-center"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <Input
                                type="number" min="0" step="0.01" value={item.purchase_price ?? ""}
                                onChange={(e) => handleUpdateGRNItem(index, 'purchase_price', parseFloat(e.target.value) || 0)}
                                className="h-7 text-[10px] w-20 border-slate-200 font-mono text-right"
                              />
                            </td>
                            <td className="p-2">
                              <Input 
                                value={item.rack_location || ""} 
                                onChange={(e) => handleUpdateGRNItem(index, 'rack_location', e.target.value)}
                                className="h-7 text-[10px] w-20 border-slate-200" 
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button onClick={() => handleRemoveGRNItem(index)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Item Row */}
                  <div className="border border-dashed border-indigo-200 bg-indigo-50/40 rounded-lg p-3 space-y-2">
                    <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                      <PlusCircle className="w-3 h-3" /> Add Medicine to Receipt
                    </div>
                    <div className="flex flex-wrap gap-2 items-end">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 font-semibold uppercase">Medicine</span>
                        <select
                          value={grnAddMedName}
                          onChange={e => setGrnAddMedName(e.target.value)}
                          className="h-7 text-[10px] rounded border border-slate-200 bg-white px-2 focus:outline-none min-w-[160px]"
                        >
                          <option value="">— Select Medicine —</option>
                          {medicines.filter(m => !m.disabled).map(m => (
                            <option key={m.medicine_name} value={m.medicine_name}>{m.medicine_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 font-semibold uppercase">Qty</span>
                        <Input
                          type="number" min="1" value={grnAddQty}
                          onChange={e => setGrnAddQty(e.target.value)}
                          className="h-7 text-[10px] w-20 border-slate-200 font-mono"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-500 font-semibold uppercase">Purchase Price (₹)</span>
                        <Input
                          type="number" min="0" step="0.01" value={grnAddPrice}
                          onChange={e => setGrnAddPrice(e.target.value)}
                          placeholder={grnAddMedName ? (medicines.find(m=>m.medicine_name===grnAddMedName)?.purchase_price || "0.00") : "0.00"}
                          className="h-7 text-[10px] w-28 border-slate-200 font-mono"
                        />
                      </div>
                      <Button onClick={handleAddGRNItem} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] h-7 px-3 self-end">
                        <Plus className="w-3 h-3 mr-1" /> Add Row
                      </Button>
                    </div>
                  </div>

                  {/* Total Summary */}
                  {grnItems.length > 0 && (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
                      <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        Total Purchase Value
                      </div>
                      <div className="font-bold text-emerald-800 font-mono text-sm">
                        ₹{grnItems.reduce((a, i) => a + ((i.quantity || 0) * (i.purchase_price || 0)), 0).toLocaleString("en-IN", {minimumFractionDigits: 2})}
                      </div>
                    </div>
                  )}

                  <Button onClick={handleLogGRN} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 text-xs">
                    <PackageCheck className="w-4 h-4 mr-2" />
                    Complete Goods Receipt (Log Batches &amp; Stocks)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Compliance supplier safe reference panel */}
            <Card className="lg:col-span-1 shadow-xs border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-200/60 py-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-serif">Verified Drug Suppliers</CardTitle>
                  <CardDescription className="text-[10px]">Statutory licensed distributors for scheduling checks</CardDescription>
                </div>
                <Button onClick={openAddSupplierModal} size="xs" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] px-2 py-1 flex items-center gap-1 shrink-0">
                  <Plus className="w-3 h-3" /> Add Supplier
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-xs text-slate-600">
                {suppliers.map((sup, idx) => (
                  <div key={idx} className="p-2 border rounded-lg bg-slate-50/50 flex justify-between items-center hover:bg-slate-50 transition">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="text-slate-800">{sup.name}</strong>
                        {sup.code && <span className="text-[9px] text-slate-500 font-mono">({sup.code})</span>}
                      </div>
                      <span className="text-[9px] text-slate-400 block">Lic No: {sup.licNo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-bold px-1.5 py-0.25 rounded border ${
                        sup.isNarcotics || sup.type === "Narcotics Lic" || sup.supplierType === "Narcotic"
                          ? "bg-purple-50 text-purple-800 border-purple-100" 
                          : "bg-emerald-50 text-emerald-800 border-emerald-100"
                      }`}>
                        {sup.isNarcotics || sup.type === "Narcotics Lic" || sup.supplierType === "Narcotic" ? "Narcotics Lic" : "Verified"}
                      </span>
                      <button onClick={() => openEditSupplierModal(idx)} className="text-slate-400 hover:text-indigo-600 transition" title="Edit Supplier">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => deleteSupplier(idx)} className="text-slate-400 hover:text-red-600 transition" title="Delete Supplier">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
                <p className="text-[10px] text-slate-400 leading-relaxed pt-2">
                  * Note: Controlled drugs (e.g., Fentanyl) must only be purchased from suppliers holding a valid NDPS permit. Goods receipts will be audited by the drug inspector.
                </p>
              </CardContent>
            </Card>

            {/* Add New Supplier Modal */}
            {isAddSupplierModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center animate-in fade-in duration-200">
                <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="text-base font-bold text-slate-900 font-serif">{editingSupplierIndex !== null ? "Edit Supplier" : "Add New Supplier"}</h3>
                    <button 
                      onClick={() => setIsAddSupplierModalOpen(false)} 
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!newSupplierData.supplierName || !newSupplierData.contactPerson || !newSupplierData.mobileNumber || !newSupplierData.drugLicenseNumber || !newSupplierData.addressLine1 || !newSupplierData.city || !newSupplierData.state || !newSupplierData.pincode || !newSupplierData.country || !newSupplierData.paymentTerms) {
                        showToast("Please fill all required fields marked with *", "error");
                        return;
                      }
                      const newSup = {
                        name: newSupplierData.supplierName,
                        code: newSupplierData.supplierCode,
                        licNo: newSupplierData.drugLicenseNumber,
                        type: newSupplierData.supplierType === "Narcotic" ? "Narcotics Lic" : "Verified",
                        isNarcotics: newSupplierData.supplierType === "Narcotic" || (newSupplierData.regulatoryNDPS && newSupplierData.regulatoryNDPS.trim().length > 0),
                        supplierType: newSupplierData.supplierType,
                        contactPerson: newSupplierData.contactPerson,
                        mobileNumber: newSupplierData.mobileNumber,
                        email: newSupplierData.email,
                        gstNumber: newSupplierData.gstNumber,
                        status: newSupplierData.status,
                        addressLine1: newSupplierData.addressLine1,
                        city: newSupplierData.city,
                        state: newSupplierData.state,
                        pincode: newSupplierData.pincode,
                        country: newSupplierData.country,
                        paymentTerms: newSupplierData.paymentTerms,
                        creditLimit: newSupplierData.creditLimit,
                        preferredSupplier: newSupplierData.preferredSupplier,
                        leadTime: newSupplierData.leadTime,
                        regulatoryNDPS: newSupplierData.regulatoryNDPS,
                        bankName: newSupplierData.bankName,
                        bankAccount: newSupplierData.bankAccount,
                        bankIFSC: newSupplierData.bankIFSC,
                        documentsUploaded: newSupplierData.documentsUploaded,
                        performanceSLA: newSupplierData.performanceSLA
                      };
                      if (editingSupplierIndex !== null) {
                        setSuppliers(prev => {
                          const updated = [...prev];
                          updated[editingSupplierIndex] = newSup;
                          return updated;
                        });
                        showToast(`Supplier ${newSup.name} updated successfully!`, "success");
                      } else {
                        setSuppliers(prev => [...prev, newSup]);
                        showToast(`Supplier ${newSup.name} saved successfully!`, "success");
                      }
                      setIsAddSupplierModalOpen(false);
                    }} 
                    className="space-y-4 text-xs"
                  >
                    
                    {/* General Information */}
                    <div className="space-y-3">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b">General Information</div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700">Supplier Name *</Label>
                          <Input 
                            placeholder="e.g. Acme Pharmacy Ltd" 
                            value={newSupplierData.supplierName || ""} 
                            onChange={(e) => setNewSupplierData(prev => ({ ...prev, supplierName: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700">Supplier Code (Auto)</Label>
                          <Input 
                            value={newSupplierData.supplierCode || ""} 
                            disabled
                            className="bg-slate-50 font-mono text-slate-500 cursor-not-allowed h-9"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700">Supplier Type *</Label>
                          <select
                            value={newSupplierData.supplierType}
                            onChange={(e) => setNewSupplierData(prev => ({ ...prev, supplierType: e.target.value }))}
                            className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 focus:outline-none"
                          >
                            <option value="Distributor">Distributor</option>
                            <option value="Manufacturer">Manufacturer</option>
                            <option value="Wholesaler">Wholesaler</option>
                            <option value="Narcotic">Narcotic Distributor</option>
                            <option value="Importer">Importer</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700">Contact Person *</Label>
                          <Input 
                            placeholder="e.g. John Doe" 
                            value={newSupplierData.contactPerson || ""} 
                            onChange={(e) => setNewSupplierData(prev => ({ ...prev, contactPerson: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700">Mobile Number *</Label>
                          <Input 
                            placeholder="e.g. 9876543210" 
                            value={newSupplierData.mobileNumber || ""} 
                            onChange={(e) => setNewSupplierData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700">Email</Label>
                          <Input 
                            type="email"
                            placeholder="e.g. supplier@example.com" 
                            value={newSupplierData.email || ""} 
                            onChange={(e) => setNewSupplierData(prev => ({ ...prev, email: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700">GST Number</Label>
                          <Input 
                            placeholder="e.g. 29AAAAA1111A1Z1" 
                            value={newSupplierData.gstNumber || ""} 
                            onChange={(e) => setNewSupplierData(prev => ({ ...prev, gstNumber: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700">Drug License Number *</Label>
                          <Input 
                            placeholder="e.g. DL-COI-12345H" 
                            value={newSupplierData.drugLicenseNumber || ""} 
                            onChange={(e) => setNewSupplierData(prev => ({ ...prev, drugLicenseNumber: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="font-semibold text-slate-700">Status *</Label>
                        <select
                          value={newSupplierData.status}
                          onChange={(e) => setNewSupplierData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 focus:outline-none"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-3 pt-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b">Address</div>
                      
                      <div className="space-y-1">
                        <Label className="font-semibold text-slate-700">Address Line 1 *</Label>
                        <Input 
                          placeholder="e.g. 123 Pharma Business Park" 
                          value={newSupplierData.addressLine1 || ""} 
                          onChange={(e) => setNewSupplierData(prev => ({ ...prev, addressLine1: e.target.value }))}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700">City *</Label>
                          <Input 
                            placeholder="e.g. Coimbatore" 
                            value={newSupplierData.city || ""} 
                            onChange={(e) => setNewSupplierData(prev => ({ ...prev, city: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700">State *</Label>
                          <Input 
                            placeholder="e.g. Tamil Nadu" 
                            value={newSupplierData.state || ""} 
                            onChange={(e) => setNewSupplierData(prev => ({ ...prev, state: e.target.value }))}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700">Pincode *</Label>
                          <Input 
                            placeholder="e.g. 641001" 
                            value={newSupplierData.pincode || ""} 
                            onChange={(e) => setNewSupplierData(prev => ({ ...prev, pincode: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700">Country *</Label>
                          <Input 
                            placeholder="e.g. India" 
                            value={newSupplierData.country || ""} 
                            onChange={(e) => setNewSupplierData(prev => ({ ...prev, country: e.target.value }))}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business Information */}
                    <div className="space-y-3 pt-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b">Business Information</div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700">Payment Terms *</Label>
                          <select
                            value={newSupplierData.paymentTerms}
                            onChange={(e) => setNewSupplierData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                            className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 focus:outline-none"
                          >
                            <option value="Net 30">Net 30</option>
                            <option value="Net 15">Net 15</option>
                            <option value="COD">Cash On Delivery (COD)</option>
                            <option value="Advance">Advance Payment</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700">Credit Limit</Label>
                          <Input 
                            type="number"
                            placeholder="e.g. 50000" 
                            value={newSupplierData.creditLimit || ""} 
                            onChange={(e) => setNewSupplierData(prev => ({ ...prev, creditLimit: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center space-x-2 pt-5">
                          <input 
                            type="checkbox" 
                            id="pref-sup" 
                            checked={newSupplierData.preferredSupplier} 
                            onChange={(e) => setNewSupplierData(prev => ({ ...prev, preferredSupplier: e.target.checked }))}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <Label htmlFor="pref-sup" className="font-semibold text-slate-700">Preferred Supplier</Label>
                        </div>
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700">Lead Time (Days)</Label>
                          <Input 
                            type="number"
                            placeholder="e.g. 5" 
                            value={newSupplierData.leadTime || ""} 
                            onChange={(e) => setNewSupplierData(prev => ({ ...prev, leadTime: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Advanced Options */}
                    <div className="space-y-2 pt-2 border-t">
                      <button
                        type="button"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="flex items-center justify-between w-full py-1 text-slate-700 hover:text-slate-900 focus:outline-none font-semibold"
                      >
                        <span className="font-bold text-[11px] uppercase tracking-wider text-slate-500">
                          {showAdvanced ? "▼" : "▶"} Advanced Options
                        </span>
                      </button>

                      {showAdvanced && (
                        <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-100 animate-in slide-in-from-top-1 duration-200">
                          
                          {/* Advanced Option Toggles/Accordions */}
                          <div className="space-y-2">
                            {/* Regulatory */}
                            <div className="border rounded-md bg-white">
                              <button
                                type="button"
                                onClick={() => setExpandedAdvSection(expandedAdvSection === 'regulatory' ? null : 'regulatory')}
                                className="flex items-center justify-between w-full p-2 text-left text-slate-700 hover:bg-slate-50 focus:outline-none font-semibold text-xs"
                              >
                                <span>Regulatory</span>
                                <span>{expandedAdvSection === 'regulatory' ? '−' : '+'}</span>
                              </button>
                              {expandedAdvSection === 'regulatory' && (
                                <div className="p-3 border-t space-y-2">
                                  <Label className="text-slate-500">NDPS Permit / Narcotics License details</Label>
                                  <Input 
                                    placeholder="e.g. NDPS-PERMIT-908A" 
                                    value={newSupplierData.regulatoryNDPS || ""} 
                                    onChange={(e) => setNewSupplierData(prev => ({ ...prev, regulatoryNDPS: e.target.value }))}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Banking Details */}
                            <div className="border rounded-md bg-white">
                              <button
                                type="button"
                                onClick={() => setExpandedAdvSection(expandedAdvSection === 'banking' ? null : 'banking')}
                                className="flex items-center justify-between w-full p-2 text-left text-slate-700 hover:bg-slate-50 focus:outline-none font-semibold text-xs"
                              >
                                <span>Banking Details</span>
                                <span>{expandedAdvSection === 'banking' ? '−' : '+'}</span>
                              </button>
                              {expandedAdvSection === 'banking' && (
                                <div className="p-3 border-t space-y-2">
                                  <div className="space-y-1">
                                    <Label className="text-slate-500">Bank Name</Label>
                                    <Input 
                                      placeholder="e.g. HDFC Bank" 
                                      value={newSupplierData.bankName || ""} 
                                      onChange={(e) => setNewSupplierData(prev => ({ ...prev, bankName: e.target.value }))}
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <Label className="text-slate-500">Account Number</Label>
                                      <Input 
                                        placeholder="1234567890" 
                                        value={newSupplierData.bankAccount || ""} 
                                        onChange={(e) => setNewSupplierData(prev => ({ ...prev, bankAccount: e.target.value }))}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label className="text-slate-500">IFSC Code</Label>
                                      <Input 
                                        placeholder="HDFC0000123" 
                                        value={newSupplierData.bankIFSC || ""} 
                                        onChange={(e) => setNewSupplierData(prev => ({ ...prev, bankIFSC: e.target.value }))}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Documents */}
                            <div className="border rounded-md bg-white">
                              <button
                                type="button"
                                onClick={() => setExpandedAdvSection(expandedAdvSection === 'documents' ? null : 'documents')}
                                className="flex items-center justify-between w-full p-2 text-left text-slate-700 hover:bg-slate-50 focus:outline-none font-semibold text-xs"
                              >
                                <span>Documents</span>
                                <span>{expandedAdvSection === 'documents' ? '−' : '+'}</span>
                              </button>
                              {expandedAdvSection === 'documents' && (
                                <div className="p-3 border-t space-y-2">
                                  <Label className="text-slate-500">Attached Supplier Documentation (e.g., PDF link or text reference)</Label>
                                  <Input 
                                    placeholder="e.g. drug_license_verified.pdf, gst_cert.pdf" 
                                    value={newSupplierData.documentsUploaded || ""} 
                                    onChange={(e) => setNewSupplierData(prev => ({ ...prev, documentsUploaded: e.target.value }))}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Performance */}
                            <div className="border rounded-md bg-white">
                              <button
                                type="button"
                                onClick={() => setExpandedAdvSection(expandedAdvSection === 'performance' ? null : 'performance')}
                                className="flex items-center justify-between w-full p-2 text-left text-slate-700 hover:bg-slate-50 focus:outline-none font-semibold text-xs"
                              >
                                <span>Performance</span>
                                <span>{expandedAdvSection === 'performance' ? '−' : '+'}</span>
                              </button>
                              {expandedAdvSection === 'performance' && (
                                <div className="p-3 border-t space-y-2">
                                  <Label className="text-slate-500">SLA Commitment Rate</Label>
                                  <select
                                    value={newSupplierData.performanceSLA}
                                    onChange={(e) => setNewSupplierData(prev => ({ ...prev, performanceSLA: e.target.value }))}
                                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 focus:outline-none"
                                  >
                                    <option value="99%">99% (Excellent)</option>
                                    <option value="95%">95% (Standard)</option>
                                    <option value="90%">90% (Acceptable)</option>
                                    <option value="85%">85% (Needs Improvement)</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 border-t pt-3">
                      <Button 
                        type="button" 
                        onClick={() => setIsAddSupplierModalOpen(false)} 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs border-slate-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8 px-4"
                      >
                        Save Supplier
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

        </TabsContent>
      </Tabs>

      {/* ============================================================================
          PO GENERATION FROM SUGGESTIONS
          ============================================================================ */}
      {/* 
        NOTE: PO generation logic handlers handleCreatePOFromSuggestion 
        and handleBulkGeneratePOs are now defined in component scope.
      */}

      {/* ========================================================
          SLIDE-OVER DRAW: MEDICINE PROFILE DETAILS
          ======================================================== */}
      {selectedMedicine && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-6 border-b bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-600 p-1 rounded">
                    <Pill className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-bold text-slate-900 font-serif">{selectedMedicine.medicine_name}</h3>
                </div>
                <p className="text-slate-500 text-[10px] mt-0.5">{selectedMedicine.generic_name} • {selectedMedicine.dosage_form}</p>
              </div>
              <button 
                onClick={() => setSelectedMedicine(null)} 
                className="text-slate-400 hover:text-slate-800 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              
              {/* General Metadata */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">General Information</div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-500">Brand Name:</span>
                    <span className="font-semibold text-slate-900">{selectedMedicine.brand || "Generics"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-500">Manufacturer:</span>
                    <span className="font-semibold text-slate-900">{selectedMedicine.manufacturer || "N/A"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-500">Dosage Form / Strength:</span>
                    <span className="font-semibold text-slate-900">{selectedMedicine.dosage_form} ({selectedMedicine.strength || "N/A"})</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-500">HSN Code:</span>
                    <span className="font-semibold text-slate-900 font-mono">{selectedMedicine.hsn_code || "30049099"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rack location:</span>
                    <span className="font-semibold text-slate-900 font-mono">{selectedMedicine.rack_location || "N/A"}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Compliance & Control</div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-500">Drug Category:</span>
                    <span className="font-bold text-indigo-600">{selectedMedicine.category}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-500">Prescription Required:</span>
                    <span className="font-semibold text-slate-900">{selectedMedicine.prescription_required ? "Yes (Rx)" : "No (OTC)"}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1">
                    <span className="text-slate-500">Controlled Drug:</span>
                    <span className="font-semibold text-slate-900">{selectedMedicine.controlled_drug ? "Yes (Locked Safe)" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sleeping Pill:</span>
                    <span className="font-semibold text-slate-900">{selectedMedicine.sleeping_pill ? "Yes" : "No"}</span>
                  </div>
                </div>
              </div>

              {/* Pricing & Stock Details */}
              <div className="grid grid-cols-3 gap-4">
                <div className="border p-3 rounded-lg text-center bg-slate-50/20">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Current Stock</div>
                  <div className="text-lg font-bold text-slate-800 mt-1 font-mono">{selectedMedicine.stock}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">Min: {selectedMedicine.min_stock} / Max: {selectedMedicine.max_stock}</div>
                </div>
                <div className="border p-3 rounded-lg text-center bg-slate-50/20">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Purchase Price</div>
                  <div className="text-lg font-bold text-slate-800 mt-1 font-mono">₹{selectedMedicine.purchase_price || "0.00"}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">excl. GST</div>
                </div>
                <div className="border p-3 rounded-lg text-center bg-slate-50/20">
                  <div className="text-[9px] font-bold text-slate-400 uppercase">Selling Price</div>
                  <div className="text-lg font-bold text-slate-800 mt-1 font-mono">₹{selectedMedicine.selling_price || "0.00"}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">incl. GST ({selectedMedicine.gst}%)</div>
                </div>
              </div>

              {/* Tabs for Batches vs Movement History */}
              <Tabs value={detailActiveTab} onValueChange={setDetailActiveTab} className="w-full">
                <TabsList className="grid grid-cols-2 h-9 p-1 bg-slate-100/80 rounded-lg">
                  <TabsTrigger value="batches" className="text-xs font-semibold">Live Inventory Batches</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs font-semibold">Stock Movement Ledger</TabsTrigger>
                </TabsList>
                
                <TabsContent value="batches" className="space-y-2 pt-2 focus-visible:outline-none">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Inventory Batches (FEFO Sorting)</div>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <div className="grid grid-cols-7 p-2 bg-slate-50 font-bold border-b text-[9px] text-slate-500 uppercase tracking-wider">
                      <div className="col-span-2">Batch & Invoice</div>
                      <div>Expiry Date</div>
                      <div className="text-center">Stock</div>
                      <div>Supplier</div>
                      <div>Inv Date</div>
                      <div className="text-center">Status</div>
                    </div>
                    {(!selectedMedicine.batches || selectedMedicine.batches.length === 0) ? (
                      <div className="p-4 text-center text-slate-400 text-[10px]">No active batches in inventory. Log Goods Receipt first.</div>
                    ) : (
                      selectedMedicine.batches.map(batch => {
                        const alert = getExpiryAlert(batch.exp_date);
                        return (
                          <div key={batch.batch_number} className="grid grid-cols-7 p-2 border-b items-center text-[10px] font-mono hover:bg-slate-50/20">
                            <div className="col-span-2">
                              <span className="font-semibold text-slate-800 block">{batch.batch_number}</span>
                              {batch.invoice_number && (
                                <span className="text-[9px] text-indigo-600 font-sans block">Inv: {batch.invoice_number}</span>
                              )}
                            </div>
                            <div className="text-slate-600">{new Date(batch.exp_date).toLocaleDateString("en-IN")}</div>
                            <div className="text-center font-bold text-slate-700">{batch.current_stock}</div>
                            <div className="text-slate-500 truncate" title={batch.supplier}>{batch.supplier || "N/A"}</div>
                            <div className="text-slate-500 text-[9px]">{batch.invoice_date || "N/A"}</div>
                            <div className="text-center">
                              <span className={`px-1.5 py-0.25 rounded text-[8px] font-bold border ${alert.color}`}>
                                {alert.label}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="history" className="space-y-2 pt-2 focus-visible:outline-none">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Medicine Movement Ledger (Audit log)</div>
                  <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto bg-white">
                    <div className="grid grid-cols-6 p-2 bg-slate-50 font-bold border-b text-[9px] text-slate-500 uppercase tracking-wider">
                      <div className="col-span-2">Date & Time</div>
                      <div>Type</div>
                      <div>Reference</div>
                      <div className="text-center">Qty</div>
                      <div className="col-span-1">Details</div>
                    </div>
                    {!medicineHistory?.movementHistory || medicineHistory.movementHistory.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-[10px]">No transactions recorded for this medicine.</div>
                    ) : (
                      medicineHistory.movementHistory.map((log, index) => (
                        <div key={index} className="grid grid-cols-6 p-2 border-b items-center text-[10px] hover:bg-slate-50/20">
                          <div className="col-span-2 text-slate-500 font-mono">{new Date(log.date).toLocaleString("en-IN")}</div>
                          <div className="font-semibold">
                            <span className={log.type === 'Dispensed' || log.type === 'Direct Sale' ? 'text-indigo-600' : (log.type.startsWith('Reduce') || log.type === 'Damaged' || log.type === 'Expired' ? 'text-rose-600' : 'text-emerald-600')}>
                              {log.type}
                            </span>
                          </div>
                          <div className="font-mono text-slate-600">{log.reference}</div>
                          <div className="text-center font-bold font-mono">
                            {log.type === 'Dispensed' || log.type === 'Direct Sale' || log.type.startsWith('Reduce') || log.type === 'Damaged' || log.type === 'Expired' ? '-' : '+'}{log.quantity}
                          </div>
                          <div className="col-span-1 text-slate-500 truncate" title={log.details}>{log.details}</div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>

            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-slate-50 border-t flex justify-end">
              <Button onClick={() => setSelectedMedicine(null)} className="h-8 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white">
                Close Profile
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustModal && adjustingMed && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-1.5">
                <Sliders className="w-5 h-5 text-amber-500" /> Stock Adjustment
              </h3>
              <button 
                onClick={() => setShowAdjustModal(false)} 
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <Label className="font-bold text-slate-500">Medicine Name</Label>
                <div className="p-2 bg-slate-50 border border-slate-100 rounded font-semibold text-slate-800">
                  {adjustingMed.medicine_name}
                </div>
              </div>

              <div className="space-y-1">
                <Label className="font-bold text-slate-500">Batch Number *</Label>
                <select
                  value={adjustmentData.batch_number || ""}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, batch_number: e.target.value }))}
                  className="w-full h-8 rounded border border-slate-200 bg-white px-2 focus:outline-none"
                >
                  <option value="">-- Create New Batch or Select --</option>
                  {(adjustingMed.batches || []).map(b => (
                    <option key={b.batch_number} value={b.batch_number}>
                      {b.batch_number} (Qty: {b.current_stock})
                    </option>
                  ))}
                  <option value="NEW_BATCH">[+] Create New Batch</option>
                </select>
              </div>

              {adjustmentData.batch_number === "NEW_BATCH" && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="space-y-1">
                    <Label className="font-bold text-slate-500">New Batch ID *</Label>
                    <Input
                      placeholder="e.g. BATCH-999"
                      value={adjustmentData.new_batch_id || ""}
                      onChange={(e) => setAdjustmentData(prev => ({ ...prev, new_batch_id: e.target.value }))}
                      className="h-8 text-xs border-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-bold text-slate-500">Expiry Date *</Label>
                    <Input
                      type="date"
                      value={adjustmentData.new_batch_exp || ""}
                      onChange={(e) => setAdjustmentData(prev => ({ ...prev, new_batch_exp: e.target.value }))}
                      className="h-8 text-xs border-slate-200"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500">Adjustment Type *</Label>
                  <select
                    value={adjustmentData.adjustment_type || ""}
                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, adjustment_type: e.target.value }))}
                    className="w-full h-8 rounded border border-slate-200 bg-white px-2 focus:outline-none"
                  >
                    <option value="Add Stock">Add Stock</option>
                    <option value="Reduce Stock">Reduce Stock</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Expired">Expired</option>
                    <option value="Returned">Returned</option>
                    <option value="Physical Count Correction">Physical Correction</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500">Quantity *</Label>
                  <Input
                    type="number"
                    value={adjustmentData.quantity || ""}
                    onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className="h-8 text-xs border-slate-200"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="font-bold text-slate-500">Reason / Notes *</Label>
                <Input
                  placeholder="e.g. Expired batch replacement"
                  value={adjustmentData.reason || ""}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                  className="h-8 text-xs border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <Label className="font-bold text-slate-500">Remarks (Optional)</Label>
                <Input
                  placeholder="Internal audit remarks"
                  value={adjustmentData.remarks || ""}
                  onChange={(e) => setAdjustmentData(prev => ({ ...prev, remarks: e.target.value }))}
                  className="h-8 text-xs border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button onClick={() => setShowAdjustModal(false)} variant="outline" size="sm" className="h-8 text-xs border-slate-200">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (userRole === "Store Manager") {
                    showToast("Access Denied: Store Managers cannot adjust stock.", "error");
                    return;
                  }
                  let batchId = adjustmentData.batch_number;
                  if (batchId === "NEW_BATCH") {
                    if (!adjustmentData.new_batch_id || !adjustmentData.new_batch_exp) {
                      showToast("New Batch ID and Expiry Date are required", "error");
                      return;
                    }
                    batchId = adjustmentData.new_batch_id;
                  }
                  
                  if (!batchId || !adjustmentData.quantity || !adjustmentData.reason) {
                    showToast("Batch Number, Quantity, and Reason are required", "error");
                    return;
                  }

                  try {
                    await adjustStock({
                      medicine: adjustingMed.medicine_name,
                      batch_number: batchId,
                      adjustment_type: adjustmentData.adjustment_type,
                      quantity: adjustmentData.quantity,
                      reason: adjustmentData.reason,
                      remarks: adjustmentData.remarks || "",
                      exp_date: adjustmentData.new_batch_exp || "",
                      performed_by: pharmacistName
                    });
                    showToast("Stock adjustment saved successfully!", "success");
                    setShowAdjustModal(false);
                    loadAllData();
                  } catch (e) {
                    showToast("Stock adjustment failed", "error");
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8 px-4"
              >
                Save Adjustment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Medicine Modal */}
      {showEditMedModal && editingMed && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-indigo-500" /> Edit Medicine Details
              </h3>
              <button onClick={() => setShowEditMedModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs overflow-y-auto max-h-[450px] pr-1">
              <div className="space-y-1">
                <Label className="font-bold text-slate-500">Medicine Name</Label>
                <Input
                  value={editingMed.medicine_name || ""}
                  onChange={(e) => setEditingMed(p => ({ ...p, medicine_name: e.target.value }))}
                  className="h-8 text-xs border-slate-200"
                />
              </div>

              <div className="space-y-1">
                <Label className="font-bold text-slate-500">Generic Formula</Label>
                <Input
                  value={editingMed.generic_name || ""}
                  onChange={(e) => setEditingMed(p => ({ ...p, generic_name: e.target.value }))}
                  className="h-8 text-xs border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500">Category</Label>
                  <select
                    value={editingMed.category || ""}
                    onChange={(e) => setEditingMed(p => ({ ...p, category: e.target.value }))}
                    className="w-full h-8 rounded border border-slate-200 bg-white px-2 focus:outline-none"
                  >
                    <option value="Regular Medicine">Regular Medicine</option>
                    <option value="Schedule H">Schedule H</option>
                    <option value="Schedule H1">Schedule H1</option>
                    <option value="Sleeping Pill">Sleeping Pill</option>
                    <option value="Controlled Drug">Controlled Drug</option>
                    <option value="OTC">OTC</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500">Dosage Form</Label>
                  <Input
                    value={editingMed.dosage_form || ""}
                    onChange={(e) => setEditingMed(p => ({ ...p, dosage_form: e.target.value }))}
                    className="h-8 text-xs border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500">Selling Price *</Label>
                  <Input
                    type="number"
                    value={editingMed.selling_price || ""}
                    onChange={(e) => setEditingMed(p => ({ ...p, selling_price: parseFloat(e.target.value) || 0 }))}
                    className="h-8 text-xs border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500">Purchase Price</Label>
                  <Input
                    type="number"
                    value={editingMed.purchase_price || ""}
                    onChange={(e) => setEditingMed(p => ({ ...p, purchase_price: parseFloat(e.target.value) || 0 }))}
                    className="h-8 text-xs border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500">Min Stock</Label>
                  <Input
                    type="number"
                    value={editingMed.min_stock || ""}
                    onChange={(e) => setEditingMed(p => ({ ...p, min_stock: parseInt(e.target.value) || 0 }))}
                    className="h-8 text-xs border-slate-200"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500">Max Stock</Label>
                  <Input
                    type="number"
                    value={editingMed.max_stock || ""}
                    onChange={(e) => setEditingMed(p => ({ ...p, max_stock: parseInt(e.target.value) || 0 }))}
                    className="h-8 text-xs border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500">HSN Code</Label>
                  <Input
                    placeholder="30049099"
                    value={editingMed.hsn_code || ""}
                    onChange={(e) => setEditingMed(p => ({ ...p, hsn_code: e.target.value }))}
                    className="h-8 text-xs border-slate-200 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500">GST Rate (%)</Label>
                  <select
                    value={editingMed.gst != null ? editingMed.gst : (editingMed.gst_percent != null ? editingMed.gst_percent : 12)}
                    onChange={(e) => setEditingMed(p => ({ ...p, gst: parseFloat(e.target.value) || 0, gst_percent: parseFloat(e.target.value) || 0 }))}
                    className="w-full h-8 rounded border border-slate-200 bg-white px-2 focus:outline-none text-xs"
                  >
                    <option value={0}>0% - Exempted</option>
                    <option value={5}>5% - Essential</option>
                    <option value={12}>12% - Standard (12%)</option>
                    <option value={18}>18% - Supplements (18%)</option>
                    <option value={28}>28% - Specialty (28%)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="font-bold text-slate-500">Rack Location</Label>
                <Input
                  value={editingMed.rack_location || ""}
                  onChange={(e) => setEditingMed(p => ({ ...p, rack_location: e.target.value }))}
                  className="h-8 text-xs border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button onClick={() => setShowEditMedModal(false)} variant="outline" size="sm" className="h-8 text-xs border-slate-200">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (userRole === "Pharmacist") {
                    showToast("Access Denied: Pharmacists cannot edit medicine records.", "error");
                    return;
                  }
                  try {
                    await updateMedicine(editingMed.name || editingMed.medicine_name, editingMed);
                    showToast("Medicine updated successfully!", "success");
                    setShowEditMedModal(false);
                    loadAllData();
                  } catch (e) {
                    showToast("Failed to update medicine details", "error");
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8 px-4"
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Direct OTC Medicine Sale Modal */}
      {showOTCSaleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-1.5">
                <ShoppingBag className="w-5 h-5 text-emerald-600" /> Direct Medicine Sale (OTC)
              </h3>
              <button onClick={() => setShowOTCSaleModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              
              {/* Customer Type Selector */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => { setOtcCustomerType("Walk-in"); setOtcSelectedPatient(null); }}
                  className={`py-1.5 text-xs font-semibold rounded-md transition ${otcCustomerType === "Walk-in" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
                >
                  Walk-in Customer
                </button>
                <button
                  type="button"
                  onClick={() => { setOtcCustomerType("Registered"); }}
                  className={`py-1.5 text-xs font-semibold rounded-md transition ${otcCustomerType === "Registered" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"}`}
                >
                  Registered Patient
                </button>
              </div>

              {/* Profiles details */}
              {otcCustomerType === "Walk-in" ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100 shrink-0">
                  <div className="space-y-1 col-span-2">
                    <Label className="font-bold text-slate-500">Customer Name *</Label>
                    <Input
                      placeholder="e.g. Jane Doe"
                      value={otcCustomerName}
                      onChange={(e) => setOtcCustomerName(e.target.value)}
                      className="h-8 text-xs border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-bold text-slate-500">Age (Optional)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 30"
                      value={otcCustomerAge}
                      onChange={(e) => setOtcCustomerAge(e.target.value)}
                      className="h-8 text-xs border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-bold text-slate-500">Gender</Label>
                    <select
                      value={otcCustomerGender}
                      onChange={(e) => setOtcCustomerGender(e.target.value)}
                      className="w-full h-8 rounded border border-slate-200 bg-white px-2 focus:outline-none text-xs"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="font-bold text-slate-500">Mobile Number (Optional)</Label>
                    <Input
                      placeholder="e.g. 9876543210 (Optional)"
                      value={otcCustomerMobile}
                      onChange={(e) => setOtcCustomerMobile(e.target.value)}
                      className="h-8 text-xs border-slate-200 bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50/50 p-3 rounded-lg border border-slate-100 shrink-0">
                  <div className="space-y-1">
                    <Label className="font-bold text-slate-500">Search Patient (UHID, Name, Mobile)</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search..."
                        value={otcSearchQuery}
                        onChange={(e) => setOtcSearchQuery(e.target.value)}
                        className="h-8 text-xs border-slate-200 bg-white flex-1"
                      />
                    </div>
                  </div>

                  {/* Render patient match list from queue or local registers */}
                  <div className="max-h-24 overflow-y-auto divide-y border rounded bg-white text-[11px]">
                    {queue
                      .filter(q => 
                        q.patient_name.toLowerCase().includes(otcSearchQuery.toLowerCase()) ||
                        (q.patient || "").toLowerCase().includes(otcSearchQuery.toLowerCase()) ||
                        (q.mobile_number || "").toLowerCase().includes(otcSearchQuery.toLowerCase())
                      )
                      .slice(0, 4)
                      .map(p => (
                        <div 
                          key={p.name}
                          onClick={() => {
                            setOtcSelectedPatient(p);
                            setOtcCustomerName(p.patient_name);
                            setOtcCustomerMobile(p.mobile_number || "");
                            setOtcCustomerAge("35"); // Mock fallback
                            setOtcCustomerGender("Male");
                          }}
                          className={`p-2 hover:bg-slate-50 cursor-pointer flex justify-between ${otcSelectedPatient?.name === p.name ? "bg-indigo-50/30 font-semibold" : ""}`}
                        >
                          <span>{p.patient_name} ({p.patient || "UHID"})</span>
                          <span className="text-slate-400 font-mono">{p.mobile_number}</span>
                        </div>
                      ))
                    }
                  </div>
                  {otcSelectedPatient && (
                    <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-2 rounded flex justify-between">
                      <span>Patient Selected: {otcSelectedPatient.patient_name} ({otcSelectedPatient.patient})</span>
                      <button onClick={() => setOtcSelectedPatient(null)} className="underline text-slate-400 hover:text-slate-600">Clear</button>
                    </div>
                  )}
                </div>
              )}

              {/* Basket / Item Selector */}
              <div className="space-y-2 border-t pt-3">
                <Label className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Add Medicines to Sale</Label>
                <div className="flex gap-2">
                  <select
                    id="otc-med-select"
                    className="flex h-8 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
                    defaultValue=""
                    onChange={(e) => {
                      const medName = e.target.value;
                      if (!medName) return;
                      const med = medicines.find(m => m.medicine_name === medName);
                      if (med) {
                        // Add to basket if not present
                        if (otcBasket.some(item => item.medicine_name === med.medicine_name)) {
                          showToast("Medicine already added to basket", "info");
                          return;
                        }
                        setOtcBasket(prev => [...prev, {
                          medicine_name: med.medicine_name,
                          qty: 1,
                          sell_unit: "Strip",
                          tablets_per_strip: med.tablets_per_strip || 10,
                          price: med.selling_price || 0,
                          stock: med.stock || 0,
                          category: med.category
                        }]);
                      }
                      e.target.value = ""; // Reset dropdown
                    }}
                  >
                    <option value="">Search and select medicine...</option>
                    {medicines
                      .filter(m => !m.disabled && m.stock > 0)
                      .map(m => (
                        <option key={m.medicine_name} value={m.medicine_name}>
                          {m.medicine_name} (Stock: {m.stock} • ₹{m.selling_price}/strip)
                        </option>
                      ))
                    }
                  </select>
                </div>

                {/* Basket List */}
                <div className="border border-slate-100 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {otcBasket.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-[10px]">Basket is empty. Select medicines above.</div>
                  ) : (
                    <div className="divide-y divide-slate-100 bg-white text-[11px]">
                      {otcBasket.map((item, idx) => {
                        const tabsPerStrip = item.tablets_per_strip || 10;
                        const isTabletMode = item.sell_unit === "Tablet";
                        const unitPrice = isTabletMode ? (item.price / tabsPerStrip) : item.price;
                        const lineTotal = item.qty * unitPrice;

                        return (
                          <div key={idx} className="p-2.5 hover:bg-slate-50/50 border-b border-slate-100 flex flex-col gap-1 text-xs">
                            <div className="flex items-center justify-between font-sans">
                              <span className="font-bold text-slate-900">{item.medicine_name}</span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                Strip Price: ₹{item.price.toFixed(2)} ({tabsPerStrip} tabs/strip)
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 pt-1 font-mono">
                              {/* Sell Unit Selector */}
                              <select
                                value={item.sell_unit || "Strip"}
                                onChange={(e) => {
                                  const newUnit = e.target.value;
                                  setOtcBasket(prev => prev.map((it, i) => i === idx ? { ...it, sell_unit: newUnit } : it));
                                }}
                                className="h-7 text-[11px] bg-slate-50 border border-slate-200 rounded px-2 font-semibold text-indigo-700 cursor-pointer font-sans"
                              >
                                <option value="Strip">Full Strip(s)</option>
                                <option value="Tablet">Loose Tablet(s)</option>
                              </select>

                              {/* Qty Buttons */}
                              <div className="flex items-center gap-1 font-sans">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setOtcBasket(prev => prev.map((it, i) => i === idx ? { ...it, qty: Math.max(1, it.qty - 1) } : it));
                                  }}
                                  className="w-5 h-5 rounded border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-xs"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.qty}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    setOtcBasket(prev => prev.map((it, i) => i === idx ? { ...it, qty: val } : it));
                                  }}
                                  className="w-12 h-6 text-center border border-slate-200 rounded text-xs font-bold font-mono"
                                />
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setOtcBasket(prev => prev.map((it, i) => i === idx ? { ...it, qty: it.qty + 1 } : it));
                                  }}
                                  className="w-5 h-5 rounded border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-xs"
                                >
                                  +
                                </button>
                                <span className="text-[10px] text-slate-500 font-semibold">
                                  {isTabletMode ? "tabs" : "strips"}
                                </span>
                              </div>

                              {/* Line Total */}
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">₹{lineTotal.toFixed(2)}</span>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setOtcBasket(prev => prev.filter((_, i) => i !== idx));
                                  }} 
                                  className="text-slate-400 hover:text-rose-600 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Real-time Loose Unit Pricing Explanation */}
                            {isTabletMode && (
                              <div className="text-[10px] text-indigo-700 bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 rounded font-sans flex items-center justify-between">
                                <span>Per Tablet: ₹{unitPrice.toFixed(2)}</span>
                                <span className="font-semibold">Selling {item.qty} loose tablet(s) out of {tabsPerStrip}/strip</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="grid grid-cols-2 gap-3 border-t pt-3 shrink-0">
                <div className="space-y-1">
                  <Label className="font-bold text-slate-500">Payment Method *</Label>
                  <select
                    value={otcPaymentMethod}
                    onChange={(e) => setOtcPaymentMethod(e.target.value)}
                    className="w-full h-8 rounded border border-slate-200 bg-white px-2 focus:outline-none font-semibold text-slate-700"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Insurance">Insurance</option>
                    <option value="Credit">Credit</option>
                  </select>
                </div>

                <div className="text-right flex flex-col justify-end">
                  <span className="text-[10px] font-bold text-slate-400">GRAND TOTAL</span>
                  <span className="text-lg font-bold text-slate-900 font-mono">
                    ₹{otcBasket.reduce((acc, it) => {
                      const tabsPerStrip = it.tablets_per_strip || 10;
                      const unitPrice = it.sell_unit === "Tablet" ? (it.price / tabsPerStrip) : it.price;
                      return acc + (it.qty * unitPrice);
                    }, 0).toFixed(2)}
                  </span>
                </div>
              </div>

            </div>

            <div className="flex justify-end gap-2 border-t pt-3 shrink-0">
              <Button onClick={() => setShowOTCSaleModal(false)} variant="outline" size="sm" className="h-8 text-xs border-slate-200">
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (userRole === "Store Manager") {
                    showToast("Access Denied: Store Managers cannot initiate direct sales.", "error");
                    return;
                  }
                  if (!otcCustomerName) {
                    showToast("Customer Name is required", "error");
                    return;
                  }
                  if (otcBasket.length === 0) {
                    showToast("Basket is empty", "error");
                    return;
                  }

                  try {
                    showToast("Processing direct OTC sale stock deduction...", "info");

                    // Build items with unit_price so service records correct amounts
                    const saleItems = otcBasket.map(item => {
                      const tabsPerStrip = item.tablets_per_strip || 10;
                      const dispenseQty = item.sell_unit === "Tablet"
                        ? Math.max(1, Math.round(item.qty))
                        : item.qty * tabsPerStrip;
                      const unitPrice = item.sell_unit === "Tablet"
                        ? (item.price / tabsPerStrip)
                        : item.price;
                      return {
                        medicine_name: item.medicine_name,
                        qty: dispenseQty,
                        unit_price: unitPrice
                      };
                    });

                    const response = await executeDirectSale(
                      otcCustomerName,
                      otcCustomerMobile || "",
                      otcCustomerAge || "",
                      otcCustomerGender || "Unspecified",
                      saleItems,
                      otcPaymentMethod,
                      pharmacistName
                    );

                    // Compute total from basket (authoritative source for displayed price)
                    const totalVal = otcBasket.reduce((acc, it) => {
                      const tabsPerStrip = it.tablets_per_strip || 10;
                      const unitPrice = it.sell_unit === "Tablet" ? (it.price / tabsPerStrip) : it.price;
                      return acc + (it.qty * unitPrice);
                    }, 0);

                    // Build receipt items directly from otcBasket so names/amounts are always correct
                    // Merge batch deduction info from service response by matching medicine name
                    const receiptItems = otcBasket.map(it => {
                      const tabsPerStrip = it.tablets_per_strip || 10;
                      const dispenseQty = it.sell_unit === "Tablet"
                        ? Math.max(1, Math.round(it.qty))
                        : it.qty * tabsPerStrip;
                      const unitPrice = it.sell_unit === "Tablet"
                        ? (it.price / tabsPerStrip)
                        : it.price;
                      // Find matching dispensed receipt entry for batch info
                      const serviceItem = (response.dispensedReceipt || []).find(
                        r => (r.medicine_name || "").toLowerCase() === (it.medicine_name || "").toLowerCase()
                      );
                      return {
                        medicine_name: it.medicine_name,
                        requested_qty: dispenseQty,
                        dispensed_qty: dispenseQty,
                        unit_price: unitPrice,
                        line_total: dispenseQty * unitPrice,
                        deductions: serviceItem?.deductions || []
                      };
                    });

                    showToast(`Direct Sale completed. Invoice ${response.invoiceNumber} generated!`, "success");
                    
                    // Show on-screen receipt preview modal (NO auto download)
                    setLatestDispenseRecord({
                      invoiceNumber: response.invoiceNumber,
                      patientName: otcCustomerName || "Walk-in Customer",
                      patientMobile: otcCustomerMobile || "N/A",
                      doctorName: "Self (OTC)",
                      items: receiptItems,
                      dispenseItems: otcBasket,
                      totalVal: totalVal,
                      paymentMethod: otcPaymentMethod,
                      paymentMode: "Direct OTC Sale (Paid at Counter)",
                      isPaidAtPharmacy: true,
                      pharmacistName: pharmacistName,
                      date: new Date().toLocaleString("en-IN")
                    });
                    setShowDispenseReceiptModal(true);

                    setShowOTCSaleModal(false);
                    setOtcBasket([]);
                    loadAllData();
                  } catch (e) {
                    showToast("Direct sale transaction failed", "error");
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 px-4"
              >
                Submit Sale
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sales Return (Return Sold Medicine) Modal */}
      {showSalesReturnModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-0 flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 px-6 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shadow-xs">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif">Return Sold Medicine (Sales Return & Restock)</h3>
                  <p className="text-[11px] text-slate-500">Return medicines by tablet count or lookup past sales. Restocks inventory and records refunds automatically.</p>
                </div>
              </div>
              <button onClick={() => setShowSalesReturnModal(false)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              
              {/* Direct Medicine Return Builder */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3.5">
                <div className="flex justify-between items-center">
                  <Label className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Pill className="w-3.5 h-3.5 text-indigo-600" />
                    1. Select Medicine & Tablets to Return
                  </Label>
                  <span className="text-[10px] text-slate-400 font-medium">Customer details are optional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Medicine Picker */}
                  <div className="sm:col-span-2 space-y-1">
                    <Label className="font-semibold text-slate-700 text-[11px]">Select Medicine *</Label>
                    <select
                      value={directReturnMed ? (directReturnMed.medicine_name || directReturnMed.name) : ""}
                      onChange={(e) => {
                        const med = medicines.find(m => (m.medicine_name || m.name) === e.target.value);
                        setDirectReturnMed(med || null);
                        if (med) {
                          const price = Number(med.selling_price) || Number(med.mrp) || 10;
                          setDirectReturnPrice(price);
                          const firstBatch = med.batches?.[0]?.batch_number || med.batch_number || "BATCH-01";
                          setDirectReturnBatch(firstBatch);
                        }
                      }}
                      className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="">-- Choose Medicine from Inventory --</option>
                      {medicines.map((m, idx) => (
                        <option key={idx} value={m.medicine_name || m.name}>
                          {m.medicine_name} (Stock: {m.stock || 0} | {m.dosage_form || "Tablet"} | ₹{m.selling_price || m.mrp || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Return Quantity (Tablets / Units) */}
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700 text-[11px]">Tablets / Units to Return *</Label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDirectReturnQty(prev => Math.max(1, (parseInt(prev, 10) || 1) - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center cursor-pointer text-sm"
                      >
                        -
                      </button>
                      <Input
                        type="number"
                        min={1}
                        value={directReturnQty}
                        onChange={(e) => setDirectReturnQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="h-8 text-center font-mono font-bold text-xs bg-white"
                        placeholder="Qty"
                      />
                      <button
                        type="button"
                        onClick={() => setDirectReturnQty(prev => (parseInt(prev, 10) || 0) + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold flex items-center justify-center cursor-pointer text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Batch Selection */}
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700 text-[11px]">Batch # (Restock Target)</Label>
                    {directReturnMed && (directReturnMed.batches || []).length > 0 ? (
                      <select
                        value={directReturnBatch}
                        onChange={(e) => setDirectReturnBatch(e.target.value)}
                        className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs focus:outline-none"
                      >
                        {(directReturnMed.batches || []).map((b, bIdx) => (
                          <option key={bIdx} value={b.batch_number}>
                            {b.batch_number} (Stock: {b.current_stock || 0} | Exp: {b.exp_date || "N/A"})
                          </option>
                        ))}
                        <option value="RETURN">Auto Return Batch (RET)</option>
                      </select>
                    ) : (
                      <Input
                        value={directReturnBatch}
                        onChange={(e) => setDirectReturnBatch(e.target.value)}
                        placeholder="e.g. BATCH-01 or RETURN"
                        className="h-8 text-xs bg-white"
                      />
                    )}
                  </div>

                  {/* Unit Rate */}
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700 text-[11px]">Unit Rate (₹ / tablet)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={directReturnPrice}
                      onChange={(e) => setDirectReturnPrice(e.target.value)}
                      placeholder="Price"
                      className="h-8 text-xs font-mono bg-white"
                    />
                  </div>

                  {/* Return Reason */}
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700 text-[11px]">Return Reason</Label>
                    <select
                      value={directReturnReason}
                      onChange={(e) => setDirectReturnReason(e.target.value)}
                      className="w-full h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs focus:outline-none"
                    >
                      <option value="Doctor Changed Prescription">Doctor Changed Prescription</option>
                      <option value="Excess / Unused Tablets">Excess / Unused Tablets</option>
                      <option value="Patient Discontinued / Recovered">Patient Discontinued / Recovered</option>
                      <option value="Incorrect Medicine Dispensed">Incorrect Medicine Dispensed</option>
                      <option value="Adverse Drug Reaction">Adverse Drug Reaction</option>
                      <option value="Defective / Damaged Packaging">Defective / Damaged Packaging</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Optional Customer Name */}
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700 text-[11px]">Customer / Patient Name (Optional)</Label>
                    <Input
                      value={directReturnPatient}
                      onChange={(e) => setDirectReturnPatient(e.target.value)}
                      placeholder="Walk-in Customer (Optional)"
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  {/* Optional Customer Mobile */}
                  <div className="space-y-1">
                    <Label className="font-semibold text-slate-700 text-[11px]">Mobile # / ID (Optional)</Label>
                    <Input
                      value={directReturnMobile}
                      onChange={(e) => setDirectReturnMobile(e.target.value)}
                      placeholder="Mobile # (Optional)"
                      className="h-8 text-xs bg-white"
                    />
                  </div>

                  {/* Add to Return List Button */}
                  <div className="flex items-end">
                    <Button
                      type="button"
                      onClick={handleAddDirectReturnItem}
                      disabled={!directReturnMed}
                      className="w-full h-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Return List
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step 2: Select Items and Return Quantities */}
              {returnItems.length > 0 ? (
                <div className="space-y-3 border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center">
                    <Label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                      2. Medicines to Return & Refund Amount ({returnItems.length} items)
                    </Label>
                    <span className="text-[10px] text-slate-400">Review quantities and refund amounts</span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                          <th className="p-3 text-center w-10">Select</th>
                          <th className="p-3">Medicine & Batch</th>
                          <th className="p-3 text-center w-20">Sold Qty</th>
                          <th className="p-3 text-center w-28">Return Qty</th>
                          <th className="p-3 text-right w-24">Unit Rate</th>
                          <th className="p-3 text-right w-28">Refund Total</th>
                          <th className="p-3 w-36">Return Reason</th>
                          <th className="p-3 text-center w-10">Remove</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {returnItems.map((item, idx) => (
                          <tr key={idx} className={item.selected ? "bg-rose-50/20" : "bg-slate-50/40 opacity-60"}>
                            <td className="p-3 text-center">
                              <input 
                                type="checkbox"
                                checked={item.selected}
                                onChange={() => handleToggleReturnItem(idx)}
                                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{item.medicine_name}</div>
                              <div className="text-[10px] font-mono text-slate-500">Batch: {item.batch_number || "N/A"}</div>
                            </td>
                            <td className="p-3 text-center font-mono font-semibold text-slate-700">
                              {item.sold_qty !== null && item.sold_qty !== undefined ? item.sold_qty : <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-medium">Direct</span>}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  disabled={!item.selected || item.return_qty <= 1}
                                  onClick={() => handleUpdateReturnQty(idx, item.return_qty - 1)}
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center disabled:opacity-40 cursor-pointer"
                                >
                                  -
                                </button>
                                <Input
                                  type="number"
                                  disabled={!item.selected}
                                  min={1}
                                  max={item.sold_qty || undefined}
                                  value={item.return_qty}
                                  onChange={(e) => handleUpdateReturnQty(idx, e.target.value)}
                                  onBlur={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    if (isNaN(val) || val < 1) {
                                      handleUpdateReturnQty(idx, 1);
                                    } else if (item.sold_qty && val > item.sold_qty) {
                                      handleUpdateReturnQty(idx, item.sold_qty);
                                    }
                                  }}
                                  className="w-14 h-7 text-center font-mono font-bold text-xs p-1 bg-white"
                                />
                                <button
                                  type="button"
                                  disabled={!item.selected || (item.sold_qty !== null && item.sold_qty !== undefined && item.return_qty >= item.sold_qty)}
                                  onClick={() => handleUpdateReturnQty(idx, item.return_qty + 1)}
                                  className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center disabled:opacity-40 cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                              {item.sold_qty && <div className="text-[9px] text-slate-400 font-mono mt-0.5">Max: {item.sold_qty}</div>}
                            </td>
                            <td className="p-3 text-right font-mono text-slate-600">
                              ₹{Number(item.unit_price).toFixed(2)}
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-rose-700">
                              ₹{Number(item.refund_amount).toFixed(2)}
                            </td>
                            <td className="p-3">
                              <select
                                disabled={!item.selected}
                                value={item.reason}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setReturnItems(prev => prev.map((it, i) => i === idx ? { ...it, reason: val } : it));
                                }}
                                className="w-full h-7 rounded border border-slate-200 bg-white px-2 text-[11px] focus:outline-none"
                              >
                                <option value="Doctor Changed Prescription">Doctor Changed Prescription</option>
                                <option value="Excess / Unused Tablets">Excess / Unused Tablets</option>
                                <option value="Patient Discontinued / Recovered">Patient Discontinued / Recovered</option>
                                <option value="Incorrect Medicine Dispensed">Incorrect Medicine Dispensed</option>
                                <option value="Adverse Drug Reaction">Adverse Drug Reaction</option>
                                <option value="Defective / Damaged Packaging">Defective / Damaged Packaging</option>
                                <option value="Other">Other</option>
                              </select>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveReturnItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                                title="Remove from return list"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/60 text-slate-500 space-y-1">
                  <Pill className="w-6 h-6 mx-auto text-slate-400" />
                  <p className="font-semibold text-xs">No medicines added to return list yet</p>
                  <p className="text-[11px] text-slate-400">Select a medicine above, specify tablet count, and click &quot;Add to Return List&quot;.</p>
                </div>
              )}

              {/* Step 3: Return Options & Refund Mode */}
              {returnItems.length > 0 && (
                <div className="space-y-4 border-t border-slate-100 pt-4">
                  <Label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                    3. Return Configuration & Restock Settings
                  </Label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Restock checkbox */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2.5">
                      <input 
                        type="checkbox"
                        id="restock-toggle"
                        checked={returnRestock}
                        onChange={(e) => setReturnRestock(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                      <label htmlFor="restock-toggle" className="cursor-pointer">
                        <span className="font-bold text-slate-800 block">Restock to Batch Inventory</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          Automatically increment active batch stock and add stock movement log.
                        </span>
                      </label>
                    </div>

                    {/* Refund Payment Mode */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <Label className="font-bold text-slate-800">Refund Payment Method</Label>
                      <select
                        value={returnMethod}
                        onChange={(e) => setReturnMethod(e.target.value)}
                        className="w-full h-8 rounded border border-slate-200 bg-white px-2 font-medium text-xs focus:outline-none"
                      >
                        <option value="Cash">Cash Refund</option>
                        <option value="UPI">UPI / QR Payment</option>
                        <option value="Credit/Debit Card">Card Refund</option>
                        <option value="Patient Account Credit">Patient Account Credit</option>
                        <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                      </select>
                    </div>
                  </div>

                  {/* Notes / Pharmacist Remarks */}
                  <div className="space-y-1">
                    <Label className="font-bold text-slate-600">Pharmacist Remarks / Clinical Notes (Optional)</Label>
                    <Input
                      placeholder="Add return verification remarks or reason details..."
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                      className="h-8 text-xs bg-slate-50 border-slate-200"
                    />
                  </div>

                  {/* Summary Box */}
                  {(() => {
                    const selectedList = returnItems.filter(i => i.selected && i.return_qty > 0);
                    const totalRefund = selectedList.reduce((acc, curr) => acc + curr.refund_amount, 0);
                    const totalUnits = selectedList.reduce((acc, curr) => acc + curr.return_qty, 0);

                    return (
                      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Return Summary</span>
                          <span className="text-xs text-slate-700 mt-0.5 block">
                            <strong>{selectedList.length}</strong> medicine(s) selected • Total units returning: <strong>{totalUnits}</strong>
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Refund Amount</span>
                          <span className="text-xl font-black font-mono text-emerald-700">
                            ₹{totalRefund.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowSalesReturnModal(false)}
                className="h-8 text-xs border-slate-200 bg-white"
              >
                Cancel
              </Button>

              <Button
                type="button"
                disabled={isSubmittingReturn || returnItems.filter(i => i.selected && i.return_qty > 0).length === 0}
                onClick={handleExecuteSalesReturn}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs h-8 px-5 gap-1.5 shadow-sm"
              >
                {isSubmittingReturn ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing Return...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    Process Return & Restock (₹{returnItems.filter(i => i.selected && i.return_qty > 0).reduce((acc, c) => acc + c.refund_amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })})
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dispensation Invoice & Receipt Preview Modal */}
      {showDispenseReceiptModal && latestDispenseRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-0 flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-slate-100 bg-slate-50/90 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 font-serif">Pharmacy Invoice & Dispense Receipt</h3>
                  <p className="text-[11px] text-slate-500 font-mono">Invoice #{latestDispenseRecord.invoiceNumber}</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowDispenseReceiptModal(false); setLatestDispenseRecord(null); }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Itemized Invoice Preview */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              {/* Hospital Title */}
              <div className="text-center pb-3 border-b border-slate-100 space-y-1">
                <h4 className="text-base font-extrabold text-slate-900 font-serif tracking-wide">THANGAM HOSPITAL</h4>
                <p className="text-[10px] text-slate-500">123 Health City Road, Coimbatore - 641012 | Phone: +91 422 2345678</p>
                <p className="text-[10px] text-slate-400">GSTIN: 33AAAAA1111A1Z1 | Pharmacy License: DL-COI-90823H</p>
                <div className="pt-1.5 flex justify-center">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full border
                    ${latestDispenseRecord.isPaidAtPharmacy 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : "bg-amber-50 text-amber-700 border-amber-200"}`}
                  >
                    {latestDispenseRecord.isPaidAtPharmacy ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        PAID AT PHARMACY COUNTER
                      </>
                    ) : (
                      <>
                        <ArrowRight className="w-3.5 h-3.5" />
                        FORWARDED TO CENTRAL BILLING DESK (DUE AT BILLING)
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Patient Name</span>
                  <span className="font-semibold text-slate-900">{latestDispenseRecord.patientName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Mobile / ID</span>
                  <span className="font-mono text-slate-700">{latestDispenseRecord.patientMobile}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Prescribed Doctor</span>
                  <span className="font-semibold text-slate-900">{latestDispenseRecord.doctorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Date & Time</span>
                  <span className="font-mono text-slate-700">{latestDispenseRecord.date || new Date().toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Payment Method</span>
                  <span className="font-semibold text-slate-900">{latestDispenseRecord.paymentMethod || "Cash"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase font-bold">Dispensing Pharmacist</span>
                  <span className="font-semibold text-slate-900">{latestDispenseRecord.pharmacistName || pharmacistName}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Medicine Item</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-2 text-center">Batch / Source</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(latestDispenseRecord.items || []).map((item, idx) => {
                      const isOutside = item.source === "Outside Purchase" || item.dispense_status === "Outside Purchase";
                      const totalQty = item.requested_qty || item.qty || 1;
                      const batchNames = isOutside 
                        ? "Outside Purchase" 
                        : (item.deductions || []).map(d => `${d.batch_number} (x${d.qty})`).join(", ") || "Active Batch";
                      // Use pre-computed line_total if available; fallback to unit_price * qty
                      const lineTotal = isOutside ? 0 : (item.line_total !== undefined ? item.line_total : (totalQty * (item.unit_price || 0)));

                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {item.medicine_name}
                            {isOutside && <span className="block text-[9px] text-slate-400 font-normal italic">Purchased Outside Hospital</span>}
                          </td>
                          <td className="py-2 px-2 text-center font-mono">{totalQty}</td>
                          <td className="py-2 px-2 text-center text-[10px] text-slate-500 font-mono">{batchNames}</td>
                          <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">
                            {isOutside ? "₹0.00" : `₹${lineTotal.toFixed(2)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total & Stamp */}
              <div className="flex justify-between items-center pt-2 px-1">
                <div>
                  <div className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5
                    ${latestDispenseRecord.isPaidAtPharmacy 
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50" 
                      : "border-amber-500 text-amber-700 bg-amber-50"}`}
                  >
                    {latestDispenseRecord.isPaidAtPharmacy ? "PAID & DISPENSED" : "FORWARDED TO CENTRAL BILLING"}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Grand Total (incl. GST)</span>
                  <span className="text-xl font-extrabold text-slate-900 font-mono">
                    ₹{Number(latestDispenseRecord.totalVal || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50/80 flex flex-wrap gap-2.5 justify-end shrink-0">
              <Button
                variant="outline"
                onClick={() => { setShowDispenseReceiptModal(false); setLatestDispenseRecord(null); }}
                className="h-9 text-xs border-slate-200 text-slate-600 bg-white"
              >
                Close & Return
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  generatePDFInvoice(
                    latestDispenseRecord.invoiceNumber,
                    latestDispenseRecord.patientName,
                    latestDispenseRecord.patientMobile,
                    latestDispenseRecord.doctorName,
                    latestDispenseRecord.items,
                    latestDispenseRecord.totalVal,
                    latestDispenseRecord.paymentMethod,
                    latestDispenseRecord.isPaidAtPharmacy
                  );
                  showToast("Invoice PDF downloaded!", "success");
                }}
                className="h-9 text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold gap-1.5 bg-white"
              >
                <Download className="w-3.5 h-3.5" /> Download PDF
              </Button>
              <Button
                onClick={() => printDispenseReceipt(latestDispenseRecord)}
                className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" /> Print Invoice
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sales Return Receipt & Voucher Modal */}
      {showReturnReceiptModal && latestReturnRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 font-serif">Sales Return Processed Successfully</h3>
              <p className="text-xs text-slate-500 font-mono">Voucher ID: {latestReturnRecord.return_id}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Original Invoice:</span>
                <span className="font-mono font-bold text-slate-800">{latestReturnRecord.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{latestReturnRecord.patient_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Refund Mode:</span>
                <span className="font-semibold text-slate-800">{latestReturnRecord.refund_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Restocked to Inventory:</span>
                <span className={`font-semibold ${latestReturnRecord.restock_inventory ? "text-emerald-700" : "text-amber-700"}`}>
                  {latestReturnRecord.restock_inventory ? "Yes (Batches Updated)" : "No"}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-700">Total Refund:</span>
                <span className="font-bold font-mono text-base text-emerald-700">
                  ₹{Number(latestReturnRecord.total_refund).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={() => printReturnReceipt(latestReturnRecord)}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print Return Voucher
              </Button>
              <Button 
                variant="outline" 
                onClick={() => { setShowReturnReceiptModal(false); setLatestReturnRecord(null); }}
                className="h-9 text-xs border-slate-200 bg-white"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PO Suggestion Confirmation Modal */}
      {showPOSuggModal && poSuggItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-serif font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-indigo-600" />
                Confirm Purchase Order
              </h3>
              <button onClick={() => { setShowPOSuggModal(false); setPoSuggItem(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-sm text-slate-700">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="font-bold text-slate-900 text-base">{poSuggItem.medicine}</div>
                <div className="text-xs text-slate-500 mt-1">{poSuggItem.generic}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Supplier</div>
                  <div className="font-medium">{poSuggItem.supplier}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Est. Delivery Date</div>
                  <div className="font-medium">
                    {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Suggested Qty</div>
                  <div className="font-bold font-mono text-indigo-600">+{poSuggItem.suggested}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 uppercase">Purchase Price</div>
                  <div className="font-mono">₹{poSuggItem.price.toFixed(2)}</div>
                </div>
                <div className="col-span-2 pt-2 border-t">
                  <div className="text-xs font-bold text-slate-400 uppercase">Estimated Total Cost</div>
                  <div className="font-bold font-mono text-lg text-slate-900">
                    ₹{(poSuggItem.suggested * poSuggItem.price).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 border-t bg-slate-50 flex justify-end gap-2">
              <Button onClick={() => { setShowPOSuggModal(false); setPoSuggItem(null); }} variant="outline" className="h-8 text-xs text-slate-600 bg-white border-slate-200 hover:bg-slate-100">
                Cancel
              </Button>
              <Button onClick={handleCreatePOFromSuggestion} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm">
                Create Purchase Order
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk PO Edit & Confirmation Modal */}
      {showBulkPOModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-serif font-bold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                Review & Edit Purchase Orders
              </h3>
              <button onClick={() => setShowBulkPOModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="px-5 py-3 border-b bg-white flex items-center justify-between z-20">
              <div className="text-sm font-semibold text-slate-700">Add Items Manually</div>
              <div className="relative w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input 
                  placeholder="Search medicine to add..." 
                  className="pl-9 h-9 text-xs border-slate-200"
                  value={poAddSearch}
                  onChange={(e) => setPoAddSearch(e.target.value)}
                />
                {poAddSearch && (
                  <div className="absolute top-10 left-0 w-full bg-white border border-slate-200 shadow-xl rounded-md max-h-60 overflow-y-auto z-[100]">
                    {medicines.filter(m => m.medicine_name.toLowerCase().includes(poAddSearch.toLowerCase())).slice(0, 15).map(m => (
                      <div 
                        key={m.medicine_name} 
                        className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center"
                        onClick={() => {
                          const existing = bulkPOItems.find(i => i.medicine === m.medicine_name);
                          if (!existing) {
                            setBulkPOItems([{
                              medicine: m.medicine_name,
                              generic: m.generic_name || m.category || "General",
                              current_stock: m.stock || 0,
                              suggested: 10,
                              supplier: suppliers[0]?.name || "N/A"
                            }, ...bulkPOItems]);
                          }
                          setPoAddSearch("");
                        }}
                      >
                        <div>
                          <div className="font-bold text-xs text-slate-800">{m.medicine_name}</div>
                          <div className="text-[10px] text-slate-500">{m.generic_name || m.category}</div>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400">Stock: {m.stock}</div>
                      </div>
                    ))}
                    {medicines.filter(m => m.medicine_name.toLowerCase().includes(poAddSearch.toLowerCase())).length === 0 && (
                      <div className="px-4 py-3 text-xs text-slate-500 text-center">No medicines found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-0 overflow-y-auto flex-1 bg-slate-50/50 relative z-10">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="px-5 py-3">Medicine</th>
                    <th className="px-5 py-3 text-center">Supplier</th>
                    <th className="px-5 py-3 text-center">Current Stock</th>
                    <th className="px-5 py-3 text-center">Order Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {bulkPOItems.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="p-8 text-center text-slate-400">No items available to order.</td>
                    </tr>
                  ) : (
                    bulkPOItems.map((rec, idx) => (
                      <tr key={`${rec.medicine}-${idx}`} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <div className="font-bold text-slate-900">{rec.medicine}</div>
                          <div className="text-[10px] text-slate-400">{rec.generic}</div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <select 
                            value={rec.supplier}
                            onChange={(e) => {
                              const newItems = [...bulkPOItems];
                              newItems[idx].supplier = e.target.value;
                              setBulkPOItems(newItems);
                            }}
                            className="text-xs h-7 border-slate-200 rounded px-2 w-32 focus:outline-none"
                          >
                            {suppliers.map(s => (
                              <option key={s.name} value={s.name}>{s.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-3 text-center font-mono">{rec.current_stock}</td>
                        <td className="px-5 py-3 text-center">
                          <Input
                            type="number"
                            min="0"
                            className="w-20 h-8 mx-auto text-center font-bold text-indigo-600 border-indigo-200 focus:border-indigo-500"
                            value={rec.suggested}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 0;
                              const newItems = [...bulkPOItems];
                              newItems[idx].suggested = newQty;
                              setBulkPOItems(newItems);
                            }}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="px-5 py-4 border-t bg-white flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
              <div className="text-sm">
                <span className="text-slate-500">Total Items:</span>
                <span className="ml-2 font-bold text-slate-900">{bulkPOItems.filter(i => i.suggested > 0).length}</span>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setShowBulkPOModal(false)} variant="outline" className="h-9 border-slate-200">
                  Cancel
                </Button>
                <Button onClick={handleConfirmAndDownloadBulkPOs} className="h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Generate & Download Forms
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expiring Report Modal */}
      {showExpiringReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-serif font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                Export Expiring Medicines
              </h3>
              <button onClick={() => setShowExpiringReportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="text-sm text-slate-600 mb-2">
                Select the timeframe to identify medicines that will expire soon.
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Value</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={expiringReportTimeframe.value} 
                    onChange={(e) => setExpiringReportTimeframe(prev => ({ ...prev, value: parseInt(e.target.value) || 1 }))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500">Time Unit</Label>
                  <select 
                    value={expiringReportTimeframe.type}
                    onChange={(e) => setExpiringReportTimeframe(prev => ({ ...prev, type: e.target.value }))}
                    className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500"
                  >
                    <option value="Days">Days</option>
                    <option value="Months">Months</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="px-5 py-3 border-t bg-slate-50 flex justify-end gap-2">
              <Button onClick={() => setShowExpiringReportModal(false)} variant="outline" className="h-8 text-xs border-slate-200">
                Cancel
              </Button>
              <Button onClick={handleDownloadExpiringReport} className="h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white font-semibold flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Workdesk Edit Quantity Modal */}
      {showWorkdeskEditModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <Edit3 className="w-4 h-4 text-indigo-500" /> Edit Dispense Quantity
              </h3>
              <button onClick={() => setShowWorkdeskEditModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600 font-semibold">New Quantity</Label>
                <Input type="number" min="1" value={workdeskEditQty} onChange={(e) => setWorkdeskEditQty(e.target.value)} className="h-9 font-mono font-bold" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600 font-semibold">Reason for Change</Label>
                <Input placeholder="e.g. Doctor updated dose" value={workdeskEditReason} onChange={(e) => setWorkdeskEditReason(e.target.value)} className="h-9" />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowWorkdeskEditModal(false)} className="h-8.5">Cancel</Button>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white h-8.5" onClick={confirmWorkdeskEdit}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Workdesk Partial Dispense Modal */}
      {showWorkdeskPartialModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/80">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-amber-500" /> Partial Dispense
              </h3>
              <button onClick={() => setShowWorkdeskPartialModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600 font-semibold">Dispense Quantity Now</Label>
                <Input type="number" min="1" value={workdeskPartialQty} onChange={(e) => setWorkdeskPartialQty(e.target.value)} className="h-9 font-mono font-bold" />
                <p className="text-[10px] text-slate-400">The remaining balance will be marked as pending or outside purchase.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowWorkdeskPartialModal(false)} className="h-8.5">Cancel</Button>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white h-8.5" onClick={confirmWorkdeskPartial}>Confirm Partial</Button>
            </div>
          </div>
        </div>
      )}

      {/* Workdesk Delete Modal */}
      {showWorkdeskDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-rose-50">
              <h3 className="font-semibold text-rose-800 flex items-center gap-2 text-sm">
                <Trash2 className="w-4 h-4 text-rose-600" /> Delete Medicine
              </h3>
              <button onClick={() => setShowWorkdeskDeleteModal(false)} className="text-rose-400 hover:text-rose-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-600">Are you sure you want to remove this medicine from the dispensation list?</p>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600 font-semibold">Reason for Deletion</Label>
                <select value={workdeskDeleteReason} onChange={(e) => setWorkdeskDeleteReason(e.target.value)} className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus:outline-none">
                  <option value="Doctor Cancelled">Doctor Cancelled</option>
                  <option value="Duplicate">Duplicate</option>
                  <option value="Wrong Prescription">Wrong Prescription</option>
                  <option value="Patient Refused">Patient Refused</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowWorkdeskDeleteModal(false)} className="h-8.5">Cancel</Button>
              <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white h-8.5" onClick={confirmWorkdeskDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Imported Invoices Explorer Modal */}
      {showImportedInvoicesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-linear-to-r from-indigo-50 to-white">
              <div>
                <h3 className="font-serif font-bold text-slate-900 text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  Imported Invoices & Purchase Receipts
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Browse all imported pharmaceutical supplier invoices and inspect medicines separated by Invoice ID.
                </p>
              </div>
              <button onClick={() => { setShowImportedInvoicesModal(false); setSelectedInvoiceDetail(null); }} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
              {importedInvoices.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300 p-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">No Imported Invoices Found Yet</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Supplier invoices and purchase receipts will appear here once recorded in the system.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Invoices</span>
                      <div className="text-2xl font-black text-indigo-950 mt-0.5">{importedInvoices.length}</div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Medicines Imported</span>
                      <div className="text-2xl font-black text-emerald-700 mt-0.5">
                        {importedInvoices.reduce((acc, it) => acc + (it.item_count || 1), 0)} items
                      </div>
                    </div>
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Total Procurement Net</span>
                      <div className="text-2xl font-black text-slate-900 mt-0.5">
                        ₹{importedInvoices.reduce((acc, it) => acc + (it.total_amount || 0), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {importedInvoices.map((inv) => {
                      const isExpanded = selectedInvoiceDetail === inv.invoice_number;
                      // Find all medicines matching this invoice
                      const invoiceMeds = medicines.filter(m => 
                        (m.invoice_number && m.invoice_number.toLowerCase() === inv.invoice_number.toLowerCase()) ||
                        (m.batches || []).some(b => b.invoice_number && b.invoice_number.toLowerCase() === inv.invoice_number.toLowerCase())
                      );

                      return (
                        <div key={inv.invoice_number} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200">
                          <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded text-xs">
                                  #{inv.invoice_number}
                                </span>
                                <span className="font-semibold text-slate-900 text-sm">{inv.supplier}</span>
                                <span className="text-slate-400 text-xs">•</span>
                                <span className="text-xs text-slate-500 font-medium">Date: {inv.invoice_date || 'N/A'}</span>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-3">
                                <span>Total Items: <strong className="text-slate-800">{inv.item_count || invoiceMeds.length}</strong></span>
                                <span>•</span>
                                <span>Invoice Value: <strong className="text-slate-900">₹{inv.total_amount?.toLocaleString("en-IN") || '0.00'}</strong></span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedInvoiceDetail(isExpanded ? null : inv.invoice_number);
                                }}
                                className="h-8 text-xs border-slate-200 hover:bg-slate-50 text-slate-700 gap-1"
                              >
                                {isExpanded ? "Hide Breakdown ▲" : `View Medicines (${invoiceMeds.length || inv.item_count}) ▼`}
                              </Button>

                              <Button
                                size="sm"
                                onClick={() => {
                                  setSearchQuery("");
                                  setCategoryFilter("All");
                                  setStatusFilter("All");
                                  setInvoiceFilter(inv.invoice_number);
                                  setShowImportedInvoicesModal(false);
                                  setActiveTab("inventory");
                                  showToast(`Filtered inventory table for Invoice ${inv.invoice_number}`, "info");
                                }}
                                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1 shadow-xs"
                              >
                                Filter Table
                              </Button>
                            </div>
                          </div>

                          {/* Expanded Medicines Breakdown Table */}
                          {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/70 p-4 animate-in slide-in-from-top-1 duration-200">
                              <h5 className="font-bold text-xs text-slate-700 mb-2 uppercase tracking-wide">
                                Medicines Included in Invoice #{inv.invoice_number}
                              </h5>
                              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                                      <th className="px-3 py-2">Medicine Name</th>
                                      <th className="px-3 py-2">Batch No</th>
                                      <th className="px-3 py-2 text-center">Pack</th>
                                      <th className="px-3 py-2 text-center font-bold">Qty (Units)</th>
                                      <th className="px-3 py-2 text-center">Expiry</th>
                                      <th className="px-3 py-2 text-right">PTR / Rate (₹)</th>
                                      <th className="px-3 py-2 text-right">MRP (₹)</th>
                                      <th className="px-3 py-2 text-center">Rack</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {(invoiceMeds.length > 0 ? invoiceMeds : (inv.items || [])).map((m, idx) => {
                                      const medBatch = m.batches?.[0] || m;
                                      return (
                                        <tr key={idx} className="hover:bg-slate-50/60">
                                          <td className="px-3 py-2 font-bold text-slate-800">
                                            {m.medicine_name || m.medicine || "Medicine"}
                                          </td>
                                          <td className="px-3 py-2 font-mono text-[11px] text-indigo-700 font-bold">
                                            {medBatch.batch_number || m.batch_number || "BATCH-01"}
                                          </td>
                                          <td className="px-3 py-2 text-center text-slate-600">
                                            {medBatch.pack_size || m.pack_size || m.pack || "10'S"}
                                          </td>
                                          <td className="px-3 py-2 text-center font-mono font-black text-slate-900">
                                            {m.stock || medBatch.current_stock || m.quantity || 1}
                                          </td>
                                          <td className="px-3 py-2 text-center font-mono text-slate-600 text-[11px]">
                                            {medBatch.exp_date || m.expiry_date || m.exp_date || "12-2028"}
                                          </td>
                                          <td className="px-3 py-2 text-right font-mono text-slate-700">
                                            ₹{parseFloat(m.purchase_price || medBatch.purchase_price || 0).toFixed(2)}
                                          </td>
                                          <td className="px-3 py-2 text-right font-mono text-slate-900 font-semibold">
                                            ₹{parseFloat(m.selling_price || m.mrp || medBatch.mrp || 0).toFixed(2)}
                                          </td>
                                          <td className="px-3 py-2 text-center font-mono text-slate-600">
                                            {medBatch.rack_location || m.rack_location || m.rack || "A-1"}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t bg-slate-50 flex justify-end items-center">
              <Button 
                onClick={() => { setShowImportedInvoicesModal(false); setSelectedInvoiceDetail(null); }}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-4"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dispensation Workdesk Popup Modal */}
      {showDispenseWorkdeskModal && selectedWalkIn && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-base font-bold text-slate-900 font-serif">Dispensation Workdesk</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    (selectedWalkIn.pharmacy_status === "Completed" || selectedWalkIn.appointment_status === "Billing" || selectedWalkIn.appointment_status === "Completed")
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {(selectedWalkIn.pharmacy_status === "Completed" || selectedWalkIn.appointment_status === "Billing" || selectedWalkIn.appointment_status === "Completed") ? "Dispensed" : "Ready for Dispensing"}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDispenseWorkdeskModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
              {/* Section 1: Patient & Consultation Overview Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/90 p-4 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Patient Name</span>
                  <span className="font-bold text-slate-900 mt-0.5 block text-sm">{selectedWalkIn.patient_name}</span>
                  <span className="text-[11px] text-slate-500">{selectedWalkIn.gender || "Patient"}{selectedWalkIn.age ? ` • ${selectedWalkIn.age} yrs` : ""}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">UHID / Patient ID</span>
                  <span className="font-mono text-slate-800 mt-0.5 block font-semibold">{selectedWalkIn.patient || selectedWalkIn.patient_id || selectedWalkIn.uhid || selectedWalkIn.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">Mob: {selectedWalkIn.mobile_number || selectedWalkIn.phone || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prescribing Doctor</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">{selectedWalkIn.doctor || "General Physician"}</span>
                  <span className="text-[11px] text-slate-500">Rx ID: {selectedWalkIn.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Prescription Date</span>
                  <span className="text-slate-700 mt-0.5 block font-medium">
                    {selectedWalkIn.modified || selectedWalkIn.creation
                      ? new Date(selectedWalkIn.modified || selectedWalkIn.creation).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                      : "Today"}
                  </span>
                  <span className="text-[11px] text-indigo-600 font-medium">{dispenseItems.length} distinct medicine(s)</span>
                </div>
                {(selectedWalkIn.prescription || selectedWalkIn.diagnosis) && (
                  <div className="col-span-2 sm:col-span-4 pt-2 border-t border-slate-200/60 mt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Doctor Rx & Clinical Instructions:</span>
                    <div className="text-slate-700 mt-1 font-mono text-[11px] bg-white p-2.5 rounded-lg border border-slate-200/80 whitespace-pre-line">
                      {selectedWalkIn.prescription || selectedWalkIn.diagnosis}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 2: Search & Add Medicine Bar (Professional Autocomplete, no ugly datalist) */}
              <div className="bg-linear-to-r from-indigo-50/40 via-slate-50 to-white p-4 rounded-xl border border-indigo-100 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row items-end gap-2.5">
                  <div className="flex-1 space-y-1 w-full relative">
                    <Label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
                      Search & Add Medicine to Dispense / Bill
                    </Label>
                    <Input
                      placeholder="Type medicine name, generic name, or barcode (e.g. Paracetamol, Dolo)..."
                      value={customAddMedName}
                      onChange={(e) => {
                        setCustomAddMedName(e.target.value);
                        setShowMedSearchDropdown(true);
                      }}
                      onFocus={() => {
                        if (customAddMedName.trim().length >= 2) setShowMedSearchDropdown(true);
                      }}
                      className="h-9 text-xs border-slate-200 bg-white w-full rounded-lg shadow-2xs focus:border-indigo-500"
                    />

                    {/* Floating Professional Autocomplete Dropdown (Shows on 2+ characters) */}
                    {showMedSearchDropdown && customAddMedName.trim().length >= 2 && (() => {
                      const q = customAddMedName.trim().toLowerCase();
                      const searchResults = medicines.filter(m => !m.disabled && (
                        (m.medicine_name && m.medicine_name.toLowerCase().includes(q)) ||
                        (m.generic_name && m.generic_name.toLowerCase().includes(q)) ||
                        (m.brand && m.brand.toLowerCase().includes(q)) ||
                        (m.barcode && m.barcode.toLowerCase().includes(q))
                      )).slice(0, 8);

                      return (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                          {searchResults.length === 0 ? (
                            <div className="p-3 text-center text-slate-400 text-xs">
                              No catalog matches for &quot;{customAddMedName}&quot;. You can still click &quot;Add Medicine&quot; to add manually.
                            </div>
                          ) : (
                            searchResults.map((med, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setCustomAddMedName(med.medicine_name);
                                  setShowMedSearchDropdown(false);
                                }}
                                className="p-2.5 px-3.5 hover:bg-indigo-50/80 cursor-pointer flex items-center justify-between gap-3 transition"
                              >
                                <div>
                                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                    <span>{med.medicine_name}</span>
                                    {med.strength && med.strength !== "-" && (
                                      <span className="text-[10px] text-slate-500 font-normal">({med.strength})</span>
                                    )}
                                  </div>
                                  {med.generic_name && (
                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                      Generic: {med.generic_name}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right shrink-0 flex items-center gap-2">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    med.stock > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                                  }`}>
                                    {med.stock > 0 ? `${med.stock} in stock` : "0 stock"}
                                  </span>
                                  <span className="font-mono font-bold text-slate-800 text-xs">
                                    ₹{Number(med.selling_price || med.mrp || 25).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="w-24 space-y-1">
                    <Label className="text-[11px] font-bold text-slate-600">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={customAddQty}
                      onChange={(e) => setCustomAddQty(e.target.value)}
                      className="h-9 text-xs border-slate-200 bg-white rounded-lg font-mono text-center shadow-2xs focus:border-indigo-500"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      handleAddCustomDispenseMed();
                      setShowMedSearchDropdown(false);
                    }}
                    className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 rounded-lg cursor-pointer shrink-0 shadow-xs gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Medicine
                  </Button>
                </div>

                {/* Doctor's Prescribed Quick-Add Options */}
                {selectedWalkIn.prescription && (() => {
                  const cleanStr = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
                  const prescribedList = parsePrescriptionDetails(selectedWalkIn.prescription, medicines);
                  if (prescribedList.length === 0) return null;

                  return (
                    <div className="pt-2.5 border-t border-indigo-100/70">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                        Prescribed Medicines from Doctor Rx (Click to Add):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {prescribedList.map((rxItem, rxIdx) => {
                          const isAlreadyAdded = dispenseItems.some(it => cleanStr(it.medicine_name) === cleanStr(rxItem.medicine_name));
                          return (
                            <button
                              key={rxIdx}
                              type="button"
                              disabled={isAlreadyAdded}
                              onClick={() => handleAddCustomDispenseMed(rxItem.medicine_name, rxItem.prescribed_qty, rxItem)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition ${
                                isAlreadyAdded 
                                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                  : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 shadow-2xs cursor-pointer"
                              }`}
                            >
                              <Plus className="w-3 h-3 text-indigo-600" />
                              <span className="font-semibold text-slate-900">{rxItem.medicine_name}</span>
                              <span className="text-[11px] text-slate-500 font-mono">({rxItem.prescribed_qty || 1} qty • {rxItem.dosage || "1-0-1"})</span>
                              {isAlreadyAdded && <span className="text-[10px] text-emerald-600 font-bold ml-1">Added ✓</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Section 3: Classified Items to Dispense Table */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs bg-white">
                <table className="w-full text-left border-collapse text-xs min-w-[850px]">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                      <th className="p-3 text-center w-10">#</th>
                      <th className="p-3">Medicine Details</th>
                      <th className="p-3 text-center w-28">Dosage / Timings</th>
                      <th className="p-3 text-center w-20">Prescribed</th>
                      <th className="p-3 text-center w-36">Dispense Qty</th>
                      <th className="p-3 text-right w-24">Unit Rate</th>
                      <th className="p-3 text-center w-28">Stock</th>
                      <th className="p-3 text-right w-28">Line Total</th>
                      <th className="p-3 text-center w-24">Status</th>
                      <th className="p-3 text-center w-24 min-w-[80px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {dispenseItems.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="p-8 text-center text-slate-400">
                          <Pill className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                          No medicines added to dispensation list yet.
                          <div className="text-[11px] text-slate-400 mt-1">
                            Search and add medicines in the search bar above, or click the prescribed medicines above to add them to the bill.
                          </div>
                        </td>
                      </tr>
                    ) : (
                      dispenseItems.map((item, index) => {
                        const isOutside = item.source === "Outside Purchase" || item.dispense_status === "Outside Purchase";
                        const isPartial = item.dispense_status === "Partially Dispensed";
                        const currentQty = isPartial ? (item.dispensed_qty || item.qty) : item.qty;
                        const lineTotal = isOutside ? 0 : (currentQty * (item.price || 0));

                        return (
                          <tr key={`${item.medicine_name}-${index}`} className="hover:bg-slate-50/75 transition">
                            <td className="p-3 text-center font-mono text-slate-400 font-medium">{index + 1}</td>
                            <td className="p-3 min-w-[200px]">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                <span>{item.medicine_name}</span>
                                {item.category === "Controlled Drug" && <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">CONTROLLED</span>}
                                {item.category === "Sleeping Pill" && <span className="bg-indigo-100 text-indigo-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">SLEEPING PILL</span>}
                                {item.category === "Schedule H1" && <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded">SCHEDULE H1</span>}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                <span>{item.category || "Regular"}</span>
                                {item.strength && item.strength !== "-" && !item.medicine_name.toLowerCase().includes(item.strength.toLowerCase()) && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span>{item.strength}</span>
                                  </>
                                )}
                                {isOutside && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-amber-600 font-semibold">Outside Purchase</span>
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-center min-w-[120px]">
                              <div className="font-mono font-bold text-slate-800 text-xs">{item.dosage || "1-0-1"}</div>
                              <div className="text-[10px] text-slate-400 font-medium mt-0.5">{item.food_instructions || "After Food"}</div>
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-slate-700 text-xs">
                              {item.prescribed_qty || item.qty}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap min-w-[130px]">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  disabled={item.qty <= 1}
                                  onClick={() => handleUpdateDispenseQty(index, -1)}
                                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                  -
                                </button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.qty}
                                  onChange={(e) => handleItemQtyChange(index, e.target.value)}
                                  className="w-14 h-7 text-center font-mono font-bold text-xs bg-white border-slate-200 focus:border-indigo-500 rounded-md p-0 shadow-2xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateDispenseQty(index, 1)}
                                  className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer transition text-sm"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="p-3 text-right font-mono font-semibold text-slate-700 whitespace-nowrap text-xs">
                              ₹{Number(item.price || 0).toFixed(2)}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center justify-center font-mono text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                                item.stock > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                              }`}>
                                {item.stock > 0 ? `${item.stock} in stock` : "0 stock"}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900 text-xs whitespace-nowrap">
                              {isOutside ? "₹0.00" : `₹${lineTotal.toFixed(2)}`}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap border ${
                                item.dispense_status === "Dispensed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                item.dispense_status === "Partially Dispensed" ? "bg-amber-100 text-amber-800 border-amber-300" :
                                item.dispense_status === "Outside Purchase" ? "bg-purple-50 text-purple-700 border-purple-200" :
                                "bg-rose-50 text-rose-700 border-rose-200"
                              }`}>
                                {item.dispense_status || "Ready"}
                              </span>
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-slate-600 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer border border-slate-200 shadow-2xs inline-flex items-center justify-center">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44 text-xs bg-white rounded-xl shadow-lg border border-slate-200 p-1">
                                  <DropdownMenuItem 
                                    onClick={() => { setWorkdeskEditIndex(index); setWorkdeskEditQty(item.qty); setShowWorkdeskEditModal(true); }}
                                    className="cursor-pointer font-medium py-2 rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 mr-2 text-indigo-600" /> Edit Quantity
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="my-1 bg-slate-100" />
                                  <DropdownMenuItem 
                                    onClick={() => { setWorkdeskDeleteIndex(index); setShowWorkdeskDeleteModal(true); }} 
                                    className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer font-medium py-2 rounded-lg transition"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-2 text-rose-600" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer & Single Submit Action */}
            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              <div className="text-left">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  TOTAL DISPENSATION VALUE
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono">
                  ₹{dispenseItems.reduce((acc, curr) => {
                    if (curr.source === "Outside Purchase" || curr.dispense_status === "Outside Purchase") return acc;
                    const qty = curr.dispense_status === "Partially Dispensed" ? (curr.dispensed_qty || curr.qty) : curr.qty;
                    return acc + (qty * (curr.price || 0));
                  }, 0).toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDispenseWorkdeskModal(false)}
                  className="h-9.5 text-xs border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium px-4 cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowSubmitDispenseModal(true)}
                  disabled={dispenseItems.length === 0}
                  className="h-9.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 rounded-lg shadow-sm gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle className="w-4 h-4" /> Submit / Process Dispensation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit / Process Dispensation Action Modal (3 Choices Dialog) */}
      {showSubmitDispenseModal && selectedWalkIn && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-4 px-6 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center">
              <div>
                <h4 className="text-base font-bold text-slate-900 font-serif">Process Dispensation</h4>
                <p className="text-xs text-slate-500 mt-0.5">Select how you want to settle and process this prescription</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitDispenseModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {/* Option 1: Pay at Pharmacy Desk */}
              <label 
                onClick={() => setSelectedSubmitAction("Pay at Pharmacy Desk")}
                className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedSubmitAction === "Pay at Pharmacy Desk" 
                    ? "bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500/20" 
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="submit_dispense_action"
                  checked={selectedSubmitAction === "Pay at Pharmacy Desk"}
                  onChange={() => setSelectedSubmitAction("Pay at Pharmacy Desk")}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span>Collect & Dispense (Pay at Pharmacy Desk)</span>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded">Immediate</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Collect payment directly at the pharmacy counter, generate receipt, and complete the dispensation.
                  </p>

                  {/* Inline settings when Option 1 is active */}
                  {selectedSubmitAction === "Pay at Pharmacy Desk" && (
                    <div className="mt-3 pt-3 border-t border-emerald-200/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <Label className="text-[10px] font-bold text-slate-600 block mb-1">Pharmacist</Label>
                        <Input
                          value={pharmacistName}
                          onChange={(e) => setPharmacistName(e.target.value)}
                          className="h-8 text-xs bg-white border-slate-200"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] font-bold text-slate-600 block mb-1">Payment Method</Label>
                        <select
                          value={otcPaymentMethod}
                          onChange={(e) => setOtcPaymentMethod(e.target.value)}
                          className="h-8 text-xs w-full rounded-lg border border-slate-200 bg-white px-2 focus:outline-none font-semibold text-slate-700"
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI / QR Code</option>
                          <option value="Card">Credit / Debit Card</option>
                          <option value="Insurance">Insurance / TPA</option>
                          <option value="Credit">Hospital Credit</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* Option 2: Forward to Central Billing Desk */}
              <label 
                onClick={() => setSelectedSubmitAction("Forward to Central Billing Desk")}
                className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedSubmitAction === "Forward to Central Billing Desk" 
                    ? "bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-500/20" 
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="submit_dispense_action"
                  checked={selectedSubmitAction === "Forward to Central Billing Desk"}
                  onChange={() => setSelectedSubmitAction("Forward to Central Billing Desk")}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span>Forward to Central Billing Desk</span>
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded">Central Pay</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Post medicine charges to patient&apos;s central hospital account for unified payment collection at the billing counter.
                  </p>
                </div>
              </label>

              {/* Option 3: Outside Purchase */}
              <label 
                onClick={() => setSelectedSubmitAction("Outside Purchase")}
                className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition ${
                  selectedSubmitAction === "Outside Purchase" 
                    ? "bg-amber-50/70 border-amber-300 ring-2 ring-amber-500/20" 
                    : "bg-white border-slate-200 hover:bg-slate-50"
                }`}
              >
                <input
                  type="radio"
                  name="submit_dispense_action"
                  checked={selectedSubmitAction === "Outside Purchase"}
                  onChange={() => setSelectedSubmitAction("Outside Purchase")}
                  className="mt-1 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span>Outside Purchase (₹0)</span>
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded">Zero Bill</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Mark medicines as purchased externally with no hospital billing charges.
                  </p>
                </div>
              </label>
            </div>

            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex justify-end items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSubmitDispenseModal(false)}
                className="h-9 text-xs border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  setShowSubmitDispenseModal(false);
                  if (selectedSubmitAction === "Pay at Pharmacy Desk") {
                    await executeDispensing("Pay at Pharmacy Desk");
                  } else if (selectedSubmitAction === "Forward to Central Billing Desk") {
                    await executeDispensing("Forward to Central Billing Desk");
                  } else if (selectedSubmitAction === "Outside Purchase") {
                    await executeOutsidePurchase();
                  }
                }}
                className={`h-9 text-xs font-semibold px-5 rounded-lg shadow-sm gap-1.5 cursor-pointer text-white ${
                  selectedSubmitAction === "Pay at Pharmacy Desk" ? "bg-emerald-600 hover:bg-emerald-700" :
                  selectedSubmitAction === "Forward to Central Billing Desk" ? "bg-indigo-600 hover:bg-indigo-700" :
                  "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" /> Confirm & Process
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Quantity Sub-Modal */}
      {showWorkdeskEditModal && workdeskEditIndex !== null && dispenseItems[workdeskEditIndex] && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" /> Edit Quantity
              </h4>
              <button
                type="button"
                onClick={() => setShowWorkdeskEditModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div>
              <div className="text-xs font-semibold text-slate-800 mb-1">
                {dispenseItems[workdeskEditIndex].medicine_name}
              </div>
              <div className="text-[11px] text-slate-500">
                Prescribed Qty: <strong className="text-slate-700">{dispenseItems[workdeskEditIndex].prescribed_qty || dispenseItems[workdeskEditIndex].qty}</strong>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">New Dispense Quantity</Label>
              <Input
                type="number"
                min="1"
                value={workdeskEditQty}
                onChange={(e) => setWorkdeskEditQty(e.target.value)}
                className="h-9 text-xs border-slate-200 font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Reason for Adjustment</Label>
              <select
                value={workdeskEditReason}
                onChange={(e) => setWorkdeskEditReason(e.target.value)}
                className="h-9 text-xs w-full rounded-lg border border-slate-200 bg-white px-2.5 focus:outline-none font-medium text-slate-700"
              >
                <option value="Adjusted by Pharmacist">Adjusted by Pharmacist</option>
                <option value="Patient Requested Less">Patient Requested Less</option>
                <option value="Doctor Revised Dosage">Doctor Revised Dosage</option>
                <option value="Partial Pack Provided">Partial Pack Provided</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowWorkdeskEditModal(false)}
                className="h-8.5 text-xs border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmWorkdeskEdit}
                className="h-8.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                Save Quantity
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Sub-Modal */}
      {showWorkdeskDeleteModal && workdeskDeleteIndex !== null && dispenseItems[workdeskDeleteIndex] && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-rose-700 flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" /> Remove Medicine
              </h4>
              <button
                type="button"
                onClick={() => setShowWorkdeskDeleteModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong className="text-slate-900">{dispenseItems[workdeskDeleteIndex].medicine_name}</strong> from this dispensation list?
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Reason for Removal</Label>
              <select
                value={workdeskDeleteReason}
                onChange={(e) => setWorkdeskDeleteReason(e.target.value)}
                className="h-9 text-xs w-full rounded-lg border border-slate-200 bg-white px-2.5 focus:outline-none font-medium text-slate-700"
              >
                <option value="Doctor Cancelled">Doctor Cancelled</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Patient Refused">Patient Refused</option>
                <option value="Purchased Outside">Purchased Outside</option>
                <option value="Added by Mistake">Added by Mistake</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowWorkdeskDeleteModal(false)}
                className="h-8.5 text-xs border-slate-200"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={confirmWorkdeskDelete}
                className="h-8.5 text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Remove Medicine
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
