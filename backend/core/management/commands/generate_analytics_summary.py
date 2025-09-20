from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Count, Q
from datetime import datetime, timedelta
from analytics.models import AnalyticsEvent, AnalyticsSummary
from accounts.models import User
from projects.models import Project
from gigs.models import HireRequest
from chat.models import ChatSession


class Command(BaseCommand):
    help = 'Generate daily analytics summary'

    def add_arguments(self, parser):
        parser.add_argument(
            '--date',
            type=str,
            help='Date to generate summary for (YYYY-MM-DD). Defaults to yesterday.',
        )

    def handle(self, *args, **options):
        if options['date']:
            target_date = datetime.strptime(options['date'], '%Y-%m-%d').date()
        else:
            target_date = (timezone.now() - timedelta(days=1)).date()

        self.stdout.write(f'Generating analytics summary for {target_date}')

        # Date range for the target date
        start_date = datetime.combine(target_date, datetime.min.time())
        end_date = start_date + timedelta(days=1)

        # Get or create summary
        summary, created = AnalyticsSummary.objects.get_or_create(
            date=target_date,
            defaults={}
        )

        # Calculate metrics
        events_filter = Q(timestamp__gte=start_date, timestamp__lt=end_date)

        # Traffic metrics
        summary.total_page_views = AnalyticsEvent.objects.filter(
            events_filter, event_type='page_view'
        ).count()

        summary.unique_visitors = AnalyticsEvent.objects.filter(
            events_filter
        ).values('session_id').distinct().count()

        # Content metrics
        summary.project_views = AnalyticsEvent.objects.filter(
            events_filter, event_type='project_view'
        ).count()

        summary.case_study_views = AnalyticsEvent.objects.filter(
            events_filter, event_type='casestudy_view'
        ).count()

        summary.gig_views = AnalyticsEvent.objects.filter(
            events_filter, event_type='gig_view'
        ).count()

        summary.gig_clicks = AnalyticsEvent.objects.filter(
            events_filter, event_type='gig_click'
        ).count()

        # Conversion metrics
        summary.hire_requests = AnalyticsEvent.objects.filter(
            events_filter, event_type='hire_request'
        ).count()

        summary.chat_queries = AnalyticsEvent.objects.filter(
            events_filter, event_type='chat_query'
        ).count()

        summary.chat_sessions = ChatSession.objects.filter(
            created_at__gte=start_date, created_at__lt=end_date
        ).count()

        # User metrics
        summary.new_registrations = AnalyticsEvent.objects.filter(
            events_filter, event_type='user_registration'
        ).count()

        summary.user_logins = AnalyticsEvent.objects.filter(
            events_filter, event_type='user_login'
        ).count()

        # Top content
        top_projects = list(
            AnalyticsEvent.objects.filter(
                events_filter, event_type='project_view'
            ).values('metadata__project_id', 'metadata__project_title')
            .annotate(views=Count('id'))
            .order_by('-views')[:10]
        )

        top_skills = list(
            AnalyticsEvent.objects.filter(
                events_filter, event_type='skill_explore'
            ).values('metadata__skill_name')
            .annotate(views=Count('id'))
            .order_by('-views')[:10]
        )

        top_pages = list(
            AnalyticsEvent.objects.filter(
                events_filter, event_type='page_view'
            ).values('metadata__path')
            .annotate(views=Count('id'))
            .order_by('-views')[:10]
        )

        summary.top_projects = top_projects
        summary.top_skills = top_skills
        summary.top_pages = top_pages

        summary.save()

        action = 'Created' if created else 'Updated'
        self.stdout.write(
            self.style.SUCCESS(f'{action} analytics summary for {target_date}')
        )
        self.stdout.write(f'  Page views: {summary.total_page_views}')
        self.stdout.write(f'  Unique visitors: {summary.unique_visitors}')
        self.stdout.write(f'  Project views: {summary.project_views}')
        self.stdout.write(f'  Hire requests: {summary.hire_requests}')
        self.stdout.write(f'  Chat queries: {summary.chat_queries}')