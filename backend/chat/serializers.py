from rest_framework import serializers
from .models import ChatSession, ChatMessage, ChatFeedback


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serializer for chat messages"""
    
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'content', 'is_from_user', 'sources', 'rating',
            'feedback_comment', 'created_at', 'response_time_ms'
        ]


class ChatSessionSerializer(serializers.ModelSerializer):
    """Serializer for chat sessions"""
    messages = ChatMessageSerializer(many=True, read_only=True)
    
    class Meta:
        model = ChatSession
        fields = [
            'id', 'audience_tag', 'persona_tone', 'message_count',
            'last_activity', 'messages'
        ]


class ChatQuerySerializer(serializers.Serializer):
    """Serializer for chat query requests"""
    query = serializers.CharField(max_length=2000)
    session_id = serializers.UUIDField(required=False, allow_null=True)
    context = serializers.DictField(required=False, default=dict)
    audience = serializers.ChoiceField(
        choices=[
            ('general', 'General'),
            ('recruiter', 'Recruiter'),
            ('developer', 'Developer'),
            ('founder', 'Founder'),
            ('client', 'Client'),
        ],
        default='general'
    )
    depth = serializers.ChoiceField(
        choices=[('short', 'Short'), ('medium', 'Medium'), ('long', 'Long')],
        default='medium'
    )
    tone = serializers.ChoiceField(
        choices=[
            ('professional', 'Professional'),
            ('technical', 'Technical'),
            ('casual', 'Casual'),
            ('owner_voice', 'Owner Voice'),
        ],
        default='professional'
    )


class ChatFeedbackSerializer(serializers.ModelSerializer):
    """Serializer for chat feedback"""
    
    class Meta:
        model = ChatFeedback
        fields = [
            'overall_rating', 'helpfulness', 'accuracy',
            'what_worked_well', 'what_could_improve', 'suggestions',
            'would_recommend'
        ]


class MessageFeedbackSerializer(serializers.Serializer):
    """Serializer for individual message feedback"""
    message_id = serializers.UUIDField()
    rating = serializers.ChoiceField(choices=[(i, i) for i in range(1, 6)])
    comment = serializers.CharField(max_length=500, required=False, allow_blank=True)