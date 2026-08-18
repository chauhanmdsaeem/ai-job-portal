"""
routes/applications.py
---------------------------------------------------------
POST /api/jobs/<id>/apply       -> candidate applies to a job
GET  /api/applications           -> candidate's own applications (track status)
GET  /api/jobs/<id>/applicants   -> recruiter's view of who applied
PUT  /api/applications/<id>      -> recruiter updates an applicant's status
"""
import sqlite3
import json

from flask import Blueprint, request, jsonify, session

from models import job as job_model
from models import application as application_model
from utils.auth_utils import role_required
from utils.ai_analyzer import mock_ai_analyze_resume
from routes.notifications import create_notification

applications_bp = Blueprint("applications", __name__, url_prefix="/api")


@applications_bp.route("/jobs/<int:job_id>/apply", methods=["POST"])
@role_required("candidate")
def apply_to_job(job_id):
    job = job_model.get_job_by_id(job_id)
    if job is None:
        return jsonify({"error": "job not found"}), 404

    if job["status"] != "open":
        return jsonify({"error": "this job is no longer accepting applications"}), 400

    data = request.get_json(silent=True) or {}
    resume = data.get("resume") or ""
    experience = data.get("experience") or ""
    expected_salary = data.get("expected_salary") or ""
    notice_period = data.get("notice_period") or ""
    portfolio_url = data.get("portfolio_url") or ""
    
    if len(resume) > 50000:
        return jsonify({"error": "Resume payload exceeds 50,000 characters limit"}), 413
        
    if len(portfolio_url) > 500:
        return jsonify({"error": "Portfolio URL exceeds 500 characters limit"}), 400

    try:
        application = application_model.create_application(
            job_id=job_id, 
            candidate_id=session["user_id"], 
            resume=resume,
            experience=experience,
            expected_salary=expected_salary,
            notice_period=notice_period,
            portfolio_url=portfolio_url
        )
    except sqlite3.IntegrityError:
        # UNIQUE(job_id, candidate_id) in schema.sql caught a duplicate.
        return jsonify({"error": "you've already applied to this job"}), 409

    candidate = session["user_id"]
    create_notification(job["created_by"], f"New application received for {job['title']} from Candidate ID {candidate}.")

    # Auto-Screening Agent
    # We analyze the resume and automatically update the status based on score
    analysis = mock_ai_analyze_resume(job["description"], job["skills"], resume)
    application_model.save_ai_analysis(application["id"], json.dumps(analysis))
    
    new_status = "Applied"
    if analysis["score"] >= 80:
        new_status = "Shortlisted"
    elif analysis["score"] < 40:
        new_status = "Rejected"
        
    if new_status != "Applied":
        application_model.update_status(application["id"], new_status)
        application["status"] = new_status
        create_notification(candidate, f"Your application for '{job['title']}' was auto-screened and updated to: {new_status}.")

    return jsonify({"message": "application submitted successfully", "application_id": application["id"]}), 201


@applications_bp.route("/applications", methods=["GET"])
@role_required("candidate")
def my_applications():
    applications = application_model.get_applications_for_candidate(session["user_id"])
    return jsonify(applications)


@applications_bp.route("/jobs/<int:job_id>/applicants", methods=["GET"])
@role_required("recruiter", "admin")
def job_applicants(job_id):
    job = job_model.get_job_by_id(job_id)
    if job is None:
        return jsonify({"error": "job not found"}), 404

    if session["role"] != "admin" and job["created_by"] != session["user_id"]:
        return jsonify({"error": "you can only view applicants for jobs you posted"}), 403

    applicants = application_model.get_applications_for_job(job_id)
    return jsonify(applicants)


@applications_bp.route("/applications/<int:application_id>", methods=["PUT"])
@role_required("recruiter", "admin")
def update_application(application_id):
    application = application_model.get_application_by_id(application_id)
    if application is None:
        return jsonify({"error": "application not found"}), 404

    job = job_model.get_job_by_id(application["job_id"])
    if session["role"] != "admin" and job["created_by"] != session["user_id"]:
        return jsonify({"error": "you can only manage applicants for jobs you posted"}), 403

    data = request.get_json(silent=True) or {}
    status = data.get("status")
    if status not in application_model.VALID_STATUSES:
        return jsonify({"error": f"status must be one of {application_model.VALID_STATUSES}"}), 400

    updated = application_model.update_status(application_id, status)
    
    # Notify candidate
    create_notification(application["candidate_id"], f"Your application for '{job['title']}' was updated to: {status}.")
    
    return jsonify(updated)


@applications_bp.route("/applications/<int:application_id>/analyze", methods=["POST"])
@role_required("recruiter", "admin")
def analyze_application(application_id):
    application = application_model.get_application_by_id(application_id)
    if application is None:
        return jsonify({"error": "application not found"}), 404

    job = job_model.get_job_by_id(application["job_id"])
    if session["role"] != "admin" and job["created_by"] != session["user_id"]:
        return jsonify({"error": "you can only analyze applicants for jobs you posted"}), 403

    analysis = mock_ai_analyze_resume(job["description"], job["skills"], application["resume"])
    
    updated_app = application_model.save_ai_analysis(application_id, json.dumps(analysis))
    return jsonify(updated_app)