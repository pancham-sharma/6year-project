import os
import sys
import traceback

try:
    from django.core.asgi import get_asgi_application
    from channels.routing import ProtocolTypeRouter, URLRouter

    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecolink_backend.settings')

    # Initialize Django ASGI application
    django_asgi_app = get_asgi_application()

    # Import routing and middleware AFTER get_asgi_application()
    from chat.middleware import JWTAuthMiddleware
    import chat.routing

    application = ProtocolTypeRouter({
        "http": django_asgi_app,
        "websocket": JWTAuthMiddleware(
            URLRouter(
                chat.routing.websocket_urlpatterns
            )
        ),
    })
except Exception as e:
    print("\n" + "="*50)
    print("CRITICAL: ASGI IMPORT ERROR")
    print("="*50)
    traceback.print_exc()
    print("="*50 + "\n")
    raise e



