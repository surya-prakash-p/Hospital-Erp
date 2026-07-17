import urllib.request
import urllib.parse
import json
import sys

API_KEY = "802a7dc89ec8034"
API_SECRET = "edd331225cf6ca1"
SITE_URL = "https://thangamhospital.m.frappe.cloud"

headers = {
    "Authorization": f"token {API_KEY}:{API_SECRET}",
    "Content-Type": "application/json",
    "Accept": "application/json"
}

def make_request(method, endpoint, data=None):
    # Quote endpoint path segments to handle spaces correctly
    parts = endpoint.split('/')
    quoted_parts = [urllib.parse.quote(p) if p else '' for p in parts]
    url = f"{SITE_URL}{'/'.join(quoted_parts)}"
    
    req = urllib.request.Request(url, headers=headers, method=method)
    if data:
        req.data = json.dumps(data).encode("utf-8")
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode("utf-8")
            return json.loads(res_data) if res_data else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        if method == "DELETE" and e.code == 404:
            return {}
        print(f"HTTP Error {e.code} for {method} {url}: {err_body}")
        raise e
    except Exception as e:
        print(f"Error connecting to {url}: {e}")
        raise e

print("Starting remote setup on Frappe Cloud...")

# 1. Clean up existing DocTypes if they exist
doctypes_to_create = [
    "Hospital Patient", 
    "Hospital Doctor", 
    "Hospital Patient Walk In",
    "Hospital Lab Test", 
    "Hospital Appointment", 
    "Hospital Audit Log",
    "Hospital Medicine"
]

for dt in doctypes_to_create:
    try:
        make_request("DELETE", f"/api/resource/DocType/{dt}")
        print(f"Cleaned up existing DocType: {dt}")
    except Exception:
        pass

