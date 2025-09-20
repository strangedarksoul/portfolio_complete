from django.db import models
from django.utils.text import slugify
from ckeditor.fields import RichTextField
from versatileimagefield.fields import VersatileImageField
from core.models import TimeStampedModel


class ExperimentCategory(TimeStampedModel):
    """Categories for organizing experiments"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide React icon name")
    color = models.CharField(max_length=7, default="#007bff", help_text="Hex color code")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Experiment Category'
        verbose_name_plural = 'Experiment Categories'
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Experiment(TimeStampedModel):
    """Experimental projects and prototypes"""
    STATUS_CHOICES = [
        ('concept', 'Concept'),
        ('development', 'In Development'),
        ('beta', 'Beta'),
        ('live', 'Live'),
        ('archived', 'Archived'),
    ]
    
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    description = models.TextField(help_text="Brief description of the experiment")
    long_description = RichTextField(blank=True, help_text="Detailed description")
    
    # Category and organization
    category = models.ForeignKey(ExperimentCategory, on_delete=models.SET_NULL, null=True, related_name='experiments')
    
    # Status and visibility
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='concept')
    is_featured = models.BooleanField(default=False)
    is_public = models.BooleanField(default=True)
    
    # Technology stack
    tech_stack = models.JSONField(default=list, help_text="List of technologies used")
    
    # Links
    demo_url = models.URLField(blank=True, help_text="Live demo URL")
    code_url = models.URLField(blank=True, help_text="Source code URL")
    
    # Media
    hero_image = VersatileImageField(upload_to='experiments/', null=True, blank=True)
    gallery_images = models.JSONField(default=list, help_text="Additional images")
    
    # Metrics
    view_count = models.PositiveIntegerField(default=0)
    demo_clicks = models.PositiveIntegerField(default=0)
    code_clicks = models.PositiveIntegerField(default=0)
    
    # Metadata
    development_time = models.CharField(max_length=100, blank=True, help_text="Time spent developing")
    inspiration = models.TextField(blank=True, help_text="What inspired this experiment")
    lessons_learned = models.TextField(blank=True, help_text="Key takeaways")
    
    # Organization
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-is_featured', 'order', '-created_at']
        verbose_name = 'Experiment'
        verbose_name_plural = 'Experiments'
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
    
    @property
    def engagement_rate(self):
        """Calculate engagement rate from views to clicks"""
        if self.view_count == 0:
            return 0
        total_clicks = self.demo_clicks + self.code_clicks
        return (total_clicks / self.view_count) * 100