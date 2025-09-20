from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q

from .models import Notification, NotificationPreference
from .serializers import (
    NotificationSerializer, NotificationPreferenceSerializer,
    NotificationMarkReadSerializer, NotificationSubscribeSerializer
)
from analytics.models import AnalyticsEvent


class NotificationListView(generics.ListAPIView):
    """List user notifications"""
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    
    def get_queryset(self):
        queryset = Notification.objects.filter(user=self.request.user)
        
        # Filter by read status
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        # Filter by type
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(type=notification_type)
        
        # Remove expired notifications
        now = timezone.now()
        queryset = queryset.filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
        
        return queryset.order_by('-created_at')


class UnreadCountView(APIView):
    """Get count of unread notifications"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        count = Notification.objects.filter(
            user=request.user,
            is_read=False
        ).filter(
            Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())
        ).count()
        
        return Response({'unread_count': count})


class MarkNotificationsReadView(APIView):
    """Mark notifications as read"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = NotificationMarkReadSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            if data.get('mark_all_read'):
                # Mark all notifications as read
                notifications = Notification.objects.filter(
                    user=request.user,
                    is_read=False
                )
                count = 0
                for notification in notifications:
                    notification.mark_as_read()
                    count += 1
                
                # Track analytics
                AnalyticsEvent.objects.create(
                    event_type='notifications_mark_all_read',
                    user=request.user,
                    metadata={'count': count}
                )
                
                return Response({
                    'status': 'success',
                    'message': f'{count} notifications marked as read'
                })
            
            elif data.get('notification_ids'):
                # Mark specific notifications as read
                notification_ids = data['notification_ids']
                notifications = Notification.objects.filter(
                    user=request.user,
                    id__in=notification_ids,
                    is_read=False
                )
                
                count = 0
                for notification in notifications:
                    notification.mark_as_read()
                    count += 1
                
                # Track analytics
                AnalyticsEvent.objects.create(
                    event_type='notifications_mark_read',
                    user=request.user,
                    metadata={'count': count, 'ids': notification_ids}
                )
                
                return Response({
                    'status': 'success',
                    'message': f'{count} notifications marked as read'
                })
            
            else:
                return Response({
                    'error': 'Either mark_all_read or notification_ids is required'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MarkSingleNotificationReadView(APIView):
    """Mark single notification as read"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            notification = Notification.objects.get(
                id=pk,
                user=request.user
            )
            notification.mark_as_read()
            
            # Track analytics
            AnalyticsEvent.objects.create(
                event_type='notification_read',
                user=request.user,
                metadata={
                    'notification_id': notification.id,
                    'notification_type': notification.type
                }
            )
            
            return Response({'status': 'success', 'message': 'Notification marked as read'})
        
        except Notification.DoesNotExist:
            return Response({
                'error': 'Notification not found'
            }, status=status.HTTP_404_NOT_FOUND)


class NotificationPreferencesView(generics.RetrieveUpdateAPIView):
    """Get and update notification preferences"""
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationPreferenceSerializer
    
    def get_object(self):
        preferences, created = NotificationPreference.objects.get_or_create(
            user=self.request.user
        )
        return preferences
    
    def perform_update(self, serializer):
        serializer.save()
        
        # Track analytics
        AnalyticsEvent.objects.create(
            event_type='notification_preferences_updated',
            user=self.request.user,
            metadata=serializer.validated_data
        )


class NotificationSubscribeView(APIView):
    """Subscribe to notifications (for anonymous users becoming subscribers)"""
    
    def post(self, request):
        serializer = NotificationSubscribeSerializer(data=request.data)
        if serializer.is_valid():
            email = request.data.get('email')
            if not email:
                return Response({
                    'error': 'Email is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # For authenticated users, update their preferences
            if request.user.is_authenticated:
                preferences, created = NotificationPreference.objects.get_or_create(
                    user=request.user
                )
                
                preferences.email_announcements = serializer.validated_data['email_notifications']
                preferences.email_marketing = serializer.validated_data['marketing_emails']
                preferences.digest_frequency = serializer.validated_data['digest_frequency']
                preferences.save()
                
                # Track analytics
                AnalyticsEvent.objects.create(
                    event_type='notification_subscribe',
                    user=request.user,
                    metadata=serializer.validated_data
                )
                
                return Response({
                    'status': 'success',
                    'message': 'Notification preferences updated'
                })
            
            else:
                # For anonymous users, we could store email for future notifications
                # This would require a separate EmailSubscriber model
                # For now, just track the intent
                AnalyticsEvent.objects.create(
                    event_type='notification_subscribe_anonymous',
                    session_id=request.session.session_key,
                    metadata={
                        'email': email,
                        **serializer.validated_data
                    }
                )
                
                return Response({
                    'status': 'success',
                    'message': 'Subscription preferences saved'
                })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)