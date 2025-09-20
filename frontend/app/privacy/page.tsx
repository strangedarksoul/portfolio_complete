import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy - Edzio\'s Portfolio',
  description: 'Privacy policy and data protection information for Edzio\'s portfolio website.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Link href="/">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Portfolio
            </Button>
          </Link>

          <div className="text-center mb-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-xl text-muted-foreground">
              Last updated: January 2024
            </p>
          </div>

          <Card>
            <CardContent className="p-8 prose prose-invert max-w-none">
              <h2>1. Information We Collect</h2>
              
              <h3>Personal Information</h3>
              <p>
                We collect information you provide directly to us, such as when you create an account, submit a hire request, or contact us. This may include:
              </p>
              <ul>
                <li>Name and contact information (email, phone number)</li>
                <li>Professional information (company, job title)</li>
                <li>Project requirements and preferences</li>
                <li>Communication preferences</li>
              </ul>

              <h3>Automatically Collected Information</h3>
              <p>
                We automatically collect certain information about your device and usage of our website:
              </p>
              <ul>
                <li>IP address and browser information</li>
                <li>Pages visited and time spent on pages</li>
                <li>Referral sources and search terms</li>
                <li>Device type and screen resolution</li>
              </ul>

              <h3>Local Storage</h3>
              <p>
                With your explicit consent, we store your name in your browser&apos;s local storage to personalize your experience across visits.
              </p>

              <h2>2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul>
                <li>Provide and improve our services</li>
                <li>Respond to your inquiries and requests</li>
                <li>Send you updates and notifications (with your consent)</li>
                <li>Analyze website usage and optimize user experience</li>
                <li>Generate AI-powered responses in our chatbot</li>
              </ul>

              <h2>3. AI Chatbot and Data Processing</h2>
              <p>
                Our AI chatbot processes your questions to provide relevant information about Edzio&apos;s work and capabilities. Chat conversations may be stored to improve the service and provide context for future interactions.
              </p>

              <h2>4. Information Sharing</h2>
              <p>
                We do not sell, trade, or otherwise transfer your personal information to third parties except:
              </p>
              <ul>
                <li>With your explicit consent</li>
                <li>To service providers who assist in operating our website</li>
                <li>When required by law or to protect our rights</li>
              </ul>

              <h2>5. Data Security</h2>
              <p>
                We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
              </p>

              <h2>6. Cookies and Tracking</h2>
              <p>
                We use cookies and similar technologies to enhance your browsing experience, analyze site traffic, and understand where our visitors are coming from.
              </p>

              <h2>7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul>
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate information</li>
                <li>Request deletion of your personal information</li>
                <li>Opt out of marketing communications</li>
                <li>Clear your locally stored name preference</li>
              </ul>

              <h2>8. Third-Party Services</h2>
              <p>
                Our website may contain links to third-party services (GitHub, LinkedIn, etc.). We are not responsible for the privacy practices of these external sites.
              </p>

              <h2>9. Children's Privacy</h2>
              <p>
                Our website is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>

              <h2>10. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page with an updated revision date.
              </p>

              <h2>11. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy, please contact us through our website's contact form or email.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}