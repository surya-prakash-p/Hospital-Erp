"use client";

import { useState, useEffect } from "react";
import { Pill, CheckCircle, AlertCircle, Info, Activity, PackageCheck, Plus, Layers, PlusCircle, RefreshCw, Printer, BadgeCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { getQueue, updateWalkIn, getMedicines, createMedicine, updateMedicineStock, updateMedicine, saveInvoiceToProfile } from "@/lib/hospital-service";
import { jsPDF } from "jspdf";

export default function PharmacyPage() {
  const [queue, setQueue] = useState([]);
  const [selectedWalkIn, setSelectedWalkIn] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [activeTab, setActiveTab] = useState("queue"); // "queue" or "inventory"
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Editable prescription and custom quantities
  const [editPrescription, setEditPrescription] = useState("");
  const [dispenseItems, setDispenseItems] = useState([]);
  const [selectedAddMed, setSelectedAddMed] = useState("");
  const [medSearchText, setMedSearchText] = useState("");
  const [isMedDropdownOpen, setIsMedDropdownOpen] = useState(false);
  const [showOutsideConfirm, setShowOutsideConfirm] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // OTC Walk-in Customer state variables
  const [showOTCModal, setShowOTCModal] = useState(false);
  const [otcPatientName, setOtcPatientName] = useState("Walk-in Customer");
  const [otcMobileNumber, setOtcMobileNumber] = useState("");
  const [otcDispenseItems, setOtcDispenseItems] = useState([]);
  const [otcSearchQuery, setOtcSearchQuery] = useState("");
  const [isOtcDropdownOpen, setIsOtcDropdownOpen] = useState(false);
  const [otcPaymentMethod, setOtcPaymentMethod] = useState("Cash");
  const [otcIsSubmitting, setOtcIsSubmitting] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);

  // New medicine form state
  const [newMedData, setNewMedData] = useState({
    medicine_name: "", generic_name: "", batch_number: "", mfg_date: "", exp_date: "",
    shelf_life: "", manufacturer: "", supplier: "", category: "Tablet", strength: "",
    pack_size: "", purchase_price: "", mrp: "", price: "", opening_stock: "",
    stock: "", reorder_level: "", rack_location: "", storage: "Room Temperature", barcode: "", is_recalled: false
  });
  const [isSubmittingMed, setIsSubmittingMed] = useState(false);

  const handleMedChange = (field, value) => {
    setNewMedData(prev => ({ ...prev, [field]: value }));
  };

  const showToast = (message, type = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Load all queue and medicine data
  async function loadAllData() {
    try {
      const q = await getQueue();
      setQueue(q);
      const meds = await getMedicines();
      setMedicines(meds);
    } catch (err) {
      showToast("Error loading data from server", "error");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAllData();
  }, []);

  const handleSelectWalkIn = (item) => {
    setSelectedWalkIn(item);
    setEditPrescription(item.prescription || "");
    
    // Auto-detect matching inventory medicines from doctor's typed prescription
    const text = (item.prescription || "").toLowerCase();
    const items = [];
    medicines.forEach(med => {
      if (text.includes(med.medicine_name.toLowerCase())) {
        items.push({
          medicine_name: med.medicine_name,
          qty: 10, // default tablets count
          stock: med.stock,
          price: med.price || 0
        });
      }
    });
    setDispenseItems(items);
  };

  const handleUpdateItemQty = (index, delta) => {
    setDispenseItems(prev => 
      prev.map((item, idx) => {
        if (idx === index) {
          return { ...item, qty: Math.max(1, item.qty + delta) };
        }
        return item;
      })
    );
  };

  const handleRemoveDispenseItem = (index) => {
    setDispenseItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Dispense medications & decrement matching stocks optimistically
  const handleDispense = async (isOutsidePurchase = false) => {
    if (!selectedWalkIn) return;
    const targetWalkInName = selectedWalkIn.name;
    const originalQueue = [...queue];

    // Optimistically update local states
    setQueue(prev => prev.filter(q => q.name !== targetWalkInName));
    
    // Deduct stock levels in UI by exact quantities (skip if outside purchase)
    if (!isOutsidePurchase) {
      setMedicines(prev => 
        prev.map(med => {
          const itemToDeduct = dispenseItems.find(i => i.medicine_name === med.medicine_name);
          if (itemToDeduct) {
            return { ...med, stock: Math.max(0, med.stock - itemToDeduct.qty) };
          }
          return med;
        })
      );
    }

    showToast(isOutsidePurchase ? "Marking as Outside Purchase..." : "Dispensing medications (updating)...", "info");
    setSelectedWalkIn(null);

    try {
      const pharmacyBillAmount = isOutsidePurchase ? 0 : dispenseItems.reduce((acc, item) => acc + (item.qty * item.price), 0);

      await updateWalkIn(targetWalkInName, {
        prescription: editPrescription,
        pharmacy_status: "Completed",
        appointment_status: "Billing",
        pharmacy_bill_amount: pharmacyBillAmount,
        dispensed_medicines: isOutsidePurchase ? [] : dispenseItems
      });

      // Automatically log payment and save pharmacy invoice to profile if not an outside purchase
      if (!isOutsidePurchase && pharmacyBillAmount > 0) {
        const now = Date.now();
        const itemList = dispenseItems.map(i => `${i.medicine_name} (x${i.qty})`).join(", ");

        // A. Save to dept payments log
        const storedPayments = localStorage.getItem("hospital_dept_payments");
        const deptPayments = storedPayments ? JSON.parse(storedPayments) : [];
        deptPayments.unshift({
          id: `dp-pharm-${now}`,
          walkInId: targetWalkInName,
          patientName: selectedWalkIn.patient_name,
          mobile: selectedWalkIn.mobile_number,
          department: "Pharmacy",
          description: `Medicines — ${itemList}`,
          amount: pharmacyBillAmount,
          method: "UPI",
          date: new Date().toISOString().split("T")[0],
          status: "Paid"
        });
        localStorage.setItem("hospital_dept_payments", JSON.stringify(deptPayments));

        // B. Also record in finance ledger
        const storedFinance = localStorage.getItem("hospital_custom_finance");
        const financeEntries = storedFinance ? JSON.parse(storedFinance) : [];
        financeEntries.unshift({
          id: `tx-pharm-${now}`,
          title: `Pharmacy Dispensation — ${selectedWalkIn.patient_name}`,
          type: "Income",
          category: "Clinical Services",
          amount: pharmacyBillAmount,
          method: "UPI",
          date: new Date().toISOString().split("T")[0],
          notes: `Payment received at Pharmacy desk. Items: ${itemList}. Walk-in: ${targetWalkInName}`
        });
        localStorage.setItem("hospital_custom_finance", JSON.stringify(financeEntries));

        // C. Save pharmacy invoice to profile
        saveInvoiceToProfile(selectedWalkIn.mobile_number, {
          name: `Pharmacy Dispensation - ${itemList}`,
          bill_amount: pharmacyBillAmount,
          payment_method: "UPI",
          walkinData: {
            name: targetWalkInName,
            patient_name: selectedWalkIn.patient_name,
            mobile_number: selectedWalkIn.mobile_number,
            doctor: selectedWalkIn.doctor,
            docFee: 0,
            labFee: 0,
            pharmacy_bill_amount: pharmacyBillAmount,
            dispensed_medicines: dispenseItems,
            need_lab_test: 0,
            deptAlreadyPaid: 0,
            netBalance: pharmacyBillAmount,
            paymentMethod: "UPI"
          }
        });
      }

      // Deduct stock for matching medicines by their selected quantities (skip if outside purchase)
      let deductedCount = 0;
      if (!isOutsidePurchase) {
        for (const item of dispenseItems) {
          try {
            await updateMedicineStock(item.medicine_name, -item.qty);
            deductedCount++;
          } catch (stockErr) {
            console.error(`Failed to deduct stock for ${item.medicine_name}:`, stockErr);
          }
        }
      }

      if (isOutsidePurchase) {
        showToast(`Marked as Outside Purchase. Routed to Billing.`, "success");
      } else if (deductedCount > 0) {
        showToast(`Medication dispensed! Fulfill logs complete.`, "success");
      } else {
        showToast("Medications dispensed! Routed to Billing.", "success");
      }

      // Sync final state in background
      await loadAllData();
    } catch (err) {
      // Rollback on server failure
      setQueue(originalQueue);
      showToast("Failed to process transaction. Server error.", "error");
    }
  };

  const handlePrintOTCInvoice = (patientName, mobileNumber, items, totalBill, paymentMethod, walkInId) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      let posY = 20;

      // Header
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("THANGAM HOSPITAL", 105, posY, { align: "center" });
      posY += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("123 Health City Road, Coimbatore - 641012", 105, posY, { align: "center" });
      posY += 5;
      doc.text("Phone: +91 422 2345678 | Email: billing@thangam.org", 105, posY, { align: "center" });
      posY += 8;

      // Line separator
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(20, posY, 190, posY);
      posY += 8;

      // Invoice Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(219, 39, 119); // pink-600
      doc.text("PHARMACY DISPENSATION INVOICE (OTC WALK-IN)", 20, posY);
      posY += 8;

      // Meta Info Table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Invoice/OTC ID:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(walkInId, 50, posY);

      doc.setFont("helvetica", "bold");
      doc.text("Patient Name:", 115, posY);
      doc.setFont("helvetica", "normal");
      doc.text(patientName || "Walk-in Customer", 145, posY);
      posY += 6;

      doc.setFont("helvetica", "bold");
      doc.text("Date & Time:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleString(), 50, posY);

      doc.setFont("helvetica", "bold");
      doc.text("Mobile Number:", 115, posY);
      doc.setFont("helvetica", "normal");
      doc.text(mobileNumber || "N/A", 145, posY);
      posY += 8;

      // Line separator
      doc.line(20, posY, 190, posY);
      posY += 8;

      // Doctor Note
      doc.setFont("helvetica", "bold");
      doc.text("Prescribing Doctor:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text("Self (OTC / No Prescription)", 55, posY);
      posY += 8;

      // Table Headers
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(20, posY - 4, 170, 7, "F");
      doc.text("Medicine Name", 22, posY);
      doc.text("Qty", 110, posY, { align: "center" });
      doc.text("Price/Unit", 140, posY, { align: "right" });
      doc.text("Amount", 185, posY, { align: "right" });
      posY += 8;

      // Line separator
      doc.line(20, posY - 3, 190, posY - 3);

      doc.setFont("helvetica", "normal");
      items.forEach((item) => {
        const itemAmount = item.qty * (item.price || 0);
        doc.text(item.medicine_name, 22, posY);
        doc.text(String(item.qty), 110, posY, { align: "center" });
        doc.text(`INR ${(item.price || 0).toFixed(2)}`, 140, posY, { align: "right" });
        doc.text(`INR ${itemAmount.toFixed(2)}`, 185, posY, { align: "right" });
        posY += 6;
      });

      // Totals
      posY += 4;
      doc.line(20, posY, 190, posY);
      posY += 8;

      doc.setFont("helvetica", "bold");
      doc.text("Payment Method:", 22, posY);
      doc.setFont("helvetica", "normal");
      doc.text(paymentMethod, 55, posY);

      doc.setFont("helvetica", "bold");
      doc.text("GRAND TOTAL:", 115, posY);
      doc.text(`INR ${totalBill.toFixed(2)}`, 185, posY, { align: "right" });
      posY += 12;

      // Stamp
      doc.setDrawColor(219, 39, 119); // pink-600
      doc.setLineWidth(0.8);
      doc.rect(75, posY, 60, 12);
      doc.setTextColor(219, 39, 119);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("PAID & DISPENSED", 105, posY + 7, { align: "center" });
      posY += 20;

      // Footer
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Generated digitally via Thangam Hospital Pharmacy Desk. Thank you!", 105, posY + 10, { align: "center" });

      // Open PDF in new tab
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      showToast("OTC Pharmacy invoice opened for printing!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to print invoice", "error");
    }
  };

  const handleOTCSubmit = async (e) => {
    e?.preventDefault();
    if (otcDispenseItems.length === 0) {
      showToast("Please add at least one medicine", "error");
      return;
    }

    setOtcIsSubmitting(true);
    try {
      const totalBill = otcDispenseItems.reduce((acc, item) => acc + item.qty * (item.price || 0), 0);
      const now = Date.now();
      const walkInId = `OTC-${now.toString().slice(-6)}`;
      const itemList = otcDispenseItems.map(i => `${i.medicine_name} (x${i.qty})`).join(", ");

      // 1. Deduct stock levels in local inventory state
      setMedicines(prev => 
        prev.map(med => {
          const itemToDeduct = otcDispenseItems.find(i => i.medicine_name === med.medicine_name);
          if (itemToDeduct) {
            return { ...med, stock: Math.max(0, med.stock - itemToDeduct.qty) };
          }
          return med;
        })
      );

      // 2. Save to dept payments log
      const storedPayments = localStorage.getItem("hospital_dept_payments");
      const deptPayments = storedPayments ? JSON.parse(storedPayments) : [];
      deptPayments.unshift({
        id: `dp-pharm-${now}`,
        walkInId: walkInId,
        patientName: otcPatientName || "Walk-in Customer",
        mobile: otcMobileNumber || "N/A",
        department: "Pharmacy",
        description: `OTC Medicines — ${itemList}`,
        amount: totalBill,
        method: otcPaymentMethod,
        date: new Date().toISOString().split("T")[0],
        status: "Paid"
      });
      localStorage.setItem("hospital_dept_payments", JSON.stringify(deptPayments));

      // 3. Also record in finance ledger
      const storedFinance = localStorage.getItem("hospital_custom_finance");
      const financeEntries = storedFinance ? JSON.parse(storedFinance) : [];
      financeEntries.unshift({
        id: `tx-pharm-${now}`,
        title: `Pharmacy OTC Sale — ${otcPatientName || "Walk-in Customer"}`,
        type: "Income",
        category: "Clinical Services",
        amount: totalBill,
        method: otcPaymentMethod,
        date: new Date().toISOString().split("T")[0],
        notes: `OTC payment received at Pharmacy desk. Items: ${itemList}. Mobile: ${otcMobileNumber}`
      });
      localStorage.setItem("hospital_custom_finance", JSON.stringify(financeEntries));

      // 4. Save to patient profile if mobile is registered
      if (otcMobileNumber && otcMobileNumber.length >= 10) {
        saveInvoiceToProfile(otcMobileNumber, {
          name: `Pharmacy OTC Sale - ${itemList}`,
          bill_amount: totalBill,
          payment_method: otcPaymentMethod,
          walkinData: {
            name: walkInId,
            patient_name: otcPatientName || "Walk-in Customer",
            mobile_number: otcMobileNumber,
            doctor: "Self (OTC)",
            docFee: 0,
            labFee: 0,
            pharmacy_bill_amount: totalBill,
            dispensed_medicines: otcDispenseItems,
            need_lab_test: 0,
            deptAlreadyPaid: 0,
            netBalance: totalBill,
            paymentMethod: otcPaymentMethod
          }
        });
      }

      // 5. Deduct stock in DB
      for (const item of otcDispenseItems) {
        try {
          await updateMedicineStock(item.medicine_name, -item.qty);
        } catch (stockErr) {
          console.error(`Failed to deduct stock for ${item.medicine_name}:`, stockErr);
        }
      }

      // 6. Print PDF Invoice
      handlePrintOTCInvoice(otcPatientName, otcMobileNumber, otcDispenseItems, totalBill, otcPaymentMethod, walkInId);

      showToast(`OTC sale completed successfully! Total: ₹${totalBill.toFixed(2)}`, "success");
      
      // Reset OTC state and close modal
      setOtcPatientName("Walk-in Customer");
      setOtcMobileNumber("");
      setOtcDispenseItems([]);
      setOtcSearchQuery("");
      setShowOTCModal(false);
      
      // Reload inventory
      await loadAllData();
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to complete OTC sale", "error");
    } finally {
      setOtcIsSubmitting(false);
    }
  };

  const handlePrintPharmacyInvoice = () => {
    if (!selectedWalkIn) return;
    if (dispenseItems.length === 0) {
      showToast("Cannot generate invoice with no medications selected", "error");
      return;
    }
    
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      let posY = 20;

      // Header
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("THANGAM HOSPITAL", 105, posY, { align: "center" });
      posY += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text("123 Health City Road, Coimbatore - 641012", 105, posY, { align: "center" });
      posY += 5;
      doc.text("Phone: +91 422 2345678 | Email: billing@thangam.org", 105, posY, { align: "center" });
      posY += 8;

      // Line separator
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(20, posY, 190, posY);
      posY += 8;

      // Invoice Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(219, 39, 119); // pink-600
      doc.text("PHARMACY DISPENSATION INVOICE", 20, posY);
      posY += 8;

      // Meta Info Table
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text("Visit/Walk-in ID:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(selectedWalkIn.name, 50, posY);

      doc.setFont("helvetica", "bold");
      doc.text("Patient Name:", 115, posY);
      doc.setFont("helvetica", "normal");
      doc.text(selectedWalkIn.patient_name || "", 145, posY);
      posY += 6;

      doc.setFont("helvetica", "bold");
      doc.text("Date & Time:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(new Date().toLocaleString(), 50, posY);

      doc.setFont("helvetica", "bold");
      doc.text("Mobile Number:", 115, posY);
      doc.setFont("helvetica", "normal");
      doc.text(selectedWalkIn.mobile_number || "", 145, posY);
      posY += 8;

      // Line separator
      doc.line(20, posY, 190, posY);
      posY += 8;

      // Doctor & Prescription Note
      doc.setFont("helvetica", "bold");
      doc.text("Prescribing Doctor:", 20, posY);
      doc.setFont("helvetica", "normal");
      doc.text(selectedWalkIn.doctor || "General OPD", 55, posY);
      posY += 6;

      if (editPrescription) {
        doc.setFont("helvetica", "bold");
        doc.text("Prescription:", 20, posY);
        doc.setFont("helvetica", "normal");
        const prescriptionLines = doc.splitTextToSize(editPrescription, 130);
        doc.text(prescriptionLines, 55, posY);
        posY += (prescriptionLines.length * 4) + 2;
      } else {
        posY += 2;
      }

      // Line separator
      doc.line(20, posY, 190, posY);
      posY += 8;

      // Table Headers
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(20, posY - 4, 170, 7, "F");
      doc.text("Description (Medicine Name)", 22, posY);
      doc.text("Qty", 120, posY, { align: "center" });
      doc.text("Unit Price", 145, posY, { align: "right" });
      doc.text("Amount", 185, posY, { align: "right" });
      posY += 8;

      // Add row for each medicine
      let totalBill = 0;
      dispenseItems.forEach(item => {
        const itemTotal = item.qty * (item.price || 0);
        totalBill += itemTotal;
        doc.setFont("helvetica", "normal");
        doc.text(item.medicine_name, 22, posY);
        doc.text(String(item.qty), 120, posY, { align: "center" });
        doc.text(`INR ${(item.price || 0).toFixed(2)}`, 145, posY, { align: "right" });
        doc.text(`INR ${itemTotal.toFixed(2)}`, 185, posY, { align: "right" });
        posY += 7;
      });

      // Totals Area
      posY += 3;
      doc.line(20, posY, 190, posY);
      posY += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("GRAND TOTAL (PHARMACY):", 115, posY);
      doc.text(`INR ${totalBill.toFixed(2)}`, 185, posY, { align: "right" });
      posY += 12;

      // Stamp
      doc.setDrawColor(219, 39, 119); // pink-600
      doc.setLineWidth(0.8);
      doc.rect(75, posY, 60, 12);
      doc.setTextColor(219, 39, 119);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("PHARMACY INVOICED", 105, posY + 7, { align: "center" });
      posY += 20;

      // Footer
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("Generated digitally via Thangam Hospital Pharmacy Desk. No signature required.", 105, posY + 10, { align: "center" });

      // Open PDF in new tab for viewing and printing
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.focus();
          printWindow.print();
        };
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);

      showToast("Pharmacy invoice opened for printing!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to print invoice", "error");
    }
  };

  const handleMarkPharmacyPayment = () => {
    if (!selectedWalkIn) return;
    if (dispenseItems.length === 0) {
      showToast("No medicines selected — cannot record payment", "error");
      return;
    }
    const totalBill = dispenseItems.reduce((acc, item) => acc + item.qty * (item.price || 0), 0);
    const now = Date.now();
    const itemList = dispenseItems.map(i => `${i.medicine_name} (x${i.qty})`).join(", ");

    // Save to dept payments log
    const storedPayments = localStorage.getItem("hospital_dept_payments");
    const deptPayments = storedPayments ? JSON.parse(storedPayments) : [];
    deptPayments.unshift({
      id: `dp-pharm-${now}`,
      walkInId: selectedWalkIn.name,
      patientName: selectedWalkIn.patient_name,
      mobile: selectedWalkIn.mobile_number,
      department: "Pharmacy",
      description: `Medicines — ${itemList}`,
      amount: totalBill,
      method: "UPI",
      date: new Date().toISOString().split("T")[0],
      status: "Paid"
    });
    localStorage.setItem("hospital_dept_payments", JSON.stringify(deptPayments));

    // Also record in finance ledger
    const storedFinance = localStorage.getItem("hospital_custom_finance");
    const financeEntries = storedFinance ? JSON.parse(storedFinance) : [];
    financeEntries.unshift({
      id: `tx-pharm-${now}`,
      title: `Pharmacy Dispensation — ${selectedWalkIn.patient_name}`,
      type: "Income",
      category: "Clinical Services",
      amount: totalBill,
      method: "UPI",
      date: new Date().toISOString().split("T")[0],
      notes: `Payment received at Pharmacy desk. Items: ${itemList}. Walk-in: ${selectedWalkIn.name}`
    });
    localStorage.setItem("hospital_custom_finance", JSON.stringify(financeEntries));

    // Save pharmacy invoice to profile
    saveInvoiceToProfile(selectedWalkIn.mobile_number, {
      name: `Pharmacy Dispensation - ${itemList}`,
      bill_amount: totalBill,
      payment_method: "UPI",
      walkinData: {
        name: selectedWalkIn.name,
        patient_name: selectedWalkIn.patient_name,
        mobile_number: selectedWalkIn.mobile_number,
        doctor: selectedWalkIn.doctor,
        docFee: 0,
        labFee: 0,
        pharmacy_bill_amount: totalBill,
        dispensed_medicines: dispenseItems,
        need_lab_test: 0,
        deptAlreadyPaid: 0,
        netBalance: totalBill,
        paymentMethod: "UPI"
      }
    });

    showToast(`Payment of ₹${totalBill.toFixed(2)} received & recorded!`, "success");
  };

  // Add and Edit modal triggers
  const handleOpenAddModal = () => {
    setEditingMedicine(null);
    setNewMedData({
      medicine_name: "", generic_name: "", batch_number: "", mfg_date: "", exp_date: "",
      shelf_life: "", manufacturer: "", supplier: "", category: "Tablet", strength: "",
      pack_size: "", purchase_price: "", mrp: "", price: "", opening_stock: "",
      stock: "", reorder_level: "", rack_location: "", storage: "Room Temperature", barcode: "", is_recalled: false
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (med) => {
    setEditingMedicine(med);
    setNewMedData({
      medicine_name: med.medicine_name,
      generic_name: med.generic_name || "",
      batch_number: med.batch_number || "",
      mfg_date: med.mfg_date || "",
      exp_date: med.exp_date || "",
      shelf_life: med.shelf_life || "",
      manufacturer: med.manufacturer || "",
      supplier: med.supplier || "",
      category: med.category || "Tablet",
      strength: med.strength || "",
      pack_size: med.pack_size || "",
      purchase_price: med.purchase_price || "",
      mrp: med.mrp || "",
      price: med.price || "",
      opening_stock: med.opening_stock || "",
      stock: med.stock || "",
      reorder_level: med.reorder_level || "",
      rack_location: med.rack_location || "",
      storage: med.storage || "Room Temperature",
      barcode: med.barcode || "",
      is_recalled: med.is_recalled == 1 || med.is_recalled === true
    });
    setIsAddModalOpen(true);
  };

  // Add new medicine or save changes to existing medicine
  const handleSaveMedicine = async (e) => {
    e.preventDefault();
    if (!newMedData.medicine_name.trim() || !newMedData.stock || !newMedData.price) {
      showToast("Medicine Name, Stock, and Selling Price are required", "error");
      return;
    }

    const savedMed = {
      ...newMedData,
      name: newMedData.medicine_name.trim(),
      medicine_name: newMedData.medicine_name.trim(),
      stock: parseInt(newMedData.stock) || 0,
      opening_stock: parseInt(newMedData.opening_stock) || parseInt(newMedData.stock) || 0,
      reorder_level: parseInt(newMedData.reorder_level) || 0,
      purchase_price: parseFloat(newMedData.purchase_price) || 0,
      mrp: parseFloat(newMedData.mrp) || 0,
      price: parseFloat(newMedData.price) || 0,
      is_recalled: newMedData.is_recalled ? 1 : 0
    };

    const isEdit = !!editingMedicine;
    const originalMeds = [...medicines];

    if (isEdit) {
      // Optimistically update details
      setMedicines(prev => 
        prev.map(m => m.medicine_name === editingMedicine.medicine_name ? savedMed : m)
      );
      showToast(`Saving changes for ${savedMed.medicine_name}...`, "info");
    } else {
      // Optimistically add new item
      setMedicines(prev => [...prev, savedMed]);
      showToast(`Adding ${savedMed.medicine_name} to catalog...`, "info");
    }

    setNewMedData({
      medicine_name: "", generic_name: "", batch_number: "", mfg_date: "", exp_date: "",
      shelf_life: "", manufacturer: "", supplier: "", category: "Tablet", strength: "",
      pack_size: "", purchase_price: "", mrp: "", price: "", opening_stock: "",
      stock: "", reorder_level: "", rack_location: "", storage: "Room Temperature", barcode: "", is_recalled: false
    });
    setIsAddModalOpen(false);

    setIsSubmittingMed(true);
    try {
      if (isEdit) {
        await updateMedicine(editingMedicine.medicine_name, savedMed);
        showToast(`${savedMed.medicine_name} updated successfully!`, "success");
      } else {
        await createMedicine(savedMed);
        showToast(`${savedMed.medicine_name} added to pharmacy inventory!`, "success");
      }
      await loadAllData();
    } catch (err) {
      // Rollback
      setMedicines(originalMeds);
      showToast(err.message || "Failed to save medicine", "error");
    } finally {
      setIsSubmittingMed(false);
    }
  };

  // Restock an existing medicine quickly with Optimistic UI updates
  const handleQuickRestock = async (medicineName) => {
    const originalMeds = [...medicines];

    // Optimistically update stock value instantly
    setMedicines(prev => 
      prev.map(med => 
        med.medicine_name === medicineName ? { ...med, stock: med.stock + 50 } : med
      )
    );
    showToast(`Restocking ${medicineName}...`, "info");

    try {
      await updateMedicineStock(medicineName, 50); // Add 50 qty
      showToast(`Restocked 50 units of ${medicineName}!`, "success");
      await loadAllData();
    } catch (err) {
      // Rollback
      setMedicines(originalMeds);
      showToast(err.message || "Failed to restock", "error");
    }
  };

  // Restock an existing medicine with a custom quantity
  const handleCustomRestock = async (medicineName, qty) => {
    if (qty <= 0 || isNaN(qty)) {
      showToast("Please enter a positive quantity", "error");
      return;
    }
    const originalMeds = [...medicines];

    // Optimistically update stock value instantly
    setMedicines(prev => 
      prev.map(med => 
        med.medicine_name === medicineName ? { ...med, stock: med.stock + qty } : med
      )
    );
    showToast(`Adding ${qty} units of ${medicineName}...`, "info");

    try {
      await updateMedicineStock(medicineName, qty);
      showToast(`Successfully added ${qty} units of ${medicineName}!`, "success");
      await loadAllData();
    } catch (err) {
      // Rollback
      setMedicines(originalMeds);
      showToast(err.message || "Failed to update stock", "error");
    }
  };

  const pendingPharmacy = queue
    .filter((q) => q.appointment_status === "Pharmacy")
    .sort((a, b) => new Date(a.creation || 0) - new Date(b.creation || 0));

  const filteredMedicines = medicines.filter(med => 
    med.medicine_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (med.generic_name && med.generic_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (med.batch_number && med.batch_number.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addMedFiltered = medicines.filter(med => 
    med.medicine_name.toLowerCase().includes(medSearchText.toLowerCase())
  );

  const handleAutofill = (med) => {
    setNewMedData({
      medicine_name: med.medicine_name,
      generic_name: med.generic_name || "",
      batch_number: med.batch_number || "",
      mfg_date: med.mfg_date || "",
      exp_date: med.exp_date || "",
      shelf_life: med.shelf_life || "",
      manufacturer: med.manufacturer || "",
      supplier: med.supplier || "",
      category: med.category || "Tablet",
      strength: med.strength || "",
      pack_size: med.pack_size || "",
      purchase_price: med.purchase_price || "",
      mrp: med.mrp || "",
      price: med.price || "",
      opening_stock: med.opening_stock || "",
      stock: med.stock || "",
      reorder_level: med.reorder_level || "",
      rack_location: med.rack_location || "",
      storage: med.storage || "Room Temperature",
      barcode: med.barcode || "",
      is_recalled: med.is_recalled == 1 || med.is_recalled === true
    });
    setShowAutocomplete(false);
  };

  const autocompleteMatches = newMedData.medicine_name.trim() !== ""
    ? medicines.filter(med => 
        med.medicine_name.toLowerCase().includes(newMedData.medicine_name.toLowerCase())
      )
    : [];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Toast notifications container */}
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

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 font-serif">Pharmacy Portal</h2>
          <p className="text-muted-foreground mt-1">Dispense medication and track stock levels</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setOtcPatientName("Walk-in Customer");
              setOtcMobileNumber("");
              setOtcDispenseItems([]);
              setOtcSearchQuery("");
              setShowOTCModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-sm text-xs h-9 font-semibold"
          >
            <Plus className="w-4 h-4" />
            Sell OTC Medicines
          </Button>

          {/* Tab Buttons */}
          <div className="flex items-center bg-slate-100 p-1.5 rounded-lg border border-slate-200 text-sm font-medium">
            <button
              onClick={() => setActiveTab("queue")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === "queue" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Prescriptions ({pendingPharmacy.length})
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeTab === "inventory" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Inventory Management
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-6 w-full animate-pulse mt-6">
          <div className="flex gap-4 w-full">
            <div className="h-24 flex-1 bg-slate-200/80 rounded-xl" />
            <div className="h-24 flex-1 bg-slate-200/80 rounded-xl" />
            <div className="h-24 flex-1 bg-slate-200/80 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            <div className="h-96 lg:col-span-1 bg-slate-200/60 rounded-xl" />
            <div className="h-96 lg:col-span-2 bg-slate-200/60 rounded-xl" />
          </div>
        </div>
      ) : activeTab === "queue" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="flex flex-col h-[500px]">
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Prescriptions to Dispense</span>
                  <span className="bg-pink-100 text-pink-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {pendingPharmacy.length} Pending
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto flex-1">
                <div className="divide-y">
                  {pendingPharmacy.map((item, index) => {
                    const isActive = selectedWalkIn && selectedWalkIn.name === item.name;
                    return (
                      <div
                        key={`${item.name}-${index}`}
                        onClick={() => handleSelectWalkIn(item)}
                        className={`p-4 border-b hover:bg-slate-50 cursor-pointer transition-colors border-l-4 flex items-center gap-3
                          ${isActive ? "border-l-pink-600 bg-pink-50/30" : "border-l-transparent bg-white"}`}
                      >
                        <div className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${isActive ? "bg-pink-600 text-white shadow-sm" : "bg-pink-100 text-pink-700"}`}>
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-slate-950 text-sm truncate">{item.patient_name}</h4>
                            <span className="text-[10px] font-bold text-pink-600 bg-pink-50 px-1.5 py-0.5 rounded border border-pink-100">Token #{index + 1}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {item.mobile_number} | Doctor: {item.doctor}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {pendingPharmacy.length === 0 && (
                    <div className="text-center text-muted-foreground py-20 text-sm">
                      No pending prescriptions.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Prescription review and dispensation panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="bg-slate-50 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Pill className="w-5 h-5 text-pink-500" />
                  Medication Dispensation Form
                </CardTitle>
                <CardDescription>Review doctor prescriptions and check off packaged medications.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {selectedWalkIn ? (
                  <div className="space-y-4">
                    {/* Selected Patient Banner */}
                    <div className="bg-slate-100 p-3 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">Patient: </span>
                        {selectedWalkIn.patient_name} ({selectedWalkIn.mobile_number})
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900">ID: </span>
                        {selectedWalkIn.name}
                      </div>
                    </div>

                    {/* Diagnosis */}
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                      <Label className="text-xs font-semibold text-slate-500">Doctor Diagnosis Notes</Label>
                      <p className="text-sm font-medium text-slate-800">{selectedWalkIn.diagnosis || "General Consultation Checkup"}</p>
                    </div>

                    {/* Prescription */}
                    <div className="space-y-2">
                      <Label htmlFor="edit-prescription" className="font-semibold text-pink-700">Prescription Details (Editable)</Label>
                      <textarea
                        id="edit-prescription"
                        className="flex min-h-[90px] w-full rounded-md border border-pink-200 bg-white px-3 py-2 text-xs shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500 font-mono"
                        value={editPrescription}
                        onChange={(e) => setEditPrescription(e.target.value)}
                      />
                    </div>

                    {/* Interactive Dispense List */}
                    <div className="space-y-3 bg-slate-50 p-4 border border-slate-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                          Deduct Stock Quantities
                        </span>
                        
                        {/* Searchable Medicine Dropdown */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="🔍 Search & add medicine..."
                            value={medSearchText}
                            onChange={(e) => {
                              setMedSearchText(e.target.value);
                              setIsMedDropdownOpen(true);
                            }}
                            onFocus={() => setIsMedDropdownOpen(true)}
                            className="h-7 w-48 text-[11px] bg-white border border-slate-200 rounded-md px-2.5 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-pink-500 shadow-sm"
                          />
                          
                          {isMedDropdownOpen && (
                            <>
                              {/* Backdrop to close dropdown on click outside */}
                              <div 
                                className="fixed inset-0 z-40 cursor-default" 
                                onClick={() => setIsMedDropdownOpen(false)} 
                              />
                              <div className="absolute right-0 mt-1 w-64 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-lg z-50 divide-y divide-slate-100">
                                {addMedFiltered.length > 0 ? (
                                  addMedFiltered.map((med, index) => {
                                    const isAdded = dispenseItems.some(i => i.medicine_name === med.medicine_name);
                                    return (
                                      <button
                                        key={`${med.medicine_name}-${index}`}
                                        type="button"
                                        onClick={() => {
                                          if (!isAdded) {
                                            setDispenseItems(prev => [...prev, { 
                                              medicine_name: med.medicine_name, 
                                              qty: 10, 
                                              stock: med.stock, 
                                              price: med.price || 0 
                                            }]);
                                          }
                                          setMedSearchText("");
                                          setIsMedDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center transition-colors ${
                                          isAdded ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'hover:bg-indigo-50 text-slate-700'
                                        }`}
                                        disabled={isAdded}
                                      >
                                        <span className="font-semibold truncate mr-2 text-left">{med.medicine_name}</span>
                                        <span className="text-[10px] text-slate-400 shrink-0">({med.stock} left)</span>
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className="px-3 py-2 text-xs text-slate-400 italic text-center">No medicine found</div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {dispenseItems.length > 0 ? (
                        <div className="space-y-2">
                          {dispenseItems.map((item, idx) => (
                            <div key={`${item.medicine_name}-${idx}`} className="flex items-center justify-between bg-white p-2 border border-slate-200 rounded shadow-sm text-xs">
                              <div>
                                <span className="font-semibold text-slate-800">{item.medicine_name}</span>
                                <div className="text-[10px] text-slate-400 mt-0.5">Current Stock: {item.stock} units</div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] text-slate-500 font-medium">Rate: ₹{item.price}</span>
                                <span className="text-xs font-bold text-slate-700">₹{(item.qty * (item.price || 0)).toFixed(2)}</span>
                              </div>
                              
                              <div className="flex items-center gap-3">
                                {/* Qty Adjust Buttons */}
                                <div className="flex items-center border border-slate-200 rounded overflow-hidden select-none">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemQty(idx, -1)}
                                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 font-bold border-r border-slate-200 h-6 flex items-center justify-center text-slate-600"
                                  >
                                    -
                                  </button>
                                  <span className="px-2.5 font-semibold text-slate-800 text-xs">{item.qty}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateItemQty(idx, 1)}
                                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 font-bold border-l border-slate-200 h-6 flex items-center justify-center text-slate-600"
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveDispenseItem(idx)}
                                  className="text-rose-500 hover:text-rose-700 font-bold text-lg h-6 flex items-center justify-center w-4"
                                  title="Remove item"
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">No matching pharmacy inventory items found. Use the search to add items.</p>
                      )}
                      {dispenseItems.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center px-1">
                          <span className="text-sm font-semibold text-slate-600">Total Medicines Bill:</span>
                          <span className="text-base font-bold text-emerald-600">
                            ₹{dispenseItems.reduce((acc, item) => acc + (item.qty * (item.price || 0)), 0).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                      <Button
                        type="button"
                        onClick={handlePrintPharmacyInvoice}
                        variant="outline"
                        className="border-pink-600 text-pink-600 hover:bg-pink-50 gap-1.5 h-9 text-sm"
                      >
                        <Printer className="w-4 h-4" />
                        Print Invoice
                      </Button>
                      <Button
                        type="button"
                        onClick={handleMarkPharmacyPayment}
                        variant="outline"
                        className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 gap-1.5 h-9 text-sm"
                      >
                        <BadgeCheck className="w-4 h-4" />
                        Payment Received
                      </Button>
                      <Button
                        onClick={() => setShowOutsideConfirm(true)}
                        variant="outline"
                        className="text-slate-700 h-9 text-sm"
                      >
                        Outside Purchase (Bill ₹0)
                      </Button>
                      <Button
                        onClick={() => handleDispense(false)}
                        className="bg-pink-600 hover:bg-pink-700 text-white gap-1.5 h-9 text-sm"
                        disabled={dispenseItems.length === 0}
                      >
                        <PackageCheck className="w-4 h-4" />
                        Dispense & Send to Checkout
                      </Button>
                    </div>

                    {/* Outside Purchase Confirmation Dialog */}
                    <Dialog open={showOutsideConfirm} onOpenChange={setShowOutsideConfirm}>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-slate-900 font-serif">Confirm Outside Purchase</DialogTitle>
                          <DialogDescription className="text-slate-500 text-sm mt-2">
                            Are you sure you want to mark this visit as an **Outside Purchase**? 
                            The patient will be routed to the checkout desk (Billing) with **₹0.00** pharmacy charges, and no inventory stock will be deducted.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setShowOutsideConfirm(false)}
                            className="border-slate-200 text-slate-700 hover:bg-slate-50"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              setShowOutsideConfirm(false);
                              handleDispense(true);
                            }}
                            className="bg-pink-600 hover:bg-pink-700 text-white font-semibold"
                          >
                            Confirm
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-20">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-pink-300 animate-pulse" />
                    Please select a pending prescription from the queue to dispense.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* Inventory Table (Full Width) */}
          <div className="space-y-6">
            <Card className="flex flex-col h-[700px]">
              <CardHeader className="bg-slate-50 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-500" />
                    Pharmacy Stock Status
                  </CardTitle>
                  <CardDescription>Real-time listing of active drug levels in the dispensary database.</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Input 
                    placeholder="Search medicine, generic or batch..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-[300px] h-9 text-sm"
                  />
                  <Dialog open={isAddModalOpen} onOpenChange={(open) => {
                    setIsAddModalOpen(open);
                    if (!open) {
                      setEditingMedicine(null);
                    }
                  }}>
                    <Button 
                      onClick={handleOpenAddModal}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5 h-9 text-sm"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add New Medicine
                    </Button>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                      <DialogHeader>
                        <DialogTitle>{editingMedicine ? "Edit Medicine Details" : "Add New Medicine"}</DialogTitle>
                        <DialogDescription>
                          {editingMedicine 
                            ? `Update specifications, batches, and pricing for ${editingMedicine.medicine_name}.` 
                            : "Enter new pharmaceutical items into the active inventory."}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="overflow-y-auto flex-1 pr-2 py-4">
                        <form id="add-medicine-form" onSubmit={handleSaveMedicine} className="space-y-6">
                          {/* General Information */}
                          <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 border-b pb-1">General Information</h3>
                            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                              <div className="space-y-1">
                                <Label htmlFor="medicine_name" className="text-xs font-semibold block mb-1.5">Medicine Name *</Label>
                                <Input 
                                  id="medicine_name" 
                                  placeholder="e.g. Paracetamol 650mg" 
                                  value={newMedData.medicine_name} 
                                  onChange={(e) => handleMedChange("medicine_name", e.target.value)} 
                                  required 
                                  disabled={!!editingMedicine}
                                  autoComplete="off"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="generic_name" className="text-xs font-semibold block mb-1.5">Generic Name</Label>
                                <Input id="generic_name" placeholder="e.g. Paracetamol" value={newMedData.generic_name} onChange={(e) => handleMedChange("generic_name", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="manufacturer" className="text-xs font-semibold block mb-1.5">Manufacturer</Label>
                                <Input id="manufacturer" placeholder="e.g. Micro Labs" value={newMedData.manufacturer} onChange={(e) => handleMedChange("manufacturer", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="supplier" className="text-xs font-semibold block mb-1.5">Supplier</Label>
                                <Input id="supplier" placeholder="e.g. ABC Pharma Distributors" value={newMedData.supplier} onChange={(e) => handleMedChange("supplier", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="category" className="text-xs font-semibold block mb-1.5">Category</Label>
                                <select id="category" value={newMedData.category} onChange={(e) => handleMedChange("category", e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                                  <option>Tablet</option>
                                  <option>Capsule</option>
                                  <option>Syrup</option>
                                  <option>Injection</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="strength" className="text-xs font-semibold block mb-1.5">Strength</Label>
                                <Input id="strength" placeholder="e.g. 650 mg" value={newMedData.strength} onChange={(e) => handleMedChange("strength", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="pack_size" className="text-xs font-semibold block mb-1.5">Pack Size</Label>
                                <Input id="pack_size" placeholder="e.g. 15 Tablets" value={newMedData.pack_size} onChange={(e) => handleMedChange("pack_size", e.target.value)} />
                              </div>
                              <div className="space-y-1 flex items-center space-x-2 pt-6">
                                <input type="checkbox" id="is_recalled" checked={newMedData.is_recalled} onChange={(e) => handleMedChange("is_recalled", e.target.checked)} className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                <Label htmlFor="is_recalled" className="text-xs font-semibold text-rose-600 block mb-1.5">Batch Recalled</Label>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 border-b pb-1">Inventory & Batch Details</h3>
                            <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                              <div className="space-y-1">
                                <Label htmlFor="batch_number" className="text-xs font-semibold block mb-1.5">Batch Number</Label>
                                <Input id="batch_number" placeholder="e.g. DL65024001" value={newMedData.batch_number} onChange={(e) => handleMedChange("batch_number", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="mfg_date" className="text-xs font-semibold block mb-1.5">MFG Date</Label>
                                <Input id="mfg_date" type="date" value={newMedData.mfg_date} onChange={(e) => handleMedChange("mfg_date", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="exp_date" className="text-xs font-semibold block mb-1.5">EXP Date</Label>
                                <Input id="exp_date" type="date" value={newMedData.exp_date} onChange={(e) => handleMedChange("exp_date", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="shelf_life" className="text-xs font-semibold block mb-1.5">Shelf Life</Label>
                                <Input id="shelf_life" placeholder="e.g. 36 Months" value={newMedData.shelf_life} onChange={(e) => handleMedChange("shelf_life", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="opening_stock" className="text-xs font-semibold block mb-1.5">Opening Stock</Label>
                                <Input id="opening_stock" type="number" placeholder="e.g. 500" value={newMedData.opening_stock} onChange={(e) => handleMedChange("opening_stock", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="stock" className="text-xs font-semibold block mb-1.5">Current Stock *</Label>
                                <Input id="stock" type="number" placeholder="e.g. 320" value={newMedData.stock} onChange={(e) => handleMedChange("stock", e.target.value)} required />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="reorder_level" className="text-xs font-semibold block mb-1.5">Reorder Level</Label>
                                <Input id="reorder_level" type="number" placeholder="e.g. 100" value={newMedData.reorder_level} onChange={(e) => handleMedChange("reorder_level", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="rack_location" className="text-xs font-semibold block mb-1.5">Rack Location</Label>
                                <Input id="rack_location" placeholder="e.g. Rack A-02" value={newMedData.rack_location} onChange={(e) => handleMedChange("rack_location", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="storage" className="text-xs font-semibold block mb-1.5">Storage</Label>
                                <Input id="storage" placeholder="e.g. Room Temperature" value={newMedData.storage} onChange={(e) => handleMedChange("storage", e.target.value)} />
                              </div>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 border-b pb-1">Pricing Information</h3>
                            <div className="grid grid-cols-3 gap-x-6 gap-y-5">
                              <div className="space-y-1">
                                <Label htmlFor="purchase_price" className="text-xs font-semibold block mb-1.5">Purchase Price (₹)</Label>
                                <Input id="purchase_price" type="number" step="0.01" placeholder="e.g. 18" value={newMedData.purchase_price} onChange={(e) => handleMedChange("purchase_price", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="mrp" className="text-xs font-semibold block mb-1.5">MRP (₹)</Label>
                                <Input id="mrp" type="number" step="0.01" placeholder="e.g. 35" value={newMedData.mrp} onChange={(e) => handleMedChange("mrp", e.target.value)} />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="price" className="text-xs font-semibold block mb-1.5">Selling Price (₹) *</Label>
                                <Input id="price" type="number" step="0.01" placeholder="e.g. 32" value={newMedData.price} onChange={(e) => handleMedChange("price", e.target.value)} required />
                              </div>
                            </div>
                          </div>
                        </form>
                      </div>
                      <div className="flex justify-end gap-3 pt-4 border-t mt-auto">
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                        <Button type="submit" form="add-medicine-form" disabled={isSubmittingMed} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                          {isSubmittingMed ? "Saving..." : (editingMedicine ? "Save Changes" : "Save Medicine")}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* OTC Walk-in Customer Dialog */}
                  <Dialog open={showOTCModal} onOpenChange={setShowOTCModal}>
                    <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                      <DialogHeader className="bg-slate-900 text-white p-6 shrink-0">
                        <DialogTitle className="text-xl font-bold font-serif">Sell OTC Medicines (Walk-in Customer)</DialogTitle>
                        <DialogDescription className="text-slate-300 text-xs mt-1">
                          Record drug sales and generate invoices for non-registered walk-in customers.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <form id="otc-medicine-form" onSubmit={handleOTCSubmit} className="space-y-6">
                          {/* Customer Details */}
                          <div>
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 border-b pb-1">Customer Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <Label htmlFor="otc-name" className="text-xs font-semibold">Customer / Patient Name</Label>
                                <Input
                                  id="otc-name"
                                  value={otcPatientName}
                                  onChange={(e) => setOtcPatientName(e.target.value)}
                                  className="h-9 text-xs"
                                  placeholder="e.g. Walk-in Customer"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label htmlFor="otc-mobile" className="text-xs font-semibold">Mobile Number (Optional)</Label>
                                <Input
                                  id="otc-mobile"
                                  value={otcMobileNumber}
                                  onChange={(e) => setOtcMobileNumber(e.target.value)}
                                  className="h-9 text-xs"
                                  placeholder="e.g. 9876543210"
                                />
                                <p className="text-[9px] text-muted-foreground mt-0.5">If entered, invoice is automatically saved to their profile docs.</p>
                              </div>
                            </div>
                          </div>

                          {/* Medicine Search & Addition */}
                          <div>
                            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 border-b pb-1">Select Medicines</h3>
                            <div className="relative">
                              <Label className="text-xs font-semibold block mb-1">Search & Add Medicine</Label>
                              <Input
                                placeholder="Type medicine name to search..."
                                value={otcSearchQuery}
                                onChange={(e) => {
                                  setOtcSearchQuery(e.target.value);
                                  setIsOtcDropdownOpen(true);
                                }}
                                onFocus={() => setIsOtcDropdownOpen(true)}
                                className="h-9 text-xs"
                              />

                              {isOtcDropdownOpen && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setIsOtcDropdownOpen(false)} />
                                  <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-lg z-50 divide-y divide-slate-100">
                                    {medicines.filter(med => med.medicine_name.toLowerCase().includes(otcSearchQuery.toLowerCase())).length > 0 ? (
                                      medicines
                                        .filter(med => med.medicine_name.toLowerCase().includes(otcSearchQuery.toLowerCase()))
                                        .map((med) => {
                                          const isAdded = otcDispenseItems.some(i => i.medicine_name === med.medicine_name);
                                          return (
                                            <button
                                              key={med.medicine_name}
                                              type="button"
                                              onClick={() => {
                                                if (!isAdded) {
                                                  setOtcDispenseItems(prev => [...prev, {
                                                    medicine_name: med.medicine_name,
                                                    qty: 1,
                                                    stock: med.stock,
                                                    price: med.price || 0
                                                  }]);
                                                }
                                                setOtcSearchQuery("");
                                                setIsOtcDropdownOpen(false);
                                              }}
                                              className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center transition-colors ${
                                                isAdded ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'hover:bg-indigo-50 text-slate-700'
                                              }`}
                                              disabled={isAdded}
                                            >
                                              <span className="font-semibold">{med.medicine_name}</span>
                                              <span className="text-[10px] text-slate-400">({med.stock} left)</span>
                                            </button>
                                          );
                                        })
                                    ) : (
                                      <div className="px-3 py-2 text-xs text-slate-400 italic text-center">No medicine found</div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Selected Medicines List */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="text-xs font-semibold text-slate-700">Added Medicines</h4>
                            </div>

                            {otcDispenseItems.length > 0 ? (
                              <div className="border rounded-lg divide-y divide-slate-100 bg-slate-50/50 max-h-48 overflow-y-auto">
                                {otcDispenseItems.map((item, index) => (
                                  <div key={item.medicine_name} className="p-3 flex items-center justify-between text-xs">
                                    <div className="flex-1 min-w-0 pr-3">
                                      <p className="font-semibold text-slate-800 truncate">{item.medicine_name}</p>
                                      <p className="text-[10px] text-slate-400">MRP: ₹{(item.price || 0).toFixed(2)} | Stock: {item.stock}</p>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                      <div className="flex items-center gap-1.5">
                                        <Label className="text-[10px] text-slate-500 font-medium">Qty:</Label>
                                        <Input
                                          type="number"
                                          min="1"
                                          max={item.stock}
                                          value={item.qty}
                                          onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            setOtcDispenseItems(prev => prev.map((it, idx) => idx === index ? { ...it, qty: Math.min(it.stock, val) } : it));
                                          }}
                                          className="w-16 h-7 text-xs px-1.5"
                                        />
                                      </div>
                                      <div className="text-right w-16">
                                        <p className="font-bold text-slate-800">₹{(item.qty * (item.price || 0)).toFixed(2)}</p>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setOtcDispenseItems(prev => prev.filter((_, idx) => idx !== index))}
                                        className="text-rose-600 hover:text-rose-700 p-1 h-7 text-xs font-semibold hover:bg-rose-50"
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="border border-dashed rounded-lg p-6 bg-slate-50 text-center text-xs text-slate-400 italic">
                                No medicines added. Use the search bar above to add items.
                              </div>
                            )}
                          </div>

                          {/* Payment & Summary */}
                          {otcDispenseItems.length > 0 && (
                            <div className="p-4 bg-pink-50/30 border border-pink-100 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs font-semibold text-slate-700">Payment Mode:</Label>
                                <select
                                  value={otcPaymentMethod}
                                  onChange={(e) => setOtcPaymentMethod(e.target.value)}
                                  className="h-8 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-pink-500"
                                >
                                  <option value="Cash">Cash</option>
                                  <option value="UPI">UPI / GPay</option>
                                  <option value="Card">Card</option>
                                </select>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-pink-600 font-bold uppercase tracking-wider block">Grand Total</span>
                                <span className="text-xl font-bold text-pink-700">
                                  ₹{otcDispenseItems.reduce((acc, item) => acc + (item.qty * (item.price || 0)), 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}
                        </form>
                      </div>

                      <div className="flex justify-end gap-3 p-6 border-t bg-slate-50 shrink-0">
                        <Button variant="outline" onClick={() => setShowOTCModal(false)}>Cancel</Button>
                        <Button
                          type="submit"
                          form="otc-medicine-form"
                          disabled={otcIsSubmitting || otcDispenseItems.length === 0}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5 animate-in fade-in"
                        >
                          {otcIsSubmitting ? "Processing..." : "Complete Sale & Print"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button variant="outline" size="sm" onClick={loadAllData} className="gap-1 text-xs h-9">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Sync
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-y-auto flex-1">
                <div className="min-w-full divide-y divide-slate-200">
                  <div className="bg-slate-50 grid grid-cols-12 px-6 py-2.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <div className="col-span-3">Medicine</div>
                    <div className="col-span-2">Batch & EXP</div>
                    <div className="col-span-2 text-center">Stock & Alerts</div>
                    <div className="col-span-2 text-center">Price</div>
                    <div className="col-span-3 text-right">Actions</div>
                  </div>
                  <div className="divide-y divide-slate-200 bg-white">
                    {filteredMedicines.map((med, index) => {
                      const today = new Date();
                      const expDate = med.exp_date ? new Date(med.exp_date) : null;
                      const daysToExpire = expDate ? Math.ceil((expDate - today) / (1000 * 60 * 60 * 24)) : null;

                      let expiryAlert = null;
                      if (expDate && daysToExpire < 0) {
                        expiryAlert = <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-rose-200 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Expired</span>;
                      } else if (expDate && daysToExpire <= 30) {
                        expiryAlert = <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-orange-200 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Exp &lt;30d</span>;
                      } else if (expDate && daysToExpire <= 90) {
                        expiryAlert = <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-200 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Exp &lt;90d</span>;
                      }

                      const stock = med.stock || 0;
                      const reorder = med.reorder_level || 50;
                      let stockAlert = null;
                      if (stock === 0) {
                        stockAlert = <span className="bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-rose-200">Out of Stock</span>;
                      } else if (stock <= reorder / 2) {
                        stockAlert = <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-orange-200">Low Stock</span>;
                      } else if (stock <= reorder) {
                        stockAlert = <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-blue-200">Near Reorder</span>;
                      } else {
                        stockAlert = <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-200">In Stock</span>;
                      }

                      const isRecalled = med.is_recalled == 1 || med.is_recalled === true;

                      return (
                        <div key={`${med.medicine_name}-${med.batch_number || index}`} className={`grid grid-cols-12 px-6 py-3 items-center text-sm ${isRecalled ? 'bg-red-50/50' : ''}`}>
                          <div className="col-span-3">
                            <div className="font-semibold text-slate-900 flex items-center gap-1">
                              {med.medicine_name}
                              {isRecalled && <AlertCircle className="w-3.5 h-3.5 text-rose-600" title="Batch Recalled" />}
                            </div>
                            <div className="text-[10px] text-slate-500">{med.rack_location || 'No Rack'}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-xs font-mono text-slate-700">{med.batch_number || 'N/A'}</div>
                            <div className="text-[10px] text-slate-500">{med.exp_date ? new Date(med.exp_date).toLocaleDateString() : 'N/A'}</div>
                          </div>
                          <div className="col-span-2 text-center flex flex-col items-center gap-1">
                            <div className="flex gap-1 flex-wrap justify-center">
                              {stockAlert}
                              {expiryAlert}
                            </div>
                            <span className="text-xs font-medium text-slate-700">{stock} units</span>
                          </div>
                          <div className="col-span-2 text-center flex flex-col">
                            <span className="text-sm font-semibold text-slate-700">₹{med.price}</span>
                            {med.mrp && <span className="text-[10px] text-slate-400 line-through">MRP: ₹{med.mrp}</span>}
                          </div>
                          <div className="col-span-3 text-right flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              placeholder="Qty"
                              id={`restock-qty-${med.medicine_name}`}
                              className="w-14 h-7 text-[11px] border border-slate-200 rounded px-1 text-center font-medium focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                              defaultValue=""
                              onKeyDown={async (e) => {
                                if (e.key === 'Enter') {
                                  const val = parseInt(e.target.value);
                                  if (val && !isNaN(val)) {
                                    await handleCustomRestock(med.medicine_name, val);
                                    e.target.value = "";
                                  }
                                }
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const inputEl = document.getElementById(`restock-qty-${med.medicine_name}`);
                                const val = parseInt(inputEl?.value);
                                if (val && !isNaN(val)) {
                                  await handleCustomRestock(med.medicine_name, val);
                                  if (inputEl) inputEl.value = "";
                                } else {
                                  showToast("Please enter a quantity", "error");
                                }
                              }}
                              className="h-7 px-2 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-semibold shadow-xs"
                            >
                              Add
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditModal(med)}
                              className="h-7 px-2 text-xs border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold shadow-xs"
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      );
                    })}

                    {filteredMedicines.length === 0 && (
                      <div className="text-center text-muted-foreground py-20 text-sm">
                        No medicines found.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
