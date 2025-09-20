from django.db import models
from django.contrib.auth import get_user_model
from core.models import TimeStampedModel
import uuid

User = get_user_model()


class ChatSession(TimeStampedModel):
    """Chat session for grouping related messages"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='chat_sessions')
    session_id = models.CharField(max_length=100, help_text="Session ID for anonymous users")
    
    # Chat context and preferences
    audience_tag = models.CharField(
        max_length=20,
        choices=[
            ('general', 'General'),
            ('recruiter', 'Recruiter'),
            ('developer', 'Developer'),
            ('founder', 'Founder/Product'),
            ('client', 'Client'),
        ],
        default='general'
    )
    
    persona_tone = models.CharField(
        max_length=20,
        choices=[
            ('professional', 'Professional'),
            ('technical', 'Technical'),
            ('casual', 'Casual'),
            ('owner_voice', 'Owner Voice'),
        ],
        default='professional'
    )
    
    # Session metadata
    is_active = models.BooleanField(default=True)
    last_activity = models.DateTimeField(auto_now=True)
    message_count = models.PositiveIntegerField(default=0)
    
    # Analytics
    total_tokens_used = models.PositiveIntegerField(default=0)
    average_rating = models.FloatField(null=True, blank=True)
    
    class Meta:
        ordering = ['-last_activity']
        verbose_name = 'Chat Session'
        verbose_name_plural = 'Chat Sessions'
    
    def __str__(self):
        user_info = self.user.email if self.user else f"Anonymous ({self.session_id[:8]})"
        return f"Chat Session - {user_info} ({self.message_count} messages)"
    
    def update_average_rating(self):
        """Update average rating based on message ratings"""
        ratings = self.messages.filter(rating__isnull=False).values_list('rating', flat=True)
        if ratings:
            self.average_rating = sum(ratings) / len(ratings)
            self.save(update_fields=['average_rating'])


class ChatMessage(TimeStampedModel):
    """Individual chat messages"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='messages')
    
    # Message content
    content = models.TextField()
    is_from_user = models.BooleanField(help_text="True if from user, False if from AI")
    
    # AI response metadata
    response_time_ms = models.PositiveIntegerField(null=True, blank=True, help_text="Response time in milliseconds")
    tokens_used = models.PositiveIntegerField(null=True, blank=True)
    model_used = models.CharField(max_length=50, blank=True)
    
    # Context and sources
    context_data = models.JSONField(
        default=dict, 
        help_text="Context used for AI response (project IDs, etc.)"
    )
    sources = models.JSONField(
        default=list, 
        help_text="Sources cited in the response with links"
    )
    
    # Feedback
    rating = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)], 
        null=True, 
        blank=True,
        help_text="User rating for AI response (1-5)"
    )
    feedback_comment = models.TextField(blank=True)
    
    # Message metadata
    edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name = 'Chat Message'
        verbose_name_plural = 'Chat Messages'
    
    def __str__(self):
        sender = "User" if self.is_from_user else "AI"
        return f"{sender}: {self.content[:50]}..."


class ChatFeedback(TimeStampedModel):
    """Overall chat feedback and suggestions"""
    session = models.ForeignKey(ChatSession, on_delete=models.CASCADE, related_name='feedback')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Feedback data
    overall_rating = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)],
        help_text="Overall chat experience rating"
    )
    helpfulness = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)],
        help_text="How helpful was the AI assistant"
    )
    accuracy = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)],
        help_text="How accurate was the information provided"
    )
    
    # Open feedback
    what_worked_well = models.TextField(blank=True)
    what_could_improve = models.TextField(blank=True)
    suggestions = models.TextField(blank=True)
    
    # Metadata
    would_recommend = models.BooleanField(null=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Chat Feedback'
        verbose_name_plural = 'Chat Feedback'
    
    def __str__(self):
        user_info = self.user.email if self.user else "Anonymous"
        return f"Feedback from {user_info} - Rating: {self.overall_rating}/5"


class ChatKnowledgeBase(TimeStampedModel):
    """Knowledge base for AI responses"""
    title = models.CharField(max_length=255)
    content = models.TextField(help_text="Content that AI can reference")
    tags = models.JSONField(default=list, help_text="Tags for categorizing knowledge")
    
    # Content type
    content_type = models.CharField(
        max_length=20,
        choices=[
            ('project', 'Project Information'),
            ('skill', 'Skill Information'),
            ('bio', 'Biography/About'),
            ('faq', 'FAQ'),
            ('general', 'General Knowledge'),
        ],
        default='general'
    )
    
    # Reference links
    related_project_ids = models.JSONField(default=list, help_text="Related project IDs")
    related_urls = models.JSONField(default=list, help_text="Related internal URLs")
    
    # Usage tracking
    usage_count = models.PositiveIntegerField(default=0)
    last_used = models.DateTimeField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    priority = models.PositiveSmallIntegerField(default=1, help_text="Higher priority content is preferred")
    
    class Meta:
        ordering = ['-priority', 'title']
        verbose_name = 'Knowledge Base Entry'
        verbose_name_plural = 'Knowledge Base'
    
    def __str__(self):
        return f"{self.title} ({self.get_content_type_display()})"