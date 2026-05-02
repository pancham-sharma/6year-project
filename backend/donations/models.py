from django.db import models
from django.conf import settings

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='category_images/', blank=True, null=True)
    impact_badge = models.CharField(max_length=100, blank=True, help_text="e.g. ₹500 feeds 5 people")
    icon_name = models.CharField(max_length=50, default='Heart', help_text="Lucide icon name")
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
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    quantity_description = models.TextField()
    quantity = models.PositiveIntegerField(default=1)
    image = models.ImageField(upload_to='donations/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['category']),
            models.Index(fields=['donor']),
        ]

    def save(self, *args, **kwargs):
        # If status is changing to Completed, update inventory
        if self.pk:
            old_status = Donation.objects.get(pk=self.pk).status
            if old_status != 'Completed' and self.status == 'Completed':
                from inventory.models import InventoryItem
                item, created = InventoryItem.objects.get_or_create(category=self.category)
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

from django.db.models.signals import post_save
from django.dispatch import receiver
@receiver(post_save, sender=Donation)
def create_donation_notification(sender, instance, created, **kwargs):
    if created:
        from chat.models import Notification
        from users.models import User
        from django.db.models import Q
        admins = User.objects.filter(Q(role='ADMIN') | Q(is_superuser=True))
        for admin in admins:
            Notification.objects.create(
                user=admin,
                title="New Donation Received",
                message=f"{instance.donor.username} donated {instance.quantity_description} ({instance.category})"
            )

@receiver(post_save, sender=PickupDetails)
def create_pickup_notification(sender, instance, created, **kwargs):
    from datetime import date, timedelta
    if instance.scheduled_date:
        today = date.today()
        end_of_week = today + timedelta(days=7)
        if today <= instance.scheduled_date <= end_of_week:
            from chat.models import Notification
            from users.models import User
            from django.db.models import Q
            admins = User.objects.filter(Q(role='ADMIN') | Q(is_superuser=True))
            for admin in admins:
                # Check if a similar notification already exists for this pickup to avoid spam
                exists = Notification.objects.filter(
                    user=admin, 
                    title="Upcoming Pickup Alert", 
                    message__contains=f"donation #{instance.donation.id}"
                ).exists()
                if not exists:
                    Notification.objects.create(
                        user=admin,
                        title="Upcoming Pickup Alert",
                        message=f"Pickup scheduled for donation #{instance.donation.id} on {instance.scheduled_date} at {instance.scheduled_time}. This is scheduled for this week!"
                    )

    # Notify donor when a team is assigned
    if instance.assigned_team and instance.donation.status == 'Scheduled':
        from chat.models import Notification
        exists = Notification.objects.filter(
            user=instance.donation.donor,
            title="Pickup Assigned! 🚚",
            message__contains=f"#{instance.donation.id}"
        ).exists()
        
        if not exists:
            Notification.objects.create(
                user=instance.donation.donor,
                title="Pickup Assigned! 🚚",
                message=f"Good news! Team {instance.assigned_team} has been assigned to pick up your donation #{instance.donation.id}. They will arrive as per your scheduled slot."
            )
