'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { authAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async (verificationToken: string) => {
      try {
        await authAPI.verifyEmail(verificationToken);
        setStatus('success');
        setMessage('Email verified successfully! You can now access all features.');
        
        analytics.track('email_verified', { token_used: true });
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Verification failed. The link may be expired or invalid.');
        analytics.track('email_verification_failed', { error: error.message });
      }
    };

    if (token) {
      verifyEmail(token);
    } else {
      setStatus('error');
      setMessage('Invalid verification link');
    }
  }, [token, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <Card className="bg-black/20 backdrop-blur-lg border-purple-500/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
              {status === 'loading' && (
                <div className="bg-blue-500/20 w-full h-full rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
                </div>
              )}
              {status === 'success' && (
                <div className="bg-green-500/20 w-full h-full rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              )}
              {status === 'error' && (
                <div className="bg-red-500/20 w-full h-full rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
              )}
            </div>
            
            <CardTitle className="text-2xl text-white">
              {status === 'loading' && 'Verifying Email...'}
              {status === 'success' && 'Email Verified!'}
              {status === 'error' && 'Verification Failed'}
            </CardTitle>
            
            <CardDescription className="text-purple-200">
              {message}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center">
            {status === 'success' && (
              <p className="text-sm text-purple-200 mb-4">
                Redirecting to login in 3 seconds...
              </p>
            )}
            
            <div className="space-y-3">
              <Button
                onClick={() => router.push('/auth/login')}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Go to Login
              </Button>
              
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                className="w-full border-purple-500/50 text-purple-200 hover:bg-purple-500/20"
              >
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}