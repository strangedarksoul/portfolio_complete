from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
from django.core.cache import cache
import openai
import time
import uuid
from django.conf import settings

from .models import ChatSession, ChatMessage, ChatFeedback, ChatKnowledgeBase
from .serializers import (
    ChatSessionSerializer, ChatMessageSerializer, ChatQuerySerializer,
    ChatFeedbackSerializer, MessageFeedbackSerializer
)
from .tasks import generate_ai_response
from analytics.models import AnalyticsEvent


class ChatQueryView(APIView):
    """Handle chat queries and AI responses"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = ChatQuerySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        query = data['query']
        session_id = data.get('session_id')
        context = data.get('context', {})
        audience = data.get('audience', 'general')
        depth = data.get('depth', 'medium')
        tone = data.get('tone', 'professional')
        
        # Get or create session
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id)
            except ChatSession.DoesNotExist:
                session = self.create_session(request, audience, tone)
        else:
            session = self.create_session(request, audience, tone)
        
        # Create user message
        user_message = ChatMessage.objects.create(
            session=session,
            content=query,
            is_from_user=True
        )
        
        # Update session message count for user message
        session.message_count += 1
        session.save()
        
        # Start AI response generation task
        task = generate_ai_response.delay(
            session_id=str(session.id),
            user_message_id=str(user_message.id),
            query=query,
            context=context,
            audience=audience,
            depth=depth,
            tone=tone
        )
        
        # Track analytics (async task would be better)
        from analytics.tasks import track_event
        track_event.delay('chat_query', {
            'chat_session_id': str(session.id),
            'query_length': len(query),
            'audience': audience,
            'tone': tone,
            'depth': depth,
            'user_id': request.user.id if request.user.is_authenticated else None,
            'session_key': request.session.session_key,
        })
        
        return Response({
            'session_id': session.id,
            'user_message_id': user_message.id,
            'task_id': task.id,
            'status': 'processing',
            'message': 'Generating response...',
            'message_count': session.message_count
        })
    
    def create_session(self, request, audience, tone):
        """Create new chat session"""
        return ChatSession.objects.create(
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key or str(uuid.uuid4()),
            audience_tag=audience,
            persona_tone=tone
        )


class ChatResponseStatusView(APIView):
    """Check status of AI response generation"""
    permission_classes = [AllowAny]
    
    def get(self, request, message_id):
        cache_key = f"ai_response_{message_id}"
        response_data = cache.get(cache_key)
        
        if not response_data:
            return Response({
                'status': 'not_found',
                'message': 'Response not found or expired'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response(response_data)
class ChatHistoryView(generics.ListAPIView):
    """Get chat history for user"""
    serializer_class = ChatSessionSerializer
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return ChatSession.objects.filter(user=self.request.user).prefetch_related('messages')
        else:
            session_id = self.request.session.session_key
            if session_id:
                return ChatSession.objects.filter(session_id=session_id).prefetch_related('messages')
        return ChatSession.objects.none()


class ChatSessionView(generics.RetrieveAPIView):
    """Get specific chat session"""
    serializer_class = ChatSessionSerializer
    lookup_field = 'id'
    lookup_url_kwarg = 'session_id'
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return ChatSession.objects.filter(user=self.request.user).prefetch_related('messages')
        else:
            session_id = self.request.session.session_key
            if session_id:
                return ChatSession.objects.filter(session_id=session_id).prefetch_related('messages')
        return ChatSession.objects.none()


class MessageFeedbackView(APIView):
    """Handle feedback for individual messages"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = MessageFeedbackSerializer(data=request.data)
        if serializer.is_valid():
            message_id = serializer.validated_data['message_id']
            rating = serializer.validated_data['rating']
            comment = serializer.validated_data.get('comment', '')
            
            try:
                message = ChatMessage.objects.get(id=message_id)
                message.rating = rating
                message.feedback_comment = comment
                message.save()
                
                # Update session average rating
                message.session.update_average_rating()
                
                # Track feedback
                AnalyticsEvent.objects.create(
                    event_type='chat_feedback',
                    user=request.user if request.user.is_authenticated else None,
                    session_id=request.session.session_key,
                    metadata={
                        'message_id': str(message_id),
                        'rating': rating,
                        'has_comment': bool(comment)
                    }
                )
                
                return Response({'status': 'success', 'message': 'Feedback recorded'})
                
            except ChatMessage.DoesNotExist:
                return Response({'error': 'Message not found'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SessionFeedbackView(APIView):
    """Handle overall session feedback"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            session = ChatSession.objects.get(id=session_id)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = ChatFeedbackSerializer(data=request.data)
        if serializer.is_valid():
            feedback = serializer.save(
                session=session,
                user=request.user if request.user.is_authenticated else None
            )
            
            # Track feedback
            AnalyticsEvent.objects.create(
                event_type='chat_session_feedback',
                user=request.user if request.user.is_authenticated else None,
                session_id=request.session.session_key,
                metadata={
                    'chat_session_id': str(session_id),
                    'overall_rating': feedback.overall_rating,
                    'helpfulness': feedback.helpfulness,
                    'accuracy': feedback.accuracy,
                    'would_recommend': feedback.would_recommend
                }
            )
            
            return Response({'status': 'success', 'message': 'Feedback recorded'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)