import os
import django
import sys
from django.db import connections
from django.db.utils import OperationalError

# Setup django
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecolink_backend.settings')
django.setup()

def check_db():
    db_conn = connections['default']
    try:
        db_conn.cursor()
        print("✅ Database connection successful!")
    except OperationalError as e:
        print(f"❌ Database connection failed: {e}")
    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    check_db()
