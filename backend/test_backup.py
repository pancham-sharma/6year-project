import os
import django
import sys
from io import StringIO
from django.core.management import call_command

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ecolink_backend.settings")
django.setup()

try:
    with open('test_backup.json', 'w') as f:
        call_command('dumpdata', 'users', 'donations', 'inventory', 'chat', exclude=['contenttypes', 'auth.Permission', 'sessions', 'admin.LogEntry'], indent=2, stdout=f)
    print("SUCCESS")
except Exception as e:
    print(f"ERROR: {type(e).__name__} - {e}")
