import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getProperties } from "@/lib/queries";
import { ApplicationFormPreview } from "./ApplicationFormPreview";

export const dynamic = "force-dynamic";

export default async function ApplicationPreviewPage() {
  const propertiesResult = await getProperties();
  const properties = propertiesResult.data ?? [];

  // Get the first property with rooms for the preview
  const firstProperty = properties[0];

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/applications"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Applications
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Application Form Preview</h1>
        <p className="text-slate-500">
          This is what tenants see when they apply for a bed at your property.
        </p>
      </div>

      <Card className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-4">
        <p className="text-center text-sm text-indigo-600">
          Preview Mode - This form is for demonstration purposes only
        </p>
      </Card>

      {firstProperty ? (
        <ApplicationFormPreview property={firstProperty} />
      ) : (
        <Card className="p-8 text-center">
          <p className="text-slate-500">
            Create a property first to see the application form preview.
          </p>
        </Card>
      )}
    </div>
  );
}
