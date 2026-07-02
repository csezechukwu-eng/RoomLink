import Link from "next/link";
import {
  BedDouble,
  MessageSquare,
  Wrench,
  FileText,
  ChevronRight,
  CheckCircle,
  Clock,
  Search,
  ClipboardList,
  AlertCircle,
  XCircle,
  Hourglass,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentTenantId } from "@/lib/auth";
import { getUser } from "@/lib/services/users";
import { getTenantReservation } from "@/lib/services/reservations";
import { getTenantApplications, type ApplicationWithRefs } from "@/lib/services/applications";
import { getTenantRent } from "@/lib/services/rent";
import { getTenantAnnouncements } from "@/lib/services/announcements";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TenantHomePage() {
  const tenantId = await getCurrentTenantId();
  const [userRes, reservationRes, applicationsRes, rentRes, annRes] = await Promise.all([
    getUser(tenantId),
    getTenantReservation(tenantId),
    getTenantApplications(tenantId),
    getTenantRent(tenantId),
    getTenantAnnouncements(tenantId),
  ]);

  const user = userRes.data;
  const name = user?.full_name?.split(" ")[0] ?? "there";
  const reservation = reservationRes.data;
  const applications = applicationsRes.data ?? [];
  const announcements = annRes.data ?? [];

  // Determine tenant status
  const hasActiveReservation = reservation && reservation.status === "active";
  const pendingApplications = applications.filter(
    (a) => a.status === "submitted" || a.status === "under_review" || a.status === "waitlisted"
  );
  const approvedApplications = applications.filter((a) => a.status === "approved");
  const hasApplications = applications.length > 0;

  // If no applications at all - show "Get Started" view
  if (!hasApplications && !hasActiveReservation) {
    return <NoApplicationsView name={name} />;
  }

  // If has pending applications but no active reservation - show application progress
  if (!hasActiveReservation && (pendingApplications.length > 0 || approvedApplications.length > 0)) {
    return (
      <ApplicationProgressView
        name={name}
        applications={applications}
        pendingCount={pendingApplications.length}
      />
    );
  }

  // If has only rejected/withdrawn applications and no reservation
  if (!hasActiveReservation) {
    return <NoApplicationsView name={name} previousApplications={applications} />;
  }

  // Has active reservation - show full dashboard
  const rentDue = (rentRes.data ?? []).filter(
    (c) => c.status === "due" || c.status === "overdue"
  );
  const rentDueTotal = rentDue.reduce((s, c) => s + Number(c.amount), 0);

  return (
    <ActiveTenantView
      name={name}
      reservation={reservation}
      rentDueTotal={rentDueTotal}
      rentDue={rentDue}
      announcements={announcements}
    />
  );
}

/**
 * View for tenants with no applications - encourages them to browse beds
 */
