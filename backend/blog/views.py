from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.shortcuts import get_object_or_404
from django.db.models import Q
from analytics.models import AnalyticsEvent

from .models import BlogCategory, BlogPost, BlogComment
from .serializers import (
    BlogCategorySerializer, BlogPostListSerializer, BlogPostDetailSerializer,
    BlogCommentSerializer, BlogCommentCreateSerializer
)


class BlogCategoryListView(generics.ListAPIView):
    """List all active blog categories"""
    permission_classes = [AllowAny]
    queryset = BlogCategory.objects.filter(is_active=True)
    serializer_class = BlogCategorySerializer


class BlogPostListView(generics.ListAPIView):
    """List published blog posts"""
    permission_classes = [AllowAny]
    serializer_class = BlogPostListSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category__slug', 'is_featured']
    search_fields = ['title', 'excerpt', 'content']
    ordering_fields = ['published_at', 'view_count', 'title']
    ordering = ['-is_featured', '-published_at']
    
    def get_queryset(self):
        return BlogPost.objects.filter(
            status='published'
        ).select_related('category', 'author')


class BlogPostDetailView(generics.RetrieveAPIView):
    """Blog post detail view"""
    permission_classes = [AllowAny]
    queryset = BlogPost.objects.filter(status='published')
    serializer_class = BlogPostDetailSerializer
    lookup_field = 'slug'
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Track blog post view
        AnalyticsEvent.objects.create(
            event_type='blog_view',
            user=request.user if request.user.is_authenticated else None,
            session_id=request.session.session_key,
            metadata={
                'post_id': instance.id,
                'post_title': instance.title,
                'post_slug': instance.slug,
                'category': instance.category.name if instance.category else None,
            }
        )
        
        # Increment view count
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class BlogPostByCategoryView(generics.ListAPIView):
    """List blog posts by category"""
    permission_classes = [AllowAny]
    serializer_class = BlogPostListSerializer
    filter_backends = [OrderingFilter]
    ordering = ['-published_at']
    
    def get_queryset(self):
        category_slug = self.kwargs['category_slug']
        return BlogPost.objects.filter(
            status='published',
            category__slug=category_slug
        ).select_related('category', 'author')


class BlogPostByTagView(generics.ListAPIView):
    """List blog posts by tag"""
    permission_classes = [AllowAny]
    serializer_class = BlogPostListSerializer
    filter_backends = [OrderingFilter]
    ordering = ['-published_at']
    
    def get_queryset(self):
        tag = self.kwargs['tag']
        return BlogPost.objects.filter(
            status='published',
            tags__contains=[tag]
        ).select_related('category', 'author')


class BlogSearchView(generics.ListAPIView):
    """Search blog posts"""
    permission_classes = [AllowAny]
    serializer_class = BlogPostListSerializer
    
    def get_queryset(self):
        query = self.request.query_params.get('q', '')
        if not query:
            return BlogPost.objects.none()
        
        # Track search
        AnalyticsEvent.objects.create(
            event_type='blog_search',
            user=self.request.user if self.request.user.is_authenticated else None,
            session_id=self.request.session.session_key,
            metadata={'query': query}
        )
        
        return BlogPost.objects.filter(
            Q(title__icontains=query) |
            Q(excerpt__icontains=query) |
            Q(content__icontains=query) |
            Q(tags__contains=[query]),
            status='published'
        ).select_related('category', 'author').distinct()


class BlogCommentListView(generics.ListAPIView):
    """List comments for a blog post"""
    permission_classes = [AllowAny]
    serializer_class = BlogCommentSerializer
    
    def get_queryset(self):
        post_slug = self.kwargs['slug']
        post = get_object_or_404(BlogPost, slug=post_slug, status='published')
        
        return BlogComment.objects.filter(
            post=post,
            is_approved=True,
            parent__isnull=True  # Only top-level comments, replies are nested
        ).select_related('author').prefetch_related('replies')


class BlogCommentCreateView(generics.CreateAPIView):
    """Create a new blog comment"""
    permission_classes = [AllowAny]
    queryset = BlogComment.objects.all()
    serializer_class = BlogCommentCreateSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            comment = serializer.save()
            
            # Track comment creation
            AnalyticsEvent.objects.create(
                event_type='blog_comment',
                user=request.user if request.user.is_authenticated else None,
                session_id=request.session.session_key,
                metadata={
                    'post_id': comment.post.id,
                    'post_title': comment.post.title,
                    'is_reply': comment.parent is not None,
                }
            )
            
            return Response({
                'id': comment.id,
                'message': 'Comment submitted successfully. It will be reviewed before appearing on the site.',
                'status': 'pending_approval'
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)