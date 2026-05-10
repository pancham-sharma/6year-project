from rest_framework import serializers
from .models import Donation, PickupDetails, Category, DatabaseBackup
import json

class DatabaseBackupSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatabaseBackup
        fields = '__all__'

class CategorySerializer(serializers.ModelSerializer):
    description = serializers.CharField(required=True)
    impact_badge = serializers.CharField(required=True)
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = '__all__'

    def get_image(self, obj):
        if not obj.image: return None
        pic_str = str(obj.image)
        if pic_str.startswith('http'): return pic_str
        try:
            request = self.context.get('request')
            if request: return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        except: return pic_str

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
    donor_phone = serializers.ReadOnlyField(source='donor.phone_number')
    image = serializers.SerializerMethodField()

    class Meta:
        model = Donation
        fields = ['id', 'donor', 'donor_phone', 'category', 'quantity_description', 'quantity', 'unit', 'image', 'status', 'timestamp', 'pickup_details']
        read_only_fields = ['timestamp', 'donor', 'donor_phone']

    def get_image(self, obj):
        if not obj.image: return None
        pic_str = str(obj.image)
        if pic_str.startswith('http'): return pic_str
        try:
            request = self.context.get('request')
            if request: return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        except: return pic_str

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
