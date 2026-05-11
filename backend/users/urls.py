from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='auth_register'),
    path('auth/firebase/', views.SocialAuthGoogleView.as_view(), name='auth_firebase'),
    path('list/', views.UserListView.as_view(), name='user_list'),
    path('stats/', views.UserStatsView.as_view(), name='user_stats'),
    path('login/', views.CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', views.LogoutView.as_view(), name='auth_logout'),
    path('profile/', views.ProfileView.as_view(), name='auth_profile'),
    path('admin-id/', views.GetAdminIdView.as_view(), name='admin_id'),
    path('change-password/', views.ChangePasswordView.as_view(), name='auth_change_password'),
    path('volunteer/', views.VolunteerApplicationView.as_view(), name='volunteer_apply'),
    path('volunteer/status/', views.VolunteerApplicationView.as_view(), name='volunteer_status'),
    path('volunteer/admin/list/', views.VolunteerApplicationAdminListView.as_view(), name='volunteer_admin_list'),
    path('volunteer/admin/active/', views.ActiveVolunteerListView.as_view(), name='volunteer_active_list'),
    path('volunteer/admin/<int:pk>/', views.VolunteerApplicationAdminDetailView.as_view(), name='volunteer_admin_detail'),
    path('auth/check-email-status/<str:email>/', views.CheckEmailStatusView.as_view(), name='check_email_status'),
]
