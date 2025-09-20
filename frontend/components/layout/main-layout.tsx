'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { PortalEntrance } from '@/components/portal/portal-entrance';
import { ChatWidget } from '@/components/chat/chat-widget';
import { NotificationBell } from '@/components/notifications/notification-bell';
import { Navigation } from '@/components/navigation/navigation';
import { usePortalStore, useAuthStore, useNotificationStore } from '@/lib/store';
import { notificationsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [showPortal, setShowPortal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  
  const { hasSeenPortal, userName } = usePortalStore();
  const { isAuthenticated, user } = useAuthStore();
  const { setNotifications, setUnreadCount } = useNotificationStore();

  useEffect(() => {
    // Check if portal should be shown
    const shouldShowPortal = !hasSeenPortal && !userName && !isAuthenticated;
    setShowPortal(shouldShowPortal);
    setIsLoading(false);

    // Track page view
    analytics.pageView(pathname, document.title);
  }, [hasSeenPortal, userName, isAuthenticated, pathname]);

  useEffect(() => {
    // Load notifications for authenticated users
    const loadNotifications = async () => {
      try {
        const [notificationsResponse, unreadCountResponse] = await Promise.all([
          notificationsAPI.getNotifications({ is_read: false }),
          notificationsAPI.getUnreadCount(),
        ]);

        setNotifications(notificationsResponse.data.results || []);
        setUnreadCount(unreadCountResponse.data.unread_count || 0);
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    if (isAuthenticated && user) {
      loadNotifications();
    }
  }, [isAuthenticated, user, setNotifications, setUnreadCount]);

  const handlePortalComplete = () => {
    setShowPortal(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (showPortal) {
    return <PortalEntrance onComplete={handlePortalComplete} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="relative">
        {children}
      </main>

      {/* Floating UI Elements */}
      <ChatWidget />
      {isAuthenticated && <NotificationBell />}
      
      {/* Background Effects */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
    </div>
  );
}