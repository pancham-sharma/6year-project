import os
import sys
import traceback

# Compatibility shim for Django 4.0+
import django.utils
try:
    from django.utils import itercompat
except ImportError:
    import collections.abc
    from types import ModuleType
    iter_module = ModuleType('itercompat')
    iter_module.is_iterable = lambda x: isinstance(x, collections.abc.Iterable)
    django.utils.itercompat = iter_module
    sys.modules['django.utils.itercompat'] = iter_module

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
    import logging
    logger = logging.getLogger(__name__)
    print("\n" + "!"*60)
    print("FATAL: ASGI SERVER FAILED TO INITIALIZE")
    print(f"Error Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")
    print("!"*60 + "\n")
    traceback.print_exc()
    raise e




