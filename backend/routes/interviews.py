from flask import Blueprint, request, jsonify, session
from models.user import get_user_by_id
from models.job import get_job_by_id
from utils.ai_analyzer import ai_start_interview, ai_continue_interview

interviews_bp = Blueprint("interviews", __name__, url_prefix="/api/interviews")

@interviews_bp.route("/start", methods=["POST"])
def start_interview():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401

    user = get_user_by_id(user_id)
    if not user or user["role"] != "candidate":
        return jsonify({"error": "forbidden"}), 403

    data = request.get_json() or {}
    job_id = data.get("job_id")
    custom_role = data.get("custom_role")

    if not job_id and not custom_role:
        return jsonify({"error": "job_id or custom_role required"}), 400

    resume_text = user.get("resume") or "The candidate has not provided a resume."

    job_context = custom_role
    if job_id:
        job = get_job_by_id(job_id)
        if job:
            job_context = f"Title: {job['title']}\nCompany: {job['company']}\nDescription: {job['description']}\nSkills: {', '.join(job['skills'])}"

    # Generate first question
    try:
        ai_response = ai_start_interview(resume_text, job_context)
        return jsonify({"question": ai_response.get("question")}), 200
    except Exception as e:
        import traceback, logging
        logging.error(traceback.format_exc())
        return jsonify({"error": "Failed to generate interview question."}), 500


@interviews_bp.route("/reply", methods=["POST"])
def reply_interview():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401

    data = request.get_json() or {}
    history = data.get("history", "")
    answer = data.get("answer", "")
    question_num = data.get("question_num", 1)

    if not answer:
        return jsonify({"error": "answer required"}), 400

    try:
        ai_response = ai_continue_interview(history, answer, question_num)
        return jsonify({
            "feedback": ai_response.get("feedback"),
            "next_question": ai_response.get("next_question")
        }), 200
    except Exception as e:
        import traceback, logging
        logging.error(traceback.format_exc())
        return jsonify({"error": "Failed to process interview reply."}), 500