# 2. Define DocType schemas
doctypes = [
    {
        "doctype": "DocType",
        "name": "Hospital Patient",
        "module": "Core",
        "custom": 1,
        "autoname": "field:mobile_number",
        "fields": [
            {"fieldname": "patient_name", "fieldtype": "Data", "label": "Patient Name", "reqd": 1, "in_list_view": 1},
            {"fieldname": "mobile_number", "fieldtype": "Data", "label": "Mobile Number", "reqd": 1, "unique": 1, "in_list_view": 1},
            {"fieldname": "email", "fieldtype": "Data", "label": "Email"},
            {"fieldname": "gender", "fieldtype": "Select", "label": "Gender", "options": "Male\nFemale\nOther"},
            {"fieldname": "age", "fieldtype": "Int", "label": "Age"},
            {"fieldname": "height", "fieldtype": "Data", "label": "Height"},
            {"fieldname": "weight", "fieldtype": "Data", "label": "Weight"},
            {"fieldname": "blood_group", "fieldtype": "Select", "label": "Blood Group", "options": "A+\nA-\nB+\nB-\nAB+\nAB-\nO+\nO-"},
            {"fieldname": "temperature", "fieldtype": "Data", "label": "Temperature"},
            {"fieldname": "bp", "fieldtype": "Data", "label": "Blood Pressure"},
            {"fieldname": "pulse", "fieldtype": "Data", "label": "Pulse Rate"},
            {"fieldname": "resp_rate", "fieldtype": "Data", "label": "Respiratory Rate"},
            {"fieldname": "spo2", "fieldtype": "Data", "label": "SpO2"},
            {"fieldname": "allergies", "fieldtype": "Text", "label": "Allergies"},
            {"fieldname": "emergency_contact", "fieldtype": "Data", "label": "Emergency Contact"},
            {"fieldname": "medical_history", "fieldtype": "Text", "label": "Medical History"}
        ],
        "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
    },
    {
        "doctype": "DocType",
        "name": "Hospital Doctor",
        "module": "Core",
        "custom": 1,
        "autoname": "field:doctor_name",
        "fields": [
            {"fieldname": "doctor_name", "fieldtype": "Data", "label": "Doctor Name", "reqd": 1, "unique": 1, "in_list_view": 1},
            {"fieldname": "specialization", "fieldtype": "Data", "label": "Specialization", "reqd": 1, "in_list_view": 1},
            {"fieldname": "consultation_fee", "fieldtype": "Currency", "label": "Consultation Fee", "reqd": 1},
            {"fieldname": "doctor_image", "fieldtype": "Long Text", "label": "Doctor Image"},
            {"fieldname": "location", "fieldtype": "Data", "label": "Location"},
            {"fieldname": "experience", "fieldtype": "Data", "label": "Experience"},
            {"fieldname": "qualifications", "fieldtype": "Data", "label": "Qualifications"},
            {"fieldname": "rating", "fieldtype": "Float", "label": "Rating"},
            {"fieldname": "patients", "fieldtype": "Data", "label": "Patients"},
            {"fieldname": "success_rate", "fieldtype": "Data", "label": "Success Rate"},
            {"fieldname": "email", "fieldtype": "Data", "label": "Doctor Email"},
            {"fieldname": "password", "fieldtype": "Data", "label": "Doctor Password"},
            {"fieldname": "status", "fieldtype": "Select", "label": "Status", "options": "Available\nUnavailable"},
            {"fieldname": "about", "fieldtype": "Text", "label": "About Doctor"}
        ],
        "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
    },
    {
        "doctype": "DocType",
        "name": "Hospital Patient Walk In",
        "module": "Core",
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
            {"fieldname": "lab_test_image", "fieldtype": "Long Text", "label": "Lab Test Image"},
            {"fieldname": "need_medicines", "fieldtype": "Check", "label": "Need Medicines?"},
            {"fieldname": "pharmacy_status", "fieldtype": "Select", "label": "Pharmacy Status", "options": "Pending\nCompleted", "default": "Pending"},
            {"fieldname": "section_billing", "fieldtype": "Section Break", "label": "Billing & Payment"},
            {"fieldname": "bill_amount", "fieldtype": "Currency", "label": "Bill Amount"},
            {"fieldname": "payment_received", "fieldtype": "Check", "label": "Payment Received?"},
            {"fieldname": "payment_method", "fieldtype": "Select", "label": "Payment Method", "options": "Cash\nCard\nUPI"}
        ],
        "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
    },
    {
        "doctype": "DocType",
        "name": "Hospital Lab Test",
        "module": "Core",
        "custom": 1,
        "autoname": "field:test_name",
        "fields": [
            {"fieldname": "test_name", "fieldtype": "Data", "label": "Test Name", "reqd": 1, "unique": 1, "in_list_view": 1},
            {"fieldname": "fee", "fieldtype": "Currency", "label": "Fee", "reqd": 1, "in_list_view": 1}
        ],
        "permissions": [{"role": "System Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
    },
    {
        "doctype": "DocType",
        "name": "Hospital Appointment",
        "module": "Core",
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
    },
    {
        "doctype": "DocType",
        "name": "Hospital Audit Log",
        "module": "Core",
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
    },
    {
        "doctype": "DocType",
        "name": "Hospital Medicine",
        "module": "Core",
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
    }
]

# 3. Create DocTypes on Frappe Cloud
for dt_schema in doctypes:
    name = dt_schema["name"]
    try:
        make_request("POST", "/api/resource/DocType", data=dt_schema)
        print(f"Successfully created DocType: {name}")
    except Exception as e:
        print(f"Failed to create DocType: {name}. Error: {e}")
        sys.exit(1)

# 4. Insert Sample Lab Tests
lab_tests = [
    {"test_name": "Complete Blood Count (CBC)", "fee": 450},
    {"test_name": "Blood Sugar (Fasting)", "fee": 250},
    {"test_name": "Lipid Profile", "fee": 800},
    {"test_name": "Liver Function Test", "fee": 900},
    {"test_name": "Thyroid Profile (T3 T4 TSH)", "fee": 700}
]

for test in lab_tests:
    try:
        make_request("POST", "/api/resource/Hospital Lab Test", data=test)
        print(f"Added sample Lab Test: {test['test_name']}")
    except Exception as e:
        print(f"Warning: Failed to add lab test {test['test_name']}: {e}")

# 5. Insert Sample Doctors
doctors = [
    {"doctor_name": "Dr. Rajesh", "specialization": "General Physician", "consultation_fee": 500},
    {"doctor_name": "Dr. Priya", "specialization": "Cardiologist", "consultation_fee": 1000},
    {"doctor_name": "Dr. Vignesh", "specialization": "Pediatrician", "consultation_fee": 600}
]

for doc in doctors:
    try:
        make_request("POST", "/api/resource/Hospital Doctor", data=doc)
        print(f"Added sample Doctor: {doc['doctor_name']}")
    except Exception as e:
        print(f"Warning: Failed to add doctor {doc['doctor_name']}: {e}")

# 6. Insert Sample Patients
patients = [
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

for pat in patients:
    try:
        make_request("POST", "/api/resource/Hospital Patient", data=pat)
        print(f"Added sample Patient: {pat['patient_name']}")
    except Exception as e:
        print(f"Warning: Failed to add patient {pat['patient_name']}: {e}")

# 7. Insert Sample Medicines
medicines = [
    {"medicine_name": "Paracetamol 650mg", "stock": 100, "price": 20},
    {"medicine_name": "Pantocid 40mg", "stock": 150, "price": 120},
    {"medicine_name": "Amoxicillin 500mg", "stock": 80, "price": 95},
    {"medicine_name": "Cetirizine 10mg", "stock": 200, "price": 15},
    {"medicine_name": "Ibuprofen 400mg", "stock": 120, "price": 30}
]

for med in medicines:
    try:
        make_request("POST", "/api/resource/Hospital Medicine", data=med)
        print(f"Added sample Medicine: {med['medicine_name']}")
    except Exception as e:
        print(f"Warning: Failed to add medicine {med['medicine_name']}: {e}")

print("\nAll DocTypes and Sample Data setup successfully on your live Frappe Cloud backend!")
