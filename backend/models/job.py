"""
models/job.py
---------------------------------------------------------
All database access for the `jobs` table.

`skills` is stored in SQLite as a single comma-separated
TEXT column (SQLite has no array type). _row_to_dict() is
where that gets turned back into a real list for JSON, and
create_job()/update_job() are where a list gets joined back
into a string before it's written. Keeping that conversion
in exactly these two spots means the rest of the app can
just work with normal Python lists.
"""
from db import get_db


def _row_to_dict(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "company": row["company"],
        "location": row["location"],
        "description": row["description"],
        "skills": row["skills"].split(",") if row["skills"] else [],
        "salary": row["salary"],
        "job_type": row["job_type"],
        "created_by": row["created_by"],
        "created_at": row["created_at"],
    }


def get_all_jobs(location=None, job_type=None, q=None):
    """Return jobs, optionally filtered. Filters are combined with AND."""
    db = get_db()
    query = "SELECT * FROM jobs WHERE 1=1"
    params = []

    if location:
        query += " AND location = ?"
        params.append(location)

    if job_type:
        query += " AND job_type = ?"
        params.append(job_type)

    if q:
        # Match the search term against title, company or skills.
        # Parameterised with ? placeholders throughout — never
        # string-format user input directly into SQL, or you open
        # the door to SQL injection.
        query += " AND (title LIKE ? OR company LIKE ? OR skills LIKE ?)"
        like_term = f"%{q}%"
        params += [like_term, like_term, like_term]

    query += " ORDER BY created_at DESC"

    rows = db.execute(query, params).fetchall()
    return [_row_to_dict(row) for row in rows]


def get_job_by_id(job_id):
    db = get_db()
    row = db.execute("SELECT * FROM jobs WHERE id = ?", (job_id,)).fetchone()
    return _row_to_dict(row) if row else None


def create_job(data, created_by):
    db = get_db()
    skills = ",".join(data.get("skills", []))
    cursor = db.execute(
        """INSERT INTO jobs (title, company, location, description, skills, salary, job_type, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (
            data["title"],
            data["company"],
            data["location"],
            data.get("description", ""),
            skills,
            data.get("salary", ""),
            data.get("job_type", "Full-time"),
            created_by,
        ),
    )
    db.commit()
    return get_job_by_id(cursor.lastrowid)


def update_job(job_id, data):
    """Partial update: any field not present in `data` keeps its old value."""
    db = get_db()
    existing = get_job_by_id(job_id)
    if existing is None:
        return None

    skills = data.get("skills")
    skills_str = ",".join(skills) if skills is not None else ",".join(existing["skills"])

    db.execute(
        """UPDATE jobs
           SET title = ?, company = ?, location = ?, description = ?,
               skills = ?, salary = ?, job_type = ?
           WHERE id = ?""",
        (
            data.get("title", existing["title"]),
            data.get("company", existing["company"]),
            data.get("location", existing["location"]),
            data.get("description", existing["description"]),
            skills_str,
            data.get("salary", existing["salary"]),
            data.get("job_type", existing["job_type"]),
            job_id,
        ),
    )
    db.commit()
    return get_job_by_id(job_id)


def delete_job(job_id):
    db = get_db()
    cursor = db.execute("DELETE FROM jobs WHERE id = ?", (job_id,))
    db.commit()
    return cursor.rowcount > 0
