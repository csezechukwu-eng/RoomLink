"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Zap,
  Building,
  Home,
  FileText,
  ClipboardList,
  ExternalLink,
  Play,
  User,
  FileSignature,
  Eye,
  Loader2,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  seedDemoRentPaymentsAction,
} from "@/lib/actions/demo";
import type {
  FullDemoReadinessResult,
  DemoReadinessCheck,
  DemoApplicationInfo,
  DemoPreparedLeaseInfo,
  DemoSeedStep,
} from "@/lib/services/demo";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface DemoTestCenterProps {
  initialReadiness: FullDemoReadinessResult | null;
  initialError: string | null;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function DemoTestCenter({
  initialReadiness,
  initialError,
}: DemoTestCenterProps) {
  const [readiness, setReadiness] = React.useState(initialReadiness);
  const [error, setError] = React.useState(initialError);
  const [loading, setLoading] = React.useState(false);
  const [seedSteps, setSeedSteps] = React.useState<DemoSeedStep[]>([]);
  const [lastAction, setLastAction] = React.useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);

  const refreshReadiness = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await checkDemoReadinessAction();
      if (result.status === "error") {
        setError(result.message ?? null);
      } else {
        setReadiness(result.data as FullDemoReadinessResult);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to check readiness");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFullDemo = async () => {
    console.log("[DemoTestCenter] Load Full Demo Data clicked");
    setLoading(true);
    setError(null);
    setSeedSteps([]);
    setLastAction(null);
    try {
      console.log("[DemoTestCenter] Calling seedFullDemoDataAction...");
      const result = await seedFullDemoDataAction();
      console.log("[DemoTestCenter] seedFullDemoDataAction result:", JSON.stringify(result, null, 2));
      if (result.status === "error") {
        console.error("[DemoTestCenter] Server action returned error:", result.message);
        setError(result.message ?? "Unknown error occurred");
      } else {
        console.log("[DemoTestCenter] Server action succeeded:", result.message);
        setSeedSteps(result.data?.steps || []);
        setLastAction(result.message ?? "Demo data loaded");
      }
      console.log("[DemoTestCenter] Refreshing readiness...");
      await refreshReadiness();
      console.log("[DemoTestCenter] Readiness refreshed");
    } catch (e) {
      console.error("[DemoTestCenter] Exception caught:", e);
      const errorMessage = e instanceof Error ? e.message : "Failed to load demo data";
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log("[DemoTestCenter] Loading complete");
    }
  };

  const handleResetDemo = async () => {
    setLoading(true);
    setError(null);
    setSeedSteps([]);
    setShowResetConfirm(false);
    try {
      const result = await resetFullDemoDataAction();
      if (result.status === "error") {
        setError(result.message ?? null);
      } else {
        setLastAction(result.message ?? null);
      }
      await refreshReadiness();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reset demo data");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadRentDemo = async () => {
    console.log("[DemoTestCenter] Load Demo Rent Data clicked");
    setLoading(true);
    setError(null);
    setSeedSteps([]);
    setLastAction(null);
    try {
      const result = await seedDemoRentPaymentsAction();
      console.log("[DemoTestCenter] seedDemoRentPaymentsAction result:", JSON.stringify(result, null, 2));
      if (result.status === "error") {
        setError(result.message ?? "Unknown error occurred");
      } else {
        setSeedSteps(result.data?.steps || []);
        setLastAction(result.message ?? "Demo rent data loaded");
      }
      await refreshReadiness();
    } catch (e) {
      console.error("[DemoTestCenter] Exception caught:", e);
      setError(e instanceof Error ? e.message : "Failed to load demo rent data");
    } finally {
      setLoading(false);
    }
  };

  const hasDemoData =
    readiness?.demoProperty ||
    (readiness?.demoApplications?.length ?? 0) > 0 ||
    readiness?.demoLeaseTemplate;

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Last Action Message */}
      {lastAction && !error && (
        <div className="rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700">
          {lastAction}
        </div>
      )}

      {/* Primary Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Load or reset demo data with one click
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleLoadFullDemo}
              disabled={loading}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Load Full Demo Data
            </Button>

            <Button
              onClick={handleLoadRentDemo}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <DollarSign className="mr-2 h-4 w-4" />
              )}
              Load Demo Rent Data
            </Button>

            {hasDemoData && (
              <>
                {showResetConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600">Delete all demo data?</span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={handleResetDemo}
                      disabled={loading}
                    >
                      Yes, Delete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowResetConfirm(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => setShowResetConfirm(true)}
                    disabled={loading}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Reset Demo Data
                  </Button>
                )}
              </>
            )}

            <Button
              variant="outline"
              onClick={refreshReadiness}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh Status
            </Button>
          </div>

          {/* Seed Steps Log */}
          {seedSteps.length > 0 && (
            <div className="rounded-lg border bg-slate-50 p-4">
              <h4 className="mb-2 text-sm font-semibold text-slate-700">Setup Steps</h4>
              <div className="space-y-1">
                {seedSteps.map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {step.status === "success" && (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    )}
                    {step.status === "skipped" && (
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    )}
                    {step.status === "error" && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{step.step}:</span>
                    <span className="text-slate-600">{step.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demo Records Created */}
      {readiness && hasDemoData && (
        <Card>
          <CardHeader>
            <CardTitle>Demo Records Created</CardTitle>
            <CardDescription>
              These demo records are available for testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Property */}
            {readiness.demoProperty && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Building className="h-4 w-4" />
                  Demo Property
                </h4>
                <div className="rounded-lg border bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{readiness.demoProperty.name}</p>
                      <p className="text-sm text-slate-500">
                        {readiness.demoProperty.address}, {readiness.demoProperty.city},{" "}
                        {readiness.demoProperty.state} {readiness.demoProperty.zip}
                      </p>
                    </div>
                    <Link href={`/dashboard/properties/${readiness.demoProperty.id}`}>
                      <Button variant="outline" size="sm">
                        View <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Badge className="bg-slate-100 text-slate-700">
                      {readiness.demoRooms.length} room(s)
                    </Badge>
                    <Badge className="bg-slate-100 text-slate-700">
                      {readiness.demoBeds.length} bed(s)
                    </Badge>
                    <Badge className="bg-amber-100 text-amber-700">Demo</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Lease Template */}
            {readiness.demoLeaseTemplate && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FileText className="h-4 w-4" />
                  Demo Lease Template
                </h4>
                <div className="rounded-lg border bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{readiness.demoLeaseTemplate.title}</p>
                      <p className="text-sm text-slate-500">
                        Stay type: {readiness.demoLeaseTemplate.stay_type} | Status:{" "}
                        {readiness.demoLeaseTemplate.status}
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/leases/templates/${readiness.demoLeaseTemplate.id}/designer`}
                    >
                      <Button variant="outline" size="sm">
                        Field Designer <ExternalLink className="ml-1 h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {readiness.demoLeaseTemplate.status === "ready" ? (
                      <Badge className="bg-green-100 text-green-700">Ready</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700">Needs Setup</Badge>
                    )}
                    <Badge className="bg-amber-100 text-amber-700">Demo</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Applications */}
            {readiness.demoApplications.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <ClipboardList className="h-4 w-4" />
                  Demo Applications ({readiness.demoApplications.length})
                </h4>
                <div className="space-y-2">
                  {readiness.demoApplications.map((app) => (
                    <div key={app.id} className="rounded-lg border bg-white p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{app.name}</p>
                          <p className="text-sm text-slate-500">
                            {app.email} | {app.bedLabel || "No bed"} | Stay:{" "}
                            {app.stayType || "Not set"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/dashboard/applications/${app.id}`}>
                            <Button variant="outline" size="sm">
                              Review <ExternalLink className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Badge
                          className={
                            app.status === "approved"
                              ? "bg-green-100 text-green-700"
                              : app.status === "under_review"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-slate-100 text-slate-700"
                          }
                        >
                          {app.status.replace(/_/g, " ")}
                        </Badge>
                        {app.hasPreparedLease && (
                          <Badge className="bg-indigo-100 text-indigo-700">
                            Lease Sent
                          </Badge>
                        )}
                        <Badge className="bg-amber-100 text-amber-700">Demo</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prepared Leases */}
            {readiness.demoPreparedLeases.length > 0 && (
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <FileSignature className="h-4 w-4" />
                  Sent Leases ({readiness.demoPreparedLeases.length})
                </h4>
                <div className="space-y-2">
                  {readiness.demoPreparedLeases.map((lease) => (
                    <div key={lease.id} className="rounded-lg border bg-white p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{lease.applicantName}</p>
                          <p className="text-sm text-slate-500">
                            Ref: {lease.leaseReferenceNumber} | {lease.propertyName}
                          </p>
                        </div>
                        <Link href={`/dashboard/leases/applications/${lease.id}`}>
                          <Button variant="outline" size="sm">
                            View <ExternalLink className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Badge className="bg-blue-100 text-blue-700">
                          {lease.status}
                        </Badge>
                        <Badge className="bg-slate-100 text-slate-700">
                          {lease.signatureCount} signature field(s)
                        </Badge>
                        <Badge className="bg-amber-100 text-amber-700">Demo</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>
            Navigate to demo-related pages to test the workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink
              href="/dashboard"
              icon={<Home className="h-4 w-4" />}
              title="Dashboard"
              description="View dashboard metrics"
            />
            <QuickLink
              href="/dashboard/properties"
              icon={<Building className="h-4 w-4" />}
              title="Properties"
              description="View all properties"
            />
            {readiness?.demoProperty && (
              <QuickLink
                href={`/dashboard/properties/${readiness.demoProperty.id}`}
                icon={<Home className="h-4 w-4" />}
                title="Demo Property"
                description="View demo property detail"
              />
            )}
            <QuickLink
              href="/dashboard/applications"
              icon={<ClipboardList className="h-4 w-4" />}
              title="Applications"
              description="Review applications"
            />
            {readiness?.demoApplications[0] && (
              <QuickLink
                href={`/dashboard/applications/${readiness.demoApplications[0].id}`}
                icon={<User className="h-4 w-4" />}
                title="Demo Application"
                description="Review Jane Demo Tenant"
              />
            )}
            <QuickLink
              href="/dashboard/leases"
              icon={<FileText className="h-4 w-4" />}
              title="Leases"
              description="Manage lease templates"
            />
            {readiness?.demoLeaseTemplate && (
              <QuickLink
                href={`/dashboard/leases/templates/${readiness.demoLeaseTemplate.id}/designer`}
                icon={<FileSignature className="h-4 w-4" />}
                title="Field Designer"
                description="View demo lease fields"
              />
            )}
            <QuickLink
              href="/dashboard/leases/applications"
              icon={<FileSignature className="h-4 w-4" />}
              title="My Lease Applications"
              description="View sent leases"
            />
            <QuickLink
              href="/dashboard/rent"
              icon={<DollarSign className="h-4 w-4" />}
              title="Rent & Payments"
              description="View rent charges and payments"
            />
            {readiness?.demoApplications[0] && (
              <QuickLink
                href={`/dashboard/demo/tenant-preview/${readiness.demoApplications[0].id}`}
                icon={<Eye className="h-4 w-4" />}
                title="Tenant Preview"
                description="Preview tenant view"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Readiness Checklist */}
      {readiness && (
        <Card>
          <CardHeader>
            <CardTitle>Readiness Checklist</CardTitle>
            <CardDescription>
              {readiness.summary.completeChecks} of {readiness.summary.totalChecks} checks
              complete
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["dashboard", "property", "application", "lease", "tenant"].map(
                (category) => {
                  const categoryChecks = readiness.checks.filter(
                    (c) => c.category === category
                  );
                  if (categoryChecks.length === 0) return null;
                  return (
                    <div key={category}>
                      <h4 className="mb-2 text-sm font-semibold capitalize text-slate-700">
                        {category}
                      </h4>
                      <div className="space-y-1">
                        {categoryChecks.map((check) => (
                          <CheckItem key={check.id} check={check} />
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manual Test Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Manual Test Checklist</CardTitle>
          <CardDescription>
            Follow these steps to verify the full demo workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                1
              </span>
              <span>
                Click <strong>Load Full Demo Data</strong> to create demo records
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                2
              </span>
              <span>
                Go to <strong>Dashboard</strong> and verify demo metrics appear
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                3
              </span>
              <span>
                Go to <strong>Properties</strong> and verify renta bed Demo House appears
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                4
              </span>
              <span>
                Open the demo property and verify rooms/beds are visible
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                5
              </span>
              <span>
                Go to <strong>Applications</strong> and verify demo applications appear
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                6
              </span>
              <span>
                Open Jane Demo Tenant&apos;s application and review details
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                7
              </span>
              <span>
                Go to <strong>Leases</strong> and verify demo template appears
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                8
              </span>
              <span>
                Open the demo template in <strong>Field Designer</strong> to verify fields
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                9
              </span>
              <span>
                On Jane&apos;s application, click <strong>Approve & Send Lease</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                10
              </span>
              <span>
                Go to <strong>My Lease Applications</strong> and verify sent lease
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                11
              </span>
              <span>
                Check the <strong>Tenant Preview</strong> to see tenant-side view
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
                12
              </span>
              <span>
                Click <strong>Reset Demo Data</strong> to clean up when done
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CheckItem({ check }: { check: DemoReadinessCheck }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {check.status === "complete" && (
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      )}
      {check.status === "missing" && <XCircle className="h-4 w-4 text-red-400" />}
      {check.status === "needs_setup" && (
        <AlertTriangle className="h-4 w-4 text-amber-500" />
      )}
      <span className={check.status === "complete" ? "text-slate-700" : "text-slate-500"}>
        {check.label}
      </span>
      {check.detail && (
        <span className="text-slate-400">— {check.detail}</span>
      )}
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border bg-white p-3 transition-colors hover:border-slate-300 hover:bg-slate-50"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-400" />
    </Link>
  );
}
