import { Wrench } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { MaintenanceCard } from "@/components/maintenance/MaintenanceCard";
import { TenantMaintenanceForm } from "@/components/forms/TenantMaintenanceForm";
import { getCurrentTenantId } from "@/lib/auth";
import { getTenantMaintenance } from "@/lib/services/maintenance";
import { getTenantThread } from "@/lib/services/messages";

export const dynamic = "force-dynamic";

export default async function TenantMaintenancePage() {
  const tenantId = await getCurrentTenantId();
  const [listResult, threadResult] = await Promise.all([
    getTenantMaintenance(tenantId),
    getTenantThread(tenantId), // resolves the tenant's property
  ]);

  if (listResult.error !== null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Maintenance" />
        <ErrorState title="Couldn't load requests" message={listResult.error} />
      </div>
    );
  }

  const propertyId = threadResult.data?.propertyId ?? null;
  const requests = listResult.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Report issues and track their status."
        actions={
          propertyId ? <TenantMaintenanceForm propertyId={propertyId} /> : undefined
        }
      />

      {!propertyId ? (
        <EmptyState
          icon={<Wrench className="h-5 w-5" />}
          title="No property linked yet"
          description="Once you're approved for a bed you can submit maintenance requests here."
        />
      ) : requests.length === 0 ? (
        <EmptyState
          icon={<Wrench className="h-5 w-5" />}
          title="No requests yet"
          description="Reported an issue? Submit a request and your host will see it."
          action={<TenantMaintenanceForm propertyId={propertyId} />}
        />
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <MaintenanceCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </div>
  );
}
