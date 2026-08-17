from flask import Blueprint, request, jsonify
from utils.ai_analyzer import ai_site_assistant

chat_bp = Blueprint("chat", __name__, url_prefix="/api")

@chat_bp.route("/chat", methods=["POST"])
def chat():
    """Endpoint for the floating AI assistant widget."""
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    history = data.get("history", "")
    
    if not message:
        return jsonify({"error": "Message is required"}), 400
        
    result = ai_site_assistant(message, history)
    return jsonify(result)
