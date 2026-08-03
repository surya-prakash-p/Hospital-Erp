import frappe
import os

# Initialize Frappe
os.chdir("/home/surya/frappe-bench")
frappe.init("site1.local", sites_path="sites")
frappe.connect()

# Create Doctor, Patient, Walk-in DocTypes
# First delete them if they exist to avoid duplication and get a clean state
for dt in ["Hospital Patient", "Hospital Doctor", "Hospital Patient Walk In",
           "Hospital Lab Test", "Hospital Appointment", "Hospital Audit Log",
           "Hospital Goods Receipt Item", "Hospital Goods Receipt",
           "Hospital Purchase Order Item", "Hospital Purchase Order",
           "Hospital Drug Register", "Hospital Medicine Batch", "Hospital Medicine"]:
    if frappe.db.exists("DocType", dt):
        frappe.delete_doc("DocType", dt)
        print(f"Deleted existing DocType: {dt}")

# Create Hospital Patient DocType
patient_dt = frappe.get_doc({
    "doctype": "DocType",
    "name": "Hospital Patient",
    "module": "Hospital ERP",
    "custom": 1,
    "autoname": "field:mobile_number", # Set Name to Mobile Number to ensure uniqueness
    "fields": [
        {"fieldname": "patient_name", "fieldtype": "Data", "label": "Patient Name", "reqd": 1, "in_list_view": 1},
        {"fieldname": "mobile_number", "fieldtype": "Data", "label": "Mobile Number", "reqd": 1, "unique": 1, "in_list_view": 1},
        {"fieldname": "email", "fieldtype": "Data", "label": "Email"},
        {"fieldname": "gender", "fieldtype": "Select", "label": "Gender", "options": "Male\nFemale\nOther"},
        {"fieldname": "age", "fieldtype": "Int", "label": "Age"},
        {"fieldname": "medical_history", "fieldtype": "Text", "label": "Medical History"}
    ],
    "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
})
patient_dt.insert()
print("Created DocType: Hospital Patient")

# Create Hospital Doctor DocType
doctor_dt = frappe.get_doc({
    "doctype": "DocType",
    "name": "Hospital Doctor",
    "module": "Hospital ERP",
    "custom": 1,
    "autoname": "field:doctor_name",
    "fields": [
        {"fieldname": "doctor_name", "fieldtype": "Data", "label": "Doctor Name", "reqd": 1, "unique": 1, "in_list_view": 1},
        {"fieldname": "specialization", "fieldtype": "Data", "label": "Specialization", "reqd": 1, "in_list_view": 1},
        {"fieldname": "consultation_fee", "fieldtype": "Currency", "label": "Consultation Fee", "reqd": 1}
    ],
    "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
})
doctor_dt.insert()
print("Created DocType: Hospital Doctor")

# Create Hospital Patient Walk In DocType
walkin_dt = frappe.get_doc({
    "doctype": "DocType",
    "name": "Hospital Patient Walk In",
    "module": "Hospital ERP",
    "custom": 1,
    "naming_rule": "Expression (BY PASS)",
    "autoname": "format:HOSP-WALK-{YYYY}-{#####}",
    "fields": [
        {"fieldname": "patient_name", "fieldtype": "Data", "label": "Patient Name", "reqd": 1, "in_list_view": 1},
        {"fieldname": "mobile_number", "fieldtype": "Data", "label": "Mobile Number", "reqd": 1, "in_list_view": 1},
        {"fieldname": "patient", "fieldtype": "Link", "label": "Patient Link", "options": "Hospital Patient", "read_only": 1},
        {"fieldname": "is_existing", "fieldtype": "Check", "label": "Existing Patient?", "read_only": 1},
        {"fieldname": "doctor", "fieldtype": "Link", "label": "Assign Doctor", "options": "Hospital Doctor", "in_list_view": 1},
        {"fieldname": "appointment_status", "fieldtype": "Select", "label": "Workflow Status", "options": "Reception\nDoctor Consultation\nLab Test\nPharmacy\nBilling\nCompleted", "default": "Reception", "in_list_view": 1},
        {"fieldname": "section_doctor", "fieldtype": "Section Break", "label": "Doctor Consultation Section"},
        {"fieldname": "diagnosis", "fieldtype": "Small Text", "label": "Diagnosis"},
        {"fieldname": "prescription", "fieldtype": "Text", "label": "Prescription"},
        {"fieldname": "need_lab_test", "fieldtype": "Check", "label": "Need Lab Test?"},
        {"fieldname": "lab_test_name", "fieldtype": "Data", "label": "Lab Test Name"},
        {"fieldname": "lab_test_status", "fieldtype": "Select", "label": "Lab Test Status", "options": "Pending\nCompleted", "default": "Pending"},
        {"fieldname": "lab_result", "fieldtype": "Small Text", "label": "Lab Result"},
        {"fieldname": "need_medicines", "fieldtype": "Check", "label": "Need Medicines?"},
        {"fieldname": "pharmacy_status", "fieldtype": "Select", "label": "Pharmacy Status", "options": "Pending\nCompleted", "default": "Pending"},
        {"fieldname": "section_billing", "fieldtype": "Section Break", "label": "Billing & Payment"},
        {"fieldname": "bill_amount", "fieldtype": "Currency", "label": "Bill Amount"},
        {"fieldname": "payment_received", "fieldtype": "Check", "label": "Payment Received?"},
        {"fieldname": "payment_method", "fieldtype": "Select", "label": "Payment Method", "options": "Cash\nCard\nUPI"}
    ],
    "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
})
walkin_dt.insert()
print("Created DocType: Hospital Patient Walk In")

