'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react';
import Cookies from 'js-cookie';

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  full_name: z.string().min(2, 'Full name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string(),
  terms_accepted: z.boolean().refine(val => val === true, 'You must accept the terms'),
  privacy_accepted: z.boolean().refine(val => val === true, 'You must accept the privacy policy'),
}).refine(data => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"],
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const resetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetConfirmSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string(),
}).refine(data => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ["password_confirm"],
});

interface AuthFormsProps {
  mode: 'login' | 'register' | 'reset-request' | 'reset-confirm';
  onSuccess?: () => void;
  resetToken?: string;
}

export function AuthForms({ mode, onSuccess, resetToken }: AuthFormsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { setUser } = useAuthStore();

  const getSchema = () => {
    switch (mode) {
      case 'register': return registerSchema;
      case 'login': return loginSchema;
      case 'reset-request': return resetRequestSchema;
      case 'reset-confirm': return resetConfirmSchema;
      default: return loginSchema;
    }
  };

  const form = useForm({
    resolver: zodResolver(getSchema()),
    defaultValues: mode === 'reset-confirm' ? { token: resetToken || '' } : {},
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setMessage(null);

    try {
      let response;
      
      switch (mode) {
        case 'register':
          response = await authAPI.register(data);
          analytics.track('user_registration', { email: data.email });
          setMessage({ 
            type: 'success', 
            text: 'Registration successful! Please check your email to verify your account.' 
          });
          
          // Store tokens
          Cookies.set('access_token', response.data.tokens.access, { expires: 1 });
          Cookies.set('refresh_token', response.data.tokens.refresh, { expires: 7 });
          setUser(response.data.user);
          break;

        case 'login':
          response = await authAPI.login(data);
          analytics.track('user_login', { email: data.email });
          
          // Store tokens
          Cookies.set('access_token', response.data.tokens.access, { expires: 1 });
          Cookies.set('refresh_token', response.data.tokens.refresh, { expires: 7 });
          setUser(response.data.user);
          
          setMessage({ type: 'success', text: 'Login successful!' });
          break;

        case 'reset-request':
          await authAPI.requestPasswordReset(data.email);
          analytics.track('password_reset_requested', { email: data.email });
          setMessage({ 
            type: 'success', 
            text: 'If an account with that email exists, a password reset link has been sent.' 
          });
          break;

        case 'reset-confirm':
          await authAPI.confirmPasswordReset(data);
          analytics.track('password_reset_completed');
          setMessage({ type: 'success', text: 'Password reset successful! You can now log in.' });
          break;
      }

      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'An error occurred';
      setMessage({ type: 'error', text: errorMessage });
      analytics.track('auth_error', { mode, error: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'register': return 'Join the Journey';
      case 'login': return 'Welcome Back';
      case 'reset-request': return 'Reset Password';
      case 'reset-confirm': return 'Set New Password';
      default: return 'Authentication';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'register': return 'Create your account to unlock the full experience';
      case 'login': return 'Sign in to continue your journey';
      case 'reset-request': return 'Enter your email to receive a reset link';
      case 'reset-confirm': return 'Enter your new password';
      default: return '';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="bg-black/20 backdrop-blur-lg border-purple-500/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">{getTitle()}</CardTitle>
          <CardDescription className="text-purple-200">
            {getDescription()}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-purple-300" />
                    <Input
                      id="username"
                      {...form.register('username')}
                      placeholder="Choose a username"
                      className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                    />
                  </div>
                  {form.formState.errors.username && (
                    <p className="text-red-400 text-sm">{form.formState.errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-white">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-purple-300" />
                    <Input
                      id="full_name"
                      {...form.register('full_name')}
                      placeholder="Your full name"
                      className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                    />
                  </div>
                  {form.formState.errors.full_name && (
                    <p className="text-red-400 text-sm">{form.formState.errors.full_name.message}</p>
                  )}
                </div>
              </>
            )}

            {(mode === 'register' || mode === 'login' || mode === 'reset-request') && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-purple-300" />
                  <Input
                    id="email"
                    type="email"
                    {...form.register('email')}
                    placeholder="your@email.com"
                    className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-red-400 text-sm">{form.formState.errors.email.message}</p>
                )}
              </div>
            )}

            {(mode === 'register' || mode === 'login' || mode === 'reset-confirm') && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  {mode === 'reset-confirm' ? 'New Password' : 'Password'}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-purple-300" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...form.register('password')}
                    placeholder="Enter password"
                    className="pl-10 pr-10 bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-8 w-8 p-0 text-purple-300 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                {form.formState.errors.password && (
                  <p className="text-red-400 text-sm">{form.formState.errors.password.message}</p>
                )}
              </div>
            )}

            {(mode === 'register' || mode === 'reset-confirm') && (
              <div className="space-y-2">
                <Label htmlFor="password_confirm" className="text-white">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-purple-300" />
                  <Input
                    id="password_confirm"
                    type={showPassword ? 'text' : 'password'}
                    {...form.register('password_confirm')}
                    placeholder="Confirm password"
                    className="pl-10 bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                  />
                </div>
                {form.formState.errors.password_confirm && (
                  <p className="text-red-400 text-sm">{form.formState.errors.password_confirm.message}</p>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={form.watch('terms_accepted')}
                    onCheckedChange={(checked) => form.setValue('terms_accepted', !!checked)}
                    className="border-purple-500/50 data-[state=checked]:bg-purple-500"
                  />
                  <Label htmlFor="terms" className="text-sm text-purple-200">
                    I accept the <a href="/terms" className="underline hover:text-white">Terms of Service</a>
                  </Label>
                </div>
                {form.formState.errors.terms_accepted && (
                  <p className="text-red-400 text-sm">{form.formState.errors.terms_accepted.message}</p>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={form.watch('privacy_accepted')}
                    onCheckedChange={(checked) => form.setValue('privacy_accepted', !!checked)}
                    className="border-purple-500/50 data-[state=checked]:bg-purple-500"
                  />
                  <Label htmlFor="privacy" className="text-sm text-purple-200">
                    I accept the <a href="/privacy" className="underline hover:text-white">Privacy Policy</a>
                  </Label>
                </div>
                {form.formState.errors.privacy_accepted && (
                  <p className="text-red-400 text-sm">{form.formState.errors.privacy_accepted.message}</p>
                )}
              </div>
            )}

            {message && (
              <Alert className={`${message.type === 'error' ? 'border-red-500/50 bg-red-500/10' : 'border-green-500/50 bg-green-500/10'}`}>
                {message.type === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-400" />
                )}
                <AlertDescription className={message.type === 'error' ? 'text-red-200' : 'text-green-200'}>
                  {message.text}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isLoading ? 'Processing...' : mode === 'register' ? 'Create Account' : mode === 'login' ? 'Sign In' : mode === 'reset-request' ? 'Send Reset Link' : 'Reset Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}