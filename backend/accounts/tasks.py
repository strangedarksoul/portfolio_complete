from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import User
from core.utils import send_template_email


@shared_task
def send_welcome_email(user_id):
    """Send welcome email to new user"""
    try:
        user = User.objects.get(id=user_id)
        
        context = {
            'user': user,
        }
        
        send_template_email(
            template_name='welcome',
            context=context,
            subject=f"Welcome to {settings.SITE_NAME}!",
            recipient_list=[user.email]
        )
        
        return f"Welcome email sent to {user.email}"
        
    except User.DoesNotExist:
        return f"User {user_id} not found"
    except Exception as e:
        return f"Error sending welcome email: {e}"


@shared_task
def send_verification_email(user_id, verification_token):
    """Send email verification email"""
    try:
        user = User.objects.get(id=user_id)
        
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={verification_token}"
        
        context = {
            'user': user,
            'verification_url': verification_url,
        }
        
        send_template_email(
            template_name='verification',
            context=context,
            subject=f"Verify your email - {settings.SITE_NAME}",
            recipient_list=[user.email]
        )
        
        return f"Verification email sent to {user.email}"
        
    except User.DoesNotExist:
        return f"User {user_id} not found"
    except Exception as e:
        return f"Error sending verification email: {e}"


@shared_task
def send_password_reset_email(user_id, reset_token):
    """Send password reset email"""
    try:
        user = User.objects.get(id=user_id)
        
        reset_url = f"{settings.FRONTEND_URL}/password-reset?token={reset_token}"
        
        context = {
            'user': user,
            'reset_url': reset_url,
        }
        
        send_template_email(
            template_name='password_reset',
            context=context,
            subject=f"Password Reset - {settings.SITE_NAME}",
            recipient_list=[user.email]
        )
        
        return f"Password reset email sent to {user.email}"
        
    except User.DoesNotExist:
        return f"User {user_id} not found"
    except Exception as e:
        return f"Error sending password reset email: {e}"


@shared_task
def cleanup_unverified_users():
    """Clean up unverified users older than 7 days"""
    from datetime import timedelta
    
    cutoff_date = timezone.now() - timedelta(days=7)
    
    unverified_users = User.objects.filter(
        is_email_verified=False,
        date_joined__lt=cutoff_date
    )
    
    count = unverified_users.count()
    unverified_users.delete()
    
    return f"Cleaned up {count} unverified users"


@shared_task
def update_user_activity(user_id):
    """Update user's last activity timestamp"""
    try:
        user = User.objects.get(id=user_id)
        user.last_activity = timezone.now()
        user.save(update_fields=['last_activity'])
        
        return f"Updated activity for user {user.email}"
        
    except User.DoesNotExist:
        return f"User {user_id} not found"
    except Exception as e:
        return f"Error updating user activity: {e}"


@shared_task
def send_account_notification(user_id, notification_type, context_data=None):
    """Send account-related notifications"""
    try:
        user = User.objects.get(id=user_id)
        context_data = context_data or {}
        
        templates = {
            'email_changed': {
                'subject': 'Email Address Changed',
                'template': 'email_changed'
            },
            'password_changed': {
                'subject': 'Password Changed',
                'template': 'password_changed'
            },
            'profile_updated': {
                'subject': 'Profile Updated',
                'template': 'profile_updated'
            }
        }
        
        if notification_type not in templates:
            return f"Unknown notification type: {notification_type}"
        
        template_info = templates[notification_type]
        context = {'user': user, **context_data}
        
        send_template_email(
            template_name=template_info['template'],
            context=context,
            subject=f"{template_info['subject']} - {settings.SITE_NAME}",
            recipient_list=[user.email]
        )
        
        return f"Account notification sent to {user.email}"
        
    except User.DoesNotExist:
        return f"User {user_id} not found"
    except Exception as e:
        return f"Error sending account notification: {e}"