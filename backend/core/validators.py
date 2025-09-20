from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.utils.deconstruct import deconstructible
import magic
import os


@deconstructible
class FileSizeValidator:
    """Validate file size"""
    
    def __init__(self, max_size_mb=10):
        self.max_size_mb = max_size_mb
        self.max_size_bytes = max_size_mb * 1024 * 1024

    def __call__(self, value):
        if value.size > self.max_size_bytes:
            raise ValidationError(
                f'File size cannot exceed {self.max_size_mb}MB. '
                f'Current file size is {value.size / (1024 * 1024):.1f}MB.'
            )

    def __eq__(self, other):
        return isinstance(other, FileSizeValidator) and self.max_size_mb == other.max_size_mb


@deconstructible
class FileTypeValidator:
    """Validate file type using python-magic"""
    
    def __init__(self, allowed_types):
        self.allowed_types = allowed_types

    def __call__(self, value):
        try:
            file_type = magic.from_buffer(value.read(1024), mime=True)
            value.seek(0)  # Reset file pointer
            
            if file_type not in self.allowed_types:
                raise ValidationError(
                    f'File type {file_type} is not allowed. '
                    f'Allowed types: {", ".join(self.allowed_types)}'
                )
        except Exception as e:
            raise ValidationError(f'Could not validate file type: {str(e)}')

    def __eq__(self, other):
        return isinstance(other, FileTypeValidator) and self.allowed_types == other.allowed_types


def validate_image_file(value):
    """Validate image file"""
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    validator = FileTypeValidator(allowed_types)
    validator(value)
    
    # Also validate size
    size_validator = FileSizeValidator(max_size_mb=5)
    size_validator(value)


def validate_document_file(value):
    """Validate document file"""
    allowed_types = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
    ]
    validator = FileTypeValidator(allowed_types)
    validator(value)
    
    # Also validate size
    size_validator = FileSizeValidator(max_size_mb=10)
    size_validator(value)


def validate_video_file(value):
    """Validate video file"""
    allowed_types = ['video/mp4', 'video/webm', 'video/quicktime']
    validator = FileTypeValidator(allowed_types)
    validator(value)
    
    # Also validate size
    size_validator = FileSizeValidator(max_size_mb=50)
    size_validator(value)


def validate_json_field(value):
    """Validate JSON field content"""
    import json
    if isinstance(value, str):
        try:
            json.loads(value)
        except json.JSONDecodeError:
            raise ValidationError('Invalid JSON format')


def validate_url_list(value):
    """Validate list of URLs"""
    from django.core.validators import URLValidator
    
    if not isinstance(value, list):
        raise ValidationError('Must be a list of URLs')
    
    url_validator = URLValidator()
    for url in value:
        if not isinstance(url, str):
            raise ValidationError('All items must be strings')
        url_validator(url)


def validate_email_list(value):
    """Validate list of email addresses"""
    from django.core.validators import EmailValidator
    
    if not isinstance(value, list):
        raise ValidationError('Must be a list of email addresses')
    
    email_validator = EmailValidator()
    for email in value:
        if not isinstance(email, str):
            raise ValidationError('All items must be strings')
        email_validator(email)


def validate_hex_color(value):
    """Validate hex color code"""
    import re
    if not re.match(r'^#[0-9A-Fa-f]{6}$', value):
        raise ValidationError('Must be a valid hex color code (e.g., #FF0000)')


def validate_slug_list(value):
    """Validate list of slugs"""
    from django.core.validators import validate_slug
    
    if not isinstance(value, list):
        raise ValidationError('Must be a list of slugs')
    
    for slug in value:
        if not isinstance(slug, str):
            raise ValidationError('All items must be strings')
        validate_slug(slug)


def validate_positive_number(value):
    """Validate positive number"""
    if value <= 0:
        raise ValidationError('Must be a positive number')


def validate_rating(value):
    """Validate rating (1-5)"""
    if not isinstance(value, int) or value < 1 or value > 5:
        raise ValidationError('Rating must be an integer between 1 and 5')


def validate_priority_level(value):
    """Validate priority level (1-10)"""
    if not isinstance(value, int) or value < 1 or value > 10:
        raise ValidationError('Priority must be an integer between 1 and 10')