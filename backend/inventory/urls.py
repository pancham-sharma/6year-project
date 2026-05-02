from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryItemViewSet, ImpactMetricViewSet

router = DefaultRouter()
router.register(r'items', InventoryItemViewSet, basename='inventory-items')
router.register(r'impact-metrics', ImpactMetricViewSet, basename='impact-metrics')

urlpatterns = [
    path('', include(router.urls)),
]
