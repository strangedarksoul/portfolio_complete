'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { gigsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { fileUploadAPI } from '@/lib/api';
import { 
  User, 
  Mail, 
  Building, 
  Phone, 
  DollarSign, 
  Clock, 
  MessageSquare,
  Upload,
  Calendar,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  FileText,
  X
} from 'lucide-react';

const hireFormSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  company: z.string().optional(),
  phone: z.string().optional(),
  selected_gig: z.string().optional(),
  project_title: z.string().min(5, 'Project title is required'),
  message: z.string().min(20, 'Please provide more details about your project'),
  proposed_budget: z.string().min(1, 'Budget range is required'),
  budget_details: z.string().optional(),
  timeline: z.string().min(1, 'Timeline is required'),
  timeline_details: z.string().optional(),
  preferred_communication: z.array(z.string()).optional(),
  meeting_requested: z.boolean().optional(),
  meeting_availability: z.string().optional(),
  terms_accepted: z.boolean().refine(val => val === true, 'You must accept the terms'),
  privacy_accepted: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
});

interface SmartHireFormProps {
  preselectedGig?: string;
}

interface Gig {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  price_display: string;
  delivery_display: string;
}

export function SmartHireForm({ preselectedGig }: SmartHireFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [selectedGigData, setSelectedGigData] = useState<Gig | null>(null);
  const [proposalPreview, setProposalPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: number; url: string }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  const form = useForm<z.infer<typeof hireFormSchema>>({
    resolver: zodResolver(hireFormSchema),
    defaultValues: {
      selected_gig: preselectedGig || '',
      preferred_communication: [],
      meeting_requested: false,
      terms_accepted: false,
      privacy_accepted: false,
    },
  });

  const watchedValues = form.watch();

  useEffect(() => {
    loadGigs();
    analytics.track('hire_form_start', { preselected_gig: preselectedGig });
  }, []);

  useEffect(() => {
    if (watchedValues.selected_gig) {
      const gig = gigs.find(g => g.id === watchedValues.selected_gig);
      setSelectedGigData(gig || null);
    }
  }, [watchedValues.selected_gig, gigs]);

  const loadGigs = async () => {
    try {
      const response = await gigsAPI.getGigs();
      setGigs(response.data.results || []);
      
      if (preselectedGig) {
        const selectedGig = response.data.results?.find((g: Gig) => g.slug === preselectedGig);
        if (selectedGig) {
          form.setValue('selected_gig', selectedGig.id);
        }
      }
    } catch (error) {
      console.error('Failed to load gigs:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      analytics.track('hire_form_step', { step: currentStep + 1 });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    
    try {
      // Include uploaded files in submission
      const submissionData = {
        ...data,
        uploaded_files: uploadedFiles
      };
      
      const response = await gigsAPI.submitHireRequest(submissionData);
      setSubmissionId(response.data.id);
      setProposalPreview(response.data.proposal_preview || '');
      setIsSubmitted(true);
      
      analytics.track('hire_form_submit', {
        gig_id: data.selected_gig,
        budget: data.proposed_budget,
        timeline: data.timeline,
        has_meeting_request: data.meeting_requested,
        files_uploaded: uploadedFiles.length,
      });
    } catch (error: any) {
      console.error('Failed to submit hire request:', error);
      // Handle error - could show error message
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'hire-request');
        
        const response = await fileUploadAPI.uploadFile(formData);
        return {
          name: file.name,
          size: file.size,
          url: response.data.file.url,
          path: response.data.file.path,
          type: file.type
        };
      });

      const uploadResults = await Promise.all(uploadPromises);
      setUploadedFiles(prev => [...prev, ...uploadResults]);
      
      analytics.track('hire_form_files_uploaded', {
        file_count: files.length,
        total_size: Array.from(files).reduce((sum, file) => sum + file.size, 0)
      });
    } catch (error) {
      console.error('Failed to upload files:', error);
      setMessage({ 
        type: 'error', 
        text: 'Failed to upload files. Please try again.' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const budgetOptions = [
    { value: 'under_1k', label: 'Under $1,000' },
    { value: '1k_5k', label: '$1,000 - $5,000' },
    { value: '5k_10k', label: '$5,000 - $10,000' },
    { value: '10k_25k', label: '$10,000 - $25,000' },
    { value: '25k_50k', label: '$25,000 - $50,000' },
    { value: 'over_50k', label: 'Over $50,000' },
    { value: 'negotiable', label: 'Let\'s discuss' },
  ];

  const timelineOptions = [
    { value: 'asap', label: 'ASAP' },
    { value: '1_week', label: '1 Week' },
    { value: '2_weeks', label: '2 Weeks' },
    { value: '1_month', label: '1 Month' },
    { value: '2_months', label: '2 Months' },
    { value: '3_months', label: '3 Months' },
    { value: '6_months', label: '6+ Months' },
    { value: 'flexible', label: 'Flexible' },
  ];

  const communicationOptions = [
    'Email', 'Slack', 'Discord', 'Zoom', 'Phone', 'In-person'
  ];

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-2xl mx-auto text-center"
      >
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardHeader>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Request Submitted Successfully!</CardTitle>
            <CardDescription>
              Thank you for your interest. I'll review your request and get back to you within 24 hours.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-left">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI-Generated Proposal Preview
              </h3>
              {proposalPreview ? (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="prose prose-sm max-w-none">
                    {proposalPreview.split('\n').map((line, index) => (
                      <p key={index} className="mb-2">{line}</p>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">
                  A detailed proposal preview is being generated and will be sent to your email shortly.
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-semibold">What happens next?</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  I'll review your request and requirements
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  You'll receive a detailed proposal within 24 hours
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  We'll schedule a call to discuss details
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  Project kickoff and timeline confirmation
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => window.location.href = '/'} variant="outline">
                Return Home
              </Button>
              <Button onClick={() => window.location.href = '/projects'}>
                View Projects
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Let's Build Something Amazing</h1>
          <Badge variant="outline">Step {currentStep} of {totalSteps}</Badge>
        </div>
        <Progress value={progress} className="h-2" />
      </motion.div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {/* Step 1: Service Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>What can I help you build?</CardTitle>
                  <CardDescription>
                    Select a service package or choose custom development
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        !watchedValues.selected_gig ? 'border-purple-500 bg-purple-500/10' : 'border-border hover:border-purple-500/50'
                      }`}
                      onClick={() => form.setValue('selected_gig', '')}
                    >
                      <h3 className="font-semibold mb-2">Custom Development</h3>
                      <p className="text-sm text-muted-foreground">
                        Tailored solution designed specifically for your needs
                      </p>
                    </div>
                    
                    {gigs.map((gig) => (
                      <div
                        key={gig.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          watchedValues.selected_gig === gig.id ? 'border-purple-500 bg-purple-500/10' : 'border-border hover:border-purple-500/50'
                        }`}
                        onClick={() => form.setValue('selected_gig', gig.id)}
                      >
                        <h3 className="font-semibold mb-2">{gig.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {gig.short_description}
                        </p>
                        <div className="flex justify-between text-xs">
                          <span className="text-green-400">{gig.price_display}</span>
                          <span className="text-blue-400">{gig.delivery_display}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={nextStep}>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Contact Information */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Let's get to know you</CardTitle>
                  <CardDescription>
                    Your contact information helps me tailor the perfect solution
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="name"
                          {...form.register('name')}
                          placeholder="Your full name"
                          className="pl-10"
                        />
                      </div>
                      {form.formState.errors.name && (
                        <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          {...form.register('email')}
                          placeholder="your@email.com"
                          className="pl-10"
                        />
                      </div>
                      {form.formState.errors.email && (
                        <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <div className="relative">
                        <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="company"
                          {...form.register('company')}
                          placeholder="Your company (optional)"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          {...form.register('phone')}
                          placeholder="Your phone (optional)"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button type="button" onClick={nextStep}>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Project Details */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Tell me about your project</CardTitle>
                  <CardDescription>
                    The more details you provide, the better I can help you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="project_title">Project Title *</Label>
                    <Input
                      id="project_title"
                      {...form.register('project_title')}
                      placeholder="What's your project called?"
                    />
                    {form.formState.errors.project_title && (
                      <p className="text-red-500 text-sm">{form.formState.errors.project_title.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Project Description *</Label>
                    <Textarea
                      id="message"
                      {...form.register('message')}
                      placeholder="Describe your project, goals, target audience, key features, and any specific requirements..."
                      rows={6}
                    />
                    {form.formState.errors.message && (
                      <p className="text-red-500 text-sm">{form.formState.errors.message.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="proposed_budget">Budget Range *</Label>
                      <Select onValueChange={(value) => form.setValue('proposed_budget', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          {budgetOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.proposed_budget && (
                        <p className="text-red-500 text-sm">{form.formState.errors.proposed_budget.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeline">Timeline *</Label>
                      <Select onValueChange={(value) => form.setValue('timeline', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timeline" />
                        </SelectTrigger>
                        <SelectContent>
                          {timelineOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {form.formState.errors.timeline && (
                        <p className="text-red-500 text-sm">{form.formState.errors.timeline.message}</p>
                      )}
                    </div>
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-4">
                    <Label>Project Files (Optional)</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.zip"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                        disabled={isUploading}
                      />
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {isUploading ? 'Uploading...' : 'Click to upload files or drag and drop'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, images, or ZIP files (max 10MB each)
                        </p>
                      </label>
                    </div>

                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <Label>Uploaded Files</Label>
                        {uploadedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button type="button" onClick={nextStep}>
                      Continue
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Communication & Confirmation */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Communication & Final Details</CardTitle>
                  <CardDescription>
                    How would you like to collaborate?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Preferred Communication Methods</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {communicationOptions.map((method) => (
                        <div key={method} className="flex items-center space-x-2">
                          <Checkbox
                            id={method}
                            onCheckedChange={(checked) => {
                              const current = form.getValues('preferred_communication') || [];
                              if (checked) {
                                form.setValue('preferred_communication', [...current, method]);
                              } else {
                                form.setValue('preferred_communication', current.filter(m => m !== method));
                              }
                            }}
                          />
                          <Label htmlFor={method} className="text-sm">{method}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="meeting_requested"
                        {...form.register('meeting_requested')}
                      />
                      <Label htmlFor="meeting_requested">I'd like to schedule a call</Label>
                    </div>

                    {watchedValues.meeting_requested && (
                      <div className="space-y-2">
                        <Label htmlFor="meeting_availability">When are you available?</Label>
                        <Textarea
                          id="meeting_availability"
                          {...form.register('meeting_availability')}
                          placeholder="Let me know your preferred times, timezone, and any scheduling constraints..."
                          rows={3}
                        />
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Terms and Privacy */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="terms_accepted"
                        checked={form.watch('terms_accepted')}
                        onCheckedChange={(checked) => form.setValue('terms_accepted', !!checked)}
                      />
                      <Label htmlFor="terms_accepted" className="text-sm">
                        I accept the <a href="/terms" className="underline hover:text-purple-400">Terms of Service</a>
                      </Label>
                    </div>
                    {form.formState.errors.terms_accepted && (
                      <p className="text-red-500 text-sm">{form.formState.errors.terms_accepted.message}</p>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="privacy_accepted"
                        checked={form.watch('privacy_accepted')}
                        onCheckedChange={(checked) => form.setValue('privacy_accepted', !!checked)}
                      />
                      <Label htmlFor="privacy_accepted" className="text-sm">
                        I accept the <a href="/privacy" className="underline hover:text-purple-400">Privacy Policy</a>
                      </Label>
                    </div>
                    {form.formState.errors.privacy_accepted && (
                      <p className="text-red-500 text-sm">{form.formState.errors.privacy_accepted.message}</p>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Request'}
                      <Sparkles className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Selected Gig Preview */}
      {selectedGigData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8"
        >
          <Card className="bg-muted/30">
            <CardHeader>
              <CardTitle className="text-lg">Selected Service</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedGigData.title}</h3>
                  <p className="text-sm text-muted-foreground">{selectedGigData.short_description}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-purple-400">{selectedGigData.price_display}</div>
                  <div className="text-sm text-muted-foreground">{selectedGigData.delivery_display}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}