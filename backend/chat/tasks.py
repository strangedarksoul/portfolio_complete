from celery import shared_task
from django.core.cache import cache
from django.utils import timezone
from .models import ChatSession, ChatMessage
from .services import ChatAIService
import time
import uuid


@shared_task
def generate_ai_response(session_id, user_message_id, query, context=None, audience='general', depth='medium', tone='professional'):
    """Generate AI response asynchronously"""
    try:
        session = ChatSession.objects.get(id=session_id)
        user_message = ChatMessage.objects.get(id=user_message_id)
        
        # Set status to processing
        cache_key = f"ai_response_{user_message_id}"
        cache.set(cache_key, {
            'status': 'processing',
            'message': 'Generating response...',
            'timestamp': timezone.now().isoformat()
        }, timeout=300)  # 5 minutes
        
        # Generate AI response
        start_time = time.time()
        ai_service = ChatAIService()
        response_data = ai_service.generate_response(
            query=query,
            session=session,
            context=context or {},
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
            context_data=context or {},
            sources=response_data.get('sources', [])
        )
        
        # Update session
        session.message_count += 1  # Only increment by 1 since user message was already counted
        session.total_tokens_used += response_data.get('tokens_used', 0)
        session.save()
        
        # Store completed response in cache
        cache.set(cache_key, {
            'status': 'completed',
            'message_id': str(ai_message.id),
            'response': response_data['response'],
            'sources': response_data.get('sources', []),
            'response_time_ms': response_time,
            'timestamp': timezone.now().isoformat()
        }, timeout=300)
        
        return {
            'status': 'success',
            'message_id': str(ai_message.id),
            'response_time_ms': response_time,
            'tokens_used': response_data.get('tokens_used', 0)
        }
        
    except Exception as e:
        # Store error in cache
        cache.set(cache_key, {
            'status': 'error',
            'message': 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
            'error': str(e),
            'timestamp': timezone.now().isoformat()
        }, timeout=300)
        
        # Create error message
        try:
            ai_message = ChatMessage.objects.create(
                session=session,
                content="I apologize, but I'm having trouble processing your request right now. Please try again in a moment.",
                is_from_user=False,
                response_time_ms=int((time.time() - start_time) * 1000) if 'start_time' in locals() else 0,
            )
            
            session.message_count += 1
            session.save()
            
            cache.set(cache_key, {
                'status': 'error',
                'message_id': str(ai_message.id),
                'message': ai_message.content,
                'timestamp': timezone.now().isoformat()
            }, timeout=300)
            
        except Exception as inner_e:
            print(f"Failed to create error message: {inner_e}")
        
        return {
            'status': 'error',
            'error': str(e)
        }


@shared_task
def cleanup_old_chat_responses():
    """Clean up old cached AI responses"""
    # This would clean up old cache entries
    # Implementation depends on cache backend capabilities
    return "Cleanup completed"