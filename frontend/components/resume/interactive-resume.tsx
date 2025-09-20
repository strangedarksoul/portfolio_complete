'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatStore } from '@/lib/store';
import { portalAPI, projectsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { resumeAPI } from '@/lib/api';
import { 
  Download, 
  MessageSquare, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone,
  ExternalLink,
  Award,
  Code,
  Briefcase,
  GraduationCap,
  Star,
  FileText
} from 'lucide-react';

interface ResumeData {
  personal: {
    name: string;
    title: string;
    email: string;
    location: string;
    summary: string;
  };
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
    achievements: string[];
    technologies: string[];
  }>;
  skills: Array<{
    name: string;
    category: string;
    proficiency: number;
    color: string;
  }>;
  projects: Array<{
    title: string;
    description: string;
    technologies: string[];
    metrics: Record<string, any>;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    details?: string;
  }>;
  achievements: Array<{
    title: string;
    description: string;
    date: string;
    category: string;
  }>;
}

export function InteractiveResume() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFormat, setActiveFormat] = useState<'interactive' | 'traditional'>('interactive');
  
  const { setIsOpen: setChatOpen, setContext } = useChatStore();

  useEffect(() => {
    loadResumeData();
  }, []);

  const loadResumeData = async () => {
    try {
      const response = await resumeAPI.getResumeData();
      const data = response.data;
      
      // Map backend data to frontend interface
      const mappedData: ResumeData = {
        personal: data.personal,
        experience: data.experience || [],
        skills: data.skills || [],
        projects: data.projects || [],
        education: data.education || [],
        achievements: data.achievements || [],
      };
      
      setResumeData(mappedData);
    } catch (error) {
      console.error('Failed to load resume data:', error);
      // Fallback to empty structure if API fails
      setResumeData({
        personal: {
          name: "Edzio's Portfolio",
          title: "Full-Stack Developer & AI Enthusiast",
          email: "hello@edzio.dev",
          location: "San Francisco, CA",
          summary: "Full-stack developer with expertise in Django, React, and AI technologies.",
        },
        experience: [],
        skills: [],
        projects: [],
        education: [],
        achievements: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadResume = (format: 'one-page' | 'detailed' | 'technical') => {
    analytics.track('resume_download', { format });
    resumeAPI.downloadResume(format)
      .then((response: any) => {
        // Handle blob response for PDF download
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `edzio_resume_${format}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      })
      .catch((error: any) => {
        console.error('Failed to download resume:', error);
        // Fallback to opening URL
        window.open(`/api/v1/resume/download?format=${format}`, '_blank');
      });
  };

  const handleChatAboutResume = (section?: string) => {
    setContext({ page: 'resume', section });
    setChatOpen(true);
    analytics.track('chat_opened_from_resume', { section });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!resumeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">Resume Not Available</h2>
            <p className="text-muted-foreground">Unable to load resume data at this time.</p>
          </CardContent>
        </Card>
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
          The Script
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          A comprehensive look at the journey, skills, and achievements that define my professional story.
        </p>
      </motion.div>

      {/* Format Toggle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="flex justify-center mb-8"
      >
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <Button
            variant={activeFormat === 'interactive' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveFormat('interactive')}
            className={activeFormat === 'interactive' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
          >
            Interactive View
          </Button>
          <Button
            variant={activeFormat === 'traditional' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveFormat('traditional')}
            className={activeFormat === 'traditional' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
          >
            Traditional Format
          </Button>
        </div>
      </motion.div>

      {/* Download Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="flex justify-center gap-4 mb-12"
      >
        <Button
          variant="outline"
          onClick={() => handleDownloadResume('one-page')}
        >
          <Download className="w-4 h-4 mr-2" />
          One-Page PDF
        </Button>
        <Button
          variant="outline"
          onClick={() => handleDownloadResume('detailed')}
        >
          <Download className="w-4 h-4 mr-2" />
          Detailed PDF
        </Button>
        <Button
          variant="outline"
          onClick={() => handleDownloadResume('technical')}
        >
          <Download className="w-4 h-4 mr-2" />
          Technical PDF
        </Button>
      </motion.div>

      {/* Resume Content */}
      <div className="max-w-4xl mx-auto">
        {activeFormat === 'interactive' ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="skills">Skills</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Personal Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-3xl">{resumeData.personal.name}</CardTitle>
                    <CardDescription className="text-lg">{resumeData.personal.title}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {resumeData.personal.email}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {resumeData.personal.location}
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <p className="leading-relaxed">{resumeData.personal.summary}</p>
                    
                    <Button
                      onClick={() => handleChatAboutResume('overview')}
                      variant="outline"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Ask About My Background
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="experience" className="mt-8">
              <div className="space-y-6">
                {resumeData.experience.map((exp, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-xl">{exp.title}</CardTitle>
                            <CardDescription className="text-lg">{exp.company}</CardDescription>
                          </div>
                          <Badge variant="outline">{exp.duration}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-muted-foreground">{exp.description}</p>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Key Achievements:</h4>
                          <ul className="space-y-1">
                            {exp.achievements.map((achievement, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm">
                                <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
                                {achievement}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">Technologies:</h4>
                          <div className="flex flex-wrap gap-2">
                            {exp.technologies.map((tech) => (
                              <Badge key={tech} variant="outline">{tech}</Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="skills" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {['language', 'framework', 'database', 'cloud', 'tool'].map((category) => {
                  const categorySkills = resumeData.skills.filter(skill => skill.category === category);
                  if (categorySkills.length === 0) return null;

                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg capitalize flex items-center gap-2">
                            <Code className="w-5 h-5" />
                            {category}s
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {categorySkills.map((skill) => (
                            <div key={skill.name} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">{skill.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {skill.proficiency}/5
                                </span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <motion.div
                                  className="h-2 rounded-full"
                                  style={{ backgroundColor: skill.color }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(skill.proficiency / 5) * 100}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                />
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="projects" className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {resumeData.projects.map((project, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle className="text-lg">{project.title}</CardTitle>
                        <CardDescription>{project.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {project.technologies.map((tech) => (
                            <Badge key={tech} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>

                        {Object.keys(project.metrics).length > 0 && (
                          <div className="grid grid-cols-2 gap-2 text-center">
                            {Object.entries(project.metrics).slice(0, 4).map(([key, value]) => (
                              <div key={key} className="p-2 bg-muted/50 rounded">
                                <div className="font-semibold text-sm">{value}</div>
                                <div className="text-xs text-muted-foreground capitalize">
                                  {key.replace(/_/g, ' ')}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="mt-8">
              <div className="space-y-6">
                {resumeData.achievements.map((achievement, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <Award className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold">{achievement.title}</h3>
                              <Badge variant="outline">{achievement.category}</Badge>
                              <span className="text-sm text-muted-foreground">{achievement.date}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{achievement.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          /* Traditional Format */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white text-black p-8 rounded-lg shadow-2xl"
          >
            {/* Traditional resume layout would go here */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">{resumeData.personal.name}</h1>
              <h2 className="text-xl text-gray-600 mb-4">{resumeData.personal.title}</h2>
              <div className="flex justify-center gap-6 text-sm text-gray-600">
                <span>{resumeData.personal.email}</span>
                <span>{resumeData.personal.location}</span>
              </div>
            </div>
            
            <div className="prose prose-gray max-w-none">
              <h3>Professional Summary</h3>
              <p>{resumeData.personal.summary}</p>
              
              <h3>Experience</h3>
              {resumeData.experience.map((exp, index) => (
                <div key={index} className="mb-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{exp.title}</h4>
                      <p className="text-gray-600">{exp.company}</p>
                    </div>
                    <span className="text-sm text-gray-500">{exp.duration}</span>
                  </div>
                  <p className="text-sm mb-2">{exp.description}</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {exp.achievements.map((achievement, i) => (
                      <li key={i}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-16 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Questions about my experience?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            The AI assistant knows every detail of my background and can provide tailored insights for your specific needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => handleChatAboutResume()}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <MessageSquare className="mr-2 w-5 h-5" />
              Ask About My Experience
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/hire-me'}>
              Let's Work Together
            </Button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}