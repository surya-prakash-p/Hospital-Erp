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

print("Starting Pharmacy ERP Remote Setup on Frappe Cloud...")

# 1. Clean up existing DocTypes
doctypes_to_delete = [
    "Hospital Stock Movement Log",
    "Hospital Goods Receipt Item",
    "Hospital Goods Receipt",
    "Hospital Purchase Order Item",
    "Hospital Purchase Order",
    "Hospital Drug Register",
    "Hospital Medicine Batch",
    "Hospital Medicine"
]

for dt in doctypes_to_delete:
    try:
        make_request("DELETE", f"/api/resource/DocType/{dt}")
        print(f"Cleaned up existing DocType: {dt}")
    except Exception:
        pass

# 2. Define parent DocTypes first, then child tables and dependent DocTypes
doctypes = [
    # Main DocType: Hospital Medicine (Primary Parent)
    {
        "doctype": "DocType",
        "name": "Hospital Medicine",
        "module": "Core",
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
    },
    # Main DocType: Hospital Medicine Batch (Depends on Hospital Medicine)
    {
        "doctype": "DocType",
        "name": "Hospital Medicine Batch",
        "module": "Core",
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
    },
    # Main DocType: Hospital Drug Register (Depends on Hospital Medicine)
    {
        "doctype": "DocType",
        "name": "Hospital Drug Register",
        "module": "Core",
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
    },
    # Child Table: Purchase Order Item (Depends on Hospital Medicine)
    {
        "doctype": "DocType",
        "name": "Hospital Purchase Order Item",
        "module": "Core",
        "custom": 1,
        "istable": 1,
        "fields": [
            {"fieldname": "medicine", "fieldtype": "Link", "label": "Medicine", "options": "Hospital Medicine", "reqd": 1, "in_list_view": 1},
            {"fieldname": "quantity", "fieldtype": "Int", "label": "Quantity", "reqd": 1, "in_list_view": 1},
            {"fieldname": "purchase_price", "fieldtype": "Currency", "label": "Purchase Price", "reqd": 1, "in_list_view": 1},
            {"fieldname": "amount", "fieldtype": "Currency", "label": "Amount", "read_only": 1, "in_list_view": 1}
        ]
    },
    # Child Table: Goods Receipt Item (Depends on Hospital Medicine)
    {
        "doctype": "DocType",
        "name": "Hospital Goods Receipt Item",
        "module": "Core",
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
    },
    # Main DocType: Hospital Purchase Order (Contains Hospital Purchase Order Item)
    {
        "doctype": "DocType",
        "name": "Hospital Purchase Order",
        "module": "Core",
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
    },
    # Main DocType: Hospital Goods Receipt (Contains Hospital Goods Receipt Item)
    {
        "doctype": "DocType",
        "name": "Hospital Goods Receipt",
        "module": "Core",
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
    },
    # Main DocType: Hospital Stock Movement Log (Depends on Hospital Medicine)
    {
        "doctype": "DocType",
        "name": "Hospital Stock Movement Log",
        "module": "Core",
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

# 4. Insert Seed Medicines
medicines = [
    {
        "medicine_name": "Paracetamol 650mg",
        "generic_name": "Paracetamol",
        "brand": "Calpol 650",
        "manufacturer": "GSK India",
        "strength": "650 mg",
        "dosage_form": "Tablet",
        "category": "Regular Medicine",
        "schedule_type": "None",
        "prescription_required": 0,
        "controlled_drug": 0,
        "sleeping_pill": 0,
        "min_stock": 100,
        "max_stock": 500,
        "reorder_level": 150,
        "rack_location": "Rack A-02",
        "purchase_price": 18.0,
        "selling_price": 20.0,
        "gst": 12.0,
        "stock": 90
    },
    {
        "medicine_name": "Amoxicillin 500mg",
        "generic_name": "Amoxicillin Trihydrate",
        "brand": "Mox 500",
        "manufacturer": "Sun Pharma Ltd",
        "strength": "500 mg",
        "dosage_form": "Capsule",
        "category": "Schedule H",
        "schedule_type": "Schedule H",
        "prescription_required": 1,
        "controlled_drug": 0,
        "sleeping_pill": 0,
        "min_stock": 50,
        "max_stock": 200,
        "reorder_level": 80,
        "rack_location": "Rack B-04",
        "purchase_price": 80.0,
        "selling_price": 95.0,
        "gst": 12.0,
        "stock": 35
    },
    {
        "medicine_name": "Alprazolam 0.5mg",
        "generic_name": "Alprazolam",
        "brand": "Xanax 0.5",
        "manufacturer": "Pfizer India",
        "strength": "0.5 mg",
        "dosage_form": "Tablet",
        "category": "Sleeping Pill",
        "schedule_type": "Schedule H1",
        "prescription_required": 1,
        "controlled_drug": 0,
        "sleeping_pill": 1,
        "min_stock": 20,
        "max_stock": 100,
        "reorder_level": 30,
        "rack_location": "Rack C-01 (Locked)",
        "purchase_price": 12.0,
        "selling_price": 15.0,
        "gst": 12.0,
        "stock": 58
    },
    {
        "medicine_name": "Fentanyl 50mcg",
        "generic_name": "Fentanyl Citrate",
        "brand": "Duragesic Patch",
        "manufacturer": "Janssen Pharma",
        "strength": "50 mcg/hr",
        "dosage_form": "Other",
        "category": "Controlled Drug",
        "schedule_type": "Schedule H1",
        "prescription_required": 1,
        "controlled_drug": 1,
        "sleeping_pill": 0,
        "min_stock": 10,
        "max_stock": 50,
        "reorder_level": 15,
        "rack_location": "Double-Locked Safe-01",
        "purchase_price": 250.0,
        "selling_price": 300.0,
        "gst": 18.0,
        "stock": 23
    },
    {
        "medicine_name": "Cetirizine 10mg",
        "generic_name": "Cetirizine Dihydrochloride",
        "brand": "Okacet",
        "manufacturer": "Cipla Ltd",
        "strength": "10 mg",
        "dosage_form": "Tablet",
        "category": "OTC",
        "schedule_type": "None",
        "prescription_required": 0,
        "controlled_drug": 0,
        "sleeping_pill": 0,
        "min_stock": 40,
        "max_stock": 200,
        "reorder_level": 60,
        "rack_location": "Rack A-01",
        "purchase_price": 10.0,
        "selling_price": 15.0,
        "gst": 12.0,
        "stock": 180
    },
    {
        "medicine_name": "Zolpidem 10mg",
        "generic_name": "Zolpidem Tartrate",
        "brand": "Stilnox",
        "manufacturer": "Sanofi India",
        "strength": "10 mg",
        "dosage_form": "Tablet",
        "category": "Sleeping Pill",
        "schedule_type": "Schedule H",
        "prescription_required": 1,
        "controlled_drug": 0,
        "sleeping_pill": 1,
        "min_stock": 15,
        "max_stock": 80,
        "reorder_level": 25,
        "rack_location": "Rack C-02 (Locked)",
        "purchase_price": 40.0,
        "selling_price": 50.0,
        "gst": 12.0,
        "stock": 0
    }
]

for med in medicines:
    try:
        make_request("POST", "/api/resource/Hospital Medicine", data=med)
        print(f"Added sample Medicine: {med['medicine_name']}")
    except Exception as e:
        print(f"Failed to add medicine {med['medicine_name']}: {e}")

# 5. Insert Seed Batches
batches = [
    # Paracetamol
    {"batch_number": "PM-EXPIRED", "medicine": "Paracetamol 650mg", "mfg_date": "2024-01-01", "exp_date": "2026-01-01", "current_stock": 0, "purchase_price": 18.0, "selling_price": 20.0, "supplier": "ABC Pharma", "rack_location": "Rack A-02"},
    {"batch_number": "PM-EXP30D", "medicine": "Paracetamol 650mg", "mfg_date": "2024-08-01", "exp_date": "2026-08-15", "current_stock": 10, "purchase_price": 18.0, "selling_price": 20.0, "supplier": "ABC Pharma", "rack_location": "Rack A-02"},
    {"batch_number": "PM-EXP6M", "medicine": "Paracetamol 650mg", "mfg_date": "2024-12-01", "exp_date": "2026-11-30", "current_stock": 20, "purchase_price": 18.0, "selling_price": 20.0, "supplier": "ABC Pharma", "rack_location": "Rack A-02"},
    {"batch_number": "PM-STABLE", "medicine": "Paracetamol 650mg", "mfg_date": "2025-05-01", "exp_date": "2027-05-01", "current_stock": 60, "purchase_price": 18.0, "selling_price": 20.0, "supplier": "ABC Pharma", "rack_location": "Rack A-02"},
    
    # Amoxicillin
    {"batch_number": "AM-EXP30D", "medicine": "Amoxicillin 500mg", "mfg_date": "2024-08-01", "exp_date": "2026-08-20", "current_stock": 15, "purchase_price": 80.0, "selling_price": 95.0, "supplier": "XYZ Distributors", "rack_location": "Rack B-04"},
    {"batch_number": "AM-EXP3M", "medicine": "Amoxicillin 500mg", "mfg_date": "2024-10-01", "exp_date": "2026-10-15", "current_stock": 20, "purchase_price": 80.0, "selling_price": 95.0, "supplier": "XYZ Distributors", "rack_location": "Rack B-04"},
    
    # Alprazolam
    {"batch_number": "AL-EXP3M", "medicine": "Alprazolam 0.5mg", "mfg_date": "2024-11-01", "exp_date": "2026-10-01", "current_stock": 8, "purchase_price": 12.0, "selling_price": 15.0, "supplier": "Pharma Plus", "rack_location": "Rack C-01 (Locked)"},
    {"batch_number": "AL-STABLE", "medicine": "Alprazolam 0.5mg", "mfg_date": "2025-01-01", "exp_date": "2027-12-31", "current_stock": 50, "purchase_price": 12.0, "selling_price": 15.0, "supplier": "Pharma Plus", "rack_location": "Rack C-01 (Locked)"},
    
    # Fentanyl
    {"batch_number": "FT-EXP6M", "medicine": "Fentanyl 50mcg", "mfg_date": "2025-01-01", "exp_date": "2026-12-31", "current_stock": 3, "purchase_price": 250.0, "selling_price": 300.0, "supplier": "Special Drugs Ltd", "rack_location": "Double-Locked Safe-01"},
    {"batch_number": "FT-STABLE", "medicine": "Fentanyl 50mcg", "mfg_date": "2025-04-01", "exp_date": "2027-10-31", "current_stock": 20, "purchase_price": 250.0, "selling_price": 300.0, "supplier": "Special Drugs Ltd", "rack_location": "Double-Locked Safe-01"},

    # Cetirizine
    {"batch_number": "CT-STABLE", "medicine": "Cetirizine 10mg", "mfg_date": "2025-01-01", "exp_date": "2027-01-01", "current_stock": 180, "purchase_price": 10.0, "selling_price": 15.0, "supplier": "City Meds", "rack_location": "Rack A-01"}
]

for b in batches:
    try:
        make_request("POST", "/api/resource/Hospital Medicine Batch", data=b)
        print(f"Added sample Batch: {b['batch_number']}")
    except Exception as e:
        print(f"Failed to add batch {b['batch_number']}: {e}")

# 6. Insert Seed Drug Register Entries (Compliance Logs)
register_entries = [
    {
        "patient_name": "Surya Prakash",
        "patient_id": "9876543210",
        "doctor": "Dr. Rajesh",
        "medicine": "Paracetamol 650mg",
        "drug_category": "Regular Medicine",
        "batch_number": "PM-EXP30D",
        "quantity": 10,
        "invoice_number": "INV-PH-10023",
        "dispensing_date": "2026-07-27 10:15:00",
        "pharmacist": "Rahul Sharma, RPh"
    },
    {
        "patient_name": "Yokesh Raj",
        "patient_id": "9876501234",
        "doctor": "Dr. Priya",
        "medicine": "Alprazolam 0.5mg",
        "drug_category": "Sleeping Pill",
        "batch_number": "AL-EXP3M",
        "quantity": 5,
        "invoice_number": "INV-PH-10024",
        "dispensing_date": "2026-07-28 08:30:00",
        "pharmacist": "Rahul Sharma, RPh"
    },
    {
        "patient_name": "Surya Prakash",
        "patient_id": "9876543210",
        "doctor": "Dr. Vignesh",
        "medicine": "Amoxicillin 500mg",
        "drug_category": "Schedule H",
        "batch_number": "AM-EXP30D",
        "quantity": 15,
        "invoice_number": "INV-PH-10025",
        "dispensing_date": "2026-07-28 09:45:00",
        "pharmacist": "Rahul Sharma, RPh"
    }
]

for r in register_entries:
    try:
        make_request("POST", "/api/resource/Hospital Drug Register", data=r)
        print(f"Added sample Drug Register log for: {r['patient_name']}")
    except Exception as e:
        print(f"Failed to add register entry: {e}")

# 7. Seed sample Purchase Order
po_sample = {
    "supplier": "ABC Pharma",
    "date": "2026-07-26",
    "status": "Submitted",
    "items": [
        {"medicine": "Paracetamol 650mg", "quantity": 300, "purchase_price": 18.0, "amount": 5400.0}
    ],
    "total_amount": 5400.0
}
try:
    make_request("POST", "/api/resource/Hospital Purchase Order", data=po_sample)
    print("Added sample Purchase Order.")
except Exception as e:
    print(f"Failed to add PO: {e}")

print("\nAll custom Compliance DocTypes and Seed Data configured successfully on Frappe Cloud!")
