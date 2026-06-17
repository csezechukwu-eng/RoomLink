import Link from "next/link";
import { Plus, FileSignature, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { getCurrentOwnerId } from "@/lib/auth";
import { getServiceClient } from "@/lib/supabase/server";
import { LeaseCard } from "./LeaseCard";
import type { Lease } from "@/lib/types";

export const dynamic = "force-dynamic";

interface LeaseWithProperty extends Lease {
  property_name: string | null;
}

async function getLeases(): Promise<LeaseWithProperty[]> {
  const ownerId = await getCurrentOwnerId();
  const supabase = getServiceClient();

  // Get all properties for this owner
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name")
    .eq("owner_id", ownerId);

  if (!properties || properties.length === 0) return [];

  const propertyIds = properties.map((p) => p.id);
  const propName = new Map(properties.map((p) => [p.id, p.name]));

  // Get all leases for these properties
  const { data: leases } = await supabase
    .from("leases")
    .select("*")
    .in("property_id", propertyIds)
    .order("created_at", { ascending: false });

  return (leases ?? []).map((l) => ({
    ...(l as Lease),
    property_name: propName.get(l.property_id) ?? null,
  }));
}


export default async function LeasesPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  let leases: LeaseWithProperty[] = [];
  let error: string | null = null;

  try {
    leases = await getLeases();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load leases";
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Leases" />
        <ErrorState title="Couldn't load leases" message={error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leases"
        description="Manage and send lease agreements for e-signature"
        actions={
          <Link href="/dashboard/leases/new">
            <Button>
              <Plus className="mr-1.5 h-4 w-4" />
              Send New Lease
            </Button>
          </Link>
        }
      />

      {sent && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Lease sent for signature!</span>
        </div>
      )}

      {leases.length === 0 ? (
        <EmptyState
          icon={<FileSignature className="h-5 w-5" />}
          title="No leases yet"
          description="Send your first lease agreement for e-signature."
          action={
            <Link href="/dashboard/leases/new">
              <Button>
                <Plus className="mr-1.5 h-4 w-4" />
                Send New Lease
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {leases.map((lease) => (
            <LeaseCard key={lease.id} lease={lease} />
          ))}
        </div>
      )}
    </div>
  );
}
