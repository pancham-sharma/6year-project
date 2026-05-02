from django.contrib import admin
from .models import InventoryItem, ImpactMetric

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('category', 'quantity', 'last_updated')
    search_fields = ('category',)

@admin.register(ImpactMetric)
class ImpactMetricAdmin(admin.ModelAdmin):
    list_display = ('name', 'value')
