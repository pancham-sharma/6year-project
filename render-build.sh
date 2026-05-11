#!/usr/bin/env bash
# exit on error
set -o errexit

echo "📦 Entering backend directory..."
cd backend

echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Migrations should be run in the Render 'Release Command' instead of the build step
# Example: cd backend && python manage.py migrate
# python manage.py migrate users --fake-initial || true
# python manage.py migrate

echo "✅ Build and Migration complete!"
