import json
import frappe
from typing import Any, Optional
from ..logging.logger import RAGLogger

class CacheManager:
    """
    Enterprise Cache Wrapper for the AI Assistant.
    Provides a standardized interface over Frappe's Redis cache to store
    frequently accessed data (like generated embeddings or LLM responses)
    to minimize API costs and latency.
    """

    PREFIX = "rag_ai_"

    @classmethod
    def get(cls, key: str) -> Optional[Any]:
        """
        Retrieves a value from the cache.
        Returns None if the key does not exist.
        """
        full_key = f"{cls.PREFIX}{key}"
        try:
            cached_data = frappe.cache().get_value(full_key)
            if cached_data:
                return json.loads(cached_data)
            return None
        except Exception as e:
            RAGLogger.error(f"Cache GET failed for key {full_key}: {str(e)}", exc_info=True)
            return None

    @classmethod
    def set(cls, key: str, value: Any, expires_in_sec: int = 3600):
        """
        Stores a value in the cache with an expiration time.
        Defaults to 1 hour (3600 seconds).
        """
        full_key = f"{cls.PREFIX}{key}"
        try:
            # We serialize to JSON to ensure complex types (like lists of floats for embeddings)
            # are safely stored and retrieved as strings in Redis.
            frappe.cache().set_value(full_key, json.dumps(value), expires_in_sec=expires_in_sec)
        except Exception as e:
            RAGLogger.error(f"Cache SET failed for key {full_key}: {str(e)}", exc_info=True)

    @classmethod
    def delete(cls, key: str):
        """
        Removes a specific key from the cache.
        """
        full_key = f"{cls.PREFIX}{key}"
        try:
            frappe.cache().delete_value(full_key)
        except Exception as e:
            RAGLogger.error(f"Cache DELETE failed for key {full_key}: {str(e)}", exc_info=True)

    @classmethod
    def generate_embedding_cache_key(cls, text: str, model_name: str) -> str:
        """
        Helper method to generate a deterministic cache key for text embeddings.
        Using a hash of the text prevents the cache key from exceeding Redis key length limits.
        """
        import hashlib
        text_hash = hashlib.sha256(text.encode('utf-8')).hexdigest()
        return f"embed_{model_name}_{text_hash}"
