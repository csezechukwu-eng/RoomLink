import { redirect } from "next/navigation";
import { LandlordNav } from "@/components/nav/LandlordNav";
import { getCurrentUser, isDemoMode } from "@/lib/auth";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/server";

/**
 * Landlord Layout with Onboarding Guard
 *
 * Checks if the current landlord has completed onboarding.
 * If not, redirects them to the onboarding flow.
 */
export default async function LandlordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Skip onboarding check in demo mode
  if (!isDemoMode()) {
    const user = await getCurrentUser();

    if (!user) {
      redirect("/login");
    }

    // Check onboarding status
    if (isServiceRoleConfigured()) {
      const supabase = getServiceClient();

      const { data: userData, error } = await supabase
        .from("users")
        .select("id, onboarding_completed_at")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[LandlordLayout] User fetch error:", error);
        // On error, redirect to onboarding to be safe
        redirect("/onboarding/landlord");
      }

      // If no user row or onboarding not complete, redirect to onboarding
      if (!userData || !userData.onboarding_completed_at) {
        redirect("/onboarding/landlord");
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <LandlordNav />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
