'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatStore } from '@/lib/store';
import { projectsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  ExternalLink, 
  Github, 
  Calendar, 
  Users, 
  MessageSquare,
  ArrowLeft,
  FileText,
  BarChart3,
  Zap,
  Eye
} from 'lucide-react';

interface ProjectDetailProps {
  slug: string;
}

interface ProjectDetail {
  id: string;
  title: string;
  slug: string;
  short_tagline: string;
  description_short: string;
  description_long: string;
  role: string;
  start_date: string;
  end_date?: string;
  duration: string;
  is_ongoing: boolean;
  hero_image?: string;
  hero_video?: string;
  gallery_images: string[];
  repo_url?: string;
  live_demo_url?: string;
  case_study_url?: string;
  metrics: Record<string, any>;
  skills: Array<{ name: string; color: string; category: string }>;
  tech_stack: Array<{ name: string; color: string; category: string }>;
  collaborations: Array<{ name: string; role: string; contribution: string; profile_url?: string }>;
  updates: Array<{ title: string; content: string; update_type: string; created_at: string }>;
  view_count: number;
  is_featured: boolean;
  has_case_study: boolean;
  case_study_id?: number;
}

export function ProjectDetail({ slug }: ProjectDetailProps) {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  const { setIsOpen: setChatOpen, setContext } = useChatStore();

  useEffect(() => {
    loadProject();
  }, [slug]);

  const loadProject = async () => {
    try {
      const response = await projectsAPI.getProject(slug);
      setProject(response.data);
      
      // Track project view
      analytics.projectView(response.data.id, response.data.title, response.data.slug);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatAboutProject = () => {
    if (project) {
      setContext({ project_id: project.id, project_title: project.title });
      setChatOpen(true);
      analytics.track('chat_opened_from_project_detail', { project_id: project.id });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <Link href="/projects">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {project.hero_image && (
          <div className="absolute inset-0 z-0">
            <Image
              src={project.hero_image}
              alt={project.title}
              className="w-full h-full object-cover"
              width={1200}
              height={600}
              unoptimized={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
          </div>
        )}
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/projects">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </Link>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  {project.is_featured && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      Featured
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {project.role.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    {project.view_count} views
                  </div>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {project.title}
                </h1>
                
                <p className="text-xl text-muted-foreground mb-6">
                  {project.short_tagline}
                </p>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {project.duration}
                  </div>
                  {project.collaborations.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {project.collaborations.length + 1} contributors
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {project.live_demo_url && (
                    <Button
                      onClick={() => {
                        window.open(project.live_demo_url!, '_blank');
                        analytics.linkClick('project_demo', project.live_demo_url!);
                      }}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Live Demo
                    </Button>
                  )}
                  
                  {project.repo_url && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        window.open(project.repo_url!, '_blank');
                        analytics.linkClick('project_repo', project.repo_url!);
                      }}
                    >
                      <Github className="w-4 h-4 mr-2" />
                      View Code
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={handleChatAboutProject}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask About This
                  </Button>

                  {project.has_case_study && project.case_study_id && (
                    <Link href={`/case-studies/${project.case_study_id}`}>
                      <Button variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Director's Cut
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              {Object.keys(project.metrics).length > 0 && (
                <Card className="w-full lg:w-80 bg-muted/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Impact Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(project.metrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="font-semibold">{value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Content Tabs */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tech">Tech Stack</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
              <TabsTrigger value="updates">Updates</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8">
              <div className="prose prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: project.description_long }} />
              </div>

              {/* Gallery */}
              {project.gallery_images.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-2xl font-bold mb-6">Gallery</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {project.gallery_images.map((image, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="aspect-video overflow-hidden rounded-lg"
                      >
                        <Image
                          src={image}
                          alt={`${project.title} gallery ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          width={400}
                          height={225}
                          unoptimized={true}
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="tech" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {['language', 'framework', 'database', 'tool', 'cloud'].map((category) => {
                  const categorySkills = project.skills.filter(skill => skill.category === category);
                  if (categorySkills.length === 0) return null;

                  return (
                    <Card key={category}>
                      <CardHeader>
                        <CardTitle className="text-lg capitalize">{category}s</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {categorySkills.map((skill) => (
                            <div key={skill.name} className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: skill.color }}
                              />
                              <span className="text-sm">{skill.name}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="team" className="mt-8">
              {project.collaborations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {project.collaborations.map((collab, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">{collab.name}</CardTitle>
                          <CardDescription>{collab.role}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-4">
                            {collab.contribution}
                          </p>
                          {collab.profile_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(collab.profile_url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Profile
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Solo Project</h3>
                  <p className="text-muted-foreground">
                    This project was developed independently by Edzio.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="updates" className="mt-8">
              {project.updates.length > 0 ? (
                <div className="space-y-6">
                  {project.updates.map((update, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{update.title}</CardTitle>
                            <Badge variant="outline">
                              {update.update_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          <CardDescription>
                            {new Date(update.created_at).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div 
                            className="prose prose-invert prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: update.content }}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Zap className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Updates Yet</h3>
                  <p className="text-muted-foreground">
                    Check back later for project updates and improvements.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
}