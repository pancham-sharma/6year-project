
import os
import sys
import django
from django.db import connections
from django.db.utils import OperationalError

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecolink_backend.settings')
django.setup()

db_conn = connections['default']
try:
    db_conn.cursor()
    print("Database connection successful")
except OperationalError as e:
    print(f"Database connection failed: {e}")
except Exception as e:
    print(f"An error occurred: {e}")
