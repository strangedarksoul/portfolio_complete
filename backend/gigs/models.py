from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from ckeditor.fields import RichTextField
from versatileimagefield.fields import VersatileImageField
from core.models import TimeStampedModel
import json

User = get_user_model()


class GigCategory(TimeStampedModel):
    """Categories for organizing gigs"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide React icon name")
    color = models.CharField(max_length=7, default="#007bff", help_text="Hex color code")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Gig Category'
        verbose_name_plural = 'Gig Categories'
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Gig(TimeStampedModel):
    """Service offerings/gigs"""
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('limited', 'Limited Availability'),
        ('closed', 'Closed'),
        ('paused', 'Paused'),
    ]
    
    DELIVERY_UNIT_CHOICES = [
        ('days', 'Days'),
        ('weeks', 'Weeks'),
        ('months', 'Months'),
    ]
    
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    category = models.ForeignKey(GigCategory, on_delete=models.SET_NULL, null=True, related_name='gigs')
    
    # Basic description
    short_description = models.CharField(max_length=300, help_text="Brief description for cards")
    long_description = RichTextField(help_text="Detailed service description")
    
    # Pricing
    price_min = models.DecimalField(max_digits=10, decimal_places=2, help_text="Minimum price")
    price_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Maximum price (optional)")
    price_currency = models.CharField(max_length=3, default='USD')
    price_type = models.CharField(
        max_length=20,
        choices=[
            ('fixed', 'Fixed Price'),
            ('hourly', 'Hourly Rate'),
            ('project', 'Per Project'),
            ('retainer', 'Monthly Retainer'),
        ],
        default='fixed'
    )
    
    # Delivery
    delivery_time_min = models.PositiveIntegerField(help_text="Minimum delivery time")
    delivery_time_max = models.PositiveIntegerField(null=True, blank=True, help_text="Maximum delivery time (optional)")
    delivery_time_unit = models.CharField(max_length=10, choices=DELIVERY_UNIT_CHOICES, default='days')
    
    # What's included
    inclusions = models.JSONField(default=list, help_text="List of what's included in the service")
    exclusions = models.JSONField(default=list, help_text="List of what's NOT included")
    
    # Add-ons and extras
    addons = models.JSONField(
        default=list, 
        help_text="Optional add-ons with pricing: [{'name': 'X', 'price': 100, 'description': 'Y'}]"
    )
    
    # Requirements from client
    requirements = models.JSONField(
        default=list, 
        help_text="What the client needs to provide: briefing, assets, access, etc."
    )
    
    # Sample work
    sample_projects = models.ManyToManyField(
        'projects.Project', 
        blank=True, 
        help_text="Related projects that showcase this service"
    )
    
    # External platform links
    external_links = models.JSONField(
        default=dict, 
        help_text="Links to Upwork, Fiverr, etc.: {'upwork': 'url', 'fiverr': 'url'}"
    )
    
    # Media
    hero_image = VersatileImageField(upload_to='gigs/', null=True, blank=True)
    gallery_images = models.JSONField(default=list, help_text="Additional showcase images")
    
    # Status and organization
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    is_featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    
    # Performance tracking
    click_count = models.PositiveIntegerField(default=0)
    inquiry_count = models.PositiveIntegerField(default=0)
    hire_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-is_featured', 'order', 'title']
        verbose_name = 'Gig'
        verbose_name_plural = 'Gigs'
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
    
    @property
    def price_display(self):
        """Human readable price display"""
        if self.price_max:
            return f"${self.price_min:,.0f} - ${self.price_max:,.0f}"
        return f"Starting at ${self.price_min:,.0f}"
    
    @property
    def delivery_time_display(self):
        """Human readable delivery time"""
        if self.delivery_time_max:
            return f"{self.delivery_time_min}-{self.delivery_time_max} {self.delivery_time_unit}"
        return f"{self.delivery_time_min} {self.delivery_time_unit}"
    
    @property
    def conversion_rate(self):
        """Calculate conversion rate from clicks to hires"""
        if self.click_count == 0:
            return 0
        return (self.hire_count / self.click_count) * 100


class HireRequest(TimeStampedModel):
    """Hire requests/leads from potential clients"""
    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('in_discussion', 'In Discussion'),
        ('proposal_sent', 'Proposal Sent'),
        ('negotiating', 'Negotiating'),
        ('accepted', 'Accepted'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('rejected', 'Rejected'),
    ]
    
    BUDGET_RANGE_CHOICES = [
        ('under_1k', 'Under $1,000'),
        ('1k_5k', '$1,000 - $5,000'),
        ('5k_10k', '$5,000 - $10,000'),
        ('10k_25k', '$10,000 - $25,000'),
        ('25k_50k', '$25,000 - $50,000'),
        ('over_50k', 'Over $50,000'),
        ('negotiable', 'Negotiable'),
    ]
    
    TIMELINE_CHOICES = [
        ('asap', 'ASAP'),
        ('1_week', '1 Week'),
        ('2_weeks', '2 Weeks'),
        ('1_month', '1 Month'),
        ('2_months', '2 Months'),
        ('3_months', '3 Months'),
        ('6_months', '6+ Months'),
        ('flexible', 'Flexible'),
    ]
    
    # User information (can be anonymous)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=255)
    email = models.EmailField()
    company = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    
    # Project details
    selected_gig = models.ForeignKey(Gig, on_delete=models.SET_NULL, null=True, blank=True)
    project_title = models.CharField(max_length=255, blank=True)
    message = models.TextField(help_text="Project description and requirements")
    
    # Budget and timeline
    proposed_budget = models.CharField(max_length=20, choices=BUDGET_RANGE_CHOICES, default='negotiable')
    budget_details = models.TextField(blank=True, help_text="Additional budget context")
    timeline = models.CharField(max_length=20, choices=TIMELINE_CHOICES, default='flexible')
    timeline_details = models.TextField(blank=True, help_text="Additional timeline context")
    
    # Communication preferences
    preferred_communication = models.JSONField(
        default=list, 
        help_text="Preferred communication methods: email, slack, zoom, etc."
    )
    meeting_requested = models.BooleanField(default=False)
    meeting_availability = models.TextField(blank=True, help_text="Available times for meeting")
    
    # File uploads
    uploaded_files = models.JSONField(
        default=list, 
        help_text="List of uploaded file paths and metadata"
    )
    
    # AI-generated proposal
    proposal_preview = models.TextField(blank=True, help_text="AI-generated proposal preview")
    proposal_sent = models.BooleanField(default=False)
    proposal_sent_at = models.DateTimeField(null=True, blank=True)
    
    # Lead management
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    priority = models.CharField(
        max_length=10,
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')],
        default='medium'
    )
    
    # Admin notes and follow-up
    admin_notes = models.TextField(blank=True, help_text="Internal notes for lead management")
    follow_up_date = models.DateField(null=True, blank=True)
    
    # Conversion tracking
    source = models.CharField(max_length=100, blank=True, help_text="How they found the service")
    utm_params = models.JSONField(default=dict, help_text="UTM parameters for tracking")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Hire Request'
        verbose_name_plural = 'Hire Requests'
    
    def __str__(self):
        gig_title = self.selected_gig.title if self.selected_gig else "General Inquiry"
        return f"{self.name} - {gig_title} ({self.status})"


class GigClick(TimeStampedModel):
    """Track gig clicks for analytics"""
    gig = models.ForeignKey(Gig, on_delete=models.CASCADE, related_name='clicks')
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    session_id = models.CharField(max_length=100)
    click_type = models.CharField(
        max_length=20,
        choices=[
            ('view', 'View Details'),
            ('hire', 'Hire Button'),
            ('external', 'External Platform'),
            ('sample', 'Sample Project'),
        ],
        default='view'
    )
    external_platform = models.CharField(max_length=50, blank=True, help_text="upwork, fiverr, etc.")
    metadata = models.JSONField(default=dict)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Gig Click'
        verbose_name_plural = 'Gig Clicks'
    
    def __str__(self):
        return f"{self.gig.title} - {self.click_type} ({self.created_at})"