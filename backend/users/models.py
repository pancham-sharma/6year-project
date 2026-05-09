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
    
    # 2FA & Verification Fields
    two_factor_enabled = models.BooleanField(default=False)
    otp_secret = models.CharField(max_length=32, blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)

    def is_admin(self):
        return self.role == 'ADMIN'
    
    def is_volunteer(self):
        return self.role == 'VOLUNTEER'
    
    def is_donor(self):
        return self.role == 'DONOR'

    def __str__(self):
        return f"{self.username} - {self.role}"

class EmailOTP(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_otp')
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def is_expired(self):
        from django.utils import timezone
        from datetime import timedelta
        return timezone.now() > self.created_at + timedelta(minutes=10)

    def __str__(self):
        return f"OTP for {self.user.email}"

class PasswordResetOTP(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        from django.utils import timezone
        from datetime import timedelta
        return timezone.now() > self.created_at + timedelta(minutes=15)

    def __str__(self):
        return f"Reset OTP for {self.email}"

class VolunteerApplication(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='volunteer_applications')
    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    city = models.CharField(max_length=100)
    volunteering_role = models.CharField(max_length=50) # teaching, distribution, awareness, tree
    message = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default='Pending') # Pending, Approved, Rejected, Recycled
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.volunteering_role} ({self.status})"

from django.db.models.signals import post_save
from django.dispatch import receiver
@receiver(post_save, sender=VolunteerApplication)
def handle_volunteer_notification(sender, instance, created, **kwargs):
    from chat.models import Notification
    from django.db.models import Q
    
    if created:
        # 1. Notify Admins about NEW application
        admins = User.objects.filter(Q(role='ADMIN') | Q(is_superuser=True))
        for admin in admins:
            if admin == instance.user:
                continue # Don't notify the admin about their own application
                
            Notification.objects.create(
                user=admin,
                title="New Volunteer Application",
                message=f"{instance.name} applied for {instance.volunteering_role} in {instance.city}"
            )
    else:
        # 2. Notify User about Approval/Rejection
        # We only notify the user, NOT admins
        if instance.status == 'Approved':
            Notification.objects.create(
                user=instance.user,
                title="Volunteer Application Approved!",
                message=f"Congratulations! Your application to become a volunteer has been approved. Welcome to the team!"
            )
        elif instance.status == 'Rejected':
            Notification.objects.create(
                user=instance.user,
                title="Application Update",
                message=f"Regarding your application for {instance.volunteering_role}: We appreciate your interest, but we cannot proceed at this time."
            )
