import os
import psycopg2
from psycopg2 import pool
from flask import g, current_app
from psycopg2.extras import RealDictCursor

# Global connection pool
db_pool = None

def init_pool():
    global db_pool
    if db_pool is None:
        db_url = os.environ.get("DATABASE_URL")
        if not db_url:
            raise ValueError("DATABASE_URL is not set")
        # Use SimpleConnectionPool for a single-threaded server, 
        # or ThreadedConnectionPool for multi-threaded. Flask dev server is multi-threaded.
        db_pool = pool.ThreadedConnectionPool(1, 10, dsn=db_url)

class DBWrapper:
    def __init__(self, conn):
        self.conn = conn

    def execute(self, query, params=None):
        cursor = self.conn.cursor(cursor_factory=RealDictCursor)
        try:
            if params is not None:
                cursor.execute(query, params)
            else:
                cursor.execute(query)
        except psycopg2.OperationalError:
            # Reconnect on dropped connection
            self.conn.rollback()
            raise
        return cursor
        
    def commit(self):
        self.conn.commit()
        
    def close(self):
        pass # Handle returning to pool in close_db instead

def get_db():
    global db_pool
    if db_pool is None:
        init_pool()

    if "db" not in g:
        # Get a connection from the pool
        conn = db_pool.getconn()
        try:
            # Ping to check if alive
            with conn.cursor() as c:
                c.execute("SELECT 1")
        except psycopg2.OperationalError:
            # Re-initialize pool if connection is dead
            db_pool.putconn(conn, close=True)
            conn = db_pool.getconn()
            
        g.db = DBWrapper(conn)
        g._db_conn = conn
    return g.db

def close_db(exception=None):
    global db_pool
    db = g.pop("db", None)
    conn = g.pop("_db_conn", None)
    
    if conn is not None and db_pool is not None:
        if exception:
            conn.rollback()
        # Return connection to the pool
        db_pool.putconn(conn)

def init_app(app):
    app.teardown_appcontext(close_db)
