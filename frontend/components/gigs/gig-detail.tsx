'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatStore } from '@/lib/store';
import { gigsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  ArrowLeft, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  X,
  ExternalLink,
  MessageSquare,
  Briefcase,
  Star,
  Code,
  Plus,
  Minus,
  Eye,
  Users,
  Calendar,
  Award,
  Zap
} from 'lucide-react';

interface GigDetailProps {
  slug: string;
}

interface GigDetail {
  id: string;
  title: string;
  slug: string;
  category: {
    name: string;
    icon: string;
    color: string;
  };
  short_description: string;
  long_description: string;
  price_min: number;
  price_max?: number;
  price_display: string;
  price_type: string;
  delivery_time_min: number;
  delivery_time_max?: number;
  delivery_display: string;
  inclusions: string[];
  exclusions: string[];
  addons: Array<{
    name: string;
    price: number;
    description: string;
  }>;
  requirements: string[];
  sample_projects: Array<{
    id: string;
    title: string;
    slug: string;
    short_tagline: string;
    hero_image?: string;
    skills: Array<{ name: string; color: string }>;
  }>;
  hero_image?: string;
  gallery_images: string[];
  external_links: Record<string, string>;
  status: string;
  is_featured: boolean;
  click_count: number;
  hire_count: number;
  created_at: string;
}

