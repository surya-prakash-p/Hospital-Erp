"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { 
  Pill, CheckCircle, AlertCircle, Info, Activity, PackageCheck, Plus, Layers, 
  PlusCircle, Printer, ShieldAlert, Search, FileText, Download, 
  Trash2, Eye, ClipboardList, ShoppingCart, DollarSign, Calendar,
  ArrowRight, X, Loader2, ChevronDown, Edit3, Sliders, ShoppingBag, MoreHorizontal, RotateCcw,
  Package, ShieldCheck, Keyboard, Check, TrendingUp, Save, Truck
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
import PharmacyPOSView, { printPharmacyInvoiceReceipt } from "@/components/pharmacy/PharmacyPOSView";
import { ShortcutsGuideModal } from "@/components/shortcuts-guide-modal";

export default function PharmacyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams?.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "dashboard");

  useEffect(() => {
    if (tabParam && ["dashboard", "inventory", "dispensing", "registers", "logistics", "purchase-inward"].includes(tabParam)) {
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

  // Keyboard Shortcuts States & Refs
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showDownloadReportsModal, setShowDownloadReportsModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState("inventory");
  const [reportScheduleCategory, setReportScheduleCategory] = useState("All");
  const [reportExpiringDays, setReportExpiringDays] = useState(90);
  const [selectedInvRowIndex, setSelectedInvRowIndex] = useState(-1);
  const [selectedQueueRowIndex, setSelectedQueueRowIndex] = useState(-1);
  const inventorySearchInputRef = useRef(null);
  const workdeskSearchInputRef = useRef(null);

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
  const [batchMedSearchFilter, setBatchMedSearchFilter] = useState("");
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
  const [poAddPrice, setPoAddPrice] = useState("");

  // Stock Adjustment Modal Search State
  const [adjustMedSearch, setAdjustMedSearch] = useState("");

  // Purchase Inward & Stock Entry (Dedicated View)
  const [inwardItemCode, setInwardItemCode] = useState("");
  const [inwardGenericName, setInwardGenericName] = useState("");
  const [inwardManufacturer, setInwardManufacturer] = useState("");
  const [inwardSupplier, setInwardSupplier] = useState("");
  const [inwardSupplierAddress, setInwardSupplierAddress] = useState("");
  const [inwardSupplierPhone, setInwardSupplierPhone] = useState("");
  const [inwardInvoiceNo, setInwardInvoiceNo] = useState("");
  const [inwardDate, setInwardDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [inwardCategory, setInwardCategory] = useState("Regular");
  const [inwardCategoriesList, setInwardCategoriesList] = useState([
    "Regular",
    "Schedule H",
    "Schedule H1",
    "Schedule X",
    "Sleeping Pills / Sedatives",
    "Narcotics",
    "Antibiotics",
    "Emergency / Critical Care",
    "OTC (Over The Counter)",
    "High Alert / LASA"
  ]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [inwardPurchaseType, setInwardPurchaseType] = useState("Regular Purchase");
  const [inwardPurchaseTypesList, setInwardPurchaseTypesList] = useState([
    "Regular Purchase",
    "Emergency Purchase",
    "Return Inward",
    "Consignment",
    "Direct Local Purchase",
    "Institutional Supply"
  ]);
  const [showAddPurchaseTypeModal, setShowAddPurchaseTypeModal] = useState(false);
  const [newPurchaseTypeName, setNewPurchaseTypeName] = useState("");
  const [inwardBillDiscountPct, setInwardBillDiscountPct] = useState("");
  const [inwardAdditionalCharges, setInwardAdditionalCharges] = useState("");
  const [inwardFreight, setInwardFreight] = useState("");
  const [inwardRoundOff, setInwardRoundOff] = useState("");
  const [inwardPaymentMode, setInwardPaymentMode] = useState("Credit");
  const [inwardDueDays, setInwardDueDays] = useState(30);
  const [inwardReferenceNo, setInwardReferenceNo] = useState("");
  const [inwardItems, setInwardItems] = useState([]);
  const [inwardMedSearch, setInwardMedSearch] = useState("");
  const [inwardShowDropdown, setInwardShowDropdown] = useState(false);
  const [inwardSelectedMed, setInwardSelectedMed] = useState(null);
  const [inwardBatch, setInwardBatch] = useState("");
  const [inwardExp, setInwardExp] = useState("");
  const [inwardQty, setInwardQty] = useState("");
  const [inwardPrice, setInwardPrice] = useState("");
  const [inwardMrp, setInwardMrp] = useState("");
  const [inwardSaleRate, setInwardSaleRate] = useState("");
  const [inwardGstPct, setInwardGstPct] = useState("12");
  const [inwardRack, setInwardRack] = useState("");
  const [inwardHsn, setInwardHsn] = useState("30049099");
  const [inwardDosageForm, setInwardDosageForm] = useState("Tablet");
  const [inwardPurchaseUnit, setInwardPurchaseUnit] = useState("Strip");
  const [inwardUnitsPerPack, setInwardUnitsPerPack] = useState(10);
  const [inwardPackSize, setInwardPackSize] = useState("10 Tablets");
  const [inwardPacksCount, setInwardPacksCount] = useState("");
  const [isSubmittingInward, setIsSubmittingInward] = useState(false);
  const [inwardHighlightedSearchIndex, setInwardHighlightedSearchIndex] = useState(0);
  const [selectedInwardRowIndex, setSelectedInwardRowIndex] = useState(0);
  const [showInwardBrowseMedModal, setShowInwardBrowseMedModal] = useState(false);
  const [inwardBrowseQuery, setInwardBrowseQuery] = useState("");
  const [activeInwardSearchRow, setActiveInwardSearchRow] = useState(null);
  const [inwardRowSearchQuery, setInwardRowSearchQuery] = useState("");
  const [browsingRowIndex, setBrowsingRowIndex] = useState(null);
  const [showSupplierSelectModal, setShowSupplierSelectModal] = useState(false);
  const [supplierSelectSearch, setSupplierSelectSearch] = useState("");
  const inwardSearchInputRef = useRef(null);
  const inwardSearchContainerRef = useRef(null);

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
      const [medsRes, qRes, regRes, posRes, returnsRes] = await Promise.allSettled([
        getMedicines(),
        getQueue(),
        getDrugRegister(),
        getPurchaseOrders(),
        getSalesReturns()
      ]);
      if (medsRes.status === 'fulfilled') setMedicines(medsRes.value || []);
      if (qRes.status === 'fulfilled') setQueue(qRes.value || []);
      if (regRes.status === 'fulfilled') setDrugRegister(regRes.value || []);
      if (posRes.status === 'fulfilled') setPurchaseOrders(posRes.value || []);
      if (returnsRes.status === 'fulfilled') setSalesReturnsList(returnsRes.value || []);

      const anyRejected = [medsRes, qRes, regRes, posRes, returnsRes].some(r => r.status === 'rejected');
      if (anyRejected && medsRes.status === 'rejected') {
        showToast("Error loading medicines catalog", "error");
        console.error("Pharmacy load error:", { medsRes, qRes, regRes, posRes, returnsRes });
      }
    } catch (err) {
      showToast("Error loading pharmacy data", "error");
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

  // Format Expiry as Month and Year only (MM/YYYY)
  const formatExpiry = (val) => {
    if (!val || val === "N/A" || val === "—") return "—";
    const str = String(val).trim();
    if (/^\d{4}-\d{2}$/.test(str)) {
      const [y, m] = str.split("-");
      return `${m}/${y}`;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
      const parts = str.split("T")[0].split("-");
      return `${parts[1]}/${parts[0]}`;
    }
    if (/^\d{2}\/\d{4}$/.test(str)) return str;
    if (/^\d{2}-\d{4}$/.test(str)) return str.replace("-", "/");
    const d = new Date(str.length === 7 ? `${str}-01` : str);
    if (!isNaN(d.getTime())) {
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const y = d.getFullYear();
      return `${m}/${y}`;
    }
    return str;
  };

  // Compute Expiry State badge color and name
  const getExpiryAlert = (expDate) => {
    if (!expDate) return { label: "Stable", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    const today = new Date();
    const parsedStr = String(expDate).length === 7 ? `${expDate}-01` : expDate;
    const exp = new Date(parsedStr);
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


  const poSelectedMed = useMemo(() => {
    return medicines.find(m => m.medicine_name === poAddMedName) || null;
  }, [medicines, poAddMedName]);

  const poPriceDiffInfo = useMemo(() => {
    if (!poSelectedMed) return null;
    const lastPrice = (poSelectedMed.purchase_price !== undefined && poSelectedMed.purchase_price !== null && poSelectedMed.purchase_price !== "")
      ? Number(poSelectedMed.purchase_price)
      : (poSelectedMed.batches?.[0]?.purchase_price ? Number(poSelectedMed.batches[0].purchase_price) : 0);
    const newPrice = poAddPrice !== "" ? (parseFloat(poAddPrice) || 0) : lastPrice;
    const diff = newPrice - lastPrice;
    const pct = lastPrice > 0 ? ((diff / lastPrice) * 100).toFixed(1) : "0";
    return { lastPrice, newPrice, diff, pct };
  }, [poSelectedMed, poAddPrice]);

  const grnSelectedMed = useMemo(() => {
    return medicines.find(m => m.medicine_name === grnAddMedName) || null;
  }, [medicines, grnAddMedName]);

  const grnPriceDiffInfo = useMemo(() => {
    if (!grnSelectedMed) return null;
    const lastPrice = (grnSelectedMed.purchase_price !== undefined && grnSelectedMed.purchase_price !== null && grnSelectedMed.purchase_price !== "")
      ? Number(grnSelectedMed.purchase_price)
      : (grnSelectedMed.batches?.[0]?.purchase_price ? Number(grnSelectedMed.batches[0].purchase_price) : 0);
    const newPrice = grnAddPrice !== "" ? (parseFloat(grnAddPrice) || 0) : lastPrice;
    const diff = newPrice - lastPrice;
    const pct = lastPrice > 0 ? ((diff / lastPrice) * 100).toFixed(1) : "0";
    return { lastPrice, newPrice, diff, pct };
  }, [grnSelectedMed, grnAddPrice]);

  // Open Stock Adjustment Modal (Popup) with preselected or selectable medicine
  const handleOpenAdjustModal = (med = null) => {
    if (userRole === "Store Manager") {
      showToast("Access Denied: Store Managers cannot adjust stock.", "error");
      return;
    }
    if (med) {
      setAdjustingMed(med);
      setAdjustmentData({
        medicine: med.medicine_name,
        batch_number: (med.batches && med.batches.length > 0) ? med.batches[0].batch_number : "",
        adjustment_type: "Add Stock",
        quantity: 10,
        purchase_price: med.purchase_price !== undefined ? String(med.purchase_price) : "",
        reason: "",
        remarks: ""
      });
    } else {
      setAdjustingMed(null);
      setAdjustMedSearch("");
      setAdjustmentData({
        medicine: "",
        batch_number: "",
        adjustment_type: "Add Stock",
        quantity: 10,
        purchase_price: "",
        reason: "",
        remarks: ""
      });
    }
    setShowAdjustModal(true);
  };

  // Purchase Inward & Stock Entry (POS Billing Style)
  const inwardFilteredResults = useMemo(() => {
    if (!inwardMedSearch.trim()) return [];
    const q = inwardMedSearch.trim().toLowerCase();
    return medicines.filter(m => !m.disabled && (
      (m.medicine_name && m.medicine_name.toLowerCase().includes(q)) ||
      (m.generic_name && m.generic_name.toLowerCase().includes(q)) ||
      (m.brand && m.brand.toLowerCase().includes(q)) ||
      (m.barcode && m.barcode.toLowerCase().includes(q)) ||
      (m.batches && m.batches.some(b => (b.batch_number || "").toLowerCase().includes(q)))
    )).slice(0, 10);
  }, [inwardMedSearch, medicines]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inwardSearchContainerRef.current && !inwardSearchContainerRef.current.contains(event.target)) {
        setInwardShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save current Inward Draft to localStorage
  const saveInwardDraft = (silent = false) => {
    if (typeof window === 'undefined') return;
    try {
      const draft = {
        inwardInvoiceNo,
        inwardDate,
        inwardSupplier,
        inwardCategory,
        inwardItems,
        inwardItemCode,
        inwardMedSearch,
        inwardGenericName,
        inwardDosageForm,
        inwardPurchaseUnit,
        inwardUnitsPerPack,
        inwardManufacturer,
        inwardBatch,
        inwardExp,
        inwardPackSize,
        inwardPacksCount,
        inwardQty,
        inwardPrice,
        inwardMrp,
        inwardSaleRate,
        inwardGstPct,
        inwardRack,
        inwardHsn,
        inwardBillDiscountPct,
        inwardAdditionalCharges,
        inwardFreight,
        inwardRoundOff,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('hospital_inward_draft', JSON.stringify(draft));
      if (!silent) {
        showToast(
          inwardItems.length > 0 
            ? `Purchase receipt saved (${inwardItems.length} item${inwardItems.length > 1 ? 's' : ''})! You can continue anytime.` 
            : "Inward details saved to draft! You can continue anytime.",
          "success"
        );
      }
    } catch (e) {
      console.error("Failed to save draft:", e);
      if (!silent) showToast("Failed to save draft", "error");
    }
  };

  // Restore saved inward draft on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem('hospital_inward_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          if (draft.inwardItems && Array.isArray(draft.inwardItems) && draft.inwardItems.length > 0) {
            setInwardItems(draft.inwardItems);
          }
          if (draft.inwardInvoiceNo) setInwardInvoiceNo(draft.inwardInvoiceNo);
          if (draft.inwardDate) setInwardDate(draft.inwardDate);
          if (draft.inwardSupplier) setInwardSupplier(draft.inwardSupplier);
          if (draft.inwardCategory) setInwardCategory(draft.inwardCategory);
          if (draft.inwardItemCode) setInwardItemCode(draft.inwardItemCode);
          if (draft.inwardMedSearch) setInwardMedSearch(draft.inwardMedSearch);
          if (draft.inwardGenericName) setInwardGenericName(draft.inwardGenericName);
          if (draft.inwardDosageForm) setInwardDosageForm(draft.inwardDosageForm);
          if (draft.inwardPurchaseUnit) setInwardPurchaseUnit(draft.inwardPurchaseUnit);
          if (draft.inwardUnitsPerPack) setInwardUnitsPerPack(draft.inwardUnitsPerPack);
          if (draft.inwardBatch) setInwardBatch(draft.inwardBatch);
          if (draft.inwardExp) setInwardExp(draft.inwardExp);
          if (draft.inwardPackSize) setInwardPackSize(draft.inwardPackSize);
          if (draft.inwardPacksCount) setInwardPacksCount(draft.inwardPacksCount);
          if (draft.inwardQty) setInwardQty(draft.inwardQty);
          if (draft.inwardPrice) setInwardPrice(draft.inwardPrice);
          if (draft.inwardMrp) setInwardMrp(draft.inwardMrp);
          if (draft.inwardSaleRate) setInwardSaleRate(draft.inwardSaleRate);
          if (draft.inwardGstPct) setInwardGstPct(draft.inwardGstPct);
          if (draft.inwardRack) setInwardRack(draft.inwardRack);
          if (draft.inwardHsn) setInwardHsn(draft.inwardHsn);
          if (draft.inwardBillDiscountPct) setInwardBillDiscountPct(draft.inwardBillDiscountPct);
          if (draft.inwardAdditionalCharges) setInwardAdditionalCharges(draft.inwardAdditionalCharges);
          if (draft.inwardFreight) setInwardFreight(draft.inwardFreight);
          if (draft.inwardRoundOff) setInwardRoundOff(draft.inwardRoundOff);
        } catch (e) {
          console.error("Error restoring inward draft:", e);
        }
      }
    }
  }, []);

  // Auto-persist inward draft whenever ANY field or item changes (always auto-save)
  useEffect(() => {
    if (isMounted && typeof window !== 'undefined') {
      saveInwardDraft(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    inwardItems,
    inwardInvoiceNo,
    inwardDate,
    inwardSupplier,
    inwardCategory,
    inwardItemCode,
    inwardMedSearch,
    inwardGenericName,
    inwardDosageForm,
    inwardPurchaseUnit,
    inwardUnitsPerPack,
    inwardBatch,
    inwardExp,
    inwardPackSize,
    inwardPacksCount,
    inwardQty,
    inwardPrice,
    inwardMrp,
    inwardSaleRate,
    inwardGstPct,
    inwardRack,
    inwardHsn,
    inwardBillDiscountPct,
    inwardAdditionalCharges,
    inwardFreight,
    inwardRoundOff,
    isMounted
  ]);

  // Ensure draft is saved when user leaves or closes page
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveInwardDraft(true);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      saveInwardDraft(true);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    inwardItems, inwardInvoiceNo, inwardDate, inwardSupplier, inwardCategory,
    inwardItemCode, inwardMedSearch, inwardGenericName, inwardDosageForm,
    inwardPurchaseUnit, inwardUnitsPerPack, inwardBatch, inwardExp, inwardPackSize,
    inwardQty, inwardPrice, inwardMrp, inwardSaleRate, inwardGstPct, inwardRack,
    inwardBillDiscountPct, inwardAdditionalCharges, inwardFreight, inwardRoundOff
  ]);

  // Global Keyboard Up / Down Arrow navigation for active tab tables
  useEffect(() => {
    const handleGlobalArrowNavigation = (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
      
      // If user is inside the medicine search input with autocomplete, let the input's onKeyDown handle it
      if (activeEl === inwardSearchInputRef.current) return;

      if (e.key === "ArrowDown") {
        if (activeTab === "purchase-inward" && inwardItems.length > 0) {
          if (!isInput) {
            e.preventDefault();
            setSelectedInwardRowIndex(prev => (prev < inwardItems.length - 1 ? prev + 1 : 0));
          }
        }
      } else if (e.key === "ArrowUp") {
        if (activeTab === "purchase-inward" && inwardItems.length > 0) {
          if (!isInput) {
            e.preventDefault();
            setSelectedInwardRowIndex(prev => (prev > 0 ? prev - 1 : inwardItems.length - 1));
          }
        }
      }
    };
    window.addEventListener("keydown", handleGlobalArrowNavigation);
    return () => window.removeEventListener("keydown", handleGlobalArrowNavigation);
  }, [activeTab, inwardItems.length]);

  const DOSAGE_FORM_OPTIONS = [
    "Tablet",
    "Capsule",
    "Syrup",
    "Injection",
    "Ointment",
    "Drops",
    "Powder",
    "Cream",
    "Suspension",
    "Sachet",
    "Other"
  ];

  const PURCHASE_UNIT_OPTIONS = [
    "Strip",
    "Bottle",
    "Box",
    "Vial",
    "Tube",
    "Pack",
    "Piece",
    "Sachet",
    "Nos"
  ];

  const getDerivedUnitLabel = (form, packSize) => {
    const psLower = (packSize || "").toLowerCase();
    if (psLower.includes("ml")) return "ml";
    if (psLower.includes("mg")) return "mg";
    if (psLower.includes("gm") || psLower.includes(" g") || psLower.endsWith("g")) return "g";
    if (psLower.includes("tab")) return "Tablets";
    if (psLower.includes("cap")) return "Capsules";
    if (psLower.includes("vial")) return "Vials";
    if (psLower.includes("amp")) return "Ampoules";
    if (psLower.includes("sachet")) return "Sachets";
    if (psLower.includes("tube")) return "Tubes";
    if (psLower.includes("patch")) return "Patches";
    if (psLower.includes("drop")) return "Drops";
    if (psLower.includes("puff")) return "Puffs";
    if (form === "Tablet") return "Tablets";
    if (form === "Capsule") return "Capsules";
    if (form === "Syrup" || form === "Suspension" || form === "Drops") return "ml";
    if (form === "Injection") return "Vials";
    if (form === "Ointment" || form === "Cream" || form === "Powder") return "g";
    if (form === "Sachet") return "Sachets";
    return form ? `${form}s` : "Units";
  };

  const extractUnitsPerPack = (packStr, fallback = 10) => {
    if (!packStr) return fallback;
    const match = String(packStr).match(/(\d+(\.\d+)?)/);
    if (match) {
      const val = parseFloat(match[1]);
      return val > 0 ? val : fallback;
    }
    return fallback;
  };

  const handleDosageFormChange = (newForm) => {
    setInwardDosageForm(newForm);
    if (newForm === "Tablet") {
      setInwardPurchaseUnit("Strip");
      setInwardPackSize("10 Tablets");
      setInwardUnitsPerPack(10);
    } else if (newForm === "Capsule") {
      setInwardPurchaseUnit("Strip");
      setInwardPackSize("10 Capsules");
      setInwardUnitsPerPack(10);
    } else if (newForm === "Syrup") {
      setInwardPurchaseUnit("Bottle");
      setInwardPackSize("100 ml");
      setInwardUnitsPerPack(100);
    } else if (newForm === "Injection") {
      setInwardPurchaseUnit("Vial");
      setInwardPackSize("2 ml");
      setInwardUnitsPerPack(2);
    } else if (newForm === "Ointment") {
      setInwardPurchaseUnit("Tube");
      setInwardPackSize("20 g");
      setInwardUnitsPerPack(20);
    } else if (newForm === "Cream") {
      setInwardPurchaseUnit("Tube");
      setInwardPackSize("20 g");
      setInwardUnitsPerPack(20);
    } else if (newForm === "Drops") {
      setInwardPurchaseUnit("Bottle");
      setInwardPackSize("10 ml");
      setInwardUnitsPerPack(10);
    } else if (newForm === "Powder") {
      setInwardPurchaseUnit("Bottle");
      setInwardPackSize("100 g");
      setInwardUnitsPerPack(100);
    } else if (newForm === "Suspension") {
      setInwardPurchaseUnit("Bottle");
      setInwardPackSize("100 ml");
      setInwardUnitsPerPack(100);
    } else if (newForm === "Sachet") {
      setInwardPurchaseUnit("Box");
      setInwardPackSize("10 Sachets");
      setInwardUnitsPerPack(10);
    } else {
      setInwardPurchaseUnit("Pack");
      setInwardPackSize("1 Unit");
      setInwardUnitsPerPack(1);
    }
  };

  const handlePurchaseUnitChange = (newUnit) => {
    setInwardPurchaseUnit(newUnit);
    if (newUnit === "Piece" || newUnit === "Nos") {
      setInwardPackSize(`1 ${inwardDosageForm}`);
      setInwardUnitsPerPack(1);
    } else if (newUnit === "Strip") {
      setInwardPackSize(`10 ${inwardDosageForm === "Capsule" ? "Capsules" : "Tablets"}`);
      setInwardUnitsPerPack(10);
    } else if (newUnit === "Bottle") {
      if (inwardDosageForm === "Drops") {
        setInwardPackSize("10 ml");
        setInwardUnitsPerPack(10);
      } else if (inwardDosageForm === "Powder") {
        setInwardPackSize("100 g");
        setInwardUnitsPerPack(100);
      } else {
        setInwardPackSize("100 ml");
        setInwardUnitsPerPack(100);
      }
    } else if (newUnit === "Vial") {
      setInwardPackSize("2 ml");
      setInwardUnitsPerPack(2);
    } else if (newUnit === "Tube") {
      setInwardPackSize("20 g");
      setInwardUnitsPerPack(20);
    } else if (newUnit === "Box") {
      setInwardPackSize(`10 ${inwardDosageForm === "Sachet" ? "Sachets" : (inwardDosageForm === "Capsule" ? "Capsules" : "Tablets")}`);
      setInwardUnitsPerPack(10);
    } else if (newUnit === "Sachet") {
      setInwardPackSize("1 Sachet");
      setInwardUnitsPerPack(1);
    }
  };

  const handlePackSizeChange = (newPack) => {
    setInwardPackSize(newPack);
    const num = extractUnitsPerPack(newPack, inwardUnitsPerPack || 10);
    setInwardUnitsPerPack(num);
  };

  const handleOpenPurchaseInwardModal = () => {
    handleTabChange("purchase-inward");
    setInwardItems(prev => prev.length === 0 ? [createEmptyInwardRow()] : prev);
  };

  const handleSelectMedForInwardBar = (med) => {
    if (!med) return;
    setInwardSelectedMed(med);
    const medName = med.medicine_name || med.name || "";
    setInwardMedSearch(medName);
    setInwardItemCode(med.item_code || med.code || (med.id ? `MED${String(med.id).padStart(5, '0')}` : `MED${Math.floor(10000 + Math.random() * 90000)}`));
    setInwardGenericName(med.generic_name || medName);
    setInwardManufacturer(med.brand || med.manufacturer || med.company || "");
    if (med.category) {
      setInwardCategory(med.category);
    }
    if (med.supplier) {
      setInwardSupplier(med.supplier);
    }

    const dForm = med.dosage_form || "Tablet";
    setInwardDosageForm(dForm);

    const pUnit = med.purchase_unit || (dForm === "Syrup" || dForm === "Suspension" || dForm === "Drops" ? "Bottle" : (dForm === "Injection" ? "Vial" : (dForm === "Cream" || dForm === "Ointment" ? "Tube" : (dForm === "Sachet" ? "Box" : "Strip"))));
    setInwardPurchaseUnit(pUnit);

    const uPerPack = med.units_per_pack ? Number(med.units_per_pack) : extractUnitsPerPack(med.pack_size, (dForm === "Syrup" || dForm === "Suspension" ? 100 : (dForm === "Injection" ? 2 : (dForm === "Cream" || dForm === "Ointment" ? 20 : 10))));
    setInwardUnitsPerPack(uPerPack);

    const pSize = med.pack_size 
      ? (typeof med.pack_size === 'number' ? `${med.pack_size} ${getDerivedUnitLabel(dForm, "")}` : med.pack_size) 
      : `${uPerPack} ${getDerivedUnitLabel(dForm, "")}`;
    setInwardPackSize(pSize);

    const lastP = (med.purchase_price !== undefined && med.purchase_price !== null && med.purchase_price !== "")
      ? Number(med.purchase_price)
      : (med.batches?.[0]?.purchase_price ? Number(med.batches[0].purchase_price) : 0);
    setInwardPrice(lastP > 0 ? String(lastP.toFixed(2)) : "");

    const mrpVal = Number(med.mrp || (lastP > 0 ? lastP * 1.5 : 0));
    setInwardMrp(mrpVal > 0 ? String(mrpVal.toFixed(2)) : "");

    const saleVal = Number(med.selling_price || (lastP > 0 ? lastP * 1.25 : 0));
    setInwardSaleRate(saleVal > 0 ? String(saleVal.toFixed(2)) : "");

    const batchVal = (med.batches && med.batches.length > 0 && med.batches[0].batch_number) 
      ? med.batches[0].batch_number 
      : (med.batch_number || "");
    setInwardBatch(batchVal);

    const expVal = (med.batches && med.batches.length > 0 && med.batches[0].exp_date)
      ? med.batches[0].exp_date
      : (med.expiry_date || "");
    setInwardExp(expVal ? expVal.slice(0, 7) : "");

    setInwardRack(med.rack_location || med.rack || "");
    setInwardHsn(med.hsn_code || med.hsn || "30049099");
    setInwardPacksCount("");
    setInwardGstPct(med.gst || med.gst_pct ? String(med.gst || med.gst_pct) : "12");
    setInwardShowDropdown(false);
  };

  const handleAddInwardEntryFromBar = () => {
    if (!inwardMedSearch.trim()) {
      showToast("Please enter or select a medicine name", "error");
      return;
    }
    if (!inwardDosageForm) {
      showToast("Dosage Form is required", "error");
      return;
    }
    if (!inwardPurchaseUnit) {
      showToast("Purchase Unit is required", "error");
      return;
    }
    const enteredQty = parseInt(inwardQty, 10);
    if (isNaN(enteredQty) || enteredQty <= 0) {
      showToast("Quantity must be greater than 0", "error");
      return;
    }
    const unitsPerPack = parseInt(inwardUnitsPerPack, 10) || extractUnitsPerPack(inwardPackSize, 10);
    if (isNaN(unitsPerPack) || unitsPerPack <= 0) {
      showToast("Units per pack must be greater than 0", "error");
      return;
    }

    const cleanName = inwardMedSearch.trim();
    const existingMed = medicines.find(
      m => m.medicine_name.toLowerCase() === cleanName.toLowerCase() ||
           (m.name && m.name.toLowerCase() === cleanName.toLowerCase())
    ) || inwardSelectedMed;

    const lastPrice = (existingMed && existingMed.purchase_price !== undefined && existingMed.purchase_price !== null && existingMed.purchase_price !== "")
      ? Number(existingMed.purchase_price)
      : (existingMed?.batches?.[0]?.purchase_price ? Number(existingMed.batches[0].purchase_price) : 0);

    const enteredPrice = inwardPrice !== "" ? (parseFloat(inwardPrice) || 0) : (lastPrice > 0 ? lastPrice : 0);
    const itemCode = inwardItemCode.trim() || (existingMed?.item_code || `MED${Math.floor(10000 + Math.random() * 90000)}`);
    const batchNo = inwardBatch.trim() || (existingMed?.batch_number || `BATCH${Math.floor(1000 + Math.random() * 9000)}`);
    const expDate = inwardExp.trim() ? (inwardExp.trim().length === 7 ? inwardExp.trim() : inwardExp.trim().slice(0, 7)) : "";
    const pack = inwardPackSize.trim() || `${unitsPerPack} ${getDerivedUnitLabel(inwardDosageForm, "")}`;
    const rack = inwardRack.trim() || (existingMed?.rack_location || "");
    const hsn = inwardHsn.trim() || (existingMed?.hsn_code || "30049099");
    const mrp = inwardMrp !== "" ? parseFloat(inwardMrp) || (enteredPrice * 1.5 || 0) : (enteredPrice * 1.5 || 0);
    const saleRate = inwardSaleRate !== "" ? parseFloat(inwardSaleRate) || (enteredPrice * 1.25 || 0) : (enteredPrice * 1.25 || 0);
    const gstPct = parseFloat(inwardGstPct) || 12;
    const category = inwardCategory || existingMed?.category || "Regular";
    const company = inwardManufacturer.trim() || existingMed?.brand || existingMed?.supplier || "";
    const supplier = inwardSupplier.trim() || "";
    const genericName = inwardGenericName.trim() || existingMed?.generic_name || cleanName;
    const totalUnits = enteredQty * unitsPerPack;

    const newItem = {
      id: `inw-${Date.now()}-${Math.random()}`,
      item_code: itemCode,
      medicine: cleanName,
      medicine_name: cleanName,
      generic_name: genericName,
      dosage_form: inwardDosageForm || "Tablet",
      purchase_unit: inwardPurchaseUnit || "Strip",
      pack_size: pack,
      units_per_pack: unitsPerPack,
      no_of_packs: enteredQty,
      quantity: enteredQty,
      total_units: totalUnits,
      category: category,
      company: company,
      manufacturer: company,
      brand: company,
      supplier: supplier,
      batch_number: batchNo,
      exp_date: expDate,
      rack_location: rack,
      hsn_code: hsn,
      current_stock: Number(existingMed?.stock) || 0,
      last_purchase_price: lastPrice,
      purchase_price: enteredPrice,
      price_diff: enteredPrice - lastPrice,
      mrp: mrp,
      sale_rate: saleRate,
      selling_price: saleRate,
      gst_pct: gstPct,
      line_total: parseFloat((enteredQty * enteredPrice).toFixed(2))
    };

    setInwardItems(prev => {
      const next = [...prev, newItem];
      setSelectedInwardRowIndex(next.length - 1);
      return next;
    });
    // Automatically erase/clear top medicine form fields for next entry (preserves supplier, invoice no, date)
    handleClearInwardBar();
    showToast(`Added ${cleanName} (${enteredQty} ${inwardPurchaseUnit}${enteredQty !== 1 ? 's' : ''} = ${totalUnits} ${getDerivedUnitLabel(inwardDosageForm, pack)}) to inward bill`, "success");
    setTimeout(() => {
      inwardSearchInputRef.current?.focus();
    }, 60);
  };

  function createEmptyInwardRow() {
    return {
      id: `inw-${Date.now()}-${Math.random()}`,
      item_code: "",
      medicine: "",
      medicine_name: "",
      generic_name: "",
      dosage_form: "Tablet",
      category: "Regular",
      hsn_code: "30049099",
      hsn: "30049099",
      batch_number: "",
      pack_size: "10 Tablets",
      units_per_pack: 10,
      exp_date: `${new Date().getFullYear() + 2}-12`,
      quantity: 1,
      purchase_unit: "Strip",
      purchase_price: "",
      last_purchase_price: 0,
      price_diff: 0,
      mrp: "",
      sale_rate: "",
      gst_pct: 12,
      line_total: 0
    };
  }

  const handleAddBlankInwardRow = () => {
    setInwardItems(prev => {
      const next = [...prev, createEmptyInwardRow()];
      setSelectedInwardRowIndex(next.length - 1);
      return next;
    });
  };

  const handleSelectMedForRow = (index, med) => {
    const lastPrice = (med.purchase_price !== undefined && med.purchase_price !== null && med.purchase_price !== "")
      ? Number(med.purchase_price)
      : (med.batches?.[0]?.purchase_price ? Number(med.batches[0].purchase_price) : 0);
    const pPrice = lastPrice > 0 ? lastPrice : (med.purchase_price || "");
    const mrp = med.mrp || med.selling_price || (pPrice ? Number(pPrice) * 1.5 : "");
    const saleRate = med.selling_price || med.mrp || (pPrice ? Number(pPrice) * 1.25 : "");
    const dosageForm = med.dosage_form || "Tablet";
    const pack = med.pack_size || med.batches?.[0]?.pack_size || (dosageForm === "Syrup" || dosageForm === "Suspension" ? "100 ml" : "10 Tablets");
    const purchaseUnit = med.purchase_unit || (dosageForm === "Syrup" || dosageForm === "Suspension" ? "Bottle" : "Strip");
    const unitsPerPack = extractUnitsPerPack(pack, 10);
    const itemCode = med.item_code || med.name || (med.id ? `MED${med.id}` : `MED${Math.floor(10000 + Math.random() * 90000)}`);
    const hsn = med.hsn_code || med.hsn || "30049099";
    const q = 1;

    setInwardItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      return {
        ...item,
        item_code: itemCode,
        medicine: med.medicine_name,
        medicine_name: med.medicine_name,
        generic_name: med.generic_name || med.medicine_name,
        dosage_form: dosageForm,
        category: med.category || "Regular",
        hsn_code: hsn,
        hsn: hsn,
        purchase_unit: purchaseUnit,
        pack_size: pack,
        units_per_pack: unitsPerPack,
        quantity: q,
        total_units: q * unitsPerPack,
        purchase_price: pPrice,
        last_purchase_price: lastPrice,
        price_diff: 0,
        mrp: mrp ? (typeof mrp === 'number' ? mrp.toFixed(2) : mrp) : "",
        sale_rate: saleRate ? (typeof saleRate === 'number' ? saleRate.toFixed(2) : saleRate) : "",
        selling_price: saleRate,
        gst_pct: med.gst_pct !== undefined ? med.gst_pct : 12,
        rack_location: med.rack_location || "A-01",
        line_total: parseFloat((q * (Number(pPrice) || 0)).toFixed(2))
      };
    }));
    setActiveInwardSearchRow(null);
    setInwardRowSearchQuery("");
  };

  const handleAddCustomMedForRow = (index, customName) => {
    setInwardItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      return {
        ...item,
        item_code: `MED${Math.floor(10000 + Math.random() * 90000)}`,
        medicine: customName,
        medicine_name: customName,
        generic_name: customName,
        dosage_form: "Tablet",
        category: "Regular",
        hsn_code: "30049099",
        hsn: "30049099",
        purchase_unit: "Strip",
        pack_size: "10 Tablets",
        units_per_pack: 10,
        quantity: 1,
        total_units: 10,
        purchase_price: "",
        last_purchase_price: 0,
        price_diff: 0,
        mrp: "",
        sale_rate: "",
        gst_pct: 12,
        line_total: 0
      };
    }));
    setActiveInwardSearchRow(null);
    setInwardRowSearchQuery("");
  };

  const handleUpdateInwardRow = (index, field, value) => {
    setInwardItems(prev => prev.map((item, idx) => {
      if (idx !== index) return item;
      const updated = { ...item, [field]: value };
      if (field === "quantity" || field === "purchase_price" || field === "pack_size") {
        const q = field === "quantity" ? (value === "" ? 0 : Math.max(0, parseInt(value, 10) || 0)) : (parseInt(item.quantity, 10) || 0);
        const p = field === "purchase_price" ? (value === "" ? 0 : (parseFloat(value) || 0)) : (parseFloat(item.purchase_price) || 0);
        const u = field === "pack_size" ? extractUnitsPerPack(value, item.units_per_pack || 10) : (item.units_per_pack || 10);
        updated.quantity = field === "quantity" ? value : item.quantity;
        updated.purchase_price = field === "purchase_price" ? value : item.purchase_price;
        updated.units_per_pack = u;
        updated.total_units = q * u;
        updated.line_total = parseFloat((q * p).toFixed(2));
        const lastP = Number(item.last_purchase_price) || 0;
        updated.price_diff = p - lastP;
      }
      return updated;
    }));
  };

  const handleRemoveInwardItem = (index) => {
    setInwardItems(prev => {
      const remaining = prev.filter((_, idx) => idx !== index);
      return remaining.length === 0 ? [createEmptyInwardRow()] : remaining;
    });
  };

  const handleConfirmPurchaseInward = async () => {
    if (!inwardSupplier.trim()) {
      showToast("Please specify the supplier / distributor name", "error");
      return;
    }
    if (!inwardInvoiceNo.trim()) {
      showToast("Please enter the invoice / bill number", "error");
      return;
    }
    const validItems = inwardItems.filter(item => item.medicine_name && item.medicine_name.trim() !== "");
    if (validItems.length === 0) {
      showToast("Please enter at least one medicine item in the table", "error");
      return;
    }

    try {
      setIsSubmittingInward(true);
      await receiveGoods({
        supplier: inwardSupplier.trim(),
        invoice_number: inwardInvoiceNo.trim(),
        invoice_date: inwardDate || new Date().toISOString().split("T")[0],
        purchase_type: inwardCategory || "Regular",
        category: inwardCategory || "Regular",
        remarks: inwardCategory || "Regular",
        items: validItems
      });

      showToast(`Successfully inwarded ${validItems.length} medicine(s) into inventory! Stock updated & rates recorded.`, "success");
      setInwardItems([createEmptyInwardRow()]);
      setInwardInvoiceNo("");
      setInwardBillDiscountPct("");
      setInwardAdditionalCharges("");
      setInwardFreight("");
      setInwardRoundOff("");
      if (typeof window !== 'undefined') {
        localStorage.removeItem('hospital_inward_draft');
      }
      await loadAllData();
      handleTabChange("inventory");
    } catch (err) {
      console.error("Purchase inward error:", err);
      showToast("Failed to process purchase inward", "error");
    } finally {
      setIsSubmittingInward(false);
    }
  };

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

      const queueDispenseRecord = {
        invoiceNumber: response.invoiceNumber,
        patientName: pName,
        patientMobile: pMobile,
        doctorName: docName,
        items: enrichedReceiptItems,
        dispenseItems: dispenseItems,
        totalVal: billAmt,
        paymentStatus: isPayAtPharmacy ? "Paid" : "ForwardedToBilling",
        paymentMethod: isPayAtPharmacy ? (otcPaymentMethod || "Cash") : "Pending at Central Billing",
        paymentMode: isPayAtPharmacy ? "Paid at Pharmacy Desk" : "Forwarded to Central Billing Desk",
        isPaidAtPharmacy: isPayAtPharmacy,
        pharmacistName: pharmacistName,
        date: new Date().toLocaleString("en-IN")
      };
      setLatestDispenseRecord(queueDispenseRecord);
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("hospital_pharmacy_bills");
          const cur = stored ? JSON.parse(stored) : [];
          const cleanCur = cur.filter(b => b && b.invoiceNumber && b.invoiceNumber !== queueDispenseRecord.invoiceNumber && !b.invoiceNumber.startsWith("INV-2026-0929-") && b.patientName !== "Rajesh Kumar" && b.patientName !== "Sunita Verma" && b.patientName !== "Vikram Malhotra");
          localStorage.setItem("hospital_pharmacy_bills", JSON.stringify([queueDispenseRecord, ...cleanCur]));
        } catch {}
      }
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
      setBatchMedSearchFilter("");
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
                    <td class="text-center font-mono">${formatExpiry(r.exp_date)}</td>
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

  const downloadInventoryExport = () => {
    const activeMeds = medicines.filter(m => !m.disabled);
    if (activeMeds.length === 0) {
      showToast("No active medicines to export", "info");
      return;
    }
    const headers = ["Medicine Name", "Generic Name", "Brand", "Schedule / Category", "Batch Number", "Current Stock", "Min Stock", "Reorder Level", "Rack Location", "Purchase Price (INR)", "MRP / Selling Price (INR)", "Total Valuation (INR)", "Status"];
    const rows = [];
    activeMeds.forEach(m => {
      const batches = (m.batches && m.batches.length > 0) ? m.batches : [{ batch_number: m.batch_number || "N/A", current_stock: m.stock || 0, purchase_price: m.purchase_price || 0, mrp: m.selling_price || m.mrp || 0, rack_location: m.rack_location || "A-1" }];
      batches.forEach(b => {
        const stock = b.current_stock ?? m.stock ?? 0;
        const pPrice = parseFloat(b.purchase_price || m.purchase_price || 0);
        const sPrice = parseFloat(b.mrp || m.selling_price || m.mrp || 0);
        const valuation = (stock * pPrice).toFixed(2);
        rows.push([
          `"${(m.medicine_name || "").replace(/"/g, '""')}"`,
          `"${(m.generic_name || "").replace(/"/g, '""')}"`,
          `"${(m.brand || "").replace(/"/g, '""')}"`,
          `"${(m.category || "Regular Medicine").replace(/"/g, '""')}"`,
          `"${(b.batch_number || "N/A").replace(/"/g, '""')}"`,
          stock,
          m.min_stock || 0,
          m.reorder_level || 0,
          `"${(b.rack_location || m.rack_location || "A-1").replace(/"/g, '""')}"`,
          pPrice.toFixed(2),
          sPrice.toFixed(2),
          valuation,
          stock === 0 ? "Out of Stock" : (stock < (m.min_stock || 0) ? "Low Stock" : "In Stock")
        ]);
      });
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `master_pharmacy_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Master Pharmacy Inventory exported successfully", "success");
  };

  const downloadExpiringExport = (timeframeDays = 90) => {
    const today = new Date();
    const expiringRows = [];
    medicines.forEach(m => {
      (m.batches || []).forEach(b => {
        if (!b.exp_date || (b.current_stock || 0) <= 0) return;
        const diffMs = new Date(b.exp_date) - today;
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays > 0 && diffDays <= timeframeDays) {
          expiringRows.push([
            `"${(m.medicine_name || "").replace(/"/g, '""')}"`,
            `"${(m.generic_name || "").replace(/"/g, '""')}"`,
            `"${(b.batch_number || "").replace(/"/g, '""')}"`,
            b.current_stock || 0,
            b.exp_date,
            diffDays,
            `"${(b.supplier || m.supplier || "Supplier").replace(/"/g, '""')}"`,
            `"${(b.rack_location || m.rack_location || "A-1").replace(/"/g, '""')}"`
          ]);
        }
      });
    });

    if (expiringRows.length === 0) {
      showToast(`No batches expiring within next ${timeframeDays} days`, "info");
      return;
    }

    const headers = ["Medicine Name", "Generic Name", "Batch Number", "Stock Units", "Expiry Date", "Days Remaining", "Supplier", "Rack Location"];
    const csvContent = "\uFEFF" + [headers.join(","), ...expiringRows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `expiring_medicines_${timeframeDays}days_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Expiring medicines report (${timeframeDays} days) exported successfully`, "success");
  };

  const downloadDailySalesExport = () => {
    if (drugRegister.length === 0) {
      showToast("No sales or dispensing logs to export", "info");
      return;
    }
    const headers = ["Dispensing ID / Invoice", "Dispensing Date", "Patient Name", "Patient UHID", "Doctor", "Medicine", "Category", "Batch Number", "Quantity Dispensed", "Unit Price (INR)", "Total Value (INR)", "Dispensing Pharmacist"];
    const rows = drugRegister.map(r => {
      const med = medicines.find(m => m.medicine_name === r.medicine || m.name === r.medicine);
      const unitRate = Number(r.price || r.unit_price || r.rate) || Number(med?.selling_price || med?.mrp || 0);
      const qty = Number(r.quantity) || 0;
      const total = qty * unitRate;
      return [
        `"${(r.invoice_number || r.name || "").replace(/"/g, '""')}"`,
        `"${new Date(r.dispensing_date || Date.now()).toLocaleString("en-IN")}"`,
        `"${(r.patient_name || "").replace(/"/g, '""')}"`,
        `"${(r.patient_id || r.uhid || "N/A").replace(/"/g, '""')}"`,
        `"${(r.doctor || "").replace(/"/g, '""')}"`,
        `"${(r.medicine || "").replace(/"/g, '""')}"`,
        `"${(r.drug_category || med?.category || "Regular").replace(/"/g, '""')}"`,
        `"${(r.batch_number || "").replace(/"/g, '""')}"`,
        qty,
        unitRate.toFixed(2),
        total.toFixed(2),
        `"${(r.pharmacist || pharmacistName || "").replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pharmacy_dispensing_sales_register_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Daily Sales & Dispensing Register exported successfully", "success");
  };

  const downloadReturnsExport = () => {
    if (salesReturnsList.length === 0) {
      showToast("No sales returns recorded to export", "info");
      return;
    }
    const headers = ["Return Invoice", "Date", "Patient Name", "Mobile / ID", "Total Refund (INR)", "Refund Method", "Restocked", "Pharmacist", "Items Summary", "Notes"];
    const rows = salesReturnsList.map(ret => [
      `"${(ret.invoice_number || ret.name || "").replace(/"/g, '""')}"`,
      `"${new Date(ret.date || Date.now()).toLocaleDateString("en-IN")}"`,
      `"${(ret.patient_name || "").replace(/"/g, '""')}"`,
      `"${(ret.patient_id || "").replace(/"/g, '""')}"`,
      Number(ret.total_refund || 0).toFixed(2),
      `"${(ret.refund_method || "Cash").replace(/"/g, '""')}"`,
      ret.restock_inventory ? "Yes" : "No",
      `"${(ret.pharmacist || "").replace(/"/g, '""')}"`,
      `"${(ret.items || []).map(i => `${i.medicine_name} (${i.return_qty} tabs)`).join("; ").replace(/"/g, '""')}"`,
      `"${(ret.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pharmacy_sales_returns_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Sales returns register exported successfully", "success");
  };

  const handleExecuteDownloadReport = () => {
    if (selectedReportType === "inventory") {
      downloadInventoryExport();
    } else if (selectedReportType === "low_stock") {
      downloadReorderReport();
    } else if (selectedReportType === "expiring") {
      downloadExpiringExport(reportExpiringDays);
    } else if (selectedReportType === "drug_register") {
      handlePrintRegister(reportScheduleCategory);
    } else if (selectedReportType === "daily_sales") {
      downloadDailySalesExport();
    } else if (selectedReportType === "returns") {
      downloadReturnsExport();
    }
    setShowDownloadReportsModal(false);
  };

  const handleAddPOItem = () => {
    if (!poAddMedName) return;
    const med = medicines.find(m => m.medicine_name === poAddMedName);
    if (!med) return;

    if (poItems.some(i => i.medicine === med.medicine_name)) {
      showToast("Item already in PO list", "info");
      return;
    }

    const lastPrice = (med.purchase_price !== undefined && med.purchase_price !== null && med.purchase_price !== "")
      ? Number(med.purchase_price)
      : (med.batches?.[0]?.purchase_price ? Number(med.batches[0].purchase_price) : 0);
    const newPrice = poAddPrice !== "" ? (parseFloat(poAddPrice) || 0) : lastPrice;
    const diff = newPrice - lastPrice;
    const pct = lastPrice > 0 ? ((diff / lastPrice) * 100).toFixed(1) : "0";

    setPoItems(prev => [...prev, {
      medicine: med.medicine_name,
      quantity: poAddQty,
      last_purchase_price: lastPrice,
      purchase_price: newPrice,
      diff: diff,
      pct: pct,
      amount: poAddQty * newPrice
    }]);

    setPoAddMedName("");
    setPoAddQty(100);
    setPoAddPrice("");
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
      showToast(`Purchase Order created successfully for ${poSupplier}. Inventory stock updated!`, "success");
      setIsPOModalOpen(false);
      setPoItems([]);
      await loadAllData();
    } catch {
      showToast("Failed to create PO", "error");
    }
  };

  // Goods Received Processing
  const handleOpenGRNModal = (po) => {
    setSelectedPO(po);
    // Prefill receipt items from PO items (po.items may be absent in Frappe list mode)
    const items = (po.items || []).map(item => {
      const catMed = medicines.find(m => m.medicine_name === item.medicine);
      const lastPrice = (catMed?.purchase_price !== undefined && catMed?.purchase_price !== null && catMed?.purchase_price !== "")
        ? Number(catMed.purchase_price)
        : (catMed?.batches?.[0]?.purchase_price ? Number(catMed.batches[0].purchase_price) : (item.purchase_price || 0));
      const pPrice = item.purchase_price || lastPrice || 0;
      const diff = pPrice - lastPrice;
      const pct = lastPrice > 0 ? ((diff / lastPrice) * 100).toFixed(1) : "0";

      return {
        medicine: item.medicine,
        batch_number: `BATCH-${(item.medicine || "MED").split(" ")[0].toUpperCase()}-${Math.floor(1000 + Math.random()*9000)}`,
        mfg_date: new Date().toISOString().split("T")[0],
        exp_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2)).toISOString().split("T")[0],
        quantity: item.quantity || 0,
        last_purchase_price: lastPrice,
        purchase_price: pPrice,
        diff: diff,
        pct: pct,
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
    const lastPrice = (catMed?.purchase_price !== undefined && catMed?.purchase_price !== null && catMed?.purchase_price !== "")
      ? Number(catMed.purchase_price)
      : (catMed?.batches?.[0]?.purchase_price ? Number(catMed.batches[0].purchase_price) : 0);
    const price = grnAddPrice !== "" ? (parseFloat(grnAddPrice) || 0) : lastPrice;
    const diff = price - lastPrice;
    const pct = lastPrice > 0 ? ((diff / lastPrice) * 100).toFixed(1) : "0";
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
      last_purchase_price: lastPrice,
      purchase_price: price,
      diff: diff,
      pct: pct,
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
  const generatePDFInvoice = async (invNo, pName, pMobile, docName, items, totalVal, paymentMethod = "Cash", statusParam = "Paid") => {
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
      const isPaid = statusParam === "Paid" || statusParam === true;
      const isFwd = statusParam === "ForwardedToBilling";
      if (isPaid) {
        doc.setDrawColor(16, 185, 129); // emerald-500
        doc.setLineWidth(0.5);
        doc.rect(45, posY, 58, 10);
        doc.setTextColor(16, 185, 129);
        doc.setFontSize(9);
        doc.text("PAID & DISPENSED", 74, posY + 6, { align: "center" });
      } else if (isFwd) {
        doc.setDrawColor(245, 158, 11); // amber-500
        doc.setLineWidth(0.5);
        doc.rect(36, posY, 76, 10);
        doc.setTextColor(217, 119, 6);
        doc.setFontSize(8.5);
        doc.text("FORWARDED TO BILLING DESK", 74, posY + 6, { align: "center" });
      } else {
        doc.setDrawColor(239, 68, 68); // rose-500
        doc.setLineWidth(0.5);
        doc.rect(40, posY, 68, 10);
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(8.5);
        doc.text("PAYMENT DUE — UNPAID", 74, posY + 6, { align: "center" });
      }

      doc.save(`pharmacy_invoice_${invNo}.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
    }
  };

  // Print Dispensation Receipt via Hidden Iframe (No Popup / No New Tab)
  const printDispenseReceipt = (record) => {
    if (!record) return;
    printPharmacyInvoiceReceipt(record);
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
  const handleCreatePOFromSuggestion = async () => {
    if (!poSuggItem) return;
    const { medicine, supplier, suggested, price } = poSuggItem;
    
    try {
      await createPurchaseOrder({
        supplier: supplier,
        items: [{
          medicine: medicine,
          quantity: suggested,
          purchase_price: price,
          amount: suggested * price
        }]
      });
      showToast(`Purchase Order created for ${medicine}. Inventory stock adjusted!`, "success");
      setShowPOSuggModal(false);
      setPoSuggItem(null);
      await loadAllData();
    } catch {
      showToast("Failed to create Purchase Order", "error");
    }
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

  const handleGeneratePurchaseOrdersShortcut = () => {
    if (activeTab !== 'logistics') {
      handleTabChange('logistics');
    }
    if (purchaseRecommendations.length > 0) {
      handleBulkGeneratePOs();
    } else {
      setIsPOModalOpen(true);
      showToast("Opened Purchase Order Generator (Alt + G)", "info");
    }
  };

  const handleAddSupplierShortcut = () => {
    if (activeTab !== 'logistics') {
      handleTabChange('logistics');
    }
    openAddSupplierModal();
    showToast("Opened Add Supplier form (Alt + Shift + S)", "info");
  };

  // Handle URL action parameters (e.g. from global Alt+G / Alt+Shift+S / Alt+A / Alt+D)
  const actionParam = searchParams?.get("action");
  const filterParam = searchParams?.get("filter");

  useEffect(() => {
    if (!actionParam) return;
    if (actionParam === "generate_po") {
      setActiveTab("logistics");
      setTimeout(() => {
        handleGeneratePurchaseOrdersShortcut();
      }, 150);
      router.replace("/pharmacy?tab=logistics");
    } else if (actionParam === "add_supplier") {
      setActiveTab("logistics");
      setTimeout(() => {
        handleAddSupplierShortcut();
      }, 150);
      router.replace("/pharmacy?tab=logistics");
    } else if (actionParam === "add_medicine") {
      setActiveTab("inventory");
      setTimeout(() => {
        setIsAddModalOpen(true);
      }, 150);
      router.replace("/pharmacy?tab=inventory");
    } else if (actionParam === "download_reports") {
      setActiveTab("inventory");
      setTimeout(() => {
        setShowDownloadReportsModal(true);
      }, 150);
      router.replace("/pharmacy?tab=inventory");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionParam]);

  useEffect(() => {
    if (!filterParam) return;
    if (filterParam === "low_stock") {
      setActiveTab("inventory");
      setStatusFilter("Low Stock");
      router.replace("/pharmacy?tab=inventory");
    } else if (filterParam === "expiring") {
      setActiveTab("inventory");
      setStatusFilter("Expiring / Expired");
      router.replace("/pharmacy?tab=inventory");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterParam]);

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

    for (const po of newPOs) {
      try {
        await createPurchaseOrder(po);
      } catch (err) {
        console.error("Bulk PO create failed", err);
      }
    }
    await loadAllData();
    
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

  // ============================================================================
  // GLOBAL KEYBOARD SHORTCUTS & ARROW NAVIGATION LISTENER
  // ============================================================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isInput = target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' || 
        target.isContentEditable ||
        Boolean(target.closest?.('input, textarea, select, [contenteditable="true"]'))
      );

      const isAlt = e.altKey;
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key;

      // 2. Escape -> Close active modal / clear search where appropriate
      if (key === 'Escape') {
        if (showShortcutsModal) {
          e.preventDefault();
          setShowShortcutsModal(false);
          return;
        }
        if (isAddSupplierModalOpen) {
          e.preventDefault();
          setIsAddSupplierModalOpen(false);
          return;
        }
        if (showDownloadReportsModal) {
          e.preventDefault();
          setShowDownloadReportsModal(false);
          return;
        }
        if (showSubmitDispenseModal) {
          e.preventDefault();
          setShowSubmitDispenseModal(false);
          return;
        }
        if (showWorkdeskDeleteModal) {
          e.preventDefault();
          setShowWorkdeskDeleteModal(false);
          return;
        }
        if (showWorkdeskEditModal) {
          e.preventDefault();
          setShowWorkdeskEditModal(false);
          return;
        }
        if (showWorkdeskPartialModal) {
          e.preventDefault();
          setShowWorkdeskPartialModal(false);
          return;
        }
        if (showDispenseWorkdeskModal) {
          e.preventDefault();
          setShowDispenseWorkdeskModal(false);
          return;
        }
        if (showOTCSaleModal) {
          e.preventDefault();
          setShowOTCSaleModal(false);
          return;
        }
        if (isAddModalOpen) {
          e.preventDefault();
          setIsAddModalOpen(false);
          return;
        }
        if (isPOModalOpen) {
          e.preventDefault();
          setIsPOModalOpen(false);
          return;
        }
        if (showBulkPOModal) {
          e.preventDefault();
          setShowBulkPOModal(false);
          return;
        }
        if (showAdjustModal) {
          e.preventDefault();
          setShowAdjustModal(false);
          return;
        }
        if (showEditMedModal) {
          e.preventDefault();
          setShowEditMedModal(false);
          return;
        }
        if (showSalesReturnModal) {
          e.preventDefault();
          setShowSalesReturnModal(false);
          return;
        }
        if (selectedMedicine) {
          e.preventDefault();
          setSelectedMedicine(null);
          return;
        }
        if (isInput) {
          target.blur();
          return;
        }
      }

      // Backspace -> Close active modal or exit view back to POS Billing ONLY when NOT inside an input or editable element
      if (key === 'Backspace') {
        if (isInput) {
          // Inside input/textarea/select/table cell: Backspace must ONLY delete text, never close modals or views
          return;
        }

        if (showShortcutsModal) {
          e.preventDefault();
          setShowShortcutsModal(false);
          return;
        }
        if (isAddSupplierModalOpen) {
          e.preventDefault();
          setIsAddSupplierModalOpen(false);
          return;
        }
        if (showDownloadReportsModal) {
          e.preventDefault();
          setShowDownloadReportsModal(false);
          return;
        }
        if (showSubmitDispenseModal) {
          e.preventDefault();
          setShowSubmitDispenseModal(false);
          return;
        }
        if (showWorkdeskDeleteModal) {
          e.preventDefault();
          setShowWorkdeskDeleteModal(false);
          return;
        }
        if (showWorkdeskEditModal) {
          e.preventDefault();
          setShowWorkdeskEditModal(false);
          return;
        }
        if (showWorkdeskPartialModal) {
          e.preventDefault();
          setShowWorkdeskPartialModal(false);
          return;
        }
        if (showDispenseWorkdeskModal) {
          e.preventDefault();
          setShowDispenseWorkdeskModal(false);
          return;
        }
        if (showOTCSaleModal) {
          e.preventDefault();
          setShowOTCSaleModal(false);
          return;
        }
        if (isAddModalOpen) {
          e.preventDefault();
          setIsAddModalOpen(false);
          return;
        }
        if (isPOModalOpen) {
          e.preventDefault();
          setIsPOModalOpen(false);
          return;
        }
        if (showBulkPOModal) {
          e.preventDefault();
          setShowBulkPOModal(false);
          return;
        }
        if (showAdjustModal) {
          e.preventDefault();
          setShowAdjustModal(false);
          return;
        }
        if (showEditMedModal) {
          e.preventDefault();
          setShowEditMedModal(false);
          return;
        }
        if (showSalesReturnModal) {
          e.preventDefault();
          setShowSalesReturnModal(false);
          return;
        }
        if (selectedMedicine) {
          e.preventDefault();
          setSelectedMedicine(null);
          return;
        }
        if (showDispenseReceiptModal) {
          e.preventDefault();
          setShowDispenseReceiptModal(false);
          return;
        }

        // If on a sub-view (like Inventory, Purchase Inward, Dispensing, Registers, Logistics), return to POS Billing Dashboard
        if (activeTab !== 'dashboard') {
          e.preventDefault();
          handleTabChange('dashboard');
          setStatusFilter('All');
          return;
        }
      }

      // 3. Ctrl + Enter -> Submit Dispensation or Confirm
      if (isCtrlOrMeta && key === 'Enter') {
        if (showSubmitDispenseModal) {
          e.preventDefault();
          setShowSubmitDispenseModal(false);
          if (selectedSubmitAction === "Pay at Pharmacy Desk") {
            executeDispensing("Pay at Pharmacy Desk");
          } else if (selectedSubmitAction === "Forward to Central Billing Desk") {
            executeDispensing("Forward to Central Billing Desk");
          } else if (selectedSubmitAction === "Outside Purchase") {
            executeOutsidePurchase();
          }
          return;
        }
        if (showDispenseWorkdeskModal && dispenseItems.length > 0) {
          e.preventDefault();
          setShowSubmitDispenseModal(true);
          return;
        }
      }

      // 4. Focus Search inside Dispense Workdesk modal ('/' when not inside input)
      if (key === '/' && !isInput && showDispenseWorkdeskModal) {
        e.preventDefault();
        workdeskSearchInputRef.current?.focus();
        workdeskSearchInputRef.current?.select();
        return;
      }

      // 5. Alt + 1-5 -> Fast Tab Switching
      if (isAlt && ['1', '2', '3', '4', '5'].includes(key)) {
        e.preventDefault();
        const tabMap = {
          '1': 'dashboard',
          '2': 'inventory',
          '3': 'dispensing',
          '4': 'registers',
          '5': 'logistics'
        };
        const targetTab = tabMap[key];
        if (targetTab) {
          handleTabChange(targetTab);
        }
        return;
      }

      // Alt + I -> Fast Purchase Inward & Stock Entry Page
      if (isAlt && !isCtrlOrMeta && !e.shiftKey && key.toLowerCase() === 'i') {
        e.preventDefault();
        handleOpenPurchaseInwardModal();
        return;
      }

      // 6. Alt + L -> Low Stock Filter & View
      if (isAlt && (key.toLowerCase() === 'l' || key === 'l')) {
        e.preventDefault();
        setStatusFilter("Low Stock");
        if (activeTab !== 'inventory') {
          handleTabChange('inventory');
        }
        showToast("Filtered Inventory: Low Stock Items", "info");
        return;
      }

      // 7. Alt + E -> Expiry Filter & View
      if (isAlt && (key.toLowerCase() === 'e' || key === 'e')) {
        e.preventDefault();
        setStatusFilter("Expiring / Expired");
        if (activeTab !== 'inventory') {
          handleTabChange('inventory');
        }
        showToast("Filtered Inventory: Expiring / Expired Items", "info");
        return;
      }

      // 8. Alt + + / Alt + = / + (not in input) -> Add Medicine
      if ((isAlt && (key === '+' || key === '=')) || (key === '+' && !isInput)) {
        e.preventDefault();
        if (userRole === "Pharmacist") {
          showToast("Access Denied: Pharmacists cannot create new medication catalog records.", "error");
        } else {
          setIsAddModalOpen(true);
        }
        return;
      }

      // 9. Alt + R -> Return Sold Medicine
      if (isAlt && (key.toLowerCase() === 'r' || key === 'r')) {
        e.preventDefault();
        handleOpenSalesReturn();
        return;
      }

      // 10. Alt + D -> Open Download Reports & Export Modal
      if (isAlt && (key.toLowerCase() === 'd' || key === 'd')) {
        e.preventDefault();
        setShowDownloadReportsModal(true);
        return;
      }

      // 11. Alt + Q -> Select Next Patient in Queue / Open Dispensation
      if (isAlt && (key.toLowerCase() === 'q' || key === 'q')) {
        e.preventDefault();
        if (showDispenseWorkdeskModal) return;
        const waitingQueue = queue.filter(item => item.appointment_status === 'Pharmacy' || item.status === 'Waiting');
        const nextPatient = waitingQueue[0] || queue[0];
        if (nextPatient) {
          handleSelectQueueItem(nextPatient);
        } else {
          showToast("No waiting patients in prescription queue.", "info");
        }
        return;
      }

      // 13. Alt + F -> Forward to Billing
      if (isAlt && key.toLowerCase() === 'f') {
        e.preventDefault();
        if (showDispenseWorkdeskModal || showSubmitDispenseModal) {
          setSelectedSubmitAction("Forward to Central Billing Desk");
          if (!showSubmitDispenseModal) setShowSubmitDispenseModal(true);
        }
        return;
      }

      // 14. Alt + O -> Outside Purchase
      if (isAlt && key.toLowerCase() === 'o') {
        e.preventDefault();
        if (showDispenseWorkdeskModal || showSubmitDispenseModal) {
          setSelectedSubmitAction("Outside Purchase");
          if (!showSubmitDispenseModal) setShowSubmitDispenseModal(true);
        }
        return;
      }

      // 16. Alt + A -> Add Medicine (Purchase Inward & Stock Entry)
      if (isAlt && key.toLowerCase() === 'a') {
        e.preventDefault();
        handleOpenPurchaseInwardModal();
        return;
      }

      // 17. Alt + G -> Generate Purchase Orders (Auto/Manual PO)
      if (isAlt && !isCtrlOrMeta && key.toLowerCase() === 'g') {
        e.preventDefault();
        handleGeneratePurchaseOrdersShortcut();
        return;
      }

      // Alt + Shift + S -> Add Drug Supplier Modal
      if (isAlt && e.shiftKey && !isCtrlOrMeta && key.toLowerCase() === 's') {
        e.preventDefault();
        handleAddSupplierShortcut();
        return;
      }

      // Alt + Shift + P -> Review & Edit Bulk POs
      if (isAlt && e.shiftKey && key.toLowerCase() === 'p') {
        e.preventDefault();
        if (activeTab !== 'logistics') {
          handleTabChange('logistics');
        }
        handleBulkGeneratePOs();
        return;
      }

      // Alt + P -> Patient Focus (switch to POS dashboard if on another tab)
      if (isAlt && !e.shiftKey && key.toLowerCase() === 'p') {
        if (activeTab !== 'dashboard') {
          e.preventDefault();
          handleTabChange('dashboard');
        }
        return;
      }

      // Alt + B -> View Bills (switch to POS dashboard if on another tab)
      if (isAlt && !e.shiftKey && key.toLowerCase() === 'b') {
        if (activeTab !== 'dashboard') {
          e.preventDefault();
          handleTabChange('dashboard');
        }
        return;
      }

      // Alt + M -> Focus Medicine Search (switch to POS dashboard if on another tab)
      if (isAlt && !e.shiftKey && key.toLowerCase() === 'm') {
        if (activeTab !== 'dashboard') {
          e.preventDefault();
          handleTabChange('dashboard');
        }
        return;
      }

      // ? or F1 -> Toggle Keyboard Shortcuts Modal Guide (when not typing in text field)
      if (!isInput && (key === '?' || key === 'F1')) {
        e.preventDefault();
        setShowShortcutsModal(prev => !prev);
        return;
      }

      // 18. ARROW KEYS NAVIGATION: ArrowLeft / ArrowRight -> Cycle Tabs
      const isAnyModalOpen = showShortcutsModal || isAddSupplierModalOpen || showDownloadReportsModal || showSubmitDispenseModal || showDispenseWorkdeskModal || showOTCSaleModal || isAddModalOpen || isPOModalOpen || showBulkPOModal || showAdjustModal || showEditMedModal || showSalesReturnModal || Boolean(selectedMedicine);
      if (!isInput && !isAnyModalOpen && (key === 'ArrowLeft' || key === 'ArrowRight')) {
        e.preventDefault();
        const tabOrder = ['dashboard', 'inventory', 'dispensing', 'registers', 'logistics'];
        const curIdx = tabOrder.indexOf(activeTab);
        if (curIdx !== -1) {
          const nextIdx = key === 'ArrowRight' 
            ? (curIdx + 1) % tabOrder.length 
            : (curIdx - 1 + tabOrder.length) % tabOrder.length;
          handleTabChange(tabOrder[nextIdx]);
        }
        return;
      }

      // 19. ARROW KEYS NAVIGATION: ArrowUp / ArrowDown
      if (showSubmitDispenseModal) {
        e.preventDefault();
        const options = ["Pay at Pharmacy Desk", "Outside Purchase"];
        const currentIdx = options.indexOf(selectedSubmitAction);
        const nextIdx = key === 'ArrowDown' 
          ? (currentIdx + 1) % options.length 
          : (currentIdx - 1 + options.length) % options.length;
        setSelectedSubmitAction(options[nextIdx]);
        return;
      }

      if (showDownloadReportsModal) {
        e.preventDefault();
        const repOptions = ["inventory", "low_stock", "expiring", "drug_register", "daily_sales", "returns"];
        const currentIdx = repOptions.indexOf(selectedReportType);
        const nextIdx = key === 'ArrowDown' 
          ? (currentIdx + 1) % repOptions.length 
          : (currentIdx - 1 + repOptions.length) % repOptions.length;
        setSelectedReportType(repOptions[nextIdx]);
        return;
      }

      if (activeTab === 'dispensing' && !isInput && !showDispenseWorkdeskModal && (key === 'ArrowUp' || key === 'ArrowDown')) {
        if (filteredQueue.length > 0) {
          e.preventDefault();
          let nextIdx = selectedQueueRowIndex;
          if (key === 'ArrowDown') {
            nextIdx = selectedQueueRowIndex < filteredQueue.length - 1 ? selectedQueueRowIndex + 1 : 0;
          } else {
            nextIdx = selectedQueueRowIndex > 0 ? selectedQueueRowIndex - 1 : filteredQueue.length - 1;
          }
          setSelectedQueueRowIndex(nextIdx);
          return;
        }
      }

      if (activeTab === 'inventory' && !isInput && !selectedMedicine && (key === 'ArrowUp' || key === 'ArrowDown')) {
        if (filteredMedicines.length > 0) {
          e.preventDefault();
          let nextIdx = selectedInvRowIndex;
          if (key === 'ArrowDown') {
            nextIdx = selectedInvRowIndex < filteredMedicines.length - 1 ? selectedInvRowIndex + 1 : 0;
          } else {
            nextIdx = selectedInvRowIndex > 0 ? selectedInvRowIndex - 1 : filteredMedicines.length - 1;
          }
          setSelectedInvRowIndex(nextIdx);
          return;
        }
      }

      // 20. Enter key on highlighted row or report modal
      if (key === 'Enter' && !isInput && !isCtrlOrMeta) {
        if (showDownloadReportsModal) {
          e.preventDefault();
          handleExecuteDownloadReport();
          return;
        }
        if (activeTab === 'dispensing' && selectedQueueRowIndex >= 0 && filteredQueue[selectedQueueRowIndex]) {
          e.preventDefault();
          handleSelectQueueItem(filteredQueue[selectedQueueRowIndex]);
          return;
        }
        if (activeTab === 'inventory' && selectedInvRowIndex >= 0 && filteredMedicines[selectedInvRowIndex]) {
          e.preventDefault();
          setSelectedMedicine(filteredMedicines[selectedInvRowIndex]);
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab, 
    queue, 
    filteredQueue,
    dispenseItems, 
    selectedSubmitAction, 
    showShortcutsModal, 
    showDownloadReportsModal,
    selectedReportType,
    reportScheduleCategory,
    reportExpiringDays,
    selectedInvRowIndex,
    selectedQueueRowIndex,
    filteredMedicines,
    showSubmitDispenseModal, 
    showWorkdeskDeleteModal, 
    showWorkdeskEditModal, 
    showWorkdeskPartialModal, 
    showDispenseWorkdeskModal, 
    showOTCSaleModal, 
    isAddModalOpen, 
    isPOModalOpen, 
    showBulkPOModal, 
    showAdjustModal, 
    showEditMedModal, 
    showSalesReturnModal, 
    selectedMedicine,
    showDispenseReceiptModal,
    userRole,
    isAddSupplierModalOpen,
    purchaseRecommendations
  ]);

  return (
    <div className="flex flex-col justify-between w-full h-screen max-h-screen overflow-hidden font-sans text-slate-800 antialiased select-none p-2 sm:p-2.5">
      
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

                  {/* Price Difference Indicator for Existing Catalog Medicine */}
                  {(() => {
                    const existing = medicines.find(m => (m.medicine_name || "").toLowerCase().trim() === (newMedData.medicine_name || "").toLowerCase().trim());
                    if (!existing) return null;
                    const lastPrice = Number(existing.purchase_price) || 0;
                    const newPrice = parseFloat(newMedData.purchase_price) || 0;
                    const diff = newPrice - lastPrice;
                    const pct = lastPrice > 0 ? ((diff / lastPrice) * 100).toFixed(1) : "0";
                    return (
                      <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] text-indigo-900 flex items-center justify-between">
                        <span>
                          Catalog Match: <strong>{existing.medicine_name}</strong> &bull; Existing Stock: <strong>{existing.stock} units</strong>
                        </span>
                        {newPrice > 0 && (
                          <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                            diff > 0 ? "bg-amber-100 text-amber-800 border border-amber-300" : diff < 0 ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-slate-100 text-slate-700 border border-slate-300"
                          }`}>
                            Last Purchase: ₹{lastPrice.toFixed(2)} | Diff: {diff > 0 ? `+₹${diff.toFixed(2)} (+${pct}%)` : diff < 0 ? `-₹${Math.abs(diff).toFixed(2)} (${pct}%)` : '₹0.00'}
                          </span>
                        )}
                      </div>
                    );
                  })()}

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
          <Dialog open={showAddBatchModal} onOpenChange={(open) => {
            setShowAddBatchModal(open);
            if (!open) {
              setBatchMedSearchFilter("");
              setAddBatchMed(null);
            }
          }}>
            <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto p-4 sm:p-5">
              <DialogHeader>
                <DialogTitle className="font-serif text-base">Add New Batch to Inventory</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  {addBatchMed ? `Registering additional batch for ${addBatchMed.medicine_name}` : "Select a medicine from catalog to add a new batch"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddBatchToExistingMedicine} className="space-y-3 pt-1">
                {/* 1. Interactive Medicine Selector */}
                <div className="space-y-1 bg-slate-50/90 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="add-batch-med-select" className="text-xs font-bold text-slate-700">
                      Medicine *
                    </Label>
                    {addBatchMed ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAddBatchMed(null);
                          setNewBatchData(p => ({
                            ...p,
                            purchase_price: "",
                            mrp: "",
                            rack_location: "Rack A-01"
                          }));
                        }}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
                      >
                        Deselect Medicine
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {medicines.filter(m => !m.disabled).length} medicines available
                      </span>
                    )}
                  </div>

                  {medicines.filter(m => !m.disabled).length > 5 && (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Filter medicines by name or generic..."
                        value={batchMedSearchFilter}
                        onChange={(e) => setBatchMedSearchFilter(e.target.value)}
                        className="w-full h-7 pl-8 pr-6 text-xs bg-white border border-slate-200 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                      />
                      {batchMedSearchFilter && (
                        <button
                          type="button"
                          onClick={() => setBatchMedSearchFilter("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  )}

                  <select
                    id="add-batch-med-select"
                    value={addBatchMed?.name || addBatchMed?.medicine_name || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) {
                        setAddBatchMed(null);
                        setNewBatchData(p => ({
                          ...p,
                          purchase_price: "",
                          mrp: "",
                          rack_location: "Rack A-01"
                        }));
                        return;
                      }
                      const selected = medicines.find(
                        m => (m.name === val || m.medicine_name === val)
                      );
                      if (selected) {
                        setAddBatchMed(selected);
                        setNewBatchData(p => ({
                          ...p,
                          purchase_price: selected.purchase_price || "",
                          mrp: selected.selling_price || selected.mrp || "",
                          rack_location: selected.rack_location || p.rack_location || "Rack A-01"
                        }));
                      }
                    }}
                    className="flex h-8.5 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 shadow-2xs cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Medicine to Add Batch --</option>
                    {medicines
                      .filter(m => m && !m.disabled && (
                        (addBatchMed && (m.name === addBatchMed.name || m.medicine_name === addBatchMed.medicine_name)) ||
                        !batchMedSearchFilter ||
                        (m.medicine_name && m.medicine_name.toLowerCase().includes(batchMedSearchFilter.toLowerCase())) ||
                        (m.generic_name && m.generic_name.toLowerCase().includes(batchMedSearchFilter.toLowerCase()))
                      ))
                      .map((m, idx) => (
                        <option key={m.name || m.medicine_name || idx} value={m.name || m.medicine_name}>
                          {m.medicine_name} {m.strength && m.strength !== '-' ? `(${m.strength})` : ''} — Stock: {m.stock || 0} ({m.generic_name || m.category || 'Medicine'})
                        </option>
                      ))}
                  </select>

                  {/* Compact Selected Medicine Badge */}
                  {addBatchMed && (
                    <div className="flex items-center justify-between text-[10.5px] bg-white border border-indigo-200 px-2 py-1 rounded text-slate-700">
                      <span className="truncate">
                        <strong className="text-slate-900">{addBatchMed.medicine_name}</strong> • {addBatchMed.generic_name || "Generic"}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono font-bold shrink-0">
                        Stock: {addBatchMed.stock || 0} units
                      </span>
                    </div>
                  )}
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
                        value={newBatchData.purchase_price ?? addBatchMed?.purchase_price ?? ""} 
                        onChange={(e) => setNewBatchData(p => ({ ...p, purchase_price: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="add-batch-mrp" className="text-xs font-semibold">MRP (₹)</Label>
                      <Input 
                        id="add-batch-mrp" type="number" placeholder="₹"
                        value={newBatchData.mrp ?? addBatchMed?.selling_price ?? ""} 
                        onChange={(e) => setNewBatchData(p => ({ ...p, mrp: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="add-batch-rack" className="text-xs font-semibold">Rack</Label>
                      <Input 
                        id="add-batch-rack" placeholder="Rack A-01"
                        value={newBatchData.rack_location || addBatchMed?.rack_location || ""} 
                        onChange={(e) => setNewBatchData(p => ({ ...p, rack_location: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowAddBatchModal(false);
                        setAddBatchMed(null);
                        setBatchMedSearchFilter("");
                      }}
                      className="h-8.5 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 border-slate-300 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!addBatchMed}
                      className="h-8.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      Save New Batch
                    </Button>
                  </div>
                </form>
            </DialogContent>
          </Dialog>

      {/* Tabs navigation content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 min-h-0 flex flex-col space-y-0 overflow-hidden">
        {/* ========================================================
            TAB: DASHBOARD
            ======================================================== */}
        <TabsContent value="dashboard" className="flex-1 min-h-0 flex flex-col overflow-hidden focus-visible:outline-none h-full">
          <PharmacyPOSView
            medicines={medicines}
            queue={queue}
            userRole={userRole}
            pharmacistName={pharmacistName}
            activeTab={activeTab}
            handleTabChange={handleTabChange}
            onAddNewMedicine={() => {
              if (userRole === "Pharmacist") {
                showToast("Access Denied: Pharmacists cannot create new medication catalog records.", "error");
              } else {
                setIsAddModalOpen(true);
              }
            }}
            onOpenOTCSale={() => {
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
            onOpenSalesReturn={() => handleOpenSalesReturn()}
            onOpenAddBatch={(targetMed) => {
              if (medicines.length > 0) {
                let medToSet = null;
                if (targetMed) {
                  medToSet = medicines.find(m => 
                    (m.medicine_name && targetMed.medicine_name && m.medicine_name.toLowerCase() === targetMed.medicine_name.toLowerCase()) ||
                    (m.name && targetMed.id && m.name === targetMed.id) ||
                    (m.name && targetMed.name && m.name === targetMed.name)
                  );
                }
                setAddBatchMed(medToSet);
                setNewBatchData({
                  batch_number: "",
                  supplier: "ABC Pharma",
                  mfg_date: "",
                  exp_date: "",
                  pack_size: (medToSet?.batches?.[0]?.pack_size) || medToSet?.pack_size || 30,
                  no_of_packs: 10,
                  purchase_price: medToSet?.purchase_price || "",
                  mrp: medToSet?.selling_price || medToSet?.mrp || "",
                  rack_location: medToSet?.rack_location || "Rack A-01",
                  invoice_number: "",
                  invoice_date: ""
                });
                setBatchMedSearchFilter("");
                setShowAddBatchModal(true);
              } else {
                showToast("No medicines in catalog to add batch to", "info");
              }
            }}
            onOpenExport={() => setShowDownloadReportsModal(true)}
            onOpenShortcuts={() => setShowShortcutsModal(true)}
            onAddSupplier={handleAddSupplierShortcut}
            onGeneratePOs={handleGeneratePurchaseOrdersShortcut}
            onOpenPurchaseInward={handleOpenPurchaseInwardModal}
            showToast={showToast}
            selectedWalkIn={selectedWalkIn}
            onClearWalkIn={() => setSelectedWalkIn(null)}
            onSelectQueueItem={handleSelectQueueItem}
            executeDispensing={executeDispensing}
            executeOutsidePurchase={executeOutsidePurchase}
            loadAllData={loadAllData}
            updateWalkIn={updateWalkIn}
            saveInvoiceToProfile={saveInvoiceToProfile}
            createPharmacyAuditLog={createPharmacyAuditLog}
            recordFinanceTransaction={recordFinanceTransaction}
            setLatestDispenseRecord={setLatestDispenseRecord}
            setShowDispenseReceiptModal={setShowDispenseReceiptModal}
          />
        </TabsContent>

        <TabsContent value="inventory" className="flex-1 min-h-0 flex flex-col overflow-hidden h-full space-y-2 focus-visible:outline-none">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between bg-slate-100/90 px-3.5 py-1.5 rounded-lg border border-slate-300/80 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">Inventory Control Panel</h1>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-1.5 py-0.2 rounded border border-indigo-200">
                    Stock Master &amp; Batches
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                  Monitor medicine master records, batches, rack placements, and statutory levels.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => handleOpenAdjustModal(null)}
                className="px-2.5 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="Adjust stock in popup"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust Stock</span>
              </button>
              <button
                type="button"
                onClick={handleOpenPurchaseInwardModal}
                className="px-2.5 py-1 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded shadow-2xs flex items-center gap-1.5 cursor-pointer"
                title="Add medicine via stock inward entry (Alt + A)"
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Add Medicine</span>
                <span className="text-[9px] bg-emerald-900 text-emerald-100 px-1 rounded font-mono">Alt + A</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextStatus = statusFilter === "Low Stock" ? "All" : "Low Stock";
                  setStatusFilter(nextStatus);
                  showToast(nextStatus === "Low Stock" ? "Filtered Inventory: Low Stock Items" : "Cleared Low Stock filter", "info");
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded shadow-2xs flex items-center gap-1.5 cursor-pointer transition ${
                  statusFilter === "Low Stock"
                    ? "bg-amber-600 text-white shadow-inner"
                    : "bg-white hover:bg-amber-50 text-amber-800 border border-amber-300"
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
                  const nextStatus = statusFilter === "Expiring / Expired" ? "All" : "Expiring / Expired";
                  setStatusFilter(nextStatus);
                  showToast(nextStatus === "Expiring / Expired" ? "Filtered Inventory: Expiring / Expired Items" : "Cleared Expiry filter", "info");
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded shadow-2xs flex items-center gap-1.5 cursor-pointer transition ${
                  statusFilter === "Expiring / Expired"
                    ? "bg-rose-600 text-white shadow-inner"
                    : "bg-white hover:bg-rose-50 text-rose-800 border border-rose-300"
                }`}
              >
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>Expiry</span>
                <span className={`text-[9px] px-1 rounded font-mono ${
                  statusFilter === "Expiring / Expired" ? "bg-rose-800 text-rose-100" : "bg-rose-100 text-rose-800 border border-rose-200"
                }`}>
                  Alt + E
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowDownloadReportsModal(true)}
                className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export</span>
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded font-mono border border-slate-200">
                  Alt + D
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  handleTabChange('dashboard');
                  setStatusFilter('All');
                }}
                className="px-2.5 py-1 text-xs font-bold bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 rounded border border-slate-300 shadow-2xs flex items-center gap-1.5 cursor-pointer transition"
                title="Close Inventory view and return to POS Billing (Backspace)"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>Close</span>
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded font-mono border border-slate-200">
                  Backspace
                </span>
              </button>
            </div>
          </div>

          {/* Filters & Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-100/90 p-1.5 rounded-lg border border-slate-300/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  ref={inventorySearchInputRef}
                  type="text"
                  placeholder="Search medicine..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-2.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder:text-slate-400"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-8 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              >
                <option value="All">Drug Schedule: All</option>
                <option value="Regular Medicine">Regular Medicine</option>
                <option value="Schedule H">Schedule H</option>
                <option value="Schedule H1">Schedule H1</option>
                <option value="Schedule X">Schedule X</option>
                <option value="OTC">OTC</option>
                <option value="Controlled Drug">Controlled Drug</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-8 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
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
                className={`h-8 rounded border px-2.5 py-1 text-xs focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 font-medium ${
                  invoiceFilter !== "All" ? "border-indigo-500 bg-indigo-50/80 text-indigo-900 font-bold" : "border-slate-300 bg-white text-slate-800"
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

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handlePrintRegister(categoryFilter)}
                className={`h-8 px-3 text-xs font-bold rounded shadow-2xs flex items-center gap-1.5 cursor-pointer text-white transition-all ${
                  categoryFilter === "Schedule H"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : categoryFilter === "Schedule H1"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : categoryFilter === "Schedule X"
                    ? "bg-yellow-600 hover:bg-yellow-700"
                    : categoryFilter === "Controlled Drug"
                    ? "bg-purple-600 hover:bg-purple-700"
                    : categoryFilter === "OTC"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{categoryFilter === "All" ? "Print Register (All Schedules)" : `Print ${categoryFilter} Register`}</span>
              </button>

              {statusFilter === "Expiring / Expired" && (
                <button
                  type="button"
                  onClick={() => setShowExpiringReportModal(true)}
                  className="h-8 px-2.5 text-xs font-semibold bg-white text-amber-800 border border-amber-300 rounded hover:bg-amber-50 shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Expiring List</span>
                </button>
              )}

              {(searchQuery || categoryFilter !== "All" || statusFilter !== "All" || invoiceFilter !== "All") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setCategoryFilter("All");
                    setStatusFilter("All");
                    setInvoiceFilter("All");
                  }}
                  className="h-8 px-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Active Invoice Filter Banner */}
          {invoiceFilter !== "All" && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 px-3 flex items-center justify-between text-xs text-indigo-950 shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="p-0.5 px-1.5 rounded bg-indigo-600 text-white font-bold text-[9px] uppercase tracking-wide flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Invoice Filter Active
                </span>
                <span className="font-bold text-xs text-indigo-900 font-mono">Invoice #{invoiceFilter}</span>
                {(() => {
                  const meta = importedInvoices.find(inv => inv.invoice_number.toLowerCase() === invoiceFilter.toLowerCase());
                  return meta ? (
                    <span className="text-slate-600 font-medium text-[11px]">
                      • Supplier: <strong>{meta.supplier}</strong> • Date: <strong>{meta.invoice_date || 'Recent'}</strong> • Net: <strong>₹{meta.total_amount?.toLocaleString("en-IN") || '0'}</strong>
                    </span>
                  ) : null;
                })()}
                <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-1.5 py-0.2 rounded text-[10px]">
                  {filteredMedicines.length} Medicines Found
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInvoiceFilter("All")}
                className="h-6 text-[10px] bg-white text-indigo-700 hover:bg-indigo-100 font-semibold gap-1 px-2 border border-indigo-300 rounded shadow-2xs cursor-pointer"
              >
                Clear Filter
              </button>
            </div>
          )}

          {/* High-Density Traditional Desktop Inventory ERP Table */}
          <div className="bg-white border border-slate-300 rounded-lg shadow-2xs overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full text-left border-collapse text-[11px] select-text">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-b from-slate-100 to-slate-200 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px] tracking-wider divide-x divide-slate-300">
                    <th className="py-2.5 px-3 min-w-[200px]">Medicine</th>
                    <th className="py-2.5 px-2 text-center">Schedule</th>
                    <th className="py-2.5 px-2 text-center font-mono">Batch No.</th>
                    <th className="py-2.5 px-2 text-center">Pack Size</th>
                    <th className="py-2.5 px-2 text-center font-bold">Total Units</th>
                    <th className="py-2.5 px-2 text-center">Expiry</th>
                    <th className="py-2.5 px-2 text-center">Rack</th>
                    <th className="py-2.5 px-2 text-center">Stock Status</th>
                    <th className="py-2.5 px-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white font-medium">
                  {filteredMedicines.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                        <Package className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-60" />
                        <div>No medicines found matching the selected filters.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredMedicines.map((med, index) => {
                      const isOut = med.stock === 0;
                      const isLow = med.stock < med.min_stock;
                      const isReorder = med.stock <= med.reorder_level;

                      const primaryBatch = (med.batches && med.batches.length > 0) ? med.batches[0] : null;
                      const batchCount = med.batches ? med.batches.length : 0;

                      // Expiring warning checks
                      const today = new Date();
                      let badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                      let badgeLabel = "Available";
                      
                      if (isOut) {
                        badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
                        badgeLabel = "Out Of Stock";
                      } else if (isLow) {
                        badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                        badgeLabel = "Low Stock";
                      } else if (isReorder) {
                        badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                        badgeLabel = "Reorder";
                      }

                      if (med.controlled_drug === 1) {
                        badgeColor = "bg-purple-50 text-purple-700 border-purple-200";
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
                        badgeColor = "bg-rose-50 text-rose-700 border-rose-200";
                        badgeLabel = "Expired Batch";
                      } else if (anyExpiring && !isLow && !isOut) {
                        badgeColor = "bg-amber-50 text-amber-700 border-amber-200";
                        badgeLabel = "Expiring Soon";
                      }

                      if (med.disabled) {
                        badgeColor = "bg-slate-100 text-slate-500 border-slate-200";
                        badgeLabel = "Deactivated";
                      }

                      return (
                        <tr 
                          key={med.medicine_name} 
                          className={`hover:bg-amber-50/50 divide-x divide-slate-200 transition-colors ${
                            med.disabled ? "bg-slate-50/50 opacity-60" : ""
                          } ${index === selectedInvRowIndex ? "bg-indigo-50/90 ring-1 ring-indigo-500/60 ring-inset" : ""}`}
                        >
                          <td className="py-2.5 px-3 align-middle">
                            <div className="font-bold text-slate-900 leading-tight">{med.medicine_name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{med.generic_name} • {med.brand || "Generics"}</div>
                          </td>
                          <td className="py-2.5 px-2 text-center align-middle">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                              med.category === "Schedule H" || med.category === "Schedule H1" || med.category === "Schedule X"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : med.category === "OTC"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : med.category === "Controlled Drug" || med.category === "Sleeping Pill"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}>
                              {med.category || "Regular"}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-[10px] align-middle">
                            {primaryBatch ? (
                              <div className="flex items-center justify-center gap-1">
                                <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                                  {primaryBatch.batch_number}
                                </span>
                                {batchCount > 1 && (
                                  <span className="text-[9px] text-slate-500 font-semibold bg-slate-100 px-1 rounded border border-slate-200">
                                    +{batchCount - 1} more
                                  </span>
                                )}
                              </div>
                            ) : med.batch_number ? (
                              <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                                {med.batch_number}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">No Batch</span>
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-slate-600 text-[10px] align-middle">
                            {primaryBatch ? `${primaryBatch.pack_size || med.pack_size || "10'S"} tabs/pack` : `${med.pack_size || "10'S"}`}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono font-black text-slate-900 text-xs align-middle">
                            {med.stock ?? (primaryBatch?.current_stock || 0)}
                          </td>
                          <td className="py-2.5 px-2 text-center font-mono text-[10px] text-slate-600 align-middle">
                            {formatExpiry((primaryBatch && primaryBatch.exp_date) ? primaryBatch.exp_date : (med.expiry_date || med.exp_date || "2028-12"))}
                          </td>
                          <td className="py-2.5 px-2 text-center text-slate-600 font-mono text-[10px] align-middle">
                            {primaryBatch ? (primaryBatch.rack_location || med.rack_location || "A-1") : (med.rack_location || "A-1")}
                          </td>
                          <td className="py-2.5 px-2 text-center align-middle">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                              {badgeLabel}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-center relative align-middle">
                            <button
                              type="button"
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
                              className="h-6.5 px-2 text-[10px] font-semibold gap-1 border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded shadow-2xs flex items-center justify-center mx-auto cursor-pointer"
                            >
                              <span>Actions</span>
                              <ChevronDown className="w-3 h-3 opacity-70" />
                            </button>
                            
                            {activeMenuMed === med.medicine_name && (
                              <>
                                <div 
                                  className="fixed inset-0 z-[90]" 
                                  onClick={() => setActiveMenuMed(null)}
                                />
                                <div 
                                  style={{ top: `${menuPos.top}px`, left: `${menuPos.left}px` }}
                                  className="fixed z-[100] w-48 rounded-lg shadow-2xl bg-white border border-slate-300 divide-y divide-slate-100 focus:outline-none text-left"
                                >
                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        setSelectedMedicine(med);
                                        setDetailActiveTab("batches");
                                        setActiveMenuMed(null);
                                      }}
                                      className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 w-full cursor-pointer font-medium"
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
                                      className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-emerald-700 font-semibold hover:bg-emerald-50 w-full cursor-pointer"
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
                                      className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 w-full cursor-pointer font-medium"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-blue-500" /> Edit Medicine
                                    </button>
                                  </div>

                                  <div className="py-1">
                                    <button
                                      onClick={() => {
                                        setSelectedMedicine(med);
                                        setDetailActiveTab("batches");
                                        setActiveMenuMed(null);
                                      }}
                                      className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 w-full cursor-pointer font-medium"
                                    >
                                      <ClipboardList className="w-3.5 h-3.5 text-purple-500" /> View Batch History
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        setSelectedMedicine(med);
                                        setDetailActiveTab("history");
                                        setActiveMenuMed(null);
                                      }}
                                      className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 w-full cursor-pointer font-medium"
                                    >
                                      <Activity className="w-3.5 h-3.5 text-emerald-500" /> View Stock Movement
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================
            TAB: PRESCRIPTIONS DISPENSING QUEUE
            ======================================================== */}
        {/* ========================================================
            TAB: PRESCRIPTIONS DISPENSING QUEUE
            ======================================================== */}
        <TabsContent value="dispensing" className="flex-1 min-h-0 flex flex-col overflow-hidden h-full space-y-2 focus-visible:outline-none">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between bg-slate-100/90 px-3.5 py-1.5 rounded-lg border border-slate-300/80 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <ClipboardList className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">Prescriptions Queue</h1>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-1.5 py-0.2 rounded border border-indigo-200">
                    Clinical Rx Queue
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                  Consultation profiles ready for pharmacy checkout.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pill className="w-3.5 h-3.5" />
                    <span>Medicine Operations</span>
                    <ChevronDown className="w-3 h-3 opacity-80" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1 text-xs bg-white border border-slate-300 rounded-lg shadow-xl">
                  <DropdownMenuItem
                    onClick={() => handleOpenSalesReturn()}
                    className="flex items-center gap-2 p-1.5 cursor-pointer rounded hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                    <span>Return Sold Medicine</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search & Queue Tabs Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-100/90 p-1.5 rounded-lg border border-slate-300/80 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search name or phone number..."
                value={queueSearchQuery}
                onChange={(e) => setQueueSearchQuery(e.target.value)}
                className="w-full h-8 pl-8 pr-2.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {[
                { id: "Waiting", label: "Active Queue", count: queueSummary.activeQueue },
                { id: "Completed", label: "Completed", count: queueSummary.completed }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setQueueFilterTab(tab.id)}
                  className={`px-3 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    queueFilterTab === tab.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    queueFilterTab === tab.id ? "bg-indigo-800 text-indigo-100" : "bg-slate-100 text-slate-600 border border-slate-200"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Prescriptions ERP Table */}
          <div className="bg-white border border-slate-300 rounded-lg shadow-2xs overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full text-left border-collapse text-[11px] select-text">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-b from-slate-100 to-slate-200 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px] tracking-wider divide-x divide-slate-300">
                    <th className="py-2.5 px-2 text-center w-10">#</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Patient Details</th>
                    <th className="py-2.5 px-2.5 w-28 text-center">UHID</th>
                    <th className="py-2.5 px-3 min-w-[140px]">Doctor</th>
                    <th className="py-2.5 px-2.5 w-24 text-center">Items</th>
                    <th className="py-2.5 px-2.5 w-28 text-center">Status</th>
                    {queueFilterTab !== "Completed" && (
                      <>
                        <th className="py-2.5 px-2.5 w-20 text-center">Action</th>
                        <th className="py-2.5 px-2.5 w-24 text-center">Dispense</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white font-medium">
                  {filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={queueFilterTab === "Completed" ? 6 : 8} className="p-8 text-center text-slate-400 text-xs">
                        <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-60" />
                        <div>No prescriptions found matching the selected filters.</div>
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
                          className={`hover:bg-amber-50/50 divide-x divide-slate-200 transition-colors ${
                            isSelected ? "bg-indigo-50/60" : ""
                          } ${idx === selectedQueueRowIndex ? "bg-indigo-50/90 ring-1 ring-indigo-500/60 ring-inset" : ""}`}
                        >
                          <td className="py-2.5 px-2 text-center font-mono text-slate-400 font-semibold text-[10px] align-middle">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 align-middle">
                            <div className="font-bold text-slate-900 leading-tight">{item.patient_name}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span>{item.gender || "Patient"}</span>
                              {item.age ? <span>• {item.age} yrs</span> : null}
                              <span>• Mob: {item.mobile_number || item.phone || "N/A"}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5 text-center font-mono text-[10px] align-middle">
                            <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                              {uhid}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium align-middle">
                            {item.doctor || "General Physician"}
                          </td>
                          <td className="py-2.5 px-2.5 text-center align-middle">
                            <span className="font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                              <Pill className="w-3 h-3 text-indigo-600" />
                              {distinctItemsCount} {distinctItemsCount === 1 ? "item" : "items"}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 text-center align-middle">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                              isCompleted
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              {isCompleted ? "Completed" : "Waiting"}
                            </span>
                          </td>
                          {queueFilterTab !== "Completed" && (
                            <>
                              <td className="py-2.5 px-2.5 text-center align-middle">
                                <button
                                  type="button"
                                  onClick={() => handleSelectQueueItem(item)}
                                  className="h-6.5 px-2.5 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-2xs flex items-center justify-center gap-1 mx-auto cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View</span>
                                </button>
                              </td>
                              <td className="py-2.5 px-2.5 text-center align-middle">
                                <button
                                  type="button"
                                  onClick={() => handleDirectQuickDispense(item)}
                                  className="h-6.5 px-2.5 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-2xs flex items-center justify-center gap-1 mx-auto cursor-pointer whitespace-nowrap"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>Dispense</span>
                                </button>
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
          </div>
        </TabsContent>

        {/* ========================================================
            TAB: DRUG REGISTERS
            ======================================================== */}
        <TabsContent value="registers" className="flex-1 min-h-0 flex flex-col overflow-hidden h-full space-y-2 focus-visible:outline-none">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between bg-slate-100/90 px-3.5 py-1.5 rounded-lg border border-slate-300/80 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">Government Compliance Records</h1>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-1.5 py-0.2 rounded border border-indigo-200">
                    Drugs Act Compliance
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                  Compliance records tracking Controlled and Scheduled substances under the Drugs Act.
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedRegister}
                onChange={(e) => setSelectedRegister(e.target.value)}
                className="h-8 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              >
                <option value="All Categories">All Categories Register</option>
                <option value="Schedule H">Schedule H Register</option>
                <option value="Schedule H1">Schedule H1 Register</option>
                <option value="Sleeping Pill">Sleeping Pill Register</option>
                <option value="Controlled Drug">Controlled Drug Register</option>
                <option value="Sales Returns">Sales Returns &amp; Refunds</option>
              </select>

              <button
                type="button"
                onClick={exportRegisterPDF}
                className="h-8 px-2.5 text-xs font-semibold bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>PDF</span>
              </button>
              <button
                type="button"
                onClick={exportRegisterCSV}
                className="h-8 px-2.5 text-xs font-semibold bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Compliance Records ERP Table */}
          <div className="bg-white border border-slate-300 rounded-lg shadow-2xs overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full text-left border-collapse text-[11px] select-text">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-b from-slate-100 to-slate-200 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px] tracking-wider divide-x divide-slate-300">
                    <th className="py-2.5 px-3 w-36">Date &amp; Time</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Patient Details</th>
                    <th className="py-2.5 px-3 w-36">Prescribed By</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Medicine Name</th>
                    <th className="py-2.5 px-2.5 w-24 text-center">Batch</th>
                    <th className="py-2.5 px-2.5 w-16 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-32 font-mono">Invoice ID</th>
                    <th className="py-2.5 px-3 w-28">Pharmacist</th>
                    <th className="py-2.5 px-2.5 w-28 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white font-medium">
                  {activeRegisterLogs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 text-xs">
                        <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-60" />
                        <div>No transactions recorded in the {selectedRegister} Register yet.</div>
                      </td>
                    </tr>
                  ) : (
                    activeRegisterLogs.map((log, index) => {
                      const date = new Date(log.dispensing_date).toLocaleString("en-IN", {
                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                      });
                      const isReturn = Number(log.quantity) < 0 || log.doctor === "Sales Return" || (log.invoice_number && log.invoice_number.includes("RET-"));
                      return (
                        <tr key={index} className={`hover:bg-amber-50/50 divide-x divide-slate-200 transition-colors ${isReturn ? "bg-rose-50/30" : ""}`}>
                          <td className="py-2.5 px-3 font-mono text-slate-600 text-[10px] align-middle">{date}</td>
                          <td className="py-2.5 px-3 align-middle">
                            <div className="font-bold text-slate-900 leading-tight">{log.patient_name}</div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Mob: {log.patient_id}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-medium align-middle">{log.doctor}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-800 align-middle">{log.medicine}</td>
                          <td className="py-2.5 px-2.5 text-center font-mono text-slate-500 text-[10px] align-middle">{log.batch_number}</td>
                          <td className="py-2.5 px-2.5 text-center font-mono font-bold align-middle">
                            {isReturn ? (
                              <span className="text-rose-600 font-bold">{log.quantity}</span>
                            ) : (
                              <span className="text-slate-800 font-bold">{log.quantity}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-indigo-700 font-semibold text-[10px] align-middle">{log.invoice_number}</td>
                          <td className="py-2.5 px-3 text-slate-600 font-medium align-middle">{(log.pharmacist || log.user || "Admin").split(",")[0]}</td>
                          <td className="py-2.5 px-2.5 text-center align-middle">
                            {isReturn ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                                Return Refund
                              </span>
                            ) : (
                              <button 
                                type="button"
                                onClick={() => handleOpenSalesReturn(log)}
                                className="h-6 px-2 text-[10px] gap-1 border border-rose-200 bg-white text-rose-700 hover:bg-rose-50 hover:border-rose-300 font-semibold rounded shadow-2xs whitespace-nowrap flex items-center justify-center mx-auto cursor-pointer"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Return Item</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ========================================================
            TAB: LOGISTICS & PROCUREMENT (POs, GRN & Suggestions)
            ======================================================== */}
        <TabsContent value="logistics" className="flex-1 min-h-0 flex flex-col overflow-y-auto space-y-2 focus-visible:outline-none pr-1">
          {/* Section 1: Purchase Suggestions Top Header Bar */}
          <div className="flex items-center justify-between bg-slate-100/90 px-3.5 py-1.5 rounded-lg border border-slate-300/80 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">Purchase Suggestions</h1>
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-1.5 py-0.2 rounded border border-indigo-200">
                    Auto Replenishment
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                  Medicines that require replenishment based on current stock, reorder level, and maximum stock.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="px-2.5 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Generate Purchase Orders</span>
                    <span className="text-[9px] font-mono bg-indigo-800 text-indigo-100 px-1 py-0.2 rounded border border-indigo-400">Alt + G</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60 p-1 text-xs bg-white border border-slate-300 rounded-lg shadow-xl z-50">
                  <DropdownMenuItem 
                    onClick={handleBulkGeneratePOs}
                    className="flex items-start gap-2 p-2 cursor-pointer rounded hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 transition-colors"
                  >
                    <ShoppingCart className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-bold text-slate-900">Review &amp; Edit Purchase Orders</div>
                        <span className="text-[9px] font-mono bg-indigo-100 text-indigo-800 px-1 py-0.2 rounded border border-indigo-200">Alt + G</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Auto-generate orders from system suggestions</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 border-slate-100" />
                  <DropdownMenuItem 
                    onClick={() => setIsPOModalOpen(true)}
                    className="flex items-start gap-2 p-2 cursor-pointer rounded hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900">Create Manual PO</div>
                      <div className="text-[10px] text-slate-500">Select supplier and custom items manually</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {purchaseRecommendations.length > 0 && (
                <button
                  type="button"
                  onClick={downloadReorderReport}
                  className="h-8 px-2.5 text-xs font-semibold bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>Download</span>
                </button>
              )}
            </div>
          </div>

          {/* Suggestions Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-100/90 p-1.5 rounded-lg border border-slate-300/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search suggestions..."
                  value={suggSearchQuery}
                  onChange={(e) => setSuggSearchQuery(e.target.value)}
                  className="w-full h-8 pl-8 pr-2.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 placeholder:text-slate-400"
                />
              </div>

              <select
                value={suggFilterCategory}
                onChange={(e) => setSuggFilterCategory(e.target.value)}
                className="h-8 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
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
                className="h-8 rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              >
                <option value="All">All Statuses</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out Of Stock">Out Of Stock</option>
                <option value="Controlled Drug">Controlled Drug</option>
                <option value="Schedule H">Schedule H</option>
                <option value="Sleeping Pill">Sleeping Pill</option>
              </select>
            </div>
          </div>

          {/* Suggestions ERP Table */}
          <div className="bg-white border border-slate-300 rounded-lg shadow-2xs overflow-hidden flex flex-col min-h-[260px]">
            <div className="overflow-auto flex-1 min-h-0">
              <table className="w-full text-left border-collapse text-[11px] select-text">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-to-b from-slate-100 to-slate-200 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px] tracking-wider divide-x divide-slate-300">
                    <th className="py-2.5 px-3 min-w-[200px]">Medicine</th>
                    <th className="py-2.5 px-2.5 w-28 text-center">Current Stock</th>
                    <th className="py-2.5 px-2.5 w-28 text-center font-mono">Reorder Level</th>
                    <th className="py-2.5 px-2.5 w-32 text-center">Suggested Qty</th>
                    <th className="py-2.5 px-3 min-w-[160px]">Preferred Supplier</th>
                    <th className="py-2.5 px-3 w-28 text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white font-medium">
                  {purchaseRecommendations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">
                        <ShoppingCart className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                        <div className="font-bold text-slate-700">All Stocks Healthy</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">No medicines currently require replenishment.</div>
                      </td>
                    </tr>
                  ) : (
                    purchaseRecommendations.map(rec => {
                      const isOut = rec.current_stock === 0;
                      const isLow = rec.current_stock < rec.min_stock && !isOut;
                      let stockBadgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
                      if (isOut) { stockBadgeColor = "bg-rose-50 text-rose-700 border-rose-200"; }
                      else if (isLow) { stockBadgeColor = "bg-amber-50 text-amber-700 border-amber-200"; }
                      else if (rec.current_stock <= rec.reorder_level) { stockBadgeColor = "bg-amber-50 text-amber-700 border-amber-200"; }

                      return (
                        <tr key={rec.medicine} className="hover:bg-amber-50/50 divide-x divide-slate-200 transition-colors">
                          <td className="py-2.5 px-3 align-middle">
                            <div className="font-bold text-slate-900 leading-tight">{rec.medicine}</div>
                            <div className="text-[10px] text-slate-500 mt-0.5">{rec.generic}</div>
                          </td>
                          <td className="py-2.5 px-2.5 text-center align-middle">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stockBadgeColor}`}>
                              {rec.current_stock}
                            </span>
                          </td>
                          <td className="py-2.5 px-2.5 text-center font-mono text-slate-600 text-[10px] align-middle">{rec.reorder_level}</td>
                          <td className="py-2.5 px-2.5 text-center align-middle">
                            <input
                              type="number"
                              min="0"
                              className="w-20 h-7 mx-auto text-center font-mono font-bold text-indigo-700 bg-white border border-indigo-200 rounded focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-xs px-1 shadow-2xs"
                              value={rec.suggested}
                              onChange={(e) => {
                                const newQty = parseInt(e.target.value) || 0;
                                setEditedSuggQty(prev => ({ ...prev, [rec.medicine]: newQty }));
                              }}
                            />
                          </td>
                          <td className="py-2.5 px-3 font-medium text-slate-700 align-middle">{rec.supplier}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 align-middle">
                            ₹{(rec.suggested * rec.price).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5 pt-1 items-start">
            
            {/* Purchase Orders List */}
            <div className="lg:col-span-2 space-y-2">
              <div className="bg-slate-100/90 px-3.5 py-1.5 rounded-lg border border-slate-300/80 shadow-2xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                        Purchase Orders (Statutory Replenishment)
                      </h2>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-1.5 py-0.2 rounded border border-indigo-200">
                        {purchaseOrders.length} Orders
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                      Track supply chains from purchase recommendation to goods arrival &amp; batch registration
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => setIsPOModalOpen(true)}
                    size="xs"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] h-7 px-2.5 flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> New PO
                  </Button>

                  <Dialog open={isPOModalOpen} onOpenChange={setIsPOModalOpen}>
                    <DialogContent className="max-w-2xl bg-white p-5 rounded-xl border border-slate-300 shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          <ShoppingCart className="w-4 h-4 text-indigo-600" />
                          Create Replenishment Purchase Order
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                          Select supplier, medicines, and purchase prices. Inserting this PO will automatically adjust inventory stock.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateCustomPO} className="space-y-3 pt-2 text-xs">
                        <div className="space-y-1">
                          <Label className="font-semibold text-slate-700 text-xs">Contracted Supplier</Label>
                          <select
                            value={poSupplier}
                            onChange={(e) => setPoSupplier(e.target.value)}
                            className="flex h-8 w-full rounded border border-slate-300 bg-white px-2.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                          >
                            {suppliers.map((sup) => (
                              <option key={sup.name} value={sup.name}>
                                {sup.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* PO items builder */}
                        <div className="space-y-2 border border-slate-200 p-2.5 rounded-lg bg-slate-50">
                          <div className="font-bold text-[10px] text-slate-500 uppercase tracking-wider flex items-center justify-between">
                            <span>Add Procurement Item</span>
                            <span className="text-[9px] text-indigo-600 font-semibold lowercase">tracks price difference with last purchase</span>
                          </div>
                          <div className="flex items-end gap-2 flex-wrap sm:flex-nowrap">
                            <div className="flex-1 min-w-[160px] space-y-1">
                              <Label className="text-[10px] font-semibold text-slate-600">Medicine</Label>
                              <select
                                value={poAddMedName}
                                onChange={(e) => {
                                  setPoAddMedName(e.target.value);
                                  const targetMed = medicines.find(m => m.medicine_name === e.target.value);
                                  if (targetMed) {
                                    const p = (targetMed.purchase_price !== undefined && targetMed.purchase_price !== null && targetMed.purchase_price !== "")
                                      ? targetMed.purchase_price
                                      : (targetMed.batches?.[0]?.purchase_price || "");
                                    setPoAddPrice(p ? String(p) : "");
                                  } else {
                                    setPoAddPrice("");
                                  }
                                }}
                                className="flex h-7 w-full rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                              >
                                <option value="">Select medicine...</option>
                                {medicines.map(m => (
                                  <option key={m.medicine_name} value={m.medicine_name}>
                                    {m.medicine_name} (Stock: {m.stock})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="w-20 space-y-1">
                              <Label className="text-[10px] font-semibold text-slate-600">Quantity</Label>
                              <Input 
                                type="number" 
                                min="1"
                                value={poAddQty}
                                onChange={(e) => setPoAddQty(parseInt(e.target.value) || 1)}
                                className="h-7 text-xs border-slate-300 font-mono text-center bg-white"
                              />
                            </div>
                            <div className="w-24 space-y-1">
                              <Label className="text-[10px] font-semibold text-slate-600">New Price (₹)</Label>
                              <Input 
                                type="number" 
                                step="0.01"
                                min="0"
                                value={poAddPrice}
                                onChange={(e) => setPoAddPrice(e.target.value)}
                                placeholder="0.00"
                                className="h-7 text-xs border-slate-300 font-mono text-right bg-white"
                              />
                            </div>
                            <Button onClick={handleAddPOItem} type="button" variant="outline" size="sm" className="h-7 text-xs border-slate-300 bg-white text-slate-700 hover:bg-slate-100 cursor-pointer">
                              Add Item
                            </Button>
                          </div>

                          {/* Live Price Difference Badge */}
                          {poPriceDiffInfo && (
                            <div className="pt-1">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1.5 ${
                                poPriceDiffInfo.diff > 0
                                  ? "bg-amber-50 text-amber-900 border-amber-300"
                                  : poPriceDiffInfo.diff < 0
                                  ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                                  : "bg-slate-100 text-slate-700 border-slate-300"
                              }`}>
                                <span>Last Purchase: <strong>₹{poPriceDiffInfo.lastPrice.toFixed(2)}</strong></span>
                                <span>&bull;</span>
                                <span>New Purchase: <strong>₹{poPriceDiffInfo.newPrice.toFixed(2)}</strong></span>
                                <span>&bull;</span>
                                <span className="font-mono font-bold">
                                  Diff: {poPriceDiffInfo.diff > 0 ? `+₹${poPriceDiffInfo.diff.toFixed(2)} (+${poPriceDiffInfo.pct}%) Higher` : poPriceDiffInfo.diff < 0 ? `-₹${Math.abs(poPriceDiffInfo.diff).toFixed(2)} (${poPriceDiffInfo.pct}%) Lower` : '₹0.00 (No change)'}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Added Items table */}
                        <div className="border border-slate-300 rounded-lg overflow-hidden max-h-48 overflow-y-auto bg-white">
                          <div className="grid grid-cols-12 bg-slate-100 font-bold p-1.5 border-b border-slate-200 text-[10px] text-slate-600 uppercase tracking-wider">
                            <div className="col-span-4">Medicine Item</div>
                            <div className="col-span-1 text-center">Qty</div>
                            <div className="col-span-2 text-right">Last Price</div>
                            <div className="col-span-2 text-right">New Price</div>
                            <div className="col-span-2 text-right">Price Diff</div>
                            <div className="col-span-1 text-right"></div>
                          </div>
                          {poItems.length === 0 ? (
                            <div className="p-4 text-center text-slate-400 text-[10px]">No items added yet. Select a medicine and add items above.</div>
                          ) : (
                            poItems.map((item, index) => {
                              const diffVal = item.diff !== undefined ? item.diff : ((item.purchase_price || 0) - (item.last_purchase_price || 0));
                              return (
                                <div key={item.medicine} className="grid grid-cols-12 p-1.5 border-b border-slate-100 items-center text-[10px] hover:bg-slate-50">
                                  <div className="col-span-4 font-semibold text-slate-800 truncate">{item.medicine}</div>
                                  <div className="col-span-1 text-center font-mono font-bold">{item.quantity}</div>
                                  <div className="col-span-2 text-right font-mono text-slate-500">₹{Number(item.last_purchase_price || 0).toFixed(2)}</div>
                                  <div className="col-span-2 text-right font-mono font-bold text-slate-900">₹{Number(item.purchase_price || 0).toFixed(2)}</div>
                                  <div className="col-span-2 text-right font-mono font-semibold">
                                    <span className={`px-1 py-0.2 rounded text-[9px] ${
                                      diffVal > 0 ? "bg-amber-100 text-amber-800" : diffVal < 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                                    }`}>
                                      {diffVal > 0 ? `+₹${diffVal.toFixed(2)}` : diffVal < 0 ? `-₹${Math.abs(diffVal).toFixed(2)}` : '₹0.00'}
                                    </span>
                                  </div>
                                  <div className="col-span-1 text-right">
                                    <button onClick={() => setPoItems(prev => prev.filter((_, i) => i !== index))} type="button" className="text-rose-600 hover:text-rose-800 cursor-pointer font-medium">
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>

                        {/* Automatic Inventory Stock Adjustment Note */}
                        <div className="bg-indigo-50/80 border border-indigo-200 rounded p-2 text-[10px] text-indigo-900 flex items-center justify-between">
                          <span>
                            <strong>Automatic Stock Adjustment:</strong> Submitting will instantly increment the inventory stock and record purchase batches for all {poItems.length} items.
                          </span>
                          {poItems.length > 0 && (
                            <span className="font-mono font-bold text-indigo-950">
                              Total: ₹{poItems.reduce((acc, i) => acc + ((i.quantity || 0) * (i.purchase_price || 0)), 0).toFixed(2)}
                            </span>
                          )}
                        </div>

                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-8 text-xs cursor-pointer shadow-2xs">
                          Submit Purchase Order &amp; Update Inventory
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* PO Table */}
              <div className="bg-white border border-slate-300 rounded-lg shadow-2xs overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-b from-slate-100 to-slate-200 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px] tracking-wider divide-x divide-slate-300">
                        <th className="py-1.5 px-2.5">PO Reference</th>
                        <th className="py-1.5 px-2.5">Supplier</th>
                        <th className="py-1.5 px-2">Date</th>
                        <th className="py-1.5 px-2.5 text-right">Total Cost</th>
                        <th className="py-1.5 px-2 text-center">Status</th>
                        <th className="py-1.5 px-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs">
                      {purchaseOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            No Purchase Orders logged.
                          </td>
                        </tr>
                      ) : (
                        purchaseOrders.map(po => (
                          <tr key={po.name} className="h-9 hover:bg-amber-50/50 divide-x divide-slate-200 transition-colors">
                            <td className="py-1 px-2.5 font-bold font-mono text-slate-900">{po.name}</td>
                            <td className="py-1 px-2.5 font-medium text-slate-700">{po.supplier}</td>
                            <td className="py-1 px-2 text-slate-600 text-[11px] whitespace-nowrap">
                              {new Date(po.date).toLocaleDateString("en-IN")}
                            </td>
                            <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              ₹{po.total_amount.toLocaleString("en-IN")}
                            </td>
                            <td className="py-1 px-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border inline-block ${
                                po.status === 'Received' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                                po.status === 'Submitted' ? 'bg-indigo-50 text-indigo-700 border-indigo-300 animate-pulse' :
                                'bg-slate-100 text-slate-700 border-slate-300'
                              }`}>
                                {po.status}
                              </span>
                            </td>
                            <td className="py-1 px-2.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {po.status === "Submitted" ? (
                                  <Button
                                    onClick={() => handleOpenGRNModal(po)}
                                    size="xs"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[10px] h-6 px-2.5 shadow-2xs transition-all shrink-0 cursor-pointer"
                                  >
                                    <PackageCheck className="w-3 h-3 mr-1" /> Log Goods Receipt
                                  </Button>
                                ) : (
                                  <>
                                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold flex items-center gap-1 border border-emerald-200 shadow-2xs shrink-0">
                                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Fulfilled
                                    </span>
                                    <Button 
                                      onClick={() => downloadGRNInvoice(po)}
                                      size="xs" 
                                      variant="outline" 
                                      className="h-6 text-[10px] px-2 bg-white border-slate-300 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 shadow-2xs transition-all shrink-0 cursor-pointer"
                                    >
                                      <Download className="w-3 h-3 mr-1 text-slate-400" /> Bill
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* GRN Form Modal */}
            <Dialog open={isGRNModalOpen} onOpenChange={setIsGRNModalOpen}>
              <DialogContent className="max-w-3xl bg-white p-5 rounded-xl border border-slate-300 shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <PackageCheck className="w-4 h-4 text-emerald-600" />
                    Goods Receipt &amp; Batch Registration
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Verify quantities, assign batch numbers &amp; expiry dates to update live inventory. Purchase amounts will be recorded in Finance.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 pt-2 text-xs max-h-[75vh] overflow-y-auto pr-1">
                  {selectedPO && (
                    <div className="flex justify-between bg-slate-100 p-2 rounded border border-slate-200 text-[10px] text-slate-700 font-bold uppercase">
                      <span>PO: {selectedPO.name}</span>
                      <span>Supplier: {selectedPO.supplier}</span>
                    </div>
                  )}

                  {/* Item Table */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden overflow-x-auto bg-white">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-slate-600 divide-x divide-slate-300">
                          <th className="p-1.5 px-2">Medicine</th>
                          <th className="p-1.5 px-2">Batch No. *</th>
                          <th className="p-1.5 px-2">EXP Date (MM-YY) *</th>
                          <th className="p-1.5 px-2 text-center">Qty</th>
                          <th className="p-1.5 px-2 text-right">Price (₹)</th>
                          <th className="p-1.5 px-2 text-right">Rack</th>
                          <th className="p-1.5 px-2 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {grnItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                              No items yet — use the form below to add medicines to this receipt.
                            </td>
                          </tr>
                        ) : grnItems.map((item, index) => (
                          <tr key={index} className="hover:bg-amber-50/40 divide-x divide-slate-200">
                            <td className="p-1.5 px-2 font-semibold text-slate-900 min-w-[120px]">{item.medicine}</td>
                            <td className="p-1.5 px-2">
                              <Input 
                                value={item.batch_number || ""} 
                                onChange={(e) => handleUpdateGRNItem(index, 'batch_number', e.target.value)}
                                className="h-6 text-[10px] w-28 border-slate-300 font-mono uppercase bg-white" 
                              />
                            </td>
                            <td className="p-1.5 px-2">
                              <Input 
                                type="month" value={item.exp_date || ""} 
                                onChange={(e) => handleUpdateGRNItem(index, 'exp_date', e.target.value)}
                                className="h-6 text-[10px] w-28 border-amber-300 bg-amber-50/30 font-mono" 
                              />
                            </td>
                            <td className="p-1.5 px-2 text-center">
                              <Input
                                type="number" min="1" value={item.quantity || ""}
                                onChange={(e) => handleUpdateGRNItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                className="h-6 text-[10px] w-16 border-slate-300 font-mono text-center bg-white"
                              />
                            </td>
                            <td className="p-1.5 px-2 text-right">
                              <Input
                                type="number" min="0" step="0.01" value={item.purchase_price ?? ""}
                                onChange={(e) => {
                                  const p = parseFloat(e.target.value) || 0;
                                  const lp = item.last_purchase_price || 0;
                                  const d = p - lp;
                                  const pc = lp > 0 ? ((d / lp) * 100).toFixed(1) : "0";
                                  setGrnItems(prev => prev.map((it, idx) => idx === index ? { ...it, purchase_price: p, diff: d, pct: pc } : it));
                                }}
                                className="h-6 text-[10px] w-20 border-slate-300 font-mono text-right bg-white ml-auto"
                              />
                              {item.last_purchase_price !== undefined && (
                                <div className="text-[9px] font-mono mt-0.5">
                                  <span className="text-slate-500">Last: ₹{Number(item.last_purchase_price || 0).toFixed(2)}</span>
                                  {item.diff !== undefined && (
                                    <span className={`ml-1 font-bold ${
                                      item.diff > 0 ? "text-amber-700" : item.diff < 0 ? "text-emerald-700" : "text-slate-500"
                                    }`}>
                                      {item.diff > 0 ? `+₹${Number(item.diff).toFixed(2)}` : item.diff < 0 ? `-₹${Math.abs(Number(item.diff)).toFixed(2)}` : '₹0.00'}
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="p-1.5 px-2">
                              <Input 
                                value={item.rack_location || ""} 
                                onChange={(e) => handleUpdateGRNItem(index, 'rack_location', e.target.value)}
                                className="h-6 text-[10px] w-20 border-slate-300 bg-white" 
                              />
                            </td>
                            <td className="p-1.5 px-2 text-center">
                              <button onClick={() => handleRemoveGRNItem(index)} className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Item Row */}
                  <div className="border border-dashed border-indigo-300 bg-indigo-50/50 rounded-lg p-2.5 space-y-1.5">
                    <div className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <PlusCircle className="w-3 h-3" /> Add Medicine to Receipt
                      </div>
                      <span className="text-[9px] text-slate-500 font-normal lowercase">tracks difference with last purchase price</span>
                    </div>
                    <div className="flex flex-wrap gap-2 items-end">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-600 font-semibold uppercase">Medicine</span>
                        <select
                          value={grnAddMedName}
                          onChange={e => {
                            setGrnAddMedName(e.target.value);
                            const targetMed = medicines.find(m => m.medicine_name === e.target.value);
                            if (targetMed) {
                              const p = (targetMed.purchase_price !== undefined && targetMed.purchase_price !== null && targetMed.purchase_price !== "")
                                ? targetMed.purchase_price
                                : (targetMed.batches?.[0]?.purchase_price || "");
                              setGrnAddPrice(p ? String(p) : "");
                            } else {
                              setGrnAddPrice("");
                            }
                          }}
                          className="h-7 text-[10px] rounded border border-slate-300 bg-white px-2 focus:outline-none min-w-[160px]"
                        >
                          <option value="">— Select Medicine —</option>
                          {medicines.filter(m => !m.disabled).map(m => (
                            <option key={m.medicine_name} value={m.medicine_name}>{m.medicine_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-600 font-semibold uppercase">Qty</span>
                        <Input
                          type="number" min="1" value={grnAddQty}
                          onChange={e => setGrnAddQty(e.target.value)}
                          className="h-7 text-[10px] w-20 border-slate-300 font-mono bg-white"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-slate-600 font-semibold uppercase">Purchase Price (₹)</span>
                        <Input
                          type="number" min="0" step="0.01" value={grnAddPrice}
                          onChange={e => setGrnAddPrice(e.target.value)}
                          placeholder={grnAddMedName ? (medicines.find(m=>m.medicine_name===grnAddMedName)?.purchase_price || "0.00") : "0.00"}
                          className="h-7 text-[10px] w-28 border-slate-300 font-mono bg-white"
                        />
                      </div>
                      <Button onClick={handleAddGRNItem} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] h-7 px-3 self-end cursor-pointer shadow-2xs">
                        <Plus className="w-3 h-3 mr-1" /> Add Row
                      </Button>
                    </div>

                    {/* Live Price Difference Badge for GRN */}
                    {grnPriceDiffInfo && (
                      <div className="pt-1">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border inline-flex items-center gap-1.5 ${
                          grnPriceDiffInfo.diff > 0
                            ? "bg-amber-50 text-amber-900 border-amber-300"
                            : grnPriceDiffInfo.diff < 0
                            ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}>
                          <span>Last Purchase: <strong>₹{grnPriceDiffInfo.lastPrice.toFixed(2)}</strong></span>
                          <span>&bull;</span>
                          <span>New Price: <strong>₹{grnPriceDiffInfo.newPrice.toFixed(2)}</strong></span>
                          <span>&bull;</span>
                          <span className="font-mono font-bold">
                            Diff: {grnPriceDiffInfo.diff > 0 ? `+₹${grnPriceDiffInfo.diff.toFixed(2)} (+${grnPriceDiffInfo.pct}%) Higher` : grnPriceDiffInfo.diff < 0 ? `-₹${Math.abs(grnPriceDiffInfo.diff).toFixed(2)} (${grnPriceDiffInfo.pct}%) Lower` : '₹0.00 (No change)'}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Total Summary */}
                  {grnItems.length > 0 && (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-lg px-3.5 py-2">
                      <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        Total Purchase Value
                      </div>
                      <div className="font-bold text-emerald-900 font-mono text-sm">
                        ₹{grnItems.reduce((a, i) => a + ((i.quantity || 0) * (i.purchase_price || 0)), 0).toLocaleString("en-IN", {minimumFractionDigits: 2})}
                      </div>
                    </div>
                  )}

                  <Button onClick={handleLogGRN} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-8 text-xs cursor-pointer shadow-2xs">
                    <PackageCheck className="w-4 h-4 mr-2" />
                    Complete Goods Receipt (Log Batches &amp; Stocks)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Compliance supplier safe reference panel */}
            <div className="lg:col-span-1 space-y-2">
              <div className="bg-slate-100/90 px-3.5 py-1.5 rounded-lg border border-slate-300/80 shadow-2xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-indigo-700 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                        Verified Drug Suppliers
                      </h2>
                      <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-1.5 py-0.2 rounded border border-indigo-200">
                        {suppliers.length}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
                      Statutory licensed distributors
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={openAddSupplierModal} 
                  size="xs" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] h-7 px-2.5 flex items-center gap-1.5 shadow-2xs shrink-0 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Supplier</span>
                  <span className="text-[9px] font-mono bg-indigo-800 text-indigo-100 px-1 py-0.2 rounded border border-indigo-400">Alt + S</span>
                </Button>
              </div>

              <div className="bg-white border border-slate-300 rounded-lg shadow-2xs p-2.5 space-y-2 text-xs">
                {suppliers.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No suppliers registered.
                  </div>
                ) : (
                  suppliers.map((sup, idx) => (
                    <div key={idx} className="p-2 border border-slate-200 rounded-md bg-slate-50/70 hover:bg-indigo-50/30 transition flex justify-between items-center gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-slate-800 text-xs truncate">{sup.name}</strong>
                          {sup.code && <span className="text-[9px] text-slate-500 font-mono">({sup.code})</span>}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block">Lic No: {sup.licNo}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          sup.isNarcotics || sup.type === "Narcotics Lic" || sup.supplierType === "Narcotic"
                            ? "bg-purple-50 text-purple-800 border-purple-200" 
                            : "bg-emerald-50 text-emerald-800 border-emerald-200"
                        }`}>
                          {sup.isNarcotics || sup.type === "Narcotics Lic" || sup.supplierType === "Narcotic" ? "Narcotics Lic" : "Verified"}
                        </span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => openEditSupplierModal(idx)} 
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded transition cursor-pointer" 
                            title="Edit Supplier"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => deleteSupplier(idx)} 
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer" 
                            title="Delete Supplier"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div className="pt-1.5 border-t border-slate-200">
                  <p className="text-[10px] text-slate-500 leading-relaxed italic">
                    * Note: Controlled drugs (e.g., Fentanyl) must only be purchased from suppliers holding a valid NDPS permit. Goods receipts will be audited by the drug inspector.
                  </p>
                </div>
              </div>
            </div>

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

        {/* ========================================================
            TAB: PURCHASE INWARD & STOCK ENTRY (DEDICATED FULL PAGE)
            ======================================================== */}
        <TabsContent value="purchase-inward" className="flex-1 min-h-0 flex flex-col overflow-hidden h-full space-y-2 focus-visible:outline-none">
          <div className="space-y-2 text-xs flex-1 flex flex-col min-h-0 overflow-y-auto pr-0.5">
            {/* Streamlined Invoice Bar (Invoice No, Date, Supplier, GST %, and Row Actions) */}
            <div className="bg-[#f4f8fd] border border-[#bcd2ee] px-3.5 py-2 flex items-center justify-between gap-4 flex-wrap text-xs rounded-md shrink-0 shadow-2xs">
              {/* Left Group: Invoice Details + GST % */}
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-xs shrink-0">Invoice No :</span>
                  <input
                    type="text"
                    value={inwardInvoiceNo}
                    onChange={(e) => setInwardInvoiceNo(e.target.value)}
                    placeholder="e.g. PUR-2026-09-01"
                    className="h-7 w-36 px-2 text-xs font-mono font-bold uppercase bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-xs shrink-0">Invoice Date :</span>
                  <input
                    type="date"
                    value={inwardDate}
                    onChange={(e) => setInwardDate(e.target.value)}
                    className="h-7 w-32 px-2 text-xs font-mono bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600 font-semibold"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-xs shrink-0">Supplier :</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={inwardSupplier}
                      onChange={(e) => setInwardSupplier(e.target.value)}
                      placeholder="Select or enter supplier..."
                      className="h-7 w-48 px-2 text-xs font-bold bg-white border border-slate-300 rounded focus:outline-none focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSupplierSelectModal(true)}
                      className="h-7 px-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-bold cursor-pointer text-xs text-slate-700 shrink-0"
                      title="Select Supplier from List"
                    >
                      ...
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700 text-xs shrink-0">GST % :</span>
                  <select
                    value={inwardGstPct}
                    onChange={(e) => setInwardGstPct(e.target.value)}
                    className="h-7 w-20 text-xs font-mono font-bold rounded border border-slate-300 bg-white px-2 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="0">0%</option>
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                </div>
              </div>

              {/* Right Group: Add Row & Clear Table */}
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddBlankInwardRow}
                  className="h-7 text-xs border-blue-300 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 cursor-pointer text-blue-700 font-bold px-2.5 shadow-2xs"
                >
                  <PlusCircle className="w-3.5 h-3.5 mr-1 text-blue-600" />
                  + Add Row
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setInwardItems([createEmptyInwardRow()])}
                  className="h-7 text-xs border-slate-300 bg-white hover:bg-rose-50 hover:text-rose-700 cursor-pointer text-slate-700 font-semibold px-2.5 shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  Clear Table
                </Button>
              </div>
            </div>

            {/* Inward Bill Items Table (Direct Inline Editing) */}
            <div className="bg-white border border-slate-300 rounded-lg shadow-2xs overflow-visible flex flex-col flex-1 min-h-[220px]">
              <div className="overflow-auto flex-1 min-h-0">
                <table className="w-full text-left border-collapse text-xs select-text">
                  <thead className="sticky top-0 z-10 bg-slate-100 text-slate-800 font-bold text-[11px] tracking-wider border-b border-slate-300">
                    <tr className="divide-x divide-slate-300">
                      <th className="py-2 px-2 text-center w-12">S.No</th>
                      <th className="py-2 px-2 text-center w-28">Item Code</th>
                      <th className="py-2 px-2.5 min-w-[200px]">Medicine Name</th>
                      <th className="py-2 px-2 text-center w-24">HSN</th>
                      <th className="py-2 px-2 text-center w-28">Batch No.</th>
                      <th className="py-2 px-2 text-center w-28">Pack</th>
                      <th className="py-2 px-2 text-center w-32">Expiry</th>
                      <th className="py-2 px-2 text-center w-36">Qty / Unit</th>
                      <th className="py-2 px-2 text-right w-24">Purchase Rate</th>
                      <th className="py-2 px-2 text-right w-20">MRP</th>
                      <th className="py-2 px-2 text-right w-20">Sale Rate</th>
                      <th className="py-2 px-2 text-center w-18">GST %</th>
                      <th className="py-2 px-2.5 text-right w-28">Amount</th>
                      <th className="py-2 px-2 text-center w-16">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(inwardItems.length === 0 ? [createEmptyInwardRow()] : inwardItems).map((item, idx) => {
                      const isSelected = selectedInwardRowIndex === idx;
                      const pPrice = parseFloat(item.purchase_price) || 0;
                      const qty = parseInt(item.quantity, 10) || 0;
                      const lineTotal = Number(item.line_total || (qty * pPrice)).toFixed(2);

                      return (
                        <tr
                          key={item.id || idx}
                          onClick={() => setSelectedInwardRowIndex(idx)}
                          className={`transition divide-x cursor-pointer ${
                            isSelected
                              ? "bg-blue-50/70 divide-blue-200 border-l-4 border-l-blue-500"
                              : idx % 2 === 0
                              ? "bg-white hover:bg-slate-50 divide-slate-200"
                              : "bg-slate-50/50 hover:bg-slate-50 divide-slate-200"
                          }`}
                        >
                          {/* 1. S.No */}
                          <td className={`py-1.5 px-2 text-center font-mono ${isSelected ? "text-blue-800 font-bold" : "text-slate-600"}`}>
                            {idx + 1}
                          </td>

                          {/* 2. Item Code */}
                          <td className="py-1 px-1.5 text-center font-mono">
                            <div className="flex items-center gap-1 justify-center">
                              <input
                                type="text"
                                value={item.item_code || ""}
                                onChange={(e) => handleUpdateInwardRow(idx, "item_code", e.target.value.toUpperCase())}
                                onClick={(e) => {
                                  setSelectedInwardRowIndex(idx);
                                  e.stopPropagation();
                                }}
                                placeholder="MED001"
                                className="w-20 h-7 px-1.5 text-center font-mono font-bold text-xs text-blue-700 rounded border border-slate-300 bg-white focus:border-blue-600 focus:outline-none"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBrowsingRowIndex(idx);
                                  setShowInwardBrowseMedModal(true);
                                }}
                                className="h-7 px-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-bold cursor-pointer text-xs text-slate-700 shrink-0"
                                title="Browse Catalog"
                              >
                                ...
                              </button>
                            </div>
                          </td>

                          {/* 3. Medicine Name (Search & Select Inline) */}
                          <td className="py-1 px-1.5 relative">
                            <div className="relative">
                              <input
                                type="text"
                                value={item.medicine_name || ""}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  handleUpdateInwardRow(idx, "medicine_name", val);
                                  setActiveInwardSearchRow(idx);
                                  setInwardRowSearchQuery(val);
                                }}
                                onFocus={() => {
                                  setSelectedInwardRowIndex(idx);
                                  setActiveInwardSearchRow(idx);
                                  setInwardRowSearchQuery(item.medicine_name || "");
                                }}
                                onBlur={() => {
                                  setTimeout(() => {
                                    setActiveInwardSearchRow(null);
                                  }, 250);
                                }}
                                placeholder="Type medicine name..."
                                className="w-full h-7 px-2 text-xs font-bold rounded border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-none placeholder:font-normal placeholder:text-slate-400"
                              />
                              {item.generic_name && item.generic_name !== item.medicine_name && (
                                <div className="text-[10px] text-slate-500 truncate max-w-[220px] font-normal leading-tight mt-0.5">
                                  {item.dosage_form || "Tablet"} • {item.generic_name}
                                </div>
                              )}

                              {/* Autocomplete Dropdown */}
                              {activeInwardSearchRow === idx && inwardRowSearchQuery.trim().length >= 1 && (
                                <div className="absolute left-0 top-full mt-1 bg-white rounded-lg shadow-2xl border border-slate-300 z-50 max-h-56 overflow-y-auto divide-y divide-slate-100 min-w-[280px] max-w-[340px]">
                                  {medicines
                                    .filter(m => !m.disabled && (
                                      (m.medicine_name && m.medicine_name.toLowerCase().includes(inwardRowSearchQuery.toLowerCase())) ||
                                      (m.generic_name && m.generic_name.toLowerCase().includes(inwardRowSearchQuery.toLowerCase())) ||
                                      (m.item_code && m.item_code.toLowerCase().includes(inwardRowSearchQuery.toLowerCase()))
                                    ))
                                    .slice(0, 10)
                                    .map((m) => {
                                      const lastP = (m.purchase_price !== undefined && m.purchase_price !== null && m.purchase_price !== "")
                                        ? Number(m.purchase_price)
                                        : (m.batches?.[0]?.purchase_price ? Number(m.batches[0].purchase_price) : 0);
                                      return (
                                        <div
                                          key={m.name || m.id || m.medicine_name}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSelectMedForRow(idx, m);
                                          }}
                                          className="p-2 px-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs"
                                        >
                                          <div>
                                            <div className="font-bold text-slate-800">{m.medicine_name}</div>
                                            <div className="text-[10px] text-slate-500">{m.dosage_form || "Tablet"} • {m.generic_name}</div>
                                          </div>
                                          <div className="text-right font-mono text-[11px]">
                                            <span className="text-slate-500">{lastP > 0 ? `₹${lastP.toFixed(2)}` : ""}</span>
                                            <div className="font-bold text-blue-700">MRP: ₹{Number(m.mrp || m.selling_price || 0).toFixed(2)}</div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  <div
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      handleAddCustomMedForRow(idx, inwardRowSearchQuery);
                                    }}
                                    className="p-2 text-center bg-slate-50 hover:bg-emerald-50 text-xs text-emerald-800 font-bold cursor-pointer border-t border-slate-200"
                                  >
                                    + Use &quot;{inwardRowSearchQuery}&quot; as Item
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* 4. HSN Code (Editable) */}
                          <td className="py-1 px-1.5 text-center font-mono">
                            <input
                              type="text"
                              value={item.hsn_code || item.hsn || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                handleUpdateInwardRow(idx, "hsn_code", val);
                                handleUpdateInwardRow(idx, "hsn", val);
                              }}
                              onClick={(e) => {
                                setSelectedInwardRowIndex(idx);
                                e.stopPropagation();
                              }}
                              placeholder="30049099"
                              className="w-20 h-7 px-1.5 text-center font-mono font-medium text-xs rounded border border-slate-300 bg-white text-slate-800 focus:border-blue-600 focus:outline-none"
                            />
                          </td>

                          {/* 5. Batch No (Editable) */}
                          <td className="py-1 px-1.5 text-center">
                            <input
                              type="text"
                              value={item.batch_number || ""}
                              onChange={(e) => handleUpdateInwardRow(idx, "batch_number", e.target.value.toUpperCase())}
                              onClick={(e) => {
                                setSelectedInwardRowIndex(idx);
                                e.stopPropagation();
                              }}
                              placeholder="e.g. BATCH01"
                              className="w-24 h-7 px-1.5 text-center font-mono font-bold text-xs uppercase rounded border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-none"
                            />
                          </td>

                          {/* 5. Pack (Editable) */}
                          <td className="py-1 px-1.5 text-center">
                            <input
                              type="text"
                              value={item.pack_size || ""}
                              onChange={(e) => handleUpdateInwardRow(idx, "pack_size", e.target.value)}
                              onClick={(e) => {
                                setSelectedInwardRowIndex(idx);
                                e.stopPropagation();
                              }}
                              placeholder="10 Tablets"
                              className="w-24 h-7 px-1.5 text-center text-xs font-semibold rounded border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-none"
                            />
                          </td>

                          {/* 6. Expiry Date (Editable, Month & Year Selectors) */}
                          <td className="py-1 px-1 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <select
                                value={item.exp_date ? (item.exp_date.split("-")[1] || "") : ""}
                                onChange={(e) => {
                                  const m = e.target.value;
                                  const curY = item.exp_date ? (item.exp_date.split("-")[0] || `${new Date().getFullYear() + 2}`) : `${new Date().getFullYear() + 2}`;
                                  handleUpdateInwardRow(idx, "exp_date", m ? `${curY}-${m}` : "");
                                }}
                                onClick={(e) => {
                                  setSelectedInwardRowIndex(idx);
                                  e.stopPropagation();
                                }}
                                className="h-7 px-1 text-xs font-mono font-bold rounded border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-none"
                              >
                                <option value="">MM</option>
                                {["01","02","03","04","05","06","07","08","09","10","11","12"].map(m => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                              <select
                                value={item.exp_date ? (item.exp_date.split("-")[0] || "") : ""}
                                onChange={(e) => {
                                  const y = e.target.value;
                                  const curM = item.exp_date ? (item.exp_date.split("-")[1] || "12") : "12";
                                  handleUpdateInwardRow(idx, "exp_date", y ? `${y}-${curM}` : "");
                                }}
                                onClick={(e) => {
                                  setSelectedInwardRowIndex(idx);
                                  e.stopPropagation();
                                }}
                                className="h-7 px-1 text-xs font-mono font-bold rounded border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-none"
                              >
                                <option value="">YYYY</option>
                                {Array.from({ length: 16 }, (_, i) => 2025 + i).map(yr => (
                                  <option key={yr} value={String(yr)}>{yr}</option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* 7. Qty / Unit (Editable) */}
                          <td className="py-1 px-1.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min="1"
                                value={item.quantity !== undefined ? item.quantity : ""}
                                onChange={(e) => handleUpdateInwardRow(idx, "quantity", e.target.value)}
                                onClick={(e) => {
                                  setSelectedInwardRowIndex(idx);
                                  e.stopPropagation();
                                }}
                                placeholder="1"
                                className="w-14 h-7 px-1.5 text-center font-mono font-bold text-xs rounded border border-slate-300 bg-white text-slate-900 focus:border-blue-600 focus:outline-none"
                              />
                              <select
                                value={item.purchase_unit || "Strip"}
                                onChange={(e) => handleUpdateInwardRow(idx, "purchase_unit", e.target.value)}
                                onClick={(e) => {
                                  setSelectedInwardRowIndex(idx);
                                  e.stopPropagation();
                                }}
                                className="h-7 px-1 text-[11px] font-semibold rounded border border-slate-300 bg-slate-50 text-slate-800 focus:border-blue-600 focus:outline-none"
                              >
                                {PURCHASE_UNIT_OPTIONS.map(unit => (
                                  <option key={unit} value={unit}>{unit}</option>
                                ))}
                              </select>
                            </div>
                          </td>

                          {/* 8. Purchase Rate (Editable) */}
                          <td className="py-1 px-1.5 text-right font-mono font-bold">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.purchase_price !== undefined ? item.purchase_price : ""}
                              onChange={(e) => handleUpdateInwardRow(idx, "purchase_price", e.target.value)}
                              onClick={(e) => {
                                setSelectedInwardRowIndex(idx);
                                e.stopPropagation();
                              }}
                              placeholder="0.00"
                              className="w-20 h-7 px-1.5 text-right font-mono font-bold rounded border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                            />
                          </td>

                          {/* 9. MRP (Editable) */}
                          <td className="py-1 px-1.5 text-right font-mono">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.mrp !== undefined ? item.mrp : ""}
                              onChange={(e) => handleUpdateInwardRow(idx, "mrp", e.target.value)}
                              onClick={(e) => {
                                setSelectedInwardRowIndex(idx);
                                e.stopPropagation();
                              }}
                              placeholder="0.00"
                              className="w-18 h-7 px-1.5 text-right font-mono rounded border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                            />
                          </td>

                          {/* 10. Sale Rate (Editable) */}
                          <td className="py-1 px-1.5 text-right font-mono">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.sale_rate !== undefined ? item.sale_rate : (item.selling_price || "")}
                              onChange={(e) => handleUpdateInwardRow(idx, "sale_rate", e.target.value)}
                              onClick={(e) => {
                                setSelectedInwardRowIndex(idx);
                                e.stopPropagation();
                              }}
                              placeholder="0.00"
                              className="w-18 h-7 px-1.5 text-right font-mono rounded border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                            />
                          </td>

                          {/* 11. GST % (Editable) */}
                          <td className="py-1 px-1 text-center font-mono">
                            <select
                              value={item.gst_pct !== undefined ? item.gst_pct : 12}
                              onChange={(e) => handleUpdateInwardRow(idx, "gst_pct", e.target.value)}
                              onClick={(e) => {
                                setSelectedInwardRowIndex(idx);
                                e.stopPropagation();
                              }}
                              className="h-7 px-1 text-center font-mono font-bold rounded border border-slate-300 bg-white text-slate-900 text-xs focus:border-blue-600 focus:outline-none"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                              <option value="28">28%</option>
                            </select>
                          </td>

                          {/* 12. Amount / Line Total */}
                          <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900">
                            ₹{Number(lineTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* 13. Action */}
                          <td className="py-1.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveInwardItem(idx);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 cursor-pointer transition shadow-2xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom Section: 3 Divided Boxes (Selected Item Summary | Invoice Totals | Actions) */}
            {(() => {
              const activeIdx = (selectedInwardRowIndex >= 0 && selectedInwardRowIndex < inwardItems.length)
                ? selectedInwardRowIndex
                : 0;
              const selItem = inwardItems[activeIdx] || null;
              const stockUpdated = selItem ? (parseInt(selItem.quantity, 10) || 0) : (parseInt(inwardQty, 10) || 0);
              const selUnit = selItem?.purchase_unit || inwardPurchaseUnit || "Strip";
              const selUnitsPerPack = selItem ? (selItem.units_per_pack || extractUnitsPerPack(selItem.pack_size, 10)) : (parseInt(inwardUnitsPerPack, 10) || extractUnitsPerPack(inwardPackSize, 10));
              const selTotUnits = stockUpdated * selUnitsPerPack;
              const selUnitDerived = getDerivedUnitLabel(selItem?.dosage_form || inwardDosageForm, selItem?.pack_size || inwardPackSize);
              const oldRate = selItem
                ? (Number(selItem.last_purchase_price) || Number(selItem.old_purchase_price) || 0)
                : 0;
              const newRate = selItem
                ? (parseFloat(selItem.purchase_price) || 0)
                : (parseFloat(inwardPrice) || 0);
              const rateDiff = newRate - oldRate;

              const subTotal = inwardItems.reduce((acc, it) => acc + (parseFloat(it.line_total) || (it.quantity * it.purchase_price) || 0), 0);
              const discAmt = (subTotal * (parseFloat(inwardBillDiscountPct) || 0)) / 100;
              const addChg = parseFloat(inwardAdditionalCharges) || 0;
              const frt = parseFloat(inwardFreight) || 0;
              const rnd = parseFloat(inwardRoundOff) || 0;
              const grandTot = Math.max(0, subTotal - discAmt + addChg + frt + rnd);
              const totalUnitsInBill = inwardItems.reduce((acc, it) => {
                const q = parseInt(it.quantity, 10) || 0;
                const upp = it.units_per_pack || extractUnitsPerPack(it.pack_size, 10);
                return acc + (q * upp);
              }, 0);

              return (
                <div className="flex flex-col lg:flex-row items-stretch gap-2.5 shrink-0">
                  {/* Box 1: Selected Item Summary Values */}
                  <div className="flex-1 bg-[#f8faff] rounded-lg border border-[#c7d9f1] p-2.5 px-3.5 shadow-2xs flex items-center">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
                      {/* Stock Added */}
                      <div>
                        <div className="text-[10px] font-semibold text-slate-500 mb-0.5">Stock Added</div>
                        <div className="h-7 px-2.5 bg-[#e6f7ef] border border-[#a3e6cd] text-[#065f46] font-bold font-mono rounded flex items-center text-xs shadow-2xs whitespace-nowrap overflow-hidden text-ellipsis">
                          +{stockUpdated} {selUnit} ({selTotUnits} {selUnitDerived})
                        </div>
                      </div>

                      {/* Old Purchase Rate */}
                      <div>
                        <div className="text-[10px] font-semibold text-slate-500 mb-0.5">Old Purchase Rate</div>
                        <div className="h-7 px-2.5 bg-[#fefce8] border border-[#fef08a] text-[#854d0e] font-bold font-mono rounded flex items-center text-xs shadow-2xs whitespace-nowrap">
                          ₹ {oldRate > 0 ? oldRate.toFixed(2) : "0.00"}
                        </div>
                      </div>

                      {/* New Purchase Rate */}
                      <div>
                        <div className="text-[10px] font-semibold text-slate-500 mb-0.5">New Purchase Rate</div>
                        <div className="h-7 px-2.5 bg-[#fefce8] border border-[#fef08a] text-[#854d0e] font-bold font-mono rounded flex items-center text-xs shadow-2xs whitespace-nowrap">
                          ₹ {newRate.toFixed(2)}
                        </div>
                      </div>

                      {/* Rate Difference */}
                      <div>
                        <div className="text-[10px] font-semibold text-slate-500 mb-0.5">Rate Difference</div>
                        <div className={`h-7 px-2.5 font-bold font-mono rounded flex items-center text-xs shadow-2xs whitespace-nowrap ${
                          rateDiff < 0
                            ? 'bg-[#fee2e2] border border-[#fca5a5] text-[#b91c1c]'
                            : rateDiff > 0
                              ? 'bg-[#dcfce7] border border-[#86efac] text-[#15803d]'
                              : 'bg-slate-50 border border-slate-200 text-slate-700'
                        }`}>
                          ₹ {rateDiff < 0 ? `(${Math.abs(rateDiff).toFixed(2)})` : rateDiff.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Box 2: Invoice Totals */}
                  <div className="shrink-0 bg-white rounded-lg border border-[#c7d9f1] p-2.5 px-3.5 shadow-2xs flex items-center gap-3">
                    {/* Items */}
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 mb-0.5 text-center">Items</div>
                      <div className="h-7 min-w-[48px] px-2.5 bg-[#f8fafc] border border-slate-300 text-slate-800 font-bold font-mono rounded flex items-center justify-center text-xs shadow-2xs">
                        {inwardItems.length}
                      </div>
                    </div>

                    {/* Total Units */}
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 mb-0.5 text-center">Total Units</div>
                      <div className="h-7 min-w-[56px] px-2.5 bg-[#f8fafc] border border-slate-300 text-slate-800 font-bold font-mono rounded flex items-center justify-center text-xs shadow-2xs">
                        {totalUnitsInBill > 0 ? totalUnitsInBill : inwardItems.reduce((acc, it) => acc + (parseInt(it.quantity, 10) || 0), 0)}
                      </div>
                    </div>

                    {/* Invoice Total */}
                    <div>
                      <div className="text-[10px] font-semibold text-slate-500 mb-0.5 text-center">Invoice Total</div>
                      <div className="h-7 px-3 bg-[#eff6ff] border border-[#bfdbfe] text-[#1d4ed8] font-black font-mono rounded flex items-center text-xs shadow-2xs whitespace-nowrap">
                        ₹ {grandTot.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {/* Box 3: Actions */}
                  <div className="shrink-0 bg-white rounded-lg border border-[#c7d9f1] p-2.5 px-3 shadow-2xs flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTabChange('dashboard')}
                      className="h-8 px-3.5 text-xs font-semibold bg-white hover:bg-slate-50 border border-slate-300 rounded-md text-slate-700 cursor-pointer shadow-2xs transition"
                    >
                      Back
                    </button>

                    <button
                      type="button"
                      onClick={handleConfirmPurchaseInward}
                      disabled={isSubmittingInward || inwardItems.length === 0}
                      className="h-8 px-4 text-xs bg-[#065f46] hover:bg-[#044e39] text-white font-bold rounded-md cursor-pointer flex items-center gap-1.5 shadow-2xs transition disabled:opacity-50 whitespace-nowrap"
                    >
                      {isSubmittingInward ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <span>Add to Inventory</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}
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
                            <div className="text-slate-600">{formatExpiry(batch.exp_date)}</div>
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
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 font-serif flex items-center gap-1.5">
                  <Sliders className="w-5 h-5 text-amber-500" /> Stock Adjustment
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Adjust current stock, add inward batch, or correct physical count in popup
                </p>
              </div>
              <button 
                onClick={() => { setShowAdjustModal(false); setAdjustingMed(null); }} 
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs">
              {!adjustingMed ? (
                <div className="space-y-1">
                  <Label className="font-bold text-slate-700">Select Medicine to Adjust *</Label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Type medicine name (e.g. Dolo 650, Paracetamol)..."
                      value={adjustMedSearch}
                      onChange={(e) => setAdjustMedSearch(e.target.value)}
                      className="w-full h-8 pl-8 pr-2.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                    {adjustMedSearch.trim() && (
                      <div className="absolute left-0 top-full mt-1 w-full max-h-48 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-200 z-50 divide-y divide-slate-100">
                        {medicines.filter(m => (m.medicine_name || "").toLowerCase().includes(adjustMedSearch.toLowerCase())).slice(0, 8).map(m => (
                          <div
                            key={m.medicine_name}
                            onClick={() => {
                              setAdjustingMed(m);
                              setAdjustMedSearch("");
                              setAdjustmentData({
                                medicine: m.medicine_name,
                                batch_number: (m.batches && m.batches.length > 0) ? m.batches[0].batch_number : "",
                                adjustment_type: "Add Stock",
                                quantity: 10,
                                purchase_price: m.purchase_price !== undefined ? String(m.purchase_price) : "",
                                reason: "",
                                remarks: ""
                              });
                            }}
                            className="p-2 hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{m.medicine_name}</div>
                              <div className="text-[10px] text-slate-500">{m.generic_name} &bull; Rack: {m.rack_location || "N/A"}</div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">{m.stock} units</span>
                              <div className="text-[10px] text-slate-500">Last: ₹{Number(m.purchase_price || 0).toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label className="font-bold text-slate-700">Selected Medicine</Label>
                    <button
                      type="button"
                      onClick={() => setAdjustingMed(null)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer underline"
                    >
                      Change Medicine
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded">
                    <div>
                      <div className="font-semibold text-slate-800">{adjustingMed.medicine_name}</div>
                      <div className="text-[10px] text-slate-500">{adjustingMed.generic_name}</div>
                    </div>
                    <div className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                      Current: {adjustingMed.stock || 0} units
                    </div>
                  </div>
                </div>
              )}

              {adjustingMed ? (
                <>
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
                        <option value="Add Stock">+ Add Stock</option>
                        <option value="Reduce Stock">- Reduce Stock</option>
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
                        className="h-8 text-xs border-slate-200 font-mono font-bold"
                      />
                      <div className="flex items-center gap-1 pt-1">
                        {[10, 50, 80, 100].map(amt => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setAdjustmentData(prev => ({ ...prev, quantity: amt }))}
                            className={`text-[9px] px-1.5 py-0.5 rounded border font-mono cursor-pointer ${
                              adjustmentData.quantity === amt ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            +{amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Live Resulting Stock Preview */}
                  <div className="bg-emerald-50 border border-emerald-300 rounded p-2 text-xs flex items-center justify-between">
                    <span className="text-emerald-800 font-semibold">Resulting Stock Preview:</span>
                    <span className="font-mono font-extrabold text-emerald-950 text-sm">
                      {adjustmentData.adjustment_type === "Add Stock" || adjustmentData.adjustment_type === "Returned"
                        ? (Number(adjustingMed.stock) || 0) + (parseInt(adjustmentData.quantity) || 0)
                        : adjustmentData.adjustment_type === "Physical Count Correction"
                        ? (parseInt(adjustmentData.quantity) || 0)
                        : Math.max(0, (Number(adjustingMed.stock) || 0) - (parseInt(adjustmentData.quantity) || 0))
                      } units
                    </span>
                  </div>

                  {/* Purchase Price Input & Price Difference */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="font-bold text-slate-500">Purchase Price (₹)</Label>
                      <span className="text-[10px] text-slate-500">
                        Last Purchase: ₹{Number(adjustingMed.purchase_price || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={String(adjustingMed.purchase_price || "0.00")}
                        value={adjustmentData.purchase_price ?? ""}
                        onChange={(e) => setAdjustmentData(prev => ({ ...prev, purchase_price: e.target.value }))}
                        className="h-8 text-xs font-mono border-slate-200"
                      />
                      {adjustmentData.purchase_price !== undefined && adjustmentData.purchase_price !== "" && (
                        <div className={`px-2 py-1 rounded text-[10px] font-semibold border shrink-0 ${
                          (parseFloat(adjustmentData.purchase_price) || 0) > (Number(adjustingMed.purchase_price) || 0)
                            ? "bg-amber-50 text-amber-900 border-amber-300"
                            : (parseFloat(adjustmentData.purchase_price) || 0) < (Number(adjustingMed.purchase_price) || 0)
                            ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}>
                          Diff: {(parseFloat(adjustmentData.purchase_price) || 0) > (Number(adjustingMed.purchase_price) || 0)
                            ? `+₹${((parseFloat(adjustmentData.purchase_price) || 0) - (Number(adjustingMed.purchase_price) || 0)).toFixed(2)}`
                            : (parseFloat(adjustmentData.purchase_price) || 0) < (Number(adjustingMed.purchase_price) || 0)
                            ? `-₹${Math.abs((parseFloat(adjustmentData.purchase_price) || 0) - (Number(adjustingMed.purchase_price) || 0)).toFixed(2)}`
                            : '₹0.00 (Same)'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="font-bold text-slate-500">Reason / Notes *</Label>
                    <Input
                      placeholder="e.g. Expired batch replacement / Stock inward"
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
                </>
              ) : (
                <div className="p-4 text-center text-slate-400 italic bg-slate-50 rounded border border-dashed border-slate-200">
                  Please search and select a medicine above to view batch details and adjust stock.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t pt-3">
              <Button 
                onClick={() => { setShowAdjustModal(false); setAdjustingMed(null); }} 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs border-slate-200 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                disabled={!adjustingMed}
                onClick={async () => {
                  if (!adjustingMed) return;
                  if (userRole === "Store Manager" && adjustmentData.adjustment_type !== "Add Stock") {
                    showToast("Access Denied: Store Managers can only add stock.", "error");
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
                      purchase_price: adjustmentData.purchase_price,
                      reason: adjustmentData.reason,
                      remarks: adjustmentData.remarks || "",
                      exp_date: adjustmentData.new_batch_exp || "",
                      performed_by: pharmacistName
                    });
                    showToast("Stock adjustment saved successfully!", "success");
                    setShowAdjustModal(false);
                    setAdjustingMed(null);
                    await loadAllData();
                  } catch {
                    showToast("Stock adjustment failed", "error");
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8 px-4 cursor-pointer"
              >
                Save Adjustment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Purchase Type Modal Helper */}
      {showAddPurchaseTypeModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-blue-700 text-white px-3.5 py-2.5 flex items-center justify-between">
              <h3 className="font-bold text-xs">Add New Purchase Type</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddPurchaseTypeModal(false);
                  setNewPurchaseTypeName("");
                }}
                className="text-white hover:text-rose-200 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-3.5 space-y-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Purchase Type Name</Label>
                <input
                  type="text"
                  value={newPurchaseTypeName}
                  onChange={(e) => setNewPurchaseTypeName(e.target.value)}
                  placeholder="e.g. Sample / Trial Inward, Institutional Tender..."
                  className="w-full h-8 px-2.5 text-xs rounded border border-slate-300 mt-1 focus:border-blue-600 focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newPurchaseTypeName.trim()) {
                      e.preventDefault();
                      const trimmed = newPurchaseTypeName.trim();
                      if (!inwardPurchaseTypesList.includes(trimmed)) {
                        setInwardPurchaseTypesList(prev => [...prev, trimmed]);
                      }
                      setInwardPurchaseType(trimmed);
                      setNewPurchaseTypeName("");
                      setShowAddPurchaseTypeModal(false);
                      showToast(`Added purchase type: ${trimmed}`, "success");
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddPurchaseTypeModal(false);
                    setNewPurchaseTypeName("");
                  }}
                  className="h-7.5 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!newPurchaseTypeName.trim()}
                  onClick={() => {
                    const trimmed = newPurchaseTypeName.trim();
                    if (trimmed) {
                      if (!inwardPurchaseTypesList.includes(trimmed)) {
                        setInwardPurchaseTypesList(prev => [...prev, trimmed]);
                      }
                      setInwardPurchaseType(trimmed);
                      setNewPurchaseTypeName("");
                      setShowAddPurchaseTypeModal(false);
                      showToast(`Added purchase type: ${trimmed}`, "success");
                    }
                  }}
                  className="h-7.5 text-xs bg-blue-700 hover:bg-blue-800 text-white font-bold"
                >
                  Save Purchase Type
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Medicine Category / Schedule Modal Helper */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-blue-700 text-white px-3.5 py-2.5 flex items-center justify-between">
              <h3 className="font-bold text-xs">Add New Medicine Category / Schedule</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddCategoryModal(false);
                  setNewCategoryName("");
                }}
                className="text-white hover:text-rose-200 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-3.5 space-y-3">
              <div>
                <Label className="text-xs font-bold text-slate-700">Category / Schedule Name</Label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Schedule H, Sleeping Pills, High Alert..."
                  className="w-full h-8 px-2.5 text-xs rounded border border-slate-300 mt-1 focus:border-blue-600 focus:outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newCategoryName.trim()) {
                      e.preventDefault();
                      const trimmed = newCategoryName.trim();
                      if (!inwardCategoriesList.includes(trimmed)) {
                        setInwardCategoriesList(prev => [...prev, trimmed]);
                      }
                      setInwardCategory(trimmed);
                      setNewCategoryName("");
                      setShowAddCategoryModal(false);
                      showToast(`Added category: ${trimmed}`, "success");
                    }
                  }}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryName("");
                  }}
                  className="h-7.5 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={!newCategoryName.trim()}
                  onClick={() => {
                    const trimmed = newCategoryName.trim();
                    if (trimmed) {
                      if (!inwardCategoriesList.includes(trimmed)) {
                        setInwardCategoriesList(prev => [...prev, trimmed]);
                      }
                      setInwardCategory(trimmed);
                      setNewCategoryName("");
                      setShowAddCategoryModal(false);
                      showToast(`Added category: ${trimmed}`, "success");
                    }
                  }}
                  className="h-7.5 text-xs bg-blue-700 hover:bg-blue-800 text-white font-bold"
                >
                  Save Category
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Browse Medicine Helper Modal */}
      {showInwardBrowseMedModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-slate-300">
            <div className="bg-blue-700 text-white px-3 py-2 flex items-center justify-between">
              <h3 className="font-bold text-xs">Select Medicine for Inward</h3>
              <button
                type="button"
                onClick={() => setShowInwardBrowseMedModal(false)}
                className="text-white hover:text-rose-200 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-3">
              <input
                type="text"
                value={inwardBrowseQuery}
                onChange={(e) => setInwardBrowseQuery(e.target.value)}
                placeholder="Search medicine catalog..."
                className="w-full h-8 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded focus:border-blue-600 focus:outline-none mb-2"
                autoFocus
              />
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded">
                {medicines
                  .filter(m =>
                    !inwardBrowseQuery ||
                    m.medicine_name.toLowerCase().includes(inwardBrowseQuery.toLowerCase()) ||
                    (m.generic_name && m.generic_name.toLowerCase().includes(inwardBrowseQuery.toLowerCase()))
                  )
                  .slice(0, 30)
                  .map((m) => (
                    <div
                      key={m.name || m.medicine_name}
                      onClick={() => {
                        const targetRow = browsingRowIndex !== null && browsingRowIndex >= 0 ? browsingRowIndex : 0;
                        handleSelectMedForRow(targetRow, m);
                        setShowInwardBrowseMedModal(false);
                        setInwardBrowseQuery("");
                        setBrowsingRowIndex(null);
                      }}
                      className="p-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{m.medicine_name}</div>
                        <div className="text-[10px] text-slate-500">{m.brand || m.supplier || "Generics"} • Rack: {m.rack_location || "A-01"}</div>
                      </div>
                      <div className="text-right font-mono font-bold text-blue-700">
                        Last Pur: ₹{Number(m.purchase_price || m.batches?.[0]?.purchase_price || 0).toFixed(2)}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Selection Modal Helper */}
      {showSupplierSelectModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden border border-slate-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-blue-700 text-white px-4 py-2.5 flex items-center justify-between">
              <h3 className="font-bold text-xs flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Select Supplier
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowSupplierSelectModal(false);
                  setSupplierSelectSearch("");
                }}
                className="text-white hover:text-rose-200 font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={supplierSelectSearch}
                  onChange={(e) => setSupplierSelectSearch(e.target.value)}
                  placeholder="Search supplier by name, code, or license..."
                  className="flex-1 h-8 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded focus:border-blue-600 focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowSupplierSelectModal(false);
                    openAddSupplierModal();
                  }}
                  className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" /> New Supplier
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded">
                {suppliers
                  .filter(s => {
                    if (!supplierSelectSearch.trim()) return true;
                    const q = supplierSelectSearch.toLowerCase();
                    return (
                      (s.name || s.supplierName || "").toLowerCase().includes(q) ||
                      (s.code || s.supplierCode || "").toLowerCase().includes(q) ||
                      (s.licNo || s.drugLicenseNumber || "").toLowerCase().includes(q) ||
                      (s.contactPerson || "").toLowerCase().includes(q)
                    );
                  })
                  .map((sup, idx) => (
                    <div
                      key={sup.code || sup.supplierCode || idx}
                      onClick={() => {
                        setInwardSupplier(sup.name || sup.supplierName || "");
                        setShowSupplierSelectModal(false);
                        setSupplierSelectSearch("");
                      }}
                      className="p-2.5 hover:bg-blue-50 cursor-pointer flex items-center justify-between text-xs transition"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{sup.name || sup.supplierName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {sup.code || sup.supplierCode || `SUP-${1001 + idx}`}
                          </span>
                          {sup.isNarcotics && (
                            <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-800">
                              Narcotics Lic
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {sup.licNo || sup.drugLicenseNumber ? `Lic: ${sup.licNo || sup.drugLicenseNumber}` : "Registered Supplier"}
                          {sup.mobileNumber ? ` • Phone: ${sup.mobileNumber}` : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInwardSupplier(sup.name || sup.supplierName || "");
                          setShowSupplierSelectModal(false);
                          setSupplierSelectSearch("");
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-xs cursor-pointer shadow-2xs"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                {suppliers.length === 0 && (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No suppliers found. Click &quot;New Supplier&quot; to add one.
                  </div>
                )}
              </div>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowSupplierSelectModal(false);
                  setSupplierSelectSearch("");
                }}
                className="h-7.5 text-xs"
              >
                Close
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
                    const otcBillRecord = {
                      invoiceNumber: response.invoiceNumber,
                      patientName: otcCustomerName || "Walk-in Customer",
                      patientMobile: otcCustomerMobile || "N/A",
                      doctorName: "Self (OTC)",
                      items: receiptItems,
                      dispenseItems: otcBasket,
                      totalVal: totalVal,
                      paymentStatus: "Paid",
                      paymentMethod: otcPaymentMethod,
                      paymentMode: "Direct OTC Sale (Paid at Counter)",
                      isPaidAtPharmacy: true,
                      pharmacistName: pharmacistName,
                      date: new Date().toLocaleString("en-IN")
                    };
                    setLatestDispenseRecord(otcBillRecord);
                    if (typeof window !== "undefined") {
                      try {
                        const stored = localStorage.getItem("hospital_pharmacy_bills");
                        const cur = stored ? JSON.parse(stored) : [];
                        const cleanCur = cur.filter(b => b && b.invoiceNumber && b.invoiceNumber !== otcBillRecord.invoiceNumber && !b.invoiceNumber.startsWith("INV-2026-0929-") && b.patientName !== "Rajesh Kumar" && b.patientName !== "Sunita Verma" && b.patientName !== "Vikram Malhotra");
                        localStorage.setItem("hospital_pharmacy_bills", JSON.stringify([otcBillRecord, ...cleanCur]));
                      } catch {}
                    }
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
                            {b.batch_number} (Stock: {b.current_stock || 0} | Exp: {formatExpiry(b.exp_date)})
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
                    ${latestDispenseRecord.paymentStatus === "Paid" || (latestDispenseRecord.isPaidAtPharmacy && latestDispenseRecord.paymentStatus !== "Unpaid")
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                      : latestDispenseRecord.paymentStatus === "ForwardedToBilling"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"}`}
                  >
                    {latestDispenseRecord.paymentStatus === "Paid" || (latestDispenseRecord.isPaidAtPharmacy && latestDispenseRecord.paymentStatus !== "Unpaid") ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        PAID AT PHARMACY COUNTER
                      </>
                    ) : latestDispenseRecord.paymentStatus === "ForwardedToBilling" ? (
                      <>
                        <ArrowRight className="w-3.5 h-3.5" />
                        FORWARDED TO CENTRAL BILLING DESK (DUE AT BILLING)
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        BILL GENERATED — PAYMENT DUE (UNPAID)
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
                {latestDispenseRecord.doctorName && !latestDispenseRecord.doctorName.toLowerCase().includes("walk-in") && !latestDispenseRecord.doctorName.toLowerCase().includes("otc") && !latestDispenseRecord.doctorName.toLowerCase().includes("general") ? (
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Prescribed Doctor</span>
                    <span className="font-semibold text-slate-900">{latestDispenseRecord.doctorName}</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Customer Type</span>
                    <span className="font-semibold text-slate-900">Direct Walk-In (OTC)</span>
                  </div>
                )}
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
                    ${latestDispenseRecord.paymentStatus === "Paid" || (latestDispenseRecord.isPaidAtPharmacy && latestDispenseRecord.paymentStatus !== "Unpaid")
                      ? "border-emerald-500 text-emerald-700 bg-emerald-50" 
                      : latestDispenseRecord.paymentStatus === "ForwardedToBilling"
                      ? "border-amber-500 text-amber-700 bg-amber-50"
                      : "border-rose-500 text-rose-700 bg-rose-50"}`}
                  >
                    {latestDispenseRecord.paymentStatus === "Paid" || (latestDispenseRecord.isPaidAtPharmacy && latestDispenseRecord.paymentStatus !== "Unpaid")
                      ? "PAID & DISPENSED" 
                      : latestDispenseRecord.paymentStatus === "ForwardedToBilling"
                      ? "FORWARDED TO CENTRAL BILLING"
                      : "PAYMENT DUE (UNPAID)"}
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
                    latestDispenseRecord.paymentStatus || (latestDispenseRecord.isPaidAtPharmacy ? "Paid" : "ForwardedToBilling")
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
                                            {formatExpiry(medBatch.exp_date || m.expiry_date || m.exp_date || "2028-12")}
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
                      ref={workdeskSearchInputRef}
                      placeholder="Type medicine name, generic name, or barcode..."
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
                  <kbd className="hidden sm:inline-block ml-1 text-[10px] font-sans font-semibold bg-indigo-500/80 text-white px-1.5 py-0.5 rounded border border-indigo-400">Ctrl + ↵</kbd>
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
                  <div className="font-bold text-slate-900 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span>Collect & Dispense (Pay at Pharmacy Desk)</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded">Immediate</span>
                    </div>
                    <kbd className="text-[10px] font-sans font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">Alt + C</kbd>
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
                          <option value="Cash + UPI">Cash + UPI (Split Payment)</option>
                          <option value="Card">Credit / Debit Card</option>
                          <option value="Insurance">Insurance / TPA</option>
                          <option value="Credit">Hospital Credit</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* Option 2: Outside Purchase */}
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
                  <div className="font-bold text-slate-900 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span>Outside Purchase (₹0)</span>
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded">Zero Bill</span>
                    </div>
                    <kbd className="text-[10px] font-sans font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">Alt + O</kbd>
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
                <kbd className="hidden sm:inline-block ml-1 text-[10px] font-sans font-semibold bg-black/20 text-white px-1.5 py-0.5 rounded border border-white/20">Ctrl + ↵</kbd>
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

      {/* Download & Export Pharmacy Reports Modal (Alt + D) */}
      {showDownloadReportsModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 px-6 border-b border-slate-100 bg-slate-50/80 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif">Download &amp; Export Pharmacy Reports</h3>
                  <p className="text-[11px] text-slate-500">Select what data to export and choose your preferred format (Alt + D)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDownloadReportsModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                1. Select Report Type (Use ↑ / ↓ Arrow Keys or Click to choose):
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Master Inventory */}
                <div
                  onClick={() => setSelectedReportType("inventory")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                    selectedReportType === "inventory"
                      ? "bg-indigo-50/80 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-indigo-600" /> Master Stock &amp; Inventory
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                      {medicines.filter(m => !m.disabled).length} meds
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Full catalog with batch numbers, rack locations, valuation, purchase prices &amp; MRPs.
                  </p>
                </div>

                {/* 2. Low Stock & Reorder */}
                <div
                  onClick={() => setSelectedReportType("low_stock")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                    selectedReportType === "low_stock"
                      ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Low Stock &amp; Reorder
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                      {purchaseRecommendations.length} reorders
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Medicines below minimum threshold, safety buffer &amp; suggested PO quantities.
                  </p>
                </div>

                {/* 3. Expiring Medicines */}
                <div
                  onClick={() => setSelectedReportType("expiring")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                    selectedReportType === "expiring"
                      ? "bg-rose-50/80 border-rose-500 ring-2 ring-rose-500/20 shadow-xs"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rose-600" /> Expiring Batches Risk
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                      {metrics.expiringCount} batches
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Batches expiring in upcoming months with days remaining and distributor details.
                  </p>
                </div>

                {/* 4. Statutory Drug Register */}
                <div
                  onClick={() => setSelectedReportType("drug_register")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                    selectedReportType === "drug_register"
                      ? "bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 shadow-xs"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-purple-600" /> Statutory Drug Register
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                      Govt Compliance
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Schedule H, H1, X &amp; NDPS Narcotics compliance format with stamp and sign verification.
                  </p>
                </div>

                {/* 5. Daily Sales & Dispensing */}
                <div
                  onClick={() => setSelectedReportType("daily_sales")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                    selectedReportType === "daily_sales"
                      ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Dispensing &amp; Sales Log
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      {drugRegister.length} records
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Detailed breakdown of patient consultations, OTC sales, and cash/UPI settlement logs.
                  </p>
                </div>

                {/* 6. Sales Returns */}
                <div
                  onClick={() => setSelectedReportType("returns")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col justify-between gap-2 ${
                    selectedReportType === "returns"
                      ? "bg-cyan-50/80 border-cyan-500 ring-2 ring-cyan-500/20 shadow-xs"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-600" /> Sales Returns &amp; Refunds
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-cyan-100 text-cyan-800 px-1.5 py-0.5 rounded">
                      {salesReturnsList.length} returns
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Return slips, restocked inventory counts, refund cash flow, and reason logs.
                  </p>
                </div>
              </div>

              {/* Dynamic Filter Controls based on Selection */}
              {selectedReportType === "expiring" && (
                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200/80 space-y-1.5 animate-in fade-in duration-150">
                  <Label className="text-[11px] font-bold text-rose-900">Expiring Window Timeframe</Label>
                  <div className="flex gap-2">
                    {[30, 60, 90, 180].map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setReportExpiringDays(days)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition ${
                          reportExpiringDays === days
                            ? "bg-rose-600 text-white border-rose-700 shadow-2xs"
                            : "bg-white text-rose-800 border-rose-200 hover:bg-rose-100/60"
                        }`}
                      >
                        Next {days} Days
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedReportType === "drug_register" && (
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200/80 space-y-1.5 animate-in fade-in duration-150">
                  <Label className="text-[11px] font-bold text-purple-900">Drug Schedule Filter</Label>
                  <select
                    value={reportScheduleCategory}
                    onChange={(e) => setReportScheduleCategory(e.target.value)}
                    className="h-8 text-xs w-full rounded-lg border border-purple-200 bg-white px-2.5 font-semibold text-purple-900 focus:outline-none"
                  >
                    <option value="All">All Schedules (Master Register)</option>
                    <option value="Schedule H">Statutory Schedule H</option>
                    <option value="Schedule H1">Statutory Schedule H1 (Sleeping Pills)</option>
                    <option value="Schedule X">Statutory Schedule X (Narcotics)</option>
                    <option value="Controlled Drug">Controlled Drug Register</option>
                    <option value="OTC">OTC Inventory Register</option>
                    <option value="Regular Medicine">Regular Medicine Register</option>
                  </select>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
              <span className="text-[11px] text-slate-500">
                Press <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-800">Enter</kbd> to export or <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold text-slate-800">Esc</kbd> to cancel.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDownloadReportsModal(false)}
                  className="h-9 text-xs border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium px-4 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleExecuteDownloadReport}
                  className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 rounded-lg shadow-sm gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Download / Export Report
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Guide Modal */}
      <ShortcutsGuideModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      {/* Global Bottom Pharmacy Module Navigation Bar - Sticky at bottom for all tabs except purchase inward */}
      {activeTab !== "purchase-inward" && (
        <div className="shrink-0 z-30 w-full mt-1 bg-slate-900 text-white rounded-lg border border-slate-800 p-1 shadow-md">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 w-full">
            {[
              { id: "dashboard", label: "Billing", shortcut: "Alt + 1" },
              { id: "inventory", label: "Inventory", shortcut: "Alt + 2" },
              { id: "dispensing", label: "Prescription Queue", shortcut: "Alt + 3" },
              { id: "registers", label: "Compliance Records", shortcut: "Alt + 4" },
              { id: "logistics", label: "Purchase & Receiving", shortcut: "Alt + 5" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange?.(tab.id)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer w-full text-center ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[9px] font-mono px-1 rounded ${
                  activeTab === tab.id ? "bg-blue-800 text-white" : "bg-slate-950 text-slate-400"
                }`}>
                  {tab.shortcut}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
