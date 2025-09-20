from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error responses
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Log the exception
        logger.error(f"API Exception: {exc}", exc_info=True, extra={
            'request': context.get('request'),
            'view': context.get('view'),
        })

        # Customize the response format
        custom_response_data = {
            'error': True,
            'message': 'An error occurred',
            'details': response.data,
            'status_code': response.status_code
        }

        # Handle specific error types
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            custom_response_data['message'] = 'Invalid request data'
        elif response.status_code == status.HTTP_401_UNAUTHORIZED:
            custom_response_data['message'] = 'Authentication required'
        elif response.status_code == status.HTTP_403_FORBIDDEN:
            custom_response_data['message'] = 'Permission denied'
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            custom_response_data['message'] = 'Resource not found'
        elif response.status_code == status.HTTP_429_TOO_MANY_REQUESTS:
            custom_response_data['message'] = 'Rate limit exceeded'
        elif response.status_code >= 500:
            custom_response_data['message'] = 'Internal server error'

        response.data = custom_response_data

    return response


class APIException(Exception):
    """Base API exception"""
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    default_message = 'An error occurred'

    def __init__(self, message=None, status_code=None):
        self.message = message or self.default_message
        if status_code:
            self.status_code = status_code
        super().__init__(self.message)


class ValidationError(APIException):
    """Validation error"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_message = 'Validation error'


class AuthenticationError(APIException):
    """Authentication error"""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_message = 'Authentication required'


class PermissionError(APIException):
    """Permission error"""
    status_code = status.HTTP_403_FORBIDDEN
    default_message = 'Permission denied'


class NotFoundError(APIException):
    """Not found error"""
    status_code = status.HTTP_404_NOT_FOUND
    default_message = 'Resource not found'


class RateLimitError(APIException):
    """Rate limit error"""
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    default_message = 'Rate limit exceeded'


class ChatServiceError(APIException):
    """Chat service error"""
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_message = 'Chat service temporarily unavailable'


class FileUploadError(APIException):
    """File upload error"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_message = 'File upload failed'


class EmailServiceError(APIException):
    """Email service error"""
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_message = 'Email service temporarily unavailable'