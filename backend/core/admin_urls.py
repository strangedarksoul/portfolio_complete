from django.urls import path
from . import admin_views

app_name = 'core_admin'

urlpatterns = [
    path('overview', admin_views.AdminOverviewView.as_view(), name='overview'),
    path('notifications/send', admin_views.SendNotificationView.as_view(), name='send_notification'),
    path('leads', admin_views.LeadManagementView.as_view(), name='leads'),
    path('leads/<int:lead_id>', admin_views.LeadDetailView.as_view(), name='lead_detail'),
    path('chat/logs', admin_views.ChatLogsView.as_view(), name='chat_logs'),
    path('analytics/export', admin_views.AnalyticsExportView.as_view(), name='analytics_export'),
]