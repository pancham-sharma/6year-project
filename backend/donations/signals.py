from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import re
from io import BytesIO
from django.core.files.base import ContentFile
import os

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

@receiver(post_save, sender='donations.Donation')
def handle_donation_notification(sender, instance, created, **kwargs):
    from users.models import User
    from chat.models import Notification
    from django.db.models import Q
    from inventory.models import InventoryItem
    
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

@receiver(post_save, sender='donations.PickupDetails')
def handle_pickup_notification(sender, instance, created, **kwargs):
    from chat.models import Notification
    
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

@receiver(post_save, sender='donations.Donation')
def optimize_donation_image(sender, instance, **kwargs):
    """
    Automatically converts donation images to WebP and compresses them.
    """
    if not instance.image:
        return

    # To avoid recursion, check if the image is already in WebP format
    if instance.image.name.lower().endswith('.webp'):
        return

    try:
        from PIL import Image
        # Open the image using Pillow
        img = Image.open(instance.image.path)
        
        # Prepare the output stream
        output = BytesIO()
        
        # Convert to WebP with compression
        img.save(output, format='WEBP', quality=80)
        output.seek(0)
        
        # Rename the file extension to .webp
        new_name = os.path.splitext(instance.image.name)[0] + '.webp'
        
        # Save the new image (using save=False to prevent recursion)
        instance.image.save(new_name, ContentFile(output.read()), save=False)
        
        # Update the model instance directly
        # Use sender.objects to avoid importing Donation
        sender.objects.filter(pk=instance.pk).update(image=instance.image)
        
    except Exception as e:
        print(f"Image optimization failed: {e}")
