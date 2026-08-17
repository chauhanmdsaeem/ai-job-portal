#!/bin/bash
# Initialize the database schema if it doesn't exist (no mock data)
echo "Initializing database schema..."
cd backend
python -c "from db import init_db; init_db()"
cd ..

# Start the gunicorn server
echo "Starting Gunicorn..."
cd backend
gunicorn -w 2 -b 0.0.0.0:$PORT app:app
