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
        "status": row.get("status", "open") if hasattr(row, "get") else (row["status"] if "status" in row else "open"),
        "created_by": row["created_by"],
        "created_at": row["created_at"],
    }


def get_all_jobs(location=None, job_type=None, q=None, page=1, limit=10):
    """Return jobs, optionally filtered. Filters are combined with AND."""
    import math
    db = get_db()
    
    where_clause = " WHERE 1=1"
    params = []

    if location:
        where_clause += " AND location = %s"
        params.append(location)

    if job_type:
        where_clause += " AND job_type = %s"
        params.append(job_type)

    if q:
        where_clause += " AND (title LIKE %s OR company LIKE %s OR skills LIKE %s)"
        like_term = f"%{q}%"
        params += [like_term, like_term, like_term]

    # Calculate total count for pagination
    count_query = f"SELECT COUNT(*) as c FROM jobs {where_clause}"
    total = db.execute(count_query, params).fetchone()["c"]

    # Fetch paginated rows
    query = f"SELECT * FROM jobs {where_clause} ORDER BY created_at DESC LIMIT %s OFFSET %s"
    offset = (page - 1) * limit
    params += [limit, offset]

    rows = db.execute(query, params).fetchall()
    
    return {
        "jobs": [_row_to_dict(row) for row in rows],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": math.ceil(total / limit) if limit > 0 else 1
    }


def get_jobs_by_recruiter(recruiter_id):
    db = get_db()
    rows = db.execute(
        "SELECT * FROM jobs WHERE created_by = %s ORDER BY created_at DESC", 
        (recruiter_id,)
    ).fetchall()
    return [_row_to_dict(row) for row in rows]


def get_job_by_id(job_id):
    db = get_db()
    row = db.execute("SELECT * FROM jobs WHERE id = %s", (job_id,)).fetchone()
    return _row_to_dict(row) if row else None


def create_job(data, created_by):
    db = get_db()
    skills = ",".join(data.get("skills", []))
    cursor = db.execute(
        """INSERT INTO jobs (title, company, location, description, skills, salary, job_type, status, created_by)
           VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
        (
            data["title"],
            data["company"],
            data["location"],
            data.get("description", ""),
            skills,
            data.get("salary", ""),
            data.get("job_type", "Full-time"),
            data.get("status", "open"),
            created_by,
        ),
    )
    row_id = cursor.fetchone()['id']
    db.commit()
    return get_job_by_id(row_id)


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
           SET title = %s, company = %s, location = %s, description = %s,
               skills = %s, salary = %s, job_type = %s, status = %s
           WHERE id = %s""",
        (
            data.get("title", existing["title"]),
            data.get("company", existing["company"]),
            data.get("location", existing["location"]),
            data.get("description", existing["description"]),
            skills_str,
            data.get("salary", existing["salary"]),
            data.get("job_type", existing["job_type"]),
            data.get("status", existing["status"]),
            job_id,
        ),
    )
    db.commit()
    return get_job_by_id(job_id)


def delete_job(job_id):
    db = get_db()
    cursor = db.execute("DELETE FROM jobs WHERE id = %s", (job_id,))
    db.commit()
    return cursor.rowcount > 0


def set_job_status(job_id, status):
    db = get_db()
    db.execute("UPDATE jobs SET status = %s WHERE id = %s", (status, job_id))
    db.commit()
    return get_job_by_id(job_id)


def save_job(user_id, job_id):
    import sqlite3
    db = get_db()
    try:
        db.execute(
            "INSERT INTO saved_jobs (user_id, job_id) VALUES (%s, %s)",
            (user_id, job_id)
        )
        db.commit()
        return True
    except sqlite3.IntegrityError:
        return False  # Already saved


def unsave_job(user_id, job_id):
    db = get_db()
    db.execute("DELETE FROM saved_jobs WHERE user_id = %s AND job_id = %s", (user_id, job_id))
    db.commit()


def get_saved_jobs(user_id):
    db = get_db()
    rows = db.execute(
        """SELECT j.* FROM jobs j 
           JOIN saved_jobs sj ON j.id = sj.job_id 
           WHERE sj.user_id = %s 
           ORDER BY sj.saved_at DESC""", 
        (user_id,)
    ).fetchall()
    return [_row_to_dict(row) for row in rows]
