#!/usr/bin/env bash
# exit on error
set -o errexit

echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo "🗄️ Running database migrations..."
python manage.py migrate

echo "✅ Build and Migration complete!"
