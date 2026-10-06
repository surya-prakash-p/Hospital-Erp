"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Search, Plus, Trash2, Edit3, ShoppingCart, ShoppingBag, 
  RotateCcw, Printer, CheckCircle, Calendar, Pill, DollarSign,
  AlertCircle, ChevronDown, ArrowRight, User, Stethoscope,
  Clock, ShieldAlert, PackageCheck, FileText, X,
  Percent, RefreshCw, Receipt, Download, Check, Keyboard, PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Dedicated clean printable receipt function via hidden iframe
export function printPharmacyInvoiceReceipt(record) {
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

    const paymentStatus = record.paymentStatus || (record.isPaidAtPharmacy ? "Paid" : "ForwardedToBilling");
    const isPaid = paymentStatus === "Paid";
    const isForwarded = paymentStatus === "ForwardedToBilling";
    const isUnpaid = !isPaid && !isForwarded;
    const hasDoctor = Boolean(record.doctorName && record.doctorName.trim() && !record.doctorName.toLowerCase().includes("walk-in") && !record.doctorName.toLowerCase().includes("otc") && !record.doctorName.toLowerCase().includes("general"));

    const rowsHtml = (record.items || []).map((item) => {
      const isOutside = item.source === "Outside Purchase" || item.dispense_status === "Outside Purchase";
      const qty = item.dispensed_qty || item.requested_qty || item.qty || 1;
      const unitPr = item.unit_price || item.price || item.selling_price || 0;
      const lineTotal = isOutside ? 0 : (item.line_total !== undefined ? item.line_total : (qty * unitPr));
      const batchStr = isOutside ? "Outside Sourced" : (item.batch_number || item.batch || "Standard Batch");

      return `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 11px;">
            ${item.medicine_name}
            ${isOutside ? '<br/><span style="font-size: 9px; color: #94a3b8;">Outside Purchase</span>' : ''}
          </td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 11px;">${qty}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: center; font-size: 10px; color: #64748b; font-family: monospace;">${batchStr}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 11px; font-weight: 700; font-family: monospace;">
            ${isOutside ? '₹0.00' : '₹' + Number(lineTotal).toFixed(2)}
          </td>
        </tr>
      `;
    }).join("");

    const badgeClass = isPaid ? 'badge-paid' : isForwarded ? 'badge-fwd' : 'badge-unpaid';
    const badgeText = isPaid ? 'PAID AT PHARMACY COUNTER' : isForwarded ? 'FORWARDED TO CENTRAL BILLING' : 'BILL GENERATED — PAYMENT DUE (UNPAID)';
    const stampText = isPaid ? 'PAID & DISPENSED' : isForwarded ? 'FORWARDED TO BILLING' : 'PAYMENT DUE — UNPAID';
    const stampColor = isPaid ? '#16a34a' : isForwarded ? '#d97706' : '#dc2626';

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Thangam Hospital - Invoice #${record.invoiceNumber || 'POS'}</title>
          <style>
            @page { size: auto; margin: 8mm; }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; background: #fff; padding: 16px; font-size: 11px; line-height: 1.4; max-width: 580px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 12px; }
            .hosp-title { font-size: 18px; font-weight: 900; letter-spacing: 0.5px; color: #0f172a; }
            .hosp-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
            .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: 800; text-transform: uppercase; margin-top: 6px; }
            .badge-paid { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
            .badge-fwd { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
            .badge-unpaid { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; margin-bottom: 12px; font-size: 10.5px; }
            .meta-item { display: flex; justify-content: space-between; }
            .meta-lbl { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 9px; }
            .meta-val { font-weight: 700; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            th { background: #f1f5f9; padding: 6px 8px; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
            .summary-box { border-top: 2px solid #0f172a; padding-top: 8px; margin-bottom: 12px; }
            .sum-row { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
            .grand-total { font-size: 14px; font-weight: 900; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px; }
            .stamp { text-align: center; border: 2px dashed ${stampColor}; color: ${stampColor}; padding: 6px 12px; border-radius: 6px; font-weight: 900; font-size: 12px; letter-spacing: 1px; width: fit-content; margin: 10px auto; }
            .footer { text-align: center; font-size: 9.5px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 8px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hosp-title">THANGAM HOSPITAL</div>
            <div class="hosp-sub">123 Health City Road, Coimbatore - 641012 | Phone: +91 422 2345678</div>
            <div class="hosp-sub">GSTIN: 33AAAAA1111A1Z1 | Pharmacy DL: DL-COI-90823H</div>
            <div class="badge ${badgeClass}">
              ${badgeText}
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-item"><span class="meta-lbl">Invoice No:</span> <span class="meta-val">${record.invoiceNumber || 'INV-POS'}</span></div>
            <div class="meta-item"><span class="meta-lbl">Date & Time:</span> <span class="meta-val">${record.date || new Date().toLocaleString('en-IN')}</span></div>
            <div class="meta-item"><span class="meta-lbl">Patient:</span> <span class="meta-val">${record.patientName || 'Walk-in Customer'}</span></div>
            <div class="meta-item"><span class="meta-lbl">Payment Mode:</span> <span class="meta-val">${record.paymentMethod || 'CASH'}</span></div>
            ${hasDoctor ? `
            <div class="meta-item"><span class="meta-lbl">Prescribed Doctor:</span> <span class="meta-val">${record.doctorName}</span></div>
            ` : `
            <div class="meta-item"><span class="meta-lbl">Customer Type:</span> <span class="meta-val">Direct Walk-In (OTC)</span></div>
            `}
            <div class="meta-item"><span class="meta-lbl">Dispensed By:</span> <span class="meta-val">${record.pharmacistName || 'Rahul Sharma, RPh'}</span></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Medicine Item</th>
                <th style="text-align: center; width: 40px;">Qty</th>
                <th style="text-align: center; width: 90px;">Batch</th>
                <th style="text-align: right; width: 80px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="summary-box">
            ${record.discountAmount > 0 ? `
            <div class="sum-row"><span>Subtotal:</span> <span>₹${Number(record.subtotal || record.totalVal).toFixed(2)}</span></div>
            <div class="sum-row" style="color: #16a34a;"><span>Discount:</span> <span>-₹${Number(record.discountAmount).toFixed(2)}</span></div>
            ` : ''}
            <div class="sum-row grand-total">
              <span>GRAND TOTAL (incl. GST):</span>
              <span>₹${Number(record.totalVal || 0).toFixed(2)}</span>
            </div>
            ${record.paymentMethod === "CASH + UPI" || record.isSplitPayment ? `
            <div class="sum-row" style="color: #475569; font-size: 10px; margin-top: 4px; padding-top: 2px; border-top: 1px dotted #cbd5e1;">
              <span>• Cash Received:</span>
              <span style="font-weight: 700;">₹${Number(record.splitCash || 0).toFixed(2)}</span>
            </div>
            <div class="sum-row" style="color: #475569; font-size: 10px;">
              <span>• UPI Received:</span>
              <span style="font-weight: 700;">₹${Number(record.splitUpi || 0).toFixed(2)}</span>
            </div>
            ` : ''}
            ${isUnpaid ? `
            <div class="sum-row" style="color: #64748b; font-size: 10px;">
              <span>Amount Received:</span>
              <span>₹0.00</span>
            </div>
            <div class="sum-row" style="color: #dc2626; font-weight: 800; font-size: 12px; border-top: 1px dashed #cbd5e1; padding-top: 4px; margin-top: 2px;">
              <span>TOTAL DUE (UNPAID):</span>
              <span>₹${Number(record.totalVal || 0).toFixed(2)}</span>
            </div>
            ` : ''}
          </div>

          <div class="stamp">
            ${stampText}
          </div>

          <div class="footer">
            Computer Generated Tax Invoice • Thank you for choosing Thangam Hospital!
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body && document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 250);
  } catch (err) {
    console.error("Print receipt error:", err);
  }
}

export default function PharmacyPOSView({
  medicines = [],
  queue = [],
  userRole = "Administrator",
  pharmacistName = "Rahul Sharma, RPh",
  activeTab = "dashboard",
  handleTabChange,
  onAddNewMedicine,
  onOpenOTCSale,
  onOpenSalesReturn,
  onOpenAddBatch,
  onOpenExport,
  onOpenShortcuts,
  onAddSupplier,
  onGeneratePOs,
  onOpenPurchaseInward,
  showToast,
  selectedWalkIn = null,
  onClearWalkIn,
  onSelectQueueItem,
  executeDispensing,
  executeOutsidePurchase,
  loadAllData,
  updateWalkIn,
  saveInvoiceToProfile,
  createPharmacyAuditLog,
  recordFinanceTransaction,
  setLatestDispenseRecord,
  setShowDispenseReceiptModal
}) {
  // 1. POS Search & Autocomplete States
  const [posSearchQuery, setPosSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [highlightedSearchIndex, setHighlightedSearchIndex] = useState(0);
  const searchInputRef = useRef(null);

  const searchResults = useMemo(() => {
    if (!posSearchQuery.trim()) return [];
    const q = posSearchQuery.trim().toLowerCase();
    return medicines.filter(m => !m.disabled && (
      (m.medicine_name && m.medicine_name.toLowerCase().includes(q)) ||
      (m.generic_name && m.generic_name.toLowerCase().includes(q)) ||
      (m.brand && m.brand.toLowerCase().includes(q)) ||
      (m.barcode && m.barcode.toLowerCase().includes(q)) ||
      (m.batch_number && m.batch_number.toLowerCase().includes(q))
    )).slice(0, 12);
  }, [posSearchQuery, medicines]);

  useEffect(() => {
    setHighlightedSearchIndex(0);
  }, [posSearchQuery]);
  const patientInputRef = useRef(null);
  const doctorInputRef = useRef(null);
  const discountInputRef = useRef(null);
  const invoiceInputRef = useRef(null);
  const remarksInputRef = useRef(null);

  // 2. POS Billing Table Items State
  const [billingItems, setBillingItems] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);

  // Default focus to pharmacy search input when mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Return focus to pharmacy search bar if user clicks on empty page / no active input or button touched
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const target = e.target;
      if (!target) return;
      const interactiveEl = target.closest("input, select, textarea, button, [role='button'], a, [contenteditable='true'], .dialog-content");
      if (!interactiveEl) {
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener("click", handleGlobalClick);
    return () => document.removeEventListener("click", handleGlobalClick);
  }, []);

  // 3. Patient & Doctor Details State (Walk-In has no doctor; Hospital Prescription has doctor)
  const [patientName, setPatientName] = useState("Walk-in Customer");
  const [patientMobile, setPatientMobile] = useState("");
  const [patientUHID, setPatientUHID] = useState("");
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [isHospitalPrescription, setIsHospitalPrescription] = useState(false);
  const [doctorName, setDoctorName] = useState("");

  const [billDiscountPct, setBillDiscountPct] = useState(0);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [nextOrderDays, setNextOrderDays] = useState(30);
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [billPaymentStatus, setBillPaymentStatus] = useState("PAID");
  const [splitCashAmount, setSplitCashAmount] = useState("");
  const [splitUpiAmount, setSplitUpiAmount] = useState("");

  // 4. Auxiliary Modals for Action Bar
  const [showSubstituteModal, setShowSubstituteModal] = useState(false);
  const [substituteItemIndex, setSubstituteItemIndex] = useState(null);

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [calcFlatDiscount, setCalcFlatDiscount] = useState("");
  const [calcPctDiscount, setCalcPctDiscount] = useState("");

  const [showServiceItemModal, setShowServiceItemModal] = useState(false);
  const [serviceItemName, setServiceItemName] = useState("");
  const [serviceItemPrice, setServiceItemPrice] = useState("");
  const [serviceItemGst, setServiceItemGst] = useState(18);

  const [showMoreDetailsModal, setShowMoreDetailsModal] = useState(false);
  const [detailItemIndex, setDetailItemIndex] = useState(null);

  // Search Container Ref for Click Outside
  const searchContainerRef = useRef(null);

  // View Bills & Settle Modal States
  const [showViewBillsModal, setShowViewBillsModal] = useState(false);
  const [billsFilterStatus, setBillsFilterStatus] = useState("ALL"); // "ALL" | "PAID" | "UNPAID" | "CENTRAL BILLING"
  const [billsSearchQuery, setBillsSearchQuery] = useState("");
  const [settlingBill, setSettlingBill] = useState(null);
  const [settlePaymentMode, setSettlePaymentMode] = useState("Cash");
  const [savedBillsList, setSavedBillsList] = useState([]);

  // Deduplicate and filter out any demo data or duplicate bills
  const sanitizeBillsList = (bills) => {
    if (!Array.isArray(bills)) return [];
    const valid = bills.filter(b => 
      b && 
      b.invoiceNumber && 
      !b.invoiceNumber.startsWith("INV-2026-0929-") && 
      b.patientName !== "Rajesh Kumar" &&
      b.patientName !== "Sunita Verma" &&
      b.patientName !== "Vikram Malhotra" &&
      !b.isDemo
    );
    const seen = new Map();
    valid.forEach(b => {
      seen.set(b.invoiceNumber, b);
    });
    return Array.from(seen.values());
  };

  // Load Saved Bills from localStorage (strictly authentic bills, no demo data, no duplicates)
  const loadSavedBills = () => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("hospital_pharmacy_bills");
      const parsed = stored ? JSON.parse(stored) : [];
      const cleanBills = sanitizeBillsList(parsed);
      localStorage.setItem("hospital_pharmacy_bills", JSON.stringify(cleanBills));
      setSavedBillsList(cleanBills);
    } catch {
      setSavedBillsList([]);
    }
  };

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Load saved bills on mount
  useEffect(() => {
    loadSavedBills();
  }, []);

  // Export Bills to CSV
  const handleExportBillsToCSV = () => {
    if (savedBillsList.length === 0) {
      showToast?.("No bills to export", "info");
      return;
    }
    const headers = [
      "Invoice Number",
      "Date",
      "Patient Name",
      "Patient Mobile",
      "Patient UHID",
      "Doctor",
      "Items Count",
      "Items Summary",
      "Subtotal (INR)",
      "Discount (INR)",
      "Net GST (INR)",
      "Grand Total (INR)",
      "Payment Status",
      "Payment Mode",
      "Pharmacist"
    ];

    const rows = savedBillsList.map(bill => {
      const itemsSummary = (bill.items || []).map(i => `${i.medicine_name} (x${i.dispensed_qty || i.qty || 1})`).join("; ");
      return [
        `"${(bill.invoiceNumber || "").replace(/"/g, '""')}"`,
        `"${(bill.date || "").replace(/"/g, '""')}"`,
        `"${(bill.patientName || "").replace(/"/g, '""')}"`,
        `"${(bill.patientMobile || "").replace(/"/g, '""')}"`,
        `"${(bill.patientUHID || "").replace(/"/g, '""')}"`,
        `"${(bill.doctorName || "").replace(/"/g, '""')}"`,
        (bill.items || []).length,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        Number(bill.subtotal || bill.totalVal || 0).toFixed(2),
        Number(bill.discountAmount || 0).toFixed(2),
        Number(bill.netGst || 0).toFixed(2),
        Number(bill.totalVal || 0).toFixed(2),
        `"${(bill.paymentStatus || (bill.isPaidAtPharmacy ? "Paid" : "ForwardedToBilling")).replace(/"/g, '""')}"`,
        `"${(bill.paymentMode || bill.paymentMethod || "").replace(/"/g, '""')}"`,
        `"${(bill.pharmacistName || pharmacistName || "").replace(/"/g, '""')}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pharmacy_invoices_register_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.("Bills exported successfully to CSV", "success");
  };

  // Settle Bill Handler
  const handleConfirmSettleBill = async (billToSettle, mode = "Cash") => {
    if (!billToSettle) return;
    try {
      const stored = localStorage.getItem("hospital_pharmacy_bills");
      const curBills = stored ? JSON.parse(stored) : [];
      const updatedBills = sanitizeBillsList(curBills).map(b => {
        if (b.invoiceNumber === billToSettle.invoiceNumber) {
          return {
            ...b,
            paymentStatus: "Paid",
            isPaidAtPharmacy: true,
            paymentMode: "Paid at Pharmacy Counter",
            paymentMethod: mode,
            settledAt: new Date().toLocaleString("en-IN"),
            settledBy: pharmacistName
          };
        }
        return b;
      });
      localStorage.setItem("hospital_pharmacy_bills", JSON.stringify(updatedBills));
      setSavedBillsList(updatedBills);

      // Record in dept payments
      const storedPayments = localStorage.getItem("hospital_dept_payments");
      const deptPayments = storedPayments ? JSON.parse(storedPayments) : [];
      deptPayments.unshift({
        id: `dp-pharm-settle-${Date.now()}`,
        walkInId: billToSettle.invoiceNumber,
        patientName: billToSettle.patientName,
        mobile: billToSettle.patientMobile,
        department: "Pharmacy",
        description: `Settled Bill ${billToSettle.invoiceNumber} (${(billToSettle.items || []).map(i => i.medicine_name).join(", ")})`,
        amount: Number(billToSettle.totalVal || 0),
        method: mode,
        date: new Date().toISOString().split("T")[0],
        status: "Paid"
      });
      localStorage.setItem("hospital_dept_payments", JSON.stringify(deptPayments));

      // Record in finance ledger
      const rxTx = {
        id: `tx-settle-${billToSettle.invoiceNumber}-${Date.now()}`,
        title: `Settled Pharmacy Bill — ${billToSettle.patientName}`,
        type: "Income",
        category: "Pharmacy Income",
        amount: Number(billToSettle.totalVal || 0),
        method: mode,
        date: new Date().toISOString().split("T")[0],
        notes: `Bill Settled: ${billToSettle.invoiceNumber} | Collected via ${mode}`
      };
      recordFinanceTransaction?.(rxTx).catch(() => null);

      // Record in audit log
      createPharmacyAuditLog?.({
        action: "Bill Settled",
        patient: billToSettle.patientName,
        details: `Invoice ${billToSettle.invoiceNumber} marked Settled/Paid via ${mode} (₹${Number(billToSettle.totalVal || 0).toFixed(2)})`,
        performed_by: pharmacistName
      }).catch(() => null);

      showToast?.(`Bill ${billToSettle.invoiceNumber} successfully settled via ${mode}!`, "success");
      setSettlingBill(null);
    } catch {
      showToast?.("Failed to settle bill", "error");
    }
  };

  // Initialize Invoice No and Date
  useEffect(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    setInvoiceDate(`${day}/${month}/${year}`);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setInvoiceNumber(`INV-${year}-${randomSuffix}`);
  }, []);

  // Sync with selectedWalkIn if coming from Prescriptions Queue
  useEffect(() => {
    if (selectedWalkIn) {
      setPatientName(selectedWalkIn.patient_name || "Patient");
      setPatientMobile(selectedWalkIn.mobile_number || selectedWalkIn.phone || "");
      setPatientUHID(selectedWalkIn.patient || selectedWalkIn.patient_id || selectedWalkIn.uhid || selectedWalkIn.name || "");
      if (selectedWalkIn.doctor) {
        setDoctorName(selectedWalkIn.doctor);
        setIsHospitalPrescription(true);
      } else {
        setDoctorName("");
        setIsHospitalPrescription(false);
      }

      // Parse doctor prescription if available
      if (selectedWalkIn.prescription && medicines.length > 0) {
        const cleanStr = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const lines = selectedWalkIn.prescription.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const parsed = [];

        lines.forEach(line => {
          let medName = line.split(/[-(,\d]/)[0].trim();
          if (!medName) medName = line;
          const matchedMed = medicines.find(m => cleanStr(m.medicine_name).includes(cleanStr(medName)) || cleanStr(medName).includes(cleanStr(m.medicine_name)));

          const qtyMatch = line.match(/(?:qty|quantity|x|count|:)\s*(\d+)/i) || line.match(/(\d+)\s*(?:tabs|tablets|capsules|strips|units|bottles)/i);
          const prescribedQty = qtyMatch ? parseInt(qtyMatch[1], 10) : 10;

          const sp = matchedMed ? Number(matchedMed.selling_price || matchedMed.mrp || 25) : 25;
          const mrp = matchedMed ? Number(matchedMed.mrp || matchedMed.selling_price || 30) : 30;
          const purPr = matchedMed ? Number(matchedMed.purchase_price || 18) : 18;
          const margin = mrp > 0 ? (((mrp - purPr) / mrp) * 100).toFixed(1) : "20.0";
          const gst = matchedMed ? Number(matchedMed.gst || 12.0) : 12.0;

          parsed.push({
            id: `item-${Date.now()}-${Math.random()}`,
            medicine_id: matchedMed?.name || matchedMed?.id || "",
            medicine_name: matchedMed?.medicine_name || medName,
            brand: matchedMed?.brand || "",
            generic_name: matchedMed?.generic_name || "",
            strength: matchedMed?.strength || "",
            dosage_form: matchedMed?.dosage_form || "Tablet",
            category: matchedMed?.category || "Regular Medicine",
            batch: matchedMed?.batch_number || "BT-9041",
            expiry: matchedMed?.expiry_date ? matchedMed.expiry_date.substring(2, 7).replace("-", "/") : "12/27",
            margin_pct: parseFloat(margin) || 20.0,
            discount_pct: 0,
            qty: prescribedQty,
            loose: 0,
            pack_size: matchedMed?.pack_size || 10,
            selling_price: sp,
            mrp: mrp,
            cess_pct: 0,
            gst_pct: gst,
            stock: matchedMed?.stock || 100,
            source: "In-House"
          });
        });

        if (parsed.length > 0) {
          setBillingItems(parsed);
        }
      }
    } else {
      setPatientName("Walk-in Customer");
      setPatientMobile("");
      setPatientUHID("");
      setDoctorName("");
      setIsHospitalPrescription(false);
    }
  }, [selectedWalkIn, medicines]);

  // Calculations for Billing Table
  const tableCalculations = useMemo(() => {
    let subtotal = 0;
    let totalGst = 0;
    let totalCess = 0;
    let totalItemsCount = 0;
    let totalQtyCount = 0;

    const itemsWithTotals = billingItems.map((item) => {
      const packSize = Number(item.pack_size) || 10;
      const fullPacks = Number(item.qty) || 0;
      const looseUnits = Number(item.loose) || 0;
      
      // Total effective units billed
      const effectiveQty = fullPacks + (looseUnits > 0 ? looseUnits / packSize : 0);
      const sp = Number(item.selling_price) || 0;
      const discPct = Number(item.discount_pct) || 0;
      const cessPct = Number(item.cess_pct) || 0;
      const gstPct = Number(item.gst_pct) || 12.0;

      // Base SP Line Total after item discount
      const baseLineTotal = item.source === "Outside Purchase" ? 0 : effectiveQty * sp * (1 - discPct / 100);
      
      // GST is calculated as inclusive in SP
      const netGstAmount = item.source === "Outside Purchase" ? 0 : baseLineTotal * (gstPct / (100 + gstPct));
      const cessAmount = item.source === "Outside Purchase" ? 0 : baseLineTotal * (cessPct / 100);
      const lineFinalTotal = item.source === "Outside Purchase" ? 0 : baseLineTotal + cessAmount;

      subtotal += baseLineTotal;
      totalGst += netGstAmount;
      totalCess += cessAmount;
      totalItemsCount += 1;
      totalQtyCount += fullPacks + (looseUnits > 0 ? 1 : 0);

      return {
        ...item,
        effectiveQty,
        netGstAmount,
        cessAmount,
        lineFinalTotal
      };
    });

    const billDiscountAmount = subtotal * (Number(billDiscountPct || 0) / 100);
    const grandTotal = Math.max(0, subtotal - billDiscountAmount + totalCess);

    return {
      itemsWithTotals,
      subtotal,
      totalGst,
      totalCess,
      billDiscountAmount,
      grandTotal,
      totalItemsCount,
      totalQtyCount
    };
  }, [billingItems, billDiscountPct]);

  // Add Medicine from Autocomplete Search / Quick Add
  const handleAddMedicineToBill = (med, customSource = "In-House") => {
    if (!med) return;
    const purPr = Number(med.purchase_price || 18);
    const mrp = Number(med.mrp || med.selling_price || 30);
    const sp = Number(med.selling_price || med.mrp || 25);
    const margin = mrp > 0 ? (((mrp - purPr) / mrp) * 100).toFixed(1) : "20.0";
    const gst = Number(med.gst || 12.0);

    const newItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      medicine_id: med.name || med.id || "",
      medicine_name: med.medicine_name || "Medicine",
      brand: med.brand || "",
      generic_name: med.generic_name || "",
      strength: med.strength || "",
      dosage_form: med.dosage_form || "Tablet",
      category: med.category || "Regular Medicine",
      batch: med.batch_number || "BT-9021",
      expiry: med.expiry_date ? med.expiry_date.substring(2, 7).replace("-", "/") : "12/27",
      margin_pct: parseFloat(margin) || 20.0,
      discount_pct: 0,
      qty: 1,
      loose: 0,
      pack_size: med.pack_size || 10,
      selling_price: sp,
      mrp: mrp,
      cess_pct: 0,
      gst_pct: gst,
      stock: med.stock || 50,
      source: customSource
    };

    setBillingItems(prev => [...prev, newItem]);
    setPosSearchQuery("");
    setShowSearchDropdown(false);
    setSelectedRowIndex(billingItems.length);
    showToast?.(`Added ${newItem.medicine_name} to bill`, "success");
  };

  // Update specific field on row item
  const handleUpdateRowField = (index, field, value) => {
    setBillingItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        let parsed = value;
        if (["qty", "loose", "discount_pct", "selling_price", "mrp", "cess_pct", "margin_pct"].includes(field)) {
          parsed = parseFloat(value) || 0;
          if (field === "qty" && parsed < 0) parsed = 0;
        }
        return { ...item, [field]: parsed };
      }
      return item;
    }));
  };

  // Delete Row from table
  const handleDeleteRow = (index) => {
    const itemToDelete = billingItems[index];
    setBillingItems(prev => prev.filter((_, idx) => idx !== index));
    if (selectedRowIndex >= billingItems.length - 1) {
      setSelectedRowIndex(billingItems.length - 2);
    }
    if (itemToDelete) {
      showToast?.(`Removed ${itemToDelete.medicine_name}`, "info");
    }
  };

  // Substitute Action
  const handleOpenSubstitute = (index) => {
    const targetIdx = typeof index === 'number' && index >= 0 ? index : (selectedRowIndex >= 0 ? selectedRowIndex : 0);
    if (billingItems.length === 0 || !billingItems[targetIdx]) {
      showToast?.("Please add or select a medicine to find substitutes", "error");
      return;
    }
    setSubstituteItemIndex(targetIdx);
    setShowSubstituteModal(true);
  };

  const handleApplySubstitute = (subMed) => {
    if (substituteItemIndex === null || !billingItems[substituteItemIndex]) return;
    const purPr = Number(subMed.purchase_price || 18);
    const mrp = Number(subMed.mrp || subMed.selling_price || 30);
    const sp = Number(subMed.selling_price || subMed.mrp || 25);
    const margin = mrp > 0 ? (((mrp - purPr) / mrp) * 100).toFixed(1) : "20.0";
    const gst = Number(subMed.gst || 12.0);

    setBillingItems(prev => prev.map((it, idx) => {
      if (idx === substituteItemIndex) {
        return {
          ...it,
          medicine_id: subMed.name || subMed.id || "",
          medicine_name: subMed.medicine_name,
          brand: subMed.brand || "",
          generic_name: subMed.generic_name || "",
          strength: subMed.strength || "",
          dosage_form: subMed.dosage_form || "Tablet",
          category: subMed.category || "Regular Medicine",
          batch: subMed.batch_number || "BT-9021",
          expiry: subMed.expiry_date ? subMed.expiry_date.substring(2, 7).replace("-", "/") : "12/27",
          margin_pct: parseFloat(margin) || 20.0,
          selling_price: sp,
          mrp: mrp,
          gst_pct: gst,
          stock: subMed.stock || 50
        };
      }
      return it;
    }));

    setShowSubstituteModal(false);
    showToast?.(`Substituted with ${subMed.medicine_name}`, "success");
  };

  // Calculate Discount Apply
  const handleApplyCalculatedDiscount = () => {
    if (calcPctDiscount !== "") {
      const pct = Math.min(100, Math.max(0, parseFloat(calcPctDiscount) || 0));
      setBillDiscountPct(pct);
      showToast?.(`Applied ${pct}% bill discount`, "success");
    } else if (calcFlatDiscount !== "") {
      const flat = Math.max(0, parseFloat(calcFlatDiscount) || 0);
      if (tableCalculations.subtotal > 0) {
        const calculatedPct = Math.min(100, (flat / tableCalculations.subtotal) * 100);
        setBillDiscountPct(parseFloat(calculatedPct.toFixed(2)));
        showToast?.(`Applied ₹${flat} flat discount (${calculatedPct.toFixed(1)}%)`, "success");
      }
    }
    setShowDiscountModal(false);
    setCalcFlatDiscount("");
    setCalcPctDiscount("");
  };

  // Add Custom Service Item (Consultation, Nebulization, etc.)
  const handleAddServiceItemSubmit = (e) => {
    e.preventDefault();
    if (!serviceItemName || !serviceItemPrice) return;

    const pr = parseFloat(serviceItemPrice) || 0;
    const gst = parseFloat(serviceItemGst) || 0;

    const newServiceItem = {
      id: `service-${Date.now()}`,
      medicine_id: `SRV-${Date.now()}`,
      medicine_name: serviceItemName,
      brand: "Hospital Service",
      generic_name: "Service / Consumable",
      strength: "-",
      dosage_form: "Service",
      category: "Service Charges",
      batch: "SRV-01",
      expiry: "N/A",
      margin_pct: 100.0,
      discount_pct: 0,
      qty: 1,
      loose: 0,
      pack_size: 1,
      selling_price: pr,
      mrp: pr,
      cess_pct: 0,
      gst_pct: gst,
      stock: 9999,
      source: "In-House"
    };

    setBillingItems(prev => [...prev, newServiceItem]);
    setShowServiceItemModal(false);
    setServiceItemName("");
    setServiceItemPrice("");
    showToast?.(`Added service: ${serviceItemName}`, "success");
  };

  // 5. MASTER EXECUTION: SAVE BILL / COLLECT & DISPENSE
  const handleMasterSaveBill = async ({ autoPrint = false, isCollectAndDispense = false } = {}) => {
    if (billingItems.length === 0) {
      showToast?.("Cannot save an empty bill. Please search & add medicines first.", "error");
      searchInputRef.current?.focus();
      return;
    }

    try {
      const finalAmt = tableCalculations.grandTotal;

      // Determine effective payment status:
      // - "Collect & Dispense" (Alt+C) OR manual "PAID" selection -> Paid
      // - Default Save Bill / Print & Save -> Unpaid (Payment Due) if not PAID
      let effectivePaymentStatus = "Unpaid";
      if (isCollectAndDispense || billPaymentStatus === "PAID") {
        effectivePaymentStatus = "Paid";
      } else {
        effectivePaymentStatus = "Unpaid";
      }

      const isPaid = effectivePaymentStatus === "Paid";
      const invoiceNo = invoiceNumber || `INV-${Date.now()}`;
      const pName = patientName || "Walk-in Customer";
      const pMobile = patientMobile || "";
      const doc = (isHospitalPrescription && doctorName && doctorName.trim()) ? doctorName.trim() : "";

      // Handle split payment amounts
      const isSplit = paymentMode === "SPLIT";
      const cashVal = isSplit ? (parseFloat(splitCashAmount) || 0) : (paymentMode === "CASH" ? finalAmt : 0);
      const upiVal = isSplit ? (parseFloat(splitUpiAmount) || 0) : (paymentMode === "UPI / QR" ? finalAmt : 0);
      const paymentMethodLabel = isSplit 
        ? `CASH + UPI (Cash: ₹${cashVal.toFixed(2)}, UPI: ₹${upiVal.toFixed(2)})` 
        : paymentMode;

      // Convert items to hospital service format
      const formattedDispenseItems = billingItems.map(item => ({
        medicine_name: item.medicine_name,
        qty: item.qty + (item.loose > 0 ? (item.loose / (item.pack_size || 10)) : 0),
        price: item.selling_price,
        mrp: item.mrp,
        batch_number: item.batch,
        expiry: item.expiry,
        category: item.category,
        source: item.source,
        discount_pct: item.discount_pct,
        line_total: item.source === "Outside Purchase" ? 0 : (item.qty * item.selling_price * (1 - (item.discount_pct || 0) / 100))
      }));

      // Update Consultation Walk-in Record if from Queue
      if (selectedWalkIn) {
        await updateWalkIn?.(selectedWalkIn.name, {
          pharmacy_status: "Completed",
          appointment_status: isPaid ? "Completed" : "Billing",
          bill_amount: (selectedWalkIn.bill_amount || 0) + (isPaid ? 0 : finalAmt),
          pharmacy_bill_amount: finalAmt,
          pharmacy_payment_status: isPaid ? "Paid" : "Pending",
          pharmacy_paid_amount: isPaid ? finalAmt : 0,
          pharmacy_due_amount: isPaid ? 0 : finalAmt,
          dispensed_medicines: formattedDispenseItems
        });

        // Save to Patient Profile
        saveInvoiceToProfile?.(selectedWalkIn.mobile_number || pMobile, {
          name: `Pharmacy Bill ${invoiceNo} - ${formattedDispenseItems.map(i => `${i.medicine_name} (x${i.qty})`).join(", ")}`,
          bill_amount: finalAmt,
          payment_method: isPaid ? paymentMethodLabel : "Payment Due (Unpaid)",
          walkinData: {
            name: selectedWalkIn.name,
            patient_name: pName,
            mobile_number: pMobile,
            doctor: doc,
            pharmacy_bill_amount: finalAmt,
            pharmacy_payment_status: isPaid ? "Paid" : "Pending",
            pharmacy_paid_amount: isPaid ? finalAmt : 0,
            dispensed_medicines: formattedDispenseItems
          }
        });
      }

      // Record Finance Transaction ONLY if actually Paid
      if (typeof window !== 'undefined' && isPaid && finalAmt > 0) {
        const storedPayments = localStorage.getItem("hospital_dept_payments");
        const deptPayments = storedPayments ? JSON.parse(storedPayments) : [];
        deptPayments.unshift({
          id: `dp-pharm-${Date.now()}`,
          walkInId: selectedWalkIn?.name || `POS-${Date.now()}`,
          patientName: pName,
          mobile: pMobile,
          department: "Pharmacy",
          description: `Pharmacy POS Bill (${formattedDispenseItems.map(i => i.medicine_name).join(", ")})`,
          amount: finalAmt,
          method: paymentMethodLabel,
          date: new Date().toISOString().split("T")[0],
          status: "Paid"
        });
        localStorage.setItem("hospital_dept_payments", JSON.stringify(deptPayments));

        const rxTx = {
          id: `tx-pos-${invoiceNo}`,
          title: `Pharmacy Sale — ${pName}`,
          type: "Income",
          category: "Pharmacy Income",
          amount: finalAmt,
          method: paymentMethodLabel,
          date: new Date().toISOString().split("T")[0],
          notes: `Invoice: ${invoiceNo} | Payment: ${paymentMethodLabel}${doc ? ` | Doctor: ${doc}` : ''} | Items: ${formattedDispenseItems.map(i => `${i.medicine_name} ×${i.qty}`).join(", ")}`
        };
        recordFinanceTransaction?.(rxTx).catch(() => null);
      }

      // Audit Log
      await createPharmacyAuditLog?.({
        action: isCollectAndDispense ? "Collect & Dispense" : isPaid ? "POS Sale (Paid)" : "POS Bill (Unpaid)",
        patient: pName,
        details: `Invoice: ${invoiceNo} | Total: ₹${finalAmt.toFixed(2)} | Status: ${effectivePaymentStatus} | Method: ${paymentMethodLabel}${doc ? ` | Doctor: ${doc}` : ''}`,
        performed_by: pharmacistName
      }).catch(() => null);

      // Create Receipt Record
      const receiptData = {
        invoiceNumber: invoiceNo,
        patientName: pName,
        patientMobile: pMobile,
        patientUHID: patientUHID || "Walk-in",
        doctorName: doc,
        isWalkIn: !isHospitalPrescription || !doc,
        items: formattedDispenseItems.map(it => ({
          medicine_name: it.medicine_name,
          unit_price: it.price,
          dispensed_qty: it.qty,
          line_total: it.line_total,
          batch_number: it.batch_number,
          expiry: it.expiry,
          category: it.category
        })),
        totalVal: finalAmt,
        subtotal: tableCalculations.subtotal,
        discountPct: billDiscountPct,
        discountAmount: tableCalculations.billDiscountAmount,
        netGst: tableCalculations.totalGst,
        paymentStatus: effectivePaymentStatus,
        paymentMethod: isPaid ? (isSplit ? "CASH + UPI" : paymentMode) : "Payment Due (Unpaid)",
        paymentMode: isPaid ? (isSplit ? "Cash + UPI Split Payment" : "Paid at Pharmacy Counter") : "Payment Due (Unpaid Bill)",
        isSplitPayment: isSplit,
        splitCash: cashVal,
        splitUpi: upiVal,
        isPaidAtPharmacy: isPaid,
        pharmacistName: pharmacistName,
        date: new Date().toLocaleString("en-IN")
      };

      setLatestDispenseRecord?.(receiptData);
      setShowDispenseReceiptModal?.(true);

      // Save to persistent hospital_pharmacy_bills register
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("hospital_pharmacy_bills");
          const curBills = stored ? JSON.parse(stored) : [];
          const updatedBills = sanitizeBillsList([receiptData, ...curBills]);
          localStorage.setItem("hospital_pharmacy_bills", JSON.stringify(updatedBills));
          setSavedBillsList(updatedBills);
        } catch {
          // ignore
        }
      }

      if (isPaid) {
        showToast?.(`Payment Collected & Bill Saved! Invoice: ${invoiceNo}`, "success");
      } else {
        showToast?.(`Bill Generated (Payment Due)! Invoice: ${invoiceNo}`, "success");
      }

      // Reset Bill Form for next patient
      setBillingItems([]);
      setPatientName("Walk-in Customer");
      setPatientMobile("");
      setPatientUHID("");
      setDoctorName("");
      setIsHospitalPrescription(false);
      setBillDiscountPct(0);
      setRemarks("");
      setBillPaymentStatus("PAID");
      setPaymentMode("CASH");
      setSplitCashAmount("");
      setSplitUpiAmount("");
      onClearWalkIn?.();
      
      // Auto-generate fresh next invoice number
      const yr = new Date().getFullYear();
      setInvoiceNumber(`INV-${yr}-${Math.floor(1000 + Math.random() * 9000)}`);
      loadAllData?.();

      if (autoPrint) {
        setTimeout(() => {
          printPharmacyInvoiceReceipt(receiptData);
        }, 300);
      }
    } catch (err) {
      console.error("Save bill error:", err);
      showToast?.("Failed to save bill. Please check inputs.", "error");
    }
  };

  // Outside Purchase Quick Action
  const handleAddOutsidePurchase = () => {
    if (!posSearchQuery.trim()) {
      showToast?.("Type the medicine name in the search bar first, then click Outside Purchase", "info");
      searchInputRef.current?.focus();
      return;
    }
    handleAddMedicineToBill({
      medicine_name: posSearchQuery.trim(),
      brand: "Outside Pharmacy",
      generic_name: "External Sourced",
      dosage_form: "Tablet",
      category: "Outside Purchase",
      batch: "EXT-01",
      expiry: "N/A",
      purchase_price: 0,
      selling_price: 0,
      mrp: 0,
      stock: 0
    }, "Outside Purchase");
  };

  // Keyboard Shortcuts inside POS page
  useEffect(() => {
    const handlePOSKeyDown = (e) => {
      const isAlt = e.altKey;
      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key;
      // Backspace -> Close open modals (View Bills, Settle Bill, etc.) ONLY when NOT typing in an input
      if (key === 'Backspace') {
        const target = e.target;
        const isInput = target && (
          target.tagName === "INPUT" || 
          target.tagName === "TEXTAREA" || 
          target.tagName === "SELECT" || 
          target.isContentEditable ||
          Boolean(target.closest?.('input, textarea, select, [contenteditable="true"]'))
        );

        if (isInput) {
          // Inside input/textarea/select/table cell: Backspace must ONLY delete text, never close modals or views
          return;
        }

        if (settlingBill) {
          e.preventDefault();
          setSettlingBill(null);
          return;
        }
        if (showViewBillsModal) {
          e.preventDefault();
          setShowViewBillsModal(false);
          return;
        }
        if (showSubstituteModal) {
          e.preventDefault();
          setShowSubstituteModal(false);
          return;
        }
        if (showDiscountModal) {
          e.preventDefault();
          setShowDiscountModal(false);
          return;
        }
        if (showServiceItemModal) {
          e.preventDefault();
          setShowServiceItemModal(false);
          return;
        }
        if (showMoreDetailsModal) {
          e.preventDefault();
          setShowMoreDetailsModal(false);
          return;
        }
      }

      // Escape -> Close open modals or dropdowns
      if (key === 'Escape') {
        if (showSearchDropdown) {
          e.preventDefault();
          setShowSearchDropdown(false);
          return;
        }
        if (showPatientDropdown) {
          e.preventDefault();
          setShowPatientDropdown(false);
          return;
        }
        if (settlingBill) {
          e.preventDefault();
          setSettlingBill(null);
          return;
        }
        if (showViewBillsModal) {
          e.preventDefault();
          setShowViewBillsModal(false);
          return;
        }
        if (showSubstituteModal) {
          e.preventDefault();
          setShowSubstituteModal(false);
          return;
        }
        if (showDiscountModal) {
          e.preventDefault();
          setShowDiscountModal(false);
          return;
        }
        if (showServiceItemModal) {
          e.preventDefault();
          setShowServiceItemModal(false);
          return;
        }
        if (showMoreDetailsModal) {
          e.preventDefault();
          setShowMoreDetailsModal(false);
          return;
        }
      }

      // Ignore if user is inside another active modal
      if (showSubstituteModal || showDiscountModal || showServiceItemModal || showMoreDetailsModal || showViewBillsModal || settlingBill) {
        return;
      }

      // Alt + B -> View Bills / Invoices History
      if (isAlt && !e.shiftKey && key.toLowerCase() === 'b') {
        e.preventDefault();
        e.stopImmediatePropagation();
        loadSavedBills();
        setShowViewBillsModal(true);
        return;
      }

      // Alt + G -> Generate Purchase Orders
      if (isAlt && !isCtrlOrMeta && !e.shiftKey && key.toLowerCase() === 'g') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onGeneratePOs?.();
        return;
      }

      // Alt + Shift + S -> Add Drug Supplier
      if (isAlt && !isCtrlOrMeta && e.shiftKey && key.toLowerCase() === 's') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onAddSupplier?.();
        return;
      }

      // Alt + I -> Purchase Inward & Stock Entry (Supplier Bill)
      if (isAlt && !isCtrlOrMeta && !e.shiftKey && key.toLowerCase() === 'i') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onOpenPurchaseInward?.();
        return;
      }

      // Alt + U -> Open Medicine Substitute Modal
      if (isAlt && !isCtrlOrMeta && key.toLowerCase() === 'u') {
        e.preventDefault();
        e.stopImmediatePropagation();
        handleOpenSubstitute();
        return;
      }

      // Alt + M or / (when not in input) -> Focus Medicine Search
      const targetEl = e.target;
      const isTyping = targetEl && (targetEl.tagName === "INPUT" || targetEl.tagName === "TEXTAREA" || targetEl.isContentEditable);
      if ((isAlt && key.toLowerCase() === 'm') || (key === '/' && !isTyping)) {
        e.preventDefault();
        e.stopImmediatePropagation();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // ? or F1 -> Open Shortcuts Guide Modal
      if (!isTyping && (key === '?' || key === 'F1')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        onOpenShortcuts?.();
        return;
      }

      // Alt + O -> Outside Purchase
      if (isAlt && key.toLowerCase() === 'o') {
        e.preventDefault();
        e.stopImmediatePropagation();
        handleAddOutsidePurchase();
        return;
      }

      // Alt + P -> Patient Focus (isolated from Shift)
      if (isAlt && !e.shiftKey && key.toLowerCase() === 'p') {
        e.preventDefault();
        e.stopImmediatePropagation();
        patientInputRef.current?.focus();
        patientInputRef.current?.select();
        return;
      }

      // Alt + T -> Toggle Doctor (Walk-in Customer vs Hospital Doctor)
      if (isAlt && key.toLowerCase() === 't') {
        e.preventDefault();
        e.stopImmediatePropagation();
        setIsHospitalPrescription((prev) => {
          const next = !prev;
          if (next) {
            if (!doctorName) setDoctorName("Dr. Arun Kumar, MBBS, MD");
            setTimeout(() => {
              doctorInputRef.current?.focus();
              doctorInputRef.current?.select();
            }, 50);
          } else {
            setDoctorName("");
          }
          return next;
        });
        return;
      }

      // Alt + Shift + D -> Focus Discount
      if (isAlt && e.shiftKey && key.toLowerCase() === 'd') {
        e.preventDefault();
        e.stopImmediatePropagation();
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
        return;
      }

      // Alt + D -> Download & Export
      if (isAlt && !e.shiftKey && key.toLowerCase() === 'd') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onOpenExport?.();
        return;
      }

      // Alt + I -> Invoice No Focus
      if (isAlt && key.toLowerCase() === 'i') {
        e.preventDefault();
        e.stopImmediatePropagation();
        invoiceInputRef.current?.focus();
        invoiceInputRef.current?.select();
        return;
      }

      // Alt + R -> Sales Return
      if (isAlt && key.toLowerCase() === 'r') {
        e.preventDefault();
        e.stopImmediatePropagation();
        onOpenSalesReturn?.();
        return;
      }

      // Alt + Q -> Next Patient in Queue
      if (isAlt && key.toLowerCase() === 'q') {
        e.preventDefault();
        e.stopImmediatePropagation();
        const waitingQueue = (queue || []).filter(item => item.appointment_status === 'Pharmacy' || item.status === 'Waiting');
        const nextPatient = waitingQueue[0] || (queue || [])[0];
        if (nextPatient) {
          onSelectQueueItem?.(nextPatient);
        } else {
          showToast?.("No waiting patients in prescription queue.", "info");
        }
        return;
      }

      // Ctrl + Enter -> Save Bill Primary Action
      if (isCtrlOrMeta && key === 'Enter') {
        e.preventDefault();
        e.stopImmediatePropagation();
        handleMasterSaveBill();
        return;
      }

      // Delete key -> Delete selected row (only when not typing in text field)
      if (key === 'Delete' && !isTyping && selectedRowIndex >= 0 && billingItems[selectedRowIndex]) {
        e.preventDefault();
        e.stopImmediatePropagation();
        handleDeleteRow(selectedRowIndex);
        return;
      }

      // ↑ / ↓ -> Navigate bill table rows when not in an input
      if (!isTyping && !showSearchDropdown && billingItems.length > 0 && (key === 'ArrowUp' || key === 'ArrowDown')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (key === 'ArrowDown') {
          setSelectedRowIndex((prev) => (prev < billingItems.length - 1 ? prev + 1 : 0));
        } else {
          setSelectedRowIndex((prev) => (prev > 0 ? prev - 1 : billingItems.length - 1));
        }
        return;
      }

      // Enter -> Open Substitute Finder on highlighted row when not in an input
      if (!isTyping && key === 'Enter' && !isCtrlOrMeta && selectedRowIndex >= 0 && billingItems[selectedRowIndex]) {
        e.preventDefault();
        e.stopImmediatePropagation();
        handleOpenSubstitute(selectedRowIndex);
        return;
      }
    };

    window.addEventListener("keydown", handlePOSKeyDown);
    return () => window.removeEventListener("keydown", handlePOSKeyDown);
  }, [
    billingItems, selectedRowIndex, showSubstituteModal, showDiscountModal,
    showServiceItemModal, showMoreDetailsModal, showViewBillsModal, settlingBill,
    showSearchDropdown, showPatientDropdown, posSearchQuery, tableCalculations,
    isHospitalPrescription, doctorName, queue, onSelectQueueItem, onAddSupplier,
    onGeneratePOs, onOpenExport, onOpenOTCSale, onOpenSalesReturn, onOpenShortcuts,
    showToast
  ]);

  return (
    <div className="flex flex-col gap-1.5 w-full max-w-full font-sans text-slate-800 antialiased select-none h-full justify-between overflow-hidden">
      
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. TOP HEADER (Integrated POS Search & Action Bar)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100/90 px-3 py-1.5 rounded-lg border border-slate-300/80 shadow-2xs">
        {/* Enhanced Medicine Search Bar */}
        <div ref={searchContainerRef} className="relative flex-1 min-w-[260px] max-w-3xl">
          <div className="relative flex items-center bg-white rounded-lg border border-slate-300 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 shadow-xs transition">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search medicines by name, generic molecule, barcode or batch... (Press / or Alt + M)"
              value={posSearchQuery}
              onChange={(e) => {
                setPosSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => {
                if (posSearchQuery.trim().length >= 1) setShowSearchDropdown(true);
              }}
              onKeyDown={(e) => {
                if (showSearchDropdown && searchResults.length > 0) {
                  // Space or Enter -> Select the highlighted medicine immediately
                  if (e.key === " " || e.code === "Space") {
                    e.preventDefault();
                    const selectedMed = searchResults[highlightedSearchIndex] || searchResults[0];
                    if (selectedMed) {
                      handleAddMedicineToBill(selectedMed);
                    }
                    return;
                  }
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const selectedMed = searchResults[highlightedSearchIndex] || searchResults[0];
                    if (selectedMed) {
                      handleAddMedicineToBill(selectedMed);
                    }
                    return;
                  }
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setHighlightedSearchIndex(prev => (prev + 1) % searchResults.length);
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setHighlightedSearchIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setShowSearchDropdown(false);
                    return;
                  }
                }
              }}
              className="w-full h-8.5 pl-9 pr-20 text-xs font-medium text-slate-900 bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400 placeholder:italic"
            />
            {posSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setPosSearchQuery("");
                  setShowSearchDropdown(false);
                }}
                className="absolute right-14 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="absolute right-2 text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono font-bold border border-slate-300 pointer-events-none shadow-2xs">
              Alt + M
            </span>
          </div>

          {/* Autocomplete Search Dropdown */}
          {showSearchDropdown && posSearchQuery.trim().length >= 1 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-2xl border border-slate-300 z-50 max-h-80 overflow-y-auto divide-y divide-slate-100">
              <div className="px-3 py-1.5 bg-slate-50 flex items-center justify-between text-[11px] text-slate-600 font-semibold border-b">
                <span>Found {searchResults.length} result{searchResults.length === 1 ? '' : 's'} for &quot;{posSearchQuery}&quot;</span>
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-1.5 py-0.5 rounded shadow-2xs">
                    Space / Enter
                  </span>
                  <span className="text-slate-500">to Select</span>
                  <span className="text-slate-300">•</span>
                  <span className="bg-slate-200 text-slate-700 font-bold px-1 py-0.5 rounded">↑↓</span>
                  <span className="text-slate-500">to Navigate</span>
                </div>
              </div>
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No medicine catalog matches found for &quot;{posSearchQuery}&quot;. Press <span className="font-bold text-slate-800">Alt + A</span> to add new medicine.
                </div>
              ) : (
                searchResults.map((med, idx) => {
                  const isSelected = idx === highlightedSearchIndex;
                  return (
                    <div
                      key={med.name || med.id || idx}
                      onClick={() => handleAddMedicineToBill(med)}
                      onMouseEnter={() => setHighlightedSearchIndex(idx)}
                      className={`p-2.5 px-3 cursor-pointer flex items-center justify-between gap-3 transition text-xs ${
                        isSelected ? "bg-indigo-50/80 ring-1 ring-inset ring-indigo-400 font-semibold" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex-1">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="text-sm">{med.medicine_name}</span>
                          {med.strength && med.strength !== "-" && (
                            <span className="text-[11px] text-slate-500 font-normal">({med.strength})</span>
                          )}
                          <span className="text-[9px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            Batch: {med.batch_number || "BT-01"}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] font-mono bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                              Space to Select
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                          <span>{med.generic_name ? `Generic: ${med.generic_name}` : (med.category || "Regular Medicine")}</span>
                          <span>•</span>
                          <span>Exp: {med.expiry_date || "12/2027"}</span>
                          <span>•</span>
                          <span>Rack: {med.rack_location || "A-01"}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                          (med.stock || 0) > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {(med.stock || 0) > 0 ? `${med.stock} in stock` : "0 stock"}
                        </span>
                        <div>
                          <div className="font-mono font-bold text-slate-900 text-sm">
                            ₹{Number(med.selling_price || med.mrp || 25).toFixed(2)}
                          </div>
                          {med.mrp && Number(med.mrp) > Number(med.selling_price || 0) && (
                            <div className="text-[10px] text-slate-400 line-through">
                              MRP ₹{Number(med.mrp).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Right side quick POS buttons */}
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="px-2 py-1 text-[11px] font-semibold bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 shadow-2xs flex items-center gap-1 cursor-pointer"
            title="View Keyboard Shortcuts Guide (?)"
          >
            <Keyboard className="w-3 h-3 text-slate-500" />
            <span>Shortcuts</span>
            <span className="text-[9px] bg-slate-100 text-slate-600 px-1 rounded border border-slate-200 font-mono">?</span>
          </button>

          <button
            type="button"
            onClick={() => {
              loadSavedBills();
              setShowViewBillsModal(true);
            }}
            className="px-2 py-1 text-[11px] font-semibold bg-white text-indigo-700 border border-indigo-200 rounded hover:bg-indigo-50 shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <Receipt className="w-3 h-3 text-indigo-600" />
            <span>View Bills</span>
            <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1 rounded border border-indigo-200 font-mono">Alt + B</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 text-white rounded hover:bg-slate-900 shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <span>More</span>
                <ChevronDown className="w-3 h-3 opacity-80" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-1 text-xs bg-white border border-slate-300 rounded-lg shadow-xl">
              <DropdownMenuItem onClick={onOpenPurchaseInward} className="flex items-center gap-2 cursor-pointer font-medium text-emerald-800">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-600" /> Purchase Inward (Alt + I)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenShortcuts} className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <Keyboard className="w-3.5 h-3.5 text-amber-600" /> Keyboard Shortcuts (?)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onGeneratePOs} className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <ShoppingCart className="w-3.5 h-3.5 text-indigo-600" /> Generate POs (Alt + G)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onAddSupplier} className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" /> Add Supplier (Alt + Shift + S)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenSalesReturn} className="flex items-center gap-2 cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Sales Return (Alt + R)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. MEDICINE BILLING TABLE (High-Density Traditional Desktop POS Table)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-white border border-slate-300 rounded-lg shadow-2xs overflow-hidden flex flex-col flex-1 min-h-[140px]">
        <div className="overflow-auto flex-1 min-h-0">
          <table className="w-full text-left border-collapse text-[11px] select-text">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gradient-to-b from-slate-100 to-slate-200 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px] tracking-wider divide-x divide-slate-300">
                <th className="py-2 px-1.5 text-center w-8">#</th>
                <th className="py-2 px-2.5 min-w-[220px]">Product</th>
                <th className="py-2 px-2 w-24 text-center">Batch</th>
                <th className="py-2 px-2 w-20 text-center">Expiry</th>
                <th className="py-2 px-2 w-16 text-right">Margin %</th>
                <th className="py-2 px-2 w-16 text-right">Disc %</th>
                <th className="py-2 px-2 w-16 text-center">Qty</th>
                <th className="py-2 px-2 w-16 text-center">Loose</th>
                <th className="py-2 px-2 w-20 text-right">SP ₹</th>
                <th className="py-2 px-2 w-20 text-right">MRP ₹</th>
                <th className="py-2 px-2 w-16 text-right">CESS %</th>
                <th className="py-2 px-2 w-20 text-right">Net GST ₹</th>
                <th className="py-2 px-2.5 w-24 text-right">Total ₹</th>
                <th className="py-2 px-2 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white font-medium">
              {tableCalculations.itemsWithTotals.length === 0 ? (
                // Blank grid rows matching reference POS empty layout
                [...Array(6)].map((_, emptyIdx) => (
                  <tr key={`empty-${emptyIdx}`} className="border-b border-slate-100 text-slate-300 divide-x divide-slate-100">
                    <td className="text-center font-mono text-[10px] py-2 align-middle">{emptyIdx === 0 ? "1" : ""}</td>
                    <td className="px-3 text-slate-400 font-normal py-2 align-middle">
                      {emptyIdx === 0 ? "Search product above or press / or Alt + M to begin billing..." : ""}
                    </td>
                    <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
                  </tr>
                ))
              ) : (
                tableCalculations.itemsWithTotals.map((item, idx) => {
                  const isSelected = idx === selectedRowIndex;
                  return (
                    <tr
                      key={item.id || idx}
                      onClick={() => setSelectedRowIndex(idx)}
                      className={`hover:bg-slate-50 divide-x divide-slate-200 transition-colors ${
                        isSelected ? "bg-indigo-50/80 font-semibold" : idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      }`}
                    >
                      {/* 1. Row Index */}
                      <td className="py-1.5 px-1 text-center font-mono text-slate-500 font-semibold text-[10px] align-middle">
                        {idx + 1}
                      </td>

                      {/* 2. Product Name */}
                      <td className="py-1.5 px-2.5 align-middle">
                        <div className="font-bold text-slate-900 leading-tight flex items-center gap-1.5 flex-wrap">
                          <span>{item.medicine_name}</span>
                          {item.strength && item.strength !== "-" && !item.medicine_name.includes(item.strength) && (
                            <span className="text-[10px] text-slate-500 font-normal">({item.strength})</span>
                          )}
                          {item.source === "Outside Purchase" && (
                            <span className="bg-slate-100 text-slate-700 text-[9px] font-bold px-1 rounded border border-slate-200">Outside</span>
                          )}
                        </div>
                      </td>

                      {/* 3. Batch (Non-editable) */}
                      <td className="py-1 px-1 text-center font-mono text-[10px] text-slate-700 font-semibold select-text">
                        <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.batch || "BT-01"}
                        </span>
                      </td>

                      {/* 4. Expiry (Non-editable) */}
                      <td className="py-1 px-1 text-center font-mono text-[10px] text-slate-600 select-text">
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                          {item.expiry || "N/A"}
                        </span>
                      </td>

                      {/* 5. Margin % */}
                      <td className="py-1 px-1.5 text-right font-mono text-[10px] text-slate-600">
                        {Number(item.margin_pct || 20).toFixed(1)}%
                      </td>

                      {/* 6. Disc % */}
                      <td className="py-1 px-1 text-right font-mono">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={item.discount_pct || 0}
                          onChange={(e) => handleUpdateRowField(idx, "discount_pct", e.target.value)}
                          className="w-full text-right border-none bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded text-[11px] font-mono py-0.5 font-bold text-slate-800"
                        />
                      </td>

                      {/* 7. Qty */}
                      <td className="py-1 px-1 text-center font-mono">
                        <input
                          type="number"
                          min="0"
                          value={item.qty}
                          onChange={(e) => handleUpdateRowField(idx, "qty", e.target.value)}
                          className="w-full text-center border border-slate-300 bg-white rounded text-[11px] font-mono py-0.5 font-bold text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-2xs"
                        />
                      </td>

                      {/* 8. Loose */}
                      <td className="py-1 px-1 text-center font-mono">
                        <input
                          type="number"
                          min="0"
                          value={item.loose || 0}
                          onChange={(e) => handleUpdateRowField(idx, "loose", e.target.value)}
                          className="w-full text-center border-none bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded text-[11px] font-mono py-0.5 text-slate-700"
                        />
                      </td>

                      {/* 9. SP ₹ */}
                      <td className="py-1 px-1.5 text-right font-mono font-bold text-slate-900">
                        <input
                          type="number"
                          step="0.01"
                          value={item.selling_price || 0}
                          onChange={(e) => handleUpdateRowField(idx, "selling_price", e.target.value)}
                          className="w-full text-right border-none bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded text-[11px] font-mono py-0.5 font-bold"
                        />
                      </td>

                      {/* 10. MRP ₹ */}
                      <td className="py-1 px-1.5 text-right font-mono text-slate-500 text-[10px]">
                        ₹{Number(item.mrp || item.selling_price || 0).toFixed(2)}
                      </td>

                      {/* 11. CESS % */}
                      <td className="py-1 px-1 text-right font-mono text-[10px]">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={item.cess_pct || 0}
                          onChange={(e) => handleUpdateRowField(idx, "cess_pct", e.target.value)}
                          className="w-full text-right border-none bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded text-[10px] font-mono py-0.5 text-slate-600"
                        />
                      </td>

                      {/* 12. Net GST ₹ */}
                      <td className="py-1 px-2 text-right font-mono text-slate-700 text-[10px]">
                        ₹{item.netGstAmount.toFixed(2)}
                      </td>

                      {/* 13. Line Total ₹ */}
                      <td className="py-1 px-2.5 text-right font-mono font-bold text-slate-900 text-xs">
                        ₹{item.lineFinalTotal.toFixed(2)}
                      </td>

                      {/* 14. Action */}
                      <td className="py-1 px-1 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            title="Delete Row (Del)"
                            onClick={() => handleDeleteRow(idx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5 rounded hover:bg-slate-100"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          4. BILLING ACTION BAR (Matching Reference UI with Shortcuts inside)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-300 shadow-2xs">
        
        {/* Left / Middle POS Shortcut Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (selectedRowIndex >= 0) handleDeleteRow(selectedRowIndex);
              else showToast?.("Select a row in the table first to delete", "info");
            }}
            className="px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded hover:bg-black shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="bg-slate-700 text-rose-300 text-[9px] px-1 py-0.2 rounded font-mono">Del</span>
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={() => handleOpenSubstitute()}
            className="px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded hover:bg-black shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="bg-slate-700 text-blue-300 text-[9px] px-1 py-0.2 rounded font-mono">Alt + U</span>
            <span>Substitute</span>
          </button>

          <button
            type="button"
            onClick={onOpenSalesReturn}
            className="px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded hover:bg-black shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="bg-slate-700 text-slate-200 text-[9px] px-1 py-0.2 rounded font-mono">Alt + R</span>
            <span>Return</span>
          </button>
        </div>

        {/* Right Side POS Total Display Box (Pale Green Box matching Reference) */}
        <div className="bg-[#d4edda] text-[#155724] border border-[#c3e6cb] px-4 py-1.5 rounded-lg flex items-center gap-4 shrink-0 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider">Total</span>
          <span className="text-xl font-extrabold font-mono tracking-tight">
            ₹{tableCalculations.grandTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          5. PATIENT / BILL DETAILS SECTION (Fieldset / Compact POS Form)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-slate-100/90 p-3 rounded-lg border border-slate-300/80 shadow-2xs space-y-2.5 text-xs">
        {/* Row 1: Patient, Doctor/Customer Mode, Discount %, Invoice No, Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 items-end">
          
          {/* Patient Field with Alt P */}
          <div className="space-y-1 relative">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-slate-600 uppercase">Patient</Label>
              <span className="text-[9px] font-mono bg-slate-200 text-slate-700 px-1 rounded border">Alt + P</span>
            </div>
            <div className="relative">
              <input
                ref={patientInputRef}
                type="text"
                value={patientName}
                onChange={(e) => {
                  setPatientName(e.target.value);
                  setShowPatientDropdown(true);
                  if (e.target.value.toLowerCase().includes("walk-in")) {
                    setIsHospitalPrescription(false);
                    setDoctorName("");
                  }
                }}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="Name or Mobile / UHID"
                className="w-full h-8 px-2.5 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
              
              {/* Patient Autocomplete Dropdown from Queue */}
              {showPatientDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-300 z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 text-xs">
                  <div 
                    onClick={() => {
                      setPatientName("Walk-in Customer");
                      setPatientMobile("");
                      setPatientUHID("");
                      setDoctorName("");
                      setIsHospitalPrescription(false);
                      setShowPatientDropdown(false);
                    }}
                    className="p-2 hover:bg-slate-50 cursor-pointer font-semibold text-slate-700 flex items-center justify-between"
                  >
                    <span>Walk-in Customer (Direct OTC)</span>
                    <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">No Doctor Needed</span>
                  </div>
                  {queue.slice(0, 5).map((q, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        onSelectQueueItem?.(q);
                        setShowPatientDropdown(false);
                      }}
                      className="p-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{q.patient_name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Mob: {q.mobile_number || "N/A"} • Dr: {q.doctor || "General"}</div>
                      </div>
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.2 rounded font-mono">
                        {q.pharmacy_status || "Waiting"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Doctor Field (Shown only for Hospital Prescriptions) OR Direct Walk-In Mode Display */}
          {isHospitalPrescription || (doctorName && doctorName.trim()) ? (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Label className="text-[10px] font-bold text-slate-700 uppercase">Hospital Doctor</Label>
                  <span className="text-[8px] bg-indigo-100 text-indigo-800 font-bold px-1 rounded">Rx</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsHospitalPrescription(false);
                    setDoctorName("");
                  }}
                  className="text-[9px] text-slate-400 hover:text-rose-600 underline cursor-pointer"
                  title="Remove doctor for direct walk-in OTC sale"
                >
                  Clear Doctor
                </button>
              </div>
              <input
                ref={doctorInputRef}
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="Doctor Name (e.g. Dr. Arun Kumar)"
                className="w-full h-8 px-2.5 text-xs font-medium text-slate-900 bg-white border border-indigo-300 rounded focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">Customer Mode</Label>
                <span className="text-[9px] font-mono bg-slate-200 text-slate-600 px-1 rounded border">Alt + T</span>
              </div>
              <div className="flex items-center justify-between h-8 px-2.5 bg-slate-200/70 border border-slate-300 rounded text-slate-700">
                <span className="text-[11px] font-bold text-slate-800">Walk-In (No Doctor)</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsHospitalPrescription(true);
                    setDoctorName("Dr. Arun Kumar, MBBS, MD");
                    setTimeout(() => {
                      doctorInputRef.current?.focus();
                      doctorInputRef.current?.select();
                    }, 50);
                  }}
                  className="text-[9px] font-bold bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded shadow-2xs cursor-pointer"
                >
                  + Add Doctor
                </button>
              </div>
            </div>
          )}

          {/* Discount % with Alt + Shift + D */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-slate-600 uppercase">Discount %</Label>
              <span className="text-[9px] font-mono bg-slate-200 text-slate-700 px-1 rounded border">Alt + Shift + D</span>
            </div>
            <input
              ref={discountInputRef}
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={billDiscountPct}
              onChange={(e) => setBillDiscountPct(parseFloat(e.target.value) || 0)}
              className="w-full h-8 px-2.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Invoice No with Alt I */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-slate-600 uppercase">Invoice No.</Label>
              <span className="text-[9px] font-mono bg-slate-200 text-slate-700 px-1 rounded border">Alt + I</span>
            </div>
            <input
              ref={invoiceInputRef}
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full h-8 px-2.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Date Field with Calendar Icon */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-slate-600 uppercase">Date</Label>
              <Calendar className="w-3 h-3 text-slate-400" />
            </div>
            <input
              type="text"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full h-8 px-2.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded font-mono focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>
        </div>

        {/* Row 2: Remarks, Next Order (Days), Payment Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-1 border-t border-slate-200/80">
          
          {/* Remarks */}
          <div className="space-y-1 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-slate-600 uppercase">Remarks</Label>
            </div>
            <input
              ref={remarksInputRef}
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Regular monthly refill / Patient requested generic"
              className="w-full h-8 px-2.5 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Next Order Days */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-slate-600 uppercase">Next Order (Days)</Label>
            <input
              type="number"
              min="1"
              value={nextOrderDays}
              onChange={(e) => setNextOrderDays(parseInt(e.target.value, 10) || 30)}
              className="w-full h-8 px-2.5 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          {/* Payment Mode */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-slate-600 uppercase">Payment Mode</Label>
            <select
              value={paymentMode}
              onChange={(e) => {
                const newMode = e.target.value;
                setPaymentMode(newMode);
                if (newMode === "SPLIT") {
                  const half = Math.round(tableCalculations.grandTotal / 2);
                  setSplitCashAmount(String(half));
                  setSplitUpiAmount(String(tableCalculations.grandTotal - half));
                }
              }}
              className="w-full h-8 px-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="CASH">CASH</option>
              <option value="UPI / QR">UPI / QR (Instant)</option>
              <option value="SPLIT">CASH + UPI (Split Payment)</option>
              <option value="CARD">CREDIT / DEBIT CARD</option>
              <option value="CREDIT">HOSPITAL CREDIT / IPD</option>
            </select>
          </div>

          {/* Bill Payment Status */}
          <div className="space-y-1">
            <Label className="text-[10px] font-bold text-slate-600 uppercase">Bill Status</Label>
            <select
              value={billPaymentStatus}
              onChange={(e) => setBillPaymentStatus(e.target.value)}
              className={`w-full h-8 px-2 text-xs font-bold rounded border transition-colors ${
                billPaymentStatus === "PAID"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold"
                  : "bg-rose-50 text-rose-800 border-rose-300 font-extrabold"
              }`}
            >
              <option value="PAID">PAID (Cash/UPI Received)</option>
              <option value="UNPAID">UNPAID (Payment Due)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Split Payment Breakdown if SPLIT is selected */}
        {paymentMode === "SPLIT" && (
          <div className="mt-2 p-2.5 bg-indigo-50/70 border border-indigo-200 rounded-lg flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>Split Breakdown (Total: ₹{tableCalculations.grandTotal.toFixed(2)}):</span>
            </span>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-slate-700">Cash ₹</label>
              <input
                type="number"
                min="0"
                max={tableCalculations.grandTotal}
                value={splitCashAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  setSplitCashAmount(val);
                  const num = parseFloat(val) || 0;
                  const rem = Math.max(0, tableCalculations.grandTotal - num);
                  setSplitUpiAmount(String(rem));
                }}
                className="w-24 h-7 px-2 text-xs font-bold font-mono bg-white border border-slate-300 rounded focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                placeholder="0"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] font-bold text-slate-700">UPI ₹</label>
              <input
                type="number"
                min="0"
                max={tableCalculations.grandTotal}
                value={splitUpiAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  setSplitUpiAmount(val);
                  const num = parseFloat(val) || 0;
                  const rem = Math.max(0, tableCalculations.grandTotal - num);
                  setSplitCashAmount(String(rem));
                }}
                className="w-24 h-7 px-2 text-xs font-bold font-mono bg-white border border-slate-300 rounded focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                placeholder="0"
              />
            </div>
            <span className="text-[10px] text-indigo-700 font-semibold ml-auto">
              Sum: ₹{((parseFloat(splitCashAmount) || 0) + (parseFloat(splitUpiAmount) || 0)).toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          6. BOTTOM BILLING ACTION BUTTONS (Large POS Buttons matching Reference)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-0.5">
        {/* Primary Save Action */}
        <button
          type="button"
          onClick={() => handleMasterSaveBill()}
          className="px-5 py-1.5 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-98"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Save Bill</span>
          <span className="bg-blue-800 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">Ctrl + Enter</span>
        </button>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODALS FOR ACTIONS (Substitute, Calculate Discount, Service Item, Details)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      
      {/* 1. Substitute Modal */}
      <Dialog open={showSubstituteModal} onOpenChange={setShowSubstituteModal}>
        <DialogContent className="max-w-xl bg-white p-5 rounded-xl border border-slate-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Pill className="w-4 h-4 text-blue-600" />
              Substitute Medicine Finder
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Select an alternative drug with the matching generic molecule from inventory.
            </DialogDescription>
          </DialogHeader>

          {substituteItemIndex !== null && billingItems[substituteItemIndex] && (() => {
            const currentItem = billingItems[substituteItemIndex];
            const genericMolecule = (currentItem.generic_name || currentItem.medicine_name).toLowerCase();
            const matchingSubs = medicines.filter(m => 
              m.medicine_name.toLowerCase() !== currentItem.medicine_name.toLowerCase() &&
              (m.generic_name && m.generic_name.toLowerCase().includes(genericMolecule))
            );

            return (
              <div className="space-y-3 pt-2 text-xs">
                <div className="bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Current Medicine</span>
                  <div className="font-bold text-slate-900 text-sm">{currentItem.medicine_name}</div>
                  <div className="text-[11px] text-slate-600 font-mono">Generic: {currentItem.generic_name || "N/A"}</div>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto divide-y border rounded-lg bg-white">
                  {matchingSubs.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      No other medicines with the same generic formula ({currentItem.generic_name || "formula"}) currently in catalog.
                    </div>
                  ) : (
                    matchingSubs.map((sub, sIdx) => (
                      <div key={sIdx} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900">{sub.medicine_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Batch: {sub.batch_number} • Stock: {sub.stock} units</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-xs">₹{sub.selling_price || sub.mrp}</span>
                          <Button size="sm" onClick={() => handleApplySubstitute(sub)} className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white">
                            Substitute
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* 2. Calculate Discount Modal */}
      <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
        <DialogContent className="max-w-md bg-white p-5 rounded-xl border border-slate-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-600" />
              Calculate Bill Discount
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Apply overall percentage or flat rupee concession to the bill.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-lg border flex justify-between font-mono">
              <span className="text-slate-500 font-semibold">Subtotal:</span>
              <span className="font-bold text-slate-900">₹{tableCalculations.subtotal.toFixed(2)}</span>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Discount Percentage (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                placeholder="e.g. 10"
                value={calcPctDiscount}
                onChange={(e) => {
                  setCalcPctDiscount(e.target.value);
                  setCalcFlatDiscount("");
                }}
              />
            </div>

            <div className="text-center font-bold text-slate-400 text-[10px]">— OR —</div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Flat Concession Amount (₹)</Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 50"
                value={calcFlatDiscount}
                onChange={(e) => {
                  setCalcFlatDiscount(e.target.value);
                  setCalcPctDiscount("");
                }}
              />
            </div>

            <Button onClick={handleApplyCalculatedDiscount} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs">
              Apply Discount
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Add Service Items Modal */}
      <Dialog open={showServiceItemModal} onOpenChange={setShowServiceItemModal}>
        <DialogContent className="max-w-md bg-white p-5 rounded-xl border border-slate-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Add Hospital Service Item
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Add non-inventory services or consumables to this bill.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddServiceItemSubmit} className="space-y-3 pt-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Service / Item Name</Label>
              <Input
                required
                placeholder="e.g. Consultation Fee / Injection Charges / Dressing"
                value={serviceItemName}
                onChange={(e) => setServiceItemName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Rate / Price (₹)</Label>
                <Input
                  required
                  type="number"
                  min="1"
                  placeholder="₹"
                  value={serviceItemPrice}
                  onChange={(e) => setServiceItemPrice(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">GST Rate (%)</Label>
                <select
                  value={serviceItemGst}
                  onChange={(e) => setServiceItemGst(parseFloat(e.target.value))}
                  className="w-full h-9 rounded border border-slate-200 px-2 text-xs"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-9 text-xs">
              Add Service to Bill
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. More Details Modal */}
      <Dialog open={showMoreDetailsModal} onOpenChange={setShowMoreDetailsModal}>
        <DialogContent className="max-w-md bg-white p-5 rounded-xl border border-slate-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              Line Item Specifications
            </DialogTitle>
          </DialogHeader>

          {detailItemIndex !== null && billingItems[detailItemIndex] && (() => {
            const item = billingItems[detailItemIndex];
            return (
              <div className="space-y-2.5 pt-2 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border space-y-1.5">
                  <div className="font-bold text-slate-900 text-sm">{item.medicine_name}</div>
                  <div className="text-slate-500 font-mono">Category: {item.category}</div>
                  <div className="text-slate-500 font-mono">Batch: {item.batch} | Expiry: {item.expiry}</div>
                  <div className="text-slate-500 font-mono">Pack Size: {item.pack_size || 10} units/pack</div>
                  <div className="text-slate-500 font-mono">HSN Code: {item.hsn_code || "30049099"}</div>
                  <div className="text-slate-500 font-mono">GST Rate: {item.gst_pct || 12}% | Margin: {item.margin_pct}%</div>
                  <div className="text-slate-500 font-mono">Available Stock: {item.stock || 50} units</div>
                </div>

                <Button onClick={() => setShowMoreDetailsModal(false)} className="w-full bg-slate-800 hover:bg-slate-900 text-white h-8 text-xs">
                  Close
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* 5. View Bills & Invoices History Modal */}
      <Dialog open={showViewBillsModal} onOpenChange={setShowViewBillsModal}>
        <DialogContent className="max-w-5xl w-full max-h-[88vh] flex flex-col p-5 bg-white rounded-xl border border-slate-300 shadow-2xl overflow-hidden">
          <DialogHeader className="shrink-0 pb-3 border-b border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900 leading-tight">
                    Pharmacy Bills &amp; Invoice Register
                  </DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">
                    Track settled, unpaid, and central billing invoices • Settle outstanding bills • Reprint receipts
                  </DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportBillsToCSV}
                  className="h-8 text-xs font-semibold gap-1 text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export CSV
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadSavedBills}
                  className="h-8 text-xs font-semibold gap-1 text-slate-700 hover:bg-slate-100 cursor-pointer"
                  title="Refresh Bills"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowViewBillsModal(false)}
                  className="h-8 text-xs font-semibold gap-1.5 text-slate-700 hover:text-rose-700 hover:bg-rose-50 border-slate-300 cursor-pointer"
                  title="Close Register (Backspace / Esc)"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Close</span>
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded font-mono border border-slate-200">
                    Backspace
                  </span>
                </Button>
              </div>
            </div>
          </DialogHeader>

          {(() => {
            const allBills = sanitizeBillsList(savedBillsList);
            const settledBills = allBills.filter(b => b.paymentStatus === "Paid" || (b.isPaidAtPharmacy && b.paymentStatus !== "Unpaid"));
            const unpaidBills = allBills.filter(b => b.paymentStatus === "Unpaid");
            const centralBills = allBills.filter(b => b.paymentStatus === "ForwardedToBilling");

            const settledTotal = settledBills.reduce((acc, b) => acc + Number(b.totalVal || 0), 0);
            const unpaidTotal = unpaidBills.reduce((acc, b) => acc + Number(b.totalVal || 0), 0);
            const centralTotal = centralBills.reduce((acc, b) => acc + Number(b.totalVal || 0), 0);

            // Filter by selected tab
            let listToDisplay = allBills;
            if (billsFilterStatus === "PAID") {
              listToDisplay = settledBills;
            } else if (billsFilterStatus === "UNPAID") {
              listToDisplay = unpaidBills;
            } else if (billsFilterStatus === "CENTRAL BILLING") {
              listToDisplay = centralBills;
            }

            // Search filter
            if (billsSearchQuery.trim()) {
              const q = billsSearchQuery.trim().toLowerCase();
              listToDisplay = listToDisplay.filter(b =>
                (b.invoiceNumber && b.invoiceNumber.toLowerCase().includes(q)) ||
                (b.patientName && b.patientName.toLowerCase().includes(q)) ||
                (b.patientMobile && b.patientMobile.toLowerCase().includes(q)) ||
                (b.patientUHID && b.patientUHID.toLowerCase().includes(q)) ||
                (b.doctorName && b.doctorName.toLowerCase().includes(q)) ||
                (b.items && b.items.some(i => i.medicine_name && i.medicine_name.toLowerCase().includes(q)))
              );
            }

            return (
              <div className="flex-1 min-h-0 flex flex-col gap-3 pt-3 overflow-hidden">
                {/* 1. Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 shrink-0">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Total Invoices</span>
                    <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">{allBills.length}</div>
                    <span className="text-[10px] text-slate-400">All registered bills</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-emerald-800">Settled (Paid)</span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">
                        {settledBills.length}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-emerald-900 font-mono mt-0.5">
                      ₹{settledTotal.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-emerald-700">Collected at counter</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-rose-800">Unpaid (Payment Due)</span>
                      <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-mono">
                        {unpaidBills.length}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-rose-900 font-mono mt-0.5">
                      ₹{unpaidTotal.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-rose-700">Outstanding payment</span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-sky-50/70 border border-sky-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-sky-800">Central Billing</span>
                      <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-mono">
                        {centralBills.length}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-sky-900 font-mono mt-0.5">
                      ₹{centralTotal.toFixed(2)}
                    </div>
                    <span className="text-[10px] text-sky-700">Due at cashier desk</span>
                  </div>
                </div>

                {/* 2. Filter Tabs & Search Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 bg-slate-100/80 p-1.5 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1">
                    {[
                      { id: "ALL", label: `All Bills (${allBills.length})` },
                      { id: "PAID", label: `Settled (${settledBills.length})` },
                      { id: "UNPAID", label: `Unpaid (${unpaidBills.length})` },
                      { id: "CENTRAL BILLING", label: `Central Billing (${centralBills.length})` }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setBillsFilterStatus(tab.id)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition cursor-pointer ${
                          billsFilterStatus === tab.id
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "bg-white text-slate-700 hover:bg-slate-200 border border-slate-300"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search bills, patients, doctor..."
                      value={billsSearchQuery}
                      onChange={(e) => setBillsSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-7 text-xs bg-white rounded-md border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-400 placeholder:text-slate-400"
                    />
                    {billsSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setBillsSearchQuery("")}
                        className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Bills Table */}
                <div className="flex-1 min-h-0 border border-slate-200 rounded-lg overflow-y-auto bg-white shadow-2xs">
                  {listToDisplay.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-10 text-center text-slate-400">
                      <Receipt className="w-8 h-8 text-slate-300 mb-2 stroke-1" />
                      <p className="text-xs font-semibold text-slate-600">No pharmacy bills found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {billsSearchQuery ? "Try refining your search keyword." : "Save a bill from the counter to view it here."}
                      </p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 text-slate-600 font-bold text-[10px] uppercase tracking-wider z-10">
                        <tr>
                          <th className="py-2 px-3">Date / Time</th>
                          <th className="py-2 px-3">Invoice No</th>
                          <th className="py-2 px-3">Patient Info</th>
                          <th className="py-2 px-3">Doctor</th>
                          <th className="py-2 px-3">Items Summary</th>
                          <th className="py-2 px-3 text-right">Total (₹)</th>
                          <th className="py-2 px-3 text-center">Status</th>
                          <th className="py-2 px-3 text-center">Mode</th>
                          <th className="py-2 px-3 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {listToDisplay.map((bill, bIdx) => {
                          const isPaid = bill.paymentStatus === "Paid" || (bill.isPaidAtPharmacy && bill.paymentStatus !== "Unpaid");
                          const isForwarded = bill.paymentStatus === "ForwardedToBilling";
                          const isUnpaid = !isPaid && !isForwarded;
                          const itemsCount = (bill.items || []).length;
                          const itemsPreview = (bill.items || [])
                            .slice(0, 2)
                            .map(i => `${i.medicine_name} (×${i.dispensed_qty || i.qty || 1})`)
                            .join(", ");
                          const hasMoreItems = itemsCount > 2;

                          return (
                            <tr key={bill.invoiceNumber || bIdx} className="hover:bg-slate-50/80 transition">
                              <td className="py-2 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                                {bill.date || "Today"}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                                {bill.invoiceNumber}
                              </td>
                              <td className="py-2 px-3">
                                <div className="font-semibold text-slate-900 flex items-center gap-1">
                                  <User className="w-3 h-3 text-slate-400" />
                                  <span>{bill.patientName || "Walk-in Customer"}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  {bill.patientMobile ? `Mob: ${bill.patientMobile}` : bill.patientUHID ? `ID: ${bill.patientUHID}` : "Counter Sale"}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-slate-600 text-[11px]">
                                {bill.doctorName && !bill.doctorName.toLowerCase().includes("walk-in") && !bill.doctorName.toLowerCase().includes("otc") ? (
                                  <span className="flex items-center gap-1 text-slate-800">
                                    <Stethoscope className="w-3 h-3 text-blue-500" />
                                    {bill.doctorName}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">OTC / Walk-in</span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-[11px] text-slate-600 max-w-[220px]">
                                <span className="line-clamp-1">
                                  {itemsPreview || "Medicines"}
                                  {hasMoreItems && <span className="text-[10px] text-slate-400 font-bold ml-1">+{itemsCount - 2} more</span>}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                                ₹{Number(bill.totalVal || 0).toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                {isPaid ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    SETTLED (PAID)
                                  </span>
                                ) : isForwarded ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                    <Clock className="w-3 h-3 text-sky-600" />
                                    CENTRAL BILLING
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                    <AlertCircle className="w-3 h-3 text-rose-600" />
                                    UNPAID (DUE)
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center text-[10px] font-semibold text-slate-600 whitespace-nowrap">
                                {bill.paymentMethod || bill.paymentMode || "Cash"}
                              </td>
                              <td className="py-2 px-3 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1.5">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => printPharmacyInvoiceReceipt(bill)}
                                    className="h-6 px-2 text-[10px] font-semibold flex items-center gap-1 text-slate-700 hover:bg-slate-100 border-slate-300 cursor-pointer"
                                    title="Print / View Receipt"
                                  >
                                    <Printer className="w-3 h-3 text-slate-500" />
                                    Receipt
                                  </Button>

                                  {!isPaid && (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSettlingBill(bill);
                                        setSettlePaymentMode("Cash");
                                      }}
                                      className="h-6 px-2 text-[10px] font-bold flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                      title="Collect Payment & Settle Bill"
                                    >
                                      <Check className="w-3 h-3" />
                                      Settle
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* 6. Settle Bill Confirmation Modal */}
      <Dialog open={Boolean(settlingBill)} onOpenChange={(open) => { if (!open) setSettlingBill(null); }}>
        <DialogContent className="max-w-md bg-white p-5 rounded-xl border border-slate-300 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Settle Pharmacy Bill
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Collect payment and mark this bill as settled and paid.
            </DialogDescription>
          </DialogHeader>

          {settlingBill && (
            <div className="space-y-3.5 pt-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Invoice Number:</span>
                  <span className="font-mono font-bold text-slate-900">{settlingBill.invoiceNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Patient Name:</span>
                  <span className="font-semibold text-slate-900">{settlingBill.patientName || "Walk-in"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Current Status:</span>
                  <span className="font-bold text-rose-600 font-mono">
                    {settlingBill.paymentStatus === "ForwardedToBilling" ? "Central Billing" : "Payment Due (Unpaid)"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Total Due Amount:</span>
                  <span className="text-base font-bold text-emerald-700 font-mono">
                    ₹{Number(settlingBill.totalVal || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Select Collection Payment Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Cash", "UPI", "Credit/Debit Card", "Net Banking"].map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSettlePaymentMode(mode)}
                      className={`p-2 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        settlePaymentMode === mode
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-xs"
                          : "bg-white text-slate-700 hover:bg-slate-50 border-slate-300"
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSettlingBill(null)}
                  className="flex-1 h-9 text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => handleConfirmSettleBill(settlingBill, settlePaymentMode)}
                  className="flex-1 h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                >
                  Confirm &amp; Settle (₹{Number(settlingBill.totalVal || 0).toFixed(2)})
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
