
import os
import sys
import django

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecolink_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

try:
    user = User.objects.first()
    if user:
        print(f"User found: {user.username}")
        # Try to access donations
        count = user.donations.count()
        print(f"Donations count: {count}")
    else:
        print("No users found")
except Exception as e:
    import traceback
    print(f"Error: {e}")
    traceback.print_exc()
