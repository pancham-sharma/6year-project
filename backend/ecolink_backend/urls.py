from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from django.conf import settings
from django.conf.urls.static import static

def debug_health(request):
    try:
        from django.http import JsonResponse
        return JsonResponse({'status': 'ok'})
    except Exception as e:
        with open('debug_crash.log', 'a') as f:
            import traceback
            f.write(f"Health Crash: {str(e)}\n{traceback.format_exc()}\n")
        raise e

urlpatterns = [
    path('', RedirectView.as_view(url='/admin/', permanent=False)),
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/donations/', include('donations.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/chat/', include('chat.urls')),
    # Favicon
    
    path('api/health/', debug_health),
    # Swagger docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
