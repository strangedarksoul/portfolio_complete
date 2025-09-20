'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { usePortalStore, useAuthStore } from '@/lib/store';
import { portalAPI } from '@/lib/api';
import { analytics } from '@/lib/analytics';
import { Sparkles, ArrowRight, SkipForward } from 'lucide-react';

interface PortalEntranceProps {
  onComplete: () => void;
}

export function PortalEntrance({ onComplete }: PortalEntranceProps) {
  const [step, setStep] = useState<'portal' | 'name' | 'greeting'>('portal');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { userName, hasConsent, hasSeenPortal, setUserName, setConsent: setStoredConsent, setHasSeenPortal } = usePortalStore();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Check if user should see portal
    if (hasSeenPortal && (userName || isAuthenticated)) {
      onComplete();
      return;
    }

    // Fetch greeting data
    fetchGreeting();
  }, []);

  const fetchGreeting = async () => {
    try {
      const response = await portalAPI.getGreeting(user?.id);
      const data = response.data;
      
      if (!data.should_ask_name || isAuthenticated) {
        setGreeting(data.greeting_message);
        setStep('greeting');
        setTimeout(() => {
          onComplete();
        }, 3000);
      } else {
        setStep('name');
      }
    } catch (error) {
      console.error('Failed to fetch greeting:', error);
      setStep('name');
    }
  };

  const handleNameSubmit = async () => {
    if (!name.trim() || !consent) return;

    setIsLoading(true);
    
    try {
      // Store name and consent
      setUserName(name);
      setStoredConsent(consent);
      
      // Send to backend
      await portalAPI.rememberUser({ name, consent });
      
      // Track analytics
      analytics.track('portal_name_entered', { name_length: name.length, consent_given: consent });
      
      setGreeting(`Welcome, ${name}. I've been expecting you.`);
      setStep('greeting');
      
      setTimeout(() => {
        setHasSeenPortal(true);
        onComplete();
      }, 3000);
    } catch (error) {
      console.error('Failed to save user preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    analytics.track('portal_skipped');
    setHasSeenPortal(true);
    onComplete();
  };

  const portalVariants = {
    initial: { scale: 0, rotate: -180, opacity: 0 },
    animate: { 
      scale: 1, 
      rotate: 0, 
      opacity: 1,
      transition: { 
        duration: 2,
        ease: "easeOut",
        staggerChildren: 0.2
      }
    },
    exit: { 
      scale: 1.2, 
      opacity: 0,
      transition: { duration: 1 }
    }
  };

  const sparkleVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: [0, 1, 0.8, 1],
      opacity: [0, 1, 0.7, 1],
      transition: { 
        duration: 1.5,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 'portal' && (
          <motion.div
            key="portal"
            variants={portalVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="text-center"
          >
            <motion.div
              variants={sparkleVariants}
              className="relative mx-auto w-32 h-32 mb-8"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 blur-xl opacity-50" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-16 h-16 text-white" />
              </div>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              Welcome, Traveler
            </motion.h1>
            
            <motion.p 
              className="text-xl text-purple-200 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
            >
              Enter the digital realm of Edzio
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              <Button
                onClick={() => setStep('name')}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
              >
                Enter Portal <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
          </motion.div>
        )}

        {step === 'name' && (
          <motion.div
            key="name"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-4"
          >
            <Card className="bg-black/20 backdrop-blur-lg border-purple-500/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-white">What's your name, traveler?</CardTitle>
                <CardTitle className="text-2xl text-white">What&apos;s your name, traveler?</CardTitle>
                <CardDescription className="text-purple-200">
                  Let me personalize your journey through my digital realm
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Your Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name..."
                    className="bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300"
                    onKeyPress={(e) => e.key === 'Enter' && handleNameSubmit()}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="consent"
                    checked={consent}
                    onCheckedChange={(checked) => setConsent(checked as boolean)}
                    className="border-purple-500/50 data-[state=checked]:bg-purple-500"
                  />
                  <Label htmlFor="consent" className="text-sm text-purple-200">
                    Remember me on this device (stored locally)
                  </Label>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleNameSubmit}
                    disabled={!name.trim() || !consent || isLoading}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {isLoading ? 'Entering...' : 'Continue'}
                  </Button>
                  <Button
                    onClick={handleSkip}
                    variant="outline"
                    className="border-purple-500/50 text-purple-200 hover:bg-purple-500/20"
                  >
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 'greeting' && (
          <motion.div
            key="greeting"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 1 }}
            className="text-center"
          >
            <motion.h1 
              className="text-3xl md:text-5xl font-bold text-white mb-8"
              animate={{ 
                backgroundPosition: ['0%', '100%'],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              style={{
                background: 'linear-gradient(45deg, #ffffff, #a855f7, #ec4899, #ffffff)',
                backgroundSize: '300% 300%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {greeting}
            </motion.h1>
            
            <motion.div
              className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto"
              initial={{ width: 0 }}
              animate={{ width: 64 }}
              transition={{ delay: 1, duration: 1 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skip button - always visible */}
      <Button
        onClick={handleSkip}
        variant="ghost"
        size="sm"
        className="absolute top-4 right-4 text-purple-200 hover:text-white hover:bg-purple-500/20"
      >
        Skip Intro
      </Button>
    </div>
  );
}