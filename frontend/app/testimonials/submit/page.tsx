import { TestimonialSubmissionForm } from '@/components/testimonials/testimonial-submission-form';

export const metadata = {
  title: 'Submit Testimonial - Edzio\'s Portfolio',
  description: 'Share your experience working with Edzio to help others understand the collaboration process.',
};

export default function SubmitTestimonialPage() {
  return (
    <div className="min-h-screen py-20 px-6">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Share Your Story
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your testimonial helps others understand what it&apos;s like to work together and the quality of results they can expect.
          </p>
        </div>

        <TestimonialSubmissionForm />
      </div>
    </div>
  );
}