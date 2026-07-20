from typing import Generator
import frappe
from .base import BaseLLM
from ..config.settings import RAGConfig
from ..logging.logger import RAGLogger

class OpenAIProvider(BaseLLM):
    """
    OpenAI Implementation of the LLM Provider.
    Handles communication with OpenAI APIs (like GPT-4o) using the official SDK.
    """

    def __init__(self):
        try:
            from openai import OpenAI
            api_key = RAGConfig.get_openai_api_key()
            if not api_key:
                raise ValueError("OpenAI API Key is missing.")
            self.client = OpenAI(api_key=api_key)
            self.model = frappe.conf.get("rag_openai_model", "gpt-4o-mini")
        except ImportError:
            RAGLogger.error("OpenAI library is not installed. Please run: pip install openai")
            raise
        except Exception as e:
            RAGLogger.error(f"Failed to initialize OpenAIProvider: {str(e)}", exc_info=True)
            raise

    def generate(self, prompt: str, system_prompt: str = "") -> str:
        """Synchronous generation."""
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            RAGLogger.debug(f"Calling OpenAI API ({self.model}) with prompt length: {len(prompt)}")

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.0, # We want factual, non-hallucinated answers from the ERP data
                max_tokens=1000
            )
            return response.choices[0].message.content
            
        except Exception as e:
            RAGLogger.error(f"OpenAI generation failed: {str(e)}", exc_info=True)
            raise

    def generate_stream(self, prompt: str, system_prompt: str = "") -> Generator[str, None, None]:
        """Streaming generation for typing animation in the frontend."""
        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=0.0,
                max_tokens=1000,
                stream=True
            )

            for chunk in response:
                content = chunk.choices[0].delta.content
                if content:
                    yield content
                    
        except Exception as e:
            RAGLogger.error(f"OpenAI streaming failed: {str(e)}", exc_info=True)
            raise

    def get_provider_name(self) -> str:
        return f"OpenAI ({self.model})"
