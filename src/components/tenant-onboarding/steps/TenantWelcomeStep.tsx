"use client";

import { BedDouble, User, Home, Shield, CreditCard, MessageSquare, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TenantWelcomeStepProps {
  onGetStarted: () => void;
}

/**
 * TenantWelcomeStep
 *
 * First step of tenant onboarding - welcome and overview.
 */
export function TenantWelcomeStep({ onGetStarted }: TenantWelcomeStepProps) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      {/* Hero */}
      <div className="mb-8">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-4">
          <BedDouble className="h-8 w-8 text-indigo-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
          Welcome to renta bed
        </h1>
        <p className="text-lg text-slate-600">
          Let&apos;s get you set up so you can find your perfect place.
        </p>
      </div>

      {/* What you'll set up */}
      <div className="text-left bg-slate-50 rounded-xl p-6 mb-8">
        <h2 className="text-sm font-semibold text-slate-900 mb-4 text-center">
          What we&apos;ll cover
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <StepPreview
            icon={<User className="h-5 w-5" />}
            title="Basic Info"
            description="Tell us about yourself"
          />
          <StepPreview
            icon={<Home className="h-5 w-5" />}
            title="Housing Preferences"
            description="What you're looking for"
          />
          <StepPreview
            icon={<Shield className="h-5 w-5" />}
            title="ID Verification"
            description="Verify your identity"
          />
          <StepPreview
            icon={<CreditCard className="h-5 w-5" />}
            title="Payment Method"
            description="Set up how you'll pay"
          />
          <StepPreview
            icon={<MessageSquare className="h-5 w-5" />}
            title="Messaging & Rules"
            description="Stay connected"
          />
          <StepPreview
            icon={<CheckCircle className="h-5 w-5" />}
            title="Review & Finish"
            description="Confirm and complete"
          />
        </div>
      </div>

      {/* CTA */}
      <Button onClick={onGetStarted} size="md" className="px-8">
        Get Started
      </Button>
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
