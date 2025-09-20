'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthForms } from '@/components/auth/auth-forms';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSuccess = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="text-purple-200 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Portfolio
            </Button>
          </Link>
        </div>

        <AuthForms mode="login" onSuccess={handleSuccess} />

        <div className="mt-6 text-center">
          <p className="text-purple-200 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-white underline hover:text-purple-300">
              Sign up
            </Link>
          </p>
          <p className="text-purple-200 text-sm mt-2">
            <Link href="/auth/reset-password" className="text-white underline hover:text-purple-300">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}