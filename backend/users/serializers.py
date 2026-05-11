from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import VolunteerApplication

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    donation_count = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone_number', 'city', 'profile_picture', 'is_staff', 'is_superuser', 'date_joined', 'donation_count']

    def get_donation_count(self, obj):
        return getattr(obj, 'annotated_donation_count', obj.donations.count())

    def get_profile_picture(self, obj):
        if not obj.profile_picture:
            return None
        
        # If it's a string starting with http, return as is
        # Note: obj.profile_picture is a FieldFile, so we check its name or str representation
        pic_str = str(obj.profile_picture)
        if pic_str.startswith('http://') or pic_str.startswith('https://'):
            return pic_str
            
        # Otherwise use standard URL (handles storage backends like Cloudinary/S3 correctly)
        try:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        except Exception:
            return pic_str

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'confirm_password', 'first_name', 'last_name', 'role', 'phone_number', 'city']
        
    def validate_email(self, value):
        import re
        value = value.strip().lower()
        # Strict Regex: requires @ and . with 2-6 char TLD
        if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$", value):
            raise serializers.ValidationError("Please enter a valid email address")
        
        # Blacklist common fake strings and disposable domains
        prefix = value.split('@')[0]
        domain = value.split('@')[1]
        
        DISPOSABLE = ['mailinator.com', 'tempmail.com', 'getnada.com', 'mail.ru']
        if domain in DISPOSABLE:
            raise serializers.ValidationError("Disposable emails are not allowed")

        if any(keyword in prefix for keyword in ['test', 'fake', 'example', 'demo', 'asdf', 'admin']):
            if prefix != 'admin': # Allow actual 'admin' but not 'test-admin'
                raise serializers.ValidationError("Please use a real email address, not a test/fake one")

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate_first_name(self, value):
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Full name must be at least 3 characters")
        return value

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match"})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'DONOR'),
            phone_number=validated_data.get('phone_number', ''),
            city=validated_data.get('city', '')
        )
        return user

class VolunteerApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerApplication
        fields = ['id', 'name', 'email', 'phone', 'city', 'volunteering_role', 'message', 'status', 'created_at']
        read_only_fields = ['status', 'created_at']

class AdminVolunteerApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = VolunteerApplication
        fields = '__all__'
        read_only_fields = ['created_at']

class ActiveVolunteerSerializer(serializers.ModelSerializer):
    activities = serializers.SerializerMethodField()
    profile_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'city', 'profile_picture', 'activities', 'date_joined']

    def get_activities(self, obj):
        apps = obj.volunteer_applications.filter(status='Approved').order_by('-created_at')
        return [{
            'id': a.id,
            'role': a.volunteering_role,
            'date': a.created_at,
            'city': a.city
        } for a in apps]

    def get_profile_picture(self, obj):
        if not obj.profile_picture:
            return None
        pic_str = str(obj.profile_picture)
        if pic_str.startswith('http://') or pic_str.startswith('https://'):
            return pic_str
        try:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        except Exception:
            return pic_str
