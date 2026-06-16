"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Mail, Phone, BedDouble, CalendarRange, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { StatusPill } from "@/components/StatusPill";
import { InlineActionButton } from "@/components/forms/InlineActionButton";
import { markDepositPaidAction } from "@/lib/actions/reservations";
import { setRentChargeStatusAction } from "@/lib/actions/rent";
import { DEPOSIT_STATUS_STYLES } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { formatShortDate } from "@/lib/bedAvailability";
import { moveInReadiness, readinessProgress } from "@/lib/tenantOps";
import type { RosterEntry } from "@/lib/services/tenants";

const RENT_BADGE: Record<RosterEntry["rentStatus"], { label: string; badge: string }> = {
  paid: { label: "Paid", badge: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20" },
  due: { label: "Rent due", badge: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20" },
  overdue: { label: "Overdue", badge: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20" },
  none: { label: "No charges", badge: "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-300" },
};

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface TenantRosterProps {
  entries: RosterEntry[];
  showProperty?: boolean;
  enableFilters?: boolean;
  limit?: number;
  viewAllHref?: string;
}

export function TenantRoster({
  entries,
  showProperty = false,
  enableFilters = false,
  limit,
  viewAllHref,
}: TenantRosterProps) {
  const [search, setSearch] = React.useState("");
  const [rentFilter, setRentFilter] = React.useState<"all" | "unpaid" | "overdue" | "paid">("all");
  const [selected, setSelected] = React.useState<RosterEntry | null>(null);

  const q = search.trim().toLowerCase();
  let filtered = entries.filter((e) => {
    if (q) {
      const hay = `${e.tenantName ?? ""} ${e.bedLabel ?? ""} ${e.roomName ?? ""} ${e.propertyName ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (rentFilter === "unpaid" && !(e.rentStatus === "due" || e.rentStatus === "overdue"))
      return false;
    if (rentFilter === "overdue" && e.rentStatus !== "overdue") return false;
    if (rentFilter === "paid" && e.rentStatus !== "paid") return false;
    return true;
  });

  const total = filtered.length;
  if (limit) filtered = filtered.slice(0, limit);

  return (
    <div className="space-y-3">
      {enableFilters && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search tenant, bed, property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "unpaid", "overdue", "paid"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setRentFilter(f)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                  rentFilter === f
                    ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="p-5 text-sm text-slate-500">
          {entries.length === 0
            ? "No tenants placed yet. Approve an application to create a reservation."
            : "No tenants match your filters."}
        </Card>
      ) : (
        <Card className="divide-y divide-slate-100">
          {filtered.map((e) => {
            const ready = readinessProgress(e);
            const rent = RENT_BADGE[e.rentStatus];
            const lease = [formatShortDate(e.startDate), formatShortDate(e.endDate)]
              .filter(Boolean)
              .join(" → ");
            return (
              <button
                key={e.reservationId}
                type="button"
                onClick={() => setSelected(e)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">
                  {initials(e.tenantName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-slate-900">
                      {e.tenantName ?? "Unknown tenant"}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${rent.badge}`}>
                      {rent.label}
                    </span>
                    <StatusPill tone={DEPOSIT_STATUS_STYLES[e.depositStatus]} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {[
                      showProperty ? e.propertyName : null,
                      [e.roomName, e.bedLabel].filter(Boolean).join(" · "),
                      lease || null,
                    ]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </p>
                </div>
                <div className="hidden shrink-0 items-center gap-2 sm:flex">
                  <ReadinessPips done={ready.done} total={ready.total} />
                  <ArrowRight className="h-4 w-4 text-slate-300" />
                </div>
              </button>
            );
          })}
        </Card>
      )}

      {limit && total > limit && viewAllHref && (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all {total} tenants
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      <TenantDetailModal
        entry={selected}
        showProperty={showProperty}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}

function ReadinessPips({ done, total }: { done: number; total: number }) {
  return (
    <span className="flex items-center gap-1.5" title={`${done}/${total} move-in steps done`}>
      <span className="flex gap-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${i < done ? "bg-emerald-500" : "bg-slate-200"}`}
          />
        ))}
      </span>
      <span className="text-xs font-medium text-slate-400">{done}/{total}</span>
    </span>
  );
}

