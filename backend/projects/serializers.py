from rest_framework import serializers
from .models import Skill, Project, CaseStudy, ProjectUpdate, ProjectCollaboration


class SkillSerializer(serializers.ModelSerializer):
    project_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Skill
        fields = [
            'id', 'name', 'slug', 'description', 'category', 
            'proficiency_level', 'icon', 'color', 'project_count'
        ]
    
    def get_project_count(self, obj):
        return obj.projects.filter(visibility='public').count()


class ProjectCollaborationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectCollaboration
        fields = ['name', 'role', 'contribution', 'profile_url', 'avatar']


class ProjectUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectUpdate
        fields = ['id', 'title', 'content', 'version', 'update_type', 'is_major', 'created_at']


class ProjectListSerializer(serializers.ModelSerializer):
    """Serializer for project listings"""
    skills = SkillSerializer(many=True, read_only=True)
    duration = serializers.CharField(source='duration_display', read_only=True)
    has_case_study = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'slug', 'short_tagline', 'description_short',
            'role', 'start_date', 'end_date', 'duration', 'is_ongoing',
            'hero_image', 'repo_url', 'live_demo_url', 'skills',
            'view_count', 'is_featured', 'has_case_study'
        ]
    
    def get_has_case_study(self, obj):
        return hasattr(obj, 'case_study') and obj.case_study.is_published


class ProjectDetailSerializer(serializers.ModelSerializer):
    """Detailed project serializer"""
    skills = SkillSerializer(many=True, read_only=True)
    tech_stack = SkillSerializer(many=True, read_only=True)
    collaborations = ProjectCollaborationSerializer(many=True, read_only=True)
    updates = ProjectUpdateSerializer(many=True, read_only=True)
    duration = serializers.CharField(source='duration_display', read_only=True)
    has_case_study = serializers.SerializerMethodField()
    case_study_id = serializers.SerializerMethodField()
    
    class Meta:
        model = Project
        fields = [
            'id', 'title', 'slug', 'short_tagline', 'description_short', 'description_long',
            'role', 'start_date', 'end_date', 'duration', 'is_ongoing',
            'hero_image', 'hero_video', 'gallery_images',
            'repo_url', 'live_demo_url', 'case_study_url',
            'metrics', 'skills', 'tech_stack', 'collaborations', 'updates',
            'view_count', 'is_featured', 'has_case_study', 'case_study_id',
            'created_at', 'updated_at'
        ]
    
    def get_has_case_study(self, obj):
        return hasattr(obj, 'case_study') and obj.case_study.is_published
    
    def get_case_study_id(self, obj):
        if hasattr(obj, 'case_study') and obj.case_study.is_published:
            return obj.case_study.id
        return None


class CaseStudySerializer(serializers.ModelSerializer):
    """Case study serializer"""
    project = ProjectListSerializer(read_only=True)
    
    class Meta:
        model = CaseStudy
        fields = [
            'id', 'project', 'problem_statement', 'constraints', 'approach',
            'architecture_description', 'implementation_notes', 'challenges',
            'results', 'lessons_learned', 'architecture_images',
            'before_after_images', 'timeline_data', 'attachments',
            'success_metrics', 'reading_time', 'created_at', 'updated_at'
        ]


class ProjectCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating projects (admin)"""
    skill_ids = serializers.ListField(
        child=serializers.IntegerField(), 
        write_only=True, 
        required=False
    )
    
    class Meta:
        model = Project
        fields = [
            'title', 'short_tagline', 'description_short', 'description_long',
            'role', 'start_date', 'end_date', 'is_ongoing',
            'hero_image', 'hero_video', 'gallery_images',
            'repo_url', 'live_demo_url', 'case_study_url',
            'metrics', 'visibility', 'is_featured', 'order',
            'skill_ids'
        ]
    
    def create(self, validated_data):
        skill_ids = validated_data.pop('skill_ids', [])
        project = Project.objects.create(**validated_data)
        
        if skill_ids:
            project.skills.set(skill_ids)
        
        return project
    
    def update(self, instance, validated_data):
        skill_ids = validated_data.pop('skill_ids', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if skill_ids is not None:
            instance.skills.set(skill_ids)
        
        return instance


class SkillProjectsSerializer(serializers.ModelSerializer):
    """Projects filtered by skill"""
    projects = ProjectListSerializer(many=True, read_only=True)
    
    class Meta:
        model = Skill
        fields = ['id', 'name', 'slug', 'description', 'category', 'proficiency_level', 'projects']