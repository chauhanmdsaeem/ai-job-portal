from flask import Blueprint, request, jsonify
from db import get_db
import logging

feedback_bp = Blueprint("feedback", __name__, url_prefix="/api")

@feedback_bp.route("/feedback", methods=["POST"])
def submit_feedback():
    data = request.get_json(silent=True) or {}
    
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    subject = data.get("subject", "").strip()
    message = data.get("message", "").strip()
    
    if not all([name, email, subject, message]):
        return jsonify({"error": "All fields are required"}), 400
        
    db = get_db()
    try:
        db.execute(
            """INSERT INTO feedback (name, email, subject, message) 
               VALUES (%s, %s, %s, %s)""",
            (name, email, subject, message)
        )
        db.commit()
        return jsonify({"success": True, "message": "Feedback submitted successfully."})
    except Exception as e:
        logging.error(f"Failed to submit feedback: {e}")
        return jsonify({"error": "Internal server error"}), 500
