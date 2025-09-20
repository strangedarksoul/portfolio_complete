'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/lib/store';
import { adminAPI, projectsAPI, gigsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Briefcase, 
  TrendingUp,
  Mail,
  Eye,
  Clock,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Download,
  Send,
  Star,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Code,
  Calendar,
  Globe,
  Github,
  ExternalLink,
  Upload,
  Settings,
  Database,
  FileText,
  Target,
  Award,
  Zap
} from 'lucide-react';

// Schemas for form validation
const projectSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  short_tagline: z.string().min(1, 'Tagline is required'),
  description_short: z.string().min(1, 'Short description is required'),
  description_long: z.string().min(1, 'Long description is required'),
  role: z.string().min(1, 'Role is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  is_ongoing: z.boolean(),
  repo_url: z.string().url().optional().or(z.literal('')),
  live_demo_url: z.string().url().optional().or(z.literal('')),
  visibility: z.string(),
  is_featured: z.boolean(),
  order: z.number().min(0),
  skill_ids: z.array(z.string()).optional(),
});

const gigSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  short_description: z.string().min(1, 'Short description is required'),
  long_description: z.string().min(1, 'Long description is required'),
  price_min: z.number().min(0, 'Price must be positive'),
  price_max: z.number().optional(),
  delivery_time_min: z.number().min(1, 'Delivery time is required'),
  delivery_time_max: z.number().optional(),
  delivery_time_unit: z.string(),
  status: z.string(),
  is_featured: z.boolean(),
  order: z.number().min(0),
});

interface AdminMetrics {
  users: {
    total: number;
    new_30d: number;
  };
  projects: {
    total: number;
    published: number;
  };
  leads: {
    total: number;
    new_7d: number;
    by_status: Array<{ status: string; count: number }>;
  };
  chat: {
    total_sessions: number;
    sessions_7d: number;
    total_messages: number;
  };
  analytics: {
    top_events: Array<{ event_type: string; count: number }>;
    popular_projects: Array<{ metadata__project_id: string; views: number }>;
  };
}

interface Lead {
  id: number;
  name: string;
  email: string;
  company?: string;
  status: string;
  gig_title?: string;
  budget: string;
  timeline: string;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  title: string;
  slug: string;
  short_tagline: string;
  description_short: string;
  description_long: string;
  role: string;
  start_date: string;
  end_date?: string;
  is_ongoing: boolean;
  repo_url?: string;
  live_demo_url?: string;
  visibility: string;
  is_featured: boolean;
  order: number;
  skills: Array<{ id: string; name: string }>;
  view_count: number;
  created_at: string;
}

