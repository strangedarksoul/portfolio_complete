from django.contrib import admin
from django.utils.html import format_html
from .models import ChatSession, ChatMessage, ChatFeedback, ChatKnowledgeBase


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ['id_short', 'user_display', 'audience_tag', 'persona_tone', 
                   'message_count', 'average_rating', 'last_activity', 'is_active']
    list_filter = ['audience_tag', 'persona_tone', 'is_active', 'created_at']
    search_fields = ['user__email', 'session_id']
    readonly_fields = ['id', 'created_at', 'last_activity', 'message_count', 'average_rating']
    
    def id_short(self, obj):
        return str(obj.id)[:8] + "..."
    id_short.short_description = 'Session ID'
    
    def user_display(self, obj):
        if obj.user:
            return obj.user.email
        return f"Anonymous ({obj.session_id[:8]})"
    user_display.short_description = 'User'


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    fields = ['is_from_user', 'content_preview', 'rating', 'created_at']
    readonly_fields = ['content_preview', 'created_at']
    
    def content_preview(self, obj):
        return obj.content[:100] + "..." if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content'


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['session_short', 'is_from_user', 'content_preview', 'rating', 'created_at']
    list_filter = ['is_from_user', 'rating', 'created_at']
    search_fields = ['content', 'session__user__email']
    readonly_fields = ['id', 'created_at', 'response_time_ms', 'tokens_used']
    
    def session_short(self, obj):
        return str(obj.session.id)[:8] + "..."
    session_short.short_description = 'Session'
    
    def content_preview(self, obj):
        return obj.content[:100] + "..." if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content'


@admin.register(ChatFeedback)
class ChatFeedbackAdmin(admin.ModelAdmin):
    list_display = ['session_short', 'user_display', 'overall_rating', 'helpfulness', 
                   'accuracy', 'would_recommend', 'created_at']
    list_filter = ['overall_rating', 'helpfulness', 'accuracy', 'would_recommend', 'created_at']
    search_fields = ['session__user__email', 'what_worked_well', 'suggestions']
    readonly_fields = ['created_at']
    
    def session_short(self, obj):
        return str(obj.session.id)[:8] + "..."
    session_short.short_description = 'Session'
    
    def user_display(self, obj):
        if obj.user:
            return obj.user.email
        return "Anonymous"
    user_display.short_description = 'User'


@admin.register(ChatKnowledgeBase)
class ChatKnowledgeBaseAdmin(admin.ModelAdmin):
    list_display = ['title', 'content_type', 'priority', 'usage_count', 'last_used', 'is_active']
    list_filter = ['content_type', 'is_active', 'priority']
    search_fields = ['title', 'content', 'tags']
    list_editable = ['priority', 'is_active']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'content', 'content_type', 'tags')
        }),
        ('References', {
            'fields': ('related_project_ids', 'related_urls'),
            'classes': ('collapse',)
        }),
        ('Settings', {
            'fields': ('priority', 'is_active')
        }),
        ('Usage Statistics', {
            'fields': ('usage_count', 'last_used'),
            'classes': ('collapse',)
        }),
    )