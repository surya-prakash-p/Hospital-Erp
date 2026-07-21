import re
from typing import Dict, Any, List

class CopilotIntentParser:
    """
    Intelligent Entity Extraction & Intent Parser for Thangam Hospital ERP.
    
    Why it exists:
    -------------
    Replaces manual patient/module selection. It automatically analyzes natural language
    queries (e.g. "Ravi", "Saranya", "Invoice HOSP-WALK-2026-00021", "Dr. Rajesh", "Paracetamol stock", "Book Dr Priya tomorrow")
    and extracts intent (SEARCH, ACTION, QUESTION, DASHBOARD) and structured entity parameters.

    What problem it solves:
    -----------------------
    Eliminates manual dropdown filtering. Users can type anything in one search box or press Ctrl+K,
    and the AI Copilot immediately knows whether to render a Patient Dashboard, Doctor Card, Medicine Card,
    Invoice Breakdown, or execute an ERP action.

    Communication:
    --------------
    - Parses input query strings for the RAG Engine (`rag_engine.py`).
    - Feeds extracted parameters into `action_executor.py` and Frappe DocType query handlers.
    """

    @staticmethod
    def parse_query(user_query: str) -> Dict[str, Any]:
        """
        Analyzes the user query and returns classified intent and extracted entities.
        
        Functions & Logic:
        -----------------
        1. Entity Recognition (Phone Numbers, Invoice IDs, Doctor Names, Medicine Names, Patient Names).
        2. Intent Classification (patient_summary, action_booking, action_invoice, medicine_query, doctor_query, general_rag).
        """
        query = user_query.strip()
        q_lower = query.lower()

        entities = {
            "query": query,
            "patient_mobile": None,
            "patient_name": None,
            "invoice_id": None,
            "doctor_name": None,
            "medicine_name": None,
            "lab_test_name": None,
            "intent": "general_rag"
        }

        # 1. Detect Mobile Number (10 digits)
        mobile_match = re.search(r'\b[6-9]\d{9}\b', query)
        if mobile_match:
            entities["patient_mobile"] = mobile_match.group(0)

        # 2. Detect Invoice / Walkin ID (e.g., HOSP-WALK-2026-00021 or INV-00023)
        invoice_match = re.search(r'\b(HOSP-WALK-[A-Za-z0-9-]+|INV-\d+|WALK-\d+)\b', query, re.IGNORECASE)
        if invoice_match:
            entities["invoice_id"] = invoice_match.group(0).upper()
            entities["intent"] = "invoice_summary"

        # 3. Detect Doctor Names
        for doc in ["dr. rajesh", "dr rajesh", "rajesh", "dr. priya", "dr priya", "priya", "dr. vignesh", "dr vignesh", "vignesh"]:
            if doc in q_lower:
                entities["doctor_name"] = "Dr. Rajesh" if "rajesh" in doc else ("Dr. Priya" if "priya" in doc else "Dr. Vignesh")
                break

        # 4. Detect Medicines
        for med in ["paracetamol", "pantocid", "amoxicillin", "cetirizine"]:
            if med in q_lower:
                entities["medicine_name"] = med.capitalize()
                entities["intent"] = "medicine_query"
                break

        # 5. Detect Action Request (Booking, Invoice Creation, Navigation)
        if any(action in q_lower for action in ["book", "appointment", "schedule", "reserve"]):
            entities["intent"] = "action_book_appointment"
        elif any(action in q_lower for action in ["generate invoice", "create bill", "settle bill"]):
            entities["intent"] = "action_create_invoice"
        elif any(action in q_lower for action in ["open patient", "view patient", "show patient"]):
            entities["intent"] = "patient_summary"

        # 6. Default to Patient Search if a name or mobile is queried without action
        if not entities["intent"] or entities["intent"] == "general_rag":
            if entities["patient_mobile"] or len(query.split()) <= 2:
                # Direct name or mobile search like "Ravi", "Saranya", "8545858472"
                if not any(keyword in q_lower for keyword in ["what", "how", "why", "where", "list", "show", "help"]):
                    entities["patient_name"] = query
                    entities["intent"] = "patient_summary"

        return entities
