from celery import shared_task
from django.utils import timezone
from .models import AnalyticsEvent
from django.contrib.auth import get_user_model

User = get_user_model()


@shared_task
def track_event(event_type, metadata=None, user_id=None, session_key=None, ip_address=None, user_agent=None, referrer=None):
    """Track analytics event asynchronously"""
    try:
        user = None
        if user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
        
        AnalyticsEvent.objects.create(
            event_type=event_type,
            user=user,
            session_id=session_key or '',
            metadata=metadata or {},
            ip_address=ip_address,
            user_agent=user_agent or '',
            referrer=referrer or ''
        )
        
        return f"Tracked event: {event_type}"
        
    except Exception as e:
        return f"Error tracking event {event_type}: {e}"


@shared_task
def track_page_view(path, title=None, user_id=None, session_key=None, ip_address=None, user_agent=None, referrer=None):
    """Track page view event"""
    return track_event(
        event_type='page_view',
        metadata={
            'path': path,
            'title': title,
            'timestamp': timezone.now().isoformat()
        },
        user_id=user_id,
        session_key=session_key,
        ip_address=ip_address,
        user_agent=user_agent,
        referrer=referrer
    )


@shared_task
def track_user_action(action_type, user_id, metadata=None, session_key=None):
    """Track user-specific actions"""
    return track_event(
        event_type=action_type,
        metadata=metadata or {},
        user_id=user_id,
        session_key=session_key
    )