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
    try:
        if not request.user.is_staff and not request.user.is_admin():
            return Response({"detail": "Permission denied"}, status=403)

        # 1. Base Stats
        from django.db.models import Q
        stats = {
            'total_donations': Donation.objects.exclude(status='Recycled').count(),
            'total_users': User.objects.count(),
            'active_volunteers': User.objects.filter(Q(role='VOLUNTEER') | Q(volunteer_applications__status='Approved')).distinct().count(),
            'pending_donations': Donation.objects.filter(status='Pending').count()
        }

        # 2. Category Distribution & Dynamic Impact Calculations
        import math
        category_stats = list(Donation.objects.exclude(status='Recycled').values('category').annotate(count=Count('id'), total_qty=Sum('quantity')).order_by('-count'))
        
        # Fetch all active categories to get their impact rules
        category_configs = {c.name.lower(): c for c in Category.objects.all()}
        
        impact_stats = []
        for cat in category_stats:
            cat_name = cat['category']
            config = category_configs.get(cat_name.lower())
            
            if config and config.impact_label:
                # Formula: impact = ceil(total_quantity / impact_per_quantity)
                impact_divisor = config.impact_per_quantity or 1
                impact_count = math.ceil(cat['total_qty'] / impact_divisor)
                
                impact_stats.append({
                    'category': cat_name,
                    'label': config.impact_label,
                    'count': impact_count,
                    'icon': config.icon_name,
                    'impact_per_quantity': config.impact_per_quantity
                })

        # 3. Recent Activity
        recent_donations = Donation.objects.select_related('donor').order_by('-timestamp')[:5]
        recent_data = [{
            'id': d.id,
            'donor': d.donor.username if d.donor else 'Anonymous',
            'category': d.category,
            'status': d.status,
            'time': d.timestamp.isoformat() if d.timestamp else None
        } for d in recent_donations]

        # 4. Inventory Overview
        inventory = list(InventoryItem.objects.values('category', 'quantity', 'distributed', 'unit_name'))

        response_data = {
            'stats': stats,
            'categories': category_stats,
            'impact_stats': impact_stats,
            'recent_donations': recent_data,
            'inventory': inventory,
            'timestamp': timezone.now().isoformat()
        }

        return Response(response_data)
    except Exception as e:
        import traceback
        error_msg = f"❌ Dashboard Summary Error: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        return Response({"error": str(e), "traceback": traceback.format_exc()}, status=500)
