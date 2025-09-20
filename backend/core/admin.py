from django.contrib import admin
from .models import RoadmapItem, Achievement, Testimonial, SiteConfiguration


@admin.register(RoadmapItem)
class RoadmapItemAdmin(admin.ModelAdmin):
    list_display = ['title', 'status', 'priority', 'estimated_completion', 'is_public', 'order']
    list_filter = ['status', 'priority', 'is_public', 'created_at']
    search_fields = ['title', 'description']
    list_editable = ['status', 'priority', 'is_public', 'order']
    ordering = ['order', '-priority']


@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'date_achieved', 'is_featured', 'order']
    list_filter = ['category', 'is_featured', 'date_achieved']
    search_fields = ['title', 'description']
    list_editable = ['is_featured', 'order']
    ordering = ['-date_achieved']


@admin.register(Testimonial)
class TestimonialAdmin(admin.ModelAdmin):
    list_display = ['author_name', 'author_company', 'rating', 'is_approved', 'is_featured', 'created_at']
    list_filter = ['is_approved', 'is_featured', 'rating', 'created_at']
    search_fields = ['author_name', 'author_company', 'content']
    list_editable = ['is_approved', 'is_featured']
    ordering = ['-created_at']
    actions = ['approve_testimonials', 'feature_testimonials']
    
    def approve_testimonials(self, request, queryset):
        queryset.update(is_approved=True)
        self.message_user(request, f"{queryset.count()} testimonials approved.")
    approve_testimonials.short_description = "Approve selected testimonials"
    
    def feature_testimonials(self, request, queryset):
        queryset.update(is_featured=True)
        self.message_user(request, f"{queryset.count()} testimonials featured.")
    feature_testimonials.short_description = "Feature selected testimonials"


@admin.register(SiteConfiguration)
class SiteConfigurationAdmin(admin.ModelAdmin):
    fieldsets = (
        ('Basic Information', {
            'fields': ('site_name', 'site_tagline', 'hero_text')
        }),
        ('About Content', {
            'fields': ('about_short', 'about_medium', 'about_long')
        }),
        ('Contact Information', {
            'fields': ('email', 'phone', 'location')
        }),
        ('Social Media', {
            'fields': ('github_url', 'linkedin_url', 'twitter_url', 'mastodon_url')
        }),
        ('Freelance Platforms', {
            'fields': ('upwork_url', 'fiverr_url')
        }),
        ('AI Chatbot Configuration', {
            'fields': ('chatbot_name', 'chatbot_welcome_message', 
                      'chatbot_persona_professional', 'chatbot_persona_technical', 'chatbot_persona_casual')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description')
        }),
        ('Images', {
            'fields': ('logo', 'hero_image', 'og_image')
        }),
    )
    
    def has_add_permission(self, request):
        # Only allow one configuration instance
        return not SiteConfiguration.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        return False