'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { gigsAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  Briefcase, 
  Clock, 
  DollarSign, 
  ExternalLink, 
  MessageSquare,
  Star,
  ArrowRight,
  Zap,
  Calendar
} from 'lucide-react';

interface Gig {
  id: string;
  title: string;
  slug: string;
  short_description: string;
  price_display: string;
  delivery_display: string;
  hero_image?: string;
  status: string;
  is_featured: boolean;
  sample_project_count: number;
  external_links: Record<string, string>;
  category: {
    name: string;
    icon: string;
    color: string;
    slug: string;
  };
}

interface GigCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  gig_count: number;
}

export function GigsMarketplace() {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [categories, setCategories] = useState<GigCategory[]>([]);
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterGigs();
  }, [gigs, selectedCategory]);

  const loadData = async () => {
    try {
      const [gigsResponse, categoriesResponse] = await Promise.all([
        gigsAPI.getGigs(),
        gigsAPI.getCategories(),
      ]);

      setGigs(gigsResponse.data.results || []);
      setCategories(categoriesResponse.data.results || []);
    } catch (error) {
      console.error('Failed to load gigs data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterGigs = () => {
    let filtered = gigs;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(gig => gig.category.slug === selectedCategory);
    }

    setFilteredGigs(filtered);
  };

  const handleGigClick = (gig: Gig) => {
    analytics.track('gig_view', { gig_id: gig.id, gig_title: gig.title });
  };

  const handleExternalClick = (gig: Gig, platform: string, url: string) => {
    analytics.gigClick(gig.id, gig.title, 'external', platform);
    window.open(url, '_blank');
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
          Service Marketplace
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Ready-to-go solutions for your next project. Each service is crafted with precision and delivered with excellence.
        </p>
      </motion.div>

      {/* Categories Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.8 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={selectedCategory === 'all' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
            >
              All Services ({gigs.length})
            </Button>
            {categories.map((category) => (
              <Button
                key={category.slug}
                variant={selectedCategory === category.slug ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.slug)}
                className={selectedCategory === category.slug ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
              >
                {category.name} ({category.gig_count})
              </Button>
            ))}
          </div>
          
          <div className="text-sm text-muted-foreground">
            Showing {filteredGigs.length} services
          </div>
        </div>
      </motion.div>

      {/* Gigs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredGigs.map((gig, index) => (
          <motion.div
            key={gig.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.8 }}
            className="group"
          >
            <Card className="h-full hover:shadow-2xl transition-all duration-500 cursor-pointer border-purple-500/20 hover:border-purple-500/40 overflow-hidden">
              {gig.hero_image && (
                <div className="aspect-video overflow-hidden relative">
                  <img
                    src={gig.hero_image}
                    alt={gig.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                </div>
              )}

              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getStatusColor(gig.status)}>
                    {gig.status === 'open' ? 'Available' : gig.status}
                  </Badge>
                  {gig.is_featured && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>

                <CardTitle className="group-hover:text-purple-400 transition-colors">
                  {gig.title}
                </CardTitle>
                <CardDescription>{gig.short_description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Pricing and Delivery */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <div>
                      <div className="font-semibold text-sm">{gig.price_display}</div>
                      <div className="text-xs text-muted-foreground">Starting price</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="font-semibold text-sm">{gig.delivery_display}</div>
                      <div className="text-xs text-muted-foreground">Delivery time</div>
                    </div>
                  </div>
                </div>

                {/* Sample Projects */}
                {gig.sample_project_count > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    {gig.sample_project_count} sample project{gig.sample_project_count > 1 ? 's' : ''}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Link href={`/gigs/${gig.slug}`} className="flex-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleGigClick(gig)}
                      >
                        Learn More
                      </Button>
                    </Link>
                    <Link href={`/hire-me?gig=${gig.slug}`}>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        onClick={() => analytics.gigClick(gig.id, gig.title, 'hire')}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Hire
                      </Button>
                    </Link>
                  </div>

                  {/* External Platform Links */}
                  {Object.keys(gig.external_links).length > 0 && (
                    <div className="flex gap-2">
                      {Object.entries(gig.external_links).map(([platform, url]) => (
                        <Button
                          key={platform}
                          variant="ghost"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleExternalClick(gig, platform, url)}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          {platform}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredGigs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Briefcase className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No services found</h3>
          <p className="text-muted-foreground mb-6">
            Try selecting a different category
          </p>
          <Button
            onClick={() => setSelectedCategory('all')}
            variant="outline"
          >
            View All Services
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
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Need something custom?
        </h2>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Every project is unique. Let's discuss your specific needs and create a tailored solution.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/hire-me">
            <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <MessageSquare className="mr-2 w-5 h-5" />
              Start Custom Project
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            onClick={() => window.open('https://calendly.com/edzio', '_blank')}
          >
            <Calendar className="mr-2 w-5 h-5" />
            Schedule Call
          </Button>
        </div>
      </motion.section>
    </div>
  );
}