# Create Hospital Lab Test DocType (test catalog with fees)
labtest_dt = frappe.get_doc({
    "doctype": "DocType",
    "name": "Hospital Lab Test",
    "module": "Hospital ERP",
    "custom": 1,
    "autoname": "field:test_name",
    "fields": [
        {"fieldname": "test_name", "fieldtype": "Data", "label": "Test Name", "reqd": 1, "unique": 1, "in_list_view": 1},
        {"fieldname": "fee", "fieldtype": "Currency", "label": "Fee", "reqd": 1, "in_list_view": 1}
    ],
    "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
})
labtest_dt.insert()
print("Created DocType: Hospital Lab Test")

# Create Hospital Appointment DocType (future scheduling)
appointment_dt = frappe.get_doc({
    "doctype": "DocType",
    "name": "Hospital Appointment",
    "module": "Hospital ERP",
    "custom": 1,
    "naming_rule": "Expression (BY PASS)",
    "autoname": "format:HOSP-APPT-{YYYY}-{#####}",
    "fields": [
        {"fieldname": "patient_name", "fieldtype": "Data", "label": "Patient Name", "reqd": 1, "in_list_view": 1},
        {"fieldname": "mobile_number", "fieldtype": "Data", "label": "Mobile Number", "reqd": 1, "in_list_view": 1},
        {"fieldname": "doctor", "fieldtype": "Link", "label": "Doctor", "options": "Hospital Doctor", "reqd": 1, "in_list_view": 1},
        {"fieldname": "appointment_date", "fieldtype": "Date", "label": "Date", "reqd": 1, "in_list_view": 1},
        {"fieldname": "appointment_time", "fieldtype": "Data", "label": "Time", "reqd": 1},
        {"fieldname": "notes", "fieldtype": "Small Text", "label": "Notes"},
        {"fieldname": "status", "fieldtype": "Select", "label": "Status", "options": "Scheduled\nChecked In\nCancelled", "default": "Scheduled", "in_list_view": 1}
    ],
    "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
})
appointment_dt.insert()
print("Created DocType: Hospital Appointment")

# Create Hospital Audit Log DocType (append-only activity trail)
audit_dt = frappe.get_doc({
    "doctype": "DocType",
    "name": "Hospital Audit Log",
    "module": "Hospital ERP",
    "custom": 1,
    "naming_rule": "Expression (BY PASS)",
    "autoname": "format:AUD-{YYYY}-{#####}",
    "fields": [
        {"fieldname": "role", "fieldtype": "Data", "label": "Role", "in_list_view": 1},
        {"fieldname": "action", "fieldtype": "Data", "label": "Action", "reqd": 1, "in_list_view": 1},
        {"fieldname": "entity_type", "fieldtype": "Data", "label": "Entity Type", "in_list_view": 1},
        {"fieldname": "entity_name", "fieldtype": "Data", "label": "Entity Name", "in_list_view": 1},
        {"fieldname": "details", "fieldtype": "Small Text", "label": "Details"},
        {"fieldname": "timestamp", "fieldtype": "Datetime", "label": "Timestamp", "default": "Now"}
    ],
    "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
})
audit_dt.insert()
print("Created DocType: Hospital Audit Log")

