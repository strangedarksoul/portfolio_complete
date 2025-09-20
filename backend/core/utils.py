import hashlib
import secrets
import string
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def generate_token(length=32):
    """Generate a secure random token"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_verification_token():
    """Generate email verification token"""
    return generate_token(64)


def hash_email(email):
    """Generate a hash for email (for analytics without storing PII)"""
    return hashlib.sha256(email.encode()).hexdigest()[:16]


def send_template_email(template_name, context, subject, recipient_list, from_email=None):
    """Send email using template"""
    if not from_email:
        from_email = settings.DEFAULT_FROM_EMAIL
    
    # Add common context
    context.update({
        'frontend_url': getattr(settings, 'FRONTEND_URL', 'http://localhost:3000'),
        'site_name': getattr(settings, 'SITE_NAME', "Edzio's Portfolio"),
    })
    
    # Render templates
    html_message = render_to_string(f'emails/{template_name}.html', context)
    plain_message = strip_tags(html_message)
    
    return send_mail(
        subject=subject,
        message=plain_message,
        from_email=from_email,
        recipient_list=recipient_list,
        html_message=html_message,
        fail_silently=False
    )


def get_client_ip(request):
    """Get client IP address from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def truncate_text(text, max_length=100, suffix='...'):
    """Truncate text to specified length"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def calculate_reading_time(text, words_per_minute=200):
    """Calculate estimated reading time in minutes"""
    word_count = len(text.split())
    reading_time = max(1, round(word_count / words_per_minute))
    return reading_time


def sanitize_filename(filename):
    """Sanitize filename for safe storage"""
    import re
    # Remove or replace unsafe characters
    filename = re.sub(r'[^\w\s.-]', '', filename)
    # Replace spaces with underscores
    filename = re.sub(r'\s+', '_', filename)
    return filename


def format_currency(amount, currency='USD'):
    """Format currency amount"""
    if currency == 'USD':
        return f"${amount:,.2f}"
    return f"{amount:,.2f} {currency}"


def get_user_display_name(user):
    """Get the best display name for a user"""
    if user.full_name:
        return user.full_name
    elif user.display_name:
        return user.display_name
    elif user.first_name:
        return user.first_name
    else:
        return user.username


def validate_file_extension(filename, allowed_extensions):
    """Validate file extension"""
    import os
    ext = os.path.splitext(filename)[1].lower().lstrip('.')
    return ext in allowed_extensions


def get_file_size_display(size_bytes):
    """Convert bytes to human readable format"""
    if size_bytes == 0:
        return "0 B"
    
    size_names = ["B", "KB", "MB", "GB"]
    import math
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return f"{s} {size_names[i]}"