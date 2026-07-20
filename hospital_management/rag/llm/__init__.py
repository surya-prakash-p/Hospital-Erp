from .base import BaseLLM
from .openai_provider import OpenAIProvider
from ..config.settings import RAGConfig, LLMProvider

def get_llm() -> BaseLLM:
    """
    LLM Factory Method.
    Reads the configuration and returns the appropriate Provider instance.
    This ensures that the rest of the application is completely unaware of
    which LLM is being used (OpenAI, Ollama, etc.).
    """
    provider_name = RAGConfig.get_llm_provider()
    
    if provider_name == LLMProvider.OPENAI.value:
        return OpenAIProvider()
    elif provider_name == LLMProvider.OLLAMA.value:
        # We will implement OllamaProvider later
        raise NotImplementedError("OllamaProvider is not yet implemented.")
    else:
        raise ValueError(f"Unsupported LLM Provider: {provider_name}")

__all__ = ["BaseLLM", "get_llm"]
