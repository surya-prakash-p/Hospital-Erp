import frappe
from frappe import _
from .pipeline.rag_engine import RAGEngine
from .logging.logger import RAGLogger

# Global RAG Engine Instance
rag_engine = RAGEngine()

@frappe.whitelist(allow_guest=True)
def query(query_str: str, context: str = ""):
    """
    Frappe REST API Endpoint to ask queries to the RAG AI Assistant.
    URL: /api/method/hospital_management.rag.api.query
    """
    if not query_str:
        frappe.throw(_("Query string is required."))

    try:
        result = rag_engine.query(user_query=query_str, extra_context=context)
        return {
            "status": "success",
            "answer": result["answer"],
            "sources": result["sources"],
            "from_cache": result["from_cache"]
        }
    except Exception as e:
        RAGLogger.error(f"API query processing failed: {str(e)}", exc_info=True)
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist(allow_guest=True)
def index_document(document_id: str, text: str, metadata: str = "{}"):
    """
    Indexes a document chunk into the vector database.
    URL: /api/method/hospital_management.rag.api.index_document
    """
    try:
        import json
        meta_dict = json.loads(metadata) if isinstance(metadata, str) else metadata
        rag_engine.vector_store.add_documents([{
            "id": document_id,
            "text": text,
            "metadata": meta_dict
        }])
        return {"status": "success", "message": f"Document {document_id} indexed."}
    except Exception as e:
        RAGLogger.error(f"Document indexing failed: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}

@frappe.whitelist(allow_guest=True)
def get_status():
    """
    Returns RAG system status and active configuration.
    """
    from .config.settings import RAGConfig
    return {
        "status": "online",
        "llm_provider": RAGConfig.get_llm_provider(),
        "vector_store_provider": RAGConfig.get_vector_store_provider(),
        "embedding_model": RAGConfig.get_embedding_model_name()
    }
