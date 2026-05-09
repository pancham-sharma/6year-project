import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecolink_backend.settings')
django.setup()

from chat.models import Notification
from users.models import VolunteerApplication, User

print("--- Recent Volunteer Application Notifications ---")
notifs = Notification.objects.filter(title__icontains="Volunteer Application").order_by('-timestamp')[:5]
for n in notifs:
    print(f"ID: {n.id}, User: {n.user.username} ({n.user.role}), Title: {n.title}, Message: {n.message[:50]}...")

print("\n--- Recent Volunteer Applications ---")
apps = VolunteerApplication.objects.all().order_by('-created_at')[:5]
for a in apps:
    print(f"ID: {a.id}, Applicant: {a.user.username}, Status: {a.status}, Role: {a.volunteering_role}")
