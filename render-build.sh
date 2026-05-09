#!/usr/bin/env bash
# exit on error
set -o errexit

echo "📦 Entering backend directory..."
cd backend

echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo "🗄️ Forcing database migrations..."
# This command forces Django to re-check the 'users' app migrations
python manage.py migrate users --fake-initial || true
python manage.py migrate

echo "✅ Build and Migration complete!"
