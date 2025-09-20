from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    path('query', views.ChatQueryView.as_view(), name='chat_query'),
    path('history', views.ChatHistoryView.as_view(), name='chat_history'),
    path('session/<uuid:session_id>', views.ChatSessionView.as_view(), name='chat_session'),
    path('feedback/message', views.MessageFeedbackView.as_view(), name='message_feedback'),
    path('feedback/session', views.SessionFeedbackView.as_view(), name='session_feedback'),
]