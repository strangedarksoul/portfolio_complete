'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useChatStore } from '@/lib/store';
import { projectsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  ArrowLeft, 
  Clock, 
  MessageSquare, 
  FileText, 
  Target, 
  Lightbulb,
  TrendingUp,
  Users,
  Calendar,
  ExternalLink,
  Download
} from 'lucide-react';

interface CaseStudyDetailProps {
  id: string;
}

interface CaseStudy {
  id: string;
  project: {
    id: string;
    title: string;
    slug: string;
    short_tagline: string;
    hero_image?: string;
    skills: Array<{ name: string; color: string }>;
  };
  problem_statement: string;
  constraints?: string;
  approach: string;
  architecture_description?: string;
  implementation_notes?: string;
  challenges?: string;
  results: string;
  lessons_learned?: string;
  architecture_images: string[];
  before_after_images: string[];
  timeline_data: Array<{
    phase: string;
    duration: string;
    description: string;
    milestones: string[];
  }>;
  attachments: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  success_metrics: Record<string, any>;
  reading_time: number;
  created_at: string;
  updated_at: string;
}

export function CaseStudyDetail({ id }: CaseStudyDetailProps) {
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  
  const { setIsOpen: setChatOpen, setContext } = useChatStore();

  useEffect(() => {
    loadCaseStudy();
    
    // Track reading progress
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [id]);

  const loadCaseStudy = async () => {
    try {
      const response = await projectsAPI.getCaseStudy(parseInt(id));
      setCaseStudy(response.data);
      
      analytics.track('casestudy_view', {
        casestudy_id: id,
        project_id: response.data.project.id,
        project_title: response.data.project.title,
      });
    } catch (error) {
      console.error('Failed to load case study:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatAboutCaseStudy = () => {
    if (caseStudy) {
      setContext({ 
        case_study_id: caseStudy.id, 
        project_id: caseStudy.project.id,
        project_title: caseStudy.project.title 
      });
      setChatOpen(true);
      analytics.track('chat_opened_from_casestudy', { casestudy_id: caseStudy.id });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!caseStudy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Case Study Not Found</h1>
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
      {/* Reading Progress */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Progress value={readingProgress} className="h-1 rounded-none" />
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {caseStudy.project.hero_image && (
          <div className="absolute inset-0 z-0">
            <Image
              src={caseStudy.project.hero_image}
              alt={caseStudy.project.title}
              className="w-full h-full object-cover"
              width={1200}
              height={600}
              unoptimized={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/30" />
          </div>
        )}
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href={`/projects/${caseStudy.project.slug}`}>
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to {caseStudy.project.title}
              </Button>
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                <FileText className="w-3 h-3 mr-1" />
                Director's Cut
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                {caseStudy.reading_time} min read
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {caseStudy.project.title}
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              {caseStudy.project.short_tagline}
            </p>

            <div className="flex flex-wrap gap-2 mb-8">
              {caseStudy.project.skills.map((skill) => (
                <Badge 
                  key={skill.name} 
                  variant="outline"
                  style={{ borderColor: skill.color, color: skill.color }}
                >
                  {skill.name}
                </Badge>
              ))}
            </div>

            <Button
              onClick={handleChatAboutCaseStudy}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Discuss This Case Study
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Case Study Content */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl space-y-16">
          {/* Problem Statement */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Target className="w-6 h-6 text-red-400" />
                  The Challenge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: caseStudy.problem_statement }}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Constraints */}
          {caseStudy.constraints && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Users className="w-6 h-6 text-yellow-400" />
                    Constraints & Limitations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: caseStudy.constraints }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Approach */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Lightbulb className="w-6 h-6 text-blue-400" />
                  The Solution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: caseStudy.approach }}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Architecture Images */}
          {caseStudy.architecture_images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">System Architecture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {caseStudy.architecture_images.map((image, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="aspect-video overflow-hidden rounded-lg cursor-pointer"
                        onClick={() => window.open(image, '_blank')}
                      >
                        <Image
                          src={image}
                          alt={`Architecture diagram ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          width={400}
                          height={225}
                          unoptimized={true}
                        />
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Timeline */}
          {caseStudy.timeline_data.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-purple-400" />
                    Project Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {caseStudy.timeline_data.map((phase, index) => (
                      <div key={index} className="relative">
                        {index < caseStudy.timeline_data.length - 1 && (
                          <div className="absolute left-6 top-12 w-0.5 h-16 bg-gradient-to-b from-purple-500 to-pink-500" />
                        )}
                        
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{phase.phase}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{phase.duration}</p>
                            <p className="text-sm mb-3">{phase.description}</p>
                            
                            {phase.milestones.length > 0 && (
                              <div className="space-y-1">
                                {phase.milestones.map((milestone, mIndex) => (
                                  <div key={mIndex} className="flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 bg-purple-400 rounded-full" />
                                    {milestone}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  Results & Impact
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-invert max-w-none mb-6"
                  dangerouslySetInnerHTML={{ __html: caseStudy.results }}
                />

                {/* Success Metrics */}
                {Object.keys(caseStudy.success_metrics).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {Object.entries(caseStudy.success_metrics).map(([key, value]) => (
                      <div key={key} className="text-center p-4 bg-background/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">{value}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Before/After Images */}
          {caseStudy.before_after_images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Before & After</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {caseStudy.before_after_images.map((image, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="aspect-video overflow-hidden rounded-lg cursor-pointer"
                        onClick={() => window.open(image, '_blank')}
                      >
                        <Image
                          src={image}
                          alt={`Before/After ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          width={400}
                          height={225}
                          unoptimized={true}
                        />
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Lessons Learned */}
          {caseStudy.lessons_learned && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-3">
                    <Lightbulb className="w-6 h-6 text-purple-400" />
                    Lessons Learned
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: caseStudy.lessons_learned }}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Attachments */}
          {caseStudy.attachments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Additional Resources</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {caseStudy.attachments.map((attachment, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                <Download className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium">{attachment.name}</h4>
                                <p className="text-sm text-muted-foreground capitalize">{attachment.type}</p>
                              </div>
                              <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center py-12"
          >
            <h2 className="text-3xl font-bold mb-4">Inspired by this case study?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Let&apos;s discuss how I can bring similar innovation to your project.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={handleChatAboutCaseStudy}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <MessageSquare className="mr-2 w-5 h-5" />
                Discuss This Project
              </Button>
              <Link href="/hire-me">
                <Button variant="outline">
                  Start Similar Project
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}