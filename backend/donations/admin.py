from django.contrib import admin
from .models import Donation, PickupDetails

class PickupDetailsInline(admin.StackedInline):
    model = PickupDetails
    can_delete = False

@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = ('id', 'donor', 'category', 'status', 'timestamp')
    list_filter = ('status', 'category', 'timestamp')
    search_fields = ('donor__username', 'quantity_description')
    inlines = [PickupDetailsInline]

admin.site.register(PickupDetails)