function NoApplicationsView({
  name,
  previousApplications,
}: {
  name: string;
  previousApplications?: ApplicationWithRefs[];
}) {
  const hasRejected = previousApplications?.some((a) => a.status === "rejected");

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {name}</h1>
        <Link href="/availability">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Search className="mr-2 h-4 w-4" />
            Browse Beds
          </Button>
        </Link>
      </div>

      {/* Get Started Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-center text-white">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
            <Search className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Find Your Perfect Bed</h2>
          <p className="text-indigo-100 mb-6 max-w-md mx-auto">
            {hasRejected
              ? "Don't worry - there are plenty more options! Browse available beds and submit a new application."
              : "Browse available beds in shared housing properties and submit your application to get started."}
          </p>
          <Link href="/availability">
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50">
              <Search className="mr-2 h-5 w-5" />
              Browse Available Beds
            </Button>
          </Link>
        </div>
      </Card>

      {/* How It Works */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">How It Works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <StepCard
            number={1}
            title="Browse Beds"
            description="Search for available beds that match your preferences and budget."
          />
          <StepCard
            number={2}
            title="Apply"
            description="Submit your application with your details and move-in date."
          />
          <StepCard
            number={3}
            title="Move In"
            description="Once approved, pay your deposit and move into your new home."
          />
        </div>
      </Card>

      {/* Previous Applications (if any) */}
      {previousApplications && previousApplications.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Previous Applications</h2>
          <div className="space-y-3">
            {previousApplications.slice(0, 3).map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 p-3"
              >
                <div>
                  <p className="font-medium text-slate-900">
                    {app.property_name}
                    {app.bed_label && ` - ${app.bed_label}`}
                  </p>
                  <p className="text-sm text-slate-500">
                    Applied {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/**
 * View for tenants with pending applications - shows progress
 */
function ApplicationProgressView({
  name,
  applications,
  pendingCount,
}: {
  name: string;
  applications: ApplicationWithRefs[];
  pendingCount: number;
}) {
  // Sort by most recent first
  const sortedApps = [...applications].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {name}</h1>
        <Link href="/availability">
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Search className="mr-2 h-4 w-4" />
            Browse Beds
          </Button>
        </Link>
      </div>

      {/* Status Overview */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Hourglass className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Application In Progress</h2>
              <p className="text-amber-100">
                You have {pendingCount} pending application{pendingCount !== 1 ? "s" : ""} being reviewed
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Applications List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Your Applications</h2>
          <Link
            href="/tenant/status"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            View All
          </Link>
        </div>

        <div className="space-y-4">
          {sortedApps.map((app) => (
            <ApplicationCard key={app.id} application={app} />
          ))}
        </div>
      </Card>

      {/* What's Next */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">What Happens Next?</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100">
              <Clock className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Application Review</p>
              <p className="text-sm text-slate-500">
                The property manager will review your application. This usually takes 1-3 business days.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <MessageSquare className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <p className="font-medium text-slate-900">You'll Be Notified</p>
              <p className="text-sm text-slate-500">
                We'll send you an email when there's an update on your application.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100">
              <CheckCircle className="h-4 w-4 text-slate-400" />
            </div>
            <div>
              <p className="font-medium text-slate-900">If Approved</p>
              <p className="text-sm text-slate-500">
                You'll be able to pay your deposit and sign your lease agreement.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Browse More */}
      <Card className="p-6 border-dashed">
        <div className="text-center">
          <p className="text-slate-600 mb-3">
            Want to increase your chances? Apply to multiple properties!
          </p>
          <Link href="/availability">
            <Button variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Browse More Beds
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

/**
 * View for tenants with an active reservation - full dashboard
 */
function ActiveTenantView({
  name,
  reservation,
  rentDueTotal,
  rentDue,
  announcements,
}: {
  name: string;
  reservation: NonNullable<Awaited<ReturnType<typeof getTenantReservation>>["data"]>;
  rentDueTotal: number;
  rentDue: { amount: number; status: string }[];
  announcements: { id: string; title: string; body: string; created_at: string }[];
}) {
  const rentAmount = rentDueTotal > 0 ? rentDueTotal : reservation.deposit_amount || 0;
  const depositPaid = reservation.deposit_status === "paid";

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Welcome, {name}</h1>
        <div className="flex items-center gap-3">
          <Link href="/availability">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              <Search className="mr-2 h-4 w-4" />
              Browse Beds
            </Button>
          </Link>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Top Row: Bed Info, Rent Due, Deposit */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Your Bed Card */}
        <Card className="overflow-hidden">
          <div className="p-5">
            <h2 className="text-sm font-medium text-slate-500">Your Bed</h2>
            <p className="mt-1 font-semibold text-slate-900">
              {reservation.room_name || "Room"} - {reservation.bed_label || "Bed"}
            </p>
            <p className="text-sm text-slate-500">{reservation.property_name}</p>
          </div>
          <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            <BedDouble className="h-12 w-12 text-slate-400" />
          </div>
          <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-between text-sm">
            <div>
              <p className="text-slate-500">Move-in Date</p>
              <p className="font-medium text-slate-900">
                {reservation.start_date
                  ? new Date(reservation.start_date).toLocaleDateString()
                  : "TBD"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Status</p>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                Active
              </span>
            </div>
          </div>
        </Card>

        {/* Rent Due Card */}
        <Card className="p-5">
          <h2 className="text-sm font-medium text-slate-500">Rent Due</h2>
          <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(rentAmount)}</p>
          <p className="mt-1 text-sm text-slate-500">
            {rentDue.length > 0 ? "Due this period" : "No rent due"}
          </p>
          <div className="mt-4 flex items-center gap-2">
            {rentDue.length === 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle className="h-3.5 w-3.5" />
                All Paid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                <Clock className="h-3.5 w-3.5" />
                Payment Due
              </span>
            )}
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
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {formatCurrency(reservation.deposit_amount || 0)}
          </p>
          <p className="mt-1 text-sm text-slate-500">Security Deposit</p>
          <div className="mt-4 flex items-center gap-2">
            {depositPaid ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <CheckCircle className="h-3.5 w-3.5" />
                Paid
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                <Clock className="h-3.5 w-3.5" />
                Unpaid
              </span>
            )}
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
          {announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.slice(0, 2).map((ann) => (
                <div key={ann.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-slate-900">{ann.title}</h3>
                    <span className="shrink-0 text-xs text-slate-400">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{ann.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No announcements yet.</p>
          )}
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

function StepCard({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-600">
        {number}
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function ApplicationCard({ application }: { application: ApplicationWithRefs }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">
            {application.property_name}
          </h3>
          {application.bed_label && (
            <p className="text-sm text-slate-500">
              {application.room_name && `${application.room_name} - `}
              {application.bed_label}
            </p>
          )}
        </div>
        <StatusBadge status={application.status} />
      </div>
      <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
        <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
        {application.monthly_rent && (
          <span>{formatCurrency(application.monthly_rent)}/mo</span>
        )}
      </div>
      {application.status === "submitted" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
          <Clock className="h-4 w-4" />
          <span>Awaiting review</span>
        </div>
      )}
      {application.status === "under_review" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
          <ClipboardList className="h-4 w-4" />
          <span>Being reviewed by property manager</span>
        </div>
      )}
      {application.status === "approved" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle className="h-4 w-4" />
          <span>Approved! Complete your move-in process.</span>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; icon: typeof CheckCircle }> = {
    submitted: { bg: "bg-amber-50", text: "text-amber-700", icon: Clock },
    under_review: { bg: "bg-blue-50", text: "text-blue-700", icon: ClipboardList },
    approved: { bg: "bg-emerald-50", text: "text-emerald-700", icon: CheckCircle },
    rejected: { bg: "bg-red-50", text: "text-red-700", icon: XCircle },
    waitlisted: { bg: "bg-purple-50", text: "text-purple-700", icon: Hourglass },
    withdrawn: { bg: "bg-slate-50", text: "text-slate-700", icon: AlertCircle },
  };

  const { bg, text, icon: Icon } = config[status] || config.submitted;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${bg} ${text}`}>
      <Icon className="h-3.5 w-3.5" />
      {status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
    </span>
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
