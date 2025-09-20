'use client';

import React from 'react';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChatStore } from '@/lib/store';
import { projectsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  Search, 
  MessageSquare, 
  Code, 
  Database, 
  Cloud, 
  Wrench, 
  Layers,
  Star,
  TrendingUp,
  Filter
} from 'lucide-react';

interface Skill {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  proficiency_level: number;
  color: string;
  project_count: number;
}

interface SkillProject {
  id: string;
  title: string;
  slug: string;
  short_tagline: string;
  hero_image?: string;
  skills: Array<{ name: string; color: string }>;
}

export function SkillsConstellation() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skillProjects, setSkillProjects] = useState<SkillProject[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);
  
  const { setIsOpen: setChatOpen, setContext } = useChatStore();
  const constellationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    try {
      const response = await projectsAPI.getSkills();
      setSkills(response.data.results || []);
    } catch (error) {
      console.error('Failed to load skills:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillClick = async (skill: Skill) => {
    setSelectedSkill(skill);
    
    try {
      const response = await projectsAPI.getSkillProjects(skill.slug);
      setSkillProjects(response.data.projects || []);
      
      analytics.track('skill_explore', {
        skill_id: skill.id,
        skill_name: skill.name,
        skill_category: skill.category,
      });
    } catch (error) {
      console.error('Failed to load skill projects:', error);
    }
  };

  const handleChatAboutSkill = (skill: Skill) => {
    setContext({ skill_id: skill.id, skill_name: skill.name });
    setChatOpen(true);
    analytics.track('chat_opened_from_skill', { skill_id: skill.id });
  };

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || skill.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: 'all', label: 'All Skills', icon: Star },
    { value: 'language', label: 'Languages', icon: Code },
    { value: 'framework', label: 'Frameworks', icon: Layers },
    { value: 'database', label: 'Databases', icon: Database },
    { value: 'cloud', label: 'Cloud', icon: Cloud },
    { value: 'tool', label: 'Tools', icon: Wrench },
  ];

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(c => c.value === category);
    return categoryData?.icon || Code;
  };

  const getProficiencyLabel = (level: number) => {
    const labels = ['', 'Beginner', 'Novice', 'Intermediate', 'Advanced', 'Expert'];
    return labels[level] || 'Unknown';
  };

  const getSkillPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI;
    const radius = Math.min(200 + (index % 3) * 50, 300);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  };

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
          Tech Constellation
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Navigate through the galaxy of technologies that power my digital creations. Each star represents mastery forged through real-world projects.
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
              placeholder="Search technologies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {category.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredSkills.length} of {skills.length} technologies
        </div>
      </motion.div>

      {/* Skills Constellation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Constellation View */}
        <div className="lg:col-span-2">
          <Card className="p-8 bg-gradient-to-br from-background to-muted/30 border-purple-500/20">
            <div 
              ref={constellationRef}
              className="relative h-96 md:h-[500px] overflow-hidden rounded-lg"
            >
              {/* Background Grid */}
              <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className="border border-purple-500/20" />
                  ))}
                </div>
              </div>

              {/* Skills as Floating Nodes */}
              <div className="relative h-full flex items-center justify-center">
                {filteredSkills.map((skill, index) => {
                  const position = getSkillPosition(index, filteredSkills.length);
                  const Icon = getCategoryIcon(skill.category);
                  
                  return (
                    <motion.div
                      key={skill.id}
                      className="absolute cursor-pointer group"
                      style={{
                        left: `calc(50% + ${position.x}px)`,
                        top: `calc(50% + ${position.y}px)`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.05, duration: 0.5 }}
                      whileHover={{ scale: 1.1 }}
                      onClick={() => handleSkillClick(skill)}
                      onHoverStart={() => setHoveredSkill(skill.id)}
                      onHoverEnd={() => setHoveredSkill(null)}
                    >
                      {/* Skill Node */}
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 transition-all duration-300"
                        style={{ 
                          backgroundColor: skill.color + '20',
                          borderColor: skill.color,
                          boxShadow: hoveredSkill === skill.id ? `0 0 20px ${skill.color}50` : undefined
                        }}
                      >
                        <Icon className="w-5 h-5" style={{ color: skill.color }} />
                      </div>

                      {/* Skill Label */}
                      <div className="absolute top-14 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-background/90 backdrop-blur-sm border rounded-lg p-2 text-center whitespace-nowrap">
                          <div className="font-semibold text-sm">{skill.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {getProficiencyLabel(skill.proficiency_level)} • {skill.project_count} projects
                          </div>
                        </div>
                      </div>

                      {/* Connection Lines */}
                      {hoveredSkill === skill.id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 pointer-events-none"
                        >
                          {/* Animated pulse ring */}
                          <div 
                            className="absolute inset-0 rounded-full animate-ping"
                            style={{ backgroundColor: skill.color + '30' }}
                          />
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>

        {/* Skill Details Panel */}
        <div className="space-y-6">
          {selectedSkill ? (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: selectedSkill.color + '20' }}
                    >
                      {React.createElement(getCategoryIcon(selectedSkill.category), {
                        className: "w-5 h-5",
                        style: { color: selectedSkill.color }
                      })}
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {selectedSkill.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">{selectedSkill.name}</CardTitle>
                  <CardDescription>
                    {getProficiencyLabel(selectedSkill.proficiency_level)} • {selectedSkill.project_count} projects
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedSkill.description}
                  </p>

                  {/* Proficiency Visualization */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Proficiency Level</span>
                      <span>{selectedSkill.proficiency_level}/5</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <motion.div
                        className="h-2 rounded-full"
                        style={{ backgroundColor: selectedSkill.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(selectedSkill.proficiency_level / 5) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleChatAboutSkill(selectedSkill)}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Ask About This
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Related Projects */}
              {skillProjects.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Projects Using {selectedSkill.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {skillProjects.map((project) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => window.location.href = `/projects/${project.slug}`}
                      >
                        {project.hero_image && (
                          <Image
                            src={project.hero_image}
                            alt={project.title}
                            className="w-12 h-12 rounded-lg object-cover"
                            width={48}
                            height={48}
                            unoptimized={true}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{project.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">{project.short_tagline}</p>
                        </div>
                        <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </motion.div>
          ) : (
            <Card className="bg-muted/30">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Explore the Constellation</h3>
                <p className="text-muted-foreground text-sm">
                  Click on any technology star to discover the projects that showcase that skill and learn more about my expertise.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Chat */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-lg">Ask About My Skills</CardTitle>
              <CardDescription>
                Get instant insights about my technical expertise
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  setContext({ page: 'skills' });
                  setChatOpen(true);
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Start Conversation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Skills Grid (Alternative View) */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-16"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">Technology Arsenal</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredSkills.map((skill, index) => {
            const Icon = getCategoryIcon(skill.category);
            
            return (
              <motion.div
                key={skill.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                className="group cursor-pointer"
                onClick={() => handleSkillClick(skill)}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-purple-500/20 hover:border-purple-500/40">
                  <CardContent className="p-4 text-center">
                    <div 
                      className="w-12 h-12 mx-auto mb-3 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
                      style={{ backgroundColor: skill.color + '20' }}
                    >
                      <Icon className="w-6 h-6" style={{ color: skill.color }} />
                    </div>
                    <h3 className="font-semibold text-sm mb-1">{skill.name}</h3>
                    <div className="text-xs text-muted-foreground">
                      {skill.project_count} project{skill.project_count !== 1 ? 's' : ''}
                    </div>
                    
                    {/* Proficiency Stars */}
                    <div className="flex justify-center gap-1 mt-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < skill.proficiency_level 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}