# Add sample Lab Tests
for test, fee in [("Complete Blood Count (CBC)", 450), ("Blood Sugar (Fasting)", 250),
                  ("Lipid Profile", 800), ("Liver Function Test", 900),
                  ("Thyroid Profile (T3 T4 TSH)", 700)]:
    if not frappe.db.exists("Hospital Lab Test", test):
        frappe.get_doc({"doctype": "Hospital Lab Test", "test_name": test, "fee": fee}).insert()
        print(f"Added sample Lab Test: {test}")

# Add some sample Doctors
for name, spec, fee in [("Dr. Rajesh", "General Physician", 500), ("Dr. Priya", "Cardiologist", 1000), ("Dr. Vignesh", "Pediatrician", 600)]:
    if not frappe.db.exists("Hospital Doctor", name):
        frappe.get_doc({
            "doctype": "Hospital Doctor",
            "doctor_name": name,
            "specialization": spec,
            "consultation_fee": fee
        }).insert()
        print(f"Added sample Doctor: {name}")

# Add some sample Patients with medical records
sample_patients = [
    {
        "patient_name": "Surya Prakash",
        "mobile_number": "9876543210",
        "email": "surya@example.com",
        "gender": "Male",
        "age": 24,
        "medical_history": "Patient visited on 2026-05-10.\nDiagnosis: Mild Fever.\nPrescription: Paracetamol 650mg twice daily for 3 days.\nLab Test: None.\nStatus: Completed."
    },
    {
        "patient_name": "Yokesh Raj",
        "mobile_number": "9876501234",
        "email": "yokesh@example.com",
        "gender": "Male",
        "age": 28,
        "medical_history": "Patient visited on 2026-06-01.\nDiagnosis: Gastric issues.\nPrescription: Antacids (Pantocid 40mg) before breakfast for 5 days.\nLab Test: Blood count (CBC) - reports normal.\nStatus: Completed."
    }
]
for p in sample_patients:
    if not frappe.db.exists("Hospital Patient", p["mobile_number"]):
        frappe.get_doc({
            "doctype": "Hospital Patient",
            **p
        }).insert()
        print(f"Added sample Patient: {p['patient_name']}")

# Create parent DocTypes and child tables for Pharmacy compliance
# 1. Hospital Medicine (Parent)
med_dt = frappe.get_doc({
    "doctype": "DocType",
    "name": "Hospital Medicine",
    "module": "Hospital ERP",
    "custom": 1,
    "autoname": "field:medicine_name",
    "fields": [
        {"fieldname": "medicine_name", "fieldtype": "Data", "label": "Medicine Name", "reqd": 1, "unique": 1, "in_list_view": 1},
        {"fieldname": "generic_name", "fieldtype": "Data", "label": "Generic Name", "reqd": 1, "in_list_view": 1},
        {"fieldname": "brand", "fieldtype": "Data", "label": "Brand Name"},
        {"fieldname": "manufacturer", "fieldtype": "Data", "label": "Manufacturer"},
        {"fieldname": "strength", "fieldtype": "Data", "label": "Strength"},
        {"fieldname": "dosage_form", "fieldtype": "Select", "label": "Dosage Form", "options": "Tablet\nCapsule\nSyrup\nInjection\nOintment\nDrops\nPowder\nOther", "default": "Tablet", "reqd": 1},
        {"fieldname": "category", "fieldtype": "Select", "label": "Drug Category", "options": "Regular Medicine\nSchedule H\nSchedule H1\nSleeping Pill\nControlled Drug\nOTC\nOther", "default": "Regular Medicine", "reqd": 1, "in_list_view": 1},
        {"fieldname": "schedule_type", "fieldtype": "Select", "label": "Schedule Type", "options": "None\nSchedule H\nSchedule H1", "default": "None"},
        {"fieldname": "prescription_required", "fieldtype": "Check", "label": "Prescription Required", "default": 0},
        {"fieldname": "controlled_drug", "fieldtype": "Check", "label": "Controlled Drug (Narcotic)", "default": 0},
        {"fieldname": "sleeping_pill", "fieldtype": "Check", "label": "Sleeping Pill (H1/G)", "default": 0},
        {"fieldname": "min_stock", "fieldtype": "Int", "label": "Minimum Stock", "default": 50},
        {"fieldname": "max_stock", "fieldtype": "Int", "label": "Maximum Stock", "default": 500},
        {"fieldname": "reorder_level", "fieldtype": "Int", "label": "Reorder Level", "default": 100},
        {"fieldname": "rack_location", "fieldtype": "Data", "label": "Default Rack Location"},
        {"fieldname": "purchase_price", "fieldtype": "Currency", "label": "Purchase Price"},
        {"fieldname": "selling_price", "fieldtype": "Currency", "label": "Selling Price"},
        {"fieldname": "gst", "fieldtype": "Percent", "label": "GST %", "default": 12.0},
        {"fieldname": "stock", "fieldtype": "Int", "label": "Current Stock", "read_only": 1, "in_list_view": 1},
        {"fieldname": "disabled", "fieldtype": "Check", "label": "Deactivated", "default": 0}
    ],
    "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
})
med_dt.insert()
print("Created DocType: Hospital Medicine")

