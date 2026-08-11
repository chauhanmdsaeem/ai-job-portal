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

from flask import Flask, send_from_directory

import db
from routes.auth import auth_bp
from routes.jobs import jobs_bp
from routes.applications import applications_bp

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


# ---------------------------------------------------------
# Frontend routes (unchanged from Phase 2)
# ---------------------------------------------------------
@app.route("/")
def serve_index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def serve_frontend_file(filename):
    return send_from_directory(FRONTEND_DIR, filename)


if __name__ == "__main__":
    if not db.DB_PATH.exists():
        print("Note: no jobs will show up until you run `python database/seed.py`.")
    app.run(debug=True, port=5000)