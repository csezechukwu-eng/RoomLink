"use client";

import * as React from "react";
import Link from "next/link";
import {
  Beaker,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  Trash2,
  Zap,
  ChevronRight,
  Link2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  checkDemoReadinessAction,
  seedFullDemoDataAction,
  resetFullDemoDataAction,
  linkTemplateToStayTypeAction,
} from "@/lib/actions/demo";
import { STAY_TYPE_OPTIONS, getStayTypeLabel } from "@/lib/leaseTemplateOptions";
import type { DemoReadinessResult, DemoReadinessCheck } from "@/lib/services/demo";
import type { LeaseStayType } from "@/lib/types";

// ---------------------------------------------------------------------------
// Status Icon Component
// ---------------------------------------------------------------------------

function StatusIcon({ status }: { status: DemoReadinessCheck["status"] }) {
  switch (status) {
    case "complete":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "missing":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "needs_setup":
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  }
}

function StatusBadge({ status }: { status: DemoReadinessCheck["status"] }) {
  const styles = {
    complete: "bg-green-100 text-green-700",
    missing: "bg-red-100 text-red-700",
    needs_setup: "bg-amber-100 text-amber-700",
  };
  const labels = {
    complete: "Complete",
    missing: "Missing",
    needs_setup: "Needs Setup",
  };
  return (
    <Badge className={`text-xs ${styles[status]}`}>{labels[status]}</Badge>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface DemoSetupSectionProps {
  initialReadiness: DemoReadinessResult | null;
}

export function DemoSetupSection({ initialReadiness }: DemoSetupSectionProps) {
  const [readiness, setReadiness] = React.useState<DemoReadinessResult | null>(
    initialReadiness
  );
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>("");
  const [selectedStayType, setSelectedStayType] = React.useState<string>("");
  const [confirmingReset, setConfirmingReset] = React.useState(false);

  // Check readiness
  const handleCheckReadiness = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await checkDemoReadinessAction();
      if (result.status === "success" && result.data) {
        setReadiness(result.data);
        setMessage({ type: "success", text: "Readiness check complete" });
      } else {
        setMessage({ type: "error", text: result.message || "Failed to check readiness" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to check readiness" });
    } finally {
      setLoading(false);
    }
  };

  // Seed full demo data
  const handleSeedFullDemo = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const result = await seedFullDemoDataAction();
      if (result.status === "success") {
        setMessage({ type: "success", text: result.message || "Demo data seeded" });
        // Refresh readiness
        await handleCheckReadiness();
      } else {
        setMessage({ type: "error", text: result.message || "Failed to seed demo data" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to seed demo data" });
    } finally {
      setLoading(false);
    }
  };

  // Reset demo data
  const handleResetDemoData = async () => {
    setLoading(true);
    setMessage(null);
    setConfirmingReset(false);
    try {
      const result = await resetFullDemoDataAction();
      if (result.status === "success") {
        setMessage({ type: "success", text: result.message || "Demo data reset" });
        // Refresh readiness
        await handleCheckReadiness();
      } else {
        setMessage({ type: "error", text: result.message || "Failed to reset demo data" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to reset demo data" });
    } finally {
      setLoading(false);
    }
  };

  // Link template to stay type
  const handleLinkTemplate = async () => {
    if (!selectedTemplate || !selectedStayType) return;
    setLoading(true);
    setMessage(null);
    try {
      const result = await linkTemplateToStayTypeAction(
        selectedTemplate,
        selectedStayType as LeaseStayType
      );
      if (result.status === "success") {
        setMessage({ type: "success", text: result.message || "Template linked" });
        setSelectedTemplate("");
        setSelectedStayType("");
        // Refresh readiness
        await handleCheckReadiness();
      } else {
        setMessage({ type: "error", text: result.message || "Failed to link template" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to link template" });
    } finally {
      setLoading(false);
    }
  };

  // Full demo setup
  const handleFullSetup = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // First link template if we have ready templates
      if (
        readiness?.readyTemplates &&
        readiness.readyTemplates.length > 0 &&
        !readiness.readyTemplates[0].stay_type
      ) {
        const linkResult = await linkTemplateToStayTypeAction(
          readiness.readyTemplates[0].id,
          "month_to_month"
        );
        if (linkResult.status !== "success") {
          setMessage({ type: "error", text: linkResult.message || "Failed to link template" });
          setLoading(false);
          return;
        }
      }

      // Then seed full demo data
      const appResult = await seedFullDemoDataAction();
      if (appResult.status === "success") {
        setMessage({
          type: "success",
          text: `Full setup complete! ${appResult.message}. Now open a demo application and click "Approve & Send Lease".`,
        });
        // Refresh readiness
        await handleCheckReadiness();
      } else {
        setMessage({ type: "error", text: appResult.message || "Failed to seed demo data" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to run full setup" });
    } finally {
      setLoading(false);
    }
  };

  const readyTemplates = readiness?.readyTemplates ?? [];
  const hasReadyTemplate = readyTemplates.length > 0;
  const completedChecks =
    readiness?.checks.filter((c) => c.status === "complete").length ?? 0;
  const totalChecks = readiness?.checks.length ?? 0;

  return (
    <Card className="border-dashed border-amber-300 bg-amber-50/30">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Beaker className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Demo Setup
                <Badge className="bg-amber-100 text-amber-700 text-xs">
                  Testing Only
                </Badge>
              </CardTitle>
              <CardDescription>
                Create safe test records to test the lease workflow from
                application approval to lease sending.
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckReadiness}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Check Readiness
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Feedback Message */}
        {message && (
          <div
            className={`rounded-lg p-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border border-green-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Readiness Checklist */}
        {readiness && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700">
                Demo Readiness Checklist
              </h3>
              <span className="text-sm text-slate-500">
                {completedChecks} / {totalChecks} complete
              </span>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
              {readiness.checks.map((check) => (
                <div
                  key={check.id}
                  className="flex items-center justify-between p-3"
                >
                  <div className="flex items-center gap-3">
                    <StatusIcon status={check.status} />
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        {check.label}
                      </div>
                      {check.detail && (
                        <div className="text-xs text-slate-500">
                          {check.detail}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={check.status} />
                    {check.actionHref && (
                      <Link href={check.actionHref}>
                        <Button variant="ghost" size="sm" className="h-7 px-2">
                          {check.action}
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Link Template to Stay Type */}
        {hasReadyTemplate && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Link Template to Rental Type
            </h3>
            <p className="text-xs text-slate-500">
              Link a ready lease template to a rental type so demo applications
              can use it.
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[180px]">
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Ready Template
                </label>
                <Select
                  value={selectedTemplate}
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                >
                  <option value="">Select template...</option>
                  {readyTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                      {t.stay_type && ` (${getStayTypeLabel(t.stay_type)})`}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="text-xs font-medium text-slate-600 mb-1 block">
                  Rental Type
                </label>
                <Select
                  value={selectedStayType}
                  onChange={(e) => setSelectedStayType(e.target.value)}
                >
                  <option value="">Select rental type...</option>
                  {STAY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                onClick={handleLinkTemplate}
                disabled={loading || !selectedTemplate || !selectedStayType}
                size="sm"
              >
                Link Template
              </Button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleSeedFullDemo}
            disabled={loading}
          >
            <Users className="mr-1.5 h-4 w-4" />
            Seed Demo Data
          </Button>

          <Button
            onClick={handleFullSetup}
            disabled={loading || !readiness?.canRunFullSetup}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Zap className="mr-1.5 h-4 w-4" />
            Create Full Demo Setup
          </Button>

          {confirmingReset ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
              <span className="text-sm text-red-700">Delete demo data?</span>
              <Button
                variant="danger"
                size="sm"
                onClick={handleResetDemoData}
                disabled={loading}
              >
                Yes, Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmingReset(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setConfirmingReset(true)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Reset Demo Data
            </Button>
          )}
        </div>

        {/* Demo Stats */}
        {readiness && (
          <div className="flex items-center gap-4 text-sm text-slate-600 pt-2 border-t border-slate-200">
            <span>
              <strong>{readiness.demoApplicationCount}</strong> demo
              application(s)
            </span>
            <span>
              <strong>{readiness.demoPreparedLeaseCount}</strong> demo
              lease(s) sent
            </span>
            {readiness.demoApplicationCount > 0 && (
              <Link
                href="/dashboard/applications"
                className="flex items-center gap-1 text-indigo-600 hover:underline"
              >
                View Applications
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
