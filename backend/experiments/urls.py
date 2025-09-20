from django.urls import path
from . import views

app_name = 'experiments'

urlpatterns = [
    path('', views.ExperimentListView.as_view(), name='experiment_list'),
    path('categories', views.ExperimentCategoryListView.as_view(), name='category_list'),
    path('<slug:slug>', views.ExperimentDetailView.as_view(), name='experiment_detail'),
    path('<slug:slug>/click', views.ExperimentClickTrackingView.as_view(), name='experiment_click'),
]