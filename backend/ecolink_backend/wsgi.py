import os
import sys

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

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecolink_backend.settings')

application = get_wsgi_application()
