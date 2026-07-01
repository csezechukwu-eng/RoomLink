import { PageHeader } from "@/components/PageHeader";
import { checkFullDemoReadiness } from "@/lib/services/demo";
import { DemoTestCenter } from "./DemoTestCenter";
import type { FullDemoReadinessResult } from "@/lib/services/demo";

export const dynamic = "force-dynamic";

export default async function DemoPage() {
  let readinessData: FullDemoReadinessResult | null = null;
  let readinessError: string | null = null;

  try {
    const readinessResult = await checkFullDemoReadiness();
    readinessData = readinessResult.data ?? null;
    readinessError = readinessResult.error;
  } catch (e) {
    // Handle any unexpected errors gracefully
    readinessError = e instanceof Error ? e.message : "Failed to check demo readiness";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Demo Test Center"
        description="Create safe test records to test renta bed from application to lease signing."
      />

      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        <strong>For testing only.</strong> Creates sample data for your landlord
        account. Demo data is clearly marked and can be reset at any time.
      </div>

      <DemoTestCenter
        initialReadiness={readinessData}
        initialError={readinessError}
      />
    </div>
  );
}
