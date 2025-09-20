from django.db import models
from django.contrib.auth import get_user_model
from core.models import TimeStampedModel

User = get_user_model()


class Notification(TimeStampedModel):
    """User notifications"""
    TYPE_CHOICES = [
        ('welcome', 'Welcome'),
        ('announcement', 'Announcement'),
        ('project_update', 'Project Update'),
        ('hire_request', 'Hire Request'),
        ('message', 'Message'),
        ('reminder', 'Reminder'),
        ('system', 'System'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('normal', 'Normal'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='message')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='normal')
    
    title = models.CharField(max_length=255)
    body = models.TextField()
    link = models.URLField(blank=True, help_text="Internal link for the notification")
    
    # Status
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    # Email notification
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    metadata = models.JSONField(default=dict, help_text="Additional notification data")
    
    # Expiration
    expires_at = models.DateTimeField(null=True, blank=True, help_text="When notification should be automatically removed")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['user', 'is_read']),
        ]
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
    
    def __str__(self):
        return f"{self.user.email} - {self.title}"
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            from django.utils import timezone
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])


class NotificationPreference(models.Model):
    """User notification preferences"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preferences')
    
    # Email preferences
    email_announcements = models.BooleanField(default=True)
    email_project_updates = models.BooleanField(default=True)
    email_hire_requests = models.BooleanField(default=True)
    email_messages = models.BooleanField(default=True)
    email_reminders = models.BooleanField(default=True)
    email_marketing = models.BooleanField(default=False)
    
    # Push notification preferences (for future implementation)
    push_enabled = models.BooleanField(default=False)
    push_announcements = models.BooleanField(default=True)
    push_messages = models.BooleanField(default=True)
    
    # Frequency settings
    digest_frequency = models.CharField(
        max_length=10,
        choices=[
            ('never', 'Never'),
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
        ],
        default='weekly'
    )
    
    # Quiet hours
    quiet_hours_start = models.TimeField(null=True, blank=True, help_text="Start of quiet hours (no notifications)")
    quiet_hours_end = models.TimeField(null=True, blank=True, help_text="End of quiet hours")
    timezone = models.CharField(max_length=50, default='UTC')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'
    
    def __str__(self):
        return f"Preferences for {self.user.email}"


class NotificationTemplate(models.Model):
    """Templates for different notification types"""
    name = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=20, choices=Notification.TYPE_CHOICES)
    
    # Email template
    email_subject = models.CharField(max_length=255)
    email_body_text = models.TextField(help_text="Plain text email body")
    email_body_html = models.TextField(help_text="HTML email body")
    
    # In-app template
    notification_title = models.CharField(max_length=255)
    notification_body = models.TextField()
    
    # Template variables help
    variables_help = models.TextField(
        blank=True,
        help_text="Available template variables (e.g., {user_name}, {project_title})"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Notification Template'
        verbose_name_plural = 'Notification Templates'
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"


class BulkNotification(TimeStampedModel):
    """Track bulk notifications sent to multiple users"""
    title = models.CharField(max_length=255)
    body = models.TextField()
    type = models.CharField(max_length=20, choices=Notification.TYPE_CHOICES, default='announcement')
    
    # Targeting
    target_all_users = models.BooleanField(default=False)
    target_user_roles = models.JSONField(default=list, help_text="Target specific user roles")
    target_user_ids = models.JSONField(default=list, help_text="Target specific user IDs")
    
    # Delivery
    send_email = models.BooleanField(default=True)
    send_push = models.BooleanField(default=False)
    
    # Status
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    # Statistics
    total_recipients = models.PositiveIntegerField(default=0)
    email_sent_count = models.PositiveIntegerField(default=0)
    notifications_created = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Bulk Notification'
        verbose_name_plural = 'Bulk Notifications'
    
    def __str__(self):
        return f"Bulk: {self.title} ({self.total_recipients} recipients)"