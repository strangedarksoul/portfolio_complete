from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils import timezone
from ckeditor.fields import RichTextField
from versatileimagefield.fields import VersatileImageField


class TimeStampedModel(models.Model):
    """Abstract model with created_at and updated_at fields"""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True


class SEOModel(models.Model):
    """Abstract model for SEO fields"""
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.TextField(max_length=160, blank=True)
    meta_keywords = models.CharField(max_length=255, blank=True)
    
    class Meta:
        abstract = True


class RoadmapItem(TimeStampedModel):
    """Roadmap items for future features"""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('idea', 'Idea'),
        ('planning', 'Planning'),
        ('building', 'Building'),
        ('testing', 'Testing'),
        ('done', 'Done'),
        ('cancelled', 'Cancelled'),
    ]
    
    title = models.CharField(max_length=255)
    description = RichTextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='idea')
    estimated_completion = models.DateField(null=True, blank=True)
    completion_date = models.DateField(null=True, blank=True)
    is_public = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order', '-priority', 'created_at']
        verbose_name = 'Roadmap Item'
        verbose_name_plural = 'Roadmap Items'
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"


class Achievement(TimeStampedModel):
    """Portfolio achievements and milestones"""
    CATEGORY_CHOICES = [
        ('technical', 'Technical'),
        ('business', 'Business'),
        ('personal', 'Personal'),
        ('education', 'Education'),
        ('community', 'Community'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='technical')
    date_achieved = models.DateField()
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide React icon name")
    image = VersatileImageField(upload_to='achievements/', null=True, blank=True)
    url = models.URLField(blank=True, help_text="Link to certificate, article, etc.")
    is_featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-date_achieved', 'order']
        verbose_name = 'Achievement'
        verbose_name_plural = 'Achievements'
    
    def __str__(self):
        return self.title


class Testimonial(TimeStampedModel):
    """Client and colleague testimonials"""
    author_name = models.CharField(max_length=255)
    author_role = models.CharField(max_length=255, blank=True)
    author_company = models.CharField(max_length=255, blank=True)
    author_image = VersatileImageField(upload_to='testimonials/', null=True, blank=True)
    content = models.TextField()
    rating = models.PositiveSmallIntegerField(
        choices=[(i, i) for i in range(1, 6)], 
        default=5,
        help_text="Rating from 1 to 5 stars"
    )
    is_approved = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    project = models.ForeignKey('projects.Project', on_delete=models.SET_NULL, null=True, blank=True)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-is_featured', 'order', '-created_at']
        verbose_name = 'Testimonial'
        verbose_name_plural = 'Testimonials'
    
    def __str__(self):
        return f"{self.author_name} - {self.content[:50]}..."


class SiteConfiguration(models.Model):
    """Global site configuration"""
    site_name = models.CharField(max_length=255, default="Edzio's Portfolio")
    site_tagline = models.CharField(max_length=255, default="Full-Stack Developer & AI Enthusiast")
    hero_text = models.TextField(default="Welcome to my digital realm")
    about_short = models.TextField(help_text="Short bio for cards and previews")
    about_medium = models.TextField(help_text="Medium bio for about page")
    about_long = RichTextField(help_text="Detailed biography")
    
    # Contact information
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    location = models.CharField(max_length=255, blank=True)
    
    # Social media links
    github_url = models.URLField(blank=True)
    linkedin_url = models.URLField(blank=True)
    twitter_url = models.URLField(blank=True)
    mastodon_url = models.URLField(blank=True)
    
    # Freelance platform links
    upwork_url = models.URLField(blank=True)
    fiverr_url = models.URLField(blank=True)
    
    # AI Chatbot configuration
    chatbot_name = models.CharField(max_length=100, default="Edzio Assistant")
    chatbot_welcome_message = models.TextField(default="Hi! I'm here to help you learn about Edzio's work. Ask me anything!")
    chatbot_persona_professional = models.TextField(
        default="You are a professional portfolio assistant. Be concise and focus on achievements and technical skills."
    )
    chatbot_persona_technical = models.TextField(
        default="You are a technical expert. Provide detailed technical information and architecture insights."
    )
    chatbot_persona_casual = models.TextField(
        default="You are friendly and conversational. Make the interaction enjoyable while being informative."
    )
    
    # SEO
    meta_title = models.CharField(max_length=60, blank=True)
    meta_description = models.TextField(max_length=160, blank=True)
    
    # Images
    logo = VersatileImageField(upload_to='site/', null=True, blank=True)
    hero_image = VersatileImageField(upload_to='site/', null=True, blank=True)
    og_image = VersatileImageField(upload_to='site/', null=True, blank=True)
    
    class Meta:
        verbose_name = 'Site Configuration'
        verbose_name_plural = 'Site Configuration'
    
    def __str__(self):
        return self.site_name
    
    def save(self, *args, **kwargs):
        # Ensure only one instance exists
        self.pk = 1
        super().save(*args, **kwargs)
    
    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj