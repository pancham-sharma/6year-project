import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecolink_backend.settings')
django.setup()

from donations.models import Category

def cleanup():
    # 1. Deduplicate by name
    names_seen = set()
    all_cats = Category.objects.all().order_by('id')
    
    for cat in all_cats:
        name_lower = cat.name.toLowerCase().strip() if hasattr(cat.name, 'toLowerCase') else cat.name.lower().strip()
        if name_lower in names_seen:
            print(f"Deleting duplicate category: {cat.name} (ID: {cat.id})")
            cat.delete()
        else:
            names_seen.add(name_lower)

    # 2. Specific duplicates/aliases cleanup
    aliases = {
        'monetary': 'money',
        'environment': 'trees',
        'gift': 'gifts'
    }
    
    for alias, target in aliases.items():
        if Category.objects.filter(name__iexact=target).exists():
            alias_cats = Category.objects.filter(name__iexact=alias)
            if alias_cats.exists():
                print(f"Deleting alias category '{alias}' because '{target}' exists.")
                alias_cats.delete()

    print("Cleanup complete.")

if __name__ == "__main__":
    cleanup()