interface Gig {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  long_description: string;
  price_min: number;
  price_max?: number;
  delivery_time_min: number;
  delivery_time_max?: number;
  delivery_time_unit: string;
  status: string;
  is_featured: boolean;
  order: number;
  category: {
    id: string;
    name: string;
  };
  click_count: number;
  hire_count: number;
  created_at: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency_level: number;
  color: string;
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [showGigDialog, setShowGigDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    body: '',
    user_group: 'all'
  });

  const { user } = useAuthStore();

  // Project form
  const projectForm = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      short_tagline: '',
      description_short: '',
      description_long: '',
      role: 'fullstack',
      start_date: '',
      end_date: '',
      is_ongoing: false,
      repo_url: '',
      live_demo_url: '',
      visibility: 'public',
      is_featured: false,
      order: 0,
      skill_ids: [],
    },
  });

  // Gig form
  const gigForm = useForm({
    resolver: zodResolver(gigSchema),
    defaultValues: {
      title: '',
      short_description: '',
      long_description: '',
      price_min: 0,
      price_max: undefined,
      delivery_time_min: 1,
      delivery_time_max: undefined,
      delivery_time_unit: 'weeks',
      status: 'open',
      is_featured: false,
      order: 0,
    },
  });

  const loadAdminData = useCallback(async () => {
    try {
      const [metricsResponse, leadsResponse, projectsResponse, gigsResponse, skillsResponse] = await Promise.all([
        adminAPI.getOverview(),
        adminAPI.getLeads(),
        projectsAPI.getProjects(),
        gigsAPI.getGigs(),
        projectsAPI.getSkills(),
      ]);

      setMetrics(metricsResponse.data);
      setLeads(leadsResponse.data.leads || []);
      setProjects(projectsResponse.data.results || []);
      setGigs(gigsResponse.data.results || []);
      setSkills(skillsResponse.data.results || []);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin' || user?.is_staff) {
      loadAdminData();
    }
  }, [user, loadAdminData]);

  const handleSendNotification = async () => {
    if (!notificationForm.title || !notificationForm.body) return;

    setIsSubmitting(true);
    try {
      await adminAPI.sendNotification(notificationForm);
      setMessage({ type: 'success', text: 'Notification sent successfully!' });
      setNotificationForm({ title: '', body: '', user_group: 'all' });
      
      analytics.track('admin_notification_sent', {
        user_group: notificationForm.user_group,
        title_length: notificationForm.title.length,
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send notification' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProject = async (data: any) => {
    setIsSubmitting(true);
    try {
      // In a real implementation, this would call the admin API to create a project
      console.log('Creating project:', data);
      setMessage({ type: 'success', text: 'Project created successfully!' });
      setShowProjectDialog(false);
      projectForm.reset();
      loadAdminData(); // Reload data
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create project' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProject = async (data: any) => {
    if (!selectedProject) return;
    
    setIsSubmitting(true);
    try {
      // In a real implementation, this would call the admin API to update a project
      console.log('Updating project:', selectedProject.id, data);
      setMessage({ type: 'success', text: 'Project updated successfully!' });
      setShowProjectDialog(false);
      setSelectedProject(null);
      projectForm.reset();
      loadAdminData(); // Reload data
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update project' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateGig = async (data: any) => {
    setIsSubmitting(true);
    try {
      // In a real implementation, this would call the admin API to create a gig
      console.log('Creating gig:', data);
      setMessage({ type: 'success', text: 'Service created successfully!' });
      setShowGigDialog(false);
      gigForm.reset();
      loadAdminData(); // Reload data
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create service' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    projectForm.reset({
      title: project.title,
      short_tagline: project.short_tagline,
      description_short: project.description_short,
      description_long: project.description_long,
      role: project.role,
      start_date: project.start_date,
      end_date: project.end_date || '',
      is_ongoing: project.is_ongoing,
      repo_url: project.repo_url || '',
      live_demo_url: project.live_demo_url || '',
      visibility: project.visibility,
      is_featured: project.is_featured,
      order: project.order,
      skill_ids: project.skills.map(s => s.id),
    });
    setShowProjectDialog(true);
  };

  const handleEditGig = (gig: Gig) => {
    setSelectedGig(gig);
    gigForm.reset({
      title: gig.title,
      short_description: gig.short_description,
      long_description: gig.long_description,
      price_min: gig.price_min,
      price_max: gig.price_max,
      delivery_time_min: gig.delivery_time_min,
      delivery_time_max: gig.delivery_time_max,
      delivery_time_unit: gig.delivery_time_unit,
      status: gig.status,
      is_featured: gig.is_featured,
      order: gig.order,
    });
    setShowGigDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-500/20 text-blue-400';
      case 'contacted': return 'bg-yellow-500/20 text-yellow-400';
      case 'in_progress': return 'bg-purple-500/20 text-purple-400';
      case 'completed': return 'bg-green-500/20 text-green-400';
      case 'cancelled': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (!user || (user.role !== 'admin' && !user.is_staff)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You don&apos;t have permission to access the admin dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Mission Control
        </h1>
        <p className="text-xl text-muted-foreground">
          Portfolio analytics, content management, and system administration
        </p>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="gigs">Services</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-8">
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Users Metric */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.users.total}</div>
                    <p className="text-xs text-muted-foreground">
                      +{metrics.users.new_30d} in last 30 days
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Projects Metric */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Projects</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.projects.published}</div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.projects.total} total ({metrics.projects.published} published)
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Leads Metric */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Leads</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.leads.total}</div>
                    <p className="text-xs text-muted-foreground">
                      +{metrics.leads.new_7d} in last 7 days
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Chat Metric */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{metrics.chat.total_sessions}</div>
                    <p className="text-xs text-muted-foreground">
                      {metrics.chat.total_messages} total messages
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('projects')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5 text-purple-400" />
                  Manage Projects
                </CardTitle>
                <CardDescription>Create, edit, and organize portfolio projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projects.length}</div>
                <p className="text-sm text-muted-foreground">Total projects</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('gigs')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-green-400" />
                  Manage Services
                </CardTitle>
                <CardDescription>Create and manage service offerings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{gigs.length}</div>
                <p className="text-sm text-muted-foreground">Active services</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all" onClick={() => setActiveTab('leads')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                  Review Leads
                </CardTitle>
                <CardDescription>Manage hire requests and client inquiries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{leads.length}</div>
                <p className="text-sm text-muted-foreground">Pending leads</p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="projects" className="mt-8">
          <div className="space-y-6">
            {/* Projects Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Projects Management</h2>
                <p className="text-muted-foreground">Create, edit, and organize portfolio projects</p>
              </div>
              <Button
                onClick={() => {
                  setSelectedProject(null);
                  projectForm.reset();
                  setShowProjectDialog(true);
                }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </div>

            {/* Projects List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge variant={project.visibility === 'public' ? 'default' : 'secondary'}>
                        {project.visibility}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditProject(project)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <CardDescription>{project.short_tagline}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Role:</span>
                        <Badge variant="outline">{project.role}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Views:</span>
                        <span>{project.view_count}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Featured:</span>
                        <Badge variant={project.is_featured ? 'default' : 'outline'}>
                          {project.is_featured ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {project.skills.slice(0, 3).map((skill) => (
                          <Badge key={skill.id} variant="outline" className="text-xs">
                            {skill.name}
                          </Badge>
                        ))}
                        {project.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{project.skills.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gigs" className="mt-8">
          <div className="space-y-6">
            {/* Gigs Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Services Management</h2>
                <p className="text-muted-foreground">Create and manage service offerings</p>
              </div>
              <Button
                onClick={() => {
                  setSelectedGig(null);
                  gigForm.reset();
                  setShowGigDialog(true);
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Service
              </Button>
            </div>

            {/* Gigs List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gigs.map((gig) => (
                <Card key={gig.id} className="hover:shadow-lg transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge className={
                        gig.status === 'open' ? 'bg-green-500/20 text-green-400' :
                        gig.status === 'limited' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }>
                        {gig.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditGig(gig)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{gig.title}</CardTitle>
                    <CardDescription>{gig.short_description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Price:</span>
                        <span className="font-semibold">
                          ${Number(gig.price_min ?? 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Delivery:</span>
                        <span>{gig.delivery_time_min} {gig.delivery_time_unit}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Views:</span>
                        <span>{gig.click_count}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Hires:</span>
                        <span>{gig.hire_count}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Featured:</span>
                        <Badge variant={gig.is_featured ? 'default' : 'outline'}>
                          {gig.is_featured ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="leads" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Lead Management</CardTitle>
              <CardDescription>
                Latest hire requests and project inquiries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">{lead.name}</h3>
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {lead.email} • {lead.company && `${lead.company} • `}
                        {lead.gig_title || 'Custom Project'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {lead.budget} • {lead.timeline} • {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Send Notification</CardTitle>
              <CardDescription>
                Send announcements to user groups
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Notification title..."
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={notificationForm.body}
                  onChange={(e) => setNotificationForm(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Notification message..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Target Audience</Label>
                <Select 
                  value={notificationForm.user_group} 
                  onValueChange={(value) => setNotificationForm(prev => ({ ...prev, user_group: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="admins">Admins Only</SelectItem>
                    <SelectItem value="recent">Recent Users (7 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {message && (
                <Alert className={message.type === 'error' ? 'border-red-500/50' : 'border-green-500/50'}>
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleSendNotification}
                disabled={!notificationForm.title || !notificationForm.body || isSubmitting}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Sending...' : 'Send Notification'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-8">
          {metrics && (
            <div className="space-y-6">
              {/* Top Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Events (30 days)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.analytics.top_events.map((event, index) => (
                      <div key={event.event_type} className="flex items-center justify-between">
                        <span className="text-sm capitalize">{event.event_type.replace('_', ' ')}</span>
                        <Badge variant="outline">{event.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Data</CardTitle>
                  <CardDescription>
                    Download analytics and lead data for external analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open('/api/v1/admin/analytics/export?type=events', '_blank');
                      analytics.track('admin_export', { type: 'events' });
                    }}
                    className="w-full justify-start"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Analytics Events (CSV)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      window.open('/api/v1/admin/analytics/export?type=leads', '_blank');
                      analytics.track('admin_export', { type: 'leads' });
                    }}
                    className="w-full justify-start"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Leads (CSV)
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Project Dialog */}
      <Dialog open={showProjectDialog} onOpenChange={setShowProjectDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProject ? 'Edit Project' : 'Create New Project'}
            </DialogTitle>
            <DialogDescription>
              {selectedProject ? 'Update project information' : 'Add a new project to your portfolio'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={projectForm.handleSubmit(selectedProject ? handleUpdateProject : handleCreateProject)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title *</Label>
                <Input
                  id="title"
                  {...projectForm.register('title')}
                  placeholder="Enter project title"
                />
                {projectForm.formState.errors.title && (
                  <p className="text-red-500 text-sm">{projectForm.formState.errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_tagline">Short Tagline *</Label>
                <Input
                  id="short_tagline"
                  {...projectForm.register('short_tagline')}
                  placeholder="Brief project description"
                />
                {projectForm.formState.errors.short_tagline && (
                  <p className="text-red-500 text-sm">{projectForm.formState.errors.short_tagline.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description_short">Short Description *</Label>
              <Textarea
                id="description_short"
                {...projectForm.register('description_short')}
                placeholder="Detailed project description for listings"
                rows={3}
              />
              {projectForm.formState.errors.description_short && (
                <p className="text-red-500 text-sm">{projectForm.formState.errors.description_short.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description_long">Long Description *</Label>
              <Textarea
                id="description_long"
                {...projectForm.register('description_long')}
                placeholder="Full project description with HTML formatting"
                rows={6}
              />
              {projectForm.formState.errors.description_long && (
                <p className="text-red-500 text-sm">{projectForm.formState.errors.description_long.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select onValueChange={(value) => projectForm.setValue('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo">Solo Developer</SelectItem>
                    <SelectItem value="lead">Team Lead</SelectItem>
                    <SelectItem value="frontend">Frontend Developer</SelectItem>
                    <SelectItem value="backend">Backend Developer</SelectItem>
                    <SelectItem value="fullstack">Full-Stack Developer</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  type="date"
                  {...projectForm.register('start_date')}
                />
                {projectForm.formState.errors.start_date && (
                  <p className="text-red-500 text-sm">{projectForm.formState.errors.start_date.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  {...projectForm.register('end_date')}
                  disabled={projectForm.watch('is_ongoing')}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_ongoing"
                checked={projectForm.watch('is_ongoing')}
                onCheckedChange={(checked) => projectForm.setValue('is_ongoing', !!checked)}
              />
              <Label htmlFor="is_ongoing">This project is ongoing</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="repo_url">Repository URL</Label>
                <Input
                  id="repo_url"
                  {...projectForm.register('repo_url')}
                  placeholder="https://github.com/username/repo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="live_demo_url">Live Demo URL</Label>
                <Input
                  id="live_demo_url"
                  {...projectForm.register('live_demo_url')}
                  placeholder="https://demo.example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select onValueChange={(value) => projectForm.setValue('visibility', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  {...projectForm.register('order', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="is_featured"
                  checked={projectForm.watch('is_featured')}
                  onCheckedChange={(checked) => projectForm.setValue('is_featured', !!checked)}
                />
                <Label htmlFor="is_featured">Featured project</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowProjectDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Saving...' : selectedProject ? 'Update Project' : 'Create Project'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gig Dialog */}
      <Dialog open={showGigDialog} onOpenChange={setShowGigDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedGig ? 'Edit Service' : 'Create New Service'}
            </DialogTitle>
            <DialogDescription>
              {selectedGig ? 'Update service information' : 'Add a new service offering'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={gigForm.handleSubmit(handleCreateGig)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="gig_title">Service Title *</Label>
              <Input
                id="gig_title"
                {...gigForm.register('title')}
                placeholder="Enter service title"
              />
              {gigForm.formState.errors.title && (
                <p className="text-red-500 text-sm">{gigForm.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gig_short_description">Short Description *</Label>
              <Textarea
                id="gig_short_description"
                {...gigForm.register('short_description')}
                placeholder="Brief service description for cards"
                rows={2}
              />
              {gigForm.formState.errors.short_description && (
                <p className="text-red-500 text-sm">{gigForm.formState.errors.short_description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gig_long_description">Long Description *</Label>
              <Textarea
                id="gig_long_description"
                {...gigForm.register('long_description')}
                placeholder="Detailed service description with HTML formatting"
                rows={6}
              />
              {gigForm.formState.errors.long_description && (
                <p className="text-red-500 text-sm">{gigForm.formState.errors.long_description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_min">Starting Price *</Label>
                <Input
                  id="price_min"
                  type="number"
                  {...gigForm.register('price_min', { valueAsNumber: true })}
                  placeholder="5000"
                />
                {gigForm.formState.errors.price_min && (
                  <p className="text-red-500 text-sm">{gigForm.formState.errors.price_min.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price_max">Maximum Price</Label>
                <Input
                  id="price_max"
                  type="number"
                  {...gigForm.register('price_max', { valueAsNumber: true })}
                  placeholder="25000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_time_min">Min Delivery Time *</Label>
                <Input
                  id="delivery_time_min"
                  type="number"
                  {...gigForm.register('delivery_time_min', { valueAsNumber: true })}
                  placeholder="4"
                />
                {gigForm.formState.errors.delivery_time_min && (
                  <p className="text-red-500 text-sm">{gigForm.formState.errors.delivery_time_min.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_time_max">Max Delivery Time</Label>
                <Input
                  id="delivery_time_max"
                  type="number"
                  {...gigForm.register('delivery_time_max', { valueAsNumber: true })}
                  placeholder="12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_time_unit">Time Unit</Label>
                <Select onValueChange={(value) => gigForm.setValue('delivery_time_unit', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gig_status">Status</Label>
                <Select onValueChange={(value) => gigForm.setValue('status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="limited">Limited Availability</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gig_order">Display Order</Label>
                <Input
                  id="gig_order"
                  type="number"
                  {...gigForm.register('order', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="gig_is_featured"
                  checked={gigForm.watch('is_featured')}
                  onCheckedChange={(checked) => gigForm.setValue('is_featured', !!checked)}
                />
                <Label htmlFor="gig_is_featured">Featured service</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowGigDialog(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Saving...' : selectedGig ? 'Update Service' : 'Create Service'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}