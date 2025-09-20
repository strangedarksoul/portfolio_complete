'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useChatStore } from '@/lib/store';
import { analytics } from '@/lib/analytics';
import { 
  Sparkles, 
  Eye, 
  MessageSquare, 
  Gift, 
  Star,
  Zap,
  Crown,
  Gem
} from 'lucide-react';

export default function EasterEggPage() {
  const [isRevealed, setIsRevealed] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [theme, setTheme] = useState<'default' | 'neon' | 'matrix' | 'cosmic'>('default');
  
  const { setIsOpen: setChatOpen, setContext } = useChatStore();

  useEffect(() => {
    analytics.track('easter_egg_discovered');
    
    // Apply special theme
    document.body.classList.add('easter-egg-mode');
    
    return () => {
      document.body.classList.remove('easter-egg-mode');
    };
  }, []);

  const handleReveal = () => {
    setIsRevealed(true);
    analytics.track('easter_egg_revealed');
  };

  const handleThemeChange = (newTheme: typeof theme) => {
    setTheme(newTheme);
    analytics.track('easter_egg_theme_change', { theme: newTheme });
  };

  const handleChatSecret = () => {
    setContext({ page: 'easter-egg', secret_mode: true });
    setChatOpen(true);
    analytics.track('chat_opened_from_easter_egg');
  };

  const themes = [
    { key: 'default', name: 'Classic', icon: Star, colors: 'from-purple-500 to-pink-500' },
    { key: 'neon', name: 'Neon City', icon: Zap, colors: 'from-cyan-500 to-green-500' },
    { key: 'matrix', name: 'Matrix', icon: Eye, colors: 'from-green-500 to-lime-500' },
    { key: 'cosmic', name: 'Cosmic', icon: Sparkles, colors: 'from-indigo-500 to-purple-500' },
  ];

  return (
    <div className={`min-h-screen relative overflow-hidden ${theme === 'matrix' ? 'bg-black' : theme === 'neon' ? 'bg-gray-900' : theme === 'cosmic' ? 'bg-slate-900' : ''}`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {theme === 'matrix' && (
          <div className="matrix-rain">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-green-400 text-xs font-mono opacity-70"
                style={{
                  left: `${i * 5}%`,
                  animationDelay: `${i * 0.1}s`,
                  animation: 'matrix-fall 3s linear infinite',
                }}
              >
                {Array.from({ length: 20 }).map((_, j) => (
                  <div key={j} style={{ animationDelay: `${j * 0.1}s` }}>
                    {String.fromCharCode(0x30A0 + Math.random() * 96)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
        
        {theme === 'neon' && (
          <>
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-cyan-400 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  boxShadow: ['0 0 0px #00ffff', '0 0 20px #00ffff', '0 0 0px #00ffff'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </>
        )}

        {theme === 'cosmic' && (
          <>
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-0.5 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  delay: Math.random() * 4,
                }}
              />
            ))}
          </>
        )}
      </div>

      <div className="container mx-auto px-6 py-20 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Crown className="w-10 h-10 text-white" />
          </div>
          
          <h1 className={`text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r ${themes.find(t => t.key === theme)?.colors || 'from-purple-400 to-pink-400'} bg-clip-text text-transparent`}>
            🎭 Director's Alternate Cut
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Congratulations, digital explorer! You've discovered the hidden realm where creativity knows no bounds.
          </p>
        </motion.div>

        {/* Secret Unlock */}
        {!isRevealed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="max-w-md mx-auto mb-12"
          >
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardHeader className="text-center">
                <Gem className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                <CardTitle>The Vault Awaits</CardTitle>
                <CardDescription>
                  You&apos;ve found the secret entrance. Ready to unlock the alternate experience?
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button
                  onClick={handleReveal}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Reveal the Secrets
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Theme Selector */}
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-center">Choose Your Reality</CardTitle>
                <CardDescription className="text-center">
                  Experience the portfolio through different visual dimensions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {themes.map(({ key, name, icon: Icon, colors }) => (
                    <Button
                      key={key}
                      variant={theme === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleThemeChange(key as typeof theme)}
                      className={`flex flex-col h-16 ${theme === key ? `bg-gradient-to-r ${colors}` : ''}`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      <span className="text-xs">{name}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Secret Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
                <CardHeader>
                  <Gift className="w-8 h-8 text-yellow-400 mb-2" />
                  <CardTitle>Hidden Insights</CardTitle>
                  <CardDescription>
                    Unlock exclusive development stories and behind-the-scenes content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleChatSecret}
                    variant="outline"
                    className="w-full"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask Secret Questions
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
                <CardHeader>
                  <Zap className="w-8 h-8 text-green-400 mb-2" />
                  <CardTitle>Developer Mode</CardTitle>
                  <CardDescription>
                    Access technical deep-dives and architecture discussions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => {
                      setContext({ page: 'easter-egg', mode: 'developer' });
                      setChatOpen(true);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Enter Dev Mode
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Secret Message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 2 }}
              className="text-center max-w-2xl mx-auto"
            >
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold mb-4">🎊 Congratulations, Fellow Explorer!</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You&apos;ve discovered one of the hidden layers of this portfolio. This attention to detail and 
                    curiosity for exploration is exactly the kind of mindset I bring to every project. 
                    Whether it&apos;s finding edge cases in code or uncovering innovative solutions, 
                    the best work happens when we dig deeper.
                  </p>
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm italic">
                      &quot;The most interesting discoveries happen in the spaces between the obvious.&quot;
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">- Edzio</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </div>

      <style jsx>{`
        @keyframes matrix-fall {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        .matrix-rain {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}