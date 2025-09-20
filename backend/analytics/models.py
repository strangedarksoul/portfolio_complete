from django.db import models
from django.contrib.auth import get_user_model
from core.models import TimeStampedModel

User = get_user_model()


class AnalyticsEvent(TimeStampedModel):
    """Analytics events for tracking user behavior"""
    EVENT_TYPES = [
        ('page_view', 'Page View'),
        ('api_request', 'API Request'),
        ('project_view', 'Project View'),
        ('casestudy_view', 'Case Study View'),
        ('gig_view', 'Gig View'),
        ('gig_click', 'Gig Click'),
        ('skill_explore', 'Skill Explore'),
        ('chat_query', 'Chat Query'),
        ('chat_feedback', 'Chat Feedback'),
        ('hire_request', 'Hire Request'),
        ('hire_form_start', 'Hire Form Start'),
        ('hire_form_step', 'Hire Form Step'),
        ('hire_form_submit', 'Hire Form Submit'),
        ('hire_form_files_uploaded', 'Hire Form Files Uploaded'),
        ('user_registration', 'User Registration'),
        ('user_login', 'User Login'),
        ('user_logout', 'User Logout'),
        ('portal_visit', 'Portal Visit'),
        ('portal_name_entered', 'Portal Name Entered'),
        ('portal_skipped', 'Portal Skipped'),
        ('consent_given', 'Consent Given'),
        ('notification_read', 'Notification Read'),
        ('notifications_mark_all_read', 'Notifications Mark All Read'),
        ('notifications_mark_read', 'Notifications Mark Read'),
        ('notification_preferences_updated', 'Notification Preferences Updated'),
        ('notification_subscribe', 'Notification Subscribe'),
        ('notification_subscribe_anonymous', 'Notification Subscribe Anonymous'),
        ('email_open', 'Email Open'),
        ('link_click', 'Link Click'),
        ('chat_opened_from_home', 'Chat Opened From Home'),
        ('chat_opened_from_project', 'Chat Opened From Project'),
        ('chat_opened_from_project_detail', 'Chat Opened From Project Detail'),
        ('chat_opened_from_gig', 'Chat Opened From Gig'),
        ('chat_opened_from_casestudy', 'Chat Opened From Case Study'),
        ('chat_opened_from_skill', 'Chat Opened From Skill'),
        ('chat_opened_from_achievements', 'Chat Opened From Achievements'),
        ('chat_opened_from_roadmap', 'Chat Opened From Roadmap'),
        ('chat_opened_from_testimonials', 'Chat Opened From Testimonials'),
        ('chat_opened_from_blog', 'Chat Opened From Blog'),
        ('chat_opened_from_playground', 'Chat Opened From Playground'),
        ('chat_opened_from_about', 'Chat Opened From About'),
        ('chat_opened_from_resume', 'Chat Opened From Resume'),
        ('chat_opened_from_profile', 'Chat Opened From Profile'),
        ('chat_opened_from_easter_egg', 'Chat Opened From Easter Egg'),
        ('chat_session_feedback', 'Chat Session Feedback'),
        ('quick_action_clicked', 'Quick Action Clicked'),
        ('blog_comment', 'Blog Comment'),
        ('blog_search', 'Blog Search'),
        ('testimonial_submitted', 'Testimonial Submitted'),
        ('resume_download', 'Resume Download'),
        ('avatar_updated', 'Avatar Updated'),
        ('profile_updated', 'Profile Updated'),
        ('data_export_requested', 'Data Export Requested'),
        ('account_deletion_requested', 'Account Deletion Requested'),
        ('email_verified', 'Email Verified'),
        ('email_verification_failed', 'Email Verification Failed'),
        ('password_reset_requested', 'Password Reset Requested'),
        ('password_reset_completed', 'Password Reset Completed'),
        ('auth_error', 'Auth Error'),
        ('experiment_view', 'Experiment View'),
        ('experiment_link_click', 'Experiment Link Click'),
        ('admin_notification_sent', 'Admin Notification Sent'),
        ('admin_chat_session_viewed', 'Admin Chat Session Viewed'),
        ('admin_chat_session_detail_viewed', 'Admin Chat Session Detail Viewed'),
        ('admin_chat_logs_viewed', 'Admin Chat Logs Viewed'),
        ('admin_export', 'Admin Export'),
        ('easter_egg_discovered', 'Easter Egg Discovered'),
        ('easter_egg_revealed', 'Easter Egg Revealed'),
        ('easter_egg_theme_change', 'Easter Egg Theme Change'),
        ('file_download', 'File Download'),
        ('file_upload', 'File Upload'),
        ('search', 'Search'),
        ('form_submit', 'Form Submit'),
        ('error', 'Error'),
    ]
    
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=100, blank=True, help_text="Session ID for anonymous users")
    
    # Event metadata
    metadata = models.JSONField(default=dict, help_text="Additional event data")
    
    # Request context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True)
    
    # Timestamp
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['event_type', '-timestamp']),
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['session_id', '-timestamp']),
        ]
        verbose_name = 'Analytics Event'
        verbose_name_plural = 'Analytics Events'
    
    def __str__(self):
        user_info = self.user.email if self.user else f"Session:{self.session_id[:8]}"
        return f"{self.event_type} - {user_info} ({self.timestamp})"


