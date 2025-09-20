from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('achievements/', views.AchievementListView.as_view(), name='achievements'),
    path('testimonials/', views.TestimonialListView.as_view(), name='testimonials'),
    path('testimonials/submit', views.TestimonialCreateView.as_view(), name='testimonial_submit'),
    path('roadmap/', views.RoadmapItemListView.as_view(), name='roadmap'),
    path('resume/data', views.ResumeDataView.as_view(), name='resume_data'),
    path('resume/download', views.ResumeDownloadView.as_view(), name='resume_download'),
    path('files/upload', views.FileUploadView.as_view(), name='file_upload'),
]