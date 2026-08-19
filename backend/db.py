"""
db.py
---------------------------------------------------------
Small wrapper around sqlite3 for use inside Flask routes.
Includes a DBWrapper to transparently convert psycopg2 style %s 
parameters to sqlite3 ? parameters.
"""
import sqlite3
from pathlib import Path
from flask import g, current_app

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DB_PATH = PROJECT_ROOT / "database" / "job_portal.db"
SCHEMA_PATH = PROJECT_ROOT / "database" / "schema.sql"

class DBWrapper:
    def __init__(self, conn):
        self.conn = conn
        
    def execute(self, query, params=None):
        # Convert PostgreSQL style placeholders (%s) to SQLite style (?)
        if params is not None and "%s" in query:
            query = query.replace("%s", "?")
            
        cursor = self.conn.cursor()
        if params is not None:
            cursor.execute(query, params)
        else:
            cursor.execute(query)
        return cursor
        
    def commit(self):
        self.conn.commit()
        
    def close(self):
        self.conn.close()

def get_db():
    if "db" not in g:
        db_path = current_app.config.get("DATABASE", DB_PATH) if current_app else DB_PATH
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON")
        g.db = DBWrapper(conn)
    return g.db

def close_db(exception=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()

def init_db():
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
    print("Database schema initialized.")

def init_app(app):
    app.teardown_appcontext(close_db)
