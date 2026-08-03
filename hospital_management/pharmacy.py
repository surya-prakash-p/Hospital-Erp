import frappe
import json
import base64
import requests

# Set your Gemini API key here or in site_config.json
# frappe.conf.get("gemini_api_key")
GEMINI_API_KEY = frappe.conf.get("gemini_api_key", "")

@frappe.whitelist(allow_guest=True)
def ai_import_invoice():
    if not frappe.request.files:
        frappe.throw("No file uploaded")
    
    file = frappe.request.files.get("file")
    if not file:
        frappe.throw("File key must be 'file'")
        
    filename = file.filename
    file_content = file.stream.read()
    
    # 1. Direct Parsing for CSV
    if filename.endswith(".csv"):
        import csv
        from io import StringIO
        decoded_content = file_content.decode("utf-8-sig")
        reader = csv.reader(StringIO(decoded_content))
        rows = list(reader)
        
        prompt = """
        You are a medical inventory assistant. Parse the following CSV data from a supplier invoice.
        Convert it into this JSON structure:
        {
          "supplier": "Supplier Name",
          "invoice_number": "Invoice Number (or generating a temp one)",
          "invoice_date": "YYYY-MM-DD",
          "items": [
            {
              "medicine": "Medicine Name",
              "batch": "Batch number",
              "expiry": "YYYY-MM (or YYYY-MM-DD)",
              "qty": int,
              "rate": float,
              "mrp": float,
              "gst": float
            }
          ]
        }
        CSV Data:
        """ + decoded_content[:10000] # Limit to avoid token overflow
        
        extracted_data = call_gemini_text(prompt)
        
    # 2. AI Parsing for Image/PDF
    else:
        mime_type = "image/jpeg"
        if filename.endswith(".png"): mime_type = "image/png"
        elif filename.endswith(".pdf"): mime_type = "application/pdf"
            
        base64_file = base64.b64encode(file_content).decode("utf-8")
        extracted_data = call_gemini_vision(base64_file, mime_type)
        
    if not extracted_data:
        frappe.throw("Failed to extract data from the invoice.")
        
    try:
        json_data = json.loads(extracted_data)
    except Exception as e:
        frappe.throw(f"Invalid JSON returned from AI: {str(e)}")
        
    # 3. Match Medicines with Frappe DB
    for item in json_data.get("items", []):
        med_name = item.get("medicine")
        if med_name:
            # Try exact match
            exists = frappe.db.exists("Hospital Medicine", {"medicine_name": med_name})
            if not exists:
                # Try like search
                similar = frappe.get_all("Hospital Medicine", filters={"medicine_name": ["like", f"%{med_name[:5]}%"]}, limit=3, pluck="medicine_name")
                item["status"] = "⚠ Medicine Not Found"
                item["suggestions"] = similar
                item["matched_medicine"] = ""
            else:
                item["status"] = "✔ Matched"
                item["matched_medicine"] = exists
        else:
            item["status"] = "⚠ Missing Name"
            
    return json_data

def call_gemini_text(prompt):
    if not GEMINI_API_KEY:
        frappe.throw("Gemini API key not configured in site_config.json as gemini_api_key")
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "response_mime_type": "application/json"
        }
    }
    res = requests.post(url, json=payload)
    if res.status_code == 200:
        return res.json()["candidates"][0]["content"]["parts"][0]["text"]
    return None

