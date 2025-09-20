import { analyticsAPI } from './api';

interface AnalyticsEvent {
  event_type: string;
  metadata?: Record<string, any>;
}

class Analytics {
  private queue: AnalyticsEvent[] = [];
  private isProcessing = false;

  async track(event_type: string, metadata?: Record<string, any>) {
    const event: AnalyticsEvent = {
      event_type,
      metadata: {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer,
        user_agent: navigator.userAgent,
        ...metadata,
      },
    };

    this.queue.push(event);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) {
        try {
          await analyticsAPI.trackEvent(event);
        } catch (error) {
          console.warn('Failed to track analytics event:', error);
          // Re-queue the event for retry
          this.queue.unshift(event);
          break;
        }
      }
    }

    this.isProcessing = false;
  }

  // Convenience methods for common events
  pageView(path: string, title?: string) {
    this.track('page_view', { path, title });
  }

  projectView(projectId: string, projectTitle: string, projectSlug: string) {
    this.track('project_view', { project_id: projectId, project_title: projectTitle, project_slug: projectSlug });
  }

  gigClick(gigId: string, gigTitle: string, clickType: string, externalPlatform?: string) {
    this.track('gig_click', { gig_id: gigId, gig_title: gigTitle, click_type: clickType, external_platform: externalPlatform });
  }

  hireFormStart(gigId?: string) {
    this.track('hire_form_start', { gig_id: gigId });
  }

  hireFormSubmit(gigId?: string, budget?: string, timeline?: string) {
    this.track('hire_form_submit', { gig_id: gigId, budget, timeline });
  }

  chatQuery(query: string, audience: string, depth: string, tone: string, context?: any) {
    this.track('chat_query', { 
      query_length: query.length, 
      audience, 
      depth, 
      tone, 
      context_type: context?.project_id ? 'project' : context?.gig_id ? 'gig' : 'general'
    });
  }

  chatFeedback(messageId: string, rating: number, hasComment: boolean) {
    this.track('chat_feedback', { message_id: messageId, rating, has_comment: hasComment });
  }

  linkClick(linkType: string, destination: string, platform?: string) {
    this.track('link_click', { link_type: linkType, destination, platform });
  }

  notificationOpen(notificationId: string, notificationType: string) {
    this.track('notification_open', { notification_id: notificationId, notification_type: notificationType });
  }
}

export const analytics = new Analytics();