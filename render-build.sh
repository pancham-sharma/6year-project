#!/usr/bin/env bash
# exit on error
set -o errexit

echo "📦 Entering backend directory..."
cd backend

echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo "✨ Collecting static files..."
python manage.py collectstatic --no-input

echo "🚀 Applying database migrations..."
# Using --no-input for non-interactive production environments
python manage.py migrate --no-input

echo "✅ Build and Migration complete!"
