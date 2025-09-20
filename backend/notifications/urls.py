from django.urls import path
from . import views

app_name = 'notifications'

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notification_list'),
    path('unread-count', views.UnreadCountView.as_view(), name='unread_count'),
    path('mark-read', views.MarkNotificationsReadView.as_view(), name='mark_read'),
    path('preferences', views.NotificationPreferencesView.as_view(), name='preferences'),
    path('subscribe', views.NotificationSubscribeView.as_view(), name='subscribe'),
    path('<int:pk>/read', views.MarkSingleNotificationReadView.as_view(), name='mark_single_read'),
]