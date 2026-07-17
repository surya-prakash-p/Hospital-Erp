import frappe
import os

# Initialize Frappe
os.chdir("/home/surya/frappe-bench")
frappe.init("site1.local", sites_path="sites")
frappe.connect()

# Create Doctor, Patient, Walk-in DocTypes
# First delete them if they exist to avoid duplication and get a clean state
for dt in ["Hospital Patient", "Hospital Doctor", "Hospital Patient Walk In",
           "Hospital Lab Test", "Hospital Appointment", "Hospital Audit Log", "Hospital Medicine"]:
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

# Create Hospital Medicine DocType
medicine_dt = frappe.get_doc({
    "doctype": "DocType",
    "name": "Hospital Medicine",
    "module": "Hospital ERP",
    "custom": 1,
    "autoname": "field:medicine_name",
    "fields": [
        {"fieldname": "medicine_name", "fieldtype": "Data", "label": "Medicine Name", "reqd": 1, "unique": 1, "in_list_view": 1},
        {"fieldname": "generic_name", "fieldtype": "Data", "label": "Generic Name"},
        {"fieldname": "batch_number", "fieldtype": "Data", "label": "Batch Number"},
        {"fieldname": "mfg_date", "fieldtype": "Date", "label": "MFG Date"},
        {"fieldname": "exp_date", "fieldtype": "Date", "label": "EXP Date"},
        {"fieldname": "shelf_life", "fieldtype": "Data", "label": "Shelf Life"},
        {"fieldname": "manufacturer", "fieldtype": "Data", "label": "Manufacturer"},
        {"fieldname": "supplier", "fieldtype": "Data", "label": "Supplier"},
        {"fieldname": "category", "fieldtype": "Select", "label": "Category", "options": "Tablet\nCapsule\nSyrup\nInjection\nOintment\nDrops\nPowder\nOther"},
        {"fieldname": "strength", "fieldtype": "Data", "label": "Strength"},
        {"fieldname": "pack_size", "fieldtype": "Data", "label": "Pack Size"},
        {"fieldname": "purchase_price", "fieldtype": "Currency", "label": "Purchase Price"},
        {"fieldname": "mrp", "fieldtype": "Currency", "label": "MRP"},
        {"fieldname": "price", "fieldtype": "Currency", "label": "Selling Price", "reqd": 1, "in_list_view": 1},
        {"fieldname": "opening_stock", "fieldtype": "Int", "label": "Opening Stock"},
        {"fieldname": "stock", "fieldtype": "Int", "label": "Current Stock", "reqd": 1, "in_list_view": 1},
        {"fieldname": "reorder_level", "fieldtype": "Int", "label": "Reorder Level"},
        {"fieldname": "rack_location", "fieldtype": "Data", "label": "Rack Location"},
        {"fieldname": "storage", "fieldtype": "Data", "label": "Storage"},
        {"fieldname": "barcode", "fieldtype": "Data", "label": "Barcode"},
        {"fieldname": "is_recalled", "fieldtype": "Check", "label": "Batch Recalled"}
    ],
    "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
})
medicine_dt.insert()
print("Created DocType: Hospital Medicine")

# Add sample Medicines
medicines = [
    {"medicine_name": "Paracetamol 650mg", "generic_name": "Paracetamol", "batch_number": "BATCH001", "exp_date": "2026-12-31", "reorder_level": 50, "stock": 100, "price": 20},
    {"medicine_name": "Pantocid 40mg", "generic_name": "Pantoprazole", "batch_number": "BATCH002", "exp_date": "2027-05-20", "reorder_level": 30, "stock": 150, "price": 120},
    {"medicine_name": "Amoxicillin 500mg", "generic_name": "Amoxicillin", "batch_number": "BATCH003", "exp_date": "2026-08-15", "reorder_level": 100, "stock": 80, "price": 95},
    {"medicine_name": "Cetirizine 10mg", "generic_name": "Cetirizine", "batch_number": "BATCH004", "exp_date": "2026-07-25", "reorder_level": 50, "stock": 200, "price": 15},
    {"medicine_name": "Expired Med", "generic_name": "Old Pill", "batch_number": "BATCH005", "exp_date": "2026-01-01", "reorder_level": 10, "stock": 20, "price": 5}
]
for med in medicines:
    if not frappe.db.exists("Hospital Medicine", med["medicine_name"]):
        frappe.get_doc({
            "doctype": "Hospital Medicine",
            **med
        }).insert()
        print(f"Added sample Medicine: {med['medicine_name']}")

frappe.db.commit()
print("All set up successfully!")
