import os
import logging
from logging.handlers import RotatingFileHandler
import frappe

class RAGLogger:
    """
    Enterprise Logger for the AI Assistant.
    Provides structured, rotating file logging specifically for AI operations
    (e.g., embeddings, LLM generation, vector search).
    """

    _logger = None

    @classmethod
    def get_logger(cls) -> logging.Logger:
        """
        Returns a configured logger instance. Implements Singleton pattern.
        Logs are stored in the Frappe site's logs directory.
        """
        if cls._logger is not None:
            return cls._logger

        cls._logger = logging.getLogger("rag_ai_assistant")
        cls._logger.setLevel(logging.DEBUG)

        # Get the current Frappe site path to store logs
        site_path = frappe.get_site_path()
        log_dir = os.path.join(site_path, "logs")
        
        # Ensure log directory exists
        if not os.path.exists(log_dir):
            os.makedirs(log_dir, exist_ok=True)

        log_file = os.path.join(log_dir, "rag_assistant.log")

        # Rotating file handler: Max 10 MB per file, keep 5 backups
        file_handler = RotatingFileHandler(
            log_file, maxBytes=10 * 1024 * 1024, backupCount=5
        )
        file_handler.setLevel(logging.DEBUG)

        # Standard enterprise log format
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [User: %(user)s] - %(message)s'
        )
        file_handler.setFormatter(formatter)

        cls._logger.addHandler(file_handler)
        return cls._logger

    @staticmethod
    def _get_context() -> dict:
        """Injects Frappe user context into the log record."""
        user = frappe.session.user if frappe.session else "System"
        return {"user": user}

    @classmethod
    def info(cls, message: str):
        cls.get_logger().info(message, extra=cls._get_context())

    @classmethod
    def debug(cls, message: str):
        cls.get_logger().debug(message, extra=cls._get_context())

    @classmethod
    def error(cls, message: str, exc_info=False):
        """
        Logs an error. Also forwards critical errors to Frappe's Error Log UI.
        """
        cls.get_logger().error(message, exc_info=exc_info, extra=cls._get_context())
        frappe.log_error(title="RAG AI Assistant Error", message=message)

    @classmethod
    def warning(cls, message: str):
        cls.get_logger().warning(message, extra=cls._get_context())
