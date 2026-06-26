import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar } from "lucide-react";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApplicationForm } from "@/components/forms/ApplicationForm";
import { getBedForApplication, getAvailabilityDetail } from "@/lib/services/availability";
import { labelForBunkType } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ApplyPage({
  params,
}: {
  params: Promise<{ bedId: string }>;
}) {
  const { bedId } = await params;
  const result = await getBedForApplication(bedId);

  if (result.error !== null) {
    return <ErrorState title="Couldn't load this bed" message={result.error} />;
  }
  if (!result.data) notFound();

  const { bed, property, room } = result.data;

  // Get full property details with all rooms for the form
  const detailResult = await getAvailabilityDetail(property.id);
  const rooms = detailResult.data?.rooms ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={`/availability/${property.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {property.name}
      </Link>

      {/* Bed Summary Card */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Request Monthly Stay</h1>
            <p className="mt-1 text-sm text-slate-500">
              {bed.label} · {property.name} · {room?.name || "Room TBD"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">{labelForBunkType(bed.bunk_type)}</p>
            <p className="font-semibold text-slate-900">
              {formatCurrency(bed.monthly_rent)}/mo · {formatCurrency(bed.deposit_amount)} deposit
            </p>
          </div>
        </div>
      </Card>

      {/* Monthly Stay Notice */}
      <div className="flex items-start gap-3 rounded-lg border border-indigo-200 bg-indigo-50 p-4">
        <Calendar className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-indigo-900">Monthly Stay Booking</p>
          <p className="text-sm text-indigo-700">
            Room Link is built for monthly stays. The minimum booking period is 30 days.
            Rent is collected monthly.
          </p>
        </div>
      </div>

      {bed.status === "vacant" ? (
        <ApplicationForm
          property={property}
          rooms={rooms}
          selectedBedId={bed.id}
        />
      ) : (
        <EmptyState
          title="This bed is no longer available"
          description="It was just reserved or filled. Browse other open beds at this property."
          action={
            <Link href={`/availability/${property.id}`}>
              <Button variant="outline">See other beds</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}
