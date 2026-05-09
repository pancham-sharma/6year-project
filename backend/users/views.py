from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer, VolunteerApplicationSerializer, AdminVolunteerApplicationSerializer
from .models import VolunteerApplication
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
try:
    import pyotp
    import qrcode
    import qrcode.image.svg
except ImportError:
    pyotp = None
    qrcode = None
from io import BytesIO
import base64
import random
import os
from django.conf import settings
try:
    import firebase_admin
    from firebase_admin import auth, credentials
except ImportError:
    firebase_admin = None

User = get_user_model()

import random
from django.core.mail import send_mail
from .models import VolunteerApplication, EmailOTP

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Generate 6-digit OTP
            otp_code = str(random.randint(100000, 999999))
            EmailOTP.objects.create(user=user, otp=otp_code)
            
            # Send Email (Simulated to console)
            send_mail(
                'Verify your email - SevaMarg',
                f'Welcome {user.first_name}! Your verification code is: {otp_code}',
                'noreply@sevamarg.org',
                [user.email],
                fail_silently=True,
            )
            print(f"\n[EMAIL SIMULATION] To: {user.email} | Code: {otp_code}\n")

            return Response({
                "success": True,
                "message": "Registration successful! Please check your email for the OTP.",
                "email": user.email
            }, status=status.HTTP_201_CREATED)
        
        # Flatten first error message
        msg = "Validation error"
        if serializer.errors:
            first_field = next(iter(serializer.errors))
            msg = serializer.errors[first_field][0]
            if isinstance(msg, dict):
                msg = next(iter(msg.values()))[0]

        return Response({
            "success": False,
            "message": msg
        }, status=status.HTTP_400_BAD_REQUEST)

class VerifyEmailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        if not email or not otp:
            return Response({"success": False, "message": "Email and OTP are required"}, status=400)
            
        try:
            user = User.objects.get(email=email)
            otp_obj = EmailOTP.objects.get(user=user)
            
            if otp_obj.otp == otp:
                if otp_obj.is_expired():
                    return Response({"success": False, "message": "OTP has expired. Please resend."}, status=400)
                
                user.is_email_verified = True
                user.save()
                otp_obj.delete() # Clean up
                return Response({"success": True, "message": "Email verified successfully! You can now login."})
            else:
                return Response({"success": False, "message": "Invalid OTP code"}, status=400)
                
        except (User.DoesNotExist, EmailOTP.DoesNotExist):
            return Response({"success": False, "message": "User not found or OTP not generated"}, status=404)

