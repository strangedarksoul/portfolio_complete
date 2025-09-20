import { CaseStudyDetail } from '@/components/case-studies/case-study-detail';

interface CaseStudyPageProps {
  params: {
    id: string;
  };
}

export default function CaseStudyPage({ params }: CaseStudyPageProps) {
  return <CaseStudyDetail id={params.id} />;
}