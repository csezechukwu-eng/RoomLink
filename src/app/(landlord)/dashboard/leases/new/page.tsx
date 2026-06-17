import { PageHeader } from "@/components/PageHeader";
import { ErrorState } from "@/components/ErrorState";
import { getProperties } from "@/lib/queries";
import { getSignature } from "@/lib/actions/signature";
import { SendLeaseForm } from "./SendLeaseForm";

export const dynamic = "force-dynamic";

export default async function NewLeasePage() {
  const propertiesResult = await getProperties();
  if (propertiesResult.error !== null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Send Lease" />
        <ErrorState title="Couldn't load properties" message={propertiesResult.error} />
      </div>
    );
  }

  // Check if landlord has set up their signature
  const signature = await getSignature();
  const hasSignature = Boolean(signature);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send Lease"
        description="Create and send a lease agreement for e-signature"
      />
      <SendLeaseForm
        properties={propertiesResult.data}
        hasSignature={hasSignature}
      />
    </div>
  );
}
