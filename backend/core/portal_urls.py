from django.urls import path
from . import views

app_name = 'portal'

urlpatterns = [
    path('greeting', views.PortalGreetingView.as_view(), name='greeting'),
    path('remember', views.RememberUserView.as_view(), name='remember'),
    path('config', views.SiteConfigView.as_view(), name='config'),
]