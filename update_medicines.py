import urllib.request
import urllib.parse
import json

API_KEY = "802a7dc89ec8034"
API_SECRET = "edd331225cf6ca1"
SITE_URL = "https://thangamhospital.m.frappe.cloud"

headers = {
    "Authorization": f"token {API_KEY}:{API_SECRET}",
    "Content-Type": "application/json",
    "Accept": "application/json"
}

def make_request(method, endpoint, data=None):
    url = f"{SITE_URL}{urllib.parse.quote(endpoint)}"
    req = urllib.request.Request(url, headers=headers, method=method)
    if data:
        req.data = json.dumps(data).encode("utf-8")
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode("utf-8")
            return json.loads(res_data) if res_data else {}
    except Exception as e:
        print(f"Error {endpoint}: {e}")
        return None

updates = {
    "Paracetamol 650mg": {
        "generic_name": "Paracetamol",
        "brand": "Calpol 650",
        "manufacturer": "GSK India",
        "strength": "650 mg",
        "dosage_form": "Tablet",
        "category": "Regular Medicine",
        "prescription_required": 0,
        "controlled_drug": 0,
        "sleeping_pill": 0,
        "min_stock": 100,
        "max_stock": 500,
        "reorder_level": 150,
        "purchase_price": 18.0,
        "selling_price": 20.0,
        "gst": 12.0
    },
    "Amoxicillin 500mg": {
        "generic_name": "Amoxicillin Trihydrate",
        "brand": "Mox 500",
        "manufacturer": "Sun Pharma Ltd",
        "strength": "500 mg",
        "dosage_form": "Capsule",
        "category": "Schedule H",
        "prescription_required": 1,
        "controlled_drug": 0,
        "sleeping_pill": 0,
        "min_stock": 50,
        "max_stock": 200,
        "reorder_level": 80,
        "purchase_price": 80.0,
        "selling_price": 95.0,
        "gst": 12.0
    },
    "Cetirizine 10mg": {
        "generic_name": "Cetirizine Dihydrochloride",
        "brand": "Okacet",
        "manufacturer": "Cipla Ltd",
        "strength": "10 mg",
        "dosage_form": "Tablet",
        "category": "OTC",
        "prescription_required": 0,
        "controlled_drug": 0,
        "sleeping_pill": 0,
        "min_stock": 40,
        "max_stock": 200,
        "reorder_level": 60,
        "purchase_price": 10.0,
        "selling_price": 15.0,
        "gst": 12.0
    }
}

for med, data in updates.items():
    res = make_request("PUT", f"/api/resource/Hospital Medicine/{med}", data=data)
    if res:
        print(f"Successfully updated fields for {med}!")
    else:
        print(f"Failed to update {med}.")
