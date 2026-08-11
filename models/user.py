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
        "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
        (name, email, password_hash, role),
    )
    db.commit()
    return cursor.lastrowid


def get_user_by_email(email):
    db = get_db()
    return db.execute(
        "SELECT * FROM users WHERE email = ?", (email,)
    ).fetchone()


def get_user_by_id(user_id):
    db = get_db()
    return db.execute(
        "SELECT * FROM users WHERE id = ?", (user_id,)
    ).fetchone()


def verify_password(user_row, password):
    """user_row is a sqlite3.Row from one of the functions above."""
    return check_password_hash(user_row["password_hash"], password)


def to_public_dict(user_row):
    """Strip password_hash before this ever reaches a JSON response."""
    return {
        "id": user_row["id"],
        "name": user_row["name"],
        "email": user_row["email"],
        "role": user_row["role"],
    }
