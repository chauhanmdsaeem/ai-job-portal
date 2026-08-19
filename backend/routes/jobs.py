"""
routes/jobs.py
---------------------------------------------------------
GET    /api/jobs         -> list jobs (public, supports filters)
GET    /api/jobs/<id>    -> one job (public)
POST   /api/jobs         -> create a job (recruiter/admin only)
PUT    /api/jobs/<id>    -> update a job (recruiter who owns it, or admin)
DELETE /api/jobs/<id>    -> delete a job (recruiter who owns it, or admin)

This is the same URL design as the static-data version from
Phase 2 — the frontend doesn't need to change at all to benefit
from the database. What's new is the write operations, and the
ownership check: a recruiter can only edit/delete jobs where
jobs.created_by matches their own user id, unless they're an
admin.
"""
from flask import Blueprint, request, jsonify, session

from models import job as job_model
from models.user import get_user_by_id
from utils.auth_utils import role_required
from utils.ai_analyzer import ai_recommend_jobs, ai_candidate_match, ai_generate_job_description
from routes.notifications import create_notification
import threading

jobs_bp = Blueprint("jobs", __name__, url_prefix="/api")

REQUIRED_FIELDS = ("title", "company", "location")


@jobs_bp.route("/jobs", methods=["GET"])
def list_jobs():
    location = request.args.get("location")
    job_type = request.args.get("job_type")
    q = request.args.get("q")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 10))
    result = job_model.get_all_jobs(location=location, job_type=job_type, q=q, page=page, limit=limit)
    return jsonify(result)


@jobs_bp.route("/my-jobs", methods=["GET"])
@role_required("recruiter", "admin")
def my_jobs():
    """A recruiter's own postings, open and closed — their dashboard list."""
    jobs = job_model.get_jobs_by_recruiter(session["user_id"])
    return jsonify(jobs)


@jobs_bp.route("/jobs/<int:job_id>", methods=["GET"])
def get_job(job_id):
    job = job_model.get_job_by_id(job_id)
    if job is None:
        return jsonify({"error": "job not found"}), 404
    return jsonify(job)


@jobs_bp.route("/jobs", methods=["POST"])
@role_required("recruiter", "admin")
def create_job():
    data = request.get_json(silent=True) or {}
    missing = [field for field in REQUIRED_FIELDS if not data.get(field)]
    if missing:
        return jsonify({"error": f"missing required field(s): {', '.join(missing)}"}), 400

    job = job_model.create_job(data, created_by=session["user_id"])
    
    # Auto-Search Agent (Run in background thread to avoid blocking)
    from flask import current_app
    app = current_app._get_current_object()
    
    def auto_search(job_data, app_obj):
        with app_obj.app_context():
            from db import get_db
            db = get_db()
            # Get all candidates
            candidates = db.execute("SELECT id, resume FROM users WHERE role = 'candidate'").fetchall()
            for cand in candidates:
                if not cand["resume"]: continue
                match = ai_candidate_match(cand["resume"], job_data)
                if match.get("score", 0) >= 90:
                    # Save the job for them
                    job_model.save_job(cand["id"], job_data["id"])
                    # Notify them
                    create_notification(cand["id"], f"Auto-Search Agent: We found a perfect >90% match for you! '{job_data['title']}' at {job_data['company']} was just posted and automatically saved to your profile.")
                    
    threading.Thread(target=auto_search, args=(job, app)).start()

    return jsonify(job), 201

@jobs_bp.route("/jobs/generate-jd", methods=["POST"])
@role_required("recruiter", "admin")
def generate_jd():
    data = request.get_json(silent=True) or {}
    title = data.get("title", "")
    company = data.get("company", "")
    location = data.get("location", "")
    skills = data.get("skills", "")
    
    if not title or not company:
        return jsonify({"error": "title and company are required"}), 400
        
    from utils.ai_analyzer import ai_generate_job_description
    
    result = ai_generate_job_description(title, company, location, skills)
    return jsonify(result)



def _check_ownership(job):
    """Return an error response tuple if the current user may not
    modify `job`, or None if they're allowed to proceed."""
    if session["role"] == "admin":
        return None
    if job["created_by"] != session["user_id"]:
        return jsonify({"error": "you can only modify jobs you posted"}), 403
    return None


@jobs_bp.route("/jobs/<int:job_id>", methods=["PUT"])
@role_required("recruiter", "admin")
def update_job(job_id):
    existing = job_model.get_job_by_id(job_id)
    if existing is None:
        return jsonify({"error": "job not found"}), 404

    denied = _check_ownership(existing)
    if denied:
        return denied

    data = request.get_json(silent=True) or {}
    updated = job_model.update_job(job_id, data)
    return jsonify(updated)


@jobs_bp.route("/jobs/<int:job_id>", methods=["DELETE"])
@role_required("recruiter", "admin")
def delete_job(job_id):
    existing = job_model.get_job_by_id(job_id)
    if existing is None:
        return jsonify({"error": "job not found"}), 404

    denied = _check_ownership(existing)
    if denied:
        return denied

    job_model.delete_job(job_id)
    return jsonify({"message": "job deleted"})


@jobs_bp.route("/jobs/<int:job_id>/close", methods=["POST"])
@role_required("recruiter", "admin")
def close_job(job_id):
    existing = job_model.get_job_by_id(job_id)
    if existing is None:
        return jsonify({"error": "job not found"}), 404

    denied = _check_ownership(existing)
    if denied:
        return denied

    return jsonify(job_model.set_job_status(job_id, "closed"))


@jobs_bp.route("/jobs/<int:job_id>/reopen", methods=["POST"])
@role_required("recruiter", "admin")
def reopen_job(job_id):
    existing = job_model.get_job_by_id(job_id)
    if existing is None:
        return jsonify({"error": "job not found"}), 404

    denied = _check_ownership(existing)
    if denied:
        return denied
    return jsonify(job_model.set_job_status(job_id, "open"))

@jobs_bp.route("/jobs/recommendations", methods=["GET"])
@role_required("candidate")
def get_recommendations():
    user = get_user_by_id(session["user_id"])
    if not user or not user["resume"]:
        return jsonify({"recommendations": []})
        
    open_jobs = job_model.get_all_jobs(limit=100)
    result = ai_recommend_jobs(user["resume"], open_jobs["jobs"])
    return jsonify(result)

@jobs_bp.route("/jobs/<int:job_id>/match", methods=["GET"])
@role_required("candidate")
def get_job_match(job_id):
    user = get_user_by_id(session["user_id"])
    job = job_model.get_job_by_id(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
        
    resume_text = user["resume"] if user and user["resume"] else ""
    result = ai_candidate_match(resume_text, job)
    return jsonify(result)

@jobs_bp.route("/jobs/<int:job_id>/save", methods=["POST"])
@role_required("candidate")
def save_job_endpoint(job_id):
    if not job_model.get_job_by_id(job_id):
        return jsonify({"error": "Job not found"}), 404
    
    job_model.save_job(session["user_id"], job_id)
    return jsonify({"message": "Job saved"})

@jobs_bp.route("/jobs/<int:job_id>/save", methods=["DELETE"])
@role_required("candidate")
def unsave_job_endpoint(job_id):
    job_model.unsave_job(session["user_id"], job_id)
    return jsonify({"message": "Job unsaved"})

@jobs_bp.route("/jobs/saved", methods=["GET"])
@role_required("candidate")
def get_saved_jobs_endpoint():
    jobs = job_model.get_saved_jobs(session["user_id"])
    return jsonify(jobs)