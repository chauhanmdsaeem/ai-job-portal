"""
routes/auth.py
---------------------------------------------------------
POST /api/register  -> create an account, log the person in
POST /api/login      -> log in with email + password
POST /api/logout     -> clear the session
GET  /api/me         -> who (if anyone) is currently logged in

Session-based auth: on success we write user_id and role into
Flask's `session`. Flask stores that in a signed cookie on the
browser, so every later request from the same browser proves
who's logged in without needing a database lookup for that
alone. We DO still look the user up by id in get_current_user-
style code where we need fresh data (e.g. /api/me), since the
session cookie only carries id + role, not the full record.
"""
import sqlite3

import io
from flask import Blueprint, request, jsonify, session
from PyPDF2 import PdfReader

from models.user import create_user, get_user_by_email, get_user_by_id, verify_password, to_public_dict, update_user_resume

auth_bp = Blueprint("auth", __name__, url_prefix="/api")

VALID_ROLES = ("candidate", "recruiter")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = data.get("role") or "candidate"

    if not name or not email or not password:
        return jsonify({"error": "name, email and password are required"}), 400

    if role not in VALID_ROLES:
        return jsonify({"error": f"role must be one of {VALID_ROLES}"}), 400

    if len(password) < 8:
        return jsonify({"error": "password must be at least 8 characters"}), 400

    if get_user_by_email(email) is not None:
        return jsonify({"error": "an account with that email already exists"}), 409

    try:
        user_id = create_user(name, email, password, role)
    except sqlite3.IntegrityError:
        # Backstop in case of a race between the check above and the
        # insert — the UNIQUE constraint on users.email catches it.
        return jsonify({"error": "an account with that email already exists"}), 409

    session.clear()
    session["user_id"] = user_id
    session["role"] = role

    return jsonify({"id": user_id, "name": name, "email": email, "role": role}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    user = get_user_by_email(email)

    # Deliberately vague error message — "invalid email or password"
    # rather than "no account with that email" — so this endpoint
    # can't be used to discover which emails are registered.
    if user is None or not verify_password(user, password):
        return jsonify({"error": "invalid email or password"}), 401

    session.clear()
    session["user_id"] = user["id"]
    session["role"] = user["role"]

    return jsonify(to_public_dict(user))


@auth_bp.route("/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "logged out"})


@auth_bp.route("/me", methods=["GET"])
def me():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"user": None})

    user = get_user_by_id(user_id)
    if user is None:
        # e.g. the account was deleted after the cookie was issued
        session.clear()
        return jsonify({"user": None})

    return jsonify({"user": to_public_dict(user)})

@auth_bp.route("/me/profile", methods=["GET"])
def get_profile():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401
    
    user = get_user_by_id(user_id)
    if not user or user["role"] != "candidate":
        return jsonify({"error": "forbidden"}), 403
        
    return jsonify({"resume": user["resume"]})

@auth_bp.route("/me/profile", methods=["PUT"])
def update_profile():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401
        
    user = get_user_by_id(user_id)
    if not user or user["role"] != "candidate":
        return jsonify({"error": "forbidden"}), 403
        
    data = request.get_json(silent=True) or {}
    resume_text = data.get("resume")
    
    update_user_resume(user_id, resume_text)
    return jsonify({"message": "Profile updated successfully"})

@auth_bp.route("/me/resume/upload", methods=["POST"])
def upload_resume():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"error": "unauthorized"}), 401
        
    user = get_user_by_id(user_id)
    if not user or user["role"] != "candidate":
        return jsonify({"error": "forbidden"}), 403
        
    if "resume" not in request.files:
        return jsonify({"error": "no file uploaded"}), 400
        
    file = request.files["resume"]
    if file.filename == "":
        return jsonify({"error": "no file selected"}), 400
        
    if not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "only PDF files are supported"}), 400
        
    try:
        reader = PdfReader(io.BytesIO(file.read()))
        resume_text = ""
        for page in reader.pages:
            resume_text += page.extract_text() + "\n"
            
        update_user_resume(user_id, resume_text.strip())
        return jsonify({"message": "Resume uploaded successfully", "resume": resume_text.strip()})
    except Exception as e:
        print(f"PDF Parse Error: {e}")
        return jsonify({"error": "failed to parse PDF"}), 500
