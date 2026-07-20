from abc import ABC, abstractmethod
from typing import List, Dict, Any, Generator

class BaseLLM(ABC):
    """
    Abstract Base Class for all LLM Providers.
    Enforces the Provider Pattern so the RAG pipeline is entirely decoupled
    from any specific AI vendor (OpenAI, Ollama, Gemini, etc.).
    """

    @abstractmethod
    def generate(self, prompt: str, system_prompt: str = "") -> str:
        """
        Synchronously generates a response from the LLM.
        
        :param prompt: The user query + context.
        :param system_prompt: Optional instructions for the AI's persona.
        :return: The generated text string.
        """
        pass

    @abstractmethod
    def generate_stream(self, prompt: str, system_prompt: str = "") -> Generator[str, None, None]:
        """
        Generates a streaming response, yielding chunks of text as they arrive.
        Critical for the ChatGPT-like frontend experience.
        
        :param prompt: The user query + context.
        :param system_prompt: Optional instructions for the AI's persona.
        :return: A generator yielding string chunks.
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Returns the name of the active provider for logging purposes."""
        pass
