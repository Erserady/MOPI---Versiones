#!/bin/bash
set -e

echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files (clearing old files)..."
python manage.py collectstatic --noinput --clear

echo "Loading production data..."
python manage.py load_production_data || echo "Warning: load_production_data failed or not needed"

echo "Release commands completed successfully!"
