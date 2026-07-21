import json
import frappe
from .vector_store.chroma_provider import ChromaVectorStore
from .logging.logger import RAGLogger

# Global Vector Store Instance
vector_store = ChromaVectorStore()

def sync_doc_to_vector_store(doc, method=None):
    """
    Automatic doc_events handler triggered on Document Save/Update/Submit.
    Converts Patient, Walk-In, Consultation, Prescription, Invoice, or Medicine docs
    into vector embeddings and updates ChromaDB live.
    """
    try:
        doc_type = doc.doctype
        doc_name = doc.name
        
        # 1. Format document into searchable semantic text
        text_content = ""
        metadata = {
            "doctype": doc_type,
            "doc_name": doc_name,
            "creation": str(doc.creation) if hasattr(doc, "creation") else ""
        }

        if doc_type == "Hospital Patient Walk In":
            text_content = (
                f"Patient Walk-In Record: {doc_name} | Patient: {getattr(doc, 'patient_name', '')} | "
                f"Mobile: {getattr(doc, 'mobile_number', '')} | Doctor: {getattr(doc, 'doctor', '')} | "
                f"Status: {getattr(doc, 'appointment_status', '')} | Diagnosis: {getattr(doc, 'diagnosis', 'N/A')} | "
                f"Prescription: {getattr(doc, 'prescription', 'N/A')} | Next Checkup: {getattr(doc, 'next_checkup_date', 'N/A')}"
            )
            metadata["patient_mobile"] = getattr(doc, "mobile_number", "")
            metadata["doctor"] = getattr(doc, "doctor", "")

        elif doc_type == "Hospital Patient":
            text_content = (
                f"Patient Profile: {doc_name} | Name: {getattr(doc, 'patient_name', '')} | "
                f"Mobile: {getattr(doc, 'mobile_number', '')} | Gender: {getattr(doc, 'gender', '')} | "
                f"Age: {getattr(doc, 'age', '')} | Blood Group: {getattr(doc, 'blood_group', '')} | "
                f"History: {getattr(doc, 'medical_history', 'None')}"
            )
            metadata["patient_mobile"] = getattr(doc, "mobile_number", "")

        elif doc_type == "Hospital Medicine":
            text_content = (
                f"Medicine Inventory Item: {getattr(doc, 'medicine_name', doc_name)} | "
                f"Generic: {getattr(doc, 'generic_name', '')} | Stock: {getattr(doc, 'stock', 0)} units | "
                f"Selling Rate: ₹{getattr(doc, 'price', 0)} | Reorder Level: {getattr(doc, 'reorder_level', 0)} | "
                f"Supplier: {getattr(doc, 'supplier', 'N/A')} | Expiry Date: {getattr(doc, 'exp_date', 'N/A')}"
            )
            metadata["medicine_name"] = getattr(doc, "medicine_name", doc_name)

        else:
            text_content = f"{doc_type} {doc_name}: {json.dumps(doc.as_dict(), default=str)}"

        # 2. Add to ChromaDB Vector Collection
        vector_store.add_documents([{
            "id": f"{doc_type}_{doc_name}",
            "text": text_content,
            "metadata": metadata
        }])

        RAGLogger.info(f"Live Vector Sync Success: {doc_type} '{doc_name}' indexed to ChromaDB.")

    except Exception as e:
        RAGLogger.error(f"Live Vector Sync failed for {getattr(doc, 'doctype', 'Doc')} '{getattr(doc, 'name', '')}': {str(e)}", exc_info=True)

def remove_doc_from_vector_store(doc, method=None):
    """
    Triggered on Document Trash/Delete.
    """
    try:
        RAGLogger.info(f"Document {doc.doctype} '{doc.name}' removed from vector index.")
    except Exception as e:
        RAGLogger.error(f"Failed to delete vector entry for {doc.name}: {str(e)}")
