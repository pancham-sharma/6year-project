from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer, VolunteerApplicationSerializer, AdminVolunteerApplicationSerializer
from .models import VolunteerApplication
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
import os
import random
from django.conf import settings
from .firebase_admin_config import *

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        # Simply create user. Verification is handled by Firebase.
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "success": True,
                "message": "User created successfully. Please verify your email via the link sent to your inbox.",
                "user": UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SocialAuthGoogleView(APIView):
    """
    General Firebase Sync View. 
    Handles both Social login and Email/Password sync.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"error": "No token provided"}, status=400)

        if not firebase_admin or not firebase_admin._apps:
            return Response({"error": "Firebase Admin SDK not initialized. Check server environment variables."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            # Allow for 60 seconds of clock skew to prevent "token used too early" errors
            decoded_token = auth.verify_id_token(token, clock_skew_seconds=60)
            email = decoded_token.get('email')
            uid = decoded_token.get('uid')
            
            if not email:
                return Response({"error": "Email not found in token"}, status=400)

            user = User.objects.filter(email=email).first()
            name = decoded_token.get('name', '')
            name_parts = name.split(' ', 1) if name else []
            first_name = name_parts[0] if name_parts else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            picture = decoded_token.get('picture', '')

            if not user:
                username = email.split('@')[0] + str(random.randint(100, 999))
                try:
                    user = User.objects.create(
                        email=email,
                        username=username,
                        first_name=first_name,
                        last_name=last_name,
                        firebase_uid=uid,
                        is_email_verified=True
                    )
                    # Handle profile picture separately if it's a URL
                    if picture:
                        # For now, just save the URL string to the field; 
                        # Django's ImageField can store a string, but validation might fail later.
                        # Ideally, we'd have a separate URLField or download the image.
                        user.profile_picture = picture 
                        user.save()
                except Exception as db_err:
                    print(f"❌ Database User Creation Failed: {str(db_err)}")
                    return Response({"error": f"Database error: {str(db_err)}"}, status=500)
            else:
                try:
                    user.firebase_uid = uid
                    user.is_email_verified = True
                    if not user.first_name:
                        user.first_name = first_name
                    if not user.last_name:
                        user.last_name = last_name
                    if not user.profile_picture and picture:
                        user.profile_picture = picture
                    user.save()
                except Exception as db_err:
                    print(f"❌ Database User Update Failed: {str(db_err)}")
                    return Response({"error": f"Database update error: {str(db_err)}"}, status=500)

            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user, context={'request': request}).data
            })
        except Exception as e:
            return Response({'error': f'Auth failed: {str(e)}'}, status=401)

class FirebaseAuthView(APIView):
    """
    Dedicated Firebase Auth View as requested.
    Verifies Firebase token and returns user info.
    """
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token = request.data.get("token")
        if not token:
            return Response({"error": "Token required"}, status=status.HTTP_400_BAD_REQUEST)

        if not firebase_admin or not firebase_admin._apps:
            return Response({"error": "Firebase Admin SDK not initialized. Check server environment variables."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            # Allow for clock skew
            decoded_token = auth.verify_id_token(token, clock_skew_seconds=60)
            email = decoded_token.get("email")
            uid = decoded_token.get("uid")

            if not email:
                return Response({"error": "Email not found in token"}, status=status.HTTP_400_BAD_REQUEST)

            # Sync user
            user = User.objects.filter(email=email).first()
            if not user:
                username = email.split('@')[0] + str(random.randint(100, 999))
                try:
                    user = User.objects.create(
                        email=email,
                        username=username,
                        firebase_uid=uid,
                        is_email_verified=True
                    )
                except Exception as db_err:
                    print(f"❌ Database User Creation Failed (Dedicated): {str(db_err)}")
                    return Response({"error": f"Database error: {str(db_err)}"}, status=500)
            else:
                try:
                    user.firebase_uid = uid
                    user.is_email_verified = True
                    user.save()
                except Exception as db_err:
                    print(f"❌ Database User Update Failed (Dedicated): {str(db_err)}")
                    return Response({"error": f"Database update error: {str(db_err)}"}, status=500)

            refresh = RefreshToken.for_user(user)
            return Response({
                "message": "Authentication success",
                "email": email,
                "uid": uid,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": UserSerializer(user, context={'request': request}).data
            })

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)

class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-date_joined')
    permission_classes = (permissions.IsAdminUser,)
    serializer_class = UserSerializer

class UserStatsView(APIView):
    permission_classes = (permissions.IsAdminUser,)
    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta
        
        last_7_days = timezone.now() - timedelta(days=7)
        
        data = {
            "total": User.objects.count(),
            "donors": User.objects.filter(role='DONOR').count(),
            "volunteers": User.objects.filter(role='VOLUNTEER').count(),
            "admins": User.objects.filter(role='ADMIN').count(),
            "new_users": User.objects.filter(date_joined__gte=last_7_days).count(),
        }
        return Response(data)

class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = UserSerializer
    def get_object(self):
        return self.request.user

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    def post(self, request):
        try:
            refresh_token = request.data["refresh_token"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class VolunteerApplicationView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    def post(self, request):
        serializer = VolunteerApplicationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    def get(self, request):
        apps = VolunteerApplication.objects.filter(user=request.user).order_by('-created_at')
        return Response(VolunteerApplicationSerializer(apps, many=True).data)

class VolunteerApplicationAdminListView(generics.ListAPIView):
    queryset = VolunteerApplication.objects.select_related('user').all().order_by('-created_at')
    permission_classes = (permissions.IsAdminUser,)
    serializer_class = AdminVolunteerApplicationSerializer

class VolunteerApplicationAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = VolunteerApplication.objects.all()
    permission_classes = (permissions.IsAdminUser,)
    serializer_class = AdminVolunteerApplicationSerializer

class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        if not current_password or not new_password:
            return Response({"error": "Both current and new passwords are required."}, status=400)
        if not user.check_password(current_password):
            return Response({"error": "Incorrect current password."}, status=400)
        user.set_password(new_password)
        user.save()
        return Response({"message": "Password updated successfully."})

class GetAdminIdView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        admin = User.objects.filter(role='ADMIN').first() or User.objects.filter(is_superuser=True).first()
        if admin:
            return Response({"id": admin.id, "username": admin.username})
        return Response({"error": "Admin not found"}, status=404)

class CustomTokenObtainPairView(APIView):
    """
    We bypass traditional login for Firebase users if they use the sync view.
    But for Admin/Legacy login, we keep this.
    """
    permission_classes = (permissions.AllowAny,)
    def post(self, request):
        from django.contrib.auth import authenticate
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            if not user.is_email_verified:
                return Response({"error": "Email not verified"}, status=403)
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        return Response({"error": "Invalid credentials"}, status=401)
