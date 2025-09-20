import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          Cookies.set('access_token', access, { expires: 1 }); // 1 day

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        Cookies.remove('access_token');
        Cookies.remove('refresh_token');
        window.location.href = '/auth/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const authAPI = {
  register: (data: any) => api.post('/api/v1/auth/register', data),
  login: (data: any) => api.post('/api/v1/auth/login', data),
  logout: (refreshToken: string) => api.post('/api/v1/auth/logout', { refresh_token: refreshToken }),
  verifyEmail: (token: string) => api.post('/api/v1/auth/verify', { token }),
  requestPasswordReset: (email: string) => api.post('/api/v1/auth/password-reset', { email }),
  confirmPasswordReset: (data: any) => api.post('/api/v1/auth/password-reset/confirm', data),
  getProfile: () => api.get('/api/v1/auth/profile'),
  updateProfile: (data: any) => api.put('/api/v1/auth/profile', data),
  updateAvatar: (formData: FormData) => api.post('/api/v1/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const portalAPI = {
  getGreeting: (userId?: string) => api.get(`/api/v1/portal/greeting${userId ? `?userId=${userId}` : ''}`),
  rememberUser: (data: any) => api.post('/api/v1/portal/remember', data),
  getConfig: () => api.get('/api/v1/portal/config'),
};

export const projectsAPI = {
  getProjects: (params?: any) => api.get('/api/v1/projects/', { params }),
  getProject: (slug: string) => api.get(`/api/v1/projects/${slug}`),
  getSkills: (params?: any) => api.get('/api/v1/projects/skills/', { params }),
  getSkillProjects: (slug: string) => api.get(`/api/v1/projects/skills/${slug}/projects`),
  getCaseStudies: (params?: any) => api.get('/api/v1/projects/casestudies/', { params }),
  getCaseStudy: (id: number) => api.get(`/api/v1/projects/casestudies/${id}`),
};

export const chatAPI = {
  sendQuery: (data: any) => api.post('/api/v1/chat/query', data),
  getHistory: (userId?: string) => api.get(`/api/v1/chat/history${userId ? `?userId=${userId}` : ''}`),
  getSession: (sessionId: string) => api.get(`/api/v1/chat/session/${sessionId}`),
  clearSession: (sessionId: string) => api.post(`/api/v1/chat/session/${sessionId}/clear`),
  sendMessageFeedback: (data: any) => api.post('/api/v1/chat/feedback/message', data),
  sendSessionFeedback: (data: any) => api.post('/api/v1/chat/feedback/session', data),
};

export const gigsAPI = {
  getGigs: (params?: any) => api.get('/api/v1/gigs/', { params }),
  getGig: (slug: string) => api.get(`/api/v1/gigs/${slug}`),
  getCategories: () => api.get('/api/v1/gigs/categories'),
  trackClick: (slug: string, data: any) => api.post(`/api/v1/gigs/${slug}/click`, data),
  submitHireRequest: (data: any) => api.post('/api/v1/gigs/hire/request', data),
  getHireRequest: (id: number) => api.get(`/api/v1/gigs/hire/${id}`),
  getUserHireRequests: () => api.get('/api/v1/gigs/hire/user-requests'),
};

export const notificationsAPI = {
  getNotifications: (params?: any) => api.get('/api/v1/notifications/', { params }),
  getUnreadCount: () => api.get('/api/v1/notifications/unread-count'),
  markAsRead: (data: any) => api.post('/api/v1/notifications/mark-read', data),
  markSingleAsRead: (id: number) => api.post(`/api/v1/notifications/${id}/read`),
  getPreferences: () => api.get('/api/v1/notifications/preferences'),
  updatePreferences: (data: any) => api.put('/api/v1/notifications/preferences', data),
  subscribe: (data: any) => api.post('/api/v1/notifications/subscribe', data),
};

export const analyticsAPI = {
  trackEvent: (data: any) => api.post('/api/v1/analytics/event', data),
};

export const adminAPI = {
  getOverview: () => api.get('/api/v1/admin/overview'),
  sendNotification: (data: any) => api.post('/api/v1/admin/notifications/send', data),
  getLeads: () => api.get('/api/v1/admin/leads'),
  getLeadDetail: (id: number) => api.get(`/api/v1/admin/leads/${id}`),
  getChatLogs: () => api.get('/api/v1/admin/chat/logs'),
  exportAnalytics: (type: string) => api.get(`/api/v1/admin/analytics/export?type=${type}`),
};

export const blogAPI = {
  getPosts: (params?: any) => api.get('/api/v1/blog/', { params }),
  getPost: (slug: string) => api.get(`/api/v1/blog/${slug}`),
  getCategories: () => api.get('/api/v1/blog/categories'),
  getPostsByCategory: (categorySlug: string) => api.get(`/api/v1/blog/category/${categorySlug}`),
  getPostsByTag: (tag: string) => api.get(`/api/v1/blog/tag/${tag}`),
  searchPosts: (query: string) => api.get(`/api/v1/blog/search?q=${query}`),
  getComments: (slug: string) => api.get(`/api/v1/blog/${slug}/comments`),
  submitComment: (data: any) => api.post('/api/v1/blog/comments/create', data),
};

export const testimonialsAPI = {
  getTestimonials: (params?: any) => api.get('/api/v1/testimonials/', { params }),
  submitTestimonial: (data: any) => api.post('/api/v1/testimonials/submit', data),
};

export const achievementsAPI = {
  getAchievements: (params?: any) => api.get('/api/v1/achievements/', { params }),
};

export const roadmapAPI = {
  getRoadmapItems: (params?: any) => api.get('/api/v1/roadmap/', { params }),
};

export const resumeAPI = {
  downloadResume: (format: 'one-page' | 'detailed' | 'technical') => {
    return api.get(`/api/v1/resume/download?format=${format}`, { responseType: 'blob' });
  },
  getResumeData: () => api.get('/api/v1/resume/data'),
};

export const fileUploadAPI = {
  uploadFile: (formData: FormData) => {
    return api.post('/api/v1/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const experimentsAPI = {
  getExperiments: (params?: any) => api.get('/api/v1/experiments/', { params }),
  getExperiment: (slug: string) => api.get(`/api/v1/experiments/${slug}`),
  getCategories: () => api.get('/api/v1/experiments/categories'),
  trackClick: (slug: string, data: any) => api.post(`/api/v1/experiments/${slug}/click`, data),
};