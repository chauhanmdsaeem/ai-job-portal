from flask import Blueprint, jsonify, session
from db import get_db
from utils.auth_utils import role_required

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")

@dashboard_bp.route("/stats", methods=["GET"])
@role_required("recruiter", "admin")
def get_dashboard_stats():
    user_id = session["user_id"]
    db = get_db()
    
    # 1. Stats
    # Active Jobs
    cur = db.execute("SELECT COUNT(*) as count FROM jobs WHERE created_by = %s AND status = 'open'", (user_id,))
    active_jobs = cur.fetchone()["count"]
    
    # Total Applications
    cur = db.execute("""
        SELECT COUNT(*) as count 
        FROM applications a 
        JOIN jobs j ON a.job_id = j.id 
        WHERE j.created_by = %s
    """, (user_id,))
    total_applications = cur.fetchone()["count"]
    
    # Shortlisted
    cur = db.execute("""
        SELECT COUNT(*) as count 
        FROM applications a 
        JOIN jobs j ON a.job_id = j.id 
        WHERE j.created_by = %s AND a.status = 'Shortlisted'
    """, (user_id,))
    shortlisted = cur.fetchone()["count"]
    
    # Interviews
    cur = db.execute("""
        SELECT COUNT(*) as count 
        FROM applications a 
        JOIN jobs j ON a.job_id = j.id 
        WHERE j.created_by = %s AND a.status = 'Interview'
    """, (user_id,))
    interviews = cur.fetchone()["count"]
    
    # Hired
    cur = db.execute("""
        SELECT COUNT(*) as count 
        FROM applications a 
        JOIN jobs j ON a.job_id = j.id 
        WHERE j.created_by = %s AND a.status = 'Selected'
    """, (user_id,))
    hired = cur.fetchone()["count"]
    
    # 2. Recent Applications
    cur = db.execute("""
        SELECT a.id, a.status, a.applied_at, 
               u.name as candidate_name, 
               j.title as job_title, j.id as job_id
        FROM applications a
        JOIN jobs j ON a.job_id = j.id
        JOIN users u ON a.candidate_id = u.id
        WHERE j.created_by = %s
        ORDER BY a.applied_at DESC
        LIMIT 5
    """, (user_id,))
    recent_applications = cur.fetchall()
    
    # Format dates
    for app in recent_applications:
        # Convert timestamp to a nice string if necessary
        app["date"] = app["applied_at"].strftime("%b %d, %Y") if hasattr(app["applied_at"], "strftime") else str(app["applied_at"])
    
    # 3. Active Jobs List
    cur = db.execute("""
        SELECT j.id, j.title, 
               (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as app_count
        FROM jobs j
        WHERE j.created_by = %s AND j.status = 'open'
        ORDER BY j.created_at DESC
        LIMIT 5
    """, (user_id,))
    active_jobs_list = cur.fetchall()
    
    # 4. Pending Actions (New applications to review)
    cur = db.execute("""
        SELECT COUNT(*) as count 
        FROM applications a 
        JOIN jobs j ON a.job_id = j.id 
        WHERE j.created_by = %s AND a.status = 'Applied'
    """, (user_id,))
    new_to_review = cur.fetchone()["count"]
    
    pending_actions = []
    if new_to_review > 0:
        pending_actions.append(f"{new_to_review} new applications need review")
    if interviews > 0:
        pending_actions.append(f"{interviews} candidates waiting for interview feedback")
    if len(pending_actions) == 0:
        pending_actions.append("You're all caught up!")
        
    return jsonify({
        "stats": {
            "active_jobs": active_jobs,
            "total_applications": total_applications,
            "shortlisted": shortlisted,
            "interviews": interviews,
            "hired": hired
        },
        "recent_applications": recent_applications,
        "active_jobs_list": active_jobs_list,
        "pending_actions": pending_actions
    })
