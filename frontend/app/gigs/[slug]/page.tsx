import { GigDetail } from '@/components/gigs/gig-detail';

interface GigPageProps {
  params: {
    slug: string;
  };
}

export default function GigPage({ params }: GigPageProps) {
  return <GigDetail slug={params.slug} />;
}