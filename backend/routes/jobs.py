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
from utils.ai_analyzer import ai_recommend_jobs, ai_candidate_match

jobs_bp = Blueprint("jobs", __name__, url_prefix="/api")

REQUIRED_FIELDS = ("title", "company", "location")


@jobs_bp.route("/jobs", methods=["GET"])
def list_jobs():
    location = request.args.get("location")
    job_type = request.args.get("job_type")
    q = request.args.get("q")
    jobs = job_model.get_all_jobs(location=location, job_type=job_type, q=q)
    return jsonify(jobs)


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
    return jsonify(job), 201


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
        
    open_jobs = job_model.get_all_jobs()
    result = ai_recommend_jobs(user["resume"], open_jobs)
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