from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from notifications.tasks import create_welcome_notification

User = get_user_model()


@receiver(post_save, sender=User)
def create_welcome_notification_signal(sender, instance, created, **kwargs):
    """Create welcome notification for new users"""
    if created:
        create_welcome_notification.delay(instance.id)