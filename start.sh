#!/bin/bash
# Rebuild and seed the database on every startup
echo "Initializing database..."
cd database
python seed.py
cd ..

# Start the gunicorn server
echo "Starting Gunicorn..."
cd backend
gunicorn -w 2 -b 0.0.0.0:$PORT app:app
