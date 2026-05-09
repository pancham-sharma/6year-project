import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecolink_backend.settings')
django.setup()

from donations.models import Category

categories_data = [
    {
        'name': 'Food',
        'description': 'Help feed families in need with nutritious meals',
        'image': 'https://i.pinimg.com/1200x/2b/b4/b0/2bb4b0e6331b1e738308549a500a49af.jpg',
        'impact_badge': '₹500 feeds 5 people',
        'icon_name': 'Utensils'
    },
    {
        'name': 'Clothes',
        'description': 'Provide warmth and dignity through clothing',
        'image': 'https://i.pinimg.com/736x/0c/59/51/0c5951d6535588129d8cb0deaabb35d0.jpg',
        'impact_badge': '10 clothes help 1 family',
        'icon_name': 'Shirt'
    },
    {
        'name': 'Books',
        'description': 'Empower minds through education materials',
        'image': 'category_images/download_9_IOLG5uL.jpeg',
        'impact_badge': '5 books educate 1 child',
        'icon_name': 'BookOpen'
    },
    {
        'name': 'Monetary',
        'description': 'Your financial support drives all our programs',
        'image': 'category_images/download_9.jpeg',
        'impact_badge': '₹1000 provides healthcare',
        'icon_name': 'Banknote'
    },
    {
        'name': 'Money', # Alternative name
        'description': 'Your financial support drives all our programs',
        'image': 'category_images/download_9.jpeg',
        'impact_badge': '₹1000 provides healthcare',
        'icon_name': 'Banknote'
    },
    {
        'name': 'Trees',
        'description': 'Plant hope for a greener tomorrow',
        'image': 'category_images/nbl_Erinnerungsbaum.jpeg',
        'impact_badge': '₹200 plants 1 tree',
        'icon_name': 'Sprout'
    },
    {
        'name': 'Environment', # Alternative name
        'description': 'Plant hope for a greener tomorrow',
        'image': 'category_images/nbl_Erinnerungsbaum.jpeg',
        'impact_badge': '₹200 plants 1 tree',
        'icon_name': 'Sprout'
    },
    {
        'name': 'Gift',
        'description': 'Spread joy with thoughtful gifts for children',
        'image': 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=800',
        'impact_badge': '₹300 brings a smile to 1 child',
        'icon_name': 'Gift'
    }
]

for data in categories_data:
    cat, created = Category.objects.get_or_create(name=data['name'])
    cat.description = data['description']
    # For ImageField, we can't just set a URL string easily if it's an external link
    # But if we want to store the URL, we might need a workaround or just set it
    # Actually, Django's ImageField expects a file.
    # However, if we manually set the field value to a string, it might work for display if the frontend handles it.
    # But it's better to just update the fields that are safe.
    cat.impact_badge = data['impact_badge']
    cat.icon_name = data['icon_name']
    
    # If it's a local path (starts with category_images), we can set it.
    if not data['image'].startswith('http'):
        cat.image = data['image']
    else:
        # For external URLs, we might just keep them in the frontend if the DB can't handle them without a URLField.
        # But let's try to set it and see.
        cat.image = data['image']
        
    cat.is_active = True
    cat.save()
    print(f"{'Created' if created else 'Updated'} category: {cat.name}")

print("Database sync complete.")
