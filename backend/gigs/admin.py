from django.contrib import admin
from django.utils.html import format_html
from .models import GigCategory, Gig, HireRequest, GigClick


@admin.register(GigCategory)
class GigCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'color_display', 'is_active', 'gig_count', 'order']
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
    
    def gig_count(self, obj):
        return obj.gigs.count()
    gig_count.short_description = 'Gigs'


@admin.register(Gig)
class GigAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'status', 'price_display', 'delivery_time_display', 
                   'is_featured', 'order', 'click_count', 'hire_count', 'conversion_rate']
    list_filter = ['status', 'is_featured', 'category', 'price_type', 'created_at']
    search_fields = ['title', 'short_description']
    list_editable = ['status', 'is_featured', 'order']
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ['sample_projects']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'category', 'short_description', 'long_description')
        }),
        ('Pricing', {
            'fields': ('price_min', 'price_max', 'price_currency', 'price_type')
        }),
        ('Delivery', {
            'fields': ('delivery_time_min', 'delivery_time_max', 'delivery_time_unit')
        }),
        ('Service Details', {
            'fields': ('inclusions', 'exclusions', 'addons', 'requirements'),
            'classes': ('collapse',)
        }),
        ('Media', {
            'fields': ('hero_image', 'gallery_images'),
            'classes': ('collapse',)
        }),
        ('External Platforms', {
            'fields': ('external_links',),
            'classes': ('collapse',)
        }),
        ('Sample Work', {
            'fields': ('sample_projects',),
            'classes': ('collapse',)
        }),
        ('Status & Organization', {
            'fields': ('status', 'is_featured', 'order')
        }),
    )
    
    readonly_fields = ['click_count', 'inquiry_count', 'hire_count']
    
    actions = ['make_featured', 'open_gigs', 'close_gigs']
    
    def make_featured(self, request, queryset):
        queryset.update(is_featured=True)
        self.message_user(request, f"{queryset.count()} gigs featured.")
    make_featured.short_description = "Feature selected gigs"
    
    def open_gigs(self, request, queryset):
        queryset.update(status='open')
        self.message_user(request, f"{queryset.count()} gigs opened.")
    open_gigs.short_description = "Open selected gigs"
    
    def close_gigs(self, request, queryset):
        queryset.update(status='closed')
        self.message_user(request, f"{queryset.count()} gigs closed.")
    close_gigs.short_description = "Close selected gigs"


@admin.register(HireRequest)
class HireRequestAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'company', 'selected_gig', 'status', 'priority', 
                   'proposed_budget', 'timeline', 'created_at']
    list_filter = ['status', 'priority', 'proposed_budget', 'timeline', 'meeting_requested', 'created_at']
    search_fields = ['name', 'email', 'company', 'message']
    list_editable = ['status', 'priority']
    readonly_fields = ['created_at', 'updated_at', 'proposal_sent_at']
    
    fieldsets = (
        ('Contact Information', {
            'fields': ('user', 'name', 'email', 'company', 'phone')
        }),
        ('Project Details', {
            'fields': ('selected_gig', 'project_title', 'message', 'uploaded_files')
        }),
        ('Budget & Timeline', {
            'fields': ('proposed_budget', 'budget_details', 'timeline', 'timeline_details')
        }),
        ('Communication', {
            'fields': ('preferred_communication', 'meeting_requested', 'meeting_availability'),
            'classes': ('collapse',)
        }),
        ('Proposal', {
            'fields': ('proposal_preview', 'proposal_sent', 'proposal_sent_at'),
            'classes': ('collapse',)
        }),
        ('Lead Management', {
            'fields': ('status', 'priority', 'admin_notes', 'follow_up_date')
        }),
        ('Tracking', {
            'fields': ('source', 'utm_params', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['mark_contacted', 'mark_proposal_sent', 'mark_high_priority']
    
    def mark_contacted(self, request, queryset):
        queryset.update(status='contacted')
        self.message_user(request, f"{queryset.count()} leads marked as contacted.")
    mark_contacted.short_description = "Mark as contacted"
    
    def mark_proposal_sent(self, request, queryset):
        queryset.update(status='proposal_sent', proposal_sent=True)
        self.message_user(request, f"{queryset.count()} leads marked as proposal sent.")
    mark_proposal_sent.short_description = "Mark proposal sent"
    
    def mark_high_priority(self, request, queryset):
        queryset.update(priority='high')
        self.message_user(request, f"{queryset.count()} leads marked as high priority.")
    mark_high_priority.short_description = "Mark as high priority"


@admin.register(GigClick)
class GigClickAdmin(admin.ModelAdmin):
    list_display = ['gig', 'click_type', 'external_platform', 'user', 'session_id', 'created_at']
    list_filter = ['click_type', 'external_platform', 'created_at']
    search_fields = ['gig__title', 'user__email', 'session_id']
    readonly_fields = ['created_at']
    
    def has_add_permission(self, request):
        return False  # Clicks are created programmatically