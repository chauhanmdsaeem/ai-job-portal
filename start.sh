#!/bin/bash
# Start the gunicorn server
echo "Starting Gunicorn..."
cd backend
gunicorn -w 2 -b 0.0.0.0:$PORT app:app
