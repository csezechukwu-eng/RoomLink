"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Send, FileSignature } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { sendDirectLeaseAction } from "@/lib/actions/leases";
import { initialActionState } from "@/lib/actions/types";
import type { PropertyListItem } from "@/lib/queries";

interface SendLeaseFormProps {
  properties: PropertyListItem[];
  hasSignature: boolean;
}

export function SendLeaseForm({ properties, hasSignature }: SendLeaseFormProps) {
  const router = useRouter();
  const [state, action] = useActionState(sendDirectLeaseAction, initialActionState);
  const [selectedPropertyId, setSelectedPropertyId] = React.useState("");

  // Get rooms/beds for selected property
  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  React.useEffect(() => {
    if (state.status === "success") {
      router.push("/dashboard/leases?sent=1");
    }
  }, [state.status, router]);

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center gap-2">
        <FileSignature className="h-5 w-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-slate-900">Lease Details</h2>
      </div>

      <form action={action} className="space-y-6">
        <FormAlert state={state} />

        {/* Tenant Information */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Tenant Information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Tenant Name <span className="text-red-500">*</span>
              </label>
              <Input
                name="tenant_name"
                required
                placeholder="John Doe"
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Tenant Email <span className="text-red-500">*</span>
              </label>
              <Input
                name="tenant_email"
                type="email"
                required
                placeholder="tenant@email.com"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Property Selection */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Property & Bed</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Property <span className="text-red-500">*</span>
              </label>
              <Select
                name="property_id"
                required
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="mt-1"
              >
                <option value="">Select a property</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Property Address
              </label>
              <Input
                name="property_address"
                defaultValue={
                  selectedProperty
                    ? [selectedProperty.address, selectedProperty.city, selectedProperty.state, selectedProperty.zip]
                        .filter(Boolean)
                        .join(", ")
                    : ""
                }
                placeholder="Full address"
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Room</label>
              <Input
                name="room_name"
                placeholder="Room A"
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Bed</label>
              <Input
                name="bed_label"
                placeholder="Bed 1"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Lease Terms */}
        <div>
          <h3 className="mb-3 text-sm font-semibold text-slate-700">Lease Terms</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Monthly Rent ($) <span className="text-red-500">*</span>
              </label>
              <Input
                name="monthly_rent"
                type="number"
                step="0.01"
                required
                placeholder="750.00"
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Security Deposit ($)
              </label>
              <Input
                name="deposit_amount"
                type="number"
                step="0.01"
                placeholder="750.00"
                className="mt-1"
              />
            </div>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Lease Start Date <span className="text-red-500">*</span>
              </label>
              <Input
                name="lease_start"
                type="date"
                required
                className="mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Lease End Date
              </label>
              <Input
                name="lease_end"
                type="date"
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {!hasSignature && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <p className="font-medium">Signature Required</p>
            <p className="mt-1">
              Please set up your signature in{" "}
              <a href="/dashboard/settings" className="font-medium underline">
                Settings → Signature
              </a>{" "}
              before sending leases. Your signature will be automatically applied to all leases you send.
            </p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <SubmitButton pendingLabel="Sending..." disabled={!hasSignature}>
            <Send className="mr-1.5 h-4 w-4" />
            Send Lease for Signing
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}
