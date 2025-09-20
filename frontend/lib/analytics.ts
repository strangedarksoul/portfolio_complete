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

    // Process events in batches to avoid overwhelming the server
    const batchSize = 5;
    const batch = this.queue.splice(0, Math.min(batchSize, this.queue.length));
    
    for (const event of batch) {
      try {
        await analyticsAPI.trackEvent(event);
      } catch (error) {
        console.warn('Failed to track analytics event:', error);
        // Re-queue failed events at the beginning for retry
        this.queue.unshift(event);
        break;
      }
    }
    
    this.isProcessing = false;
    
    // Continue processing if there are more events
    if (this.queue.length > 0) {
      setTimeout(() => this.processQueue(), 1000); // Wait 1 second before next batch
    }
  }

  // Enhanced error handling and retry logic
  async trackWithRetry(event_type: string, metadata?: Record<string, any>, maxRetries = 3) {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        await this.track(event_type, metadata);
        return; // Success, exit retry loop
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          console.error(`Failed to track event ${event_type} after ${maxRetries} attempts:`, error);
        } else {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
        }
      }
    }
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