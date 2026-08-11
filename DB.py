"""
db.py
---------------------------------------------------------
Small wrapper around sqlite3 for use inside Flask routes.

Key idea: `g` is a Flask object that lives for exactly one
request. We store the open connection on `g` so that if a
single request calls get_db() multiple times (e.g. once in
a decorator, once in the route itself), it reuses the same
connection instead of opening a new one each time. The
connection is then closed automatically at the end of the
request by close_db(), which we register with
app.teardown_appcontext.
"""
import sqlite3
from pathlib import Path

from flask import g

BASE_DIR = Path(__file__).resolve().parent          # .../ai-job-portal/backend
PROJECT_ROOT = BASE_DIR.parent                        # .../ai-job-portal
DB_PATH = PROJECT_ROOT / "database" / "job_portal.db"
SCHEMA_PATH = PROJECT_ROOT / "database" / "schema.sql"


def get_db():
    """Return the request-scoped SQLite connection, opening one if needed."""
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        # Row objects behave like dicts (row["title"]) instead of
        # plain tuples (row[0]) — much easier to read and to turn
        # into JSON.
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    """Create the database file and tables if they don't exist yet."""
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()


def init_app(app):
    """Wire this module into the Flask app: create tables, close per request."""
    init_db()
    app.teardown_appcontext(close_db)
