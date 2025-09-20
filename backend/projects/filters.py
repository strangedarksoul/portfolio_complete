import django_filters
from django.db import models
from .models import Project, Skill, CaseStudy


class ProjectFilter(django_filters.FilterSet):
    title = django_filters.CharFilter(lookup_expr='icontains')
    role = django_filters.ChoiceFilter(choices=Project.ROLE_CHOICES)
    visibility = django_filters.ChoiceFilter(choices=Project.VISIBILITY_CHOICES)
    is_featured = django_filters.BooleanFilter()
    is_ongoing = django_filters.BooleanFilter()
    
    # Date filters
    start_date_after = django_filters.DateFilter(field_name='start_date', lookup_expr='gte')
    start_date_before = django_filters.DateFilter(field_name='start_date', lookup_expr='lte')
    end_date_after = django_filters.DateFilter(field_name='end_date', lookup_expr='gte')
    end_date_before = django_filters.DateFilter(field_name='end_date', lookup_expr='lte')
    
    # Skills filter
    skills = django_filters.ModelMultipleChoiceFilter(
        queryset=Skill.objects.all(),
        field_name='skills',
        to_field_name='slug'
    )
    
    skill_category = django_filters.CharFilter(
        field_name='skills__category',
        lookup_expr='exact'
    )
    
    # View count filter
    min_views = django_filters.NumberFilter(field_name='view_count', lookup_expr='gte')
    max_views = django_filters.NumberFilter(field_name='view_count', lookup_expr='lte')
    
    # Has case study
    has_case_study = django_filters.BooleanFilter(
        field_name='case_study',
        lookup_expr='isnull',
        exclude=True
    )
    
    # Search across multiple fields
    search = django_filters.CharFilter(method='filter_search')
    
    def filter_search(self, queryset, name, value):
        return queryset.filter(
            models.Q(title__icontains=value) |
            models.Q(short_tagline__icontains=value) |
            models.Q(description_short__icontains=value) |
            models.Q(skills__name__icontains=value)
        ).distinct()

    class Meta:
        model = Project
        fields = [
            'title', 'role', 'visibility', 'is_featured', 'is_ongoing',
            'skills', 'skill_category'
        ]


class SkillFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr='icontains')
    category = django_filters.ChoiceFilter(choices=Skill.CATEGORY_CHOICES)
    proficiency_level = django_filters.NumberFilter()
    min_proficiency = django_filters.NumberFilter(field_name='proficiency_level', lookup_expr='gte')
    max_proficiency = django_filters.NumberFilter(field_name='proficiency_level', lookup_expr='lte')
    is_featured = django_filters.BooleanFilter()
    
    # Has projects
    has_projects = django_filters.BooleanFilter(
        field_name='projects',
        lookup_expr='isnull',
        exclude=True
    )
    
    # Project count filters
    min_project_count = django_filters.NumberFilter(method='filter_min_project_count')
    max_project_count = django_filters.NumberFilter(method='filter_max_project_count')
    
    def filter_min_project_count(self, queryset, name, value):
        return queryset.annotate(
            project_count=models.Count('projects', filter=models.Q(projects__visibility='public'))
        ).filter(project_count__gte=value)
    
    def filter_max_project_count(self, queryset, name, value):
        return queryset.annotate(
            project_count=models.Count('projects', filter=models.Q(projects__visibility='public'))
        ).filter(project_count__lte=value)

    class Meta:
        model = Skill
        fields = ['name', 'category', 'proficiency_level', 'is_featured']


class CaseStudyFilter(django_filters.FilterSet):
    is_published = django_filters.BooleanFilter()
    project_title = django_filters.CharFilter(field_name='project__title', lookup_expr='icontains')
    project_role = django_filters.ChoiceFilter(field_name='project__role', choices=Project.ROLE_CHOICES)
    project_skills = django_filters.ModelMultipleChoiceFilter(
        queryset=Skill.objects.all(),
        field_name='project__skills',
        to_field_name='slug'
    )
    
    # Reading time filters
    min_reading_time = django_filters.NumberFilter(field_name='reading_time', lookup_expr='gte')
    max_reading_time = django_filters.NumberFilter(field_name='reading_time', lookup_expr='lte')
    
    # Date filters
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    # Search
    search = django_filters.CharFilter(method='filter_search')
    
    def filter_search(self, queryset, name, value):
        return queryset.filter(
            models.Q(project__title__icontains=value) |
            models.Q(problem_statement__icontains=value) |
            models.Q(approach__icontains=value) |
            models.Q(results__icontains=value)
        ).distinct()

    class Meta:
        model = CaseStudy
        fields = ['is_published']


class PublicProjectFilter(ProjectFilter):
    """Filter for public projects only"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Always filter to public projects
        self.queryset = self.queryset.filter(visibility='public')


class FeaturedContentFilter(django_filters.FilterSet):
    """Filter for featured content across models"""
    content_type = django_filters.CharFilter(method='filter_content_type')
    
    def filter_content_type(self, queryset, name, value):
        if value == 'projects':
            return Project.objects.filter(is_featured=True, visibility='public')
        elif value == 'skills':
            return Skill.objects.filter(is_featured=True)
        return queryset.none()