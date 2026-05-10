from django.urls import path
from .views import (
    RegisterView, ProfileView, LogoutView, UserListView, UserStatsView,
    SocialAuthGoogleView, FirebaseAuthView, VolunteerApplicationView, 
    VolunteerApplicationAdminListView, VolunteerApplicationAdminDetailView,
    ChangePasswordView, CustomTokenObtainPairView, GetAdminIdView
)
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('auth/firebase/', FirebaseAuthView.as_view(), name='firebase-auth'),
    path('auth/google/', SocialAuthGoogleView.as_view(), name='social_auth_google'),
    path('list/', UserListView.as_view(), name='user_list'),
    path('stats/', UserStatsView.as_view(), name='user_stats'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='auth_logout'),
    path('profile/', ProfileView.as_view(), name='auth_profile'),
    path('admin-id/', GetAdminIdView.as_view(), name='admin_id'),
    path('change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    # Firebase Auth sync
    path('auth/firebase/', SocialAuthGoogleView.as_view(), name='auth_firebase'),
    path('volunteer/', VolunteerApplicationView.as_view(), name='volunteer_apply'),
    path('volunteer/admin/list/', VolunteerApplicationAdminListView.as_view(), name='volunteer_admin_list'),
    path('volunteer/admin/<int:pk>/', VolunteerApplicationAdminDetailView.as_view(), name='volunteer_admin_detail'),
]
