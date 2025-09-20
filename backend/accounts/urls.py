from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'accounts'

urlpatterns = [
    path('register', views.UserRegistrationView.as_view(), name='register'),
    path('login', views.UserLoginView.as_view(), name='login'),
    path('refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout', views.UserLogoutView.as_view(), name='logout'),
    path('verify', views.EmailVerificationView.as_view(), name='verify_email'),
    path('password-reset', views.PasswordResetRequestView.as_view(), name='password_reset'),
    path('password-reset/confirm', views.PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    path('profile', views.UserProfileView.as_view(), name='profile'),
    path('avatar', views.UserAvatarUpdateView.as_view(), name='avatar_update'),
]