'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/lib/store';
import { portalAPI, achievementsAPI, roadmapAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  Calendar, 
  MapPin, 
  Mail, 
  Github, 
  Linkedin, 
  Twitter,
  MessageSquare,
  Award,
  Target,
  Sparkles
} from 'lucide-react';

interface SiteConfig {
  site_name: string;
  site_tagline: string;
  about_short: string;
  about_medium: string;
  email: string;
  location: string;
  github_url: string;
  linkedin_url: string;
  twitter_url: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  date_achieved: string;
  icon: string;
}

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
}

export function AboutTimeline() {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'story' | 'achievements' | 'roadmap'>('story');

  const { setIsOpen: setChatOpen } = useChatStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const configResponse = await portalAPI.getConfig();
      setSiteConfig(configResponse.data);
      
      const [achievementsResponse, roadmapResponse] = await Promise.all([
        achievementsAPI.getAchievements({ is_featured: true }),
        roadmapAPI.getRoadmapItems({ is_public: true, status: 'building,planning' }),
      ]);

      setAchievements(achievementsResponse.data.results || []);
      setRoadmapItems(roadmapResponse.data.results || []);
    } catch (error) {
      console.error('Failed to load about data:', error);
      // Fallback to empty arrays if API fails
      setAchievements([]);
      setRoadmapItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatAbout = (topic: string) => {
    setChatOpen(true);
    analytics.track('chat_opened_from_about', { topic });
  };

  const socialLinks = [
    { icon: Github, url: siteConfig?.github_url, label: 'GitHub' },
    { icon: Linkedin, url: siteConfig?.linkedin_url, label: 'LinkedIn' },
    { icon: Twitter, url: siteConfig?.twitter_url, label: 'Twitter' },
  ].filter(link => link.url);

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
          The Storyline
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {siteConfig?.site_tagline}
        </p>
      </motion.div>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="flex justify-center mb-12"
      >
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          {[
            { key: 'story', label: 'Story', icon: MessageSquare },
            { key: 'achievements', label: 'Achievements', icon: Award },
            { key: 'roadmap', label: 'Roadmap', icon: Target },
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={activeSection === key ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection(key as any)}
              className={activeSection === key ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
            >
              <Icon className="w-4 h-4 mr-2" />
              {label}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Content Sections */}
      {activeSection === 'story' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Story */}
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">The Journey</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none">
                  <p className="text-lg leading-relaxed">
                    {siteConfig?.about_medium}
                  </p>
                  
                  <Button
                    onClick={() => handleChatAbout('background')}
                    variant="outline"
                    className="mt-6"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask about my background
                  </Button>
                </CardContent>
              </Card>

              {/* Interactive Elements */}
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    Easter Egg Unlocked!
                  </CardTitle>
                  <CardDescription>
                    You found a hidden story element. There are more scattered throughout the portfolio.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    &quot;The best code is written not just with logic, but with empathy for the humans who will use it.&quot;
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Get in Touch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-purple-400" />
                    <a href={`mailto:${siteConfig?.email}`} className="hover:text-purple-400 transition-colors">
                      {siteConfig?.email}
                    </a>
                  </div>
                  
                  {siteConfig?.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      <span>{siteConfig.location}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    {socialLinks.map(({ icon: Icon, url, label }) => (
                      <Button
                        key={label}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          window.open(url ?? '', '_blank');
                          analytics.linkClick('social', url ?? '', label.toLowerCase());
                        }}
                      >
                        <Icon className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Chat */}
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-lg">Ask Me Anything</CardTitle>
                  <CardDescription>
                    Get instant answers about my experience, skills, or projects
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleChatAbout('general')}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Start Conversation
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      )}

      {activeSection === 'achievements' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                        <Award className="w-5 h-5 text-white" />
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {achievement.category}
                      </Badge>
                    </div>
                    <CardTitle>{achievement.title}</CardTitle>
                    <CardDescription>
                      {new Date(achievement.date_achieved).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {achievement.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {activeSection === 'roadmap' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="space-y-6">
            {roadmapItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{item.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge 
                          variant="outline"
                          className={
                            item.status === 'building' ? 'border-green-500 text-green-400' :
                            item.status === 'planning' ? 'border-yellow-500 text-yellow-400' :
                            'border-gray-500 text-gray-400'
                          }
                        >
                          {item.status}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={
                            item.priority === 'high' ? 'border-red-500 text-red-400' :
                            item.priority === 'medium' ? 'border-yellow-500 text-yellow-400' :
                            'border-gray-500 text-gray-400'
                          }
                        >
                          {item.priority} priority
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}