# 2. Hospital Medicine Batch
batch_dt = frappe.get_doc({
    "doctype": "DocType",
    "name": "Hospital Medicine Batch",
    "module": "Hospital ERP",
    "custom": 1,
    "autoname": "field:batch_number",
    "fields": [
        {"fieldname": "batch_number", "fieldtype": "Data", "label": "Batch Number", "reqd": 1, "unique": 1, "in_list_view": 1},
        {"fieldname": "medicine", "fieldtype": "Link", "label": "Medicine Link", "options": "Hospital Medicine", "reqd": 1, "in_list_view": 1},
        {"fieldname": "mfg_date", "fieldtype": "Date", "label": "Manufacturing Date"},
        {"fieldname": "exp_date", "fieldtype": "Date", "label": "Expiry Date", "reqd": 1, "in_list_view": 1},
        {"fieldname": "current_stock", "fieldtype": "Int", "label": "Current Stock", "reqd": 1, "in_list_view": 1},
        {"fieldname": "purchase_price", "fieldtype": "Currency", "label": "Purchase Price"},
        {"fieldname": "selling_price", "fieldtype": "Currency", "label": "Selling Price"},
        {"fieldname": "supplier", "fieldtype": "Data", "label": "Supplier Source"},
        {"fieldname": "rack_location", "fieldtype": "Data", "label": "Rack Location"}
    ],
    "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
})
batch_dt.insert()
print("Created DocType: Hospital Medicine Batch")

# 3. Hospital Drug Register
reg_dt = frappe.get_doc({
    "doctype": "DocType",
    "name": "Hospital Drug Register",
    "module": "Hospital ERP",
    "custom": 1,
    "naming_rule": "Expression (BY PASS)",
    "autoname": "format:REG-{YYYY}-{#####}",
    "fields": [
        {"fieldname": "patient_name", "fieldtype": "Data", "label": "Patient Name", "reqd": 1, "in_list_view": 1},
        {"fieldname": "patient_id", "fieldtype": "Data", "label": "Patient ID (Mobile)", "reqd": 1, "in_list_view": 1},
        {"fieldname": "doctor", "fieldtype": "Link", "label": "Prescribing Doctor", "options": "Hospital Doctor", "reqd": 1, "in_list_view": 1},
        {"fieldname": "medicine", "fieldtype": "Link", "label": "Medicine", "options": "Hospital Medicine", "reqd": 1, "in_list_view": 1},
        {"fieldname": "drug_category", "fieldtype": "Data", "label": "Drug Category", "in_list_view": 1},
        {"fieldname": "batch_number", "fieldtype": "Data", "label": "Batch Number", "reqd": 1, "in_list_view": 1},
        {"fieldname": "quantity", "fieldtype": "Int", "label": "Quantity Dispensed", "reqd": 1, "in_list_view": 1},
        {"fieldname": "invoice_number", "fieldtype": "Data", "label": "Invoice Number", "reqd": 1, "in_list_view": 1},
        {"fieldname": "dispensing_date", "fieldtype": "Datetime", "label": "Dispensing Date", "reqd": 1, "in_list_view": 1},
        {"fieldname": "pharmacist", "fieldtype": "Data", "label": "Dispensing Pharmacist", "reqd": 1}
    ],
    "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
})
reg_dt.insert()
print("Created DocType: Hospital Drug Register")

