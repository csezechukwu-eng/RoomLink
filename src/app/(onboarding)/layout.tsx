import Link from "next/link";
import { HelpCircle, ChevronDown } from "lucide-react";
import { RentaBedLogo } from "@/components/nav/Sidebar";

/**
 * Onboarding Layout
 *
 * Minimal full-screen chrome with just the renta bed wordmark and help link.
 * No dashboard sidebar — focused, calm experience.
 * Works for both landlord and tenant onboarding.
 */
export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* renta bed wordmark */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold text-slate-900">renta bed</span>
            <RentaBedLogo />
          </Link>

          {/* Help link and user menu */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
              Need help?
            </button>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                JD
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
