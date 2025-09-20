from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, PasswordResetToken


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'full_name', 'role', 'is_email_verified', 'date_joined', 'last_login']
    list_filter = ['role', 'is_email_verified', 'is_active', 'is_staff', 'date_joined']
    search_fields = ['email', 'username', 'full_name']
    ordering = ['-date_joined']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile Information', {
            'fields': ('full_name', 'display_name', 'avatar', 'bio', 'role')
        }),
        ('Email Verification', {
            'fields': ('is_email_verified', 'email_verification_token')
        }),
        ('Preferences', {
            'fields': ('email_notifications', 'site_notifications', 'marketing_emails')
        }),
        ('Activity Tracking', {
            'fields': ('last_activity', 'login_count'),
            'classes': ('collapse',)
        }),
    )
    
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Profile Information', {
            'fields': ('full_name', 'display_name', 'role')
        }),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'company', 'job_title', 'terms_accepted', 'privacy_accepted', 'created_at']
    list_filter = ['terms_accepted', 'privacy_accepted', 'created_at']
    search_fields = ['user__email', 'company', 'job_title']
    raw_id_fields = ['user']


@admin.register(PasswordResetToken)
class PasswordResetTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'token', 'created_at', 'is_used']
    list_filter = ['is_used', 'created_at']
    search_fields = ['user__email', 'token']
    readonly_fields = ['token', 'created_at']