# 4. Hospital Purchase Order Item (Child Table)
po_item_dt = frappe.get_doc({
    "doctype": "DocType",
    "name": "Hospital Purchase Order Item",
    "module": "Hospital ERP",
    "custom": 1,
    "istable": 1,
    "fields": [
        {"fieldname": "medicine", "fieldtype": "Link", "label": "Medicine", "options": "Hospital Medicine", "reqd": 1, "in_list_view": 1},
        {"fieldname": "quantity", "fieldtype": "Int", "label": "Quantity", "reqd": 1, "in_list_view": 1},
        {"fieldname": "purchase_price", "fieldtype": "Currency", "label": "Purchase Price", "reqd": 1, "in_list_view": 1},
        {"fieldname": "amount", "fieldtype": "Currency", "label": "Amount", "read_only": 1, "in_list_view": 1}
    ]
})
po_item_dt.insert()
print("Created DocType: Hospital Purchase Order Item")

# 5. Hospital Goods Receipt Item (Child Table)
grn_item_dt = frappe.get_doc({
    "doctype": "DocType",
    "name": "Hospital Goods Receipt Item",
    "module": "Hospital ERP",
    "custom": 1,
    "istable": 1,
    "fields": [
        {"fieldname": "medicine", "fieldtype": "Link", "label": "Medicine", "options": "Hospital Medicine", "reqd": 1, "in_list_view": 1},
        {"fieldname": "batch_number", "fieldtype": "Data", "label": "Batch Number", "reqd": 1, "in_list_view": 1},
        {"fieldname": "mfg_date", "fieldtype": "Date", "label": "MFG Date"},
        {"fieldname": "exp_date", "fieldtype": "Date", "label": "EXP Date", "reqd": 1, "in_list_view": 1},
        {"fieldname": "quantity", "fieldtype": "Int", "label": "Quantity Received", "reqd": 1, "in_list_view": 1},
        {"fieldname": "purchase_price", "fieldtype": "Currency", "label": "Purchase Price", "reqd": 1},
        {"fieldname": "selling_price", "fieldtype": "Currency", "label": "Selling Price", "reqd": 1},
        {"fieldname": "rack_location", "fieldtype": "Data", "label": "Rack Location"}
    ]
})
grn_item_dt.insert()
print("Created DocType: Hospital Goods Receipt Item")

# 6. Hospital Purchase Order
po_dt = frappe.get_doc({
    "doctype": "DocType",
    "name": "Hospital Purchase Order",
    "module": "Hospital ERP",
    "custom": 1,
    "naming_rule": "Expression (BY PASS)",
    "autoname": "format:PO-{YYYY}-{#####}",
    "fields": [
        {"fieldname": "supplier", "fieldtype": "Data", "label": "Supplier Name", "reqd": 1, "in_list_view": 1},
        {"fieldname": "date", "fieldtype": "Date", "label": "PO Date", "reqd": 1, "in_list_view": 1},
        {"fieldname": "total_amount", "fieldtype": "Currency", "label": "Total Amount", "read_only": 1, "in_list_view": 1},
        {"fieldname": "status", "fieldtype": "Select", "label": "Status", "options": "Draft\nSubmitted\nReceived", "default": "Draft", "in_list_view": 1},
        {"fieldname": "items", "fieldtype": "Table", "label": "Purchase Items", "options": "Hospital Purchase Order Item"}
    ],
    "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
})
po_dt.insert()
print("Created DocType: Hospital Purchase Order")

