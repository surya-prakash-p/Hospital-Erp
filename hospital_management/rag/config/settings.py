import os
import frappe
from enum import Enum

class LLMProvider(str, Enum):
    OPENAI = "openai"
    OLLAMA = "ollama"
    GEMINI = "gemini"
    CLAUDE = "claude"

class VectorStoreProvider(str, Enum):
    CHROMA = "chroma"
    QDRANT = "qdrant"
    PINECONE = "pinecone"

class RAGConfig:
    """
    RAG Configuration Manager.
    This class handles retrieving configuration settings from Frappe's site_config.json,
    environment variables, or Frappe UI Settings.
    """
    
    @staticmethod
    def get_llm_provider() -> str:
        """Returns the active LLM provider. Defaults to OPENAI."""
        return frappe.conf.get("rag_llm_provider", LLMProvider.OPENAI.value)

    @staticmethod
    def get_vector_store_provider() -> str:
        """Returns the active Vector Store provider. Defaults to CHROMA."""
        return frappe.conf.get("rag_vector_store_provider", VectorStoreProvider.CHROMA.value)

    @staticmethod
    def get_openai_api_key() -> str:
        """Retrieves the OpenAI API Key securely."""
        key = frappe.conf.get("openai_api_key") or os.environ.get("OPENAI_API_KEY")
        if not key:
            frappe.log_error("OpenAI API Key is missing in site_config or env.", "RAG Configuration")
        return key
    
    @staticmethod
    def get_ollama_base_url() -> str:
        """Retrieves Ollama local server URL."""
        return frappe.conf.get("ollama_base_url", "http://localhost:11434")

    @staticmethod
    def get_embedding_model_name() -> str:
        """The SentenceTransformer model used for embeddings."""
        return frappe.conf.get("rag_embedding_model", "all-MiniLM-L6-v2")

    @staticmethod
    def get_chunk_size() -> int:
        """Maximum number of tokens/characters per chunk."""
        return frappe.conf.get("rag_chunk_size", 500)

    @staticmethod
    def get_chunk_overlap() -> int:
        """Number of overlapping tokens/characters between consecutive chunks."""
        return frappe.conf.get("rag_chunk_overlap", 50)

    @staticmethod
    def get_similarity_threshold() -> float:
        """Minimum cosine similarity score to consider a retrieved document relevant."""
        return float(frappe.conf.get("rag_similarity_threshold", 0.75))

    @staticmethod
    def get_top_k() -> int:
        """Number of documents to retrieve before reranking."""
        return int(frappe.conf.get("rag_top_k", 20))
