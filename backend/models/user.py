"""
models/user.py
---------------------------------------------------------
All database access for the `users` table lives here, so
routes/auth.py doesn't need to know any SQL — it just calls
these functions.

Passwords are never stored in plain text. generate_password_hash
uses a salted hash (scrypt by default in modern Werkzeug), and
check_password_hash compares against it safely.
"""
from werkzeug.security import generate_password_hash, check_password_hash

from db import get_db


def create_user(name, email, password, role):
    """Insert a new user and return their new id.

    Raises sqlite3.IntegrityError if the email is already taken
    (the `users.email UNIQUE` constraint in schema.sql enforces
    this at the database level, as a backstop even if the app
    code forgets to check first).
    """
    db = get_db()
    password_hash = generate_password_hash(password)
    cursor = db.execute(
        "INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, %s) RETURNING id",
        (name, email, password_hash, role),
    )
    row_id = cursor.fetchone()['id']
    db.commit()
    return row_id


def get_user_by_email(email):
    db = get_db()
    return db.execute(
        "SELECT * FROM users WHERE email = %s", (email,)
    ).fetchone()


def get_user_by_id(user_id):
    db = get_db()
    return db.execute(
        "SELECT * FROM users WHERE id = %s", (user_id,)
    ).fetchone()


def verify_password(user_row, password):
    """user_row is a sqlite3.Row from one of the functions above."""
    return check_password_hash(user_row["password_hash"], password)


def to_public_dict(user_row):
    """Strip password_hash before this ever reaches a JSON response."""
    # Convert Row to dict so we can safely .get() optional fields
    d = dict(user_row)
    return {
        "id": d["id"],
        "name": d["name"],
        "email": d["email"],
        "role": d["role"],
        "company_name": d.get("company_name"),
        "company_website": d.get("company_website"),
        "company_desc": d.get("company_desc"),
    }

def update_user_resume(user_id, resume_text):
    db = get_db()
    db.execute(
        "UPDATE users SET resume = %s WHERE id = %s", (resume_text, user_id)
    )
    db.commit()

def update_company_profile(user_id, company_name, company_website, company_desc):
    db = get_db()
    db.execute(
        "UPDATE users SET company_name = %s, company_website = %s, company_desc = %s WHERE id = %s",
        (company_name, company_website, company_desc, user_id)
    )
    db.commit()
