from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Donation, Category
from inventory.models import InventoryItem
from django.db.models import Count, Sum
from django.utils import timezone
from datetime import timedelta
from django.core.cache import cache

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_summary(request):
    """
    Combined API for the Admin Dashboard to reduce multiple network requests.
    Cached for 1 minute to ensure high performance under load.
    """
    if not request.user.is_staff and not request.user.is_admin():
        return Response({"detail": "Permission denied"}, status=403)

    cache_key = 'admin_dashboard_stats'
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data)

    # 1. Base Stats
    from django.db.models import Q
    stats = {
        'total_donations': Donation.objects.exclude(status='Recycled').count(),
        'total_users': User.objects.count(),
        'active_volunteers': User.objects.filter(Q(role='VOLUNTEER') | Q(volunteer_applications__status='Approved')).distinct().count(),
        'pending_donations': Donation.objects.filter(status='Pending').count()
    }

    # 2. Category Distribution
    categories = list(Donation.objects.values('category').annotate(count=Count('id')).order_by('-count'))

    # 3. Recent Activity (Last 5 donations)
    recent_donations = Donation.objects.select_related('donor').order_by('-timestamp')[:5]
    recent_data = [{
        'id': d.id,
        'donor': d.donor.username,
        'category': d.category,
        'status': d.status,
        'time': d.timestamp
    } for d in recent_donations]

    # 4. Inventory Overview
    inventory = list(InventoryItem.objects.values('category', 'quantity', 'unit_name'))

    response_data = {
        'stats': stats,
        'categories': categories,
        'recent_donations': recent_data,
        'inventory': inventory,
        'timestamp': timezone.now()
    }

    # Cache for 60 seconds
    cache.set(cache_key, response_data, 60)

    return Response(response_data)
