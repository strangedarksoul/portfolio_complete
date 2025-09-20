import json
import uuid
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser
from analytics.models import AnalyticsEvent


class AnalyticsMiddleware(MiddlewareMixin):
    """Middleware to track analytics events"""
    
    def process_request(self, request):
        # Add session ID for anonymous users
        if not request.session.session_key:
            request.session.create()
        
        # Track page views for API endpoints
        if request.path.startswith('/api/v1/'):
            self.track_api_request(request)
    
    def track_api_request(self, request):
        """Track API requests as analytics events"""
        try:
            # Skip tracking for certain endpoints
            skip_paths = ['/api/v1/analytics/event', '/api/v1/auth/refresh', '/api/schema/']
            if any(path in request.path for path in skip_paths):
                return
            
            user = request.user if request.user.is_authenticated else None
            
            AnalyticsEvent.objects.create(
                event_type='api_request',
                user=user,
                session_id=request.session.session_key,
                metadata={
                    'path': request.path,
                    'method': request.method,
                    'user_agent': request.META.get('HTTP_USER_AGENT', ''),
                    'ip_address': self.get_client_ip(request),
                }
            )
        except Exception:
            # Silently fail - don't break the request
            pass
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip