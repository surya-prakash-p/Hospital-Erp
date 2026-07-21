from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseVectorStore(ABC):
    """
    Abstract Base Class for Vector Store providers (Chroma, Qdrant, Pinecone, etc.).
    """

    @abstractmethod
    def add_documents(self, documents: List[Dict[str, Any]]) -> None:
        """
        Ingests document chunks into the vector store.
        Each document dict should contain: 'id', 'text', 'metadata'.
        """
        pass

    @abstractmethod
    def similarity_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Performs semantic similarity search for a query.
        Returns a list of matching document chunks with similarity scores.
        """
        pass
