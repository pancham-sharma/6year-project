from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, VolunteerApplication, EmailOTP

admin.site.register(EmailOTP)

class MyUserAdmin(UserAdmin):
    list_display = UserAdmin.list_display + ('role', 'is_email_verified')
    fieldsets = UserAdmin.fieldsets + (
        ('Verification', {'fields': ('is_email_verified', 'role', 'two_factor_enabled')}),
    )

admin.site.register(User, MyUserAdmin)

@admin.register(VolunteerApplication)
class VolunteerApplicationAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'volunteering_role', 'city', 'status', 'created_at']
    list_filter = ['status', 'volunteering_role']
    search_fields = ['name', 'email', 'city']
