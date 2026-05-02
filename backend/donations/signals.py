from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Donation, PickupDetails
from inventory.models import InventoryItem
from chat.models import Notification
import re

@receiver(post_save, sender=Donation)
def handle_donation_status_change(sender, instance, created, **kwargs):
    if created:
        # Notify user about successful creation
        Notification.objects.create(
            user=instance.donor,
            title="New Donation Received",
            message=f"Your {instance.category} donation has been received and is pending."
        )
    else:
        # Check if status changed to completed
        if instance.status == 'Completed':
            # Update inventory
            numbers = re.findall(r'\d+', instance.quantity_description)
            quantity = int(numbers[0]) if numbers else 1
            
            inventory_item, created_inv = InventoryItem.objects.get_or_create(category=instance.category)
            inventory_item.quantity += quantity
            inventory_item.save()

            # Notify donor
            Notification.objects.create(
                user=instance.donor,
                title="Donation Completed",
                message=f"Thank you! Your {instance.category} donation has been completed and added to our inventory."
            )

@receiver(post_save, sender=PickupDetails)
def handle_pickup_assignment(sender, instance, created, **kwargs):
    # If volunteer is assigned
    if instance.volunteer:
        # Notify donor
        Notification.objects.create(
            user=instance.donation.donor,
            title="Volunteer Assigned",
            message=f"Volunteer {instance.volunteer.username} has been assigned for your pickup."
        )
        # Notify volunteer
        Notification.objects.create(
            user=instance.volunteer,
            title="New Pickup Assigned",
            message=f"You have been assigned a pickup for {instance.donation.category} at {instance.city}."
        )
