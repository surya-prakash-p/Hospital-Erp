import frappe
from frappe import _
from .copilot_engine import HospitalCopilotEngine
from ..logging.logger import RAGLogger

# Global Copilot Instance
copilot_engine = HospitalCopilotEngine()

@frappe.whitelist(allow_guest=True)
def chat(query: str, context: str = "", role: str = "admin"):
    """
    Frappe REST Endpoint for AI Copilot Chat & Intent Processing.
    URL: /api/method/hospital_management.rag.copilot.api.chat
    """
    if not query:
        frappe.throw(_("Query is required."))

    try:
        response = copilot_engine.process_copilot_request(query=query, context=context, role=role)
        return {
            "status": "success",
            "data": response
        }
    except Exception as e:
        RAGLogger.error(f"Copilot API chat failed: {str(e)}", exc_info=True)
        return {
            "status": "error",
            "message": str(e)
        }

@frappe.whitelist(allow_guest=True)
def execute_action(action_type: str, params: str = "{}"):
    """
    Frappe REST Endpoint to execute an ERP action.
    URL: /api/method/hospital_management.rag.copilot.api.execute_action
    """
    try:
        import json
        p_dict = json.loads(params) if isinstance(params, str) else params
        result = copilot_engine.action_executor.execute_action(action_type, p_dict)
        return {"status": "success", "data": result}
    except Exception as e:
        RAGLogger.error(f"Copilot API action failed: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}

@frappe.whitelist(allow_guest=True)
def get_dashboard_widgets(role: str = "admin"):
    """
    Frappe REST Endpoint to retrieve live AI Dashboard KPIs, Insights, and Proactive Notifications.
    URL: /api/method/hospital_management.rag.copilot.api.get_dashboard_widgets
    """
    try:
        widgets = copilot_engine.get_dashboard_widgets(role=role)
        return {"status": "success", "data": widgets}
    except Exception as e:
        RAGLogger.error(f"Copilot API widgets failed: {str(e)}", exc_info=True)
        return {"status": "error", "message": str(e)}
