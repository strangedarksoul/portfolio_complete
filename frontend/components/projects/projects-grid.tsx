'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChatStore } from '@/lib/store';
import { projectsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  Code, 
  ExternalLink, 
  MessageSquare, 
  Search, 
  Filter,
  Calendar,
  Eye,
  Star,
  Github
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  slug: string;
  short_tagline: string;
  description_short: string;
  role: string;
  start_date: string;
  end_date?: string;
  duration: string;
  is_ongoing: boolean;
  hero_image?: string;
  repo_url?: string;
  live_demo_url?: string;
  skills: Array<{ name: string; color: string; category: string }>;
  view_count: number;
  is_featured: boolean;
  has_case_study: boolean;
}

interface Skill {
  id: string;
  name: string;
  slug: string;
  category: string;
  color: string;
  project_count: number;
}

export function ProjectsGrid() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const { setIsOpen: setChatOpen, setContext } = useChatStore();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, selectedSkill, selectedRole]);

  const filterProjects = () => {
    let filtered = projects;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.short_tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description_short.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.skills.some(skill => skill.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Skill filter
    if (selectedSkill !== 'all') {
      filtered = filtered.filter(project =>
        project.skills.some(skill => skill.slug === selectedSkill)
      );
    }

    // Role filter
    if (selectedRole !== 'all') {
      filtered = filtered.filter(project => project.role === selectedRole);
    }

    setFilteredProjects(filtered);
  };

  const loadData = async () => {
    try {
      const [projectsResponse, skillsResponse] = await Promise.all([
        projectsAPI.getProjects(),
        projectsAPI.getSkills(),
      ]);

      setProjects(projectsResponse.data.results || []);
      setSkills(skillsResponse.data.results || []);
    } catch (error) {
      console.error('Failed to load projects data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    analytics.projectView(project.id, project.title, project.slug);
  };

  const handleChatAboutProject = (project: Project) => {
    setContext({ project_id: project.id, project_title: project.title });
    setChatOpen(true);
    analytics.track('chat_opened_from_project', { project_id: project.id });
  };

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'solo', label: 'Solo Developer' },
    { value: 'lead', label: 'Team Lead' },
    { value: 'frontend', label: 'Frontend' },
    { value: 'backend', label: 'Backend' },
    { value: 'fullstack', label: 'Full-Stack' },
    { value: 'consultant', label: 'Consultant' },
  ];

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
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Project Constellation
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore the digital worlds I&apos;ve crafted, each one a unique story of innovation and technical excellence.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="mb-8 space-y-4"
      >
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects, skills, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedSkill} onValueChange={setSelectedSkill}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by skill" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Skills</SelectItem>
              {skills.map((skill) => (
                <SelectItem key={skill.slug} value={skill.slug}>
                  {skill.name} ({skill.project_count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredProjects.length} of {projects.length} projects
        </div>
      </motion.div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.8 }}
            className="group"
          >
            <Card className="h-full hover:shadow-2xl transition-all duration-500 cursor-pointer border-purple-500/20 hover:border-purple-500/40 overflow-hidden bg-gradient-to-br from-background to-muted/30">
              {/* Hero Image */}
              {project.hero_image && (
                <div className="aspect-video overflow-hidden relative">
                  <Image
                    src={project.hero_image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    width={400}
                    height={225}
                    unoptimized={true}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Floating badges */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {project.is_featured && (
                      <Badge className="bg-yellow-500/90 text-black">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    {project.has_case_study && (
                      <Badge className="bg-purple-500/90 text-white">
                        Director's Cut
                      </Badge>
                    )}
                  </div>

                  {/* View count */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1 text-white/80 text-xs">
                    <Eye className="w-3 h-3" />
                    {project.view_count}
                  </div>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline" className="text-xs">
                    {project.role.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {project.duration}
                  </div>
                </div>
                
                <CardTitle className="group-hover:text-purple-400 transition-colors line-clamp-2">
                  {project.title}
                </CardTitle>
                <CardDescription className="line-clamp-2">
                  {project.short_tagline}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {project.description_short}
                </p>

                {/* Tech Stack */}
                <div className="flex flex-wrap gap-1">
                  {project.skills.slice(0, 4).map((skill) => (
                    <Badge 
                      key={skill.name} 
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: skill.color, color: skill.color }}
                    >
                      {skill.name}
                    </Badge>
                  ))}
                  {project.skills.length > 4 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.skills.length - 4}
                    </Badge>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link href={`/projects/${project.slug}`} className="flex-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleProjectClick(project)}
                    >
                      <Code className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                  </Link>
                  
                  {project.live_demo_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.open(project.live_demo_url ?? '', '_blank');
                        analytics.linkClick('project_demo', project.live_demo_url);
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {project.repo_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        window.open(project.repo_url ?? '', '_blank');
                        analytics.linkClick('project_repo', project.repo_url ?? '');
                      }}
                    >
                      <Github className="w-4 h-4" />
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleChatAboutProject(project)}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Search className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your search or filter criteria
          </p>
          <Button
            onClick={() => {
              setSearchQuery('');
              setSelectedSkill('all');
              setSelectedRole('all');
            }}
            variant="outline"
          >
            Clear Filters
          </Button>
        </motion.div>
      )}
    </div>
  );
}