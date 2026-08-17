"""
app.py
---------------------------------------------------------
Phase 3 — Database (SQLite) + Phase 4 — Authentication

Same job as the Phase 2 version — serve the frontend and a
JSON API — but /api/jobs now reads and writes SQLite instead
of a static JSON file, and there's a real login system in
front of the write operations.

Run it:
    python database/seed.py   # once, to create + seed the DB
    python backend/app.py     # start the server
    open http://127.0.0.1:5000/
"""
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from flask import Flask, send_from_directory

import db
from routes.auth import auth_bp
from routes.jobs import jobs_bp
from routes.applications import applications_bp
from routes.notifications import notifications_bp
from routes.chat import chat_bp

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"

app = Flask(__name__, static_folder=None)

# SECRET_KEY signs the session cookie so it can't be forged.
# 'dev-secret-key-change-me' is fine on your own machine for
# learning, but a real deployment must set SECRET_KEY as an
# environment variable instead of hardcoding it in source —
# anyone who saw this value could forge login sessions.
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-secret-key-change-me")

# Creates database/job_portal.db + tables if they don't exist yet,
# and makes sure the connection closes cleanly after each request.
db.init_app(app)

app.register_blueprint(auth_bp)
app.register_blueprint(jobs_bp)
app.register_blueprint(applications_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(chat_bp)

# Set up Rate Limiting
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["2000 per day", "500 per hour"],
    storage_uri="memory://"
)

# Apply specific limits to the AI endpoints to prevent API abuse
limiter.limit("50 per minute")(jobs_bp)

# Add Security Headers
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    # Strict-Transport-Security is useful for production (HTTPS)
    # response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# ---------------------------------------------------------
# Frontend routes (unchanged from Phase 2)
# ---------------------------------------------------------
@app.route("/")
def serve_index():
    return send_from_directory(FRONTEND_DIR, "index.html")

@app.route("/about")
def serve_about():
    return send_from_directory(FRONTEND_DIR, "about.html")



@app.route("/companies")
def serve_companies():
    return send_from_directory(FRONTEND_DIR, "companies.html")

@app.route("/contact")
def serve_contact():
    return send_from_directory(FRONTEND_DIR, "contact.html")


@app.route("/<path:filename>")
def serve_frontend_file(filename):
    return send_from_directory(FRONTEND_DIR, filename)


if __name__ == "__main__":
    app.run(debug=True, port=5000)