from django.contrib import admin
from django.utils.html import format_html
from .models import Skill, Project, CaseStudy, ProjectUpdate, ProjectCollaboration


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'proficiency_level', 'is_featured', 'color_display', 'order']
    list_filter = ['category', 'proficiency_level', 'is_featured']
    search_fields = ['name', 'description']
    list_editable = ['proficiency_level', 'is_featured', 'order']
    prepopulated_fields = {'slug': ('name',)}
    
    def color_display(self, obj):
        return format_html(
            '<span style="background: {}; color: white; padding: 2px 8px; border-radius: 3px;">{}</span>',
            obj.color, obj.color
        )
    color_display.short_description = 'Color'


class ProjectUpdateInline(admin.TabularInline):
    model = ProjectUpdate
    extra = 0
    fields = ['title', 'update_type', 'is_major', 'created_at']
    readonly_fields = ['created_at']


class ProjectCollaborationInline(admin.TabularInline):
    model = ProjectCollaboration
    extra = 0
    fields = ['name', 'role', 'order']


class CaseStudyInline(admin.StackedInline):
    model = CaseStudy
    extra = 0
    fields = ['is_published', 'reading_time']


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ['title', 'role', 'visibility', 'is_featured', 'start_date', 'view_count', 'created_at']
    list_display = ['title', 'role', 'visibility', 'is_featured', 'order', 'start_date', 'view_count', 'created_at']
    list_filter = ['visibility', 'is_featured', 'role', 'start_date', 'skills__category']
    search_fields = ['title', 'short_tagline', 'description_short']
    list_editable = ['visibility', 'is_featured', 'order']
    prepopulated_fields = {'slug': ('title',)}
    filter_horizontal = ['skills']
    inlines = [CaseStudyInline, ProjectUpdateInline, ProjectCollaborationInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'slug', 'short_tagline', 'description_short', 'description_long')
        }),
        ('Project Details', {
            'fields': ('role', 'start_date', 'end_date', 'is_ongoing', 'skills')
        }),
        ('Media', {
            'fields': ('hero_image', 'hero_video', 'gallery_images'),
            'classes': ('collapse',)
        }),
        ('Links', {
            'fields': ('repo_url', 'live_demo_url', 'case_study_url')
        }),
        ('Metrics & Impact', {
            'fields': ('metrics',),
            'classes': ('collapse',)
        }),
        ('Organization', {
            'fields': ('visibility', 'is_featured', 'order')
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords'),
            'classes': ('collapse',)
        }),
    )
    
    actions = ['make_public', 'make_featured']
    
    def make_public(self, request, queryset):
        queryset.update(visibility='public')
        self.message_user(request, f"{queryset.count()} projects made public.")
    make_public.short_description = "Make selected projects public"
    
    def make_featured(self, request, queryset):
        queryset.update(is_featured=True)
        self.message_user(request, f"{queryset.count()} projects featured.")
    make_featured.short_description = "Feature selected projects"


@admin.register(CaseStudy)
class CaseStudyAdmin(admin.ModelAdmin):
    list_display = ['project', 'is_published', 'reading_time', 'created_at', 'updated_at']
    list_filter = ['is_published', 'created_at']
    search_fields = ['project__title', 'problem_statement']
    list_editable = ['is_published', 'reading_time']
    raw_id_fields = ['project']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('project', 'is_published', 'reading_time')
        }),
        ('Case Study Content', {
            'fields': ('problem_statement', 'constraints', 'approach', 'challenges')
        }),
        ('Technical Details', {
            'fields': ('architecture_description', 'implementation_notes'),
            'classes': ('collapse',)
        }),
        ('Results & Outcomes', {
            'fields': ('results', 'lessons_learned', 'success_metrics')
        }),
        ('Supporting Media', {
            'fields': ('architecture_images', 'before_after_images', 'timeline_data', 'attachments'),
            'classes': ('collapse',)
        }),
        ('SEO', {
            'fields': ('meta_title', 'meta_description', 'meta_keywords'),
            'classes': ('collapse',)
        }),
    )


@admin.register(ProjectUpdate)
class ProjectUpdateAdmin(admin.ModelAdmin):
    list_display = ['project', 'title', 'update_type', 'is_major', 'created_at']
    list_filter = ['update_type', 'is_major', 'created_at']
    search_fields = ['project__title', 'title', 'content']
    raw_id_fields = ['project']


@admin.register(ProjectCollaboration)
class ProjectCollaborationAdmin(admin.ModelAdmin):
    list_display = ['project', 'name', 'role', 'order']
    list_filter = ['role']
    search_fields = ['project__title', 'name', 'role']
    raw_id_fields = ['project']