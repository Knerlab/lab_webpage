#!/bin/bash
# Load venv environments
source ../labwebpage/bin/activate
# Kill any existing Gunicorn processes
pkill gunicorn
# Wait for a moment to ensure processes are killed
sleep 2
# Start Gunicorn with your application
gunicorn app:app &

echo "DONE!"