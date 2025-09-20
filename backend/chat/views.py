from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db.models import Q
import openai
import time
import uuid
from django.conf import settings

from .models import ChatSession, ChatMessage, ChatFeedback, ChatKnowledgeBase
from .serializers import (
    ChatSessionSerializer, ChatMessageSerializer, ChatQuerySerializer,
    ChatFeedbackSerializer, MessageFeedbackSerializer
)
from .services import ChatAIService
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
        
        # Get or create session - prioritize authenticated user
        session = None
        
        if request.user.is_authenticated:
            # For authenticated users, find their existing session or create a new one
            # Ignore session_id from frontend to prevent cross-user contamination
            try:
                session = ChatSession.objects.filter(user=request.user, is_active=True).first()
                if not session:
                    session = self.create_session(request, audience, tone)
            except Exception:
                session = self.create_session(request, audience, tone)
        else:
            # For anonymous users, use session_id logic
            if session_id:
                try:
                    session = ChatSession.objects.get(id=session_id, user__isnull=True)
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
        
        # Generate AI response
        start_time = time.time()
        try:
            ai_service = ChatAIService()
            response_data = ai_service.generate_response(
                query=query,
                session=session,
                context=context,
                audience=audience,
                depth=depth,
                tone=tone
            )
            
            response_time = int((time.time() - start_time) * 1000)
            
            # Create AI message
            ai_message = ChatMessage.objects.create(
                session=session,
                content=response_data['response'],
                is_from_user=False,
                response_time_ms=response_time,
                tokens_used=response_data.get('tokens_used', 0),
                model_used=response_data.get('model_used', ''),
                context_data=context,
                sources=response_data.get('sources', [])
            )
            
            # Update session
            session.message_count += 2
            session.total_tokens_used += response_data.get('tokens_used', 0)
            session.save()
            
            # Track analytics
            AnalyticsEvent.objects.create(
                event_type='chat_query',
                user=request.user if request.user.is_authenticated else None,
                session_id=request.session.session_key,
                metadata={
                    'chat_session_id': str(session.id),
                    'query_length': len(query),
                    'response_time_ms': response_time,
                    'audience': audience,
                    'tone': tone,
                    'depth': depth,
                    'tokens_used': response_data.get('tokens_used', 0),
                }
            )
            
            return Response({
                'session_id': session.id,
                'message_id': ai_message.id,
                'response': response_data['response'],
                'sources': response_data.get('sources', []),
                'response_time_ms': response_time,
                'message_count': session.message_count
            })
            
        except Exception as e:
            # Handle AI service errors
            error_message = "I apologize, but I'm having trouble processing your request right now. Please try again in a moment."
            
            ai_message = ChatMessage.objects.create(
                session=session,
                content=error_message,
                is_from_user=False,
                response_time_ms=int((time.time() - start_time) * 1000),
            )
            
            session.message_count += 2
            session.save()
            
            return Response({
                'session_id': session.id,
                'message_id': ai_message.id,
                'response': error_message,
                'sources': [],
                'error': True
            })
    
    def create_session(self, request, audience, tone):
        """Create new chat session"""
        return ChatSession.objects.create(
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key if request.session.session_key else str(uuid.uuid4()),
            audience_tag=audience,
            persona_tone=tone
        )


class ChatHistoryView(generics.ListAPIView):
    """Get chat history for user"""
    serializer_class = ChatSessionSerializer
    
    def get_queryset(self):
        if self.request.user.is_authenticated:
            return ChatSession.objects.filter(
                user=self.request.user
            ).prefetch_related('messages')
        else:
            session_id = self.request.session.session_key
            if session_id:
                return ChatSession.objects.filter(
                    session_id=session_id,
                    user__isnull=True
                ).prefetch_related('messages')
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


class ClearChatSessionView(APIView):
    """Clear chat session messages"""
    permission_classes = [AllowAny]
    
    def post(self, request, session_id):
        try:
            # Find the session
            if request.user.is_authenticated:
                session = ChatSession.objects.get(id=session_id, user=request.user)
            else:
                session = ChatSession.objects.get(
                    id=session_id, 
                    session_id=request.session.session_key,
                    user__isnull=True
                )
            
            # Clear all messages in the session
            session.messages.all().delete()
            
            # Reset session counters
            session.message_count = 0
            session.total_tokens_used = 0
            session.average_rating = None
            session.save()
            
            # Track analytics
            AnalyticsEvent.objects.create(
                event_type='chat_session_cleared',
                user=request.user if request.user.is_authenticated else None,
                session_id=request.session.session_key,
                metadata={
                    'chat_session_id': str(session_id),
                    'cleared_at': timezone.now().isoformat()
                }
            )
            
            return Response({'status': 'success', 'message': 'Chat history cleared'})
            
        except ChatSession.DoesNotExist:
            return Response({'error': 'Chat session not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': 'Failed to clear chat session'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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