# 7. Hospital Goods Receipt
grn_dt = frappe.get_doc({
    "doctype": "DocType",
    "name": "Hospital Goods Receipt",
    "module": "Hospital ERP",
    "custom": 1,
    "naming_rule": "Expression (BY PASS)",
    "autoname": "format:GRN-{YYYY}-{#####}",
    "fields": [
        {"fieldname": "purchase_order", "fieldtype": "Link", "label": "Purchase Order Link", "options": "Hospital Purchase Order"},
        {"fieldname": "supplier", "fieldtype": "Data", "label": "Supplier Name", "reqd": 1, "in_list_view": 1},
        {"fieldname": "receipt_date", "fieldtype": "Date", "label": "Receipt Date", "reqd": 1, "in_list_view": 1},
        {"fieldname": "status", "fieldtype": "Select", "label": "Status", "options": "Completed", "default": "Completed", "in_list_view": 1},
        {"fieldname": "items", "fieldtype": "Table", "label": "Received Items", "options": "Hospital Goods Receipt Item"}
    ],
    "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
})
grn_dt.insert()
print("Created DocType: Hospital Goods Receipt")

# 8. Hospital Stock Movement Log
stk_mov_dt = frappe.get_doc({
    "doctype": "DocType",
    "name": "Hospital Stock Movement Log",
    "module": "Hospital ERP",
    "custom": 1,
    "naming_rule": "Expression (BY PASS)",
    "autoname": "format:STK-MOV-{YYYY}-{#####}",
    "fields": [
        {"fieldname": "medicine", "fieldtype": "Link", "label": "Medicine", "options": "Hospital Medicine", "reqd": 1, "in_list_view": 1},
        {"fieldname": "batch", "fieldtype": "Link", "label": "Batch", "options": "Hospital Medicine Batch", "reqd": 1, "in_list_view": 1},
        {"fieldname": "date", "fieldtype": "Datetime", "label": "Movement Date", "reqd": 1, "in_list_view": 1},
        {"fieldname": "previous_stock", "fieldtype": "Int", "label": "Previous Stock", "reqd": 1, "in_list_view": 1},
        {"fieldname": "updated_stock", "fieldtype": "Int", "label": "Updated Stock", "reqd": 1, "in_list_view": 1},
        {"fieldname": "adjustment_type", "fieldtype": "Select", "label": "Adjustment Type", "options": "Add Stock\nReduce Stock\nDamaged\nExpired\nReturned\nPhysical Count Correction\nSale\nPurchase", "reqd": 1, "in_list_view": 1},
        {"fieldname": "quantity", "fieldtype": "Int", "label": "Quantity Changed", "reqd": 1, "in_list_view": 1},
        {"fieldname": "reason", "fieldtype": "Data", "label": "Reason", "in_list_view": 1},
        {"fieldname": "remarks", "fieldtype": "Small Text", "label": "Remarks"},
        {"fieldname": "performed_by", "fieldtype": "Data", "label": "Performed By"}
    ],
    "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
})
stk_mov_dt.insert()
print("Created DocType: Hospital Stock Movement Log")

