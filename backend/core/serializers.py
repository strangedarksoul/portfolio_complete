from rest_framework import serializers
from .models import SiteConfiguration, RoadmapItem, Achievement, Testimonial


class FileUploadSerializer(serializers.Serializer):
    """Serializer for file uploads"""
    type = serializers.ChoiceField(
        choices=[
            ('hire-request', 'Hire Request'),
            ('testimonial', 'Testimonial'),
            ('general', 'General'),
        ],
        default='general'
    )
    
    def validate(self, attrs):
        # Additional validation can be added here
        return attrs


class SiteConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteConfiguration
        fields = [
            'site_name', 'site_tagline', 'hero_text',
            'about_short', 'about_medium', 
            'email', 'location',
            'github_url', 'linkedin_url', 'twitter_url', 'mastodon_url',
            'upwork_url', 'fiverr_url',
            'chatbot_name', 'chatbot_welcome_message',
            'meta_title', 'meta_description',
            'logo', 'hero_image'
        ]


class RoadmapItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoadmapItem
        fields = [
            'id', 'title', 'description', 'priority', 'status',
            'estimated_completion', 'completion_date', 'order', 'created_at'
        ]


class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = [
            'id', 'title', 'description', 'category', 'date_achieved',
            'icon', 'image', 'url', 'order'
        ]


class TestimonialSerializer(serializers.ModelSerializer):
    project_title = serializers.CharField(source='project.title', read_only=True)
    
    class Meta:
        model = Testimonial
        fields = [
            'id', 'author_name', 'author_role', 'author_company',
            'author_image', 'content', 'rating', 'project_title',
            'created_at'
        ]


class TestimonialCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating testimonials"""
    
    class Meta:
        model = Testimonial
        fields = [
            'author_name', 'author_role', 'author_company',
            'content', 'rating', 'project'
        ]
    
    def create(self, validated_data):
        # Set user if authenticated
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['user'] = request.user
        
        # Testimonials require approval by default
        validated_data['is_approved'] = False
        
        return Testimonial.objects.create(**validated_data)