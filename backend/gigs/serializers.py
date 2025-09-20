from rest_framework import serializers
from projects.serializers import ProjectListSerializer
from .models import GigCategory, Gig, HireRequest


class GigCategorySerializer(serializers.ModelSerializer):
    gig_count = serializers.SerializerMethodField()
    
    class Meta:
        model = GigCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'color', 'gig_count']
    
    def get_gig_count(self, obj):
        return obj.gigs.filter(status='open').count()


class GigListSerializer(serializers.ModelSerializer):
    """Serializer for gig listings"""
    category = GigCategorySerializer(read_only=True)
    price_display = serializers.CharField(read_only=True)
    delivery_display = serializers.CharField(source='delivery_time_display', read_only=True)
    sample_project_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Gig
        fields = [
            'id', 'title', 'slug', 'category', 'short_description',
            'price_display', 'delivery_display', 'hero_image', 'status',
            'is_featured', 'sample_project_count', 'external_links'
        ]
    
    def get_sample_project_count(self, obj):
        return obj.sample_projects.count()


class GigDetailSerializer(serializers.ModelSerializer):
    """Detailed gig serializer"""
    category = GigCategorySerializer(read_only=True)
    sample_projects = ProjectListSerializer(many=True, read_only=True)
    price_display = serializers.CharField(read_only=True)
    delivery_display = serializers.CharField(source='delivery_time_display', read_only=True)
    
    class Meta:
        model = Gig
        fields = [
            'id', 'title', 'slug', 'category', 'short_description', 'long_description',
            'price_min', 'price_max', 'price_display', 'price_type',
            'delivery_time_min', 'delivery_time_max', 'delivery_display',
            'inclusions', 'exclusions', 'addons', 'requirements',
            'sample_projects', 'hero_image', 'gallery_images',
            'external_links', 'status', 'is_featured',
            'click_count', 'hire_count', 'created_at'
        ]


class HireRequestCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating hire requests"""
    terms_accepted = serializers.BooleanField(write_only=True)
    privacy_accepted = serializers.BooleanField(write_only=True)
    
    class Meta:
        model = HireRequest
        fields = [
            'name', 'email', 'company', 'phone', 'selected_gig',
            'project_title', 'message', 'proposed_budget', 'budget_details',
            'timeline', 'timeline_details', 'preferred_communication',
            'meeting_requested', 'meeting_availability', 'source',
            'terms_accepted', 'privacy_accepted'
        ]
    
    def validate(self, attrs):
        if not attrs.get('terms_accepted'):
            raise serializers.ValidationError("You must accept the terms of service")
        
        if not attrs.get('privacy_accepted'):
            raise serializers.ValidationError("You must accept the privacy policy")
        
        return attrs
    
    def create(self, validated_data):
        # Remove consent fields as they're not model fields
        validated_data.pop('terms_accepted', None)
        validated_data.pop('privacy_accepted', None)
        
        # Set user if authenticated
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        
        return HireRequest.objects.create(**validated_data)


class HireRequestDetailSerializer(serializers.ModelSerializer):
    """Detailed hire request serializer"""
    selected_gig = GigListSerializer(read_only=True)
    user_info = serializers.SerializerMethodField()
    
    class Meta:
        model = HireRequest
        fields = [
            'id', 'name', 'email', 'company', 'phone', 'user_info',
            'selected_gig', 'project_title', 'message',
            'proposed_budget', 'budget_details', 'timeline', 'timeline_details',
            'preferred_communication', 'meeting_requested', 'meeting_availability',
            'uploaded_files', 'proposal_preview', 'status',
            'created_at', 'updated_at'
        ]
    
    def get_user_info(self, obj):
        if obj.user:
            return {
                'id': obj.user.id,
                'username': obj.user.username,
                'avatar': obj.user.avatar.url if obj.user.avatar else None
            }
        return None


class HireRequestUpdateSerializer(serializers.ModelSerializer):
    """Admin serializer for updating hire requests"""
    class Meta:
        model = HireRequest
        fields = ['status', 'priority', 'admin_notes', 'follow_up_date']