# Add Seed Medicines
medicines = [
    {
        "medicine_name": "Paracetamol 650mg", "generic_name": "Paracetamol", "brand": "Calpol 650", "manufacturer": "GSK India",
        "strength": "650 mg", "dosage_form": "Tablet", "category": "Regular Medicine", "schedule_type": "None",
        "prescription_required": 0, "controlled_drug": 0, "sleeping_pill": 0, "min_stock": 100, "max_stock": 500,
        "reorder_level": 150, "rack_location": "Rack A-02", "purchase_price": 18.0, "selling_price": 20.0, "gst": 12.0
    },
    {
        "medicine_name": "Amoxicillin 500mg", "generic_name": "Amoxicillin Trihydrate", "brand": "Mox 500", "manufacturer": "Sun Pharma Ltd",
        "strength": "500 mg", "dosage_form": "Capsule", "category": "Schedule H", "schedule_type": "Schedule H",
        "prescription_required": 1, "controlled_drug": 0, "sleeping_pill": 0, "min_stock": 50, "max_stock": 200,
        "reorder_level": 80, "rack_location": "Rack B-04", "purchase_price": 80.0, "selling_price": 95.0, "gst": 12.0
    },
    {
        "medicine_name": "Alprazolam 0.5mg", "generic_name": "Alprazolam", "brand": "Xanax 0.5", "manufacturer": "Pfizer India",
        "strength": "0.5 mg", "dosage_form": "Tablet", "category": "Sleeping Pill", "schedule_type": "Schedule H1",
        "prescription_required": 1, "controlled_drug": 0, "sleeping_pill": 1, "min_stock": 20, "max_stock": 100,
        "reorder_level": 30, "rack_location": "Rack C-01 (Locked)", "purchase_price": 12.0, "selling_price": 15.0, "gst": 12.0
    },
    {
        "medicine_name": "Fentanyl 50mcg", "generic_name": "Fentanyl Citrate", "brand": "Duragesic Patch", "manufacturer": "Janssen Pharma",
        "strength": "50 mcg/hr", "dosage_form": "Other", "category": "Controlled Drug", "schedule_type": "Schedule H1",
        "prescription_required": 1, "controlled_drug": 1, "sleeping_pill": 0, "min_stock": 10, "max_stock": 50,
        "reorder_level": 15, "rack_location": "Double-Locked Safe-01", "purchase_price": 250.0, "selling_price": 300.0, "gst": 18.0
    },
    {
        "medicine_name": "Cetirizine 10mg", "generic_name": "Cetirizine Dihydrochloride", "brand": "Okacet", "manufacturer": "Cipla Ltd",
        "strength": "10 mg", "dosage_form": "Tablet", "category": "OTC", "schedule_type": "None",
        "prescription_required": 0, "controlled_drug": 0, "sleeping_pill": 0, "min_stock": 40, "max_stock": 200,
        "reorder_level": 60, "rack_location": "Rack A-01", "purchase_price": 10.0, "selling_price": 15.0, "gst": 12.0
    },
    {
        "medicine_name": "Zolpidem 10mg", "generic_name": "Zolpidem Tartrate", "brand": "Stilnox", "manufacturer": "Sanofi India",
        "strength": "10 mg", "dosage_form": "Tablet", "category": "Sleeping Pill", "schedule_type": "Schedule H",
        "prescription_required": 1, "controlled_drug": 0, "sleeping_pill": 1, "min_stock": 15, "max_stock": 80,
        "reorder_level": 25, "rack_location": "Rack C-02 (Locked)", "purchase_price": 40.0, "selling_price": 50.0, "gst": 12.0
    }
]

for med in medicines:
    if not frappe.db.exists("Hospital Medicine", med["medicine_name"]):
        frappe.get_doc({"doctype": "Hospital Medicine", **med}).insert()
        print(f"Added sample Medicine: {med['medicine_name']}")

# Add Seed Batches
batches = [
    {"batch_number": "PM-EXPIRED", "medicine": "Paracetamol 650mg", "mfg_date": "2024-01-01", "exp_date": "2026-01-01", "current_stock": 0, "purchase_price": 18.0, "selling_price": 20.0, "supplier": "ABC Pharma", "rack_location": "Rack A-02"},
    {"batch_number": "PM-EXP30D", "medicine": "Paracetamol 650mg", "mfg_date": "2024-08-01", "exp_date": "2026-08-15", "current_stock": 10, "purchase_price": 18.0, "selling_price": 20.0, "supplier": "ABC Pharma", "rack_location": "Rack A-02"},
    {"batch_number": "PM-EXP6M", "medicine": "Paracetamol 650mg", "mfg_date": "2024-12-01", "exp_date": "2026-11-30", "current_stock": 20, "purchase_price": 18.0, "selling_price": 20.0, "supplier": "ABC Pharma", "rack_location": "Rack A-02"},
    {"batch_number": "PM-STABLE", "medicine": "Paracetamol 650mg", "mfg_date": "2025-05-01", "exp_date": "2027-05-01", "current_stock": 60, "purchase_price": 18.0, "selling_price": 20.0, "supplier": "ABC Pharma", "rack_location": "Rack A-02"},
    {"batch_number": "AM-EXP30D", "medicine": "Amoxicillin 500mg", "mfg_date": "2024-08-01", "exp_date": "2026-08-20", "current_stock": 15, "purchase_price": 80.0, "selling_price": 95.0, "supplier": "XYZ Distributors", "rack_location": "Rack B-04"},
    {"batch_number": "AM-EXP3M", "medicine": "Amoxicillin 500mg", "mfg_date": "2024-10-01", "exp_date": "2026-10-15", "current_stock": 20, "purchase_price": 80.0, "selling_price": 95.0, "supplier": "XYZ Distributors", "rack_location": "Rack B-04"},
    {"batch_number": "AL-EXP3M", "medicine": "Alprazolam 0.5mg", "mfg_date": "2024-11-01", "exp_date": "2026-10-01", "current_stock": 8, "purchase_price": 12.0, "selling_price": 15.0, "supplier": "Pharma Plus", "rack_location": "Rack C-01 (Locked)"},
    {"batch_number": "AL-STABLE", "medicine": "Alprazolam 0.5mg", "mfg_date": "2025-01-01", "exp_date": "2027-12-31", "current_stock": 50, "purchase_price": 12.0, "selling_price": 15.0, "supplier": "Pharma Plus", "rack_location": "Rack C-01 (Locked)"},
    {"batch_number": "FT-EXP6M", "medicine": "Fentanyl 50mcg", "mfg_date": "2025-01-01", "exp_date": "2026-12-31", "current_stock": 3, "purchase_price": 250.0, "selling_price": 300.0, "supplier": "Special Drugs Ltd", "rack_location": "Double-Locked Safe-01"},
    {"batch_number": "FT-STABLE", "medicine": "Fentanyl 50mcg", "mfg_date": "2025-04-01", "exp_date": "2027-10-31", "current_stock": 20, "purchase_price": 250.0, "selling_price": 300.0, "supplier": "Special Drugs Ltd", "rack_location": "Double-Locked Safe-01"},
    {"batch_number": "CT-STABLE", "medicine": "Cetirizine 10mg", "mfg_date": "2025-01-01", "exp_date": "2027-01-01", "current_stock": 180, "purchase_price": 10.0, "selling_price": 15.0, "supplier": "City Meds", "rack_location": "Rack A-01"}
]

for b in batches:
    if not frappe.db.exists("Hospital Medicine Batch", b["batch_number"]):
        frappe.get_doc({"doctype": "Hospital Medicine Batch", **b}).insert()
        print(f"Added sample Batch: {b['batch_number']}")

# Add Seed Drug Register Log entries
register_entries = [
    {
        "patient_name": "Surya Prakash", "patient_id": "9876543210", "doctor": "Dr. Rajesh", "medicine": "Paracetamol 650mg",
        "drug_category": "Regular Medicine", "batch_number": "PM-EXP30D", "quantity": 10, "invoice_number": "INV-PH-10023",
        "dispensing_date": "2026-07-27 10:15:00", "pharmacist": "Rahul Sharma, RPh"
    },
    {
        "patient_name": "Yokesh Raj", "patient_id": "9876501234", "doctor": "Dr. Priya", "medicine": "Alprazolam 0.5mg",
        "drug_category": "Sleeping Pill", "batch_number": "AL-EXP3M", "quantity": 5, "invoice_number": "INV-PH-10024",
        "dispensing_date": "2026-07-28 08:30:00", "pharmacist": "Rahul Sharma, RPh"
    },
    {
        "patient_name": "Surya Prakash", "patient_id": "9876543210", "doctor": "Dr. Vignesh", "medicine": "Amoxicillin 500mg",
        "drug_category": "Schedule H", "batch_number": "AM-EXP30D", "quantity": 15, "invoice_number": "INV-PH-10025",
        "dispensing_date": "2026-07-28 09:45:00", "pharmacist": "Rahul Sharma, RPh"
    }
]

for r in register_entries:
    # Use formatted invoice number or generate
    frappe.get_doc({"doctype": "Hospital Drug Register", **r}).insert()

# Add Seed Purchase Order
po_sample = {
    "supplier": "ABC Pharma",
    "date": "2026-07-26",
    "status": "Submitted",
    "items": [
        {"medicine": "Paracetamol 650mg", "quantity": 300, "purchase_price": 18.0, "amount": 5400.0}
    ],
    "total_amount": 5400.0
}
if not frappe.db.exists("Hospital Purchase Order", "PO-2026-00001"):
    frappe.get_doc({"doctype": "Hospital Purchase Order", **po_sample}).insert()

frappe.db.commit()
print("All set up successfully!")
