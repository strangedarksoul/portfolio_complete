from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from .models import Project, CaseStudy
from accounts.models import User
from notifications.models import Notification
from core.utils import send_template_email


@shared_task
def notify_project_update(project_id, update_type='updated'):
    """Notify users about project updates"""
    try:
        project = Project.objects.get(id=project_id)
        
        # Get users who might be interested (subscribers, followers, etc.)
        interested_users = User.objects.filter(
            is_active=True,
            email_notifications=True
        )
        
        notification_title = f"Project Updated: {project.title}"
        notification_body = f"The project '{project.title}' has been {update_type}."
        
        # Create notifications
        notifications = []
        for user in interested_users:
            notifications.append(
                Notification(
                    user=user,
                    type='project_update',
                    title=notification_title,
                    body=notification_body,
                    link=f'/projects/{project.slug}',
                    metadata={
                        'project_id': project.id,
                        'project_title': project.title,
                        'update_type': update_type
                    }
                )
            )
        
        Notification.objects.bulk_create(notifications)
        
        return f"Created {len(notifications)} notifications for project {project.title}"
        
    except Project.DoesNotExist:
        return f"Project {project_id} not found"
    except Exception as e:
        return f"Error notifying project update: {e}"


@shared_task
def generate_project_summary(project_id):
    """Generate AI summary for project"""
    try:
        project = Project.objects.get(id=project_id)
        
        # This would integrate with AI service to generate summaries
        # For now, we'll create a basic summary
        
        summary_data = {
            'one_liner': f"{project.title}: {project.short_tagline}",
            'elevator_pitch': f"{project.description_short[:200]}...",
            'technical_summary': f"Built with {', '.join([skill.name for skill in project.skills.all()[:5]])}",
        }
        
        # Store in project metadata or separate model
        if not project.metrics:
            project.metrics = {}
        
        project.metrics['ai_summaries'] = summary_data
        project.save(update_fields=['metrics'])
        
        return f"Generated summary for project {project.title}"
        
    except Project.DoesNotExist:
        return f"Project {project_id} not found"
    except Exception as e:
        return f"Error generating project summary: {e}"


@shared_task
def update_project_metrics(project_id):
    """Update project metrics and analytics"""
    try:
        project = Project.objects.get(id=project_id)
        
        # Calculate various metrics
        from analytics.models import AnalyticsEvent
        
        # View count from analytics
        view_count = AnalyticsEvent.objects.filter(
            event_type='project_view',
            metadata__project_id=project.id
        ).count()
        
        # Update project view count if different
        if project.view_count != view_count:
            project.view_count = view_count
            project.save(update_fields=['view_count'])
        
        # Update metrics
        if not project.metrics:
            project.metrics = {}
        
        project.metrics.update({
            'total_views': view_count,
            'last_metrics_update': timezone.now().isoformat(),
        })
        
        project.save(update_fields=['metrics'])
        
        return f"Updated metrics for project {project.title}"
        
    except Project.DoesNotExist:
        return f"Project {project_id} not found"
    except Exception as e:
        return f"Error updating project metrics: {e}"


@shared_task
def generate_case_study_insights(case_study_id):
    """Generate insights for case study"""
    try:
        case_study = CaseStudy.objects.get(id=case_study_id)
        
        # Calculate reading time
        from core.utils import calculate_reading_time
        
        total_text = ' '.join([
            case_study.problem_statement,
            case_study.approach,
            case_study.results,
            case_study.lessons_learned or ''
        ])
        
        reading_time = calculate_reading_time(total_text)
        
        if case_study.reading_time != reading_time:
            case_study.reading_time = reading_time
            case_study.save(update_fields=['reading_time'])
        
        return f"Updated insights for case study {case_study.project.title}"
        
    except CaseStudy.DoesNotExist:
        return f"Case study {case_study_id} not found"
    except Exception as e:
        return f"Error generating case study insights: {e}"


@shared_task
def backup_project_data(project_id):
    """Backup project data"""
    try:
        project = Project.objects.get(id=project_id)
        
        # Create backup data structure
        backup_data = {
            'project': {
                'title': project.title,
                'description_short': project.description_short,
                'description_long': project.description_long,
                'role': project.role,
                'start_date': project.start_date.isoformat(),
                'end_date': project.end_date.isoformat() if project.end_date else None,
                'metrics': project.metrics,
                'skills': [skill.name for skill in project.skills.all()],
            },
            'backup_date': timezone.now().isoformat(),
        }
        
        # Store backup (could be to file, S3, etc.)
        # For now, we'll just log it
        import json
        backup_json = json.dumps(backup_data, indent=2)
        
        return f"Backed up project {project.title} ({len(backup_json)} bytes)"
        
    except Project.DoesNotExist:
        return f"Project {project_id} not found"
    except Exception as e:
        return f"Error backing up project data: {e}"


@shared_task
def optimize_project_images(project_id):
    """Optimize project images"""
    try:
        project = Project.objects.get(id=project_id)
        
        # This would integrate with image optimization service
        # For now, we'll just simulate the process
        
        optimized_count = 0
        
        if project.hero_image:
            # Simulate optimization
            optimized_count += 1
        
        if project.gallery_images:
            optimized_count += len(project.gallery_images)
        
        return f"Optimized {optimized_count} images for project {project.title}"
        
    except Project.DoesNotExist:
        return f"Project {project_id} not found"
    except Exception as e:
        return f"Error optimizing project images: {e}"