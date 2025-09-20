from rest_framework import serializers
from .models import BlogCategory, BlogPost, BlogComment


class BlogCategorySerializer(serializers.ModelSerializer):
    post_count = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogCategory
        fields = ['id', 'name', 'slug', 'description', 'color', 'icon', 'post_count']
    
    def get_post_count(self, obj):
        return obj.posts.filter(status='published').count()


class BlogPostListSerializer(serializers.ModelSerializer):
    """Serializer for blog post listings"""
    category = BlogCategorySerializer(read_only=True)
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    comment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'subtitle', 'excerpt', 'category',
            'tags', 'featured_image', 'author_name', 'published_at',
            'reading_time', 'view_count', 'is_featured', 'comment_count'
        ]
    
    def get_comment_count(self, obj):
        return obj.comments.filter(is_approved=True).count()


class BlogPostDetailSerializer(serializers.ModelSerializer):
    """Detailed blog post serializer"""
    category = BlogCategorySerializer(read_only=True)
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    author_avatar = serializers.ImageField(source='author.avatar', read_only=True)
    comment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'subtitle', 'excerpt', 'content',
            'category', 'tags', 'featured_image', 'gallery_images',
            'author_name', 'author_avatar', 'published_at', 'updated_at',
            'reading_time', 'view_count', 'is_featured', 'allow_comments',
            'comment_count', 'meta_title', 'meta_description'
        ]
    
    def get_comment_count(self, obj):
        return obj.comments.filter(is_approved=True).count()


class BlogCommentSerializer(serializers.ModelSerializer):
    """Serializer for blog comments"""
    author_name = serializers.SerializerMethodField()
    author_avatar = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = BlogComment
        fields = [
            'id', 'content', 'author_name', 'author_avatar',
            'created_at', 'replies'
        ]
    
    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name()
        return obj.author_name
    
    def get_author_avatar(self, obj):
        if obj.author and obj.author.avatar:
            return obj.author.avatar.url
        return None
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return BlogCommentSerializer(
                obj.replies.filter(is_approved=True),
                many=True,
                context=self.context
            ).data
        return []


class BlogCommentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating blog comments"""
    
    class Meta:
        model = BlogComment
        fields = ['post', 'content', 'author_name', 'author_email', 'parent']
    
    def create(self, validated_data):
        request = self.context.get('request')
        
        # Set author if authenticated
        if request and request.user.is_authenticated:
            validated_data['author'] = request.user
            validated_data.pop('author_name', None)
            validated_data.pop('author_email', None)
        
        # Add IP and user agent for moderation
        if request:
            validated_data['ip_address'] = self.get_client_ip(request)
            validated_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')
        
        return BlogComment.objects.create(**validated_data)
    
    def get_client_ip(self, request):
        """Get client IP address"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip