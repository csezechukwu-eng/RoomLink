import Link from "next/link";
import {
  BedDouble,
  MessageSquare,
  Wrench,
  FileText,
  ChevronRight,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentTenantId } from "@/lib/auth";
import { getUser } from "@/lib/services/users";
import { getTenantReservation } from "@/lib/services/reservations";
import { getTenantRent } from "@/lib/services/rent";
import { getTenantAnnouncements } from "@/lib/services/announcements";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TenantHomePage() {
  const tenantId = await getCurrentTenantId();
  const [userRes, reservationRes, rentRes, annRes] = await Promise.all([
    getUser(tenantId),
    getTenantReservation(tenantId),
    getTenantRent(tenantId),
    getTenantAnnouncements(tenantId),
  ]);

  const name = userRes.data?.full_name?.split(" ")[0] ?? "John";
  const reservation = reservationRes.data;
  const rentDue = (rentRes.data ?? []).filter(
    (c) => c.status === "due" || c.status === "overdue"
  );
  const rentDueTotal = rentDue.reduce((s, c) => s + Number(c.amount), 0);
  const announcements = annRes.data ?? [];

  // Demo data
  const bedInfo = {
    property: "Charlotte Flight Crew Crash Pad",
    room: "Room A",
    bed: "Bed A4",
    type: "Bottom Bunk",
    moveIn: "July 15, 2024",
    status: "Reserved",
  };

  const rentAmount = 650;
  const depositAmount = 150;
  const rentDueDate = "July 1, 2024";

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome, {name}</h1>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
          {name.charAt(0)}
        </div>
      </div>

      {/* Top Row: Bed Info, Rent Due, Deposit */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Your Bed Card */}
        <Card className="overflow-hidden">
          <div className="p-5">
            <h2 className="text-sm font-medium text-slate-500">Your Bed</h2>
            <p className="mt-1 font-semibold text-slate-900">{bedInfo.room} - {bedInfo.bed}</p>
            <p className="text-sm text-slate-500">{bedInfo.type}</p>
          </div>
          <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <BedDouble className="h-12 w-12 text-slate-400" />
          </div>
          <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between text-sm">
            <div>
              <p className="text-slate-500">Move-in Date</p>
              <p className="font-medium text-slate-900">{bedInfo.moveIn}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Status</p>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                {bedInfo.status}
              </span>
            </div>
          </div>
        </Card>

        {/* Rent Due Card */}
        <Card className="p-5">
          <h2 className="text-sm font-medium text-slate-500">Rent Due</h2>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(rentAmount)}</p>
          <p className="mt-1 text-sm text-slate-500">Due {rentDueDate}</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5" />
              Paid
            </span>
          </div>
          <Link href="/tenant/rent">
            <Button variant="outline" size="sm" className="mt-4 w-full">
              View Payment History
            </Button>
          </Link>
        </Card>

        {/* Deposit Card */}
        <Card className="p-5">
          <h2 className="text-sm font-medium text-slate-500">Deposit</h2>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(depositAmount)}</p>
          <p className="mt-1 text-sm text-slate-500">One-time Deposit</p>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle className="h-3.5 w-3.5" />
              Paid
            </span>
          </div>
        </Card>
      </div>

      {/* Bottom Row: Announcements and Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Announcements */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Announcements</h2>
            <Link href="/tenant/announcements" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              See All
            </Link>
          </div>
          <div className="space-y-4">
            <AnnouncementItem
              title="House Inspection"
              description="The management will be inspecting common areas this Friday at 10 AM."
              time="2 hours ago"
            />
            <AnnouncementItem
              title="Laundry Room Update"
              description="New washer and dryer installed. Please keep the area clean."
              time="Yesterday"
            />
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <QuickActionButton
              href="/tenant/messages"
              icon={<MessageSquare className="h-4 w-4" />}
              label="Message Manager"
            />
            <QuickActionButton
              href="/tenant/maintenance"
              icon={<Wrench className="h-4 w-4" />}
              label="Submit Maintenance Request"
            />
            <QuickActionButton
              href="/tenant/documents"
              icon={<FileText className="h-4 w-4" />}
              label="View House Rules"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function AnnouncementItem({
  title,
  description,
  time,
}: {
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-slate-900">{title}</h3>
        <span className="shrink-0 text-xs text-slate-400">{time}</span>
      </div>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}

function QuickActionButton({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
    >
      <span className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          {icon}
        </span>
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-slate-400" />
    </Link>
  );
}
