from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DonationViewSet, CategoryViewSet, DataManagementViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'data', DataManagementViewSet, basename='data-mgmt')
router.register(r'', DonationViewSet, basename='donation')

from .dashboard_views import admin_dashboard_summary

urlpatterns = [
    path('dashboard-summary/', admin_dashboard_summary, name='dashboard-summary'),
    path('', include(router.urls)),
]
