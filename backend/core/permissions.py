from rest_framework import permissions


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed for any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the owner of the object.
        return obj.user == request.user


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow admins to edit, but allow read access to all.
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow owners or admins to access.
    """

    def has_object_permission(self, request, view, obj):
        # Admin users can access everything
        if request.user and request.user.is_staff:
            return True
        
        # Owners can access their own objects
        return hasattr(obj, 'user') and obj.user == request.user


class CanManageNotifications(permissions.BasePermission):
    """
    Permission for notification management
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Users can only manage their own notifications
        return obj.user == request.user


class CanAccessAnalytics(permissions.BasePermission):
    """
    Permission for analytics access
    """

    def has_permission(self, request, view):
        # Only staff can access analytics
        return request.user and request.user.is_staff


class CanManageContent(permissions.BasePermission):
    """
    Permission for content management (projects, gigs, etc.)
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_staff


class CanSubmitHireRequest(permissions.BasePermission):
    """
    Permission for submitting hire requests
    """

    def has_permission(self, request, view):
        # Anyone can submit hire requests
        return True

    def has_object_permission(self, request, view, obj):
        # Users can view their own hire requests, admins can view all
        if request.user and request.user.is_staff:
            return True
        return obj.user == request.user if obj.user else False


class CanAccessChat(permissions.BasePermission):
    """
    Permission for chat access
    """

    def has_permission(self, request, view):
        # Anyone can use chat
        return True


class CanManageProfile(permissions.BasePermission):
    """
    Permission for profile management
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Users can only manage their own profile
        return obj == request.user