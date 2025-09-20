'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthForms } from '@/components/auth/auth-forms';
import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  
  const token = searchParams.get('token');
  const mode = token ? 'reset-confirm' : 'reset-request';

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSuccess = () => {
    if (mode === 'reset-confirm') {
      router.push('/auth/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/auth/login">
            <Button variant="ghost" className="text-purple-200 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Button>
          </Link>
        </div>

        <AuthForms mode={mode} onSuccess={handleSuccess} resetToken={token || undefined} />

        {mode === 'reset-request' && (
          <div className="mt-6 text-center">
            <p className="text-purple-200 text-sm">
              Remember your password?{' '}
              <Link href="/auth/login" className="text-white underline hover:text-purple-300">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}