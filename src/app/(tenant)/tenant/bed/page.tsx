import Link from "next/link";
import {
  BedDouble,
  Calendar,
  Clock,
  Home,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentTenantId } from "@/lib/auth";
import { getTenantReservation } from "@/lib/services/reservations";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MyBedPage() {
  const tenantId = await getCurrentTenantId();
  const reservationRes = await getTenantReservation(tenantId);
  const reservation = reservationRes.data;

  // No active reservation
  if (!reservation) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Bed</h1>
          <p className="text-slate-500">View details about your current accommodation</p>
        </div>

        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <BedDouble className="h-8 w-8 text-slate-400" />
          </div>
          <h2 className="mt-6 text-xl font-semibold text-slate-900">
            No Active Reservation
          </h2>
          <p className="mt-2 max-w-md text-slate-500">
            You don&apos;t have an active bed reservation yet. Browse available beds to find your perfect spot.
          </p>
          <Link href="/availability">
            <Button className="mt-6">
              Browse Available Beds
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const statusColors = {
    active: "bg-emerald-50 text-emerald-700",
    pending: "bg-amber-50 text-amber-700",
    expired: "bg-slate-100 text-slate-600",
    cancelled: "bg-red-50 text-red-700",
  };

  const statusColor = statusColors[reservation.status as keyof typeof statusColors] || statusColors.pending;
  const depositPaid = reservation.deposit_status === "paid";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Bed</h1>
        <p className="text-slate-500">View details about your current accommodation</p>
      </div>

      {/* Main Bed Info Card */}
      <Card className="overflow-hidden">
        {/* Property Image Placeholder */}
        <div className="h-48 bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center">
          <Home className="h-16 w-16 text-indigo-300" />
        </div>

        <div className="p-6 space-y-6">
          {/* Property Name & Status */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                {reservation.property_name || "Your Bed"}
              </h2>
              <p className="mt-1 text-slate-500">
                {reservation.room_name || "Room"} - {reservation.bed_label || "Bed"}
              </p>
            </div>
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium capitalize ${statusColor}`}>
              {reservation.status}
            </span>
          </div>

          {/* Bed Details Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard
              icon={<BedDouble className="h-5 w-5" />}
              label="Room & Bed"
              value={`${reservation.room_name || "Room"} - ${reservation.bed_label || "Bed"}`}
            />
            <InfoCard
              icon={<Calendar className="h-5 w-5" />}
              label="Move-in Date"
              value={reservation.start_date ? new Date(reservation.start_date).toLocaleDateString() : "TBD"}
            />
            <InfoCard
              icon={<Clock className="h-5 w-5" />}
              label="Duration"
              value={reservation.end_date ? `Until ${new Date(reservation.end_date).toLocaleDateString()}` : "Month-to-month"}
            />
          </div>
        </div>
      </Card>

      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Deposit Status */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
              depositPaid ? "bg-emerald-100" : "bg-amber-100"
            }`}>
              {depositPaid ? (
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Deposit</p>
              <p className="font-semibold text-slate-900">
                {depositPaid ? "Paid" : "Pending"}
              </p>
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {formatCurrency(reservation.deposit_amount || 0)}
          </p>
        </Card>

        {/* Rent Payments */}
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
              <DollarSign className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Rent Payments</p>
              <p className="font-semibold text-slate-900">View History</p>
            </div>
          </div>
          <Link href="/tenant/rent">
            <Button variant="outline" size="sm" className="mt-3 w-full">
              View Payments
            </Button>
          </Link>
        </Card>
      </div>

      {/* Quick Links */}
      <Card className="p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Quick Links</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <QuickLink href="/tenant/messages" label="Message Host" />
          <QuickLink href="/tenant/maintenance" label="Submit Maintenance Request" />
          <QuickLink href="/tenant/documents" label="View Lease & Documents" />
          <QuickLink href="/tenant/announcements" label="Property Announcements" />
        </div>
      </Card>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-indigo-600">
        {icon}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
    >
      {label}
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </Link>
  );
}
