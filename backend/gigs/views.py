from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.utils import timezone
from analytics.models import AnalyticsEvent

from .models import GigCategory, Gig, HireRequest, GigClick
from .serializers import (
    GigCategorySerializer, GigListSerializer, GigDetailSerializer,
    HireRequestCreateSerializer, HireRequestDetailSerializer, HireRequestUpdateSerializer
)
from .tasks import generate_hire_proposal, send_hire_confirmation


class GigCategoryListView(generics.ListAPIView):
    """List all active gig categories"""
    queryset = GigCategory.objects.filter(is_active=True)
    serializer_class = GigCategorySerializer


class GigListView(generics.ListAPIView):
    """List all available gigs"""
    serializer_class = GigListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category__slug', 'status', 'is_featured', 'price_type']
    search_fields = ['title', 'short_description']
    ordering_fields = ['title', 'price_min', 'created_at']
    ordering = ['-is_featured', 'order', 'title']
    
    def get_queryset(self):
        return Gig.objects.filter(status__in=['open', 'limited']).select_related('category')


class GigDetailView(generics.RetrieveAPIView):
    """Gig detail view"""
    queryset = Gig.objects.filter(status__in=['open', 'limited'])
    serializer_class = GigDetailSerializer
    lookup_field = 'slug'
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Track gig view
        AnalyticsEvent.objects.create(
            event_type='gig_view',
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key,
            metadata={
                'gig_id': instance.id,
                'gig_title': instance.title,
                'gig_slug': instance.slug,
            }
        )
        
        # Track click in the gig model
        GigClick.objects.create(
            gig=instance,
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key,
            click_type='view'
        )
        
        # Increment click count
        instance.click_count += 1
        instance.save(update_fields=['click_count'])
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class GigClickTrackingView(APIView):
    """Track gig clicks for analytics"""
    
    def post(self, request, slug):
        gig = get_object_or_404(Gig, slug=slug, status__in=['open', 'limited'])
        
        click_type = request.data.get('click_type', 'hire')
        external_platform = request.data.get('external_platform', '')
        
        # Track click
        GigClick.objects.create(
            gig=gig,
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key,
            click_type=click_type,
            external_platform=external_platform,
            metadata=request.data.get('metadata', {})
        )
        
        # Track analytics event
        AnalyticsEvent.objects.create(
            event_type='gig_click',
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key,
            metadata={
                'gig_id': gig.id,
                'gig_title': gig.title,
                'click_type': click_type,
                'external_platform': external_platform,
            }
        )
        
        # Update gig counters
        if click_type == 'hire':
            gig.inquiry_count += 1
        gig.click_count += 1
        gig.save(update_fields=['click_count', 'inquiry_count'])
        
        return Response({'status': 'success', 'message': 'Click tracked'})


class HireRequestCreateView(generics.CreateAPIView):
    """Create new hire request"""
    queryset = HireRequest.objects.all()
    serializer_class = HireRequestCreateSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            hire_request = serializer.save()
            
            # Generate AI proposal preview (async task)
            generate_hire_proposal.delay(hire_request.id)
            
            # Send confirmation email (async task)
            send_hire_confirmation.delay(hire_request.id)
            
            # Track hire request
            AnalyticsEvent.objects.create(
                event_type='hire_request',
                user=request.user if request.user.is_authenticated else None,
                session_id=request.session.session_key,
                metadata={
                    'hire_request_id': hire_request.id,
                    'gig_id': hire_request.selected_gig.id if hire_request.selected_gig else None,
                    'budget_range': hire_request.proposed_budget,
                    'timeline': hire_request.timeline,
                }
            )
            
            # Update gig hire count
            if hire_request.selected_gig:
                hire_request.selected_gig.hire_count += 1
                hire_request.selected_gig.save(update_fields=['hire_count'])
            
            return Response({
                'id': hire_request.id,
                'message': 'Hire request submitted successfully. You will receive a confirmation email shortly.',
                'status': 'success'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HireRequestDetailView(generics.RetrieveAPIView):
    """Get hire request details (for user or admin)"""
    serializer_class = HireRequestDetailSerializer
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return HireRequest.objects.all()
        elif self.request.user.is_authenticated:
            return HireRequest.objects.filter(user=self.request.user)
        return HireRequest.objects.none()


# Admin Views
class AdminGigListView(generics.ListAPIView):
    """Admin: List all gigs"""
    permission_classes = [IsAdminUser]
    queryset = Gig.objects.all().select_related('category')
    serializer_class = GigDetailSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'is_featured', 'category']
    search_fields = ['title', 'short_description']
    ordering = ['-created_at']


class AdminLeadListView(generics.ListAPIView):
    """Admin: List all hire requests/leads"""
    permission_classes = [IsAdminUser]
    queryset = HireRequest.objects.all().select_related('user', 'selected_gig')
    serializer_class = HireRequestDetailSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'priority', 'selected_gig', 'proposed_budget']
    search_fields = ['name', 'email', 'company', 'message']
    ordering = ['-created_at']


class AdminLeadDetailView(generics.RetrieveUpdateAPIView):
    """Admin: Get and update lead details"""
    permission_classes = [IsAdminUser]
    queryset = HireRequest.objects.all()
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return HireRequestDetailSerializer
        return HireRequestUpdateSerializer