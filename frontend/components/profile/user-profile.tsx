'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/store';
import { useChatStore } from '@/lib/store';
import { authAPI, notificationsAPI, gigsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  User, 
  Mail, 
  Building, 
  Globe, 
  Github, 
  Linkedin,
  Bell,
  Shield,
  Save,
  Upload,
  CheckCircle,
  AlertCircle,
  Settings,
  Eye,
  MessageSquare,
  Calendar,
  Star,
  Activity,
  TrendingUp,
  Briefcase,
  FileText
} from 'lucide-react';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  display_name: z.string().optional(),
  bio: z.string().optional(),
  email_notifications: z.boolean(),
  site_notifications: z.boolean(),
  marketing_emails: z.boolean(),
  profile_data: z.object({
    job_title: z.string().optional(),
    company: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    linkedin_url: z.string().url().optional().or(z.literal('')),
    github_url: z.string().url().optional().or(z.literal('')),
  }).optional(),
});

interface NotificationPreferences {
  email_announcements?: boolean;
  email_project_updates?: boolean;
  email_hire_requests?: boolean;
  email_messages?: boolean;
  email_reminders?: boolean;
  email_marketing?: boolean;
  digest_frequency: string;
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  timezone: string;
}

interface UserActivity {
  hire_requests: number;
  chat_sessions: number;
  project_views: number;
  last_login: string;
  member_since: string;
}

