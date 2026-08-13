import os
import sys
import tempfile
import pytest

# Add backend directory to sys.path so app.py can import its local modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app import app as flask_app
from db import get_db

@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    # Create a temporary file to isolate the database for each test
    db_fd, db_path = tempfile.mkstemp()
    
    flask_app.config.update({
        "TESTING": True,
        "DATABASE": db_path,
        "SECRET_KEY": "test-secret-key",
    })

    # Create the database and load test data
    with flask_app.app_context():
        db = get_db()
        with flask_app.open_resource('../database/schema.sql', mode='r') as f:
            db.executescript(f.read())
            
        # Clear tables just in case the connection is reused
        db.execute("DELETE FROM applications")
        db.execute("DELETE FROM jobs")
        db.execute("DELETE FROM users")
        db.commit()
            
        # Insert a test recruiter and candidate
        from backend.models.user import create_user
        create_user("Test Recruiter", "recruiter@test.com", "password", "recruiter")
        create_user("Test Candidate", "candidate@test.com", "password", "candidate")

    yield flask_app

    # Clean up / remove the temporary file
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test runner for the app's Click commands."""
    return app.test_cli_runner()
