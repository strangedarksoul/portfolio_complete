from django.contrib.auth.models import AbstractUser
from django.db import models
from versatileimagefield.fields import VersatileImageField
import uuid


class User(AbstractUser):
    """Custom user model"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    display_name = models.CharField(max_length=100, blank=True)
    avatar = VersatileImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(blank=True)
    
    # Role management
    ROLE_CHOICES = [
        ('visitor', 'Visitor'),
        ('client', 'Client'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='visitor')
    
    # Email verification
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True)
    
    # Preferences
    email_notifications = models.BooleanField(default=True)
    site_notifications = models.BooleanField(default=True)
    marketing_emails = models.BooleanField(default=False)
    
    # Tracking
    last_activity = models.DateTimeField(null=True, blank=True)
    login_count = models.PositiveIntegerField(default=0)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        return self.full_name or self.display_name or self.username
    
    def get_short_name(self):
        return self.display_name or self.first_name or self.username
    
    @property
    def is_client(self):
        return self.role == 'client'
    
    @property
    def is_admin_user(self):
        return self.role == 'admin' or self.is_staff or self.is_superuser


class UserProfile(models.Model):
    """Extended user profile information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Professional information
    job_title = models.CharField(max_length=255, blank=True)
    company = models.CharField(max_length=255, blank=True)
    website = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    
    # Interests and interaction history
    interested_services = models.JSONField(default=list, help_text="List of service categories user is interested in")
    project_bookmarks = models.JSONField(default=list, help_text="List of bookmarked project IDs")
    chat_preferences = models.JSONField(default=dict, help_text="Chat persona and interaction preferences")
    
    # Consent and privacy
    terms_accepted = models.BooleanField(default=False)
    privacy_accepted = models.BooleanField(default=False)
    consent_date = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"Profile for {self.user.email}"


class PasswordResetToken(models.Model):
    """Password reset tokens"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)
    
    class Meta:
        verbose_name = 'Password Reset Token'
        verbose_name_plural = 'Password Reset Tokens'
    
    def __str__(self):
        return f"Reset token for {self.user.email}"