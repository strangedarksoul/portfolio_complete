from rest_framework import generics, viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.db.models import Q
from analytics.models import AnalyticsEvent

from .models import Skill, Project, CaseStudy
from .serializers import (
    SkillSerializer, ProjectListSerializer, ProjectDetailSerializer,
    CaseStudySerializer, ProjectCreateUpdateSerializer, SkillProjectsSerializer
)


class SkillViewSet(viewsets.ReadOnlyModelViewSet):
    """Skills API endpoints"""
    queryset = Skill.objects.filter(projects__visibility='public').distinct()
    serializer_class = SkillSerializer
    lookup_field = 'slug'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'proficiency_level', 'is_featured']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'proficiency_level', 'order']
    ordering = ['category', 'order', 'name']


class ProjectListView(generics.ListAPIView):
    """List all public projects"""
    serializer_class = ProjectListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['role', 'is_featured', 'skills__name', 'skills__category']
    search_fields = ['title', 'short_tagline', 'description_short']
    ordering_fields = ['title', 'start_date', 'view_count']
    ordering = ['-is_featured', 'order', '-start_date']
    
    def get_queryset(self):
        return Project.objects.filter(visibility='public').prefetch_related('skills')


class ProjectDetailView(generics.RetrieveAPIView):
    """Project detail view"""
    queryset = Project.objects.filter(visibility='public')
    serializer_class = ProjectDetailSerializer
    lookup_field = 'slug'
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Track project view
        AnalyticsEvent.objects.create(
            event_type='project_view',
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key,
            metadata={
                'project_id': instance.id,
                'project_title': instance.title,
                'project_slug': instance.slug,
            }
        )
        
        # Increment view count
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class CaseStudyListView(generics.ListAPIView):
    """List published case studies"""
    queryset = CaseStudy.objects.filter(is_published=True, project__visibility='public')
    serializer_class = CaseStudySerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['project__role', 'project__skills__name']
    ordering_fields = ['reading_time', 'created_at']
    ordering = ['-created_at']


class CaseStudyDetailView(generics.RetrieveAPIView):
    """Case study detail view"""
    queryset = CaseStudy.objects.filter(is_published=True, project__visibility='public')
    serializer_class = CaseStudySerializer
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Track case study view
        AnalyticsEvent.objects.create(
            event_type='casestudy_view',
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key,
            metadata={
                'casestudy_id': instance.id,
                'project_id': instance.project.id,
                'project_title': instance.project.title,
            }
        )
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class SkillProjectsView(APIView):
    """Get projects that use a specific skill"""
    
    def get(self, request, slug):
        skill = get_object_or_404(Skill, slug=slug)
        projects = Project.objects.filter(
            skills=skill, 
            visibility='public'
        ).prefetch_related('skills')
        
        # Track skill exploration
        AnalyticsEvent.objects.create(
            event_type='skill_explore',
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key,
            metadata={
                'skill_id': skill.id,
                'skill_name': skill.name,
                'skill_slug': skill.slug,
            }
        )
        
        serializer = SkillProjectsSerializer(skill)
        return Response(serializer.data)


# Admin Views
class AdminProjectListView(generics.ListAPIView):
    """Admin: List all projects"""
    permission_classes = [IsAdminUser]
    queryset = Project.objects.all().prefetch_related('skills')
    serializer_class = ProjectDetailSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['visibility', 'is_featured', 'role']
    search_fields = ['title', 'description_short']
    ordering = ['-created_at']


class AdminProjectCreateView(generics.CreateAPIView):
    """Admin: Create new project"""
    permission_classes = [IsAdminUser]
    queryset = Project.objects.all()
    serializer_class = ProjectCreateUpdateSerializer


class AdminProjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin: Project detail/update/delete"""
    permission_classes = [IsAdminUser]
    queryset = Project.objects.all()
    serializer_class = ProjectCreateUpdateSerializer
    
    def get_serializer(self, *args, **kwargs):
        if self.request.method == 'GET':
            # Use detail serializer for GET requests
            kwargs['serializer_class'] = ProjectDetailSerializer
        return super().get_serializer(*args, **kwargs)