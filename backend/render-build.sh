#!/usr/bin/env bash
# exit on error
set -o errexit

echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Migrations should be run in the Render 'Pre-Deploy Command' section instead
# python manage.py migrate

echo "✅ Build and Migration complete!"
