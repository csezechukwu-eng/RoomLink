import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ templateId: string }>;
}

/**
 * Redirect from the old /fields route to the new /designer route.
 * This ensures any existing bookmarks or links still work.
 */
export default async function FieldSetupPage({ params }: PageProps) {
  const { templateId } = await params;
  redirect(`/dashboard/leases/templates/${templateId}/designer`);
}
