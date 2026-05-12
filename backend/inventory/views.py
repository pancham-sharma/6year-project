from rest_framework import viewsets, permissions
from .models import InventoryItem, ImpactMetric
from .serializers import InventoryItemSerializer, ImpactMetricSerializer
from utils.pagination import CustomPagination

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Allow any unauthenticated user to perform safe (read) requests.
    Only admin users may write.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        if request.user and request.user.is_authenticated:
            return request.user.is_staff or getattr(request.user, 'role', '') == 'ADMIN'
        return False

from django_filters.rest_framework import DjangoFilterBackend

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all().order_by('category')
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAdminOrReadOnly]

class ImpactMetricViewSet(viewsets.ModelViewSet):
    queryset = ImpactMetric.objects.all()
    serializer_class = ImpactMetricSerializer
    # Explicitly override global IsAuthenticated default — reads are public
    permission_classes = [IsAdminOrReadOnly]
