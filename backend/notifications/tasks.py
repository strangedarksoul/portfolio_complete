from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Notification, BulkNotification, NotificationTemplate

User = get_user_model()


@shared_task
def send_notification_email(notification_id):
    """Send email for a notification"""
    try:
        notification = Notification.objects.get(id=notification_id)
        
        if notification.email_sent:
            return f"Email already sent for notification {notification_id}"
        
        # Check if user has email notifications enabled
        if hasattr(notification.user, 'notification_preferences'):
            prefs = notification.user.notification_preferences
            
            # Check type-specific preferences
            if notification.type == 'announcement' and not prefs.email_announcements:
                return f"User has disabled announcement emails"
            elif notification.type == 'project_update' and not prefs.email_project_updates:
                return f"User has disabled project update emails"
            elif notification.type == 'hire_request' and not prefs.email_hire_requests:
                return f"User has disabled hire request emails"
            elif notification.type == 'message' and not prefs.email_messages:
                return f"User has disabled message emails"
            elif notification.type == 'reminder' and not prefs.email_reminders:
                return f"User has disabled reminder emails"
        
        # Send email
        send_mail(
            subject=f"{settings.EMAIL_SUBJECT_PREFIX}{notification.title}",
            message=notification.body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[notification.user.email],
            html_message=f"""
            <h2>{notification.title}</h2>
            <p>{notification.body}</p>
            {f'<p><a href="{notification.link}">View Details</a></p>' if notification.link else ''}
            <hr>
            <p><small>You received this notification from {settings.SITE_NAME}. 
            <a href="{settings.FRONTEND_URL}/notifications/preferences">Manage preferences</a></small></p>
            """
        )
        
        # Mark as sent
        from django.utils import timezone
        notification.email_sent = True
        notification.email_sent_at = timezone.now()
        notification.save(update_fields=['email_sent', 'email_sent_at'])
        
        return f"Email sent for notification {notification_id}"
        
    except Notification.DoesNotExist:
        return f"Notification {notification_id} not found"
    except Exception as e:
        return f"Error sending email for notification {notification_id}: {e}"


@shared_task
def send_bulk_notification(bulk_notification_id):
    """Send bulk notification to multiple users"""
    try:
        bulk_notification = BulkNotification.objects.get(id=bulk_notification_id)
        
        if bulk_notification.is_sent:
            return f"Bulk notification {bulk_notification_id} already sent"
        
        # Determine target users
        target_users = []
        
        if bulk_notification.target_all_users:
            target_users = User.objects.filter(is_active=True)
        else:
            if bulk_notification.target_user_roles:
                target_users.extend(
                    User.objects.filter(
                        role__in=bulk_notification.target_user_roles,
                        is_active=True
                    )
                )
            
            if bulk_notification.target_user_ids:
                target_users.extend(
                    User.objects.filter(
                        id__in=bulk_notification.target_user_ids,
                        is_active=True
                    )
                )
        
        # Remove duplicates
        target_users = list(set(target_users))
        
        # Create individual notifications
        notifications_created = 0
        emails_sent = 0
        
        for user in target_users:
            # Create notification
            notification = Notification.objects.create(
                user=user,
                type=bulk_notification.type,
                title=bulk_notification.title,
                body=bulk_notification.body,
                metadata={'bulk_notification_id': bulk_notification_id}
            )
            notifications_created += 1
            
            # Send email if requested
            if bulk_notification.send_email:
                send_notification_email.delay(notification.id)
                emails_sent += 1
        
        # Update bulk notification status
        from django.utils import timezone
        bulk_notification.is_sent = True
        bulk_notification.sent_at = timezone.now()
        bulk_notification.total_recipients = len(target_users)
        bulk_notification.notifications_created = notifications_created
        bulk_notification.email_sent_count = emails_sent
        bulk_notification.save()
        
        return f"Bulk notification sent to {len(target_users)} users"
        
    except BulkNotification.DoesNotExist:
        return f"Bulk notification {bulk_notification_id} not found"
    except Exception as e:
        return f"Error sending bulk notification {bulk_notification_id}: {e}"


@shared_task
def cleanup_old_notifications():
    """Clean up old read notifications and expired notifications"""
    from django.utils import timezone
    from datetime import timedelta
    
    # Remove expired notifications
    expired_count = Notification.objects.filter(
        expires_at__lt=timezone.now()
    ).delete()[0]
    
    # Remove old read notifications (older than 30 days)
    old_date = timezone.now() - timedelta(days=30)
    old_read_count = Notification.objects.filter(
        is_read=True,
        read_at__lt=old_date
    ).delete()[0]
    
    return f"Cleaned up {expired_count} expired and {old_read_count} old read notifications"