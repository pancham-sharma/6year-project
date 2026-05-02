from django.urls import path
from .views import (
    RegisterView, ProfileView, LogoutView, UserListView,
    SocialAuthGoogleView, PasswordResetRequestView, PasswordResetConfirmView,
    VolunteerApplicationView, VolunteerApplicationAdminListView, VolunteerApplicationAdminDetailView
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('list/', UserListView.as_view(), name='user_list'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('profile/', ProfileView.as_view(), name='auth_profile'),
    
    # Social Auth & Password Reset
    path('auth/google/', SocialAuthGoogleView.as_view(), name='auth_google'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('volunteer/', VolunteerApplicationView.as_view(), name='volunteer_apply'),
    path('volunteer/admin/list/', VolunteerApplicationAdminListView.as_view(), name='volunteer_admin_list'),
    path('volunteer/admin/<int:pk>/', VolunteerApplicationAdminDetailView.as_view(), name='volunteer_admin_detail'),
]
