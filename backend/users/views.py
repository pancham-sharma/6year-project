from rest_framework import generics, permissions, status, filters
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from .serializers import (
    UserSerializer, RegisterSerializer, VolunteerApplicationSerializer, 
    AdminVolunteerApplicationSerializer, ActiveVolunteerSerializer
)
from .models import VolunteerApplication
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
import os
import random
from django.conf import settings
import firebase_admin
from firebase_admin import auth

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)

class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class SocialAuthGoogleView(APIView):
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        try:
            token = request.data.get('token')
            if not token:
                return Response({"error": "No token provided"}, status=400)

            # Ensure Firebase is initialized
            if not firebase_admin._apps:
                from .firebase_admin_config import initialize_firebase
                initialize_firebase()

            if not firebase_admin._apps:
                return Response({
                    "error": "Firebase Admin SDK not initialized. Please check FIREBASE_PRIVATE_KEY in .env"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # 1. Verify Token with Firebase
            try:
                # Allow for 60 seconds of clock skew
                decoded_token = auth.verify_id_token(token, clock_skew_seconds=60)
                uid = decoded_token.get('uid')
                email = decoded_token.get('email')
            except Exception as token_err:
                print(f"❌ Firebase Token Verification Failed: {str(token_err)}")
                return Response({'error': f'Invalid token: {str(token_err)}'}, status=401)
                
            if not email:
                return Response({"error": "Email not found in token"}, status=400)

            name = decoded_token.get('name', '')
            name_parts = name.split(' ', 1) if name else []
            first_name = name_parts[0] if name_parts else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''
            picture = decoded_token.get('picture', '')

            # 2. Get or Create User
            # First try to find by firebase_uid (most reliable)
            user = User.objects.filter(firebase_uid=uid).first()
            
            # If not found by UID, try by email
            if not user:
                user = User.objects.filter(email=email).first()

            if not user:
                # Create user if not exists
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
                    if picture:
                        try:
                            user.profile_picture = picture 
                            user.save()
                        except: pass 
                except Exception as db_err:
                    print(f"❌ Database User Creation Failed: {str(db_err)}")
                    return Response({"error": f"Database error: {str(db_err)}"}, status=500)
            else:
                # Update existing user info
                try:
                    changed = False
                    if user.firebase_uid != uid:
                        user.firebase_uid = uid
                        changed = True
                    if not user.is_email_verified:
                        user.is_email_verified = True
                        changed = True
                    if not user.first_name:
                        user.first_name = first_name
                        changed = True
                    if not user.last_name:
                        user.last_name = last_name
                        changed = True
                    if not user.profile_picture and picture:
                        try:
                            user.profile_picture = picture
                            changed = True
                        except: pass
                    
                    if changed:
                        user.save()
                except Exception as db_err:
                    print(f"❌ Database User Update Failed: {str(db_err)}")
                    return Response({"error": f"Database update error: {str(db_err)}"}, status=500)

            refresh = RefreshToken.for_user(user)
            try:
                user_data = UserSerializer(user, context={'request': request}).data
            except Exception as ser_err:
                print(f"❌ User Serialization Failed: {str(ser_err)}")
                user_data = {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'role': getattr(user, 'role', 'DONOR'),
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': user_data
            })
        except ValueError as val_err:
            print(f"❌ Firebase Configuration/Value Error: {str(val_err)}")
            return Response({"error": f"Authentication configuration error: {str(val_err)}"}, status=401)
        except Exception as e:
            print(f"❌ SocialAuthGoogleView Critical Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": f"Server authentication error: {str(e)}"}, status=500)

class FirebaseAuthView(APIView):
    """
    Legacy sync view for existing users manually linking accounts.
    """
    permission_classes = (permissions.IsAuthenticated,)
    def post(self, request):
        firebase_uid = request.data.get('firebase_uid')
        if not firebase_uid:
            return Response({"error": "firebase_uid is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        user.firebase_uid = firebase_uid
        user.save()
        return Response({"status": "Firebase UID synced successfully"})

class UserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['role']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'phone_number', 'city']
    ordering_fields = ['date_joined', 'username', 'first_name', 'donation_count']

    def get_queryset(self):
        return User.objects.annotate(
            annotated_donation_count=Count('donations')
        ).all().order_by('-date_joined')

class UserStatsView(APIView):
    permission_classes = [permissions.IsAdminUser]
    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta
        
        last_7_days = timezone.now() - timedelta(days=7)
        
        total_users = User.objects.count()
        new_users = User.objects.filter(date_joined__gte=last_7_days).count()
        # Sync volunteer count with ActiveVolunteerListView logic
        volunteers = User.objects.filter(
            Q(role='VOLUNTEER') | Q(volunteer_applications__status='Approved')
        ).distinct().count()
        admins = User.objects.filter(Q(role='ADMIN') | Q(is_staff=True) | Q(is_superuser=True)).distinct().count()
        
        return Response({
            "total": total_users,
            "new_users": new_users,
            "volunteers": volunteers,
            "admins": admins
        })

class VolunteerApplicationView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = VolunteerApplicationSerializer

    def get_queryset(self):
        return VolunteerApplication.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class VolunteerApplicationAdminListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminVolunteerApplicationSerializer
    queryset = VolunteerApplication.objects.all().order_by('-created_at')

class VolunteerApplicationAdminDetailView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminVolunteerApplicationSerializer
    queryset = VolunteerApplication.objects.all()

    def perform_update(self, serializer):
        application = serializer.save()
        if application.status == 'Approved':
            user = application.user
            user.role = 'VOLUNTEER'
            user.save()

class ActiveVolunteerListView(generics.ListAPIView):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = ActiveVolunteerSerializer

    def get_queryset(self):
        # Users who are marked as VOLUNTEER OR have at least one approved application
        return User.objects.filter(
            Q(role='VOLUNTEER') | Q(volunteer_applications__status='Approved')
        ).distinct().order_by('-date_joined')

class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not user.check_password(old_password):
            return Response({"error": "Invalid current password"}, status=400)
            
        user.set_password(new_password)
        user.save()
        return Response({"status": "Password changed successfully"})

class GetAdminIdView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request):
        admin = User.objects.filter(role='ADMIN').first() or User.objects.filter(is_superuser=True).first()
        if admin:
            return Response({"id": admin.id, "username": admin.username})
        return Response({"error": "Admin not found"}, status=404)

class CustomTokenObtainPairView(APIView):
    permission_classes = (permissions.AllowAny,)
    def post(self, request):
        from django.contrib.auth import authenticate
        username = request.data.get('username')
        password = request.data.get('password')
        user = authenticate(username=username, password=password)
        if user:
            if not user.is_email_verified and not (user.role == 'ADMIN' or user.is_superuser):
                return Response({
                    "error": "Email not verified",
                    "detail": "Please verify your email before logging in."
                }, status=403)
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })
        return Response({"error": "Invalid credentials"}, status=401)

class CheckEmailStatusView(APIView):
    permission_classes = (permissions.AllowAny,)
    def get(self, request, email):
        try:
            user = User.objects.filter(email=email).first()
            if not user:
                return Response({"exists": False, "verified": False})
            return Response({"exists": True, "verified": user.is_email_verified})
        except Exception as e:
            print(f"❌ CheckEmailStatusView Error: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=500)
