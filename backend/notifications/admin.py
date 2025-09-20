from django.contrib import admin
from django.utils.html import format_html
from .models import Notification, NotificationPreference, NotificationTemplate, BulkNotification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'type', 'priority', 'is_read', 'email_sent', 'created_at']
    list_filter = ['type', 'priority', 'is_read', 'email_sent', 'created_at']
    search_fields = ['user__email', 'title', 'body']
    list_editable = ['is_read']
    readonly_fields = ['created_at', 'read_at', 'email_sent_at']
    
    fieldsets = (
        ('Notification Details', {
            'fields': ('user', 'type', 'priority', 'title', 'body', 'link')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at', 'email_sent', 'email_sent_at')
        }),
        ('Additional Data', {
            'fields': ('metadata', 'expires_at'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_as_read', 'mark_as_unread', 'send_email']
    
    def mark_as_read(self, request, queryset):
        count = 0
        for notification in queryset:
            if not notification.is_read:
                notification.mark_as_read()
                count += 1
        self.message_user(request, f"{count} notifications marked as read.")
    mark_as_read.short_description = "Mark selected notifications as read"
    
    def mark_as_unread(self, request, queryset):
        queryset.update(is_read=False, read_at=None)
        self.message_user(request, f"{queryset.count()} notifications marked as unread.")
    mark_as_unread.short_description = "Mark selected notifications as unread"


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_announcements', 'email_project_updates', 'email_marketing', 'digest_frequency']
    list_filter = ['email_announcements', 'email_marketing', 'digest_frequency', 'push_enabled']
    search_fields = ['user__email']
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Email Preferences', {
            'fields': ('email_announcements', 'email_project_updates', 'email_hire_requests',
                      'email_messages', 'email_reminders', 'email_marketing')
        }),
        ('Push Notifications', {
            'fields': ('push_enabled', 'push_announcements', 'push_messages'),
            'classes': ('collapse',)
        }),
        ('Frequency & Timing', {
            'fields': ('digest_frequency', 'quiet_hours_start', 'quiet_hours_end', 'timezone')
        }),
    )


@admin.register(NotificationTemplate)
class NotificationTemplateAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'is_active', 'updated_at']
    list_filter = ['type', 'is_active']
    search_fields = ['name', 'email_subject', 'notification_title']
    list_editable = ['is_active']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'type', 'is_active')
        }),
        ('Email Template', {
            'fields': ('email_subject', 'email_body_text', 'email_body_html')
        }),
        ('In-App Notification', {
            'fields': ('notification_title', 'notification_body')
        }),
        ('Help', {
            'fields': ('variables_help',),
            'classes': ('collapse',)
        }),
    )


@admin.register(BulkNotification)
class BulkNotificationAdmin(admin.ModelAdmin):
    list_display = ['title', 'type', 'is_sent', 'total_recipients', 'sent_at', 'sent_by']
    list_filter = ['type', 'is_sent', 'send_email', 'send_push', 'created_at']
    search_fields = ['title', 'body']
    readonly_fields = ['is_sent', 'sent_at', 'total_recipients', 'email_sent_count', 'notifications_created']
    
    fieldsets = (
        ('Notification Content', {
            'fields': ('title', 'body', 'type')
        }),
        ('Targeting', {
            'fields': ('target_all_users', 'target_user_roles', 'target_user_ids')
        }),
        ('Delivery Options', {
            'fields': ('send_email', 'send_push')
        }),
        ('Status', {
            'fields': ('is_sent', 'sent_at', 'sent_by', 'total_recipients', 
                      'email_sent_count', 'notifications_created'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['send_bulk_notifications']
    
    def send_bulk_notifications(self, request, queryset):
        from .tasks import send_bulk_notification
        
        count = 0
        for bulk_notification in queryset:
            if not bulk_notification.is_sent:
                send_bulk_notification.delay(bulk_notification.id)
                count += 1
        
        self.message_user(request, f"{count} bulk notifications queued for sending.")
    send_bulk_notifications.short_description = "Send selected bulk notifications"