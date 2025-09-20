'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatStore } from '@/lib/store';
import { achievementsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  Award, 
  Calendar, 
  ExternalLink, 
  MessageSquare,
  Trophy,
  GraduationCap,
  Building,
  Users,
  Code,
  Star,
  Target
} from 'lucide-react';

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  date_achieved: string;
  icon: string;
  image?: string;
  url?: string;
  order: number;
}

export function AchievementsGallery() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const { setIsOpen: setChatOpen, setContext } = useChatStore();

  useEffect(() => {
    loadAchievements();
  }, []);

  useEffect(() => {
    filterAchievements();
  }, [achievements, selectedCategory]);

  const filterAchievements = () => {
    let filtered = achievements;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(achievement => achievement.category === selectedCategory);
    }

    setFilteredAchievements(filtered);
  };

  const loadAchievements = async () => {
    try {
      const response = await achievementsAPI.getAchievements();
      setAchievements(response.data.results || []);
    } catch (error) {
      console.error('Failed to load achievements:', error);
      setAchievements([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatAboutAchievements = () => {
    setContext({ page: 'achievements' });
    setChatOpen(true);
    analytics.track('chat_opened_from_achievements');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'technical': return Code;
      case 'business': return Building;
      case 'personal': return Star;
      case 'education': return GraduationCap;
      case 'community': return Users;
      default: return Award;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical': return 'from-blue-500 to-cyan-500';
      case 'business': return 'from-green-500 to-emerald-500';
      case 'personal': return 'from-purple-500 to-pink-500';
      case 'education': return 'from-yellow-500 to-orange-500';
      case 'community': return 'from-red-500 to-rose-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const categories = [
    { value: 'all', label: 'All Achievements' },
    { value: 'technical', label: 'Technical' },
    { value: 'business', label: 'Business' },
    { value: 'education', label: 'Education' },
    { value: 'community', label: 'Community' },
    { value: 'personal', label: 'Personal' },
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
          Hall of Achievements
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Professional milestones, certifications, and accomplishments that mark the journey of continuous growth.
        </p>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="mb-8"
      >
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <div className="flex flex-col items-center gap-4">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full max-w-4xl">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category.value);
                return (
                  <TabsTrigger 
                    key={category.value} 
                    value={category.value}
                    className="flex items-center gap-2 text-xs md:text-sm"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{category.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            <div className="text-sm text-muted-foreground">
              Showing {filteredAchievements.length} of {achievements.length} achievements
            </div>
          </div>
        </Tabs>
      </motion.div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredAchievements.map((achievement, index) => {
          const CategoryIcon = getCategoryIcon(achievement.category);
          const gradientClass = getCategoryColor(achievement.category);
          
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className="group"
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-500 border-purple-500/20 hover:border-purple-500/40 overflow-hidden">
                {achievement.image && (
                  <div className="aspect-video overflow-hidden">
                    <Image
                      src={achievement.image}
                      alt={achievement.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      width={400}
                      height={225}
                      unoptimized={true}
                    />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${gradientClass} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <CategoryIcon className="w-6 h-6 text-white" />
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {achievement.category}
                    </Badge>
                  </div>
                  
                  <CardTitle className="group-hover:text-purple-400 transition-colors">
                    {achievement.title}
                  </CardTitle>
                  
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(achievement.date_achieved).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {achievement.description}
                  </p>

                  {achievement.url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        window.open(achievement.url ?? '', '_blank');
                        analytics.linkClick('achievement_link', achievement.url ?? '');
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Certificate
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Trophy className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No achievements found</h3>
          <p className="text-muted-foreground mb-6">
            Try selecting a different category
          </p>
          <Button
            onClick={() => setSelectedCategory('all')}
            variant="outline"
          >
            View All Achievements
          </Button>
        </motion.div>
      )}

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="py-20 text-center"
      >
        <Card className="max-w-2xl mx-auto bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <Target className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Inspired by these achievements?</CardTitle>
            <CardDescription>
              Let&apos;s discuss how this experience can benefit your project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={handleChatAboutAchievements}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <MessageSquare className="mr-2 w-5 h-5" />
                Ask About Experience
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/hire-me'}>
                <Trophy className="mr-2 w-5 h-5" />
                Start Your Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}