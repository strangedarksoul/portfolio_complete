from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework import generics
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings
import os
import uuid
import mimetypes
from .models import SiteConfiguration, Achievement, Testimonial, RoadmapItem
from .serializers import SiteConfigurationSerializer, AchievementSerializer, TestimonialSerializer, TestimonialCreateSerializer, RoadmapItemSerializer
from .serializers import FileUploadSerializer
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter
from analytics.models import AnalyticsEvent

User = get_user_model()


class PortalGreetingView(APIView):
    """Handle portal greeting logic"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        user_id = request.query_params.get('userId')
        
        # Track portal visit
        AnalyticsEvent.objects.create(
            event_type='portal_visit',
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key,
            metadata={
                'timestamp': timezone.now().isoformat(),
                'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            }
        )
        
        greeting_data = {
            'should_ask_name': True,
            'show_intro': True,
            'skip_portal': False,
            'greeting_message': "What's your name, traveler?",
            'welcome_message': "Welcome, {name}. I've been expecting you."
        }
        
        if request.user.is_authenticated:
            greeting_data.update({
                'should_ask_name': False,
                'greeting_message': f"Welcome back, {request.user.get_full_name() or request.user.username}!",
                'user_name': request.user.get_full_name() or request.user.username,
            })
        
        return Response(greeting_data)


class RememberUserView(APIView):
    """Handle user consent for localStorage storage"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        name = request.data.get('name')
        consent = request.data.get('consent', False)
        
        if not name or not consent:
            return Response(
                {'error': 'Name and consent are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Store preference in session for logged-in users
        if request.user.is_authenticated:
            request.session['display_name_preference'] = name
        
        # Track consent event
        AnalyticsEvent.objects.create(
            event_type='consent_given',
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key,
            metadata={
                'consent_type': 'localStorage',
                'name_provided': bool(name),
            }
        )
        
        return Response({'status': 'success', 'message': 'Preference saved'})


class SiteConfigView(APIView):
    """Get site configuration for frontend"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        config = SiteConfiguration.load()
        serializer = SiteConfigurationSerializer(config, context={'request': request})
        return Response(serializer.data)


class AchievementListView(generics.ListAPIView):
    """List achievements"""
    permission_classes = [AllowAny]
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['category', 'is_featured']
    ordering = ['-date_achieved', 'order']


class TestimonialListView(generics.ListAPIView):
    """List approved testimonials"""
    permission_classes = [AllowAny]
    queryset = Testimonial.objects.filter(is_approved=True)
    serializer_class = TestimonialSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['is_featured', 'rating']
    ordering = ['-is_featured', 'order', '-created_at']


class TestimonialCreateView(generics.CreateAPIView):
    """Submit testimonial"""
    queryset = Testimonial.objects.all()
    serializer_class = TestimonialCreateSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            testimonial = serializer.save()
            
            # Track testimonial submission
            AnalyticsEvent.objects.create(
                event_type='testimonial_submitted',
                user=request.user if request.user.is_authenticated else None,
                session_id=request.session.session_key,
                metadata={
                    'testimonial_id': testimonial.id,
                    'rating': testimonial.rating,
                    'has_project': testimonial.project is not None,
                }
            )
            
            return Response({
                'id': testimonial.id,
                'message': 'Testimonial submitted successfully. It will be reviewed before appearing on the site.',
                'status': 'pending_approval'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoadmapItemListView(generics.ListAPIView):
    """List public roadmap items"""
    permission_classes = [AllowAny]
    queryset = RoadmapItem.objects.filter(is_public=True)
    serializer_class = RoadmapItemSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'priority']
    ordering = ['order', '-priority', 'created_at']


class ResumeDataView(APIView):
    """Get structured resume data"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        from projects.models import Skill, Project
        
        config = SiteConfiguration.load()
        
        # Get all skills with project counts
        skills = Skill.objects.filter(projects__visibility='public').distinct()
        skills_data = []
        for skill in skills:
            skills_data.append({
                'name': skill.name,
                'category': skill.category,
                'proficiency_level': skill.proficiency_level,
                'proficiency': skill.proficiency_level,  # Frontend expects 'proficiency'
                'color': skill.color,
                'project_count': skill.projects.filter(visibility='public').count()
            })
        
        # Get featured projects
        projects = Project.objects.filter(visibility='public', is_featured=True)[:6]
        project_data = []
        for project in projects:
            project_data.append({
                'title': project.title,
                'description': project.short_tagline,  # Frontend expects 'description'
                'role': project.role,
                'duration': project.duration_display,
                'technologies': [skill.name for skill in project.skills.all()],  # Frontend expects 'technologies'
                'metrics': project.metrics or {}
            })
        
        # Get achievements
        achievements = Achievement.objects.all()[:10]
        achievement_data = []
        for achievement in achievements:
            achievement_data.append({
                'title': achievement.title,
                'description': achievement.description,
                'category': achievement.category,
                'date': achievement.date_achieved.isoformat(),  # Frontend expects 'date'
                'icon': achievement.icon
            })
        
        # Create experience data (mock data for now - could be from a separate model)
        experience_data = [
            {
                'title': 'Senior Full-Stack Developer',
                'company': 'Freelance',
                'duration': '2021 - Present',
                'description': 'Building scalable web applications and AI-powered solutions for startups and established companies.',
                'achievements': [
                    'Delivered 15+ production applications with 99.9% uptime',
                    'Implemented AI features that improved user engagement by 40%',
                    'Reduced development time by 30% through reusable component libraries',
                    'Mentored junior developers and established coding standards'
                ],
                'technologies': ['Python', 'Django', 'React', 'Next.js', 'PostgreSQL', 'AWS']
            },
            {
                'title': 'Full-Stack Developer',
                'company': 'TechStart Inc.',
                'duration': '2019 - 2021',
                'description': 'Led development of core platform features and API integrations.',
                'achievements': [
                    'Built REST APIs serving 10,000+ daily requests',
                    'Implemented real-time features using WebSockets',
                    'Optimized database queries reducing response time by 50%',
                    'Established CI/CD pipelines and deployment automation'
                ],
                'technologies': ['Python', 'Django', 'JavaScript', 'PostgreSQL', 'Redis', 'Docker']
            }
        ]
        
        # Create education data (mock data for now)
        education_data = [
            {
                'degree': 'Bachelor of Science in Computer Science',
                'institution': 'University of Technology',
                'year': '2019',
                'details': 'Graduated Magna Cum Laude with focus on Software Engineering and AI'
            },
            {
                'degree': 'AWS Certified Solutions Architect',
                'institution': 'Amazon Web Services',
                'year': '2023',
                'details': 'Professional certification in cloud architecture and best practices'
            }
        ]
        
        resume_data = {
            'personal': {
                'name': config.site_name,
                'title': config.site_tagline,
                'email': config.email,
                'location': config.location,
                'summary': config.about_medium,
                'github_url': config.github_url,
                'linkedin_url': config.linkedin_url,
            },
            'experience': experience_data,
            'skills': skills_data,
            'projects': project_data,
            'education': education_data,
            'achievements': achievement_data,
            'generated_at': timezone.now().isoformat()
        }
        
        return Response(resume_data)


class ResumeDownloadView(APIView):
    """Download resume as PDF"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        format_type = request.query_params.get('format', 'one-page')
        
        # Track download
        AnalyticsEvent.objects.create(
            event_type='resume_download',
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key,
            metadata={'format': format_type}
        )
        
        # For now, return a placeholder response
        # In production, this would generate and serve a PDF
        return Response({
            'message': f'Resume download ({format_type}) would be generated here',
            'format': format_type,
            'download_url': f'/static/resume_{format_type}.pdf'
        })
class FileUploadView(APIView):
    """Handle file uploads for various purposes"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = FileUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        uploaded_file = request.FILES.get('file')
        upload_type = serializer.validated_data.get('type', 'general')
        
        if not uploaded_file:
            return Response(
                {'error': 'No file provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (10MB limit)
        max_size = 10 * 1024 * 1024  # 10MB
        if uploaded_file.size > max_size:
            return Response(
                {'error': f'File size exceeds {max_size / (1024 * 1024)}MB limit'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file type
        allowed_types = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/zip',
            'video/mp4',
            'video/webm'
        ]
        
        file_type = mimetypes.guess_type(uploaded_file.name)[0]
        if file_type not in allowed_types:
            return Response(
                {'error': f'File type {file_type} not allowed'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Generate unique filename
            file_extension = os.path.splitext(uploaded_file.name)[1]
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            
            # Determine upload path based on type
            upload_paths = {
                'hire-request': 'uploads/hire-requests/',
                'testimonial': 'uploads/testimonials/',
                'general': 'uploads/general/',
            }
            upload_path = upload_paths.get(upload_type, 'uploads/general/')
            
            # Save file
            file_path = os.path.join(upload_path, unique_filename)
            saved_path = default_storage.save(file_path, ContentFile(uploaded_file.read()))
            
            # Get file URL
            file_url = default_storage.url(saved_path)
            
            # Track upload
            AnalyticsEvent.objects.create(
                event_type='file_upload',
                user=request.user if request.user.is_authenticated else None,
                session_id=request.session.session_key,
                metadata={
                    'filename': uploaded_file.name,
                    'file_size': uploaded_file.size,
                    'file_type': file_type,
                    'upload_type': upload_type,
                    'saved_path': saved_path,
                }
            )
            
            return Response({
                'status': 'success',
                'file': {
                    'name': uploaded_file.name,
                    'size': uploaded_file.size,
                    'type': file_type,
                    'url': file_url,
                    'path': saved_path,
                    'uploaded_at': timezone.now().isoformat(),
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'File upload failed: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )