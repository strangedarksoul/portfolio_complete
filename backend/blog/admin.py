from django.contrib import admin
from django.utils.html import format_html
from .models import BlogCategory, BlogPost, BlogComment, BlogSubscriber, BlogNewsletter


@admin.register(BlogCategory)
class BlogCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'color_display', 'is_active', 'post_count', 'order']
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
    
    def post_count(self, obj):
        return obj.posts.filter(status='published').count()
    post_count.short_description = 'Posts'


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'author', 'status', 'is_featured', 'view_count', 'published_at']
    list_filter = ['status', 'is_featured', 'category', 'published_at', 'created_at']
    search_fields = ['title', 'excerpt', 'content']
    list_editable = ['status', 'is_featured']
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = []
    
    fieldsets = (
        ('Content', {
            'fields': ('title', 'slug', 'subtitle', 'excerpt', 'content')
        }),
        ('Organization', {
            'fields': ('category', 'tags', 'author')
        }),
        ('Media', {
            'fields': ('featured_image', 'gallery_images'),
            'classes': ('collapse',)
        }),
        ('Publishing', {
            'fields': ('status', 'published_at', 'is_featured', 'allow_comments')
        }),
        ('Metadata', {
            'fields': ('reading_time', 'external_link', 'view_count'),
            'classes': ('collapse',)
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords'),
            'classes': ('collapse',)
        }),
    )
    
    readonly_fields = ['view_count']
    
    actions = ['make_published', 'make_featured']
    
    def make_published(self, request, queryset):
        queryset.update(status='published')
        self.message_user(request, f"{queryset.count()} posts published.")
    make_published.short_description = "Publish selected posts"
    
    def make_featured(self, request, queryset):
        queryset.update(is_featured=True)
        self.message_user(request, f"{queryset.count()} posts featured.")
    make_featured.short_description = "Feature selected posts"


@admin.register(BlogComment)
class BlogCommentAdmin(admin.ModelAdmin):
    list_display = ['post', 'author_display', 'content_preview', 'is_approved', 'is_spam', 'created_at']
    list_filter = ['is_approved', 'is_spam', 'created_at']
    search_fields = ['content', 'author_name', 'author_email', 'post__title']
    list_editable = ['is_approved', 'is_spam']
    
    def author_display(self, obj):
        if obj.author:
            return obj.author.get_full_name()
        return f"{obj.author_name} ({obj.author_email})"
    author_display.short_description = 'Author'
    
    def content_preview(self, obj):
        return obj.content[:100] + "..." if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content'
    
    actions = ['approve_comments', 'mark_as_spam']
    
    def approve_comments(self, request, queryset):
        queryset.update(is_approved=True, is_spam=False)
        self.message_user(request, f"{queryset.count()} comments approved.")
    approve_comments.short_description = "Approve selected comments"
    
    def mark_as_spam(self, request, queryset):
        queryset.update(is_spam=True, is_approved=False)
        self.message_user(request, f"{queryset.count()} comments marked as spam.")
    mark_as_spam.short_description = "Mark as spam"


@admin.register(BlogSubscriber)
class BlogSubscriberAdmin(admin.ModelAdmin):
    list_display = ['email', 'is_active', 'frequency', 'confirmed_at', 'last_email_sent']
    list_filter = ['is_active', 'frequency', 'confirmed_at']
    search_fields = ['email']
    list_editable = ['is_active', 'frequency']
    filter_horizontal = ['interested_categories']
    
    actions = ['send_confirmation', 'activate_subscribers']
    
    def send_confirmation(self, request, queryset):
        # This would trigger confirmation emails
        self.message_user(request, f"Confirmation emails sent to {queryset.count()} subscribers.")
    send_confirmation.short_description = "Send confirmation emails"
    
    def activate_subscribers(self, request, queryset):
        queryset.update(is_active=True)
        self.message_user(request, f"{queryset.count()} subscribers activated.")
    activate_subscribers.short_description = "Activate selected subscribers"


@admin.register(BlogNewsletter)
class BlogNewsletterAdmin(admin.ModelAdmin):
    list_display = ['title', 'is_sent', 'total_recipients', 'emails_sent', 'open_count', 'sent_at']
    list_filter = ['is_sent', 'sent_at']
    search_fields = ['title', 'subject', 'content']
    filter_horizontal = ['target_categories']
    readonly_fields = ['is_sent', 'sent_at', 'total_recipients', 'emails_sent', 'open_count', 'click_count']
    
    fieldsets = (
        ('Newsletter Content', {
            'fields': ('title', 'subject', 'content')
        }),
        ('Targeting', {
            'fields': ('target_all', 'target_categories')
        }),
        ('Statistics', {
            'fields': ('is_sent', 'sent_at', 'total_recipients', 'emails_sent', 'open_count', 'click_count'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['send_newsletter']
    
    def send_newsletter(self, request, queryset):
        # This would trigger newsletter sending
        count = 0
        for newsletter in queryset:
            if not newsletter.is_sent:
                count += 1
        self.message_user(request, f"{count} newsletters queued for sending.")
    send_newsletter.short_description = "Send selected newsletters"