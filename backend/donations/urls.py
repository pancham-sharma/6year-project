from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DonationViewSet, CategoryViewSet, DataManagementViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'data', DataManagementViewSet, basename='data-mgmt')
router.register(r'', DonationViewSet, basename='donation')

urlpatterns = [
    path('', include(router.urls)),
]
