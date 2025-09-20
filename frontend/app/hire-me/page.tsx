'use client';

import { useSearchParams } from 'next/navigation';
import { SmartHireForm } from '@/components/hire/smart-hire-form';

export default function HireMePage() {
  const searchParams = useSearchParams();
  const preselectedGig = searchParams.get('gig');

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Let&apos;s Create Something Extraordinary
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Every great project starts with a conversation. Tell me about your vision, and I&apos;ll help bring it to life.
          </p>
        </div>

        <SmartHireForm preselectedGig={preselectedGig || undefined} />
      </div>
    </div>
  );
}