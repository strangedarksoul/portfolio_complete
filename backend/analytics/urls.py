from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('event', views.AnalyticsEventCreateView.as_view(), name='create_event'),
    path('dashboard', views.AnalyticsDashboardView.as_view(), name='dashboard'),
    path('events', views.AnalyticsEventsView.as_view(), name='events'),
    path('summary', views.AnalyticsSummaryView.as_view(), name='summary'),
]