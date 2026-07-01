"use client";

import {
  Unlock,
  Search,
  MessageSquare,
  Wrench,
  DollarSign,
  FileText,
  ShieldCheck,
} from "lucide-react";

/**
 * WhatYouUnlockPanel
 *
 * Right sidebar showing benefits of completing tenant onboarding.
 */
export function WhatYouUnlockPanel() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Unlock className="h-5 w-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-900">What you&apos;ll unlock</h3>
      </div>

      {/* Benefits List */}
      <div className="space-y-4">
        <BenefitItem
          icon={<Search className="h-5 w-5" />}
          title="Browse & apply for beds"
          description="View live availability and submit applications instantly."
        />
        <BenefitItem
          icon={<MessageSquare className="h-5 w-5" />}
          title="Message your landlord"
          description="Communicate easily with your landlord and housemates."
        />
        <BenefitItem
          icon={<Wrench className="h-5 w-5" />}
          title="Submit maintenance requests"
          description="Report issues and track updates in one place."
        />
        <BenefitItem
          icon={<DollarSign className="h-5 w-5" />}
          title="Track your rent"
          description="View payment history and upcoming due dates."
        />
        <BenefitItem
          icon={<FileText className="h-5 w-5" />}
          title="Review agreements"
          description="Access and sign your lease and important documents."
        />
      </div>

      {/* Security Note */}
      <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-slate-900">Your information is secure</p>
          <p className="text-xs text-slate-500">
            We use bank-level encryption to keep your data safe and private.
          </p>
        </div>
      </div>
    </div>
  );
}

function BenefitItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  );
}
