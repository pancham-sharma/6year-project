from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
import re
from io import BytesIO
from django.core.files.base import ContentFile
import os
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def broadcast_data_sync(group_name, data):
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "data_sync",
                "data": data
            }
        )

@receiver(post_save, sender='donations.Category')
def sync_inventory_category(sender, instance, created, **kwargs):
    """
    Ensures that an InventoryItem exists for every Category.
    """
    from inventory.models import InventoryItem
    if created:
        InventoryItem.objects.get_or_create(
            category=instance.name,
            defaults={'unit_name': instance.unit_name}
        )
    else:
        # Update unit_name if it changed
        InventoryItem.objects.filter(category=instance.name).update(unit_name=instance.unit_name)

@receiver(post_delete, sender='donations.Category')
def delete_inventory_category(sender, instance, **kwargs):
    """
    Deletes the corresponding InventoryItem when a Category is deleted.
    """
    from inventory.models import InventoryItem
    InventoryItem.objects.filter(category=instance.name).delete()

@receiver(pre_save, sender='donations.Donation')
def store_old_status(sender, instance, **kwargs):
    """
    Stores the old status of a donation to check for changes in post_save.
    """
    if instance.pk:
        try:
            instance._old_status = sender.objects.get(pk=instance.pk).status
        except sender.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None

@receiver(post_save, sender='donations.Donation')
def handle_donation_notification(sender, instance, created, **kwargs):
    from users.models import User
    from chat.models import Notification
    from django.db.models import Q
    from inventory.models import InventoryItem
    from donations.models import Category
    
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
                continue
                
            Notification.objects.create(
                user=admin,
                title="New Donation Alert",
                message=f"Donation #{instance.id}: {instance.donor.username} submitted {instance.quantity} {instance.unit} of {instance.category}"
            )
        
        # 3. Broadcast Sync for Admins
        broadcast_data_sync("admin_notifications", {"model": "donations", "id": instance.id})
    else:

        # Check for status changes using the stored _old_status
        old_status = getattr(instance, '_old_status', None)
        
        if old_status != 'Completed' and instance.status == 'Completed':
            # Update inventory - Sole Source of Truth
            inventory_item, created_inv = InventoryItem.objects.get_or_create(category=instance.category)
            
            # Sync unit name from Category if possible
            try:
                cat_obj = Category.objects.filter(name__iexact=instance.category).first()
                if cat_obj:
                    inventory_item.unit_name = cat_obj.unit_name
            except Exception:
                pass

            inventory_item.quantity += instance.quantity
            inventory_item.save()

            # Notify donor
            Notification.objects.create(
                user=instance.donor,
                title="Donation Completed! 🌟",
                message=f"Donation #{instance.id}: Your {instance.category} donation has been processed and added to our inventory. Thank you for your support!"
            )
            
            # Broadcast Sync for Donor and Admins
            broadcast_data_sync(f"notify_{instance.donor.id}", {"model": "donations", "id": instance.id, "status": "Completed"})
            broadcast_data_sync("admin_notifications", {"model": "donations", "id": instance.id, "status": "Completed"})

@receiver(post_save, sender='donations.PickupDetails')
def handle_pickup_notification(sender, instance, created, **kwargs):
    from chat.models import Notification
    
    if instance.assigned_team or instance.volunteer:
        title = "Pickup Scheduled! 🚚"
        # Avoid duplicate notifications for same assignment
        exists = Notification.objects.filter(
            user=instance.donation.donor,
            title=title,
            message__contains=f"#{instance.donation.id}"
        ).exists()
        
        if not exists:
            Notification.objects.create(
                user=instance.donation.donor,
                title=title,
                message=f"Donation #{instance.donation.id}: Great news! A team has been assigned. Scheduled for {instance.scheduled_date} at {instance.scheduled_time}."
            )
            broadcast_data_sync(f"notify_{instance.donation.donor.id}", {"model": "donations", "id": instance.donation.id, "status": "Scheduled"})
            broadcast_data_sync("admin_notifications", {"model": "donations", "id": instance.donation.id, "status": "Scheduled"})

@receiver(post_save, sender='donations.Donation')
def optimize_donation_image(sender, instance, **kwargs):
    """
    Automatically converts donation images to WebP and compresses them.
    """
    if not instance.image:
        return

    if instance.image.name.lower().endswith('.webp'):
        return

    try:
        from PIL import Image
        img = Image.open(instance.image.path)
        output = BytesIO()
        img.save(output, format='WEBP', quality=80)
        output.seek(0)
        
        new_name = os.path.splitext(instance.image.name)[0] + '.webp'
        
        # Save without triggering save() recursion
        instance.image.save(new_name, ContentFile(output.read()), save=False)
        sender.objects.filter(pk=instance.pk).update(image=instance.image)
        
    except Exception as e:
        print(f"Image optimization failed: {e}")
