from django.urls import path
from . import views

app_name = 'blog'

urlpatterns = [
    # Blog posts
    path('', views.BlogPostListView.as_view(), name='post_list'),
    path('categories', views.BlogCategoryListView.as_view(), name='category_list'),
    path('category/<slug:category_slug>', views.BlogPostByCategoryView.as_view(), name='posts_by_category'),
    path('<slug:slug>', views.BlogPostDetailView.as_view(), name='post_detail'),
    
    # Comments
    path('<slug:slug>/comments', views.BlogCommentListView.as_view(), name='comment_list'),
    path('comments/create', views.BlogCommentCreateView.as_view(), name='comment_create'),
    
    # Search and tags
    path('search', views.BlogSearchView.as_view(), name='search'),
    path('tag/<str:tag>', views.BlogPostByTagView.as_view(), name='posts_by_tag'),
]