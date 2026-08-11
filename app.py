"""
app.py
---------------------------------------------------------
Phase 2 — Python Backend (Flask)

What this file does:
1. Loads job listings from data/jobs.json on startup.
2. Serves the Phase 1 frontend (frontend/index.html, style.css,
   script.js) as static files, so `python app.py` alone gives
   you the whole app at http://127.0.0.1:5000/
3. Exposes a small JSON API:
       GET /api/jobs            -> list all jobs
       GET /api/jobs?location=  -> filter by location (optional)
       GET /api/jobs?job_type=  -> filter by job type  (optional)
       GET /api/jobs?q=         -> search title/company/skills
       GET /api/jobs/<id>       -> a single job, or 404

This intentionally does NOT touch a database yet — that's
Phase 3. Reading from a JSON file first lets us understand
routes, requests and responses without adding SQL at the
same time.
"""

import json
from pathlib import Path

from flask import Flask, jsonify, abort, send_from_directory

# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------
# BASE_DIR = .../ai-job-portal/backend
# We go up one level to reach the project root, then into
# frontend/ and data/. Using pathlib instead of raw strings
# so this works the same on Windows, macOS and Linux.
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"
JOBS_FILE = PROJECT_ROOT / "data" / "jobs.json"

# ---------------------------------------------------------
# App setup
# ---------------------------------------------------------
# static_folder=None because we're serving the frontend
# ourselves via explicit routes below — that makes it obvious
# *how* files are being served, which matters more than
# convenience while you're still learning Flask.
app = Flask(__name__, static_folder=None)


def load_jobs():
    """
    Read data/jobs.json fresh from disk on every call.

    This is deliberately simple (no caching) so that if you
    edit jobs.json while the dev server is running, a page
    refresh shows the change immediately — useful while you're
    still getting a feel for the data.
    """
    with open(JOBS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


# ---------------------------------------------------------
# Frontend routes (Phase 1 files, served by Phase 2 backend)
# ---------------------------------------------------------
@app.route("/")
def serve_index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def serve_frontend_file(filename):
    # Only allow files that actually exist in frontend/ —
    # send_from_directory already guards against path traversal
    # (e.g. someone requesting ../../backend/app.py).
    return send_from_directory(FRONTEND_DIR, filename)


# ---------------------------------------------------------
# API routes
# ---------------------------------------------------------
@app.route("/api/jobs", methods=["GET"])
def get_jobs():
    from flask import request  # imported here to keep it near its one use

    jobs = load_jobs()

    location = request.args.get("location")
    job_type = request.args.get("job_type")
    query = request.args.get("q", "").strip().lower()

    if location:
        jobs = [j for j in jobs if j["location"].lower() == location.lower()]

    if job_type:
        jobs = [j for j in jobs if j["job_type"].lower() == job_type.lower()]

    if query:
        def matches(job):
            haystack = " ".join([job["title"], job["company"], *job["skills"]]).lower()
            return query in haystack

        jobs = [j for j in jobs if matches(j)]

    return jsonify(jobs)


@app.route("/api/jobs/<int:job_id>", methods=["GET"])
def get_job(job_id):
    jobs = load_jobs()
    job = next((j for j in jobs if j["id"] == job_id), None)

    if job is None:
        abort(404, description=f"No job found with id {job_id}")

    return jsonify(job)


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": str(error.description)}), 404


# ---------------------------------------------------------
# Entry point
# ---------------------------------------------------------
if __name__ == "__main__":
    # debug=True gives auto-reload + a helpful in-browser
    # traceback while developing. Turn this off before any
    # real deployment (Phase 11).
    app.run(debug=True, port=5000)
