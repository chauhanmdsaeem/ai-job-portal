from flask import Blueprint, request, jsonify, session
from utils.ai_analyzer import ai_site_assistant
from models.job import get_all_jobs, get_jobs_by_recruiter
from models.application import get_applications_for_job

chat_bp = Blueprint("chat", __name__, url_prefix="/api")

@chat_bp.route("/chat", methods=["POST"])
def chat():
    """Endpoint for the floating AI assistant widget."""
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    history = data.get("history", "")
    
    if not message:
        return jsonify({"error": "Message is required"}), 400
        
    role = session.get("role", "guest")
    user_id = session.get("user_id")
    context_data = ""

    if role == "candidate" or role == "guest":
        # RAG Context: Fetch public job listings (limit to 10 for context window)
        jobs_response = get_all_jobs()
        jobs = jobs_response.get("jobs", [])[:10]
        context_data = "Open Jobs:\n"
        for j in jobs:
            context_data += f"- {j['title']} at {j['company']} ({j['location']}). Salary: {j['salary']}. Skills: {', '.join(j['skills'])}\n"
            
    elif role == "recruiter" and user_id:
        # RAG Context: Fetch recruiter's jobs and recent applicants
        my_jobs = get_jobs_by_recruiter(user_id)
        context_data = "My Job Postings and Applicants:\n"
        for j in my_jobs:
            context_data += f"\nJob: {j['title']} ({j['status']})\n"
            apps = get_applications_for_job(j['id'])
            for a in apps:
                context_data += f"  - Applicant: {a['candidate_name']} ({a['candidate_email']}). Status: {a['status']}. Experience: {a['experience']}\n"
                
    result = ai_site_assistant(message, history, role=role, context_data=context_data)
    return jsonify(result)
