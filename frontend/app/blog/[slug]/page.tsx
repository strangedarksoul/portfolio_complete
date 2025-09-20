import { BlogPostDetail } from '@/components/blog/blog-post-detail';

interface BlogPostPageProps {
  params: {
    slug: string;
  };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  return <BlogPostDetail slug={params.slug} />;
}