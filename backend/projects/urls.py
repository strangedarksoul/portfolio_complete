from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'projects'

# Create router for viewsets
router = DefaultRouter()
router.register(r'skills', views.SkillViewSet)

urlpatterns = [
    # Projects
    path('', views.ProjectListView.as_view(), name='project_list'),
    path('<slug:slug>', views.ProjectDetailView.as_view(), name='project_detail'),
    
    # Case studies
    path('casestudies/', views.CaseStudyListView.as_view(), name='casestudy_list'),
    path('casestudies/<int:pk>', views.CaseStudyDetailView.as_view(), name='casestudy_detail'),
    
    # Skills
    path('', include(router.urls)),
    path('skills/<slug:slug>/projects', views.SkillProjectsView.as_view(), name='skill_projects'),
    
    # Admin endpoints
    path('admin/projects', views.AdminProjectListView.as_view(), name='admin_project_list'),
    path('admin/projects/create', views.AdminProjectCreateView.as_view(), name='admin_project_create'),
    path('admin/projects/<int:pk>', views.AdminProjectDetailView.as_view(), name='admin_project_detail'),
]