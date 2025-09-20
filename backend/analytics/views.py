from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta, datetime
import json

from .models import AnalyticsEvent, PageView, AnalyticsSummary
from .serializers import AnalyticsEventSerializer, AnalyticsQuerySerializer


class AnalyticsEventCreateView(generics.CreateAPIView):
    """Create analytics event"""
    permission_classes = [AllowAny]
    queryset = AnalyticsEvent.objects.all()
    serializer_class = AnalyticsEventSerializer
    
    def create(self, request, *args, **kwargs):
        # Rate limiting to prevent spam
        from django_ratelimit.decorators import ratelimit
        from django.views.decorators.csrf import csrf_exempt
        from django.utils.decorators import method_decorator
        
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            event = serializer.save()
            return Response({
                'status': 'success',
                'event_id': event.id,
                'timestamp': event.timestamp
            }, status=status.HTTP_201_CREATED)
        else:
            # Debug logging for analytics errors
            print("Analytics Event Serializer Errors:", serializer.errors)
            print("Request Data:", request.data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AnalyticsDashboardView(APIView):
    """Analytics dashboard data"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        now = timezone.now()
        last_30_days = now - timedelta(days=30)
        last_7_days = now - timedelta(days=7)
        yesterday = now - timedelta(days=1)
        
        # Basic metrics
        total_events = AnalyticsEvent.objects.count()
        events_30d = AnalyticsEvent.objects.filter(timestamp__gte=last_30_days).count()
        events_7d = AnalyticsEvent.objects.filter(timestamp__gte=last_7_days).count()
        events_yesterday = AnalyticsEvent.objects.filter(timestamp__gte=yesterday).count()
        
        # Top events in last 30 days
        top_events = (AnalyticsEvent.objects
                     .filter(timestamp__gte=last_30_days)
                     .values('event_type')
                     .annotate(count=Count('id'))
                     .order_by('-count')[:10])
        
        # Page views
        page_views_30d = AnalyticsEvent.objects.filter(
            event_type='page_view',
            timestamp__gte=last_30_days
        ).count()
        
        # Unique visitors (approximate)
        unique_sessions_30d = (AnalyticsEvent.objects
                              .filter(timestamp__gte=last_30_days)
                              .values('session_id')
                              .distinct()
                              .count())
        
        # Project views
        project_views_30d = AnalyticsEvent.objects.filter(
            event_type='project_view',
            timestamp__gte=last_30_days
        ).count()
        
        # Gig interactions
        gig_views_30d = AnalyticsEvent.objects.filter(
            event_type='gig_view',
            timestamp__gte=last_30_days
        ).count()
        
        gig_clicks_30d = AnalyticsEvent.objects.filter(
            event_type='gig_click',
            timestamp__gte=last_30_days
        ).count()
        
        # Hire requests
        hire_requests_30d = AnalyticsEvent.objects.filter(
            event_type='hire_request',
            timestamp__gte=last_30_days
        ).count()
        
        # Chat metrics
        chat_queries_30d = AnalyticsEvent.objects.filter(
            event_type='chat_query',
            timestamp__gte=last_30_days
        ).count()
        
        # User registrations
        registrations_30d = AnalyticsEvent.objects.filter(
            event_type='user_registration',
            timestamp__gte=last_30_days
        ).count()
        
        # Daily breakdown for last 30 days
        daily_events = []
        for i in range(30):
            day = now - timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            day_count = AnalyticsEvent.objects.filter(
                timestamp__gte=day_start,
                timestamp__lt=day_end
            ).count()
            
            daily_events.append({
                'date': day_start.date().isoformat(),
                'events': day_count
            })
        
        daily_events.reverse()  # Show oldest first
        
        return Response({
            'overview': {
                'total_events': total_events,
                'events_30d': events_30d,
                'events_7d': events_7d,
                'events_yesterday': events_yesterday,
                'page_views_30d': page_views_30d,
                'unique_sessions_30d': unique_sessions_30d,
            },
            'content_metrics': {
                'project_views_30d': project_views_30d,
                'gig_views_30d': gig_views_30d,
                'gig_clicks_30d': gig_clicks_30d,
                'hire_requests_30d': hire_requests_30d,
                'chat_queries_30d': chat_queries_30d,
            },
            'user_metrics': {
                'registrations_30d': registrations_30d,
            },
            'top_events': list(top_events),
            'daily_events': daily_events,
            'generated_at': now.isoformat(),
        })


class AnalyticsEventsView(generics.ListAPIView):
    """List analytics events with filtering"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        serializer = AnalyticsQuerySerializer(data=request.query_params)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        queryset = AnalyticsEvent.objects.all()
        
        # Apply filters
        if data.get('event_type'):
            queryset = queryset.filter(event_type=data['event_type'])
        
        if data.get('start_date'):
            queryset = queryset.filter(timestamp__gte=data['start_date'])
        
        if data.get('end_date'):
            end_date = datetime.combine(data['end_date'], datetime.max.time())
            queryset = queryset.filter(timestamp__lte=end_date)
        
        if data.get('user_id'):
            queryset = queryset.filter(user_id=data['user_id'])
        
        # Group by time period
        group_by = data.get('group_by', 'day')
        
        if group_by == 'hour':
            # Group by hour
            events = (queryset
                     .extra(select={'hour': 'date_trunc(\'hour\', timestamp)'})
                     .values('hour', 'event_type')
                     .annotate(count=Count('id'))
                     .order_by('hour', 'event_type'))
        elif group_by == 'day':
            # Group by day
            events = (queryset
                     .extra(select={'day': 'date_trunc(\'day\', timestamp)'})
                     .values('day', 'event_type')
                     .annotate(count=Count('id'))
                     .order_by('day', 'event_type'))
        else:
            # Return raw events (limited)
            events = queryset.order_by('-timestamp')[:100]
            events_data = []
            for event in events:
                events_data.append({
                    'id': event.id,
                    'event_type': event.event_type,
                    'user': event.user.email if event.user else 'Anonymous',
                    'session_id': event.session_id,
                    'timestamp': event.timestamp,
                    'metadata': event.metadata,
                })
            
            return Response({
                'events': events_data,
                'total': queryset.count()
            })
        
        return Response({
            'events': list(events),
            'total': queryset.count()
        })


class AnalyticsSummaryView(APIView):
    """Get analytics summary data"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Get last 30 days of summaries
        summaries = AnalyticsSummary.objects.all()[:30]
        
        summary_data = []
        for summary in summaries:
            summary_data.append({
                'date': summary.date,
                'total_page_views': summary.total_page_views,
                'unique_visitors': summary.unique_visitors,
                'project_views': summary.project_views,
                'gig_views': summary.gig_views,
                'hire_requests': summary.hire_requests,
                'chat_queries': summary.chat_queries,
                'new_registrations': summary.new_registrations,
                'top_projects': summary.top_projects,
                'top_skills': summary.top_skills,
            })
        
        return Response({
            'summaries': summary_data,
            'total_summaries': len(summary_data)
        })