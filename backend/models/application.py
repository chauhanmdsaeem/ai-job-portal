"""
models/application.py
---------------------------------------------------------
All database access for the `applications` table — the
join between a candidate and a job they've applied to.

The UNIQUE(job_id, candidate_id) constraint in schema.sql
is what actually stops someone applying twice; this file
just needs to let that sqlite3.IntegrityError bubble up so
the route can turn it into a friendly 409 response.
"""
import json
from db import get_db

VALID_STATUSES = (
    "Applied",
    "Under Review",
    "Shortlisted",
    "Interview",
    "Rejected",
    "Selected",
)


def _row_to_dict(row):
    return {
        "id": row["id"],
        "job_id": row["job_id"],
        "candidate_id": row["candidate_id"],
        "resume": row["resume"],
        "experience": row["experience"] if "experience" in row.keys() else None,
        "expected_salary": row["expected_salary"] if "expected_salary" in row.keys() else None,
        "notice_period": row["notice_period"] if "notice_period" in row.keys() else None,
        "portfolio_url": row["portfolio_url"] if "portfolio_url" in row.keys() else None,
        "status": row["status"],
        "applied_at": row["applied_at"],
        "ai_analysis": json.loads(row["ai_analysis"]) if "ai_analysis" in row.keys() and row["ai_analysis"] else None,
    }


def create_application(job_id, candidate_id, resume=None, experience=None, expected_salary=None, notice_period=None, portfolio_url=None):
    db = get_db()
    cursor = db.execute(
        """INSERT INTO applications (job_id, candidate_id, resume, experience, expected_salary, notice_period, portfolio_url) 
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (job_id, candidate_id, resume, experience, expected_salary, notice_period, portfolio_url),
    )
    db.commit()
    return get_application_by_id(cursor.fetchone()['id'])


def get_application_by_id(application_id):
    db = get_db()
    row = db.execute(
        "SELECT * FROM applications WHERE id = %s", (application_id,)
    ).fetchone()
    return _row_to_dict(row) if row else None


def has_applied(job_id, candidate_id):
    db = get_db()
    row = db.execute(
        "SELECT id FROM applications WHERE job_id = %s AND candidate_id = %s",
        (job_id, candidate_id),
    ).fetchone()
    return row is not None


def get_applications_for_candidate(candidate_id):
    """A candidate's own applications, joined with job details so the
    frontend can show "Python Developer at XYZ — Under Review" without
    a second round trip per row."""
    db = get_db()
    rows = db.execute(
        """SELECT applications.*,
                  jobs.title AS job_title,
                  jobs.company AS job_company,
                  jobs.location AS job_location,
                  jobs.status AS job_status
           FROM applications
           JOIN jobs ON jobs.id = applications.job_id
           WHERE applications.candidate_id = %s
           ORDER BY applications.applied_at DESC""",
        (candidate_id,),
    ).fetchall()

    return [
        {
            **_row_to_dict(row),
            "job_title": row["job_title"],
            "job_company": row["job_company"],
            "job_location": row["job_location"],
            "job_status": row["job_status"],
        }
        for row in rows
    ]


def get_applications_for_job(job_id):
    """All applicants for one job, joined with the candidate's name/email
    so a recruiter can see who applied without a separate user lookup."""
    db = get_db()
    rows = db.execute(
        """SELECT applications.*,
                  users.name AS candidate_name,
                  users.email AS candidate_email
           FROM applications
           JOIN users ON users.id = applications.candidate_id
           WHERE applications.job_id = %s
           ORDER BY applications.applied_at ASC""",
        (job_id,),
    ).fetchall()

    return [
        {
            **_row_to_dict(row),
            "candidate_name": row["candidate_name"],
            "candidate_email": row["candidate_email"],
        }
        for row in rows
    ]


def update_status(application_id, status):
    db = get_db()
    db.execute(
        "UPDATE applications SET status = %s WHERE id = %s",
        (status, application_id),
    )
    db.commit()
    return get_application_by_id(application_id)

def save_ai_analysis(application_id, analysis_json_str):
    db = get_db()
    db.execute(
        "UPDATE applications SET ai_analysis = %s WHERE id = %s",
        (analysis_json_str, application_id),
    )
    db.commit()
    return get_application_by_id(application_id)