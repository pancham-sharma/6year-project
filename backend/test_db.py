import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from donations.models import Donation
from inventory.models import InventoryItem
from users.models import User

try:
    print(f"Donations: {Donation.objects.count()}")
    print(f"Inventory: {InventoryItem.objects.count()}")
    print(f"Users: {User.objects.count()}")
    print("Database connection OK")
except Exception as e:
    print(f"Database error: {e}")
