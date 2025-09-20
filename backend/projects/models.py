from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify
from ckeditor.fields import RichTextField
from versatileimagefield.fields import VersatileImageField
from core.models import TimeStampedModel, SEOModel
import json

User = get_user_model()


class Skill(TimeStampedModel):
    """Skills and technologies"""
    PROFICIENCY_CHOICES = [
        (1, 'Beginner'),
        (2, 'Novice'),
        (3, 'Intermediate'),
        (4, 'Advanced'),
        (5, 'Expert'),
    ]
    
    CATEGORY_CHOICES = [
        ('language', 'Programming Language'),
        ('framework', 'Framework'),
        ('library', 'Library'),
        ('database', 'Database'),
        ('tool', 'Tool'),
        ('platform', 'Platform'),
        ('cloud', 'Cloud Service'),
        ('soft_skill', 'Soft Skill'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='language')
    proficiency_level = models.PositiveSmallIntegerField(choices=PROFICIENCY_CHOICES, default=3)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon class or URL")
    color = models.CharField(max_length=7, default="#007bff", help_text="Hex color code")
    is_featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['category', 'order', 'name']
        verbose_name = 'Skill'
        verbose_name_plural = 'Skills'
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Project(TimeStampedModel, SEOModel):
    """Portfolio projects"""
    VISIBILITY_CHOICES = [
        ('public', 'Public'),
        ('private', 'Private'),
        ('draft', 'Draft'),
    ]
    
    ROLE_CHOICES = [
        ('solo', 'Solo Developer'),
        ('lead', 'Team Lead'),
        ('frontend', 'Frontend Developer'),
        ('backend', 'Backend Developer'),
        ('fullstack', 'Full-Stack Developer'),
        ('consultant', 'Consultant'),
    ]
    
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    short_tagline = models.CharField(max_length=200, help_text="Brief description for cards")
    description_short = models.TextField(help_text="Short description for listings")
    description_long = RichTextField(help_text="Detailed project description")
    
    # Project details
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='fullstack')
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True, help_text="Leave empty for ongoing projects")
    is_ongoing = models.BooleanField(default=False)
    
    # Media
    hero_image = VersatileImageField(upload_to='projects/heroes/', null=True, blank=True)
    hero_video = models.URLField(blank=True, help_text="YouTube, Vimeo, or direct video URL")
    gallery_images = models.JSONField(default=list, help_text="List of image URLs")
    
    # External links
    repo_url = models.URLField(blank=True, help_text="GitHub repository URL")
    live_demo_url = models.URLField(blank=True, help_text="Live demo URL")
    case_study_url = models.URLField(blank=True, help_text="External case study URL")
    
    # Metrics and impact
    metrics = models.JSONField(
        default=dict, 
        help_text="Project metrics: users, revenue, performance improvements, etc."
    )
    
    # Organization
    skills = models.ManyToManyField(Skill, blank=True, related_name='projects')
    visibility = models.CharField(max_length=10, choices=VISIBILITY_CHOICES, default='public')
    is_featured = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    
    # View tracking
    view_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['-is_featured', 'order', '-start_date']
        verbose_name = 'Project'
        verbose_name_plural = 'Projects'
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
    
    @property
    def duration_display(self):
        """Human readable project duration"""
        if not self.end_date:
            return f"{self.start_date.strftime('%b %Y')} - Present"
        return f"{self.start_date.strftime('%b %Y')} - {self.end_date.strftime('%b %Y')}"
    
    @property
    def tech_stack(self):
        """Get list of technology skills for this project"""
        return self.skills.filter(category__in=['language', 'framework', 'library'])


class CaseStudy(TimeStampedModel, SEOModel):
    """Detailed case studies for projects"""
    project = models.OneToOneField(Project, on_delete=models.CASCADE, related_name='case_study')
    
    # Case study sections
    problem_statement = RichTextField(help_text="What problem did this project solve?")
    constraints = RichTextField(blank=True, help_text="Budget, time, technical constraints")
    approach = RichTextField(help_text="How did you approach the solution?")
    architecture_description = RichTextField(blank=True, help_text="Technical architecture overview")
    implementation_notes = RichTextField(blank=True, help_text="Key implementation details")
    challenges = RichTextField(blank=True, help_text="Major challenges and how they were overcome")
    results = RichTextField(help_text="Outcomes and metrics")
    lessons_learned = RichTextField(blank=True, help_text="Key takeaways and learnings")
    
    # Supporting media
    architecture_images = models.JSONField(default=list, help_text="Architecture diagrams and charts")
    before_after_images = models.JSONField(default=list, help_text="Before/after comparison images")
    timeline_data = models.JSONField(default=list, help_text="Project timeline milestones")
    attachments = models.JSONField(default=list, help_text="Additional files and documents")
    
    # Metrics and KPIs
    success_metrics = models.JSONField(
        default=dict, 
        help_text="Detailed success metrics and KPIs"
    )
    
    # Organization
    is_published = models.BooleanField(default=True)
    reading_time = models.PositiveIntegerField(default=5, help_text="Estimated reading time in minutes")
    
    class Meta:
        verbose_name = 'Case Study'
        verbose_name_plural = 'Case Studies'
    
    def __str__(self):
        return f"Case Study: {self.project.title}"


class ProjectUpdate(TimeStampedModel):
    """Project updates and changelog"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='updates')
    
    title = models.CharField(max_length=255)
    content = RichTextField()
    version = models.CharField(max_length=20, blank=True, help_text="Version number if applicable")
    update_type = models.CharField(
        max_length=20,
        choices=[
            ('feature', 'New Feature'),
            ('improvement', 'Improvement'),
            ('bugfix', 'Bug Fix'),
            ('security', 'Security Update'),
            ('milestone', 'Milestone'),
        ],
        default='feature'
    )
    
    is_major = models.BooleanField(default=False, help_text="Mark as major update")
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Project Update'
        verbose_name_plural = 'Project Updates'
    
    def __str__(self):
        return f"{self.project.title} - {self.title}"


class ProjectCollaboration(TimeStampedModel):
    """Project collaborators and team members"""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='collaborations')
    
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=255)
    contribution = models.TextField(blank=True, help_text="What they contributed to the project")
    profile_url = models.URLField(blank=True, help_text="LinkedIn, GitHub, or portfolio URL")
    avatar = VersatileImageField(upload_to='collaborators/', null=True, blank=True)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'name']
        verbose_name = 'Project Collaboration'
        verbose_name_plural = 'Project Collaborations'
    
    def __str__(self):
        return f"{self.name} - {self.project.title}"