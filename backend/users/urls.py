from django.urls import path
from .views import (
    RegisterView, ProfileView, LogoutView, UserListView,
    SocialAuthGoogleView, PasswordResetRequestView, PasswordResetConfirmView,
    VolunteerApplicationView, VolunteerApplicationAdminListView, VolunteerApplicationAdminDetailView,
    ChangePasswordView, VerifyEmailView, ResendOTPView,
    TwoFactorSetupView, TwoFactorVerifyView, TwoFactorDisableView, CustomTokenObtainPairView, GetAdminIdView
)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('list/', UserListView.as_view(), name='user_list'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('profile/', ProfileView.as_view(), name='auth_profile'),
    path('admin-id/', GetAdminIdView.as_view(), name='admin_id'),
    path('change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('2fa/setup/', TwoFactorSetupView.as_view(), name='2fa_setup'),
    path('2fa/verify/', TwoFactorVerifyView.as_view(), name='2fa_verify'),
    path('2fa/disable/', TwoFactorDisableView.as_view(), name='2fa_disable'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend_otp'),
    
    # Social Auth & Password Reset
    path('auth/google/', SocialAuthGoogleView.as_view(), name='auth_google'),
    path('forgot-password/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('reset-password/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('volunteer/', VolunteerApplicationView.as_view(), name='volunteer_apply'),
    path('volunteer/admin/list/', VolunteerApplicationAdminListView.as_view(), name='volunteer_admin_list'),
    path('volunteer/admin/<int:pk>/', VolunteerApplicationAdminDetailView.as_view(), name='volunteer_admin_detail'),
]
