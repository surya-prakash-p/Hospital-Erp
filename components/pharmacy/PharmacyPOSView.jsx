"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Search, Plus, Trash2, Edit3, ShoppingCart, ShoppingBag, 
  RotateCcw, Printer, CheckCircle, Calendar, Pill, DollarSign,
  AlertCircle, ChevronDown, ArrowRight, User, Stethoscope,
  Clock, ShieldAlert, PackageCheck, FileText, X,
  Percent, RefreshCw
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

    const isPaid = Boolean(record.isPaidAtPharmacy);
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
            .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 10px; margin-bottom: 12px; font-size: 10.5px; }
            .meta-item { display: flex; justify-content: space-between; }
            .meta-lbl { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 9px; }
            .meta-val { font-weight: 700; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
            th { background: #f1f5f9; padding: 6px 8px; font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
            .summary-box { border-top: 2px solid #0f172a; padding-top: 8px; margin-bottom: 12px; }
            .sum-row { display: flex; justify-content: space-between; font-size: 11px; padding: 2px 0; }
            .grand-total { font-size: 14px; font-weight: 900; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 4px; margin-top: 4px; }
            .stamp { text-align: center; border: 2px dashed ${isPaid ? '#16a34a' : '#d97706'}; color: ${isPaid ? '#16a34a' : '#d97706'}; padding: 6px 12px; border-radius: 6px; font-weight: 900; font-size: 12px; letter-spacing: 1px; width: fit-content; margin: 10px auto; }
            .footer { text-align: center; font-size: 9.5px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 8px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="hosp-title">THANGAM HOSPITAL</div>
            <div class="hosp-sub">123 Health City Road, Coimbatore - 641012 | Phone: +91 422 2345678</div>
            <div class="hosp-sub">GSTIN: 33AAAAA1111A1Z1 | Pharmacy DL: DL-COI-90823H</div>
            <div class="badge ${isPaid ? 'badge-paid' : 'badge-fwd'}">
              ${isPaid ? 'PAID AT PHARMACY COUNTER' : 'FORWARDED TO CENTRAL BILLING'}
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
          </div>

          <div class="stamp">
            ${isPaid ? 'PAID & DISPENSED' : 'FORWARDED TO BILLING'}
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
  const searchInputRef = useRef(null);
  const patientInputRef = useRef(null);
  const doctorInputRef = useRef(null);
  const discountInputRef = useRef(null);
  const invoiceInputRef = useRef(null);
  const remarksInputRef = useRef(null);

  // 2. POS Billing Table Items State
  const [billingItems, setBillingItems] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);

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
      const isPayAtDesk = paymentMode !== "CENTRAL BILLING";
      const invoiceNo = invoiceNumber || `INV-${Date.now()}`;
      const pName = patientName || "Walk-in Customer";
      const pMobile = patientMobile || "";
      const doc = (isHospitalPrescription && doctorName && doctorName.trim()) ? doctorName.trim() : "";

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
          appointment_status: isPayAtDesk ? "Completed" : "Billing",
          bill_amount: (selectedWalkIn.bill_amount || 0) + (isPayAtDesk ? 0 : finalAmt),
          pharmacy_bill_amount: finalAmt,
          pharmacy_payment_status: isPayAtDesk ? "Paid" : "ForwardedToBilling",
          pharmacy_paid_amount: isPayAtDesk ? finalAmt : 0,
          pharmacy_due_amount: isPayAtDesk ? 0 : finalAmt,
          dispensed_medicines: formattedDispenseItems
        });

        // Save to Patient Profile
        saveInvoiceToProfile?.(selectedWalkIn.mobile_number || pMobile, {
          name: `Pharmacy Bill ${invoiceNo} - ${formattedDispenseItems.map(i => `${i.medicine_name} (x${i.qty})`).join(", ")}`,
          bill_amount: finalAmt,
          payment_method: isPayAtDesk ? paymentMode : "Pending at Central Billing",
          walkinData: {
            name: selectedWalkIn.name,
            patient_name: pName,
            mobile_number: pMobile,
            doctor: doc,
            pharmacy_bill_amount: finalAmt,
            pharmacy_payment_status: isPayAtDesk ? "Paid" : "ForwardedToBilling",
            pharmacy_paid_amount: isPayAtDesk ? finalAmt : 0,
            dispensed_medicines: formattedDispenseItems
          }
        });
      }

      // Record Finance Transaction
      if (typeof window !== 'undefined' && isPayAtDesk && finalAmt > 0) {
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
          method: paymentMode,
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
          method: paymentMode,
          date: new Date().toISOString().split("T")[0],
          notes: `Invoice: ${invoiceNo} | Payment: ${paymentMode}${doc ? ` | Doctor: ${doc}` : ''} | Items: ${formattedDispenseItems.map(i => `${i.medicine_name} ×${i.qty}`).join(", ")}`
        };
        recordFinanceTransaction?.(rxTx).catch(() => null);
      }

      // Audit Log
      await createPharmacyAuditLog?.({
        action: isCollectAndDispense ? "Collect & Dispense" : "POS Sale",
        patient: pName,
        details: `Invoice: ${invoiceNo} | Total: ₹${finalAmt.toFixed(2)} | Method: ${paymentMode}${doc ? ` | Doctor: ${doc}` : ''}`,
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
        paymentMethod: isPayAtDesk ? paymentMode : "Pending at Central Billing",
        paymentMode: isPayAtDesk ? "Paid at Pharmacy Counter" : "Forwarded to Central Billing",
        isPaidAtPharmacy: isPayAtDesk,
        pharmacistName: pharmacistName,
        date: new Date().toLocaleString("en-IN")
      };

      setLatestDispenseRecord?.(receiptData);
      setShowDispenseReceiptModal?.(true);

      showToast?.(`Bill Saved Successfully! Invoice: ${invoiceNo} generated.`, "success");

      // Reset Bill Form for next patient
      setBillingItems([]);
      setPatientName("Walk-in Customer");
      setPatientMobile("");
      setPatientUHID("");
      setDoctorName("");
      setIsHospitalPrescription(false);
      setBillDiscountPct(0);
      setRemarks("");
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

      // Ignore if user is inside another active modal
      if (showSubstituteModal || showDiscountModal || showServiceItemModal || showMoreDetailsModal) {
        return;
      }

      // Alt + S -> Focus Medicine Search
      if (isAlt && key.toLowerCase() === 's') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
        return;
      }

      // Alt + A -> Add Medicine modal / focus
      if (isAlt && (key.toLowerCase() === 'a' || key === '+')) {
        e.preventDefault();
        onAddNewMedicine?.();
        return;
      }

      // Alt + N -> Quick OTC / Add Service
      if (isAlt && key.toLowerCase() === 'n') {
        e.preventDefault();
        onOpenOTCSale?.();
        return;
      }

      // Alt + O -> Outside Purchase
      if (isAlt && key.toLowerCase() === 'o') {
        e.preventDefault();
        handleAddOutsidePurchase();
        return;
      }

      // Alt + P -> Patient Focus
      if (isAlt && key.toLowerCase() === 'p') {
        e.preventDefault();
        patientInputRef.current?.focus();
        patientInputRef.current?.select();
        return;
      }

      // Alt + T -> Doctor Toggle / Focus
      if (isAlt && key.toLowerCase() === 't') {
        e.preventDefault();
        setIsHospitalPrescription(true);
        if (!doctorName) setDoctorName("Dr. Arun Kumar, MBBS, MD");
        setTimeout(() => {
          doctorInputRef.current?.focus();
          doctorInputRef.current?.select();
        }, 50);
        return;
      }

      // Alt + D -> Discount Focus
      if (isAlt && key.toLowerCase() === 'd') {
        e.preventDefault();
        discountInputRef.current?.focus();
        discountInputRef.current?.select();
        return;
      }

      // Alt + I -> Invoice No Focus
      if (isAlt && key.toLowerCase() === 'i') {
        e.preventDefault();
        invoiceInputRef.current?.focus();
        invoiceInputRef.current?.select();
        return;
      }

      // Alt + R -> Remarks Focus / Sales Return
      if (isAlt && key.toLowerCase() === 'r') {
        e.preventDefault();
        onOpenSalesReturn?.();
        return;
      }

      // Alt + Z -> Calculate Discount Dialog
      if (isAlt && key.toLowerCase() === 'z') {
        e.preventDefault();
        setShowDiscountModal(true);
        return;
      }

      // Alt + C -> Collect & Dispense
      if (isAlt && key.toLowerCase() === 'c') {
        e.preventDefault();
        handleMasterSaveBill({ isCollectAndDispense: true });
        return;
      }

      // Alt + E -> Prescriptions Queue
      if (isAlt && key.toLowerCase() === 'e') {
        e.preventDefault();
        handleTabChange?.("dispensing");
        return;
      }

      // Ctrl + P -> Print & Save
      if (isCtrlOrMeta && key.toLowerCase() === 'p') {
        e.preventDefault();
        handleMasterSaveBill({ autoPrint: true });
        return;
      }

      // Ctrl + Enter or Ctrl + S -> Save Bill Primary Action
      if (isCtrlOrMeta && (key === 'Enter' || key.toLowerCase() === 's')) {
        e.preventDefault();
        handleMasterSaveBill();
        return;
      }

      // Ctrl + B -> Add Batch
      if (isCtrlOrMeta && key.toLowerCase() === 'b') {
        e.preventDefault();
        onOpenAddBatch?.();
        return;
      }

      // Delete key -> Delete selected row
      if (key === 'Delete' && selectedRowIndex >= 0 && billingItems[selectedRowIndex]) {
        e.preventDefault();
        handleDeleteRow(selectedRowIndex);
        return;
      }
    };

    window.addEventListener("keydown", handlePOSKeyDown);
    return () => window.removeEventListener("keydown", handlePOSKeyDown);
  }, [
    billingItems, selectedRowIndex, showSubstituteModal, showDiscountModal,
    showServiceItemModal, showMoreDetailsModal, posSearchQuery, tableCalculations,
    isHospitalPrescription, doctorName
  ]);

  return (
    <div className="flex flex-col gap-2 w-full max-w-full font-sans text-slate-800 antialiased select-none">
      
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          1. TOP HEADER (Compact Traditional POS Bar)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex items-center justify-between bg-slate-100/90 px-3.5 py-1.5 rounded-lg border border-slate-300/80 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-indigo-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Pill className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-tight text-slate-900 leading-none">Pharmacy</h1>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 font-semibold px-1.5 py-0.2 rounded border border-indigo-200">
                POS Billing Counter
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">
              Dispense Medicines • Billing • Inventory
            </p>
          </div>
        </div>

        {/* Right side quick POS buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              searchInputRef.current?.focus();
              searchInputRef.current?.select();
            }}
            className="px-2 py-1 text-[11px] font-semibold bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <Search className="w-3 h-3 text-slate-500" />
            <span>Search</span>
            <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded border border-slate-200 font-mono">Alt + S</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleTabChange?.("inventory");
              showToast?.("Switched to Inventory Low Stock View", "info");
            }}
            className="px-2 py-1 text-[11px] font-semibold bg-white text-amber-700 border border-slate-300 rounded hover:bg-amber-50 shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>Low Stock</span>
            <span className="text-[9px] bg-amber-50 text-amber-600 px-1 rounded border border-amber-200 font-mono">Alt + L</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleTabChange?.("inventory");
              showToast?.("Switched to Inventory Expiry View", "info");
            }}
            className="px-2 py-1 text-[11px] font-semibold bg-white text-rose-700 border border-slate-300 rounded hover:bg-rose-50 shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <Calendar className="w-3 h-3 text-rose-600" />
            <span>Expiry</span>
            <span className="text-[9px] bg-rose-50 text-rose-600 px-1 rounded border border-rose-200 font-mono">Alt + E</span>
          </button>

          <button
            type="button"
            onClick={onOpenExport}
            className="px-2 py-1 text-[11px] font-semibold bg-white text-slate-700 border border-slate-300 rounded hover:bg-slate-50 shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <FileText className="w-3 h-3 text-slate-500" />
            <span>Export</span>
            <span className="text-[9px] bg-slate-100 text-slate-500 px-1 rounded border border-slate-200 font-mono">Alt + D</span>
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
            <DropdownMenuContent align="end" className="w-48 p-1 text-xs bg-white border border-slate-300 rounded-lg shadow-xl">
              <DropdownMenuItem onClick={onOpenOTCSale} className="flex items-center gap-2 cursor-pointer">
                <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" /> Quick OTC (Alt + N)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenSalesReturn} className="flex items-center gap-2 cursor-pointer">
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" /> Sales Return (Alt + R)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          2. MEDICINE SEARCH AREA (Yellow/Gold Highlight Bar matching Reference)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="relative w-full bg-white p-1 rounded-lg border-2 border-amber-400 shadow-xs flex items-center gap-2">
        {/* Large Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search medicines by name, barcode or batch... (Press Alt + S)"
            value={posSearchQuery}
            onChange={(e) => {
              setPosSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => {
              if (posSearchQuery.trim().length >= 1) setShowSearchDropdown(true);
            }}
            className="w-full h-9 pl-8 pr-3 text-xs font-medium text-slate-900 bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
          />

          {/* Autocomplete Search Dropdown */}
          {showSearchDropdown && posSearchQuery.trim().length >= 1 && (() => {
            const q = posSearchQuery.trim().toLowerCase();
            const results = medicines.filter(m => !m.disabled && (
              (m.medicine_name && m.medicine_name.toLowerCase().includes(q)) ||
              (m.generic_name && m.generic_name.toLowerCase().includes(q)) ||
              (m.brand && m.brand.toLowerCase().includes(q)) ||
              (m.barcode && m.barcode.toLowerCase().includes(q)) ||
              (m.batch_number && m.batch_number.toLowerCase().includes(q))
            )).slice(0, 10);

            return (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-lg shadow-2xl border border-slate-300 z-50 max-h-72 overflow-y-auto divide-y divide-slate-100">
                {results.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">
                    No medicine catalog matches found for &quot;{posSearchQuery}&quot;. Press Alt + A to add new medicine.
                  </div>
                ) : (
                  results.map((med, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleAddMedicineToBill(med)}
                      className="p-2 px-3 hover:bg-amber-50/80 cursor-pointer flex items-center justify-between gap-3 transition text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{med.medicine_name}</span>
                          {med.strength && med.strength !== "-" && (
                            <span className="text-[10px] text-slate-500 font-normal">({med.strength})</span>
                          )}
                          <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1 py-0.2 rounded border">
                            Batch: {med.batch_number || "BT-01"}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {med.generic_name ? `Generic: ${med.generic_name}` : med.category || "Regular"} • Exp: {med.expiry_date || "12/2027"} • Rack: {med.rack_location || "A-01"}
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          (med.stock || 0) > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {(med.stock || 0) > 0 ? `${med.stock} in stock` : "0 stock"}
                        </span>
                        <div>
                          <div className="font-mono font-bold text-slate-900 text-xs">
                            ₹{Number(med.selling_price || med.mrp || 25).toFixed(2)}
                          </div>
                          <div className="text-[9px] text-slate-400 line-through">
                            MRP ₹{Number(med.mrp || 30).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })()}

          {posSearchQuery && (
            <button
              type="button"
              onClick={() => {
                setPosSearchQuery("");
                setShowSearchDropdown(false);
              }}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          3. MEDICINE BILLING TABLE (High-Density Traditional Desktop POS Table)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="bg-white border border-slate-300 rounded-lg shadow-2xs overflow-hidden flex flex-col min-h-[300px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse text-[11px] select-text">
            <thead>
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
                  <tr key={`empty-${emptyIdx}`} className="h-8 border-b border-slate-100 text-slate-300 divide-x divide-slate-100">
                    <td className="text-center font-mono text-[10px]">{emptyIdx === 0 ? "1" : ""}</td>
                    <td className="px-3 text-slate-400 font-normal">
                      {emptyIdx === 0 ? "Search product above or press Alt + S to begin billing..." : ""}
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
                      className={`hover:bg-amber-50/60 divide-x divide-slate-200 transition-colors h-8 ${
                        isSelected ? "bg-amber-50/90 font-semibold" : idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                      }`}
                    >
                      {/* 1. Row Index */}
                      <td className="py-1 px-1 text-center font-mono text-slate-500 font-semibold text-[10px]">
                        {idx + 1}
                      </td>

                      {/* 2. Product Name */}
                      <td className="py-1 px-2.5">
                        <div className="font-bold text-slate-900 leading-tight flex items-center gap-1.5 flex-wrap">
                          <span>{item.medicine_name}</span>
                          {item.strength && item.strength !== "-" && !item.medicine_name.includes(item.strength) && (
                            <span className="text-[10px] text-slate-500 font-normal">({item.strength})</span>
                          )}
                          {item.source === "Outside Purchase" && (
                            <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1 rounded">Outside</span>
                          )}
                        </div>
                      </td>

                      {/* 3. Batch */}
                      <td className="py-1 px-1 text-center font-mono text-[10px]">
                        <input
                          type="text"
                          value={item.batch || ""}
                          onChange={(e) => handleUpdateRowField(idx, "batch", e.target.value)}
                          className="w-full text-center border-none bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded text-[10px] font-mono py-0.5"
                        />
                      </td>

                      {/* 4. Expiry */}
                      <td className="py-1 px-1 text-center font-mono text-[10px] text-slate-600">
                        <input
                          type="text"
                          value={item.expiry || ""}
                          onChange={(e) => handleUpdateRowField(idx, "expiry", e.target.value)}
                          placeholder="MM/YY"
                          className="w-full text-center border-none bg-transparent focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded text-[10px] font-mono py-0.5"
                        />
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
                            title="More Details (Alt + M)"
                            onClick={() => {
                              setDetailItemIndex(idx);
                              setShowMoreDetailsModal(true);
                            }}
                            className="text-slate-400 hover:text-indigo-600 p-0.5 rounded hover:bg-slate-100"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
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
            onClick={onAddNewMedicine}
            className="px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded hover:bg-black shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="bg-slate-700 text-amber-300 text-[9px] px-1 py-0.2 rounded font-mono">Alt + A</span>
            <span>+ Add Medicine</span>
          </button>

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
            <span className="bg-slate-700 text-blue-300 text-[9px] px-1 py-0.2 rounded font-mono">Alt + S</span>
            <span>Substitute</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDiscountModal(true)}
            className="px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded hover:bg-black shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="bg-slate-700 text-emerald-300 text-[9px] px-1 py-0.2 rounded font-mono">Alt + Z</span>
            <span>Calculate Discount</span>
          </button>

          <button
            type="button"
            onClick={onOpenSalesReturn}
            className="px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded hover:bg-black shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="bg-slate-700 text-amber-300 text-[9px] px-1 py-0.2 rounded font-mono">Alt + R</span>
            <span>Return</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddBatch}
            className="px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded hover:bg-black shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="bg-slate-700 text-indigo-300 text-[9px] px-1 py-0.2 rounded font-mono">Ctrl + B</span>
            <span>Add Batch</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (selectedRowIndex >= 0) {
                setDetailItemIndex(selectedRowIndex);
                setShowMoreDetailsModal(true);
              } else {
                showToast?.("Select a medicine row to view more details", "info");
              }
            }}
            className="px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded hover:bg-black shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <span className="bg-slate-700 text-slate-300 text-[9px] px-1 py-0.2 rounded font-mono">Alt + M</span>
            <span>More Details</span>
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

          {/* Discount % with Alt D */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-slate-600 uppercase">Discount %</Label>
              <span className="text-[9px] font-mono bg-slate-200 text-slate-700 px-1 rounded border">Alt + D</span>
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
          
          {/* Remarks with Alt R */}
          <div className="space-y-1 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold text-slate-600 uppercase">Remarks</Label>
              <span className="text-[9px] font-mono bg-slate-200 text-slate-700 px-1 rounded border">Alt + R</span>
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
          <div className="space-y-1 md:col-span-2">
            <Label className="text-[10px] font-bold text-slate-600 uppercase">Payment Mode</Label>
            <select
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
              className="w-full h-8 px-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            >
              <option value="CASH">CASH</option>
              <option value="UPI / QR">UPI / QR (Instant)</option>
              <option value="CARD">CREDIT / DEBIT CARD</option>
              <option value="CREDIT">HOSPITAL CREDIT / IPD</option>
              <option value="CENTRAL BILLING">FORWARD TO CENTRAL BILLING</option>
            </select>
          </div>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          6. BOTTOM BILLING ACTION BUTTONS (Large POS Buttons matching Reference)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={() => handleMasterSaveBill({ isCollectAndDispense: true })}
          className="px-3 py-2 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>Collect & Dispense</span>
          <span className="bg-slate-700 text-slate-200 text-[9px] px-1 py-0.2 rounded font-mono">Alt + C</span>
        </button>

        <button
          type="button"
          onClick={() => setShowServiceItemModal(true)}
          className="px-3 py-2 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-400" />
          <span>Add Service Items</span>
          <span className="bg-slate-700 text-slate-200 text-[9px] px-1 py-0.2 rounded font-mono">Alt + N</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange?.("dispensing")}
          className="px-3 py-2 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-amber-400" />
          <span>Prescription</span>
          <span className="bg-slate-700 text-slate-200 text-[9px] px-1 py-0.2 rounded font-mono">Alt + E</span>
        </button>

        <button
          type="button"
          onClick={() => handleMasterSaveBill({ autoPrint: true })}
          className="px-3.5 py-2 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5 text-blue-400" />
          <span>Print & Save</span>
          <span className="bg-slate-700 text-slate-200 text-[9px] px-1 py-0.2 rounded font-mono">Ctrl + P</span>
        </button>

        {/* Primary Save Action */}
        <button
          type="button"
          onClick={() => handleMasterSaveBill()}
          className="px-5 py-2 text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-98"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Save Bill</span>
          <span className="bg-blue-800 text-white text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">Ctrl + Enter</span>
        </button>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          7. PHARMACY MODULE NAVIGATION & FOOTER (Docked cleanly at bottom)
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="w-full mt-2 bg-slate-900 text-white rounded-lg border border-slate-800 p-1.5 shadow-sm">
        {/* Module Navigation Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 w-full">
          {[
            { id: "dashboard", label: "Pharmacy", shortcut: "Alt + 1" },
            { id: "inventory", label: "Inventory", shortcut: "Alt + 2" },
            { id: "dispensing", label: "Prescriptions Queue", shortcut: "Alt + 3" },
            { id: "registers", label: "Compliance Records", shortcut: "Alt + 4" },
            { id: "logistics", label: "Purchase & Receiving", shortcut: "Alt + 5" }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange?.(tab.id)}
              className={`px-3 py-2 rounded text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer w-full text-center ${
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
    </div>
  );
}
