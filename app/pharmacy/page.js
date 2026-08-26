"use client";

import { useState, useEffect, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { 
  Pill, CheckCircle, AlertCircle, Info, Activity, PackageCheck, Plus, Layers, 
  PlusCircle, RefreshCw, Printer, ShieldAlert, Search, FileText, Download, 
  Trash2, Eye, ClipboardList, ShoppingCart, DollarSign, Archive, Calendar,
  ArrowRight, X, Loader2, ArrowUpRight, HelpCircle, Truck, ChevronDown, Edit3, Sliders, Power, Users, ShoppingBag, Upload, MoreHorizontal
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
  receiveGoods, getMedicineHistory, adjustStock, deactivateMedicine, executeDirectSale, getStockMovementLogs, createPharmacyAuditLog
} from "@/lib/hospital-service";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AIInvoiceImportModal } from "@/components/pharmacy/AIInvoiceImportModal";
import { useAuth } from "@/lib/auth-context";

export default function PharmacyPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
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
  
  // AI Import State
  const [isAIImportModalOpen, setIsAIImportModalOpen] = useState(false);

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

  // Queue sub-filters
  const [queueSearchQuery, setQueueSearchQuery] = useState("");
  const [queueFilterTab, setQueueFilterTab] = useState("All");

  // Slide-over active tab
  const [detailActiveTab, setDetailActiveTab] = useState("batches");
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Registers Tab filter
  const [selectedRegister, setSelectedRegister] = useState("All Categories");

  // Dispense Form states
  const [dispenseItems, setDispenseItems] = useState([]);
  const [customAddMedName, setCustomAddMedName] = useState("");
  const [customAddQty, setCustomAddQty] = useState(10);
  const [pharmacistName, setPharmacistName] = useState("Rahul Sharma, RPh");

  // Add Medicine Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMedData, setNewMedData] = useState({
    medicine_name: "", generic_name: "", brand: "", manufacturer: "", strength: "",
    dosage_form: "Tablet", category: "Regular Medicine", min_stock: 50, max_stock: 500,
    reorder_level: 100, rack_location: "Rack A-01", purchase_price: "", selling_price: "", mrp: "", gst: 12.0,
    batch_number: "", supplier: "ABC Pharma", mfg_date: "", expiry_date: "", pack_size: 30, no_of_packs: 10
  });

  // Add Batch to Existing Medicine State
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [addBatchMed, setAddBatchMed] = useState(null);
  const [newBatchData, setNewBatchData] = useState({
    batch_number: "", supplier: "ABC Pharma", mfg_date: "", exp_date: "",
    pack_size: 30, no_of_packs: 10, purchase_price: "", mrp: "", rack_location: "Rack A-01"
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
  const [suppliers, setSuppliers] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hospital_suppliers');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return [
      { name: "ABC Pharma", licNo: "DL-COI-90823H", type: "Verified", isNarcotics: false, code: "SUP-1001", status: "Active" },
      { name: "XYZ Distributors", licNo: "DL-COI-12093H", type: "Verified", isNarcotics: false, code: "SUP-1002", status: "Active" },
      { name: "Special Drugs Ltd", licNo: "DL-NDPS-0032A (Narcotic)", type: "Narcotics Lic", isNarcotics: true, code: "SUP-1003", status: "Active" }
    ];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hospital_suppliers', JSON.stringify(suppliers));
    }
  }, [suppliers]);

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
      const meds = await getMedicines();
      setMedicines(meds);
      const q = await getQueue();
      setQueue(q);
      const reg = await getDrugRegister();
      setDrugRegister(reg);
      const pos = await getPurchaseOrders();
      setPurchaseOrders(pos);
    } catch (err) {
      showToast("Error loading data from Frappe", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
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
    const lowStock = activeMeds.filter(m => m.stock < m.min_stock).length;
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

    const todayDispensing = drugRegister.filter(r => {
      const d = new Date(r.dispensing_date);
      return d.toDateString() === today.toDateString();
    }).reduce((acc, curr) => acc + curr.quantity, 0);

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

    const pendingPrescriptions = queue.filter(q => q.pharmacy_status === "Pending" && q.appointment_status === "Pharmacy" && q.prescription).length;

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
        trendMap[d] += r.quantity;
      }
    });
    const dispensingTrendData = past7Days.map(date => ({ date, amount: trendMap[date] }));

    return { 
      totalMeds, lowStock, outOfStock, expiringCount, todayDispensing, 
      pendingPOs, inventoryValuation, outsidePurchases, partialDispenses, pendingPrescriptions,
      stockStatusData, categoryData, dispensingTrendData, activeMeds
    };
  }, [medicines, drugRegister, purchaseOrders, queue]);

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

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [medicines, searchQuery, categoryFilter, statusFilter, editedSuggQty]);

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

  const filteredQueue = useMemo(() => {
    return queue.filter(q => {
      if (!q.prescription || q.prescription.trim().length === 0) return false;
      
      const matchesSearch = 
        (q.patient_name || "").toLowerCase().includes(queueSearchQuery.toLowerCase()) ||
        (q.patient || "").toLowerCase().includes(queueSearchQuery.toLowerCase()) ||
        (q.mobile_number || "").toLowerCase().includes(queueSearchQuery.toLowerCase()) ||
        (q.name || "").toLowerCase().includes(queueSearchQuery.toLowerCase());
        
      if (!matchesSearch) return false;

      if (queueFilterTab === "Waiting") {
        return q.pharmacy_status === "Pending" && q.appointment_status === "Pharmacy";
      }
      if (queueFilterTab === "Dispensing") {
        return q.pharmacy_status === "Pending" && selectedWalkIn?.name === q.name;
      }
      if (queueFilterTab === "Completed") {
        return q.pharmacy_status === "Completed";
      }
      if (queueFilterTab === "Priority") {
        const text = (q.prescription || "").toLowerCase();
        const hasControlled = text.includes("alprazolam") || text.includes("fentanyl") || text.includes("zolpidem") || text.includes("schedule");
        return q.pharmacy_status === "Pending" && hasControlled;
      }
      
      return true;
    });
  }, [queue, queueSearchQuery, queueFilterTab, selectedWalkIn]);

  // Live drug registers
  const activeRegisterLogs = useMemo(() => {
    const filtered = drugRegister.filter(log => {
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
    // Clear dispense items so pharmacist has to manually search and add
    setDispenseItems([]);
  };

  const handleUpdateDispenseQty = (index, delta) => {
    setDispenseItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const newQty = Math.max(1, item.qty + delta);
        return { 
          ...item, 
          qty: newQty,
          dispensed_qty: item.dispense_status === "Partially Dispensed" ? Math.min(newQty, item.dispensed_qty) : newQty
        };
      }
      return item;
    }));
  };

  const handleItemQtyChange = (index, val) => {
    setDispenseItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const q = Math.max(1, parseInt(val) || 1);
        return { 
          ...item, 
          qty: q, 
          dispensed_qty: item.dispense_status === "Partially Dispensed" ? Math.min(item.dispensed_qty, q) : q
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
    await createPharmacyAuditLog({
      action: "Delete Medicine",
      medicine: item.medicine_name,
      patient: selectedWalkIn?.patient_name,
      reason: workdeskDeleteReason,
      performed_by: pharmacistName
    });
    setDispenseItems(prev => prev.filter((_, idx) => idx !== workdeskDeleteIndex));
    setShowWorkdeskDeleteModal(false);
    setWorkdeskDeleteIndex(null);
  };

  const confirmWorkdeskEdit = async () => {
    if (workdeskEditIndex === null) return;
    const item = dispenseItems[workdeskEditIndex];
    const oldQty = item.qty;
    const newQty = parseInt(workdeskEditQty) || 1;
    await createPharmacyAuditLog({
      action: "Edit Quantity",
      medicine: item.medicine_name,
      patient: selectedWalkIn?.patient_name,
      details: `Changed Qty from ${oldQty} to ${newQty}`,
      reason: workdeskEditReason,
      performed_by: pharmacistName
    });
    setDispenseItems(prev => prev.map((it, idx) => {
      if (idx === workdeskEditIndex) {
        return { ...it, qty: newQty, dispensed_qty: it.dispense_status === "Partially Dispensed" ? Math.min(it.dispensed_qty, newQty) : newQty };
      }
      return it;
    }));
    setShowWorkdeskEditModal(false);
    setWorkdeskEditIndex(null);
  };

  const confirmWorkdeskPartial = () => {
    if (workdeskPartialIndex === null) return;
    const newDispensedQty = parseInt(workdeskPartialQty) || 1;
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

  const handleAddCustomDispenseMed = () => {
    if (!customAddMedName) return;
    const med = medicines.find(m => m.medicine_name === customAddMedName);
    if (!med) {
      showToast("Medicine not found in inventory catalog", "error");
      return;
    }
    if (med.disabled) {
      showToast("Warning: Selected medicine is deactivated.", "error");
      return;
    }
    
    if (dispenseItems.some(item => item.medicine_name === med.medicine_name)) {
      showToast("Medicine already added to dispensation panel", "info");
      return;
    }

    const qty = parseInt(customAddQty) || 1;

    setDispenseItems(prev => [...prev, {
      medicine_name: med.medicine_name,
      prescribed_qty: qty,
      qty: qty,
      price: med.selling_price || 0,
      stock: med.stock || 0,
      category: med.category,
      source: "Hospital Pharmacy",
      dispense_status: "Dispensed",
      dispensed_qty: qty,
      remaining_qty: 0,
      remaining_action: "Pending"
    }]);

    setCustomAddMedName("");
    setCustomAddQty(10);
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
      loadAllData();
      
    } catch (error) {
      console.error(error);
      showToast("Failed to process Outside Purchase", "error");
    }
  };

  // Dispensing execution with compliance validation
  const executeDispensing = async () => {
    if (userRole === "Store Manager") {
      showToast("Access Denied: Store Managers cannot dispense medicines.", "error");
      return;
    }
    if (dispenseItems.length === 0) {
      showToast("No medicines added to dispense", "error");
      return;
    }

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
      const pMobile = selectedWalkIn?.mobile_number || "9999999999";
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
          bill_amount: selectedWalkIn.bill_amount + billAmt,
          pharmacy_bill_amount: billAmt,
          dispensed_medicines: dispenseItems
        });

        // Save invoice to patient portal profile
        saveInvoiceToProfile(selectedWalkIn.mobile_number, {
          name: `Pharmacy Dispensation - ${dispenseItems.map(i=> `${i.medicine_name} (x${i.source === 'Outside Purchase' ? 0 : (i.dispense_status === 'Partially Dispensed' ? i.dispensed_qty : i.qty)})`).join(", ")}`,
          bill_amount: billAmt,
          payment_method: otcPaymentMethod || "Cash",
          walkinData: {
            name: selectedWalkIn.name,
            patient_name: selectedWalkIn.patient_name,
            mobile_number: selectedWalkIn.mobile_number,
            doctor: selectedWalkIn.doctor,
            pharmacy_bill_amount: billAmt,
            dispensed_medicines: dispenseItems,
            netBalance: billAmt
          }
        });

        // Record pharmacy sale revenue in Finance ledger
        if (typeof window !== 'undefined' && billAmt > 0) {
          const storedFinance = localStorage.getItem("hospital_custom_finance");
          const financeEntries = storedFinance ? JSON.parse(storedFinance) : [];
          financeEntries.unshift({
            id: `tx-rx-${response.invoiceNumber}`,
            title: `Pharmacy Sale — ${selectedWalkIn.patient_name}`,
            type: "Income",
            category: "Pharmacy",
            amount: billAmt,
            method: otcPaymentMethod || "Cash",
            date: new Date().toISOString().split("T")[0],
            notes: `Invoice: ${response.invoiceNumber} | Doctor: ${docName} | Items: ${dispenseItems.filter(i=>i.source!=="Outside Purchase").map(i=>`${i.medicine_name} ×${i.dispense_status==="Partially Dispensed"?i.dispensed_qty:i.qty}`).join(", ")}`
          });
          localStorage.setItem("hospital_custom_finance", JSON.stringify(financeEntries));
        }
      }

      showToast(`Transaction completed. Invoice ${response.invoiceNumber} generated!`, "success");
      
      // Auto-trigger invoice print format
      generatePDFInvoice(response.invoiceNumber, pName, pMobile, docName, response.dispensedReceipt, billAmt, otcPaymentMethod || "Cash");

      setSelectedWalkIn(null);
      setDispenseItems([]);
      loadAllData();
    } catch (e) {
      console.error(e);
      showToast("Dispensation failed", "error");
    }
  };

  // Add new medicine record with mandatory Batch Number & Pack Size calculation
  const handleAddNewMedicine = async (e) => {
    e.preventDefault();
    if (!newMedData.medicine_name || !newMedData.generic_name || !newMedData.selling_price) {
      showToast("Medicine Name, Generic Name, and Selling Price (MRP) are required", "error");
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

    const packSize = parseInt(newMedData.pack_size) || 1;
    const noOfPacks = parseFloat(newMedData.no_of_packs) || 0;
    const totalUnits = packSize * noOfPacks;

    try {
      const data = {
        ...newMedData,
        purchase_price: parseFloat(newMedData.purchase_price) || 0.0,
        selling_price: parseFloat(newMedData.selling_price) || 0.0,
        mrp: parseFloat(newMedData.mrp) || parseFloat(newMedData.selling_price) || 0.0,
        min_stock: parseInt(newMedData.min_stock) || 50,
        max_stock: parseInt(newMedData.max_stock) || 500,
        reorder_level: parseInt(newMedData.reorder_level) || 100,
        prescription_required: newMedData.category !== "OTC" ? 1 : 0,
        controlled_drug: newMedData.category === "Controlled Drug" ? 1 : 0,
        sleeping_pill: newMedData.category === "Sleeping Pill" ? 1 : 0,
        stock: totalUnits
      };

      await createMedicine(data);

      if (typeof window !== 'undefined') {
         const batches = JSON.parse(localStorage.getItem('hospital_batches')) || [];
         batches.unshift({
           batch_number: newMedData.batch_number.trim().toUpperCase(),
           medicine: data.medicine_name,
           supplier: newMedData.supplier || "ABC Pharma",
           mfg_date: newMedData.mfg_date || null,
           exp_date: newMedData.expiry_date,
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
        reorder_level: 100, rack_location: "Rack A-01", purchase_price: "", selling_price: "", mrp: "", gst: 12.0,
        batch_number: "", supplier: "ABC Pharma", mfg_date: "", expiry_date: "", pack_size: 30, no_of_packs: 10
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
        remarks: `Supplier: ${newBatchData.supplier || "ABC Pharma"} | Pack Size: ${packSize} x ${noOfPacks} packs`,
        performed_by: pharmacistName
      });

      showToast(`Batch ${batchNoUpper} added successfully to ${addBatchMed.medicine_name}!`, "success");
      setShowAddBatchModal(false);
      setAddBatchMed(null);
      setNewBatchData({
        batch_number: "", supplier: "ABC Pharma", mfg_date: "", exp_date: "",
        pack_size: 30, no_of_packs: 10, purchase_price: "", mrp: "", rack_location: "Rack A-01"
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

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showToast("Pop-up blocked! Please allow pop-ups to print the Register.", "error");
      return;
    }

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
              color: #dc2626;
              margin-top: 6px;
              text-transform: uppercase;
              letter-spacing: 0.8px;
            }
            .meta-info {
              text-align: right;
              font-size: 10px;
              color: #475569;
              line-height: 1.5;
            }
            .meta-info strong {
              color: #0f172a;
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
              font-size: 10px;
            }
            th {
              background-color: #f1f5f9;
              color: #1e293b;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 9px;
              letter-spacing: 0.3px;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-mono { font-family: monospace; font-weight: 600; }
            .badge-batch {
              display: inline-block;
              background: ${badgeBg};
              color: ${badgeColor};
              font-weight: bold;
              padding: 1px 5px;
              border-radius: 3px;
              font-size: 9.5px;
            }
            .footer {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #64748b;
              border-top: 1px solid #e2e8f0;
              padding-top: 12px;
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
              <div class="report-title">📋 ${reportTitle}</div>
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

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
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

  const handleAIImportSuccess = (extractedData) => {
    if (!extractedData || !extractedData.items) return;
    
    const newMeds = [...medicines];
    const newBatches = typeof window !== 'undefined' ? (JSON.parse(localStorage.getItem('hospital_batches')) || []) : [];
    const newRegisters = [...drugRegister];
    
    const now = new Date().toISOString();
    const today = now.split('T')[0];
    let updatedCount = 0;
    
    extractedData.items.forEach((item, i) => {
      const qty = parseInt(item.qty) || 0;
      if (qty <= 0) return;
      
      const medName = item.medicine;
      const batchNo = item.batch;
      const pPrice = parseFloat(item.rate) || 0;
      const sPrice = parseFloat(item.mrp) || 0;
      const expDate = item.expiry;
      
      // 1. Update Medicine
      let medIndex = newMeds.findIndex(m => m.medicine_name.toLowerCase() === medName.toLowerCase());
      if (medIndex === -1) {
        const medObj = {
          name: `MED-${10000 + newMeds.length}`,
          medicine_name: medName,
          generic_name: medName,
          category: "General",
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
      if (batchNo) {
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
      }
      
      // 3. Log to Drug Register
      newRegisters.unshift({
        name: `GRN-AI-${Date.now()}-${i}`,
        date: today,
        medicine: medName,
        batch: batchNo || "-",
        type: "PURCHASE_IN",
        qty_in: qty,
        qty_out: 0,
        balance: newMeds[medIndex].stock,
        reference: extractedData.invoice_number || "AI Invoice Import",
        supplier: extractedData.supplier || "Imported Supplier",
        user: "Admin",
        pharmacist: typeof pharmacistName !== 'undefined' ? pharmacistName : "Admin",
        category: newMeds[medIndex].category || "General"
      });
      
      updatedCount++;
    });
    
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
      loadAllData();
    }
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
        financeEntries.unshift({
          id: `tx-grn-${now}`,
          title: `Medicine Purchase — GRN for PO ${selectedPO.name}`,
          type: "Expense",
          category: "Pharmacy Procurement",
          amount: totalPurchaseAmt,
          method: "Credit",
          date: new Date().toISOString().split("T")[0],
          notes: `Supplier: ${selectedPO.supplier} | Items: ${grnItems.map(i => `${i.medicine} (×${i.quantity})`).join(", ")}`
        });
        localStorage.setItem("hospital_custom_finance", JSON.stringify(financeEntries));

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
  const generatePDFInvoice = (invNo, pName, pMobile, docName, items, totalVal, paymentMethod = "Card") => {
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
    items.forEach(item => {
      const medName = item.medicine_name;
      const totalQty = item.requested_qty;
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
        const medsLocal = JSON.parse(localStorage.getItem('hospital_medicines')) || INITIAL_MOCK_MEDICINES;
        price = medsLocal[medName]?.selling_price || 0;
        
        if (isPartial) {
          const dispensedQty = item.dispensed_qty;
          qtyStr = `${dispensedQty} / ${totalQty}`;
          lineTotal = dispensedQty * price;
        } else {
          lineTotal = totalQty * price;
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
    doc.text(`INR ${totalVal.toFixed(2)}`, 135, posY, { align: "right" });
    posY += 10;

    // Bottom Stamp
    doc.setDrawColor(16, 185, 129); // emerald-500
    doc.setLineWidth(0.5);
    doc.rect(50, posY, 48, 10);
    doc.setTextColor(16, 185, 129);
    doc.setFontSize(9);
    doc.text("PAID & DISPENSED", 74, posY + 6, { align: "center" });

    // Output PDF to iframe print dialog
    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  };

  // PDF Generation - GRN / Purchase Bill
  const downloadGRNInvoice = (po) => {
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

  const handleConfirmAndDownloadBulkPOs = () => {
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

    newPOs.forEach((po, idx) => {
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
    setShowBulkPOModal(false);
  };

  const handleDownloadExpiringReport = () => {
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
    setShowExpiringReportModal(false);
  };

  // PDF Export for Government Compliance Registers
  const exportRegisterPDF = () => {
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

      {/* Main Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Pill className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-serif">Pharmacy Compliance & Inventory</h2>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Drugs & Cosmetics Act Compliance (FEFO Batches, Schedule Registers, Automated Logistics replenishment)
          </p>
        </div>
        {user && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-right shadow-xs shrink-0">
            <div className="text-xs font-bold text-emerald-950">{user.name || user.full_name}</div>
            <div className="text-[10px] font-semibold text-emerald-700 font-mono">User ID: {user.userId || user.id || 'PHARM-001'} • Role: {user.role || 'Pharmacist'}</div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <Button 
              onClick={() => {
                if (userRole === "Pharmacist") {
                  showToast("Access Denied: Pharmacists cannot create new medication catalog records.", "error");
                } else {
                  setIsAddModalOpen(true);
                }
              }}
              size="sm" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 font-medium shadow-xs h-8 text-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Medicine
            </Button>

            <Button 
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
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 font-medium shadow-xs h-8 text-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> + Direct Medicine Sale
            </Button>

            {/* Removed Sync Frappe Bench Button */}

            
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-serif text-base">New Medicine Catalog Record & Initial Batch</DialogTitle>
                <DialogDescription className="text-xs">
                  Every medicine must be added with a mandatory Batch Number and Pack Size. Total units are calculated automatically.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddNewMedicine} className="space-y-4 pt-2">
                {/* Medicine Basic Details */}
                <div className="space-y-1">
                  <Label htmlFor="med-name" className="text-xs font-semibold">Medicine Name *</Label>
                  <Input 
                    id="med-name" placeholder="e.g. Paracetamol 650mg" 
                    value={newMedData.medicine_name || ""} 
                    onChange={(e) => setNewMedData(p => ({ ...p, medicine_name: e.target.value }))}
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="med-generic" className="text-xs font-semibold">Generic Formula *</Label>
                    <Input 
                      id="med-generic" placeholder="e.g. Paracetamol" 
                      value={newMedData.generic_name || ""} 
                      onChange={(e) => setNewMedData(p => ({ ...p, generic_name: e.target.value }))}
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="med-brand" className="text-xs font-semibold">Brand / Trade Name</Label>
                    <Input 
                      id="med-brand" placeholder="e.g. Calpol 650" 
                      value={newMedData.brand || ""} 
                      onChange={(e) => setNewMedData(p => ({ ...p, brand: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="med-cat" className="text-xs font-semibold">Drug Schedule / Category *</Label>
                    <select
                      id="med-cat"
                      value={newMedData.category || "Regular Medicine"}
                      onChange={(e) => setNewMedData(p => ({ ...p, category: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
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
                  <div className="space-y-1">
                    <Label htmlFor="med-form" className="text-xs font-semibold">Dosage Form</Label>
                    <select
                      id="med-form"
                      value={newMedData.dosage_form || "Tablet"}
                      onChange={(e) => setNewMedData(p => ({ ...p, dosage_form: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs focus:outline-none"
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
                </div>

                {/* Batch Information Section */}
                <div className="border border-indigo-200 bg-indigo-50/40 p-3 rounded-lg space-y-3">
                  <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center justify-between border-b border-indigo-100 pb-1.5">
                    <span>Initial Inventory Batch Details</span>
                    <span className="text-[10px] text-indigo-600 font-normal">* Batch Number Mandatory</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="batch-no" className="text-xs font-bold text-rose-700">Batch Number *</Label>
                      <Input 
                        id="batch-no" placeholder="e.g. PCM-2026-A" 
                        value={newMedData.batch_number || ""} 
                        onChange={(e) => setNewMedData(p => ({ ...p, batch_number: e.target.value }))}
                        className="font-mono uppercase bg-white border-rose-300 focus:border-rose-500"
                        required 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="batch-supplier" className="text-xs font-semibold">Supplier *</Label>
                      <select
                        id="batch-supplier"
                        value={newMedData.supplier || "ABC Pharma"}
                        onChange={(e) => setNewMedData(p => ({ ...p, supplier: e.target.value }))}
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
                      <Label htmlFor="med-mfg" className="text-xs font-semibold">MFG Date</Label>
                      <Input 
                        id="med-mfg" type="date"
                        value={newMedData.mfg_date || ""} 
                        onChange={(e) => setNewMedData(p => ({ ...p, mfg_date: e.target.value }))}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="med-exp" className="text-xs font-bold text-rose-700">EXP Date *</Label>
                      <Input 
                        id="med-exp" type="date"
                        value={newMedData.expiry_date || ""} 
                        onChange={(e) => setNewMedData(p => ({ ...p, expiry_date: e.target.value }))}
                        className="bg-white border-rose-300"
                        required
                      />
                    </div>
                  </div>

                  {/* Pack Size & Automatic Total Quantity Calculation */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="pack-size" className="text-xs font-semibold">Pack Size (Units/Pack) *</Label>
                      <Input 
                        id="pack-size" type="number" min="1" placeholder="e.g. 30"
                        value={newMedData.pack_size ?? 30} 
                        onChange={(e) => setNewMedData(p => ({ ...p, pack_size: parseInt(e.target.value) || 0 }))}
                        className="bg-white font-mono"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="no-packs" className="text-xs font-semibold">No. of Packs *</Label>
                      <Input 
                        id="no-packs" type="number" min="0" step="0.5" placeholder="e.g. 10"
                        value={newMedData.no_of_packs ?? 10} 
                        onChange={(e) => setNewMedData(p => ({ ...p, no_of_packs: parseFloat(e.target.value) || 0 }))}
                        className="bg-white font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Read-Only Automatic Total Units Banner */}
                  <div className="bg-indigo-600 text-white rounded-md p-2.5 flex items-center justify-between text-xs shadow-xs">
                    <div>
                      <span className="opacity-80 block text-[10px] uppercase tracking-wider font-semibold">Automatic Total Stock Calculation</span>
                      <span className="font-medium">
                        Pack Size: <strong>{newMedData.pack_size || 0}</strong> tablets &nbsp;×&nbsp; No. of Packs: <strong>{newMedData.no_of_packs || 0}</strong>
                      </span>
                    </div>
                    <div className="text-right pl-3 border-l border-indigo-400">
                      <span className="text-[10px] opacity-80 block uppercase tracking-wider font-semibold">Total Units</span>
                      <span className="text-base font-black font-mono">
                        {(parseInt(newMedData.pack_size) || 0) * (parseFloat(newMedData.no_of_packs) || 0)} units
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pricing & Location */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="med-pur" className="text-xs font-semibold">Purchase Price (₹) *</Label>
                    <Input 
                      id="med-pur" type="number" placeholder="₹" min="0" step="0.01"
                      value={newMedData.purchase_price || ""} 
                      onChange={(e) => setNewMedData(p => ({ ...p, purchase_price: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="med-mrp" className="text-xs font-semibold">MRP (₹) *</Label>
                    <Input 
                      id="med-mrp" type="number" placeholder="₹" min="0" step="0.01"
                      value={newMedData.mrp || newMedData.selling_price || ""} 
                      onChange={(e) => setNewMedData(p => ({ ...p, mrp: e.target.value, selling_price: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="med-rack" className="text-xs font-semibold">Rack Location</Label>
                    <Input 
                      id="med-rack" placeholder="e.g. Rack A-01" 
                      value={newMedData.rack_location || ""} 
                      onChange={(e) => setNewMedData(p => ({ ...p, rack_location: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="med-min" className="text-xs font-semibold">Min Stock</Label>
                    <Input 
                      id="med-min" type="number" 
                      value={newMedData.min_stock || ""} 
                      onChange={(e) => setNewMedData(p => ({ ...p, min_stock: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="med-max" className="text-xs font-semibold">Max Stock</Label>
                    <Input 
                      id="med-max" type="number" 
                      value={newMedData.max_stock || ""} 
                      onChange={(e) => setNewMedData(p => ({ ...p, max_stock: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="med-reorder" className="text-xs font-semibold">Reorder Level</Label>
                    <Input 
                      id="med-reorder" type="number" 
                      value={newMedData.reorder_level || ""} 
                      onChange={(e) => setNewMedData(p => ({ ...p, reorder_level: e.target.value }))}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 text-xs shadow-md">
                  Save Medicine &amp; Register Batch
                </Button>
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
                      <Label htmlFor="add-batch-mfg" className="text-xs font-semibold">MFG Date</Label>
                      <Input 
                        id="add-batch-mfg" type="date"
                        value={newBatchData.mfg_date || ""} 
                        onChange={(e) => setNewBatchData(p => ({ ...p, mfg_date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="add-batch-exp" className="text-xs font-bold text-rose-700">EXP Date *</Label>
                      <Input 
                        id="add-batch-exp" type="date"
                        value={newBatchData.exp_date || ""} 
                        onChange={(e) => setNewBatchData(p => ({ ...p, exp_date: e.target.value }))}
                        className="border-rose-300"
                        required
                      />
                    </div>
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
        </div>
      </div>

      {/* Tabs navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-0.5 border border-slate-200/60 rounded-lg flex items-center justify-start max-w-fit overflow-x-auto gap-1">
          <TabsTrigger value="dashboard" className="px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-md">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="inventory" className="px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-md">
            Inventory Table
          </TabsTrigger>
          <TabsTrigger value="dispensing" className="px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-md">
            Prescriptions Queue
          </TabsTrigger>
          <TabsTrigger value="registers" className="px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-md">
            Compliance Records
          </TabsTrigger>
          <TabsTrigger value="logistics" className="px-3.5 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:shadow-xs rounded-md">
            Purchase & Receiving
          </TabsTrigger>
        </TabsList>

        {/* ========================================================
            TAB: DASHBOARD
            ======================================================== */}
                <TabsContent value="dashboard" className="space-y-6 focus-visible:outline-none">
          
          {/* Top Tier: KPI Hero Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Card onClick={() => { setStatusFilter("All"); setCategoryFilter("All"); setSearchQuery(""); setActiveTab("inventory"); }} className="cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all duration-300 shadow-sm border-slate-200/80 bg-linear-to-br from-white to-indigo-50/30 overflow-hidden relative group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/10 rounded-full group-hover:scale-110 transition-transform duration-500" />
              <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory Valuation</span>
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><DollarSign className="w-5 h-5" /></div>
              </CardHeader>
              <CardContent className="p-5 pt-0 relative z-10">
                <div className="text-3xl font-black text-slate-800 tracking-tight">₹{metrics.inventoryValuation.toLocaleString("en-IN")}</div>
                <div className="text-xs text-slate-500 mt-1.5 flex items-center"><Activity className="w-3.5 h-3.5 mr-1 text-emerald-500"/> Healthy at cost</div>
              </CardContent>
            </Card>

            <Card onClick={() => setActiveTab("registers")} className="cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all duration-300 shadow-sm border-slate-200/80 bg-linear-to-br from-white to-emerald-50/30 overflow-hidden relative group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full group-hover:scale-110 transition-transform duration-500" />
              <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Dispensed</span>
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><CheckCircle className="w-5 h-5" /></div>
              </CardHeader>
              <CardContent className="p-5 pt-0 relative z-10">
                <div className="text-3xl font-black text-slate-800 tracking-tight">{metrics.todayDispensing}</div>
                <div className="text-xs text-slate-500 mt-1.5 flex items-center">Units logged today</div>
              </CardContent>
            </Card>

            <Card onClick={() => { setQueueFilterTab("Waiting"); setActiveTab("dispensing"); }} className="cursor-pointer hover:shadow-md hover:border-sky-200 transition-all duration-300 shadow-sm border-slate-200/80 bg-linear-to-br from-white to-sky-50/30 overflow-hidden relative group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-sky-500/10 rounded-full group-hover:scale-110 transition-transform duration-500" />
              <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Prescriptions</span>
                <div className="p-2 bg-sky-100 rounded-lg text-sky-600"><ClipboardList className="w-5 h-5" /></div>
              </CardHeader>
              <CardContent className="p-5 pt-0 relative z-10">
                <div className="text-3xl font-black text-slate-800 tracking-tight">{metrics.pendingPrescriptions}</div>
                <div className="text-xs text-slate-500 mt-1.5 flex items-center">Patients waiting in queue</div>
              </CardContent>
            </Card>

            <Card onClick={() => { setStatusFilter("Out Of Stock"); setActiveTab("inventory"); }} className="cursor-pointer hover:shadow-md hover:border-rose-200 transition-all duration-300 shadow-sm border-slate-200/80 bg-linear-to-br from-white to-rose-50/30 overflow-hidden relative group">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-rose-500/10 rounded-full group-hover:scale-110 transition-transform duration-500" />
              <CardHeader className="p-5 pb-2 flex flex-row items-center justify-between space-y-0 relative z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Out Of Stock</span>
                <div className="p-2 bg-rose-100 rounded-lg text-rose-600"><AlertCircle className="w-5 h-5" /></div>
              </CardHeader>
              <CardContent className="p-5 pt-0 relative z-10">
                <div className="text-3xl font-black text-slate-800 tracking-tight">{metrics.outOfStock}</div>
                <div className="text-xs text-rose-600 font-medium mt-1.5 flex items-center">{metrics.lowStock} additional low stock</div>
              </CardContent>
            </Card>
          </div>

          {/* Middle & Bottom Tiers: Charts and Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart: Dispensing Trend */}
            <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200 bg-white">
              <CardHeader className="p-5 border-b border-slate-100 pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  Dispensing Volume (Last 7 Days)
                </CardTitle>
                <CardDescription className="text-xs">Daily units dispensed from inventory</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-6 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.dispensingTrendData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                      labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="amount" name="Units" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Chart: Inventory Categories */}
            <Card className="col-span-1 shadow-sm border-slate-200 bg-white">
              <CardHeader className="p-5 border-b border-slate-100 pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                  <PieChart className="w-4 h-4 text-emerald-500" />
                  Inventory by Category
                </CardTitle>
                <CardDescription className="text-xs">Distribution of active catalog items</CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-4 h-72 flex flex-col justify-center">
                {metrics.categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.categoryData}
                        cx="50%"
                        cy="45%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {metrics.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-slate-400">No inventory data</div>
                )}
                <div className="flex flex-wrap justify-center gap-3 mt-auto">
                  {metrics.categoryData.slice(0,4).map((c, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-600 font-medium">
                      <span className="w-2 h-2 rounded-full" style={{backgroundColor: c.fill}}></span>
                      {c.name}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actionable List: Critical Alerts */}
            <Card className="col-span-1 lg:col-span-2 shadow-sm border-slate-200 bg-white">
              <CardHeader className="p-5 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-rose-600">
                    <ShieldAlert className="w-4 h-4" />
                    Critical Alerts
                  </CardTitle>
                  <CardDescription className="text-xs">Items requiring immediate attention</CardDescription>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setActiveTab("inventory")} className="text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">View All</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                  {metrics.activeMeds.filter(m => m.stock <= m.min_stock).slice(0, 5).map((med, i) => (
                    <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${med.stock === 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{med.medicine_name}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{med.category} • Reorder: {med.reorder_level}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold ${med.stock === 0 ? 'text-rose-600' : 'text-amber-600'}`}>{med.stock} in stock</p>
                        <Button size="sm" variant="link" className="text-[10px] h-auto p-0 mt-0.5 text-indigo-600" onClick={() => setShowBulkPOModal(true)}>Order Now</Button>
                      </div>
                    </div>
                  ))}
                  {metrics.activeMeds.filter(m => m.stock <= m.min_stock).length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-400 flex flex-col items-center">
                      <CheckCircle className="w-8 h-8 text-emerald-400 mb-2 opacity-50" />
                      No critical alerts. All stocks healthy!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Secondary Metrics Sidebar */}
            <Card className="col-span-1 shadow-sm border-slate-200 bg-white flex flex-col">
              <CardHeader className="p-5 border-b border-slate-100 pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                  <Layers className="w-4 h-4 text-sky-500" />
                  Secondary Operations
                </CardTitle>
                <CardDescription className="text-xs">Other key metrics today</CardDescription>
              </CardHeader>
              <CardContent className="p-5 flex-1 flex flex-col justify-center gap-4">
                
                <div onClick={() => setActiveTab("logistics")} className="group cursor-pointer p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-xs transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-200/50 rounded-lg text-slate-600 group-hover:bg-slate-100 group-hover:text-slate-900 transition-colors"><Truck className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending POs</p>
                      <p className="text-xs text-slate-400 mt-0.5">Open orders active</p>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-slate-800">{metrics.pendingPOs}</div>
                </div>

                <div onClick={() => setActiveTab("registers")} className="group cursor-pointer p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-purple-200 hover:shadow-xs transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100/50 rounded-lg text-purple-500 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors"><ShoppingBag className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-purple-600/70 uppercase tracking-wider">Outside Pur.</p>
                      <p className="text-xs text-slate-400 mt-0.5">Sourced outside today</p>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-slate-800">{metrics.outsidePurchases}</div>
                </div>

                <div onClick={() => setActiveTab("dispensing")} className="group cursor-pointer p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-sky-200 hover:shadow-xs transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100/50 rounded-lg text-sky-500 group-hover:bg-sky-100 group-hover:text-sky-600 transition-colors"><ClipboardList className="w-4 h-4" /></div>
                    <div>
                      <p className="text-[10px] font-bold text-sky-600/70 uppercase tracking-wider">Partial Fulfills</p>
                      <p className="text-xs text-slate-400 mt-0.5">Active balance orders</p>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-slate-800">{metrics.partialDispenses}</div>
                </div>

              </CardContent>
            </Card>

          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 focus-visible:outline-none">
            {/* Purchase Suggestions */}
            <Card className="lg:col-span-3 shadow-xs border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-200/60 py-3 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-sm font-serif flex items-center gap-1.5">
                      <ShoppingCart className="w-4 h-4 text-indigo-600" />
                      Purchase Suggestions
                    </CardTitle>
                    <CardDescription className="text-[10px]">Medicines that require replenishment based on current stock, reorder level, and maximum stock.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {purchaseRecommendations.length > 0 && (
                      <>
                        <Button onClick={handleBulkGeneratePOs} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 h-8 shadow-sm">
                          Generate Purchase Orders
                        </Button>
                        <Button onClick={downloadReorderReport} size="sm" variant="outline" className="h-8 text-xs border-slate-200 text-slate-700 bg-white">
                          <Download className="w-3.5 h-3.5 mr-1" /> Download
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                    <Input
                      placeholder="Search suggestions..."
                      value={suggSearchQuery}
                      onChange={(e) => setSuggSearchQuery(e.target.value)}
                      className="w-48 h-7 pl-6 text-[10px] border-slate-200"
                    />
                  </div>
                  
                  <select
                    value={suggFilterCategory}
                    onChange={(e) => setSuggFilterCategory(e.target.value)}
                    className="h-7 rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] focus:outline-none"
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
                    className="h-7 rounded border border-slate-200 bg-white px-2 py-0.5 text-[10px] focus:outline-none"
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
                      <div className="text-xs mt-1">No medicines currently require replenishment.</div>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="border-b bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider">
                          <th className="px-4 py-2.5">Medicine</th>
                          <th className="px-4 py-2.5 text-center">Current Stock</th>
                          <th className="px-4 py-2.5 text-center">Reorder Level</th>
                          <th className="px-4 py-2.5 text-center">Suggested Qty</th>
                          <th className="px-4 py-2.5">Preferred Supplier</th>
                          <th className="px-4 py-2.5 text-right">Est. Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {purchaseRecommendations.map(rec => {
                          const isOut = rec.current_stock === 0;
                          const isLow = rec.current_stock < rec.min_stock && !isOut;
                          let stockColor = "text-emerald-600 font-medium";
                          let stockBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                          if (isOut) { stockColor = "text-rose-600 font-bold"; stockBadgeColor = "bg-rose-50 text-rose-700 border-rose-200"; }
                          else if (isLow) { stockColor = "text-orange-600 font-bold"; stockBadgeColor = "bg-orange-50 text-orange-700 border-orange-200"; }
                          else if (rec.current_stock <= rec.reorder_level) { stockColor = "text-amber-600 font-medium"; stockBadgeColor = "bg-amber-50 text-amber-700 border-amber-200"; }

                          return (
                            <tr key={rec.medicine} className="hover:bg-slate-50/50 group transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-bold text-slate-900">{rec.medicine}</div>
                                <div className="text-[9px] text-slate-400 mt-0.5">{rec.generic}</div>
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
                                  className="w-16 h-7 mx-auto text-center font-mono font-bold text-indigo-600 border-indigo-200 focus:border-indigo-500 text-xs px-1"
                                  value={rec.suggested}
                                  onChange={(e) => {
                                    const newQty = parseInt(e.target.value) || 0;
                                    setEditedSuggQty(prev => ({ ...prev, [rec.medicine]: newQty }));
                                  }}
                                />
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-700">{rec.supplier}</td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">₹{(rec.suggested * rec.price).toLocaleString("en-IN")}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

          <Card className="shadow-xs border-slate-200">
            <CardHeader className="bg-slate-50 border-b border-slate-200/60 p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-serif text-slate-800">Inventory Control Panel</CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-1">Monitor medicine master records, batches, rack placements, and statutory levels.</CardDescription>
                </div>
                
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
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs focus:outline-none shadow-sm flex-1 sm:flex-none sm:w-[150px]"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Reorder Required">Reorder Required</option>
                    <option value="Out Of Stock">Out Of Stock</option>
                    <option value="Controlled">Controlled Drugs</option>
                    <option value="Expiring / Expired">Expiring / Expired</option>
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
                  <Printer className="w-4 h-4" /> 🖨 {
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

                {(searchQuery || categoryFilter !== "All" || statusFilter !== "All") && (
                  <Button
                    onClick={() => { setSearchQuery(""); setCategoryFilter("All"); setStatusFilter("All"); }}
                    variant="ghost" size="sm" className="h-9 px-3 text-xs text-slate-500 hover:text-slate-900 w-full sm:w-auto"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
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
                              ) : (
                                <span className="text-slate-400 italic">No Batch</span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-center font-mono text-slate-600">
                              {primaryBatch ? `${primaryBatch.pack_size || 30} tabs/pack` : "30 tabs/pack"}
                            </td>
                            <td className="px-3 py-3 text-center font-mono font-black text-slate-900 text-sm">
                              {med.stock}
                            </td>
                            <td className="px-3 py-3 text-center font-mono text-[11px] text-slate-600">
                              {primaryBatch && primaryBatch.exp_date ? primaryBatch.exp_date : (med.expiry_date || "N/A")}
                            </td>
                            <td className="px-3 py-3 text-slate-600 font-mono text-[11px]">
                              {primaryBatch ? (primaryBatch.rack_location || med.rack_location || "N/A") : (med.rack_location || "N/A")}
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
        <TabsContent value="dispensing" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Queue List */}
            <Card className="lg:col-span-5 shadow-xs border-slate-200 bg-white">
              <CardHeader className="bg-slate-50 border-b border-slate-200/60 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-serif">Prescription Fulfill Queue</CardTitle>
                  <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                    {filteredQueue.length} Patients
                  </span>
                </div>
                <CardDescription className="text-[10px]">Consultation profiles ready for pharmacy checkout.</CardDescription>
                
                {/* Search Bar */}
                <div className="relative mt-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <Input
                    placeholder="Search name, UHID, mobile, Rx No..."
                    value={queueSearchQuery}
                    onChange={(e) => setQueueSearchQuery(e.target.value)}
                    className="w-full h-8 pl-8 text-[11px] border-slate-200"
                  />
                </div>

                {/* Sub-tabs/Filters */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {["All", "Waiting", "Completed"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setQueueFilterTab(tab)}
                      className={`px-2 py-1 rounded text-[9px] font-semibold border transition ${queueFilterTab === tab ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                {filteredQueue.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No patients match the selected filters.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 text-xs">
                    {filteredQueue.map((item, idx) => {
                      const isWalkInControlled = item.prescription.toLowerCase().includes("alprazolam") || item.prescription.toLowerCase().includes("fentanyl") || item.prescription.toLowerCase().includes("zolpidem");
                      return (
                        <div 
                          key={`${item.name}-${idx}`} 
                          onClick={() => handleSelectQueueItem(item)}
                          className={`p-4 hover:bg-slate-50/50 cursor-pointer transition ${selectedWalkIn?.name === item.name ? "bg-indigo-50/30 border-l-4 border-indigo-600" : ""} ${isWalkInControlled ? "bg-purple-50/5 border-l-4 border-purple-500" : ""}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-1">
                              <span className="font-semibold text-slate-900">{item.patient_name}</span>
                              {isWalkInControlled && <span className="bg-purple-100 text-purple-800 text-[8px] font-bold px-1 rounded">Narcotic Rx</span>}
                            </div>
                            <span className="text-[9px] font-mono text-slate-400">{item.name}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                            <span>Doctor: {item.doctor}</span>
                            <span>Mob: {item.mobile_number}</span>
                          </div>
                          <div className="bg-slate-50/80 rounded p-2 mt-2 text-[10px] text-slate-600 font-mono line-clamp-2">
                            {item.prescription}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dispensing Detail Panel */}
            <Card className="lg:col-span-7 shadow-xs border-slate-200 flex flex-col justify-between bg-white">
              <CardHeader className="bg-slate-50 border-b border-slate-200/60 py-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-serif">Dispensation Workdesk</CardTitle>
                  <CardDescription className="text-[10px]">Manage compliance checks and execute FEFO stock deduction</CardDescription>
                </div>
                {selectedWalkIn && (
                  <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                    Active: {selectedWalkIn.patient_name}
                  </div>
                )}
              </CardHeader>
              
              <CardContent className="pt-4 flex-1">
                {selectedWalkIn ? (
                  <div className="space-y-4">
                    
                    {/* Doctor Prescription Text */}
                    <div className="bg-slate-50 border border-slate-200/50 rounded-lg p-3">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doctor Consultation Note</div>
                      <div className="text-xs font-semibold text-slate-800 mt-1 font-mono whitespace-pre-line">
                        {selectedWalkIn.prescription || "No prescription notes logged."}
                      </div>
                    </div>

                    {/* Fulfill Items Grid */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classified Items to Dispense</div>
                      
                      <div className="border border-slate-100 rounded-lg overflow-hidden text-xs">
                        <div className="divide-y divide-slate-100 bg-white">
                          {dispenseItems.map((item, index) => {
                            const hasControlled = item.category === "Controlled Drug";
                            const hasSleeping = item.category === "Sleeping Pill";
                            
                            const isOutside = item.source === "Outside Purchase" || item.dispense_status === "Outside Purchase";
                            const isPartial = item.dispense_status === "Partially Dispensed";

                            const currentCost = isPartial ? (item.dispensed_qty * item.price) : (item.qty * item.price);

                            return (
                              <div key={item.medicine_name} className="p-3 border-b items-center hover:bg-slate-50/20 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="font-semibold text-slate-900 flex flex-col">
                                    <span className="flex items-center gap-1.5 flex-wrap">
                                      {item.medicine_name}
                                      {hasControlled && <span className="bg-purple-100 text-purple-800 text-[8px] font-extrabold px-1 py-0.25 rounded">CONTROLLED</span>}
                                      {hasSleeping && <span className="bg-indigo-100 text-indigo-800 text-[8px] font-extrabold px-1 py-0.25 rounded">SLEEPING PILL</span>}
                                      {item.dispense_status === "Partially Dispensed" && <span className="bg-amber-100 text-amber-800 text-[8px] font-extrabold px-1 py-0.25 rounded">PARTIAL</span>}
                                      {item.dispense_status === "Dispensed" && <span className="bg-emerald-100 text-emerald-800 text-[8px] font-extrabold px-1 py-0.25 rounded">DISPENSED</span>}
                                      {item.dispense_status === "Out of Stock" && <span className="bg-rose-100 text-rose-800 text-[8px] font-extrabold px-1 py-0.25 rounded">OUT OF STOCK</span>}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-normal mt-1 flex items-center gap-1">
                                      {item.category} • Prescribed: {item.prescribed_qty} • Dispensing: {isPartial ? item.dispensed_qty : item.qty}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <div className="text-[9px] text-slate-400">Stock Available</div>
                                      <div className={`font-semibold font-mono ${item.stock > 0 ? "text-slate-600" : "text-rose-600"}`}>{item.stock}</div>
                                    </div>
                                    
                                    <div className="text-right">
                                      <div className="text-[9px] text-slate-400">Total</div>
                                      <div className="font-bold font-mono text-slate-800">
                                        ₹{currentCost.toFixed(2)}
                                      </div>
                                    </div>
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition">
                                          <MoreHorizontal className="w-4 h-4" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48 text-xs">
                                        <DropdownMenuLabel className="text-[10px] text-slate-400">Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => { setWorkdeskEditIndex(index); setWorkdeskEditQty(item.qty); setShowWorkdeskEditModal(true); }}>
                                          <Edit3 className="w-3.5 h-3.5 mr-2 text-slate-500" /> Edit Quantity
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => { setWorkdeskPartialIndex(index); setWorkdeskPartialQty(item.dispensed_qty); setShowWorkdeskPartialModal(true); }}>
                                          <Layers className="w-3.5 h-3.5 mr-2 text-slate-500" /> Partial Dispense
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleMarkNotAvailable(index)}>
                                          <AlertCircle className="w-3.5 h-3.5 mr-2 text-slate-500" /> Mark Not Available
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => { setWorkdeskDeleteIndex(index); setShowWorkdeskDeleteModal(true); }} className="text-rose-600 focus:text-rose-700">
                                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Medicine
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Add Custom Medicine input */}
                    <div className="flex items-end gap-2 border-t pt-4">
                      <div className="flex-1 space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Add Item (OTC/Unmatched)</Label>
                        <Input
                          list="workdesk-medicine-catalog"
                          placeholder="Search name, generic, barcode, QR..."
                          value={customAddMedName}
                          onChange={(e) => setCustomAddMedName(e.target.value)}
                          className="h-8 text-xs border-slate-200 w-full"
                        />
                        <datalist id="workdesk-medicine-catalog">
                          {medicines.filter(m => !m.disabled).map(m => (
                            <option key={m.medicine_name} value={m.medicine_name}>
                              {m.generic_name ? `[${m.generic_name}] ` : ""}{m.barcode ? `(BC: ${m.barcode}) ` : ""}{m.qrcode ? `(QR: ${m.qrcode}) ` : ""}Stock: {m.stock}
                            </option>
                          ))}
                        </datalist>
                      </div>
                      <div className="w-20 space-y-1">
                        <Label className="text-[10px] font-bold text-slate-400">Qty</Label>
                        <Input 
                          type="number" value={customAddQty} 
                          onChange={(e) => setCustomAddQty(e.target.value)}
                          className="h-8 text-xs border-slate-200"
                        />
                      </div>
                      <Button onClick={handleAddCustomDispenseMed} variant="outline" size="sm" className="h-8 text-xs border-slate-200 hover:bg-slate-50">
                        Add
                      </Button>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-52 text-slate-400 gap-2">
                    <ClipboardList className="w-10 h-10 text-slate-300" />
                    <span className="text-xs">Select a patient walk-in from the queue to start dispensation.</span>
                  </div>
                )}
              </CardContent>

              {selectedWalkIn && (
                <div className="border-t p-4 bg-slate-50 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-400">Dispensing Pharmacist *</Label>
                      <Input 
                        value={pharmacistName} 
                        onChange={(e) => setPharmacistName(e.target.value)}
                        className="h-8 text-xs w-44 border-slate-200 bg-white" 
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-slate-400">Payment Method</Label>
                      <select
                        value={otcPaymentMethod}
                        onChange={(e) => setOtcPaymentMethod(e.target.value)}
                        className="h-8 text-xs w-36 rounded-md border border-slate-200 bg-white px-2 focus:outline-none font-semibold text-slate-700"
                      >
                        <option value="Cash">Cash</option>
                        <option value="UPI">UPI</option>
                        <option value="Card">Card</option>
                        <option value="Insurance">Insurance</option>
                        <option value="Credit">Credit</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between border-t pt-3 mt-1">
                    <div className="text-left">
                      <div className="text-[9px] font-bold text-slate-400">GRAND TOTAL (INCL. GST)</div>
                      <div className="text-lg font-bold text-slate-900 font-mono">
                        ₹{dispenseItems.reduce((acc, curr) => {
                          if (curr.source === "Outside Purchase" || curr.dispense_status === "Outside Purchase") return acc;
                          const qty = curr.dispense_status === "Partially Dispensed" ? curr.dispensed_qty : curr.qty;
                          return acc + (qty * curr.price);
                        }, 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={executeOutsidePurchase}
                        variant="outline"
                        className="text-amber-600 border-amber-200 hover:bg-amber-50 font-semibold text-xs h-9 px-4 shadow-sm"
                      >
                        Outside Purchase (No Invoice)
                      </Button>
                      <Button 
                        onClick={executeDispensing}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-9 px-4 shadow-sm"
                      >
                        Dispense & Print Invoice (FEFO)
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card>

          </div>
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
                    <tr className="border-b bg-slate-50/50 text-slate-500 font-bold uppercase tracking-wider">
                      <th className="px-5 py-2.5">Date & Time</th>
                      <th className="px-5 py-2.5">Patient Details</th>
                      <th className="px-5 py-2.5">Prescribed By</th>
                      <th className="px-5 py-2.5">Medicine Name</th>
                      <th className="px-5 py-2.5">Batch</th>
                      <th className="px-5 py-2.5 text-center">Qty</th>
                      <th className="px-5 py-2.5">Invoice ID</th>
                      <th className="px-5 py-2.5">Pharmacist</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {activeRegisterLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-5 py-8 text-center text-slate-400">
                          No transactions recorded in the {selectedRegister} Register yet.
                        </td>
                      </tr>
                    ) : (
                      activeRegisterLogs.map((log, index) => {
                        const date = new Date(log.dispensing_date).toLocaleString("en-IN", {
                          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                        });
                        return (
                          <tr key={index} className="hover:bg-slate-50/20">
                            <td className="px-5 py-3 font-mono text-slate-600">{date}</td>
                            <td className="px-5 py-3">
                              <div className="font-semibold text-slate-800">{log.patient_name}</div>
                              <div className="text-[10px] text-slate-500">Mob: {log.patient_id}</div>
                            </td>
                            <td className="px-5 py-3 font-medium text-slate-700">{log.doctor}</td>
                            <td className="px-5 py-3 font-semibold text-slate-800">{log.medicine}</td>
                            <td className="px-5 py-3 font-mono text-slate-500">{log.batch_number}</td>
                            <td className="px-5 py-3 text-center font-mono font-bold text-slate-800">{log.quantity}</td>
                            <td className="px-5 py-3 font-mono text-indigo-600">{log.invoice_number}</td>
                            <td className="px-5 py-3 text-slate-600 font-medium">{(log.pharmacist || log.user || "Admin").split(",")[0]}</td>
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
            TAB: LOGISTICS & PROCUREMENT (POs & GRN)
            ======================================================== */}
        <TabsContent value="logistics" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Purchase Orders List */}
            <Card className="lg:col-span-2 shadow-xs border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-200/60 py-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-serif">Purchase Orders (Statutory Replenishment)</CardTitle>
                  <CardDescription className="text-[10px]">Track supply chains from purchase recommendation to goods arrival</CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => setIsAIImportModalOpen(true)}
                    size="xs" 
                    variant="outline" 
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 font-semibold text-[10px] px-2.5 py-1 shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1" /> AI Invoice Import
                  </Button>

                  <AIInvoiceImportModal 
                    isOpen={isAIImportModalOpen} 
                    onOpenChange={setIsAIImportModalOpen} 
                    onImportSuccess={handleAIImportSuccess}
                    showToast={showToast}
                  />

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
                          <th className="p-2">MFG Date</th>
                          <th className="p-2">EXP Date *</th>
                          <th className="p-2 text-center">Qty</th>
                          <th className="p-2 text-right">Price (₹)</th>
                          <th className="p-2 text-right">Rack</th>
                          <th className="p-2 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y bg-white">
                        {grnItems.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-6 text-center text-slate-400 italic">
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
                                type="date" value={item.mfg_date || ""} 
                                onChange={(e) => handleUpdateGRNItem(index, 'mfg_date', e.target.value)}
                                className="h-7 text-[10px] w-28 border-slate-200" 
                              />
                            </td>
                            <td className="p-2">
                              <Input 
                                type="date" value={item.exp_date || ""} 
                                onChange={(e) => handleUpdateGRNItem(index, 'exp_date', e.target.value)}
                                className="h-7 text-[10px] w-28 border-slate-200 border-amber-300 bg-amber-50/20" 
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
                    <div className="grid grid-cols-6 p-2 bg-slate-50 font-bold border-b text-[9px] text-slate-500 uppercase tracking-wider">
                      <div className="col-span-2">Batch Number</div>
                      <div>Expiry Date</div>
                      <div className="text-center">Stock</div>
                      <div>Supplier</div>
                      <div className="text-center">Status</div>
                    </div>
                    {(!selectedMedicine.batches || selectedMedicine.batches.length === 0) ? (
                      <div className="p-4 text-center text-slate-400 text-[10px]">No active batches in inventory. Log Goods Receipt first.</div>
                    ) : (
                      selectedMedicine.batches.map(batch => {
                        const alert = getExpiryAlert(batch.exp_date);
                        return (
                          <div key={batch.batch_number} className="grid grid-cols-6 p-2 border-b items-center text-[10px] font-mono hover:bg-slate-50/20">
                            <div className="col-span-2 font-semibold text-slate-800">{batch.batch_number}</div>
                            <div className="text-slate-600">{new Date(batch.exp_date).toLocaleDateString("en-IN")}</div>
                            <div className="text-center font-bold text-slate-700">{batch.current_stock}</div>
                            <div className="text-slate-500 truncate">{batch.supplier || "N/A"}</div>
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
                    <Label className="font-bold text-slate-500">Age *</Label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={otcCustomerAge}
                      onChange={(e) => setOtcCustomerAge(e.target.value)}
                      className="h-8 text-xs border-slate-200 bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="font-bold text-slate-500">Gender *</Label>
                    <select
                      value={otcCustomerGender}
                      onChange={(e) => setOtcCustomerGender(e.target.value)}
                      className="w-full h-8 rounded border border-slate-200 bg-white px-2 focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="font-bold text-slate-500">Mobile Number (Optional)</Label>
                    <Input
                      placeholder="9876543210"
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
                      <span>✓ Patient Selected: {otcSelectedPatient.patient_name} ({otcSelectedPatient.patient})</span>
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
                          {m.medicine_name} (Stock: {m.stock} • ₹{m.selling_price})
                        </option>
                      ))
                    }
                  </select>
                </div>

                {/* Basket List */}
                <div className="border border-slate-100 rounded-lg overflow-hidden max-h-36 overflow-y-auto">
                  {otcBasket.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-[10px]">Basket is empty. Select medicines above.</div>
                  ) : (
                    <div className="divide-y divide-slate-100 bg-white text-[11px]">
                      {otcBasket.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50/20 font-mono">
                          <span className="font-sans font-semibold text-slate-900 w-1/3 truncate">{item.medicine_name}</span>
                          
                          <div className="flex items-center gap-1.5">
                            <button 
                              type="button" 
                              onClick={() => {
                                setOtcBasket(prev => prev.map((it, i) => i === idx ? { ...it, qty: Math.max(1, it.qty - 1) } : it));
                              }}
                              className="w-4 h-4 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <span className="font-semibold w-6 text-center">{item.qty}</span>
                            <button 
                              type="button" 
                              onClick={() => {
                                setOtcBasket(prev => prev.map((it, i) => i === idx ? { ...it, qty: Math.min(it.stock, it.qty + 1) } : it));
                              }}
                              className="w-4 h-4 rounded border border-slate-200 hover:bg-slate-50 flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>

                          <span className="w-16 text-right">₹{(item.qty * item.price).toFixed(2)}</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              setOtcBasket(prev => prev.filter((_, i) => i !== idx));
                            }} 
                            className="text-slate-400 hover:text-rose-600 px-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
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
                    ₹{otcBasket.reduce((acc, it) => acc + (it.qty * it.price), 0).toFixed(2)}
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

                  // Stock availability check
                  const outOfStockMeds = otcBasket.filter(item => item.qty > item.stock);
                  if (outOfStockMeds.length > 0) {
                    showToast(`Warning: Insufficient stock for ${outOfStockMeds.map(i=>i.medicine_name).join(", ")}`, "error");
                    return;
                  }

                  try {
                    showToast("Processing direct OTC sale stock deduction...", "info");
                    
                    const response = await executeDirectSale(
                      otcCustomerName,
                      otcCustomerMobile || "9999999999",
                      otcCustomerAge || "30",
                      otcCustomerGender || "Female",
                      otcBasket.map(item => ({ medicine_name: item.medicine_name, qty: item.qty })),
                      otcPaymentMethod,
                      pharmacistName
                    );

                    const totalVal = otcBasket.reduce((acc, it) => acc + (it.qty * it.price), 0);

                    showToast(`Direct Sale completed. Invoice ${response.invoiceNumber} generated!`, "success");
                    
                    // Trigger print invoice
                    generatePDFInvoice(response.invoiceNumber, otcCustomerName, otcCustomerMobile || "9999999999", "Self (OTC)", response.dispensedReceipt, totalVal, otcPaymentMethod);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <Edit3 className="w-4 h-4 text-indigo-500" /> Edit Dispense Quantity
              </h3>
              <button onClick={() => setShowWorkdeskEditModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">New Quantity</Label>
                <Input type="number" min="1" value={workdeskEditQty} onChange={(e) => setWorkdeskEditQty(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Reason for Change</Label>
                <Input placeholder="e.g. Doctor updated dose" value={workdeskEditReason} onChange={(e) => setWorkdeskEditReason(e.target.value)} />
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowWorkdeskEditModal(false)}>Cancel</Button>
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={confirmWorkdeskEdit}>Save Changes</Button>
            </div>
          </div>
        </div>
      )}

      {/* Workdesk Partial Dispense Modal */}
      {showWorkdeskPartialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-amber-500" /> Partial Dispense
              </h3>
              <button onClick={() => setShowWorkdeskPartialModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Dispense Quantity Now</Label>
                <Input type="number" min="1" value={workdeskPartialQty} onChange={(e) => setWorkdeskPartialQty(e.target.value)} />
                <p className="text-[10px] text-slate-400">The rest will be marked as pending or outside purchase depending on action.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowWorkdeskPartialModal(false)}>Cancel</Button>
              <Button size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" onClick={confirmWorkdeskPartial}>Confirm Partial</Button>
            </div>
          </div>
        </div>
      )}

      {/* Workdesk Delete Modal */}
      {showWorkdeskDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-rose-50">
              <h3 className="font-semibold text-rose-800 flex items-center gap-2 text-sm">
                <Trash2 className="w-4 h-4 text-rose-600" /> Delete Item
              </h3>
              <button onClick={() => setShowWorkdeskDeleteModal(false)} className="text-rose-400 hover:text-rose-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-slate-600">Are you sure you want to remove this item from the dispensation queue?</p>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Reason for Deletion</Label>
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
              <Button variant="outline" size="sm" onClick={() => setShowWorkdeskDeleteModal(false)}>Cancel</Button>
              <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={confirmWorkdeskDelete}>Delete</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
