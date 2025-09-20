from django.urls import path
from . import views

app_name = 'gigs'

urlpatterns = [
    # Public gig endpoints
    path('', views.GigListView.as_view(), name='gig_list'),
    path('categories', views.GigCategoryListView.as_view(), name='category_list'),
    path('<slug:slug>', views.GigDetailView.as_view(), name='gig_detail'),
    path('<slug:slug>/click', views.GigClickTrackingView.as_view(), name='gig_click'),
    
    # Hire request endpoints
    path('hire/request', views.HireRequestCreateView.as_view(), name='hire_request'),
    path('hire/<int:pk>', views.HireRequestDetailView.as_view(), name='hire_detail'),
    
    # Admin endpoints
    path('admin/gigs', views.AdminGigListView.as_view(), name='admin_gig_list'),
    path('admin/leads', views.AdminLeadListView.as_view(), name='admin_lead_list'),
    path('admin/leads/<int:pk>', views.AdminLeadDetailView.as_view(), name='admin_lead_detail'),
]