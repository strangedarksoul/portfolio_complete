import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  username: string;
  full_name: string;
  display_name?: string;
  avatar?: string;
  bio?: string;
  role: string;
  is_email_verified: boolean;
  is_staff: boolean;
  last_activity?: string;
  login_count?: number;
  date_joined: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

interface PortalState {
  userName: string | null;
  hasConsent: boolean;
  hasSeenPortal: boolean;
  setUserName: (name: string) => void;
  setConsent: (consent: boolean) => void;
  setHasSeenPortal: (seen: boolean) => void;
  clearPortalData: () => void;
}

interface ChatState {
  isOpen: boolean;
  messages: any[];
  currentSessionId: string | null;
  audience: 'general' | 'recruiter' | 'developer' | 'founder' | 'client';
  depth: 'short' | 'medium' | 'long';
  tone: 'professional' | 'technical' | 'casual' | 'owner_voice';
  context: any;
  setIsOpen: (open: boolean) => void;
  addMessage: (message: any) => void;
  setMessages: (messages: any[]) => void;
  setSessionId: (id: string | null) => void;
  setAudience: (audience: ChatState['audience']) => void;
  setDepth: (depth: ChatState['depth']) => void;
  setTone: (tone: ChatState['tone']) => void;
  setContext: (context: any) => void;
  clearChat: () => void;
  clearChatHistory: () => void;
}

interface NotificationState {
  notifications: any[];
  unreadCount: number;
  setNotifications: (notifications: any[]) => void;
  setUnreadCount: (count: number) => void;
  addNotification: (notification: any) => void;
  markAsRead: (id: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const usePortalStore = create<PortalState>()(
  persist(
    (set) => ({
      userName: null,
      hasConsent: false,
      hasSeenPortal: false,
      setUserName: (name) => set({ userName: name }),
      setConsent: (consent) => set({ hasConsent: consent }),
      setHasSeenPortal: (seen) => set({ hasSeenPortal: seen }),
      clearPortalData: () => set({ userName: null, hasConsent: false, hasSeenPortal: false }),
    }),
    {
      name: 'portal-storage',
    }
  )
);

export const useChatStore = create<ChatState>((set) => ({
  isOpen: false,
  messages: [],
  currentSessionId: null,
  audience: 'general',
  depth: 'medium',
  tone: 'professional',
  context: {},
  setIsOpen: (open) => set({ isOpen: open }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setMessages: (messages) => set({ messages }),
  setSessionId: (id) => set({ currentSessionId: id }),
  setAudience: (audience) => set({ audience }),
  setDepth: (depth) => set({ depth }),
  setTone: (tone) => set({ tone }),
  setContext: (context) => set({ context }),
  clearChat: () => set({ messages: [], currentSessionId: null, context: {} }),
  clearChatHistory: () => set({ messages: [], currentSessionId: null }),
  clearChatHistory: () => set({ messages: [], currentSessionId: null }),
}));

// Clear chat state when user logs out
useAuthStore.subscribe((state) => {
  if (!state.isAuthenticated) {
    // Clear other stores when user logs out
    useChatStore.getState().clearChat();
    useNotificationStore.getState().setNotifications([]);
    useNotificationStore.getState().setUnreadCount(0);
  }
});

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  addNotification: (notification) => set((state) => ({ 
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + 1
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),
}));