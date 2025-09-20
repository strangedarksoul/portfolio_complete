'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/lib/store';
import { testimonialsAPI, projectsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { Star, Send, CheckCircle, AlertCircle } from 'lucide-react';

const testimonialSchema = z.object({
  author_name: z.string().min(2, 'Name is required'),
  author_role: z.string().min(2, 'Role is required'),
  author_company: z.string().optional(),
  content: z.string().min(20, 'Please provide more detailed feedback'),
  rating: z.number().min(1).max(5),
  project: z.string().optional(),
});

interface Project {
  id: string;
  title: string;
  slug: string;
}

export function TestimonialSubmissionForm() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const { user, isAuthenticated } = useAuthStore();

  const form = useForm({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      author_name: user?.full_name || '',
      author_role: '',
      author_company: '',
      content: '',
      rating: 5,
      project: '',
    },
  });

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectsAPI.getProjects();
      setProjects(response.data.results || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      await testimonialsAPI.submitTestimonial(data);
      setIsSubmitted(true);
      
      analytics.track('testimonial_submitted', {
        rating: data.rating,
        has_project: !!data.project,
        content_length: data.content.length,
      });

      setMessage({
        type: 'success',
        text: 'Thank you for your testimonial! It will be reviewed and published soon.',
      });
    } catch (error: any) {
      console.error('Failed to submit testimonial:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to submit testimonial. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Login Required</h3>
          <p className="text-muted-foreground mb-4">
            Please log in to submit a testimonial.
          </p>
          <Button onClick={() => window.location.href = '/auth/login'}>
            Login to Continue
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-md mx-auto"
      >
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold mb-2">Testimonial Submitted!</h3>
            <p className="text-muted-foreground mb-6">
              Thank you for taking the time to share your experience. Your testimonial will be reviewed and published soon.
            </p>
            <Button onClick={() => window.location.href = '/testimonials'}>
              View All Testimonials
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-2xl mx-auto"
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Share Your Experience</CardTitle>
          <CardDescription>
            Your feedback helps others understand the quality of work and collaboration experience.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author_name">Your Name</Label>
                <Input
                  id="author_name"
                  {...form.register('author_name')}
                  placeholder="Full name"
                />
                {form.formState.errors.author_name && (
                  <p className="text-red-500 text-sm">{form.formState.errors.author_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="author_role">Your Role</Label>
                <Input
                  id="author_role"
                  {...form.register('author_role')}
                  placeholder="e.g., Product Manager, CTO"
                />
                {form.formState.errors.author_role && (
                  <p className="text-red-500 text-sm">{form.formState.errors.author_role.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="author_company">Company (Optional)</Label>
              <Input
                id="author_company"
                {...form.register('author_company')}
                placeholder="Your company or organization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project">Related Project (Optional)</Label>
              <Select onValueChange={(value) => form.setValue('project', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project if applicable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No specific project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`p-2 ${form.watch('rating') >= rating ? 'text-yellow-400' : 'text-muted-foreground'}`}
                    onClick={() => form.setValue('rating', rating)}
                  >
                    <Star className={`w-6 h-6 ${form.watch('rating') >= rating ? 'fill-current' : ''}`} />
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Your Testimonial</Label>
              <Textarea
                id="content"
                {...form.register('content')}
                placeholder="Share your experience working with Edzio. What was the project about? How was the collaboration? What were the results?"
                rows={6}
              />
              {form.formState.errors.content && (
                <p className="text-red-500 text-sm">{form.formState.errors.content.message}</p>
              )}
            </div>

            {message && (
              <Alert className={message.type === 'error' ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'}>
                {message.type === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                )}
                <AlertDescription className={message.type === 'error' ? 'text-red-200' : 'text-green-200'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Send className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Submitting...' : 'Submit Testimonial'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}