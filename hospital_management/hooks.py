app_name = "hospital_management"
app_title = "Hospital ERP"
app_publisher = "Thangam Hospital"
app_description = "Enterprise Hospital ERP & RAG AI Copilot"
app_email = "admin@thangam.org"
app_license = "MIT"

# Document Events for Real-Time Vector Indexing
doc_events = {
    "Hospital Patient Walk In": {
        "on_update": "hospital_management.rag.sync.sync_doc_to_vector_store",
        "on_submit": "hospital_management.rag.sync.sync_doc_to_vector_store",
        "on_trash": "hospital_management.rag.sync.remove_doc_from_vector_store"
    },
    "Hospital Patient": {
        "on_update": "hospital_management.rag.sync.sync_doc_to_vector_store",
        "on_trash": "hospital_management.rag.sync.remove_doc_from_vector_store"
    },
    "Hospital Medicine": {
        "on_update": "hospital_management.rag.sync.sync_doc_to_vector_store",
        "on_trash": "hospital_management.rag.sync.remove_doc_from_vector_store"
    }
}
