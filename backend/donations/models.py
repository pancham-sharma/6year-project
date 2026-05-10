from django.db import models
from django.conf import settings

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='category_images/', blank=True, null=True)
    impact_badge = models.CharField(max_length=100, blank=True, help_text="e.g. ₹500 feeds 5 people")
    icon_name = models.CharField(max_length=50, default='Heart', help_text="Lucide icon name")
    unit_name = models.CharField(max_length=50, default='Units', help_text="e.g. Meals, Clothes, Trees")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Donation(models.Model):
    CATEGORY_CHOICES = (
        ('Food', 'Food'),
        ('Clothes', 'Clothes'),
        ('Books', 'Books'),
        ('Monetary', 'Monetary'),
        ('Environment', 'Environment'),
    )
    STATUS_CHOICES = (
        ('Pending', 'Pending'),
        ('Scheduled', 'Scheduled'),
        ('Completed', 'Completed'),
        ('Cancelled', 'Cancelled'),
        ('Recycled', 'Recycled'),
    )

    donor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='donations')
    category = models.CharField(max_length=20) 
    quantity_description = models.TextField()
    quantity = models.PositiveIntegerField(default=1)
    image = models.ImageField(upload_to='donations/', blank=True, null=True)
    unit = models.CharField(max_length=20, blank=True, null=True, default='Units')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['category']),
            models.Index(fields=['donor']),
            models.Index(fields=['timestamp']),
        ]

    def save(self, *args, **kwargs):
        # If status is changing to Completed, update inventory
        if self.pk:
            old_status = Donation.objects.get(pk=self.pk).status
            if old_status != 'Completed' and self.status == 'Completed':
                from inventory.models import InventoryItem
                item, created = InventoryItem.objects.get_or_create(category=self.category)
                # Try to get the real unit name from Category model
                try:
                    cat_obj = Category.objects.get(name__iexact=self.category)
                    item.unit_name = cat_obj.unit_name
                except Category.DoesNotExist:
                    pass
                
                item.quantity += self.quantity
                item.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.category} Donation by {self.donor.username} - {self.status}"



class PickupDetails(models.Model):
    donation = models.OneToOneField(Donation, on_delete=models.CASCADE, related_name='pickup_details')
    volunteer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_pickups')
    full_address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    pincode = models.CharField(max_length=10, blank=True, default='')
    landmark = models.CharField(max_length=200, blank=True, null=True)
    scheduled_date = models.DateField(null=True, blank=True)
    scheduled_time = models.TimeField(null=True, blank=True)
    assigned_team = models.CharField(max_length=100, blank=True, null=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    def __str__(self):
        return f"Pickup for Donation {self.donation.id}"

# Signals moved to signals.py to prevent duplication and ensure proper targeting

class DatabaseBackup(models.Model):
    file = models.FileField(upload_to='backups/')
    created_at = models.DateTimeField(auto_now_add=True)
    size = models.CharField(max_length=50, blank=True)
    backup_type = models.CharField(max_length=10, default='json') # json or sql

    def __str__(self):
        return f"Backup {self.created_at} ({self.backup_type})"
