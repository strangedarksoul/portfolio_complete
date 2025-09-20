from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework import status
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.http import HttpResponse
import csv

from analytics.models import AnalyticsEvent
from gigs.models import HireRequest
from chat.models import ChatSession, ChatMessage
from notifications.models import Notification
from projects.models import Project

User = get_user_model()


class AdminOverviewView(APIView):
    """Admin dashboard overview with metrics"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        now = timezone.now()
        last_30_days = now - timedelta(days=30)
        last_7_days = now - timedelta(days=7)
        
        # User metrics
        total_users = User.objects.count()
        new_users_30d = User.objects.filter(date_joined__gte=last_30_days).count()
        
        # Project metrics
        total_projects = Project.objects.count()
        published_projects = Project.objects.filter(visibility='public').count()
        
        # Lead metrics
        total_leads = HireRequest.objects.count()
        new_leads_7d = HireRequest.objects.filter(created_at__gte=last_7_days).count()
        leads_by_status = HireRequest.objects.values('status').annotate(count=Count('id'))
        
        # Chat metrics
        total_chat_sessions = ChatSession.objects.count()
        chat_sessions_7d = ChatSession.objects.filter(created_at__gte=last_7_days).count()
        total_messages = ChatMessage.objects.count()
        
        # Analytics events
        top_events = (AnalyticsEvent.objects
                     .filter(timestamp__gte=last_30_days)
                     .values('event_type')
                     .annotate(count=Count('id'))
                     .order_by('-count')[:10])
        
        # Popular projects (by views)
        popular_projects = (AnalyticsEvent.objects
                          .filter(event_type='project_view', timestamp__gte=last_30_days)
                          .values('metadata__project_id')
                          .annotate(views=Count('id'))
                          .order_by('-views')[:10])
        
        return Response({
            'users': {
                'total': total_users,
                'new_30d': new_users_30d,
            },
            'projects': {
                'total': total_projects,
                'published': published_projects,
            },
            'leads': {
                'total': total_leads,
                'new_7d': new_leads_7d,
                'by_status': list(leads_by_status),
            },
            'chat': {
                'total_sessions': total_chat_sessions,
                'sessions_7d': chat_sessions_7d,
                'total_messages': total_messages,
            },
            'analytics': {
                'top_events': list(top_events),
                'popular_projects': list(popular_projects),
            },
            'generated_at': now,
        })


class SendNotificationView(APIView):
    """Send notifications to users"""
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        title = request.data.get('title')
        body = request.data.get('body')
        link = request.data.get('link', '')
        user_group = request.data.get('user_group', 'all')  # all, admins, recent
        
        if not title or not body:
            return Response(
                {'error': 'Title and body are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Determine target users
        if user_group == 'admins':
            users = User.objects.filter(is_staff=True)
        elif user_group == 'recent':
            last_week = timezone.now() - timedelta(days=7)
            users = User.objects.filter(date_joined__gte=last_week)
        else:
            users = User.objects.filter(is_active=True)
        
        # Create notifications
        notifications = [
            Notification(
                user=user,
                type='announcement',
                title=title,
                body=body,
                link=link
            )
            for user in users
        ]
        
        Notification.objects.bulk_create(notifications)
        
        return Response({
            'status': 'success',
            'notifications_sent': len(notifications),
            'user_group': user_group
        })


class LeadManagementView(APIView):
    """Manage hire requests/leads"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        leads = HireRequest.objects.select_related('user', 'selected_gig').order_by('-created_at')
        
        leads_data = []
        for lead in leads[:50]:  # Limit to recent 50
            leads_data.append({
                'id': lead.id,
                'name': lead.name,
                'email': lead.email,
                'company': lead.company,
                'status': lead.status,
                'gig_title': lead.selected_gig.title if lead.selected_gig else None,
                'budget': lead.proposed_budget,
                'timeline': lead.timeline,
                'created_at': lead.created_at,
                'updated_at': lead.updated_at,
            })
        
        return Response({
            'leads': leads_data,
            'status_counts': dict(HireRequest.objects.values_list('status').annotate(Count('id')))
        })


class LeadDetailView(APIView):
    """Get and update specific lead"""
    permission_classes = [IsAdminUser]
    
    def get(self, request, lead_id):
        try:
            lead = HireRequest.objects.select_related('user', 'selected_gig').get(id=lead_id)
            return Response({
                'id': lead.id,
                'name': lead.name,
                'email': lead.email,
                'company': lead.company,
                'status': lead.status,
                'message': lead.message,
                'gig': {
                    'id': lead.selected_gig.id,
                    'title': lead.selected_gig.title
                } if lead.selected_gig else None,
                'proposed_budget': lead.proposed_budget,
                'timeline': lead.timeline,
                'uploaded_files': lead.uploaded_files,
                'proposal_preview': lead.proposal_preview,
                'admin_notes': lead.admin_notes,
                'created_at': lead.created_at,
                'updated_at': lead.updated_at,
            })
        except HireRequest.DoesNotExist:
            return Response(
                {'error': 'Lead not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    def patch(self, request, lead_id):
        try:
            lead = HireRequest.objects.get(id=lead_id)
            
            # Update allowed fields
            if 'status' in request.data:
                lead.status = request.data['status']
            if 'admin_notes' in request.data:
                lead.admin_notes = request.data['admin_notes']
            
            lead.save()
            
            return Response({'status': 'success', 'message': 'Lead updated'})
        except HireRequest.DoesNotExist:
            return Response(
                {'error': 'Lead not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class ChatLogsView(APIView):
    """View chat logs and feedback"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        sessions = (ChatSession.objects
                   .prefetch_related('messages')
                   .order_by('-created_at')[:50])
        
        sessions_data = []
        for session in sessions:
            messages = session.messages.order_by('created_at')
            sessions_data.append({
                'id': session.id,
                'user': session.user.email if session.user else 'Anonymous',
                'created_at': session.created_at,
                'message_count': messages.count(),
                'last_message': messages.last().content[:100] if messages.exists() else None,
                'audience_tag': session.audience_tag,
                'average_rating': session.average_rating,
            })
        
        return Response({
            'sessions': sessions_data,
            'total_sessions': ChatSession.objects.count(),
            'total_messages': ChatMessage.objects.count(),
        })


class AnalyticsExportView(APIView):
    """Export analytics data as CSV"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        export_type = request.query_params.get('type', 'events')
        
        response = HttpResponse(content_type='text/csv')
        
        if export_type == 'events':
            response['Content-Disposition'] = 'attachment; filename="analytics_events.csv"'
            writer = csv.writer(response)
            writer.writerow(['Timestamp', 'Event Type', 'User', 'Session ID', 'Metadata'])
            
            events = AnalyticsEvent.objects.select_related('user').order_by('-timestamp')[:1000]
            for event in events:
                writer.writerow([
                    event.timestamp.isoformat(),
                    event.event_type,
                    event.user.email if event.user else 'Anonymous',
                    event.session_id,
                    str(event.metadata)
                ])
        
        elif export_type == 'leads':
            response['Content-Disposition'] = 'attachment; filename="leads.csv"'
            writer = csv.writer(response)
            writer.writerow(['Created', 'Name', 'Email', 'Company', 'Status', 'Budget', 'Timeline'])
            
            leads = HireRequest.objects.order_by('-created_at')
            for lead in leads:
                writer.writerow([
                    lead.created_at.isoformat(),
                    lead.name,
                    lead.email,
                    lead.company,
                    lead.status,
                    lead.proposed_budget,
                    lead.timeline
                ])
        
        return response