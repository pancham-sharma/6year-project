from django.db import models
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

class Message(models.Model):
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Recycled', 'Recycled'),
    )
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='sent_messages', on_delete=models.CASCADE)
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='received_messages', on_delete=models.CASCADE)
    message_body = models.TextField()
    attachment_url = models.URLField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"From {self.sender.username} to {self.receiver.username}"

class Notification(models.Model):
    STATUS_CHOICES = (
        ('Active', 'Active'),
        ('Recycled', 'Recycled'),
    )
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    read = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Active')

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Notification for {self.user.username}: {self.title}"

@receiver(post_save, sender=Message)
def create_message_notification(sender, instance, created, **kwargs):
    if created:
        # If sender is not an admin, notify all admins
        if instance.sender.role != 'ADMIN':
            from users.models import User
            from django.db.models import Q
            admins = User.objects.filter(Q(role='ADMIN') | Q(is_superuser=True))
            for admin in admins:
                Notification.objects.create(
                    user=admin,
                    title="New Message from User",
                    message=f"Message from {instance.sender.username}: {instance.message_body[:100]}..."
                )
        # If sender is admin, notify the receiver
        else:
            Notification.objects.create(
                user=instance.receiver,
                title="New message from Admin",
                message=instance.message_body[:100] + ("..." if len(instance.message_body) > 100 else "")
            )
@receiver(post_save, sender=Notification)
def broadcast_notification(sender, instance, created, **kwargs):
    if created:
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            if not channel_layer: return

            # Broadcast to user's private notify group
            async_to_sync(channel_layer.group_send)(
                f"notify_{instance.user.id}",
                {
                    "type": "notify_update",
                    "data": {
                        "id": instance.id,
                        "title": instance.title,
                        "message": instance.message,
                        "timestamp": instance.timestamp.isoformat(),
                        "read": instance.read
                    }
                }
            )

            # If user is admin, also broadcast to shared admin group
            if instance.user.role == 'ADMIN' or instance.user.is_staff:
                async_to_sync(channel_layer.group_send)(
                    "admin_notifications",
                    {
                        "type": "notify_update",
                        "data": {
                            "id": instance.id,
                            "title": instance.title,
                            "message": instance.message,
                            "timestamp": instance.timestamp.isoformat(),
                            "read": instance.read
                        }
                    }
                )
        except Exception as e:
            print(f"WS Broadcast error: {e}")
