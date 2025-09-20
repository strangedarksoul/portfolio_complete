from rest_framework import serializers
from .models import ExperimentCategory, Experiment


class ExperimentCategorySerializer(serializers.ModelSerializer):
    experiment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ExperimentCategory
        fields = ['id', 'name', 'slug', 'description', 'icon', 'color', 'experiment_count']
    
    def get_experiment_count(self, obj):
        return obj.experiments.filter(is_public=True).count()


class ExperimentListSerializer(serializers.ModelSerializer):
    """Serializer for experiment listings"""
    category = ExperimentCategorySerializer(read_only=True)
    
    class Meta:
        model = Experiment
        fields = [
            'id', 'title', 'slug', 'description', 'category', 'status',
            'tech_stack', 'demo_url', 'code_url', 'hero_image',
            'is_featured', 'view_count', 'created_at'
        ]


class ExperimentDetailSerializer(serializers.ModelSerializer):
    """Detailed experiment serializer"""
    category = ExperimentCategorySerializer(read_only=True)
    engagement_rate = serializers.ReadOnlyField()
    
    class Meta:
        model = Experiment
        fields = [
            'id', 'title', 'slug', 'description', 'long_description',
            'category', 'status', 'tech_stack', 'demo_url', 'code_url',
            'hero_image', 'gallery_images', 'development_time',
            'inspiration', 'lessons_learned', 'view_count',
            'demo_clicks', 'code_clicks', 'engagement_rate',
            'is_featured', 'created_at', 'updated_at'
        ]