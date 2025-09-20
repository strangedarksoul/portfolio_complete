'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserProfile } from '@/components/profile/user-profile';
import { useAuthStore } from '@/lib/store';

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return <UserProfile />;
}