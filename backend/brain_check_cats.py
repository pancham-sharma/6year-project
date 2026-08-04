import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecolink_backend.settings')
django.setup()

from donations.models import Category

for cat in Category.objects.all():
    print(f"Category: {cat.name}, Image: {cat.image}")