class ResendOTPView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"success": False, "message": "Email is required"}, status=400)
            
        try:
            user = User.objects.get(email=email)
            if user.is_email_verified:
                return Response({"success": False, "message": "Email is already verified"}, status=400)
            
            # Delete old OTP if exists
            EmailOTP.objects.filter(user=user).delete()
            
            # New OTP
            otp_code = str(random.randint(100000, 999999))
            EmailOTP.objects.create(user=user, otp=otp_code)
            
            # Send Email
            send_mail(
                'New Verification Code - SevaMarg',
                f'Your new verification code is: {otp_code}',
                'noreply@sevamarg.org',
                [user.email],
                fail_silently=True,
            )
            print(f"\n[EMAIL RESEND SIMULATION] To: {user.email} | Code: {otp_code}\n")
            
            return Response({"success": True, "message": "New OTP sent to your email."})
            
        except User.DoesNotExist:
            return Response({"success": False, "message": "User not found"}, status=404)

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.IsAdminUser,)
    serializer_class = UserSerializer

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
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class SocialAuthGoogleView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"error": "No token provided"}, status=status.HTTP_400_BAD_REQUEST)

        if not firebase_admin:
            return Response({"error": "Firebase Admin SDK not installed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            # Initialize Firebase Admin if not already initialized
            if not firebase_admin._apps:
                # 1. Try Environment Variables (Production / Secure Dev)
                private_key = os.getenv('FIREBASE_PRIVATE_KEY')
                if private_key:
                    try:
                        cred_dict = {
                            "type": "service_account",
                            "project_id": os.getenv('FIREBASE_PROJECT_ID'),
                            "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
                            "private_key": private_key.replace('\\n', '\n'),
                            "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
                            "token_uri": "https://oauth2.googleapis.com/token",
                        }
                        cred = credentials.Certificate(cred_dict)
                        firebase_admin.initialize_app(cred)
                    except Exception as e:
                        print(f"Firebase Env Init Error: {e}")
                        # Fallback if env vars are partial
                        firebase_admin.initialize_app()
                
                # 2. Local Fallback (Only if no env vars and file exists)
                else:
                    cred_path = os.path.join(settings.BASE_DIR, 'firebase-service-account.json')
                    if os.path.exists(cred_path):
                        cred = credentials.Certificate(cred_path)
                        firebase_admin.initialize_app(cred)
                    else:
                        # Final Fallback (Default credentials)
                        firebase_admin.initialize_app()

            # Verify the Firebase ID token
            # This is much more secure and robust than generic google-auth
            try:
                decoded_token = auth.verify_id_token(token)
            except Exception as ve:
                print(f"Firebase Token verification failed: {str(ve)}")
                return Response({'error': f'Invalid Firebase token: {str(ve)}'}, status=status.HTTP_401_UNAUTHORIZED)

            email = decoded_token.get('email')
            name = decoded_token.get('name', '')
            picture = decoded_token.get('picture', '')

            if not email:
                return Response({"error": "Email not found in token"}, status=status.HTTP_400_BAD_REQUEST)

            # Create or get user
            # Split name into first and last if possible
            name_parts = name.split(' ', 1)
            f_name = name_parts[0] if len(name_parts) > 0 else ''
            l_name = name_parts[1] if len(name_parts) > 1 else ''

            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0] + str(random.randint(100, 999)),
                    'first_name': f_name,
                    'last_name': l_name,
                    'role': 'DONOR',
                    'is_email_verified': True 
                }
            )

            # If user exists but wasn't verified, mark as verified
            if not user.is_email_verified:
                user.is_email_verified = True
                user.save()

            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            })

        except Exception as e:
            import traceback
            print(f"Social Auth Error: {str(e)}")
            traceback.print_exc()
            return Response({"error": f"Internal Server Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PasswordResetRequestView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        # Placeholder for triggering a password reset email
        email = request.data.get('email')
        if email:
            # Send email logic here
            return Response({"message": "Password reset email sent."})
        return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

class PasswordResetConfirmView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        # Placeholder for confirming password reset with token
        return Response({"message": "Password successfully reset."})

class VolunteerApplicationView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        serializer = VolunteerApplicationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        """Let users see their own applications"""
        apps = VolunteerApplication.objects.filter(user=request.user).order_by('-created_at')
        serializer = VolunteerApplicationSerializer(apps, many=True)
        return Response(serializer.data)

class VolunteerApplicationAdminListView(generics.ListAPIView):
    queryset = VolunteerApplication.objects.all().order_by('-created_at')
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
            return Response({"error": "Both current and new passwords are required."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(current_password):
            return Response({"error": "Incorrect current password."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Password updated successfully."})

# --- 2FA VIEWS ---

class TwoFactorSetupView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.two_factor_enabled:
            return Response({"error": "2FA is already enabled"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate secret if not exists
        if not user.otp_secret:
            user.otp_secret = pyotp.random_base32()
            user.save()
        
        totp = pyotp.TOTP(user.otp_secret)
        otp_url = totp.provisioning_uri(name=user.email, issuer_name="SevaMarg")
        
        # Generate QR Code
        img = qrcode.make(otp_url, image_factory=qrcode.image.svg.SvgImage)
        buffer = BytesIO()
        img.save(buffer)
        qr_svg = base64.b64encode(buffer.getvalue()).decode()
        
        return Response({
            "secret": user.otp_secret,
            "qr_code": f"data:image/svg+xml;base64,{qr_svg}"
        })

class TwoFactorVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        otp = request.data.get('otp')
        if not otp:
            return Response({"error": "OTP is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        totp = pyotp.TOTP(user.otp_secret)
        if totp.verify(otp):
            user.two_factor_enabled = True
            user.save()
            return Response({"message": "2FA enabled successfully"})
        return Response({"error": "Invalid OTP"}, status=status.HTTP_400_BAD_REQUEST)

class TwoFactorDisableView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        user.two_factor_enabled = False
        user.otp_secret = None
        user.save()
        return Response({"message": "2FA disabled successfully"})

class GetAdminIdView(APIView):
    permission_classes = [permissions.AllowAny] # So users can find it to start chat

    def get(self, request):
        admin = User.objects.filter(role='ADMIN').first() or User.objects.filter(is_superuser=True).first()
        if admin:
            return Response({"id": admin.id, "username": admin.username})
        return Response({"error": "Admin not found"}, status=404)

class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        # First, standard login
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = User.objects.get(username=request.data.get('username'))
        
        if not user.is_email_verified:
            return Response({
                "error": "Email verification required. Please check your inbox.",
                "email_unverified": True
            }, status=status.HTTP_403_FORBIDDEN)
        
        if user.two_factor_enabled:
            otp = request.data.get('otp')
            if not otp:
                return Response({
                    "two_factor_required": True,
                    "message": "OTP required"
                }, status=status.HTTP_200_OK) # Return 200 so frontend knows to show OTP input
            
            totp = pyotp.TOTP(user.otp_secret)
            if not totp.verify(otp):
                return Response({"error": "Invalid OTP"}, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response(serializer.validated_data, status=status.HTTP_200_OK)
