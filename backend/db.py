"""
db.py
---------------------------------------------------------
Small wrapper around psycopg2 for use inside Flask routes.
Mimics the SQLite wrapper to avoid breaking route logic.
"""
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from pathlib import Path
from flask import g
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent          # .../ai-job-portal/backend
PROJECT_ROOT = BASE_DIR.parent                        # .../ai-job-portal
SCHEMA_PATH = PROJECT_ROOT / "database" / "schema.sql"

class DBWrapper:
    def __init__(self, conn):
        self.conn = conn
        
    def execute(self, query, params=None):
        cursor = self.conn.cursor()
        cursor.execute(query, params)
        return cursor
        
    def commit(self):
        self.conn.commit()
        
    def close(self):
        self.conn.close()

def get_db():
    """Return the request-scoped connection, opening one if needed."""
    if "db" not in g:
        database_url = os.environ.get("DATABASE_URL")
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is not set.")
            
        conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)
        conn.autocommit = True  # Emulate sqlite3 default auto-commit for simple inserts
        g.db = DBWrapper(conn)
    return g.db

def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    """Create the tables if they don't exist yet."""
    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL not set. Skipping DB init.")
        return
        
    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    cursor = conn.cursor()
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        cursor.execute(f.read())
    conn.close()
    print("Database schema initialized.")

def init_app(app):
    """Wire this module into the Flask app."""
    # We do NOT run init_db() automatically on app boot anymore to avoid issues with workers.
    # We will rely on start.sh to run init_db().
    app.teardown_appcontext(close_db)
