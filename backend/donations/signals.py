from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Donation, PickupDetails
from inventory.models import InventoryItem
from chat.models import Notification
import re

@receiver(post_save, sender=Donation)
def handle_donation_notification(sender, instance, created, **kwargs):
    from users.models import User
    from django.db.models import Q
    
    if created:
        # 1. Notify the User (Donor)
        Notification.objects.create(
            user=instance.donor,
            title="Donation Received! ❤️",
            message=f"Thank you! Your donation for {instance.category} has been received and is pending review."
        )
        
        # 2. Notify all Admins
        admins = User.objects.filter(Q(role='ADMIN') | Q(is_superuser=True))
        for admin in admins:
            if admin == instance.donor:
                continue # Don't notify the admin about their own donation
                
            Notification.objects.create(
                user=admin,
                title="New Donation Alert",
                message=f"{instance.donor.username} has submitted a new donation: {instance.quantity_description} ({instance.category})"
            )
    else:
        # Check for status changes
        if instance.status == 'Completed':
            # Update inventory
            numbers = re.findall(r'\d+', instance.quantity_description)
            quantity = int(numbers[0]) if numbers else 1
            inventory_item, created_inv = InventoryItem.objects.get_or_create(category=instance.category)
            inventory_item.quantity += quantity
            inventory_item.save()

            # Notify donor only
            Notification.objects.create(
                user=instance.donor,
                title="Donation Completed! 🌟",
                message=f"Your {instance.category} donation has been processed and added to our inventory. Thank you for your support!"
            )
        elif instance.status == 'Scheduled':
            # Notification for scheduling is usually handled by PickupDetails signal
            pass

@receiver(post_save, sender=PickupDetails)
def handle_pickup_notification(sender, instance, created, **kwargs):
    from users.models import User
    from django.db.models import Q
    from datetime import date, timedelta
    
    # 1. Notify Donor when a team/volunteer is assigned
    if instance.assigned_team or instance.volunteer:
        # Check if already notified for this specific assignment to avoid spam
        title = "Pickup Scheduled! 🚚"
        exists = Notification.objects.filter(
            user=instance.donation.donor,
            title=title,
            message__contains=f"#{instance.donation.id}"
        ).exists()
        
        if not exists:
            Notification.objects.create(
                user=instance.donation.donor,
                title=title,
                message=f"Great news! A team has been assigned for your donation #{instance.donation.id}. Scheduled for {instance.scheduled_date} at {instance.scheduled_time}."
            )

    # 2. Notify Admins about upcoming pickups (Removed as per user request to avoid cluttering admin bar)
    # if instance.scheduled_date:
    #     today = date.today()
    #     if today <= instance.scheduled_date <= (today + timedelta(days=7)):
    #         admins = User.objects.filter(Q(role='ADMIN') | Q(is_superuser=True))
    #         for admin in admins:
    #             # Avoid unnecessary alerts for the current admin (optional logic)
    #             exists = Notification.objects.filter(
    #                 user=admin,
    #                 title="Upcoming Pickup Alert",
    #                 message__contains=f"donation #{instance.donation.id}"
    #             ).exists()
    #             if not exists:
    #                 Notification.objects.create(
    #                     user=admin,
    #                     title="Upcoming Pickup Alert",
    #                     message=f"Action Required: Pickup scheduled for donation #{instance.donation.id} on {instance.scheduled_date}."
    #                 )
