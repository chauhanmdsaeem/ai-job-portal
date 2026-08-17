from flask import Blueprint, request, jsonify, session
from db import get_db
from utils.auth_utils import role_required

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api")

def create_notification(user_id, message):
    db = get_db()
    db.execute(
        "INSERT INTO notifications (user_id, message) VALUES (%s, %s)",
        (user_id, message)
    )
    db.commit()

@notifications_bp.route("/notifications", methods=["GET"])
@role_required("candidate", "recruiter", "admin")
def get_notifications():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 50",
        (session["user_id"],)
    ).fetchall()
    
    return jsonify([dict(row) for row in rows])

@notifications_bp.route("/notifications/<int:notification_id>/read", methods=["PUT"])
@role_required("candidate", "recruiter", "admin")
def mark_notification_read(notification_id):
    db = get_db()
    
    # Verify ownership
    notif = db.execute("SELECT * FROM notifications WHERE id = %s", (notification_id,)).fetchone()
    if not notif:
        return jsonify({"error": "not found"}), 404
        
    if notif["user_id"] != session["user_id"]:
        return jsonify({"error": "forbidden"}), 403
        
    db.execute("UPDATE notifications SET is_read = 1 WHERE id = %s", (notification_id,))
    db.commit()
    
    return jsonify({"message": "marked as read"})
