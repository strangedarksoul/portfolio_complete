'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthStore, usePortalStore, useChatStore } from '@/lib/store';
import { projectsAPI, gigsAPI, portalAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  ArrowRight, 
  Code, 
  Briefcase, 
  MessageSquare, 
  Star, 
  ExternalLink,
  Calendar,
  Zap
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  slug: string;
  short_tagline: string;
  hero_image?: string;
  skills: Array<{ name: string; color: string }>;
  is_featured: boolean;
  view_count: number;
}

interface Gig {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  price_display: string;
  delivery_display: string;
  is_featured: boolean;
}

export function HomePage() {
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [activeGigs, setActiveGigs] = useState<Gig[]>([]);
  const [siteConfig, setSiteConfig] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user, isAuthenticated } = useAuthStore();
  const { userName } = usePortalStore();
  const { setIsOpen: setChatOpen, setContext } = useChatStore();

  const displayName = isAuthenticated ? user?.display_name || user?.full_name : userName;

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const [projectsResponse, gigsResponse, configResponse] = await Promise.all([
        projectsAPI.getProjects({ is_featured: true }),
        gigsAPI.getGigs({ status: 'open', is_featured: true }),
        portalAPI.getConfig(),
      ]);

      setFeaturedProjects(projectsResponse.data.results || []);
      setActiveGigs(gigsResponse.data.results || []);
      setSiteConfig(configResponse.data);
    } catch (error) {
      console.error('Failed to load home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatOpen = (context?: any) => {
    if (context) {
      setContext(context);
    }
    setChatOpen(true);
    analytics.track('chat_opened_from_home', { context_type: context ? 'project' : 'general' });
  };

  const handleQuickAction = (action: string) => {
    analytics.track('quick_action_clicked', { action });
    
    switch (action) {
      case 'hire_quick':
        window.location.href = '/hire-me';
        break;
      case 'schedule_call':
        // This would integrate with a scheduling service
        window.open('https://calendly.com/edzio', '_blank');
        break;
      case 'view_projects':
        window.location.href = '/projects';
        break;
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <motion.h1 
              className="text-4xl md:text-7xl font-bold mb-6"
              style={{
                background: 'linear-gradient(45deg, #ffffff, #a855f7, #ec4899, #ffffff)',
                backgroundSize: '300% 300%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              animate={{ 
                backgroundPosition: ['0%', '100%'],
              }}
              transition={{ 
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              {displayName ? `Welcome back, ${displayName}` : siteConfig?.hero_text || 'Welcome to my digital realm'}
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              {siteConfig?.site_tagline || 'Full-Stack Developer & AI Enthusiast'}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <Button
                size="lg"
                onClick={() => handleChatOpen()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <MessageSquare className="mr-2 w-5 h-5" />
                Ask me anything
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleQuickAction('view_projects')}
              >
                <Code className="mr-2 w-5 h-5" />
                View Projects
              </Button>
            </motion.div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20"
          >
            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-purple-500/20 hover:border-purple-500/40">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Hire for a Quick Gig</CardTitle>
                <CardDescription>
                  Need something built fast? Check out my packaged services.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between group-hover:bg-muted"
                  onClick={() => handleQuickAction('hire_quick')}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-purple-500/20 hover:border-purple-500/40">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Schedule a Call</CardTitle>
                <CardDescription>
                  Let's discuss your project over a quick call.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between group-hover:bg-muted"
                  onClick={() => handleQuickAction('schedule_call')}
                >
                  Book Now
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-purple-500/20 hover:border-purple-500/40">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <CardTitle>See Director&apos;s Cut</CardTitle>
                <CardDescription>
                  Dive deep into detailed case studies of my best work.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/projects?filter=case_studies">
                  <Button variant="ghost" className="w-full justify-between group-hover:bg-muted">
                    Explore
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Featured Projects */}
      {featuredProjects.length > 0 && (
        <section className="py-20 px-6">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Featured Projects</h2>
              <p className="text-xl text-muted-foreground">
                Highlights from my latest work
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-purple-500/20 hover:border-purple-500/40 overflow-hidden">
                    {project.hero_image && (
                      <div className="aspect-video overflow-hidden">
                        <Image
                          src={project.hero_image}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          width={400}
                          height={225}
                          unoptimized={true}
                        />
                      </div>
                    )}
                    
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="bg-purple-500/10 text-purple-400">
                          Featured
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {project.view_count} views
                        </span>
                      </div>
                      <CardTitle className="group-hover:text-purple-400 transition-colors">
                        {project.title}
                      </CardTitle>
                      <CardDescription>{project.short_tagline}</CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {project.skills.slice(0, 3).map((skill) => (
                          <Badge 
                            key={skill.name} 
                            variant="outline"
                            style={{ borderColor: skill.color, color: skill.color }}
                          >
                            {skill.name}
                          </Badge>
                        ))}
                        {project.skills.length > 3 && (
                          <Badge variant="outline">
                            +{project.skills.length - 3} more
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link href={`/projects/${project.slug}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleChatOpen({ project_id: project.id, project_title: project.title })}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Link href="/projects">
                <Button size="lg" variant="outline">
                  View All Projects
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* Active Gigs */}
      {activeGigs.length > 0 && (
        <section className="py-20 px-6 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Available Services</h2>
              <p className="text-xl text-muted-foreground">
                Ready-to-go solutions for your next project
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {activeGigs.map((gig, index) => (
                <motion.div
                  key={gig.id}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  viewport={{ once: true }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-purple-500/20 hover:border-purple-500/40 h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                          Available
                        </Badge>
                        <div className="text-right">
                          <div className="font-semibold text-purple-400">{gig.price_display}</div>
                          <div className="text-sm text-muted-foreground">{gig.delivery_display}</div>
                        </div>
                      </div>
                      <CardTitle className="group-hover:text-purple-400 transition-colors">
                        {gig.title}
                      </CardTitle>
                      <CardDescription>{gig.short_description}</CardDescription>
                    </CardHeader>

                    <CardContent>
                      <div className="flex gap-2">
                        <Link href={`/gigs/${gig.slug}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            Learn More
                          </Button>
                        </Link>
                        <Link href={`/hire-me?gig=${gig.slug}`}>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                          >
                            <Briefcase className="w-4 h-4 mr-2" />
                            Hire
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Link href="/gigs">
                <Button size="lg" variant="outline">
                  View All Services
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to bring your ideas to life?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Let&apos;s discuss your project and see how I can help you achieve your goals.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                onClick={() => handleChatOpen()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <MessageSquare className="mr-2 w-5 h-5" />
                Start a Conversation
              </Button>
              
              <Link href="/hire-me">
                <Button size="lg" variant="outline">
                  <Briefcase className="mr-2 w-5 h-5" />
                  Hire Me
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}