class PageView(TimeStampedModel):
    """Detailed page view tracking"""
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=100)
    
    # Page information
    path = models.CharField(max_length=500)
    title = models.CharField(max_length=500, blank=True)
    referrer = models.URLField(blank=True)
    
    # User context
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    device_type = models.CharField(
        max_length=20,
        choices=[
            ('desktop', 'Desktop'),
            ('mobile', 'Mobile'),
            ('tablet', 'Tablet'),
            ('bot', 'Bot'),
        ],
        blank=True
    )
    
    # Engagement metrics
    time_on_page = models.PositiveIntegerField(null=True, blank=True, help_text="Time in seconds")
    scroll_depth = models.PositiveSmallIntegerField(null=True, blank=True, help_text="Max scroll depth percentage")
    
    # Geographic data (if available)
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['path', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]
        verbose_name = 'Page View'
        verbose_name_plural = 'Page Views'
    
    def __str__(self):
        user_info = self.user.email if self.user else 'Anonymous'
        return f"{self.path} - {user_info}"


class ConversionFunnel(models.Model):
    """Track conversion funnels and user journeys"""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    # Funnel steps (in order)
    steps = models.JSONField(
        default=list,
        help_text="List of step definitions with event_type and optional filters"
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Conversion Funnel'
        verbose_name_plural = 'Conversion Funnels'
    
    def __str__(self):
        return self.name


class ConversionEvent(TimeStampedModel):
    """Track conversion events within funnels"""
    funnel = models.ForeignKey(ConversionFunnel, on_delete=models.CASCADE, related_name='events')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=100)
    
    step_index = models.PositiveSmallIntegerField(help_text="Step index in the funnel")
    step_name = models.CharField(max_length=100)
    
    # Timing
    time_from_start = models.PositiveIntegerField(help_text="Seconds from funnel start")
    time_from_previous = models.PositiveIntegerField(null=True, blank=True, help_text="Seconds from previous step")
    
    # Additional data
    metadata = models.JSONField(default=dict)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['funnel', 'user']),
            models.Index(fields=['funnel', 'session_id']),
        ]
        verbose_name = 'Conversion Event'
        verbose_name_plural = 'Conversion Events'
    
    def __str__(self):
        return f"{self.funnel.name} - Step {self.step_index}: {self.step_name}"


class AnalyticsSummary(models.Model):
    """Daily analytics summary for performance"""
    date = models.DateField(unique=True)
    
    # Traffic metrics
    total_page_views = models.PositiveIntegerField(default=0)
    unique_visitors = models.PositiveIntegerField(default=0)
    returning_visitors = models.PositiveIntegerField(default=0)
    
    # Project metrics
    project_views = models.PositiveIntegerField(default=0)
    case_study_views = models.PositiveIntegerField(default=0)
    
    # Gig metrics
    gig_views = models.PositiveIntegerField(default=0)
    gig_clicks = models.PositiveIntegerField(default=0)
    hire_requests = models.PositiveIntegerField(default=0)
    
    # Chat metrics
    chat_queries = models.PositiveIntegerField(default=0)
    chat_sessions = models.PositiveIntegerField(default=0)
    
    # User metrics
    new_registrations = models.PositiveIntegerField(default=0)
    user_logins = models.PositiveIntegerField(default=0)
    
    # Top content
    top_projects = models.JSONField(default=list, help_text="Most viewed projects")
    top_skills = models.JSONField(default=list, help_text="Most explored skills")
    top_pages = models.JSONField(default=list, help_text="Most viewed pages")
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']
        verbose_name = 'Analytics Summary'
        verbose_name_plural = 'Analytics Summaries'
    
    def __str__(self):
        return f"Analytics Summary - {self.date}"