'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useChatStore } from '@/lib/store';
import { roadmapAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  Target, 
  Calendar, 
  MessageSquare,
  Lightbulb,
  Wrench,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Rocket,
  Eye
} from 'lucide-react';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  estimated_completion?: string;
  completion_date?: string;
  order: number;
  created_at: string;
}

export function RoadmapTimeline() {
  const [roadmapItems, setRoadmapItems] = useState<RoadmapItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<RoadmapItem[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const { setIsOpen: setChatOpen, setContext } = useChatStore();

  useEffect(() => {
    loadRoadmapItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [roadmapItems, selectedStatus, selectedPriority]);

  const filterItems = () => {
    let filtered = roadmapItems;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    if (selectedPriority !== 'all') {
      filtered = filtered.filter(item => item.priority === selectedPriority);
    }

    setFilteredItems(filtered);
  };

  const loadRoadmapItems = async () => {
    try {
      const response = await roadmapAPI.getRoadmapItems({ is_public: true });
      setRoadmapItems(response.data.results || []);
    } catch (error) {
      console.error('Failed to load roadmap items:', error);
      setRoadmapItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatAboutRoadmap = () => {
    setContext({ page: 'roadmap' });
    setChatOpen(true);
    analytics.track('chat_opened_from_roadmap');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idea': return Lightbulb;
      case 'planning': return Target;
      case 'building': return Wrench;
      case 'testing': return Eye;
      case 'done': return CheckCircle;
      case 'cancelled': return AlertCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idea': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'planning': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'building': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'testing': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'done': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'idea', label: 'Ideas' },
    { value: 'planning', label: 'Planning' },
    { value: 'building', label: 'Building' },
    { value: 'testing', label: 'Testing' },
    { value: 'done', label: 'Completed' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
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
          Future Horizons
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Future plans, upcoming features, and the vision for what&apos;s coming next in the digital journey.
        </p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="mb-8"
      >
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full">
          <div className="flex flex-col items-center gap-4">
            <TabsList className="grid grid-cols-3 md:grid-cols-6 w-full max-w-4xl">
              {statusOptions.map((option) => {
                const Icon = getStatusIcon(option.value === 'all' ? 'idea' : option.value);
                return (
                  <TabsTrigger 
                    key={option.value} 
                    value={option.value}
                    className="flex items-center gap-2 text-xs md:text-sm"
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{option.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            <div className="flex items-center gap-4">
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="text-sm text-muted-foreground">
                Showing {filteredItems.length} of {roadmapItems.length} items
              </div>
            </div>
          </div>
        </Tabs>
      </motion.div>

      {/* Roadmap Timeline */}
      <div className="max-w-4xl mx-auto">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 to-pink-500" />
          
          <div className="space-y-8">
            {filteredItems.map((item, index) => {
              const StatusIcon = getStatusIcon(item.status);
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                  className="relative"
                >
                  {/* Timeline Node */}
                  <div className="absolute left-6 w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-4 border-background" />
                  
                  <div className="ml-16">
                    <Card className="hover:shadow-lg transition-all duration-300 border-purple-500/20 hover:border-purple-500/40">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                                <StatusIcon className="w-4 h-4 text-white" />
                              </div>
                              <Badge className={getStatusColor(item.status)}>
                                {item.status}
                              </Badge>
                              <Badge className={getPriorityColor(item.priority)}>
                                {item.priority} priority
                              </Badge>
                            </div>
                            <CardTitle className="text-xl">{item.title}</CardTitle>
                            {item.estimated_completion && (
                              <CardDescription className="flex items-center gap-2 mt-2">
                                <Calendar className="w-4 h-4" />
                                Target: {new Date(item.estimated_completion).toLocaleDateString()}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div 
                          className="prose prose-invert prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: item.description }}
                        />
                        
                        {item.completion_date && (
                          <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                            <div className="flex items-center gap-2 text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Completed on {new Date(item.completion_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Rocket className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No roadmap items found</h3>
          <p className="text-muted-foreground mb-6">
            Try adjusting your filter criteria
          </p>
          <Button
            onClick={() => {
              setSelectedStatus('all');
              setSelectedPriority('all');
            }}
            variant="outline"
          >
            Clear Filters
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
              <Zap className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Want to influence the roadmap?</CardTitle>
            <CardDescription>
              Share your ideas and help shape the future of these projects
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={handleChatAboutRoadmap}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <MessageSquare className="mr-2 w-5 h-5" />
                Discuss Ideas
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/hire-me'}>
                <Target className="mr-2 w-5 h-5" />
                Collaborate
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}