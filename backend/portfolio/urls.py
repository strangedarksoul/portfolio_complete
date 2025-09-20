from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

urlpatterns = [
    path(settings.ADMIN_URL, admin.site.urls),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/projects/', include('projects.urls')),
    path('api/v1/chat/', include('chat.urls')),
    path('api/v1/analytics/', include('analytics.urls')),
    path('api/v1/notifications/', include('notifications.urls')),
    path('api/v1/gigs/', include('gigs.urls')),
    path('api/v1/blog/', include('blog.urls')),
    path('api/v1/experiments/', include('experiments.urls')),
    path('api/v1/portal/', include('core.portal_urls')),
    path('api/v1/', include('core.urls')),
    path('api/v1/admin/', include('core.admin_urls')),
    path('ckeditor/', include('ckeditor_uploader.urls')),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)