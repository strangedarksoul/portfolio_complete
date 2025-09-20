from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from analytics.models import AnalyticsEvent

from .models import ExperimentCategory, Experiment
from .serializers import ExperimentCategorySerializer, ExperimentListSerializer, ExperimentDetailSerializer


class ExperimentCategoryListView(generics.ListAPIView):
    """List all active experiment categories"""
    permission_classes = [AllowAny]
    queryset = ExperimentCategory.objects.filter(is_active=True)
    serializer_class = ExperimentCategorySerializer


class ExperimentListView(generics.ListAPIView):
    """List all public experiments"""
    permission_classes = [AllowAny]
    serializer_class = ExperimentListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category__slug', 'status', 'is_featured']
    search_fields = ['title', 'description']
    ordering_fields = ['title', 'created_at', 'view_count']
    ordering = ['-is_featured', 'order', '-created_at']
    
    def get_queryset(self):
        return Experiment.objects.filter(is_public=True).select_related('category')


class ExperimentDetailView(generics.RetrieveAPIView):
    """Experiment detail view"""
    permission_classes = [AllowAny]
    queryset = Experiment.objects.filter(is_public=True)
    serializer_class = ExperimentDetailSerializer
    lookup_field = 'slug'
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Track experiment view
        AnalyticsEvent.objects.create(
            event_type='experiment_view',
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key,
            metadata={
                'experiment_id': instance.id,
                'experiment_title': instance.title,
                'experiment_slug': instance.slug,
                'category': instance.category.name if instance.category else None,
            }
        )
        
        # Increment view count
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class ExperimentClickTrackingView(APIView):
    """Track experiment clicks for analytics"""
    permission_classes = [AllowAny]
    
    def post(self, request, slug):
        try:
            experiment = Experiment.objects.get(slug=slug, is_public=True)
        except Experiment.DoesNotExist:
            return Response({'error': 'Experiment not found'}, status=status.HTTP_404_NOT_FOUND)
        
        click_type = request.data.get('click_type', 'demo')
        
        # Update click counts
        if click_type == 'demo':
            experiment.demo_clicks += 1
        elif click_type == 'code':
            experiment.code_clicks += 1
        
        experiment.save(update_fields=['demo_clicks', 'code_clicks'])
        
        # Track analytics event
        AnalyticsEvent.objects.create(
            event_type='experiment_click',
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key,
            metadata={
                'experiment_id': experiment.id,
                'experiment_title': experiment.title,
                'click_type': click_type,
            }
        )
        
        return Response({'status': 'success', 'message': 'Click tracked'})