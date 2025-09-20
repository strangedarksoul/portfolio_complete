'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuthStore, usePortalStore } from '@/lib/store';
import { 
  Home, 
  User, 
  Briefcase, 
  Code, 
  MessageSquare, 
  Trophy, 
  Star,
  FileText,
  Menu,
  LogIn,
  LogOut,
  Settings,
  Target,
  Gamepad2
} from 'lucide-react';

const navigationItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/about', label: 'About', icon: User },
  { href: '/projects', label: 'Projects', icon: Code },
  { href: '/skills', label: 'Skills', icon: Trophy },
  { href: '/gigs', label: 'Services', icon: Briefcase },
  { href: '/achievements', label: 'Achievements', icon: Trophy },
  { href: '/roadmap', label: 'Roadmap', icon: Target },
  { href: '/blog', label: 'Blog', icon: FileText },
  { href: '/testimonials', label: 'Testimonials', icon: Star },
  { href: '/playground', label: 'Playground', icon: Gamepad2 },
];

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { userName } = usePortalStore();

  const displayName = isAuthenticated ? user?.display_name || user?.full_name : userName;

  const handleLogout = () => {
    logout();
    // Clear cookies and redirect will be handled by the auth store
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">E</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Edzio
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={`relative ${
                        isActive 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-md -z-10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>

            {/* User Section */}
            <div className="flex items-center space-x-3">
              {displayName && (
                <span className="text-sm text-muted-foreground">
                  Welcome, {displayName}
                </span>
              )}
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <Link href="/auth/login">
                  <Button variant="outline" size="sm">
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">E</span>
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              Edzio
            </span>
          </Link>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col space-y-4 mt-8">
                {displayName && (
                  <div className="px-4 py-2 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      Welcome, {displayName}
                    </span>
                  </div>
                )}

                <div className="space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          size="sm"
                          className={`w-full justify-start ${
                            isActive 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                              : ''
                          }`}
                        >
                          <Icon className="w-4 h-4 mr-3" />
                          {item.label}
                        </Button>
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-4 border-t space-y-2">
                  {isAuthenticated ? (
                    <>
                      <Link href="/profile" onClick={() => setIsOpen(false)}>
                        <Button variant="ghost" size="sm" className="w-full justify-start">
                          <Settings className="w-4 h-4 mr-3" />
                          Profile
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start" 
                        onClick={() => {
                          handleLogout();
                          setIsOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <LogIn className="w-4 h-4 mr-3" />
                        Login
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Spacer for fixed navigation */}
      <div className="h-16 md:h-20" />
    </>
  );
}