export function GigDetail({ slug }: GigDetailProps) {
  const [gig, setGig] = useState<GigDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  const { setIsOpen: setChatOpen, setContext } = useChatStore();

  useEffect(() => {
    loadGig();
  }, [slug]);

  const loadGig = async () => {
    try {
      const response = await gigsAPI.getGig(slug);
      setGig(response.data);
      
      // Track gig view
      analytics.track('gig_view', {
        gig_id: response.data.id,
        gig_title: response.data.title,
        gig_slug: response.data.slug,
      });
    } catch (error) {
      console.error('Failed to load gig:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHireClick = () => {
    if (gig) {
      analytics.gigClick(gig.id, gig.title, 'hire');
      window.location.href = `/hire-me?gig=${gig.slug}`;
    }
  };

  const handleExternalClick = (platform: string, url: string) => {
    if (gig) {
      analytics.gigClick(gig.id, gig.title, 'external', platform);
      window.open(url, '_blank');
    }
  };

  const handleChatAboutGig = () => {
    if (gig) {
      setContext({ gig_id: gig.id, gig_title: gig.title });
      setChatOpen(true);
      analytics.track('chat_opened_from_gig', { gig_id: gig.id });
    }
  };

  const toggleAddon = (addonName: string) => {
    setSelectedAddons(prev => 
      prev.includes(addonName) 
        ? prev.filter(name => name !== addonName)
        : [...prev, addonName]
    );
  };

  const calculateTotalPrice = () => {
    if (!gig) return 0;
    
    let total = gig.price_min;
    selectedAddons.forEach(addonName => {
      const addon = gig.addons.find(a => a.name === addonName);
      if (addon) {
        total += addon.price;
      }
    });
    return total;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'limited': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'closed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <Link href="/gigs">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {gig.hero_image && (
          <div className="absolute inset-0 z-0">
            <Image
              src={gig.hero_image}
              alt={gig.title}
              className="w-full h-full object-cover"
              width={1200}
              height={600}
              unoptimized={true}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
          </div>
        )}
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/gigs">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Services
              </Button>
            </Link>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={getStatusColor(gig.status)}>
                    {gig.status === 'open' ? 'Available' : gig.status}
                  </Badge>
                  {gig.is_featured && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  <Badge variant="outline" style={{ borderColor: gig.category.color, color: gig.category.color }}>
                    {gig.category.name}
                  </Badge>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {gig.click_count} views
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {gig.hire_count} hires
                    </div>
                  </div>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {gig.title}
                </h1>
                
                <p className="text-xl text-muted-foreground mb-8">
                  {gig.short_description}
                </p>

                <div className="flex flex-wrap gap-3 mb-8">
                  <Button
                    onClick={handleHireClick}
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Briefcase className="w-5 h-5 mr-2" />
                    Hire Me for This
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={handleChatAboutGig}
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Ask Questions
                  </Button>

                  {Object.entries(gig.external_links).map(([platform, url]) => (
                    <Button
                      key={platform}
                      variant="outline"
                      onClick={() => handleExternalClick(platform, url)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Pricing Card */}
              <Card className="w-full lg:w-80 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20 sticky top-24">
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-green-400" />
                    {gig.price_display}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    {gig.delivery_display}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedAddons.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Selected Add-ons:</h4>
                      {selectedAddons.map(addonName => {
                        const addon = gig.addons.find(a => a.name === addonName);
                        return addon ? (
                          <div key={addonName} className="flex justify-between text-sm">
                            <span>{addon.name}</span>
                            <span className="text-green-400">+${addon.price}</span>
                          </div>
                        ) : null;
                      })}
                      <Separator />
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span className="text-purple-400">${calculateTotalPrice().toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleHireClick}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Get Started Now
                  </Button>

                  <div className="text-center text-xs text-muted-foreground">
                    <p>✓ Free consultation included</p>
                    <p>✓ 100% satisfaction guarantee</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Gallery Section */}
      {gig.gallery_images.length > 0 && (
        <section className="py-12 px-6 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold mb-6 text-center">Service Gallery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gig.gallery_images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="aspect-video overflow-hidden rounded-lg cursor-pointer"
                    onClick={() => setActiveImageIndex(index)}
                  >
                    <Image
                      src={image}
                      alt={`${gig.title} gallery ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      width={400}
                      height={225}
                      unoptimized={true}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Content Tabs */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-6xl">
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="inclusions">What's Included</TabsTrigger>
              <TabsTrigger value="addons">Add-ons</TabsTrigger>
              <TabsTrigger value="samples">Sample Work</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div 
                      className="prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: gig.long_description }}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                    <CardDescription>What you need to provide</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {gig.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Service Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="mt-8"
              >
                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                  <CardHeader>
                    <CardTitle>Service Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                      <div>
                        <div className="text-2xl font-bold text-purple-400">{gig.click_count}</div>
                        <div className="text-sm text-muted-foreground">Total Views</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-400">{gig.hire_count}</div>
                        <div className="text-sm text-muted-foreground">Successful Hires</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-400">
                          {gig.click_count > 0 ? ((gig.hire_count / gig.click_count) * 100).toFixed(1) : '0'}%
                        </div>
                        <div className="text-sm text-muted-foreground">Conversion Rate</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-400">4.9</div>
                        <div className="text-sm text-muted-foreground">Avg Rating</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="inclusions" className="mt-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-400 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      What's Included
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {gig.inclusions.map((inclusion, index) => (
                        <motion.li 
                          key={index} 
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          viewport={{ once: true }}
                          className="flex items-start gap-3"
                        >
                          <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{inclusion}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {gig.exclusions.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-red-400 flex items-center gap-2">
                        <X className="w-5 h-5" />
                        Not Included
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {gig.exclusions.map((exclusion, index) => (
                          <motion.li 
                            key={index} 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="flex items-start gap-3"
                          >
                            <X className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                            <span>{exclusion}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="addons" className="mt-8">
              {gig.addons.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2">Enhance Your Service</h3>
                    <p className="text-muted-foreground">Add extra features to get even more value</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {gig.addons.map((addon, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className={`cursor-pointer transition-all duration-300 ${
                          selectedAddons.includes(addon.name) 
                            ? 'border-purple-500 bg-purple-500/10 shadow-lg' 
                            : 'hover:border-purple-500/50 hover:shadow-md'
                        }`}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{addon.name}</CardTitle>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-purple-400">+${addon.price}</span>
                                <Button
                                  size="sm"
                                  variant={selectedAddons.includes(addon.name) ? "default" : "outline"}
                                  onClick={() => toggleAddon(addon.name)}
                                  className={selectedAddons.includes(addon.name) ? 
                                    "bg-gradient-to-r from-purple-500 to-pink-500" : ""
                                  }
                                >
                                  {selectedAddons.includes(addon.name) ? (
                                    <Minus className="w-4 h-4" />
                                  ) : (
                                    <Plus className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground">{addon.description}</p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {selectedAddons.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6"
                    >
                      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/20">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">Updated Total</h4>
                              <p className="text-sm text-muted-foreground">
                                Base service + {selectedAddons.length} add-on{selectedAddons.length > 1 ? 's' : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-purple-400">
                                ${calculateTotalPrice().toLocaleString()}
                              </div>
                              <Button
                                onClick={handleHireClick}
                                size="sm"
                                className="mt-2 bg-gradient-to-r from-purple-500 to-pink-500"
                              >
                                Hire with Add-ons
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Plus className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Add-ons Available</h3>
                    <p className="text-muted-foreground">
                      This service includes everything you need. For custom requirements, let's discuss your specific needs.
                    </p>
                    <Button
                      onClick={handleChatAboutGig}
                      variant="outline"
                      className="mt-4"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Discuss Custom Features
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="samples" className="mt-8">
              {gig.sample_projects.length > 0 ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2">Related Work</h3>
                    <p className="text-muted-foreground">Projects that showcase this type of service</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {gig.sample_projects.map((project, index) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-purple-500/20 hover:border-purple-500/40 overflow-hidden">
                          {project.hero_image && (
                            <div className="aspect-video overflow-hidden">
                              <Image
                                src={project.hero_image}
                                alt={project.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                width={400}
                                height={225}
                                unoptimized={true}
                              />
                            </div>
                          )}
                          <CardHeader>
                            <CardTitle className="text-lg group-hover:text-purple-400 transition-colors">
                              {project.title}
                            </CardTitle>
                            <CardDescription>{project.short_tagline}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-wrap gap-2 mb-4">
                              {project.skills.slice(0, 3).map((skill) => (
                                <Badge 
                                  key={skill.name} 
                                  variant="outline"
                                  style={{ borderColor: skill.color, color: skill.color }}
                                  className="text-xs"
                                >
                                  {skill.name}
                                </Badge>
                              ))}
                            </div>
                            <Link href={`/projects/${project.slug}`}>
                              <Button variant="outline" size="sm" className="w-full">
                                <Code className="w-4 h-4 mr-2" />
                                View Project
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Code className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Sample Projects</h3>
                    <p className="text-muted-foreground mb-4">
                      Sample projects for this service will be added soon. Check out my full portfolio for related work.
                    </p>
                    <Link href="/projects">
                      <Button variant="outline">
                        View All Projects
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 px-6 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">
              Common questions about this service
            </p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                question: "What's included in the base price?",
                answer: "The base price includes all items listed in the &apos;What&apos;s Included&apos; section. Additional features can be added through our add-on options."
              },
              {
                question: "How do revisions work?",
                answer: "I include reasonable revisions in all projects to ensure you're completely satisfied with the final result. Major scope changes may require additional discussion."
              },
              {
                question: "What if I need something custom?",
                answer: "Every project is unique! If you need features not covered by this service, let&apos;s discuss your specific requirements and create a custom solution."
              },
              {
                question: "How do we communicate during the project?",
                answer: "I adapt to your preferred communication style - email, Slack, video calls, or project management tools. Regular updates keep you informed throughout."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to get started?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Let&apos;s discuss your project requirements and create something amazing together.
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={handleHireClick}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Briefcase className="mr-2 w-5 h-5" />
                Start Project
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={handleChatAboutGig}
              >
                <MessageSquare className="mr-2 w-5 h-5" />
                Ask Questions
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={() => window.open('https://calendly.com/edzio', '_blank')}
              >
                <Calendar className="mr-2 w-5 h-5" />
                Schedule Call
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}