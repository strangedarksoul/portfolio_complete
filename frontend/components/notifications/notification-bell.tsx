'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNotificationStore } from '@/lib/store';
import { notificationsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { Bell, X, Check, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, setNotifications, setUnreadCount, markAsRead } = useNotificationStore();

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationsAPI.markSingleAsRead(notificationId);
      markAsRead(notificationId);
      
      const notification = notifications.find(n => n.id === notificationId);
      if (notification) {
        analytics.notificationOpen(notificationId.toString(), notification.type);
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAsRead({ mark_all_read: true });
      
      const updatedNotifications = notifications.map(n => ({ ...n, is_read: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hire_request': return '💼';
      case 'project_update': return '🚀';
      case 'message': return '💬';
      case 'announcement': return '📢';
      case 'reminder': return '⏰';
      case 'welcome': return '👋';
      default: return '📝';
    }
  };

  if (unreadCount === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 right-20 z-40 rounded-full w-10 h-10 p-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 right-20 z-40 rounded-full w-10 h-10 p-0 relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-16 right-4 z-40 w-96"
          >
            <Card className="shadow-2xl border-purple-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleMarkAllAsRead}
                      className="text-xs"
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Mark all read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <ScrollArea className="h-96">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {notifications.map((notification, index) => (
                        <div key={notification.id}>
                          <div
                            className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                              !notification.is_read ? 'bg-muted/30' : ''
                            }`}
                            onClick={() => {
                              if (!notification.is_read) {
                                handleMarkAsRead(notification.id);
                              }
                              if (notification.link) {
                                window.location.href = notification.link;
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0">
                                <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)} mt-2`} />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg">{getTypeIcon(notification.type)}</span>
                                  <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                                  {!notification.is_read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                                  )}
                                </div>
                                
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {notification.body}
                                </p>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-muted-foreground">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                  </span>
                                  
                                  {notification.link && (
                                    <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {index < notifications.length - 1 && <Separator />}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}