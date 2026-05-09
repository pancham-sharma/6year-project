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
from .models import VolunteerApplication, EmailOTP, PasswordResetOTP

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
            <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
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
        print(f"❌ Gmail SMTP Failed: {str(e)}")
        
        # Fallback to Resend API
        resend_api_key = os.getenv('RESEND_API_KEY')
        if resend_api_key:
            try:
                import requests
                print("📤 Attempting Resend API Fallback...")
                response = requests.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": "SevaMarg <onboarding@resend.dev>",
                        "to": [email],
                        "subject": subject,
                        "html": html_message,
                    }
                )
                if response.status_code in [200, 201]:
                    print(f"✅ Resend API Fallback successful for {email}")
                    return True
                else:
                    print(f"❌ Resend API Error: {response.text}")
            except Exception as re:
                print(f"❌ Resend Fallback Failed: {str(re)}")
        
        print(f"❌ Final OTP Email Failure for {email}")
        return False

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        try:
            email = request.data.get('email', '').strip().lower()
            print(f"--- Registration Attempt for {email} ---")
            
            if not email:
                return Response({"success": False, "message": "Email is required"}, status=400)

            # Check if user already exists
            existing_user = User.objects.filter(email__iexact=email).first()
            if existing_user:
                print(f"🔍 User {email} already exists. Verified: {existing_user.is_email_verified}")
                if not existing_user.is_email_verified:
                    print(f"📧 Unverified user {email} attempting registration. Sending new OTP.")
                    # Send new OTP and redirect
                    EmailOTP.objects.filter(user=existing_user).delete()
                    otp_code = str(random.randint(100000, 999999))
                    EmailOTP.objects.create(user=existing_user, otp=otp_code)
                    send_otp_email(existing_user.email, otp_code, existing_user.first_name)
                    
                    return Response({
                        "success": True,
                        "message": "Account exists but is not verified. A new verification code has been sent.",
                        "email": existing_user.email,
                        "is_redirect": True
                    }, status=status.HTTP_200_OK) 
                else:
                    return Response({
                        "success": False,
                        "message": "User already exists. Please login instead."
                    }, status=status.HTTP_400_BAD_REQUEST)

            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                print(f"👤 Creating new user profile for {email}")
                user = serializer.save()
                
                # Generate OTP ONLY for new registration
                try:
                    otp_code = str(random.randint(100000, 999999))
                    EmailOTP.objects.create(user=user, otp=otp_code)
                    print(f"🔢 New User OTP Generated: {otp_code}")
                    
                    # Send Email (Safe Call)
                    # Send OTP in background
                    import threading
                    email_thread = threading.Thread(
                        target=send_otp_email,
                        args=(user.email, otp_code, user.first_name)
                    )
                    email_thread.start()
                except Exception as inner_e:
                    print(f"⚠️ Registration completed but OTP failed: {str(inner_e)}")
                
                return Response({
                    "success": True,
                    "message": "Verification code has been sent to your email. Please verify before logging in.",
                    "email": user.email
                }, status=status.HTTP_201_CREATED)
            
            return Response({
                "success": False,
                "message": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(f"💥 CRITICAL ERROR in RegisterView: {str(e)}")
            traceback.print_exc()
            return Response({
                "success": False,
                "message": f"Server Error: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyEmailView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()
        
        print(f"--- Verification Attempt for {email} (OTP: {otp}) ---")
        
        if not email or not otp:
            return Response({"success": False, "message": "Email and OTP are required"}, status=400)
            
        try:
            user = User.objects.get(email__iexact=email)
            otp_obj = EmailOTP.objects.get(user=user)
            
            if otp_obj.otp == otp:
                if otp_obj.is_expired():
                    print(f"⏰ OTP Expired for {email}")
                    return Response({"success": False, "message": "OTP has expired. Please resend."}, status=400)
                
                print(f"✅ Email Verified successfully for {email}")
                user.is_email_verified = True
                user.save()
                otp_obj.delete() # Clean up
                
                # Auto-login: Generate tokens
                refresh = RefreshToken.for_user(user)
                
                return Response({
                    "success": True, 
                    "message": "Email verified successfully! Redirecting to dashboard...",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "role": user.role,
                        "profile_picture": user.profile_picture.url if user.profile_picture else None
                    }
                })
            else:
                print(f"❌ Invalid OTP entry for {email}")
                return Response({"success": False, "message": "Invalid OTP code"}, status=400)
                
        except (User.DoesNotExist, EmailOTP.DoesNotExist):
            print(f"❓ Verification Error: User or OTP record not found for {email}")
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
            
            # Send OTP in background
            import threading
            email_thread = threading.Thread(
                target=send_otp_email,
                args=(user.email, otp_code, user.first_name)
            )
            email_thread.start()
            
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
                
                # Get Project ID from multiple possible sources
                project_id = (os.getenv('FIREBASE_PROJECT_ID') or os.getenv('GOOGLE_CLOUD_PROJECT') or 'donation-44db3').strip(' "')
                client_email = (os.getenv('FIREBASE_CLIENT_EMAIL') or '').strip(' "')
                private_key = (os.getenv('FIREBASE_PRIVATE_KEY') or '').strip(' "')

                if project_id and client_email and private_key:
                    print(f"📡 Initializing Firebase for Project: {project_id}")
                    formatted_key = private_key.replace('\\n', '\n')
                    if '-----BEGIN PRIVATE KEY-----' not in formatted_key:
                        formatted_key = f"-----BEGIN PRIVATE KEY-----\n{formatted_key}\n-----END PRIVATE KEY-----"
                    
                    try:
                        # Use initialized app if it already exists
                        if not firebase_admin._apps:
                            cred = credentials.Certificate({
                                "project_id": project_id,
                                "client_email": client_email,
                                "private_key": formatted_key,
                                "type": "service_account",
                                "token_uri": "https://oauth2.googleapis.com/token",
                            })
                            firebase_admin.initialize_app(cred, {
                                'projectId': project_id,
                            })
                    except Exception as ce:
                        print(f"❌ Firebase Certificate Error: {str(ce)}")
                        if not firebase_admin._apps:
                            firebase_admin.initialize_app()
                else:
                    # Fallback to local JSON if env not set
                    cred_path = os.path.join(settings.BASE_DIR, 'firebase-service-account.json')
                    if os.path.exists(cred_path):
                        print(f"📄 Initializing Firebase with JSON: {cred_path}")
                        if not firebase_admin._apps:
                            cred = credentials.Certificate(cred_path)
                            firebase_admin.initialize_app(cred)
                    else:
                        print("⚠️ WARNING: No Firebase credentials found. Falling back to default.")
                        if not firebase_admin._apps:
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

def send_password_reset_email(email, otp_code):
    """Send Password Reset OTP via Email"""
    subject = "Reset your password - SevaMarg"
    html_message = f"""
        <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h2 style="color: #4f46e5; text-align: center;">Reset Your Password</h2>
            <p>You requested to reset your password. Your reset code is:</p>
            <div style="background: #fef2f2; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; margin: 20px 0; color: #dc2626;">
                {otp_code}
            </div>
            <p style="color: #6b7280; font-size: 14px;">This code will expire in 15 minutes. If you didn't request this, please secure your account.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="text-align: center; color: #9ca3af; font-size: 12px;">© 2024 SevaMarg Foundation</p>
        </div>
    """
    plain_message = f"Your password reset code is: {otp_code}. It will expire in 15 minutes."
    
    try:
        send_mail(
            subject,
            plain_message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"❌ Gmail SMTP Failed: {str(e)}")
        
        # Fallback to Resend API
        resend_api_key = os.getenv('RESEND_API_KEY')
        if resend_api_key:
            try:
                import requests
                print("📤 Attempting Resend API Fallback...")
                response = requests.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "from": "SevaMarg <onboarding@resend.dev>",
                        "to": [email],
                        "subject": subject,
                        "html": html_message,
                    }
                )
                if response.status_code in [200, 201]:
                    print(f"✅ Resend API Fallback successful for {email}")
                    return True
                else:
                    print(f"❌ Resend API Error: {response.text}")
            except Exception as re:
                print(f"❌ Resend Fallback Failed: {str(re)}")
        
        print(f"❌ Final Reset Email Failure for {email}")
        return False

class PasswordResetRequestView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        try:
            email = request.data.get('email', '').strip().lower()
            if not email:
                return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

            # Check if user exists (Silent fail for security)
            user_exists = User.objects.filter(email__iexact=email).exists()
            
            if user_exists:
                # Clean up old tokens for this email
                PasswordResetOTP.objects.filter(email__iexact=email).delete()
                
                otp_code = str(random.randint(100000, 999999))
                PasswordResetOTP.objects.create(email=email, otp=otp_code)
                
                print(f"🔑 Password Reset Requested for {email}. OTP: {otp_code}")
                # Send email in a background thread to prevent API hang
                import threading
                email_thread = threading.Thread(
                    target=send_password_reset_email,
                    args=(email, otp_code)
                )
                email_thread.start()
            else:
                print(f"❌ Reset Failed: No user found with email {email}")

            return Response({"message": "If an account with this email exists, a reset code has been sent."})
        except Exception as e:
            print(f"❌ Forgot Password API Error: {str(e)}")
            return Response({
                "message": "If an account with this email exists, a reset code has been sent.",
                "debug": "System is safe, check logs for details."
            }, status=status.HTTP_200_OK) # Return 200 even on error to prevent timing attacks and crashes

class PasswordResetConfirmView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        try:
            email = request.data.get('email', '').strip().lower()
            otp = request.data.get('otp', '').strip()
            new_password = request.data.get('password', '').strip()

            if not all([email, otp, new_password]):
                return Response({"error": "Email, OTP, and new password are required."}, status=status.HTTP_400_BAD_REQUEST)

            reset_obj = PasswordResetOTP.objects.filter(email__iexact=email, otp=otp, is_used=False).first()

            if not reset_obj or reset_obj.is_expired():
                return Response({"error": "Invalid or expired reset code."}, status=status.HTTP_400_BAD_REQUEST)

            # Update User Password
            user = User.objects.filter(email__iexact=email).first()
            if user:
                user.set_password(new_password)
                user.save()
                
                # Mark token as used
                reset_obj.is_used = True
                reset_obj.save()
                # Clean up
                reset_obj.delete()
                
                print(f"✅ Password successfully reset for {email}")
                return Response({"success": True, "message": "Password successfully reset. You can now login."})
            
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"❌ Password Reset Confirm Error: {str(e)}")
            return Response({"error": "An unexpected error occurred during password reset."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
