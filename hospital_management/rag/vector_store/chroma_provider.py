import os
from typing import List, Dict, Any
import frappe
from .base import BaseVectorStore
from ..config.settings import RAGConfig
from ..logging.logger import RAGLogger

class ChromaVectorStore(BaseVectorStore):
    """
    ChromaDB Vector Store implementation.
    Manages local persistent vector storage for hospital records, clinical notes, and ERP documents.
    """

    def __init__(self, collection_name: str = "thangam_hospital_erp"):
        self.collection_name = collection_name
        self.client = None
        self.collection = None
        self._init_store()

    def _init_store(self):
        try:
            import chromadb
            db_path = os.path.join(frappe.get_site_path(), "private", "rag_chroma_db")
            os.makedirs(db_path, exist_ok=True)
            
            self.client = chromadb.PersistentClient(path=db_path)
            self.collection = self.client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            RAGLogger.info(f"Initialized ChromaDB vector store at: {db_path}")
        except ImportError:
            RAGLogger.warning("ChromaDB library not found. Running in fallback memory mode.")
        except Exception as e:
            RAGLogger.error(f"Failed to initialize ChromaDB: {str(e)}", exc_info=True)

    def add_documents(self, documents: List[Dict[str, Any]]) -> None:
        if not self.collection:
            RAGLogger.warning("ChromaDB collection is uninitialized. Skipping vector storage.")
            return

        ids = [doc["id"] for doc in documents]
        documents_text = [doc["text"] for doc in documents]
        metadatas = [doc.get("metadata", {}) for doc in documents]

        try:
            self.collection.add(
                ids=ids,
                documents=documents_text,
                metadatas=metadatas
            )
            RAGLogger.info(f"Successfully added {len(documents)} items to vector collection '{self.collection_name}'.")
        except Exception as e:
            RAGLogger.error(f"Failed to add documents to ChromaDB: {str(e)}", exc_info=True)

    def similarity_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        if not self.collection:
            return []

        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=top_k
            )

            matched_docs = []
            if results and "documents" in results and results["documents"]:
                docs = results["documents"][0]
                metas = results["metadatas"][0] if "metadatas" in results else [{}] * len(docs)
                distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)

                for doc_text, meta, dist in zip(docs, metas, distances):
                    similarity_score = round(1.0 - float(dist), 4) if dist is not None else 0.8
                    matched_docs.append({
                        "text": doc_text,
                        "metadata": meta,
                        "similarity_score": similarity_score
                    })

            return matched_docs
        except Exception as e:
            RAGLogger.error(f"Similarity search failed: {str(e)}", exc_info=True)
            return []
