"""
database/seed.py
---------------------------------------------------------
Run this once to create the database, and re-run it any
time you want to reset back to sample data:

    python database/seed.py

What it does:
1. Creates database/job_portal.db and runs schema.sql
   against it (CREATE TABLE IF NOT EXISTS -> safe to re-run).
2. Creates two demo accounts, if they don't already exist,
   so you have something to log in with immediately:
       recruiter@example.com / password123   (role: recruiter)
       candidate@example.com / password123   (role: candidate)
3. Clears the jobs table and reloads it from data/jobs.json,
   owned by the demo recruiter — so job listings and the
   "you can only edit jobs you posted" rule are both
   testable right away.
"""
import json
import sqlite3
from pathlib import Path

from werkzeug.security import generate_password_hash

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DB_PATH = PROJECT_ROOT / "database" / "job_portal.db"
SCHEMA_PATH = PROJECT_ROOT / "database" / "schema.sql"
JOBS_JSON = PROJECT_ROOT / "data" / "jobs.json"

DEMO_ACCOUNTS = [
    # (name, email, password, role)
    ("Demo Recruiter", "recruiter@example.com", "password123", "recruiter"),
    ("Demo Candidate", "candidate@example.com", "password123", "candidate"),
]


def main():
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")

    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        conn.executescript(f.read())

    # ---- demo users ----
    recruiter_id = None
    for name, email, password, role in DEMO_ACCOUNTS:
        existing = conn.execute(
            "SELECT id FROM users WHERE email = ?", (email,)
        ).fetchone()

        if existing:
            user_id = existing["id"]
        else:
            cur = conn.execute(
                "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
                (name, email, generate_password_hash(password), role),
            )
            user_id = cur.lastrowid

        if role == "recruiter":
            recruiter_id = user_id

    # ---- jobs: reset and reload from data/jobs.json ----
    conn.execute("DELETE FROM jobs")

    with open(JOBS_JSON, "r", encoding="utf-8") as f:
        jobs = json.load(f)

    for job in jobs:
        conn.execute(
            """INSERT INTO jobs (title, company, location, description, skills, salary, job_type, created_by)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                job["title"],
                job["company"],
                job["location"],
                job.get("description", ""),
                ",".join(job.get("skills", [])),
                job.get("salary", ""),
                job.get("job_type", "Full-time"),
                recruiter_id,
            ),
        )

    conn.commit()
    conn.close()

    print(f"Database ready at {DB_PATH}")
    print(f"Seeded {len(jobs)} jobs, owned by recruiter@example.com")
    print("Demo accounts:")
    for name, email, password, role in DEMO_ACCOUNTS:
        print(f"  {role:10s} {email} / {password}")


if __name__ == "__main__":
    main()
