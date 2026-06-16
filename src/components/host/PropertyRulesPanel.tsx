import { ScrollText, StickyNote, Info } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Property } from "@/lib/types";

/**
 * House rules / check-in info + internal notes placeholder.
 * Renders stored `house_rules`/`description`; otherwise a calm placeholder.
 * No schema is added — extra check-in fields (wifi, parking, etc.) are noted
 * as a future enhancement rather than faked.
 */
export function PropertyRulesPanel({ property }: { property: Property }) {
  const hasRules = Boolean(property.house_rules);
  const hasAbout = Boolean(property.description);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* House rules / check-in */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          House Rules &amp; Check-in Info
        </h2>
        {hasRules || hasAbout ? (
          <div className="space-y-4">
            {hasAbout && (
              <Card className="p-5">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  <Info className="h-4 w-4 text-slate-400" />
                  About
                </h3>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                  {property.description}
                </p>
              </Card>
            )}
            {hasRules && (
              <Card className="p-5">
                <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                  <ScrollText className="h-4 w-4 text-slate-400" />
                  House rules
                </h3>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                  {property.house_rules}
                </p>
              </Card>
            )}
          </div>
        ) : (
          <Card className="flex items-start gap-3 p-5">
            <ScrollText className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
            <p className="text-sm text-slate-500">
              Add house rules and check-in details (parking, Wi-Fi, quiet hours,
              check-in/out, emergency contact) later from{" "}
              <span className="font-medium text-slate-700">Edit Property</span>.
            </p>
          </Card>
        )}
      </section>

      {/* Messages & notes placeholder */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Messages &amp; Notes
        </h2>
        <Card className="flex items-start gap-3 p-5">
          <StickyNote className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-500">
            Internal notes coming soon. Tenant conversations stay private in{" "}
            <span className="font-medium text-slate-700">Messages</span>.
          </p>
        </Card>
      </section>
    </div>
  );
}
