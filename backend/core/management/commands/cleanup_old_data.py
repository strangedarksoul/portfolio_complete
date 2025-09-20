from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from analytics.models import AnalyticsEvent
from notifications.models import Notification
from chat.models import ChatSession


class Command(BaseCommand):
    help = 'Clean up old data to maintain database performance'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Number of days to keep data (default: 90)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        days = options['days']
        dry_run = options['dry_run']
        cutoff_date = timezone.now() - timedelta(days=days)

        self.stdout.write(f'Cleaning up data older than {days} days ({cutoff_date})')

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No data will be deleted'))

        # Clean up old analytics events
        old_events = AnalyticsEvent.objects.filter(timestamp__lt=cutoff_date)
        events_count = old_events.count()
        
        if events_count > 0:
            if not dry_run:
                old_events.delete()
            self.stdout.write(f'Analytics events: {events_count} records')

        # Clean up old read notifications
        old_notifications = Notification.objects.filter(
            is_read=True,
            read_at__lt=cutoff_date
        )
        notifications_count = old_notifications.count()
        
        if notifications_count > 0:
            if not dry_run:
                old_notifications.delete()
            self.stdout.write(f'Read notifications: {notifications_count} records')

        # Clean up old chat sessions (anonymous only)
        old_chat_sessions = ChatSession.objects.filter(
            user__isnull=True,
            created_at__lt=cutoff_date
        )
        chat_count = old_chat_sessions.count()
        
        if chat_count > 0:
            if not dry_run:
                old_chat_sessions.delete()
            self.stdout.write(f'Anonymous chat sessions: {chat_count} records')

        # Clean up expired notifications
        expired_notifications = Notification.objects.filter(
            expires_at__lt=timezone.now()
        )
        expired_count = expired_notifications.count()
        
        if expired_count > 0:
            if not dry_run:
                expired_notifications.delete()
            self.stdout.write(f'Expired notifications: {expired_count} records')

        total_cleaned = events_count + notifications_count + chat_count + expired_count
        
        if total_cleaned == 0:
            self.stdout.write(self.style.SUCCESS('No old data found to clean up'))
        else:
            action = 'Would clean' if dry_run else 'Cleaned'
            self.stdout.write(
                self.style.SUCCESS(f'{action} {total_cleaned} total records')
            )