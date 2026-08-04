from rest_framework import serializers
from .models import Donation, PickupDetails, Category, DatabaseBackup
import json

class DatabaseBackupSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatabaseBackup
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    description = serializers.CharField(required=True)
    impact_badge = serializers.CharField(required=False, allow_blank=True)
    impact_label = serializers.CharField(required=False, allow_blank=True)
    impact_per_quantity = serializers.IntegerField(required=False, default=1)
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'image', 'image_url', 'impact_badge', 'impact_label', 'impact_per_quantity', 'icon_name', 'unit_name', 'is_active']
        read_only_fields = ['id']

    def get_image_url(self, obj):
        if not obj.image: return None
        try:
            url = obj.image.url
            if 'res.cloudinary.com' in url:
                # Add optimization parameters: f_auto (format), q_auto (quality), w_800 (width)
                if '/upload/' in url:
                    url = url.replace('/upload/', '/upload/f_auto,q_auto,w_800/', 1)
            
            request = self.context.get('request')
            if request and not url.startswith('http'):
                return request.build_absolute_uri(url)
            return url
        except Exception:
            return str(obj.image)


class PickupDetailsSerializer(serializers.ModelSerializer):
    # Make address fields optional so partial submissions don't 400
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    state = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    pincode = serializers.CharField(max_length=10, required=False, allow_blank=True, default='')
    full_address = serializers.CharField(required=False, allow_blank=True, default='')

    class Meta:
        model = PickupDetails
        fields = '__all__'
        read_only_fields = ['donation']

class DonationSerializer(serializers.ModelSerializer):
    pickup_details = PickupDetailsSerializer(required=False)
    donor = serializers.ReadOnlyField(source='donor.username')
    donor_email = serializers.ReadOnlyField(source='donor.email')
    donor_phone = serializers.ReadOnlyField(source='donor.phone_number')
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Donation
        fields = ['id', 'donor', 'donor_email', 'donor_phone', 'category', 'quantity_description', 'quantity', 'unit', 'image', 'image_url', 'status', 'timestamp', 'pickup_details', 'transaction_id', 'donor_mobile']
        read_only_fields = ['timestamp', 'donor', 'donor_email', 'donor_phone']

    def get_image_url(self, obj):
        if not obj.image: return None
        try:
            url = obj.image.url
            if 'res.cloudinary.com' in url:
                if '/upload/' in url:
                    url = url.replace('/upload/', '/upload/f_auto,q_auto,w_600/', 1)
            
            request = self.context.get('request')
            if request and not url.startswith('http'):
                return request.build_absolute_uri(url)
            return url
        except Exception:
            return str(obj.image)


    def to_internal_value(self, data):
        # Handle FormData sending pickup_details as a JSON string
        if 'pickup_details' in data and isinstance(data.get('pickup_details'), str):
            try:
                # Create a mutable copy if it's a QueryDict
                if hasattr(data, 'copy'):
                    data = data.copy()
                data['pickup_details'] = json.loads(data.get('pickup_details'))
            except (json.JSONDecodeError, TypeError):
                pass
        return super().to_internal_value(data)

    def create(self, validated_data):
        pickup_data = validated_data.pop('pickup_details', None)
        donation = Donation.objects.create(**validated_data)
        if pickup_data:
            PickupDetails.objects.create(donation=donation, **pickup_data)
        return donation

    def update(self, instance, validated_data):
        pickup_data = validated_data.pop('pickup_details', None)
        
        # Update donation fields
        instance.category = validated_data.get('category', instance.category)
        instance.quantity_description = validated_data.get('quantity_description', instance.quantity_description)
        instance.quantity = validated_data.get('quantity', instance.quantity)
        instance.unit = validated_data.get('unit', instance.unit)
        instance.image = validated_data.get('image', instance.image)
        instance.status = validated_data.get('status', instance.status)
        instance.save()


        # Update or create pickup details
        if pickup_data:
            pickup, created = PickupDetails.objects.get_or_create(donation=instance)
            for attr, value in pickup_data.items():
                setattr(pickup, attr, value)
            pickup.save()

        return instance
