from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, VolunteerApplication

admin.site.register(User, UserAdmin)

@admin.register(VolunteerApplication)
class VolunteerApplicationAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'volunteering_role', 'city', 'status', 'created_at']
    list_filter = ['status', 'volunteering_role']
    search_fields = ['name', 'email', 'city']
