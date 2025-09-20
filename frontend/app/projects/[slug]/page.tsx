import { ProjectDetail } from '@/components/projects/project-detail';

interface ProjectPageProps {
  params: {
    slug: string;
  };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  return <ProjectDetail slug={params.slug} />;
}