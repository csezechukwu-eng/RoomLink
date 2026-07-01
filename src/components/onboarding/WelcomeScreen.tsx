"use client";

import { User, Shield, CreditCard, Home, Camera, Rocket, Clock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

/**
 * WelcomeScreen
 *
 * First step of onboarding - value framing and what to expect.
 */
export function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Hero */}
      <div className="mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-4">
          <Rocket className="h-8 w-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          Welcome to renta bed
        </h1>
        <p className="text-lg text-slate-600">
          Let&apos;s get your listing ready for tenants. This takes about 10-12 minutes.
        </p>
      </div>

      {/* Time estimate */}
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-8">
        <Clock className="h-4 w-4" />
        <span>~10-12 minutes for the basics</span>
      </div>

      {/* What you'll set up */}
      <div className="text-left bg-slate-50 rounded-xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-slate-900 mb-4 text-center">
          What you&apos;ll set up
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StepPreview
            icon={<User className="h-5 w-5" />}
            title="Account"
            description="Your profile and contact info"
          />
          <StepPreview
            icon={<Shield className="h-5 w-5" />}
            title="Identity"
            description="Verify who you are"
          />
          <StepPreview
            icon={<CreditCard className="h-5 w-5" />}
            title="Payouts"
            description="How you get paid"
          />
          <StepPreview
            icon={<Home className="h-5 w-5" />}
            title="Property"
            description="Describe your space"
          />
          <StepPreview
            icon={<Camera className="h-5 w-5" />}
            title="Listing"
            description="Photos and details"
          />
          <StepPreview
            icon={<Rocket className="h-5 w-5" />}
            title="Publish"
            description="Go live on renta bed"
          />
        </div>
      </div>

      {/* Save & finish later */}
      <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-8">
        <Save className="h-4 w-4" />
        <span>You can save and finish later at any time</span>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button onClick={onGetStarted} className="px-8">
          Get started
        </Button>
      </div>
    </div>
  );
}

function StepPreview({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white border border-slate-200">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}
