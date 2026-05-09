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
import requests
from django.core.mail import send_mail
from .models import VolunteerApplication, EmailOTP

from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags

def send_otp_email(email, otp_code, first_name="User"):
    """Send OTP via configured Email Backend (SMTP or Resend)"""
    subject = "Verify your email - SevaMarg"
    
    html_message = f"""
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">Verify Your Email</h2>
            <p>Welcome to <strong>SevaMarg</strong>! Your verification code is:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0;">
                {otp_code}
            </div>
            <p style="color: #6b7280; font-size: 14px;">This code will expire in 5 minutes. If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="text-align: center; color: #9ca3af; font-size: 12px;">© 2024 SevaMarg Foundation</p>
        </div>
    """
    plain_message = strip_tags(html_message)
    
    try:
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            html_message=html_message,
            fail_silently=False,
        )
        print(f"✅ OTP Email sent successfully to {email}")
        return True
    except Exception as e:
        print(f"❌ Failed to send OTP email to {email}: {str(e)}")
        # Fallback log for local development
        print(f"\n[DEVELOPMENT FALLBACK] To: {email} | OTP: {otp_code}\n")
        return False

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        email = request.data.get('email')
        
        # Check if user already exists
        existing_user = User.objects.filter(email=email).first()
        if existing_user:
            if not existing_user.is_email_verified:
                # Account exists but not verified - Resend OTP automatically
                EmailOTP.objects.filter(user=existing_user).delete()
                otp_code = str(random.randint(100000, 999999))
                EmailOTP.objects.create(user=existing_user, otp=otp_code)
                send_otp_email(existing_user.email, otp_code, existing_user.first_name)
                
                return Response({
                    "success": False,
                    "message": "Account already exists but email is not verified. A new OTP has been sent to your email.",
                    "email_unverified": True,
                    "email": existing_user.email
                }, status=status.HTTP_200_OK) # Return 200 so frontend can switch to OTP view
            else:
                return Response({
                    "success": False,
                    "message": "User already exists with this email. Please login instead."
                }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Generate 6-digit OTP
            otp_code = str(random.randint(100000, 999999))
            EmailOTP.objects.create(user=user, otp=otp_code)
            
            # Send Email
            send_otp_email(user.email, otp_code, user.first_name)
            
            return Response({
                "success": True,
                "message": "Registration successful! Verification code has been sent to your email. Please verify before logging in.",
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
            
            # Send Real Email via Resend
            email_sent = send_otp_email(user.email, otp_code, user.first_name)
            
            if not email_sent:
                # Fallback to simulation
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
            # Initialize Firebase Admin with strict project ID handling
            if not firebase_admin._apps:
                from django.conf import settings
                
                project_id = os.getenv('FIREBASE_PROJECT_ID') or os.getenv('GOOGLE_CLOUD_PROJECT')
                client_email = os.getenv('FIREBASE_CLIENT_EMAIL')
                private_key = os.getenv('FIREBASE_PRIVATE_KEY')

                if project_id and client_email and private_key:
                    print(f"📡 Initializing Firebase with Env: {project_id}")
                    # Fix Render newline issue
                    formatted_key = private_key.replace('\\n', '\n')
                    cred = credentials.Certificate({
                        "project_id": project_id,
                        "client_email": client_email,
                        "private_key": formatted_key,
                        "type": "service_account",
                        "token_uri": "https://oauth2.googleapis.com/token",
                    })
                    firebase_admin.initialize_app(cred)
                else:
                    # Fallback to local JSON if env not set
                    cred_path = os.path.join(settings.BASE_DIR, 'firebase-service-account.json')
                    if os.path.exists(cred_path):
                        print(f"📄 Initializing Firebase with JSON: {cred_path}")
                        cred = credentials.Certificate(cred_path)
                        firebase_admin.initialize_app(cred)
                    else:
                        print("⚠️ WARNING: No Firebase credentials found. Falling back to default.")
                        firebase_admin.initialize_app()

            print("--- Django Google Auth Verification ---")
            print("VERIFY TOKEN START")
            decoded_token = auth.verify_id_token(token)
            print(f"✅ Token Verified for: {decoded_token.get('email')}")
            
            email = decoded_token.get('email')
            name = decoded_token.get('name', '')
            picture = decoded_token.get('picture', '')

            if not email:
                return Response({"error": "Email not found in token"}, status=status.HTTP_400_BAD_REQUEST)

            # Create or get user
            user = User.objects.filter(email=email).first()
            if not user:
                print(f"👤 Creating new user for {email}")
                username = email.split('@')[0] + str(random.randint(100, 999))
                name_parts = name.split(' ', 1)
                f_name = name_parts[0] if len(name_parts) > 0 else ''
                l_name = name_parts[1] if len(name_parts) > 1 else ''
                
                user = User.objects.create(
                    email=email,
                    username=username,
                    first_name=f_name,
                    last_name=l_name,
                    role='DONOR',
                    is_email_verified=True 
                )
            else:
                print(f"✨ Found existing user: {user.username}")
                if not user.is_email_verified:
                    user.is_email_verified = True
                    user.save()

            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,
                    'profile_picture': picture or (user.profile_picture.url if user.profile_picture else None)
                }
            })

        except Exception as e:
            print(f"❌ Google Auth Error: {str(e)}")
            return Response({'error': f'Auth failed: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)

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
