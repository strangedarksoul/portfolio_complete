from rest_framework import serializers
from .models import AnalyticsEvent


class AnalyticsEventSerializer(serializers.ModelSerializer):
    """Serializer for creating analytics events"""
    
    class Meta:
        model = AnalyticsEvent
        fields = ['event_type', 'metadata']
    
    def create(self, validated_data):
        request = self.context.get('request')
        
        event = AnalyticsEvent.objects.create(
            event_type=validated_data['event_type'],
            metadata=validated_data.get('metadata', {}),
            user=request.user if request and request.user.is_authenticated else None,
            session_id=request.session.session_key if request else '',
            ip_address=self.get_client_ip(request) if request else '',
            user_agent=request.META.get('HTTP_USER_AGENT', '') if request else '',
            referrer=request.META.get('HTTP_REFERER', '') if request else ''
        )
        
        return event
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class AnalyticsQuerySerializer(serializers.Serializer):
    """Serializer for analytics queries"""
    event_type = serializers.CharField(required=False)
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    user_id = serializers.IntegerField(required=False)
    group_by = serializers.ChoiceField(
        choices=['hour', 'day', 'week', 'month'],
        default='day'
    )