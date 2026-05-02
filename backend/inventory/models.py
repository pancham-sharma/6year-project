from django.db import models

class InventoryItem(models.Model):
    category = models.CharField(max_length=50, unique=True)
    quantity = models.PositiveIntegerField(default=0)
    distributed = models.PositiveIntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"{self.category}: {self.quantity}"

class ImpactMetric(models.Model):
    name = models.CharField(max_length=100, unique=True) # e.g., 'Total Meals Served', 'Trees Planted'
    value = models.PositiveIntegerField(default=0)
    
    def __str__(self):
        return f"{self.name}: {self.value}"