def call_gemini_vision(base64_data, mime_type):
    if not GEMINI_API_KEY:
        frappe.throw("Gemini API key not configured")
        
    prompt = """
    Extract invoice details and line items from this document into JSON:
    {
      "supplier": "Supplier Name",
      "invoice_number": "Invoice Number",
      "invoice_date": "YYYY-MM-DD",
      "items": [
        {
          "medicine": "Medicine Name (extract exactly as written)",
          "batch": "Batch number",
          "expiry": "YYYY-MM",
          "qty": int,
          "rate": float,
          "mrp": float,
          "gst": float
        }
      ]
    }
    """
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": base64_data
                    }
                }
            ]
        }],
        "generationConfig": {
            "response_mime_type": "application/json"
        }
    }
    res = requests.post(url, json=payload)
    if res.status_code == 200:
        try:
            return res.json()["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            return None
    else:
        frappe.throw(f"Gemini API Error: {res.text}")


@frappe.whitelist(allow_guest=True)
def confirm_invoice_import(invoice_data):
    if isinstance(invoice_data, str):
        invoice_data = json.loads(invoice_data)
        
    supplier = invoice_data.get("supplier", "Unknown Supplier")
    invoice_number = invoice_data.get("invoice_number", f"INV-{frappe.utils.now_datetime().strftime('%Y%m%d%H%M%S')}")
    invoice_date = invoice_data.get("invoice_date", frappe.utils.today())
    items = invoice_data.get("items", [])
    
    # 1. Duplicate Check
    if frappe.db.exists("Hospital Purchase Invoice", {"invoice_number": invoice_number, "supplier": supplier}):
        frappe.throw(f"Invoice {invoice_number} from {supplier} already exists.")
        
    # 2. Create Purchase Invoice
    pi = frappe.new_doc("Hospital Purchase Invoice")
    pi.supplier = supplier
    pi.invoice_number = invoice_number
    pi.invoice_date = invoice_date
    pi.status = "Completed"
    
    for item in items:
        # Check if medicine needs to be created
        med_name = item.get("matched_medicine") or item.get("medicine")
        if not frappe.db.exists("Hospital Medicine", med_name):
            new_med = frappe.new_doc("Hospital Medicine")
            new_med.medicine_name = item.get("medicine")
            new_med.category = "General"
            new_med.stock = 0
            new_med.insert(ignore_permissions=True)
            med_name = new_med.name
            
        pi.append("items", {
            "medicine": med_name,
            "batch_number": item.get("batch"),
            "qty": item.get("qty", 0),
            "rate": item.get("rate", 0),
            "mrp": item.get("mrp", 0),
            "expiry_date": item.get("expiry") + "-01" if len(item.get("expiry","")) == 7 else item.get("expiry") # Handling YYYY-MM
        })
        
        # 3. Create/Update Batch and Stock
        # Update Medicine Stock
        frappe.db.set_value("Hospital Medicine", med_name, "stock", 
                            frappe.db.get_value("Hospital Medicine", med_name, "stock") + float(item.get("qty", 0)))
                            
        # Create Batch
        if item.get("batch"):
            if not frappe.db.exists("Hospital Medicine Batch", item.get("batch")):
                batch = frappe.new_doc("Hospital Medicine Batch")
                batch.batch_number = item.get("batch")
                batch.medicine = med_name
                batch.expiry_date = item.get("expiry") + "-01" if len(item.get("expiry","")) == 7 else item.get("expiry")
                batch.current_stock = item.get("qty", 0)
                batch.mrp = item.get("mrp", 0)
                batch.purchase_rate = item.get("rate", 0)
                batch.insert(ignore_permissions=True)
            else:
                current_batch_stock = frappe.db.get_value("Hospital Medicine Batch", item.get("batch"), "current_stock")
                frappe.db.set_value("Hospital Medicine Batch", item.get("batch"), "current_stock", current_batch_stock + float(item.get("qty", 0)))
                
        # 4. Stock Ledger Entry
        sl = frappe.new_doc("Hospital Stock Movement Log")
        sl.medicine = med_name
        sl.batch_number = item.get("batch")
        sl.movement_type = "Purchase In"
        sl.qty = item.get("qty", 0)
        sl.reference_name = invoice_number
        sl.insert(ignore_permissions=True)
        
    pi.insert(ignore_permissions=True)
    frappe.db.commit()
    
    return {"status": "success", "message": f"Successfully imported {invoice_number}"}
