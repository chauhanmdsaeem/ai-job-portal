#!/bin/bash
# Initialize the database schema if it doesn't exist (no mock data)
echo "Initializing database schema..."
cd database
sqlite3 job_portal.db < schema.sql
cd ..

# Start the gunicorn server
echo "Starting Gunicorn..."
cd backend
gunicorn -w 2 -b 0.0.0.0:$PORT app:app
