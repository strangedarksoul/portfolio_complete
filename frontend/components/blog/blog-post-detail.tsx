'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChatStore, useAuthStore } from '@/lib/store';
import { blogAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Eye, 
  MessageSquare, 
  User,
  Share2,
  BookOpen,
  Send,
  Heart,
  Code
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BlogPostDetailProps {
  slug: string;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  excerpt: string;
  content: string;
  category: {
    name: string;
    color: string;
    icon: string;
  };
  tags: string[];
  featured_image?: string;
  gallery_images: string[];
  author_name: string;
  author_avatar?: string;
  published_at: string;
  updated_at: string;
  reading_time: number;
  view_count: number;
  is_featured: boolean;
  allow_comments: boolean;
  comment_count: number;
  meta_title?: string;
  meta_description?: string;
}

interface BlogComment {
  id: string;
  content: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  replies: BlogComment[];
}

export function BlogPostDetail({ slug }: BlogPostDetailProps) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentForm, setCommentForm] = useState({
    content: '',
    author_name: '',
    author_email: '',
    parent: null as string | null,
  });
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  
  const { setIsOpen: setChatOpen, setContext } = useChatStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadPost();
    loadComments();
    
    // Track reading progress
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (scrollTop / docHeight) * 100;
      setReadingProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug]);

  const loadPost = async () => {
    try {
      const response = await blogAPI.getPost(slug);
      setPost(response.data);
      
      analytics.track('blog_view', {
        post_id: response.data.id,
        post_title: response.data.title,
        post_slug: response.data.slug,
        category: response.data.category.name,
      });
    } catch (error) {
      console.error('Failed to load blog post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await blogAPI.getComments(slug);
      setComments(response.data || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!commentForm.content.trim()) return;

    setIsSubmittingComment(true);
    try {
      const commentData = {
        post: post?.id,
        content: commentForm.content,
        parent: commentForm.parent,
        ...(isAuthenticated ? {} : {
          author_name: commentForm.author_name,
          author_email: commentForm.author_email,
        }),
      };

      await blogAPI.submitComment(commentData);
      
      // Reset form
      setCommentForm({
        content: '',
        author_name: '',
        author_email: '',
        parent: null,
      });

      // Reload comments
      loadComments();

      analytics.track('blog_comment', {
        post_id: post?.id,
        post_title: post?.title,
        is_authenticated: isAuthenticated,
      });
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleChatAboutPost = () => {
    if (post) {
      setContext({ 
        blog_post_id: post.id, 
        blog_post_title: post.title,
        blog_category: post.category.name 
      });
      setChatOpen(true);
      analytics.track('chat_opened_from_blog', { post_id: post.id });
    }
  };

  const handleShare = () => {
    if (navigator.share && post) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
    analytics.track('blog_share', { post_id: post?.id });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <Link href="/blog">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Reading Progress */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div 
          className="h-1 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {post.featured_image && (
          <div className="absolute inset-0 z-0">
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/30" />
          </div>
        )}
        
        <div className="container mx-auto max-w-4xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link href="/blog">
              <Button variant="ghost" className="mb-6">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <Badge 
                style={{ backgroundColor: post.category.color + '20', color: post.category.color, borderColor: post.category.color + '50' }}
              >
                {post.category.name}
              </Badge>
              {post.is_featured && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  Featured
                </Badge>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {post.reading_time} min read
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {post.view_count} views
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {post.comment_count} comments
                </div>
              </div>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              {post.title}
            </h1>
            
            {post.subtitle && (
              <p className="text-xl text-muted-foreground mb-6">
                {post.subtitle}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={post.author_avatar} alt={post.author_name} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    {post.author_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{post.author_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(post.published_at), { addSuffix: true })}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleChatAboutPost}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="prose prose-invert prose-lg max-w-none mb-12"
          >
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </motion.div>

          {/* Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-muted">
                #{tag}
              </Badge>
            ))}
          </motion.div>

          <Separator className="mb-8" />

          {/* Comments Section */}
          {post.allow_comments && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="space-y-8"
            >
              <h2 className="text-2xl font-bold">Comments ({post.comment_count})</h2>

              {/* Comment Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Join the Discussion</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="comment">Your Comment</Label>
                    <Textarea
                      id="comment"
                      value={commentForm.content}
                      onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Share your thoughts..."
                      rows={4}
                    />
                  </div>

                  {!isAuthenticated && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          value={commentForm.author_name}
                          onChange={(e) => setCommentForm(prev => ({ ...prev, author_name: e.target.value }))}
                          placeholder="Your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={commentForm.author_email}
                          onChange={(e) => setCommentForm(prev => ({ ...prev, author_email: e.target.value }))}
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleSubmitComment}
                    disabled={!commentForm.content.trim() || isSubmittingComment || (!isAuthenticated && (!commentForm.author_name || !commentForm.author_email))}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmittingComment ? 'Submitting...' : 'Post Comment'}
                  </Button>
                </CardContent>
              </Card>

              {/* Comments List */}
              <div className="space-y-6">
                {comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarImage src={comment.author_avatar} alt={comment.author_name} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                              {comment.author_name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold">{comment.author_name}</h4>
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                              {comment.content}
                            </p>
                          </div>
                        </div>

                        {/* Replies */}
                        {comment.replies.length > 0 && (
                          <div className="ml-12 mt-4 space-y-4">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={reply.author_avatar} alt={reply.author_name} />
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs">
                                    {reply.author_name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">{reply.author_name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-sm">{reply.content}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* CTA Section */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="py-16 text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Enjoyed this article?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Let's discuss the topics covered or explore how these concepts apply to your projects.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={handleChatAboutPost}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <MessageSquare className="mr-2 w-5 h-5" />
                Discuss This Article
              </Button>
              <Link href="/blog">
                <Button variant="outline">
                  <BookOpen className="mr-2 w-5 h-5" />
                  More Articles
                </Button>
              </Link>
            </div>
          </motion.section>
        </div>
      </section>
    </div>
  );
}