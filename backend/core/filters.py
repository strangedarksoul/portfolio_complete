import django_filters
from django.db import models
from .models import RoadmapItem, Achievement, Testimonial


class RoadmapItemFilter(django_filters.FilterSet):
    status = django_filters.ChoiceFilter(choices=RoadmapItem.STATUS_CHOICES)
    priority = django_filters.ChoiceFilter(choices=RoadmapItem.PRIORITY_CHOICES)
    is_public = django_filters.BooleanFilter()
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = RoadmapItem
        fields = ['status', 'priority', 'is_public']


class AchievementFilter(django_filters.FilterSet):
    category = django_filters.ChoiceFilter(choices=Achievement.CATEGORY_CHOICES)
    is_featured = django_filters.BooleanFilter()
    date_after = django_filters.DateFilter(field_name='date_achieved', lookup_expr='gte')
    date_before = django_filters.DateFilter(field_name='date_achieved', lookup_expr='lte')

    class Meta:
        model = Achievement
        fields = ['category', 'is_featured']


class TestimonialFilter(django_filters.FilterSet):
    rating = django_filters.NumberFilter()
    rating_gte = django_filters.NumberFilter(field_name='rating', lookup_expr='gte')
    is_approved = django_filters.BooleanFilter()
    is_featured = django_filters.BooleanFilter()
    has_project = django_filters.BooleanFilter(field_name='project', lookup_expr='isnull', exclude=True)

    class Meta:
        model = Testimonial
        fields = ['rating', 'is_approved', 'is_featured']


class DateRangeFilter(django_filters.FilterSet):
    """Base filter for date range filtering"""
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    updated_after = django_filters.DateTimeFilter(field_name='updated_at', lookup_expr='gte')
    updated_before = django_filters.DateTimeFilter(field_name='updated_at', lookup_expr='lte')


class SearchFilter(django_filters.FilterSet):
    """Base filter for text search"""
    search = django_filters.CharFilter(method='filter_search')

    def filter_search(self, queryset, name, value):
        """Override in subclasses to define search fields"""
        return queryset


class PublicContentFilter(django_filters.FilterSet):
    """Filter for public content visibility"""
    is_public = django_filters.BooleanFilter()
    is_featured = django_filters.BooleanFilter()
    status = django_filters.CharFilter()