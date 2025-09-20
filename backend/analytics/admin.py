from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count
from .models import AnalyticsEvent, PageView, ConversionFunnel, ConversionEvent, AnalyticsSummary


@admin.register(AnalyticsEvent)
class AnalyticsEventAdmin(admin.ModelAdmin):
    list_display = ['event_type', 'user_display', 'session_short', 'timestamp']
    list_filter = ['event_type', 'timestamp', 'user']
    search_fields = ['event_type', 'user__email', 'session_id', 'metadata']
    readonly_fields = ['timestamp']
    date_hierarchy = 'timestamp'
    
    def user_display(self, obj):
        return obj.user.email if obj.user else 'Anonymous'
    user_display.short_description = 'User'
    
    def session_short(self, obj):
        return obj.session_id[:8] + '...' if obj.session_id else ''
    session_short.short_description = 'Session'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(PageView)
class PageViewAdmin(admin.ModelAdmin):
    list_display = ['path', 'title', 'user_display', 'device_type', 'time_on_page', 'created_at']
    list_filter = ['device_type', 'created_at', 'country']
    search_fields = ['path', 'title', 'user__email', 'ip_address']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'
    
    def user_display(self, obj):
        return obj.user.email if obj.user else 'Anonymous'
    user_display.short_description = 'User'


@admin.register(ConversionFunnel)
class ConversionFunnelAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'total_events', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']
    list_editable = ['is_active']
    
    def total_events(self, obj):
        return obj.events.count()
    total_events.short_description = 'Total Events'


@admin.register(ConversionEvent)
class ConversionEventAdmin(admin.ModelAdmin):
    list_display = ['funnel', 'step_name', 'step_index', 'user_display', 'time_from_start', 'created_at']
    list_filter = ['funnel', 'step_index', 'created_at']
    search_fields = ['funnel__name', 'step_name', 'user__email']
    readonly_fields = ['created_at']
    
    def user_display(self, obj):
        return obj.user.email if obj.user else 'Anonymous'
    user_display.short_description = 'User'


@admin.register(AnalyticsSummary)
class AnalyticsSummaryAdmin(admin.ModelAdmin):
    list_display = [
        'date', 'total_page_views', 'unique_visitors', 'project_views',
        'gig_views', 'hire_requests', 'chat_queries', 'new_registrations'
    ]
    list_filter = ['date']
    search_fields = ['date']
    readonly_fields = ['created_at']
    date_hierarchy = 'date'
    
    fieldsets = (
        ('Date', {
            'fields': ('date',)
        }),
        ('Traffic Metrics', {
            'fields': ('total_page_views', 'unique_visitors', 'returning_visitors')
        }),
        ('Content Metrics', {
            'fields': ('project_views', 'case_study_views', 'gig_views', 'gig_clicks')
        }),
        ('Conversion Metrics', {
            'fields': ('hire_requests', 'chat_queries', 'chat_sessions')
        }),
        ('User Metrics', {
            'fields': ('new_registrations', 'user_logins')
        }),
        ('Top Content', {
            'fields': ('top_projects', 'top_skills', 'top_pages'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['generate_summary_report']
    
    def generate_summary_report(self, request, queryset):
        # This could generate a detailed report
        self.message_user(request, f"Summary report generated for {queryset.count()} days.")
    generate_summary_report.short_description = "Generate summary report"