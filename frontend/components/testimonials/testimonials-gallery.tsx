'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChatStore, useAuthStore } from '@/lib/store';
import { testimonialsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  Star, 
  Quote, 
  MessageSquare, 
  Building, 
  User,
  ExternalLink,
  Heart
} from 'lucide-react';

interface Testimonial {
  id: string;
  author_name: string;
  author_role: string;
  author_company: string;
  author_image?: string;
  content: string;
  rating: number;
  project_title?: string;
  created_at: string;
}

export function TestimonialsGallery() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { setIsOpen: setChatOpen, setContext } = useChatStore();
  const { user } = useAuthStore();

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const response = await testimonialsAPI.getTestimonials();
      setTestimonials(response.data.results || []);
    } catch (error) {
      console.error('Failed to load testimonials:', error);
      // Fallback to empty array if API fails
      setTestimonials([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatAboutTestimonials = () => {
    setContext({ page: 'testimonials' });
    setChatOpen(true);
    analytics.track('chat_opened_from_testimonials');
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
          Hall of Fame
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Voices from the journey - clients, collaborators, and colleagues sharing their experiences working together.
        </p>
      </motion.div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        {testimonials.map((testimonial, index) => (
          <motion.div
            key={testimonial.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.8 }}
            className="group"
          >
            <Card className="h-full hover:shadow-2xl transition-all duration-500 border-purple-500/20 hover:border-purple-500/40 bg-gradient-to-br from-background to-muted/30">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={testimonial.author_image} alt={testimonial.author_name} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      {testimonial.author_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{testimonial.author_name}</h3>
                    <p className="text-sm text-muted-foreground">{testimonial.author_role}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Building className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{testimonial.author_company}</span>
                    </div>
                  </div>
                </div>

                {/* Rating Stars */}
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < testimonial.rating 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>

                {testimonial.project_title && (
                  <Badge variant="outline" className="mb-3">
                    Project: {testimonial.project_title}
                  </Badge>
                )}
              </CardHeader>

              <CardContent>
                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 w-8 h-8 text-purple-400/30" />
                  <blockquote className="text-sm leading-relaxed pl-6">
                    {testimonial.content}
                  </blockquote>
                </div>

                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  {new Date(testimonial.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Submit Testimonial Section for Authenticated Users */}
      {user && (
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="py-16"
        >
          <Card className="max-w-2xl mx-auto bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Share Your Experience</CardTitle>
              <CardDescription>
                Worked with Edzio? Share your experience to help others understand the collaboration process.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => window.location.href = '/testimonials/submit'}
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                <Star className="mr-2 w-5 h-5" />
                Submit Testimonial
              </Button>
            </CardContent>
          </Card>
        </motion.section>
      )}

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
              <Heart className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Ready to create your success story?</CardTitle>
            <CardDescription>
              Join the growing list of satisfied clients and collaborators
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={handleChatAboutTestimonials}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <MessageSquare className="mr-2 w-5 h-5" />
                Ask About Client Work
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/hire-me'}>
                Start Your Project
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
}