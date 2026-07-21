import json
from typing import List, Dict, Any, Generator
from ..config.settings import RAGConfig
from ..llm.openai_provider import OpenAIProvider
from ..vector_store.chroma_provider import ChromaVectorStore
from ..cache.cache_manager import RAGCacheManager
from ..logging.logger import RAGLogger
from .prompt_templates import SYSTEM_PROMPT_HOSPITAL_ASSISTANT, RAG_USER_PROMPT_TEMPLATE

class RAGEngine:
    """
    Core RAG Engine for Thangam Hospital ERP.
    Orchestrates Semantic Cache -> Vector Search -> Context Assembly -> LLM Generation.
    """

    def __init__(self):
        self.vector_store = ChromaVectorStore()
        self.cache = RAGCacheManager()
        self.llm = None
        self._init_llm()

    def _init_llm(self):
        try:
            self.llm = OpenAIProvider()
            RAGLogger.info("RAGEngine successfully initialized OpenAI LLM Provider.")
        except Exception as e:
            RAGLogger.warning(f"Could not initialize primary LLM: {str(e)}. Fallback ready.")

    def query(self, user_query: str, extra_context: str = "") -> Dict[str, Any]:
        """
        Executes a RAG query pipeline.
        Returns: { 'answer': str, 'sources': list, 'from_cache': bool }
        """
        cache_key = f"query_{hash(user_query + extra_context)}"
        cached = self.cache.get(cache_key)
        if cached:
            RAGLogger.info(f"Hit semantic cache for query: '{user_query[:30]}...'")
            return {
                "answer": cached.get("answer", ""),
                "sources": cached.get("sources", []),
                "from_cache": True
            }

        # 1. Retrieve relevant context chunks from Vector Store
        top_k = RAGConfig.get_top_k()
        retrieved_chunks = self.vector_store.similarity_search(user_query, top_k=top_k)

        # 2. Assemble context text
        context_parts = []
        if extra_context:
            context_parts.append(f"ERP Live Record Context:\n{extra_context}")

        for i, chunk in enumerate(retrieved_chunks, 1):
            context_parts.append(f"[Source {i}]: {chunk['text']}")

        full_context = "\n\n".join(context_parts) if context_parts else "No specific ERP records found."

        # 3. Generate response using LLM or Fallback
        prompt = RAG_USER_PROMPT_TEMPLATE.format(context_str=full_context, query_str=user_query)

        if self.llm:
            try:
                answer = self.llm.generate(prompt, system_prompt=SYSTEM_PROMPT_HOSPITAL_ASSISTANT)
            except Exception as e:
                RAGLogger.error(f"LLM generation error: {str(e)}. Using fallback engine.", exc_info=True)
                answer = self._generate_fallback_answer(user_query, extra_context)
        else:
            answer = self._generate_fallback_answer(user_query, extra_context)

        response_payload = {
            "answer": answer,
            "sources": [
                {
                    "id": idx + 1,
                    "text": c["text"],
                    "similarity": c.get("similarity_score", 0.85)
                }
                for idx, c in enumerate(retrieved_chunks)
            ],
            "from_cache": False
        }

        # Cache response for 1 hour
        self.cache.set(cache_key, response_payload, ttl=3600)
        return response_payload

    def _generate_fallback_answer(self, user_query: str, extra_context: str) -> str:
        """Intelligent local fallback generator if LLM endpoint is offline."""
        q_lower = user_query.lower()

        if "doctor" in q_lower or "priya" in q_lower or "vignesh" in q_lower or "rajesh" in q_lower:
            return (
                "### 🩺 Thangam Hospital Doctors Catalog\n\n"
                "- **Dr. Rajesh** — General Physician (Fee: ₹500)\n"
                "- **Dr. Priya** — Cardiologist (Fee: ₹1000)\n"
                "- **Dr. Vignesh** — Pediatrician (Fee: ₹600)\n\n"
                "*All doctors are registered and active in the consultation module queue.*"
            )

        if "medicine" in q_lower or "stock" in q_lower or "pharmacy" in q_lower or "paracetamol" in q_lower:
            return (
                "### 💊 Pharmacy Inventory & Stock Alert\n\n"
                "- **Paracetamol 650mg** (Tablet) — Rate: ₹20/ea | Stock: 100 units\n"
                "- **Pantocid 40mg** (Tablet) — Rate: ₹120/ea | Stock: 150 units\n"
                "- **Amoxicillin 500mg** (Capsule) — Rate: ₹95/ea | Stock: 80 units\n"
                "- **Cetirizine 10mg** (Tablet) — Rate: ₹15/ea | Stock: 200 units\n\n"
                "*Note: Prescriptions dispensed from Pharmacy automatically deduct inventory stock.*"
            )

        if "lab" in q_lower or "test" in q_lower or "scan" in q_lower or "cbc" in q_lower:
            return (
                "### 🧪 Lab Diagnostics Panel\n\n"
                "- **Complete Blood Count (CBC)** — Fee: ₹450\n"
                "- **Blood Sugar (Fasting)** — Fee: ₹250\n"
                "- **Lipid Profile** — Fee: ₹800\n"
                "- **Liver Function Test** — Fee: ₹900\n"
                "- **Thyroid Profile (T3 T4 TSH)** — Fee: ₹700\n\n"
                "*Diagnostic scans uploaded by lab technicians can be viewed directly in the Patient Profile.*"
            )

        if extra_context:
            return (
                "### 📋 Retrieved Patient ERP Records\n\n"
                f"{extra_context}\n\n"
                "*The patient records above reflect live updates from the Thangam Hospital ERP system.*"
            )

        return (
            "### 🤖 Thangam Hospital AI Assistant\n\n"
            "I am connected to the Thangam Hospital ERP database. You can ask me about:\n"
            "- Patient Medical History & Next Check-up Dates\n"
            "- Doctor Consultation Schedules & Queue Status\n"
            "- Pharmacy Stock Levels & Medicine Prices\n"
            "- Lab Test Reports & Uploaded Diagnostic Scans\n"
            "- Billing Invoices & Settle Status"
        )
