import { Megaphone } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Card } from "@/components/ui/card";
import { getCurrentTenantId } from "@/lib/auth";
import { getTenantAnnouncements } from "@/lib/services/announcements";

export const dynamic = "force-dynamic";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function TenantAnnouncementsPage() {
  const tenantId = await getCurrentTenantId();
  const result = await getTenantAnnouncements(tenantId);

  if (result.error !== null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Announcements" />
        <ErrorState title="Couldn't load announcements" message={result.error} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Updates from your host."
      />

      {result.data.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="h-5 w-5" />}
          title="No announcements"
          description="When your host posts an update, you'll see it here."
        />
      ) : (
        <div className="space-y-4">
          {result.data.map((a) => (
            <Card key={a.id} className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{a.title}</h3>
                <span className="text-xs text-slate-400">
                  {formatDate(a.created_at)}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                {a.body}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
