import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { MainLayout } from '@/components/layout/main-layout';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Edzio's Portfolio - Full-Stack Developer & AI Enthusiast",
  description: 'Cinematic AI-driven portfolio showcasing full-stack development expertise, innovative projects, and AI-powered solutions.',
  keywords: 'full-stack developer, AI, machine learning, web development, portfolio, Django, React, Next.js',
  authors: [{ name: 'Edzio' }],
  openGraph: {
    title: "Edzio's Portfolio",
    description: 'Cinematic AI-driven portfolio showcasing full-stack development expertise',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <MainLayout>{children}</MainLayout>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
