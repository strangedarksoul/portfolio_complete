  'use client';
  
  import Image from 'next/image';
  import { useState, useEffect } from 'react';
  import { motion } from 'framer-motion';
  import Link from 'next/link';
  import { Button } from '@/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
  import { Badge } from '@/components/ui/badge';
  import { Input } from '@/components/ui/input';
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
  import { useChatStore } from '@/lib/store';
  import { blogAPI } from '@/lib/api';
  import { analytics } from '@/lib/analytics';
  import { 
    Search, 
    Calendar, 
    Clock, 
    Eye, 
    MessageSquare, 
    User,
    BookOpen,
    Filter,
    Star
  } from 'lucide-react';
  
  interface BlogPost {
    id: string;
    title: string;
    slug: string;
    subtitle?: string;
    excerpt: string;
    category: {
      name: string;
      color: string;
      icon: string;
    };
    tags: string[];
    featured_image?: string;
    author_name: string;
    published_at: string;
    reading_time: number;
    view_count: number;
    is_featured: boolean;
    comment_count: number;
  }
  
  interface BlogCategory {
    id: string;
    name: string;
    slug: string;
    color: string;
    icon: string;
    post_count: number;
  }
  
  export function BlogGrid() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [isLoading, setIsLoading] = useState(true);
    
    const { setIsOpen: setChatOpen, setContext } = useChatStore();
  
    useEffect(() => {
      loadData();
    }, []);
  
    useEffect(() => {
      filterPosts();
    }, [posts, searchQuery, selectedCategory]);
  
    const filterPosts = () => {
      let filtered = posts;
  
      if (searchQuery) {
        filtered = filtered.filter(post =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
  
      if (selectedCategory !== 'all') {
        filtered = filtered.filter(post => post.category.slug === selectedCategory);
      }
  
      setFilteredPosts(filtered);
    };
  
    const loadData = async () => {
      try {
        const [postsResponse, categoriesResponse] = await Promise.all([
          blogAPI.getPosts(),
          blogAPI.getCategories(),
        ]);
  
        setPosts(postsResponse.data.results || []);
        setCategories(categoriesResponse.data.results || []);
      } catch (error) {
        console.error('Failed to load blog data:', error);
        // Fallback to empty arrays if API fails
        setPosts([]);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };
  
    const handlePostClick = (post: BlogPost) => {
      analytics.track('blog_view', {
        post_id: post.id,
        post_title: post.title,
        post_slug: post.slug,
        category: post.category.name,
      });
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
            Digital Chronicles
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Insights, tutorials, and stories from the intersection of code and creativity.
          </p>
        </motion.div>
  
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="mb-8 space-y-4"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.slug} value={category.slug}>
                    {category.name} ({category.post_count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
  
          <div className="text-sm text-muted-foreground">
            Showing {filteredPosts.length} of {posts.length} articles
          </div>
        </motion.div>
  
        {/* Featured Posts */}
        {filteredPosts.some(post => post.is_featured) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-6">Featured Articles</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {filteredPosts.filter(post => post.is_featured).map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                >
                  <Card className="group hover:shadow-2xl transition-all duration-500 cursor-pointer border-purple-500/20 hover:border-purple-500/40 overflow-hidden h-full">
                    {post.featured_image && (
                      <div className="aspect-video overflow-hidden relative">
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <Badge className="absolute top-3 left-3 bg-yellow-500/90 text-black">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant="outline"
                          style={{ borderColor: post.category.color, color: post.category.color }}
                        >
                          {post.category.name}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {post.reading_time} min
                        </div>
                      </div>
                      
                      <CardTitle className="group-hover:text-purple-400 transition-colors line-clamp-2">
                        {post.title}
                      </CardTitle>
                      {post.subtitle && (
                        <CardDescription className="line-clamp-1">{post.subtitle}</CardDescription>
                      )}
                    </CardHeader>
  
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                        {post.excerpt}
                      </p>
  
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {post.author_name}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(post.published_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.view_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {post.comment_count}
                          </div>
                        </div>
                      </div>
  
                      <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
  
                      <Link href={`/blog/${post.slug}`}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => handlePostClick(post)}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Read Article
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
  
        {/* All Posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <h2 className="text-2xl font-bold mb-6">All Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.8 }}
              >
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-purple-500/20 hover:border-purple-500/40 overflow-hidden h-full">
                  {post.featured_image && (
                    <div className="aspect-video overflow-hidden">
                      <Image
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        width={400}
                        height={225}
                        unoptimized={true}
                      />
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge 
                        variant="outline"
                        style={{ borderColor: post.category.color, color: post.category.color }}
                      >
                        {post.category.name}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {post.reading_time} min
                      </div>
                    </div>
                    
                    <CardTitle className="group-hover:text-purple-400 transition-colors line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
  
                  <CardContent>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.published_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.view_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {post.comment_count}
                        </div>
                      </div>
                    </div>
  
                    <Link href={`/blog/${post.slug}`}>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handlePostClick(post)}
                      >
                        Read More
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
  
        {/* Empty State */}
        {filteredPosts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No articles found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search or filter criteria
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
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
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Want to discuss these topics?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            I love talking about technology, development practices, and industry trends. Let&apos;s start a conversation!
          </p>
          <Button
            onClick={() => {
              setContext({ page: 'blog' });
              setChatOpen(true);
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <MessageSquare className="mr-2 w-5 h-5" />
            Start Discussion
          </Button>
        </motion.section>
      </div>
    );
  }