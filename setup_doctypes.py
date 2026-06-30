import frappe
import os

# Initialize Frappe
os.chdir("/home/surya/frappe-bench")
frappe.init("site1.local", sites_path="sites")
frappe.connect()

# Create Doctor, Patient, Walk-in DocTypes
# First delete them if they exist to avoid duplication and get a clean state
for dt in ["Hospital Patient", "Hospital Doctor", "Hospital Patient Walk In"]:
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

frappe.db.commit()
print("All set up successfully!")
