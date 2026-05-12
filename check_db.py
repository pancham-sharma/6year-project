
import os
import sys
import django

# Add the backend directory to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecolink_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from donations.models import Donation

User = get_user_model()

try:
    user = User.objects.get(username='pancham_one')
    print(f"User: {user.username}, Role: {user.role}")
    donations = Donation.objects.filter(donor=user)
    print(f"Donations count: {donations.count()}")
    for d in donations:
        print(f"  - ID: {d.id}, Category: {d.category}, Quantity: {d.quantity}, Status: {d.status}")
except User.DoesNotExist:
    print("User pancham_one not found")
except Exception as e:
    print(f"Error: {e}")
