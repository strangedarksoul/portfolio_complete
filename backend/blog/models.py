from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from ckeditor.fields import RichTextField
from versatileimagefield.fields import VersatileImageField
from core.models import TimeStampedModel, SEOModel

User = get_user_model()


class BlogCategory(TimeStampedModel):
    """Blog post categories"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=7, default="#007bff", help_text="Hex color code")
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide React icon name")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Blog Category'
        verbose_name_plural = 'Blog Categories'
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class BlogPost(TimeStampedModel, SEOModel):
    """Blog posts"""
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('private', 'Private'),
    ]
    
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    subtitle = models.CharField(max_length=300, blank=True, help_text="Optional subtitle")
    excerpt = models.TextField(max_length=500, help_text="Brief excerpt for listings")
    content = RichTextField(help_text="Full blog post content")
    
    # Organization
    category = models.ForeignKey(BlogCategory, on_delete=models.SET_NULL, null=True, related_name='posts')
    tags = models.JSONField(default=list, help_text="List of tags for the post")
    
    # Media
    featured_image = VersatileImageField(upload_to='blog/featured/', null=True, blank=True)
    gallery_images = models.JSONField(default=list, help_text="Additional images for the post")
    
    # Author and publishing
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blog_posts')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    published_at = models.DateTimeField(null=True, blank=True)
    
    # Engagement
    is_featured = models.BooleanField(default=False)
    allow_comments = models.BooleanField(default=True)
    view_count = models.PositiveIntegerField(default=0)
    
    # Reading time
    reading_time = models.PositiveIntegerField(default=5, help_text="Estimated reading time in minutes")
    
    # External links
    external_link = models.URLField(blank=True, help_text="Link to external article if applicable")
    
    class Meta:
        ordering = ['-published_at', '-created_at']
        verbose_name = 'Blog Post'
        verbose_name_plural = 'Blog Posts'
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        
        # Set published_at when status changes to published
        if self.status == 'published' and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    @property
    def is_published(self):
        return self.status == 'published' and self.published_at is not None


class BlogComment(TimeStampedModel):
    """Blog post comments"""
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, related_name='comments')
    
    # Author (can be anonymous)
    author = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    author_name = models.CharField(max_length=100, help_text="Name for anonymous comments")
    author_email = models.EmailField(help_text="Email for anonymous comments")
    
    # Comment content
    content = models.TextField()
    
    # Moderation
    is_approved = models.BooleanField(default=False)
    is_spam = models.BooleanField(default=False)
    
    # Threading (for replies)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    
    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name = 'Blog Comment'
        verbose_name_plural = 'Blog Comments'
    
    def __str__(self):
        author_name = self.author.get_full_name() if self.author else self.author_name
        return f"Comment by {author_name} on {self.post.title}"


class BlogSubscriber(TimeStampedModel):
    """Blog subscribers for newsletters"""
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    confirmation_token = models.CharField(max_length=100, blank=True)
    
    # Preferences
    frequency = models.CharField(
        max_length=10,
        choices=[
            ('immediate', 'Immediate'),
            ('daily', 'Daily'),
            ('weekly', 'Weekly'),
            ('monthly', 'Monthly'),
        ],
        default='weekly'
    )
    
    # Categories interested in
    interested_categories = models.ManyToManyField(BlogCategory, blank=True)
    
    # Tracking
    subscribe_source = models.CharField(max_length=100, blank=True, help_text="Where they subscribed from")
    last_email_sent = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        verbose_name = 'Blog Subscriber'
        verbose_name_plural = 'Blog Subscribers'
    
    def __str__(self):
        return self.email


class BlogNewsletter(TimeStampedModel):
    """Newsletter campaigns"""
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    content = RichTextField(help_text="Newsletter content")
    
    # Targeting
    target_all = models.BooleanField(default=True)
    target_categories = models.ManyToManyField(BlogCategory, blank=True)
    
    # Status
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Statistics
    total_recipients = models.PositiveIntegerField(default=0)
    emails_sent = models.PositiveIntegerField(default=0)
    open_count = models.PositiveIntegerField(default=0)
    click_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Blog Newsletter'
        verbose_name_plural = 'Blog Newsletters'
    
    def __str__(self):
        return self.title