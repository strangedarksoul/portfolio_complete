from django.contrib import admin
from django.utils.html import format_html
from .models import ExperimentCategory, Experiment


@admin.register(ExperimentCategory)
class ExperimentCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'color_display', 'is_active', 'experiment_count', 'order']
    list_filter = ['is_active']
    search_fields = ['name', 'description']
    list_editable = ['is_active', 'order']
    prepopulated_fields = {'slug': ('name',)}
    
    def color_display(self, obj):
        return format_html(
            '<span style="background: {}; color: white; padding: 2px 8px; border-radius: 3px;">{}</span>',
            obj.color, obj.color
        )
    color_display.short_description = 'Color'
    
    def experiment_count(self, obj):
        return obj.experiments.filter(is_public=True).count()
    experiment_count.short_description = 'Experiments'


@admin.register(Experiment)
class ExperimentAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'status', 'is_featured', 'is_public', 'order', 'view_count', 'engagement_rate', 'created_at']
    list_filter = ['status', 'is_featured', 'is_public', 'category', 'created_at']
    search_fields = ['title', 'description']
    list_editable = ['status', 'is_featured', 'is_public', 'order']
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = []
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'description', 'long_description', 'category')
        }),
        ('Technology', {
            'fields': ('tech_stack',)
        }),
        ('Links', {
            'fields': ('demo_url', 'code_url')
        }),
        ('Media', {
            'fields': ('hero_image', 'gallery_images'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('development_time', 'inspiration', 'lessons_learned'),
            'classes': ('collapse',)
        }),
        ('Organization', {
            'fields': ('status', 'is_featured', 'is_public', 'order')
        }),
        ('Analytics', {
            'fields': ('view_count', 'demo_clicks', 'code_clicks'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['view_count', 'demo_clicks', 'code_clicks']
    
    actions = ['make_featured', 'make_public', 'make_live']
    
    def make_featured(self, request, queryset):
        queryset.update(is_featured=True)
        self.message_user(request, f"{queryset.count()} experiments featured.")
    make_featured.short_description = "Feature selected experiments"
    
    def make_public(self, request, queryset):
        queryset.update(is_public=True)
        self.message_user(request, f"{queryset.count()} experiments made public.")
    make_public.short_description = "Make selected experiments public"
    
    def make_live(self, request, queryset):
        queryset.update(status='live')
        self.message_user(request, f"{queryset.count()} experiments marked as live.")
    make_live.short_description = "Mark as live"
    
    def engagement_rate(self, obj):
        return f"{obj.engagement_rate:.1f}%"
    engagement_rate.short_description = 'Engagement'