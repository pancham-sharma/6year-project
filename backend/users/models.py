from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('ADMIN', 'Admin'),
        ('VOLUNTEER', 'Volunteer'),
        ('DONOR', 'Donor'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='DONOR')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='profiles/', blank=True, null=True)

    def is_admin(self):
        return self.role == 'ADMIN'
    
    def is_volunteer(self):
        return self.role == 'VOLUNTEER'
    
    def is_donor(self):
        return self.role == 'DONOR'

    def __str__(self):
        return f"{self.username} - {self.role}"

class VolunteerApplication(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='volunteer_applications')
    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    city = models.CharField(max_length=100)
    volunteering_role = models.CharField(max_length=50) # teaching, distribution, awareness, tree
    message = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='Pending') # Pending, Approved, Rejected
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.volunteering_role} ({self.status})"

from django.db.models.signals import post_save
from django.dispatch import receiver
@receiver(post_save, sender=VolunteerApplication)
def create_volunteer_notification(sender, instance, created, **kwargs):
    if created:
        from chat.models import Notification
        from django.db.models import Q
        admins = User.objects.filter(Q(role='ADMIN') | Q(is_superuser=True))
        for admin in admins:
            Notification.objects.create(
                user=admin,
                title="New Volunteer Application",
                message=f"{instance.name} applied for {instance.volunteering_role} in {instance.city}"
            )