export function UserProfile() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null);
  const [isUpdatingPrefs, setIsUpdatingPrefs] = useState(false);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [recentHireRequests, setRecentHireRequests] = useState<any[]>([]);
  
  const { user, setUser } = useAuthStore();
  const { setIsOpen: setChatOpen, setContext } = useChatStore();

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      display_name: '',
      bio: '',
      email_notifications: true,
      site_notifications: true,
      marketing_emails: false,
      profile_data: {
        job_title: '',
        company: '',
        website: '',
        linkedin_url: '',
        github_url: '',
      },
    },
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await authAPI.getProfile();
        const userData = response.data;
        
        form.reset({
          full_name: userData.full_name || '',
          display_name: userData.display_name || '',
          bio: userData.bio || '',
          email_notifications: userData.email_notifications,
          site_notifications: userData.site_notifications,
          marketing_emails: userData.marketing_emails,
          profile_data: {
            job_title: userData.profile?.job_title || '',
            company: userData.profile?.company || '',
            website: userData.profile?.website || '',
            linkedin_url: userData.profile?.linkedin_url || '',
            github_url: userData.profile?.github_url || '',
          },
        });
      } catch (error) {
        console.error('Failed to load user data:', error);
        setMessage({ type: 'error', text: 'Failed to load profile data' });
      } finally {
        setIsLoading(false);
      }
    };

    const loadNotificationPreferences = async () => {
      try {
        const response = await notificationsAPI.getPreferences();
        setNotificationPrefs(response.data);
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
        // Set default preferences if API fails
        setNotificationPrefs({
          email_announcements: true,
          email_project_updates: true,
          email_hire_requests: true,
          email_messages: true,
          email_reminders: true,
          email_marketing: false,
          digest_frequency: 'weekly',
          timezone: 'UTC',
        });
      }
    };

    const loadUserActivity = async () => {
      try {
        // Load user's hire requests
        const hireRequestsResponse = await gigsAPI.getUserHireRequests();
        setRecentHireRequests(hireRequestsResponse.data.results || []);
        
        // Mock activity data - in real implementation, this would come from analytics
        setUserActivity({
          hire_requests: hireRequestsResponse.data.results?.length || 0,
          chat_sessions: 5, // Would come from chat API
          project_views: 23, // Would come from analytics
          last_login: user?.last_activity || user?.date_joined || new Date().toISOString(),
          member_since: user?.date_joined || new Date().toISOString(),
        });
      } catch (error: any) {
        console.error('Failed to load user activity:', error);
      }
    };

    loadUserData();
    loadNotificationPreferences();
    loadUserActivity();
  }, [form]);

  const onSubmit = async (data: any) => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await authAPI.updateProfile(data);
      setUser(response.data);
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      analytics.track('profile_updated', {
        has_bio: !!data.bio,
        has_company: !!data.profile_data?.company,
        has_social_links: !!(data.profile_data?.linkedin_url || data.profile_data?.github_url),
      });
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateNotificationPreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    setIsUpdatingPrefs(true);
    
    try {
      const updatedPrefs = { ...notificationPrefs, ...newPrefs } as NotificationPreferences;
      await notificationsAPI.updatePreferences(updatedPrefs);
      setNotificationPrefs(updatedPrefs);
      
      analytics.track('notification_preferences_updated', newPrefs);
    } catch (error: any) {
      console.error('Failed to update notification preferences:', error);
    } finally {
      setIsUpdatingPrefs(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ 
        type: 'error', 
        text: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)' 
      });
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setMessage({ 
        type: 'error', 
        text: 'File size must be less than 5MB' 
      });
      return;
    }
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await authAPI.updateAvatar(formData);
      setUser(response.data);
      
      setMessage({ 
        type: 'success', 
        text: 'Avatar updated successfully!' 
      });
      
      analytics.track('avatar_updated', { file_size: file.size });
    } catch (error: any) {
      console.error('Failed to update avatar:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to update avatar' 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-6xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={user?.avatar} alt={user?.full_name} />
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl">
                {user?.full_name?.split(' ').map(n => n[0]).join('') || user?.username?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
            >
              <Upload className="w-4 h-4 text-white" />
            </label>
          </div>
          
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
              {user?.full_name || user?.username || 'User'}
            </h1>
            <p className="text-muted-foreground text-lg mb-4">
              {user?.bio || 'Welcome to your profile dashboard'}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">
                {user?.role}
              </Badge>
              {user?.is_email_verified && (
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              <Badge variant="outline">
                Member since {user?.date_joined ? new Date(user.date_joined).getFullYear() : 'Unknown'}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-8">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Update your personal details and public profile information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      {...form.register('full_name')}
                      placeholder="Your full name"
                    />
                    {form.formState.errors.full_name && (
                      <p className="text-red-500 text-sm">{form.formState.errors.full_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="display_name">Display Name</Label>
                    <Input
                      id="display_name"
                      {...form.register('display_name')}
                      placeholder="How you'd like to be addressed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      {...form.register('bio')}
                      placeholder="Tell us a bit about yourself..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Professional Information</CardTitle>
                  <CardDescription>
                    Your professional details and social links
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="job_title">Job Title</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="job_title"
                        {...form.register('profile_data.job_title')}
                        placeholder="Your job title"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="company"
                        {...form.register('profile_data.company')}
                        placeholder="Your company"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="website"
                        {...form.register('profile_data.website')}
                        placeholder="https://yourwebsite.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn</Label>
                    <div className="relative">
                      <Linkedin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="linkedin_url"
                        {...form.register('profile_data.linkedin_url')}
                        placeholder="https://linkedin.com/in/username"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github_url">GitHub</Label>
                    <div className="relative">
                      <Github className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="github_url"
                        {...form.register('profile_data.github_url')}
                        placeholder="https://github.com/username"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Communication Preferences</CardTitle>
                <CardDescription>
                  Control how you receive updates and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive important updates via email
                      </p>
                    </div>
                    <Switch
                      checked={form.watch('email_notifications')}
                      onCheckedChange={(checked) => form.setValue('email_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Site Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Show notifications within the site
                      </p>
                    </div>
                    <Switch
                      checked={form.watch('site_notifications')}
                      onCheckedChange={(checked) => form.setValue('site_notifications', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about new services
                      </p>
                    </div>
                    <Switch
                      checked={form.watch('marketing_emails')}
                      onCheckedChange={(checked) => form.setValue('marketing_emails', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {message && (
              <Alert className={message.type === 'error' ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'}>
                {message.type === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                )}
                <AlertDescription className={message.type === 'error' ? 'text-red-200' : 'text-green-200'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="activity" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Overview */}
            <div className="lg:col-span-2 space-y-6">
              {/* Stats Cards */}
              {userActivity && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-400">{userActivity.hire_requests}</div>
                      <div className="text-sm text-muted-foreground">Hire Requests</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">{userActivity.chat_sessions}</div>
                      <div className="text-sm text-muted-foreground">Chat Sessions</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">{userActivity.project_views}</div>
                      <div className="text-sm text-muted-foreground">Project Views</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {Math.floor((new Date().getTime() - new Date(userActivity.member_since).getTime()) / (1000 * 60 * 60 * 24))}
                      </div>
                      <div className="text-sm text-muted-foreground">Days Active</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Recent Hire Requests */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Hire Requests</CardTitle>
                  <CardDescription>Your project inquiries and their status</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentHireRequests.length > 0 ? (
                    <div className="space-y-4">
                      {recentHireRequests.map((request, index) => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold">{request.project_title || 'Project Inquiry'}</h4>
                            <p className="text-sm text-muted-foreground">
                              {request.selected_gig?.title || 'Custom Development'}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <span>{request.proposed_budget}</span>
                              <span>{request.timeline}</span>
                              <span>{new Date(request.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <Badge className={getRequestStatusColor(request.status)}>
                            {request.status.replace('_', ' ')}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">No Hire Requests Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Ready to start your first project?
                      </p>
                      <Link href="/gigs">
                        <Button variant="outline">
                          Browse Services
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activity Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/hire-me">
                    <Button variant="outline" className="w-full justify-start">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Start New Project
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      setContext({ page: 'profile' });
                      setChatOpen(true);
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat with AI
                  </Button>
                  <Link href="/projects">
                    <Button variant="outline" className="w-full justify-start">
                      <Eye className="w-4 h-4 mr-2" />
                      Browse Projects
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {userActivity && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Account Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Last Login</span>
                      <span className="text-sm">
                        {new Date(userActivity.last_login).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Member Since</span>
                      <span className="text-sm">
                        {new Date(userActivity.member_since).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Account Type</span>
                      <Badge variant="outline" className="capitalize">
                        {user?.role}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-8">
          {notificationPrefs ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Email Preferences</CardTitle>
                  <CardDescription>
                    Control what emails you receive
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Announcements</Label>
                        <p className="text-sm text-muted-foreground">
                          Important site announcements and updates
                        </p>
                      </div>
                      <Switch
                        checked={notificationPrefs.email_announcements}
                        onCheckedChange={(checked) => 
                          updateNotificationPreferences({ email_announcements: checked })
                        }
                        disabled={isUpdatingPrefs}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Project Updates</Label>
                        <p className="text-sm text-muted-foreground">
                          Notifications about new projects and case studies
                        </p>
                      </div>
                      <Switch
                        checked={notificationPrefs.email_project_updates}
                        onCheckedChange={(checked) => 
                          updateNotificationPreferences({ email_project_updates: checked })
                        }
                        disabled={isUpdatingPrefs}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Hire Requests</Label>
                        <p className="text-sm text-muted-foreground">
                          Updates about your hire requests and proposals
                        </p>
                      </div>
                      <Switch
                        checked={notificationPrefs.email_hire_requests}
                        onCheckedChange={(checked) => 
                          updateNotificationPreferences({ email_hire_requests: checked })
                        }
                        disabled={isUpdatingPrefs}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Messages</Label>
                        <p className="text-sm text-muted-foreground">
                          Direct messages and chat notifications
                        </p>
                      </div>
                      <Switch
                        checked={notificationPrefs.email_messages}
                        onCheckedChange={(checked) => 
                          updateNotificationPreferences({ email_messages: checked })
                        }
                        disabled={isUpdatingPrefs}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Marketing</Label>
                        <p className="text-sm text-muted-foreground">
                          Newsletter and promotional content
                        </p>
                      </div>
                      <Switch
                        checked={notificationPrefs.email_marketing}
                        onCheckedChange={(checked) => 
                          updateNotificationPreferences({ email_marketing: checked })
                        }
                        disabled={isUpdatingPrefs}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Delivery Settings</CardTitle>
                  <CardDescription>
                    When and how often you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Digest Frequency</Label>
                    <Select 
                      value={notificationPrefs.digest_frequency} 
                      onValueChange={(value) => updateNotificationPreferences({ digest_frequency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select 
                      value={notificationPrefs.timezone} 
                      onValueChange={(value) => updateNotificationPreferences({ timezone: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        <SelectItem value="America/Chicago">Central Time</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quiet Hours Start</Label>
                      <Input
                        type="time"
                        value={notificationPrefs.quiet_hours_start || ''}
                        onChange={(e) => updateNotificationPreferences({ quiet_hours_start: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quiet Hours End</Label>
                      <Input
                        type="time"
                        value={notificationPrefs.quiet_hours_end || ''}
                        onChange={(e) => updateNotificationPreferences({ quiet_hours_end: e.target.value })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Loading Preferences</h3>
                <p className="text-muted-foreground">Please wait while we load your notification settings...</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="security" className="mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Your email address verification status
                    </p>
                  </div>
                  <Badge className={user?.is_email_verified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}>
                    {user?.is_email_verified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Account Type</Label>
                    <p className="text-sm text-muted-foreground">
                      Your current account role and permissions
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {user?.role}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Login Count</Label>
                    <p className="text-sm text-muted-foreground">
                      Total number of logins
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    {user?.login_count ?? 0} times
                  </span>
                </div>

                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/auth/reset-password'}
                  className="w-full"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data & Privacy</CardTitle>
                <CardDescription>
                  Manage your data and privacy settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => {
                      // Export user data
                      analytics.track('data_export_requested');
                    }}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Export My Data
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.location.href = '/privacy'}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Privacy Policy
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.location.href = '/terms'}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Terms of Service
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-red-400">Danger Zone</Label>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                        analytics.track('account_deletion_requested');
                        // Handle account deletion
                      }
                    }}
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  function getRequestStatusColor(status: string) {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400';
      case 'contacted': return 'bg-yellow-500/20 text-yellow-400';
      case 'in_progress': return 'bg-purple-500/20 text-purple-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  }
}