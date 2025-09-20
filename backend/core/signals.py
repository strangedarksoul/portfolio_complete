from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from notifications.models import Notification

User = get_user_model()


@receiver(post_save, sender=User)
def create_welcome_notification(sender, instance, created, **kwargs):
    """Create welcome notification for new users"""
    if created:
        Notification.objects.create(
            user=instance,
            type='welcome',
            title='Welcome to Edzio\'s Portfolio!',
            body='Thank you for joining. Explore projects, chat with the AI assistant, and don\'t hesitate to reach out!',
            link='/projects'
        )