import { redirect } from "next/navigation";
import { TenantNav } from "@/components/nav/TenantNav";
import { getCurrentUser, isDemoMode } from "@/lib/auth";
import { getServiceClient, isServiceRoleConfigured } from "@/lib/supabase/server";

/**
 * Tenant Layout with Onboarding Guard
 *
 * Checks if the current tenant has completed onboarding.
 * If not, redirects them to the tenant onboarding flow.
 */
export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Skip onboarding check in demo mode
  if (!isDemoMode()) {
    const user = await getCurrentUser();

    if (!user) {
      redirect("/signin");
    }

    // Check onboarding status
    if (isServiceRoleConfigured()) {
      const supabase = getServiceClient();

      const { data: userData, error } = await supabase
        .from("users")
        .select("id, tenant_onboarding_completed_at")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("[TenantLayout] User fetch error:", error);
        // On error, redirect to onboarding to be safe
        redirect("/onboarding/tenant");
      }

      // If no user row or onboarding not complete, redirect to onboarding
      if (!userData || !userData.tenant_onboarding_completed_at) {
        redirect("/onboarding/tenant");
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <TenantNav />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
