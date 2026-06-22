"use client";

import * as React from "react";
import { Send, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { SentLeaseCard } from "@/components/host/SentLeaseCard";
import type { PreparedLeaseWithDetails } from "@/lib/types";

interface SentLeasesSectionProps {
  leases: PreparedLeaseWithDetails[];
  fieldCountMap: Map<string, number>;
}

export function SentLeasesSection({
  leases,
  fieldCountMap,
}: SentLeasesSectionProps) {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredLeases = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return leases;
    }

    const query = searchQuery.toLowerCase();
    return leases.filter((lease) => {
      // Search by lease reference number
      if (lease.lease_reference_number?.toLowerCase().includes(query)) {
        return true;
      }
      // Search by applicant name
      const applicantName =
        lease.applicant_name ||
        lease.applicant_snapshot?.name ||
        "";
      if (applicantName.toLowerCase().includes(query)) {
        return true;
      }
      // Search by applicant email
      if (lease.applicant_snapshot?.email?.toLowerCase().includes(query)) {
        return true;
      }
      // Search by property name
      const propertyName =
        lease.property_name ||
        lease.property_snapshot?.name ||
        "";
      if (propertyName.toLowerCase().includes(query)) {
        return true;
      }
      return false;
    });
  }, [leases, searchQuery]);

  if (leases.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Send className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Sent Leases</CardTitle>
              <CardDescription>
                {filteredLeases.length === leases.length
                  ? `${leases.length} lease${leases.length !== 1 ? "s" : ""} sent to tenants`
                  : `Showing ${filteredLeases.length} of ${leases.length} leases`}
              </CardDescription>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by reference, name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3.5 w-3.5 text-slate-400" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredLeases.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <Search className="mb-3 h-8 w-8 text-slate-400" />
            <p className="text-sm font-medium text-slate-600">
              No leases match your search
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try searching by lease reference number (e.g., RL-LEASE-2026-000001)
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setSearchQuery("")}
            >
              Clear Search
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredLeases.map((lease) => (
              <SentLeaseCard
                key={lease.id}
                lease={lease}
                fieldCount={fieldCountMap.get(lease.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
