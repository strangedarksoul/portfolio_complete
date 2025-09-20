from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications"""
    
    class Meta:
        model = Notification
        fields = [
            'id', 'type', 'priority', 'title', 'body', 'link',
            'is_read', 'read_at', 'created_at', 'metadata'
        ]


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for notification preferences"""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'email_announcements', 'email_project_updates', 'email_hire_requests',
            'email_messages', 'email_reminders', 'email_marketing',
            'push_enabled', 'push_announcements', 'push_messages',
            'digest_frequency', 'quiet_hours_start', 'quiet_hours_end', 'timezone'
        ]


class NotificationMarkReadSerializer(serializers.Serializer):
    """Serializer for marking notifications as read"""
    notification_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=True
    )
    mark_all_read = serializers.BooleanField(default=False)


class NotificationSubscribeSerializer(serializers.Serializer):
    """Serializer for notification subscription"""
    email_notifications = serializers.BooleanField(default=True)
    marketing_emails = serializers.BooleanField(default=False)
    digest_frequency = serializers.ChoiceField(
        choices=[('never', 'Never'), ('daily', 'Daily'), ('weekly', 'Weekly')],
        default='weekly'
    )