function TenantDetailModal({
  entry,
  showProperty,
  onClose,
}: {
  entry: RosterEntry | null;
  showProperty: boolean;
  onClose: () => void;
}) {
  if (!entry) return null;
  const readiness = moveInReadiness(entry);
  const lease = [formatShortDate(entry.startDate), formatShortDate(entry.endDate)]
    .filter(Boolean)
    .join(" → ");
  const reminderHref = entry.tenantEmail
    ? `mailto:${entry.tenantEmail}?subject=${encodeURIComponent(
        "Rent reminder"
      )}&body=${encodeURIComponent(
        `Hi ${entry.tenantName ?? "there"}, this is a friendly reminder about your rent.`
      )}`
    : undefined;

  return (
    <Modal open={Boolean(entry)} onClose={onClose} title={entry.tenantName ?? "Tenant"}>
      <div className="space-y-5">
        {/* Contact */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {entry.tenantEmail && (
            <a href={`mailto:${entry.tenantEmail}`} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-indigo-600">
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              {entry.tenantEmail}
            </a>
          )}
          {entry.tenantPhone && (
            <a href={`tel:${entry.tenantPhone}`} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-indigo-600">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              {entry.tenantPhone}
            </a>
          )}
        </div>

        {/* Placement */}
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
          <Field icon={<BedDouble className="h-3.5 w-3.5" />} label="Bed">
            {[showProperty ? entry.propertyName : null, entry.roomName, entry.bedLabel]
              .filter(Boolean)
              .join(" · ") || "—"}
          </Field>
          <Field icon={<CalendarRange className="h-3.5 w-3.5" />} label="Lease">
            {lease || "—"}
          </Field>
        </div>

        {/* Move-in readiness */}
        <section>
          <h3 className="text-sm font-semibold text-slate-900">Move-in readiness</h3>
          <ul className="mt-2 space-y-1.5">
            {readiness.map((item) => (
              <li key={item.key} className="flex items-center gap-2 text-sm">
                <span
                  className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                    item.done ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {item.done ? "✓" : ""}
                </span>
                <span className={item.done ? "text-slate-600" : "text-slate-500"}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Deposit */}
        <section className="flex items-center justify-between">
          <div className="text-sm">
            <p className="font-semibold text-slate-900">Deposit</p>
            <p className="text-slate-500">
              {formatCurrency(entry.depositAmount)} · <span className="capitalize">{entry.depositStatus}</span>
            </p>
          </div>
          {entry.depositStatus === "unpaid" && (
            <InlineActionButton
              action={markDepositPaidAction}
              fields={{ id: entry.reservationId }}
              variant="outline"
              pendingLabel="Saving..."
              onDone={onClose}
            >
              Mark deposit paid
            </InlineActionButton>
          )}
        </section>

        {/* Rent ledger */}
        <section>
          <h3 className="text-sm font-semibold text-slate-900">Rent</h3>
          {entry.charges.length === 0 ? (
            <p className="mt-1 text-sm text-slate-500">No rent charges yet.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100 rounded-lg border border-slate-200">
              {entry.charges.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div>
                    <span className="font-medium text-slate-900">{formatCurrency(c.amount)}</span>
                    {c.due_date && (
                      <span className="ml-2 text-xs text-slate-500">
                        due {formatShortDate(c.due_date)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                      c.status === "paid"
                        ? "bg-emerald-50 text-emerald-700"
                        : c.status === "overdue"
                        ? "bg-red-50 text-red-700"
                        : c.status === "waived"
                        ? "bg-slate-100 text-slate-500"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {c.status}
                    </span>
                    {c.status !== "paid" && c.status !== "waived" && (
                      <InlineActionButton
                        action={setRentChargeStatusAction}
                        fields={{ id: c.id, status: "paid" }}
                        variant="ghost"
                        pendingLabel="..."
                        onDone={onClose}
                      >
                        Mark paid
                      </InlineActionButton>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
          <Link
            href="/dashboard/messages"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Mail className="h-4 w-4" />
            Message
          </Link>
          {reminderHref && (
            <a
              href={reminderHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Send reminder
            </a>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="flex items-center gap-1 text-xs font-medium text-slate-400">
        <span className="text-slate-400">{icon}</span>
        {label}
      </p>
      <p className="mt-0.5 text-slate-700">{children}</p>
    </div>
  );
}
