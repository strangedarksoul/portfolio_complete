'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/lib/store';
import { experimentsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  Code, 
  Gamepad2, 
  Palette, 
  Zap, 
  ExternalLink, 
  MessageSquare,
  Sparkles,
  Beaker,
  Cpu,
  Brain,
  Eye,
  Star
} from 'lucide-react';

interface Experiment {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: {
    name: string;
    slug: string;
    icon: string;
    color: string;
  };
  demo_url?: string;
  code_url?: string;
  tech_stack: string[];
  status: string;
  is_featured: boolean;
  view_count: number;
  hero_image?: string;
}

interface ExperimentCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  experiment_count: number;
}

export default function PlaygroundPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [categories, setCategories] = useState<ExperimentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const { setIsOpen: setChatOpen, setContext } = useChatStore();

  useEffect(() => {
    loadData();
    analytics.pageView('/playground', 'Playground - Experiments');
  }, []);

  const loadData = async () => {
    try {
      const [experimentsResponse, categoriesResponse] = await Promise.all([
        experimentsAPI.getExperiments(),
        experimentsAPI.getCategories(),
      ]);

      setExperiments(experimentsResponse.data.results || []);
      setCategories(categoriesResponse.data.results || []);
    } catch (error) {
      console.error('Failed to load experiments data:', error);
      // Fallback to empty arrays if API fails
      setExperiments([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExperiments = selectedCategory === 'all' 
    ? experiments 
    : experiments.filter(exp => exp.category.slug === selectedCategory);

  const categoryOptions = [
    { value: 'all', label: 'All Experiments', icon: Sparkles },
    ...(categories || []).map(cat => ({
      value: cat.slug,
      label: cat.name,
      icon: getIconComponent(cat.icon),
    })),
  ];

  function getIconComponent(iconName: string) {
    const iconMap: Record<string, any> = {
      brain: Brain,
      gamepad2: Gamepad2,
      palette: Palette,
      beaker: Beaker,
      code: Code,
      sparkles: Sparkles,
    };
    return iconMap[iconName] || Code;
  }

  const getCategoryIcon = (category: any) => {
    return getIconComponent(category.icon);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'beta': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'concept': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'development': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'archived': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleExperimentClick = (experiment: Experiment) => {
    analytics.track('experiment_view', {
      experiment_id: experiment.id,
      experiment_title: experiment.title,
      category: experiment.category.name,
    });
  };

  const handleExperimentLinkClick = async (experiment: Experiment, clickType: 'demo' | 'code', url: string) => {
    try {
      await experimentsAPI.trackClick(experiment.slug, { click_type: clickType });
      analytics.track('experiment_link_click', {
        experiment_id: experiment.id,
        click_type: clickType,
        url,
      });
      window.open(url, '_blank');
    } catch (error) {
      console.error('Failed to track click:', error);
      window.open(url, '_blank');
    }
  };

  const handleChatAboutExperiments = () => {
    setContext({ page: 'playground' });
    setChatOpen(true);
    analytics.track('chat_opened_from_playground');
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
          Digital Laboratory
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Experimental projects, creative demos, and innovative prototypes. Where ideas come to life and boundaries are pushed.
        </p>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="flex justify-center mb-8"
      >
        <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-lg">
          {categoryOptions.map(({ value, label, icon: Icon }) => (
            <Button
              key={value}
              variant={selectedCategory === value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(value)}
              className={selectedCategory === value ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Experiments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {filteredExperiments.map((experiment, index) => {
          const CategoryIcon = getCategoryIcon(experiment.category);
          
          return (
            <motion.div
              key={experiment.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className="group"
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-500 cursor-pointer border-purple-500/20 hover:border-purple-500/40 bg-gradient-to-br from-background to-muted/30">
                {experiment.hero_image && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={experiment.hero_image}
                      alt={experiment.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      width={400}
                      height={225}
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <CategoryIcon className="w-5 h-5 text-white" />
                    </div>
                    <Badge className={getStatusColor(experiment.status)}>
                      {experiment.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge 
                      variant="outline"
                      style={{ borderColor: experiment.category.color, color: experiment.category.color }}
                    >
                      {experiment.category.name}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      {experiment.view_count}
                    </div>
                  </div>
                  
                  <CardTitle className="group-hover:text-purple-400 transition-colors">
                    {experiment.title}
                  </CardTitle>
                  <CardDescription>{experiment.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-1">
                    {experiment.tech_stack.map((tech) => (
                      <Badge key={tech} variant="outline" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {experiment.demo_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          handleExperimentLinkClick(experiment, 'demo', experiment.demo_url!);
                        }}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Demo
                      </Button>
                    )}
                    
                    {experiment.code_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleExperimentLinkClick(experiment, 'code', experiment.code_url!);
                        }}
                      >
                        <Code className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    {experiment.is_featured && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 mb-2">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center py-16"
      >
        <Card className="max-w-2xl mx-auto bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Cpu className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Inspired by these experiments?</CardTitle>
            <CardDescription>
              Let&apos;s discuss how experimental thinking can solve your unique challenges.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={handleChatAboutExperiments}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <MessageSquare className="mr-2 w-5 h-5" />
                Discuss Innovation
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/hire-me'}>
                <Zap className="mr-2 w-5 h-5" />
                Build Something New
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}