"use client";

import { useState, useActionState, useEffect } from "react";
import {
  User,
  Building2,
  Bell,
  CreditCard,
  Shield,
  Link,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  ChevronRight,
  Check,
  Globe,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  Users,
  Smartphone,
  Laptop,
  LogOut,
  Key,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ExternalLink,
  PenTool,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { SignaturePad } from "@/components/SignaturePad";
import { saveSignatureAction, getSignature, deleteSignatureAction } from "@/lib/actions/signature";
import {
  getStripeConnectStatusAction,
  createStripeOnboardingLinkAction,
  refreshStripeConnectStatusAction,
  createStripeDashboardLinkAction,
  type ConnectStatusData,
} from "@/lib/actions/stripeConnect";
import { Card } from "@/components/ui/card";
import type { StripeConnectOnboardingStatus } from "@/lib/types";

// Types
type SettingsTab = "profile" | "signature" | "properties" | "notifications" | "pricing" | "security" | "integrations";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "signature" as const, label: "Signature", icon: PenTool },
    { id: "properties" as const, label: "Property Defaults", icon: Building2 },
    { id: "notifications" as const, label: "Notifications", icon: Bell },
    { id: "pricing" as const, label: "Pricing & Payouts", icon: CreditCard },
    { id: "security" as const, label: "Security", icon: Shield },
    { id: "integrations" as const, label: "Integrations", icon: Link },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account settings and preferences.</p>
      </div>

      {/* Layout */}
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 shrink-0">
          <Card className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {activeTab === "profile" && <ProfileSettings />}
          {activeTab === "signature" && <SignatureSettings />}
          {activeTab === "properties" && <PropertySettings />}
          {activeTab === "notifications" && <NotificationSettings />}
          {activeTab === "pricing" && <PricingSettings />}
          {activeTab === "security" && <SecuritySettings />}
          {activeTab === "integrations" && <IntegrationSettings />}
        </div>
      </div>
    </div>
  );
}

// Profile Settings
function ProfileSettings() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Personal Information</h2>
        <p className="mt-1 text-sm text-slate-500">Update your personal details and contact information.</p>

        <div className="mt-6 flex items-start gap-6">
          {/* Avatar */}
          <div className="text-center">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-2xl font-semibold text-indigo-600">
                MD
              </div>
              <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-white hover:bg-indigo-700">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">JPG, PNG up to 5MB</p>
          </div>

          {/* Form */}
          <div className="flex-1 grid grid-cols-2 gap-4">
            <FormField label="First Name" defaultValue="Marcus" />
            <FormField label="Last Name" defaultValue="Davis" />
            <FormField label="Email Address" type="email" defaultValue="marcus.davis@email.com" icon={<Mail className="h-4 w-4" />} />
            <FormField label="Phone Number" type="tel" defaultValue="(704) 555-0100" icon={<Phone className="h-4 w-4" />} />
            <div className="col-span-2">
              <FormField label="Business Name" defaultValue="Davis Property Management" icon={<Building2 className="h-4 w-4" />} />
            </div>
            <div className="col-span-2">
              <FormField label="Business Address" defaultValue="123 Main Street, Charlotte, NC 28202" icon={<MapPin className="h-4 w-4" />} />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Preferences</h2>
        <p className="mt-1 text-sm text-slate-500">Customize your experience.</p>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Globe className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Language</p>
                <p className="text-sm text-slate-500">Select your preferred language</p>
              </div>
            </div>
            <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option>English (US)</option>
              <option>Spanish</option>
              <option>French</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Timezone</p>
                <p className="text-sm text-slate-500">Set your local timezone</p>
              </div>
            </div>
            <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option>Eastern Time (ET)</option>
              <option>Central Time (CT)</option>
              <option>Mountain Time (MT)</option>
              <option>Pacific Time (PT)</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <DollarSign className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">Currency</p>
                <p className="text-sm text-slate-500">Set your preferred currency</p>
              </div>
            </div>
            <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option>USD ($)</option>
              <option>EUR (€)</option>
              <option>GBP (£)</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Signature Settings
function SignatureSettings() {
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [state, formAction, isPending] = useActionState(saveSignatureAction, { status: "idle" });
  const [signatureToSave, setSignatureToSave] = useState<string | null>(null);

  // Load current signature on mount
  useEffect(() => {
    async function loadSignature() {
      try {
        const sig = await getSignature();
        setCurrentSignature(sig);
      } catch {
        console.error("Failed to load signature");
      } finally {
        setIsLoading(false);
      }
    }
    loadSignature();
  }, []);

  // Update current signature after successful save
  useEffect(() => {
    if (state.status === "success" && signatureToSave) {
      setCurrentSignature(signatureToSave);
      setSignatureToSave(null);
    }
  }, [state.status, signatureToSave]);

  const handleSaveSignature = (signatureData: string) => {
    setSignatureToSave(signatureData);
    const formData = new FormData();
    formData.set("signature_data", signatureData);
    formAction(formData);
  };

  const handleDeleteSignature = async () => {
    const result = await deleteSignatureAction();
    if (result.status === "success") {
      setCurrentSignature(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Your Signature</h2>
        <p className="mt-1 text-sm text-slate-500">
          Create and save your signature to automatically apply it to all lease agreements you send.
        </p>

        {state.status === "success" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <Check className="h-4 w-4 shrink-0" />
            <span>{state.message}</span>
          </div>
        )}

        {state.status === "error" && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {state.message}
          </div>
        )}

        <div className="mt-6">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-200">
              <p className="text-sm text-slate-400">Loading signature...</p>
            </div>
          ) : currentSignature ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="mb-2 text-sm font-medium text-slate-700">Current Signature</p>
                <div className="flex items-center justify-center rounded-lg bg-slate-50 p-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentSignature}
                    alt="Your signature"
                    className="h-20 object-contain"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentSignature(null)}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <PenTool className="h-4 w-4" />
                  Update Signature
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSignature}
                  className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <SignaturePad
                onSave={handleSaveSignature}
                initialSignature={null}
              />
              {isPending && (
                <p className="text-sm text-slate-500">Saving signature...</p>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">How Signatures Work</h2>
        <p className="mt-1 text-sm text-slate-500">
          Understanding in-app lease signing.
        </p>

        <div className="mt-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
              1
            </div>
            <div>
              <p className="font-medium text-slate-900">Save Your Signature</p>
              <p className="text-sm text-slate-500">
                Draw or type your signature above. This will be securely stored and used for all leases.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
              2
            </div>
            <div>
              <p className="font-medium text-slate-900">Send Lease to Tenant</p>
              <p className="text-sm text-slate-500">
                When you send a lease, your signature is automatically applied. The tenant receives a link to sign.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-600">
              3
            </div>
            <div>
              <p className="font-medium text-slate-900">Tenant Signs Online</p>
              <p className="text-sm text-slate-500">
                Tenants sign directly in the app. Once both parties sign, a PDF is generated with all signatures.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Property Settings
function PropertySettings() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Default Lease Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Set default values for new leases across all properties.</p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <FormField label="Default Lease Term" defaultValue="12" suffix="months" />
          <FormField label="Security Deposit" defaultValue="150" prefix="$" />
          <FormField label="Late Fee Amount" defaultValue="50" prefix="$" />
          <FormField label="Grace Period" defaultValue="5" suffix="days" />
          <FormField label="Rent Due Day" defaultValue="1" suffix="of each month" />
          <FormField label="Notice Period" defaultValue="30" suffix="days" />
        </div>

        <div className="mt-6 flex justify-end">
          <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Save className="h-4 w-4" />
            Save Changes
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Application Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Configure tenant application requirements.</p>

        <div className="mt-6 space-y-4">
          <ToggleSetting
            title="Require Background Check"
            description="Automatically request background checks for all applicants"
            defaultChecked={true}
          />
          <ToggleSetting
            title="Require Income Verification"
            description="Require proof of income (3x monthly rent)"
            defaultChecked={true}
          />
          <ToggleSetting
            title="Require Employment Verification"
            description="Verify employment status with employer"
            defaultChecked={false}
          />
          <ToggleSetting
            title="Require References"
            description="Request landlord or personal references"
            defaultChecked={true}
          />
          <ToggleSetting
            title="Application Fee"
            description="Charge a non-refundable application fee"
            defaultChecked={true}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">House Rules Template</h2>
        <p className="mt-1 text-sm text-slate-500">Default house rules applied to all properties.</p>

        <div className="mt-4">
          <textarea
            className="w-full rounded-lg border border-slate-200 p-3 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            rows={6}
            defaultValue={`1. Quiet hours are from 10 PM to 7 AM
2. No smoking inside the property
3. Guests must be registered at the front desk
4. Keep common areas clean and tidy
5. Report maintenance issues promptly
6. Respect other tenants' privacy and space`}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Save className="h-4 w-4" />
            Save Template
          </button>
        </div>
      </Card>
    </div>
  );
}

// Notification Settings
function NotificationSettings() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Email Notifications</h2>
        <p className="mt-1 text-sm text-slate-500">Choose which emails you want to receive.</p>

        <div className="mt-6 space-y-4">
          <ToggleSetting
            title="New Applications"
            description="Get notified when a new rental application is submitted"
            defaultChecked={true}
          />
          <ToggleSetting
            title="Payment Received"
            description="Get notified when rent payments are received"
            defaultChecked={true}
          />
          <ToggleSetting
            title="Late Payments"
            description="Get notified when rent is overdue"
            defaultChecked={true}
          />
          <ToggleSetting
            title="Maintenance Requests"
            description="Get notified when tenants submit maintenance requests"
            defaultChecked={true}
          />
          <ToggleSetting
            title="Lease Expirations"
            description="Get reminders before leases expire"
            defaultChecked={true}
          />
          <ToggleSetting
            title="New Messages"
            description="Get notified when tenants send messages"
            defaultChecked={false}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">SMS Notifications</h2>
        <p className="mt-1 text-sm text-slate-500">Receive text alerts for urgent matters.</p>

        <div className="mt-6 space-y-4">
          <ToggleSetting
            title="Emergency Maintenance"
            description="Get SMS alerts for emergency maintenance requests"
            defaultChecked={true}
          />
          <ToggleSetting
            title="Large Payments"
            description="Get SMS when payments over $1,000 are received"
            defaultChecked={false}
          />
          <ToggleSetting
            title="Security Alerts"
            description="Get SMS for suspicious login attempts"
            defaultChecked={true}
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Notification Schedule</h2>
        <p className="mt-1 text-sm text-slate-500">Set quiet hours for non-urgent notifications.</p>

        <div className="mt-6 flex items-center gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Start Time</label>
            <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option>9:00 PM</option>
              <option>10:00 PM</option>
              <option>11:00 PM</option>
            </select>
          </div>
          <span className="mt-6 text-slate-500">to</span>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">End Time</label>
            <select className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <option>7:00 AM</option>
              <option>8:00 AM</option>
              <option>9:00 AM</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Pricing Settings - Host Fee Explanation + Stripe Connect
function PricingSettings() {
  const [connectStatus, setConnectStatus] = useState<ConnectStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial status
  useEffect(() => {
    async function loadStatus() {
      const result = await getStripeConnectStatusAction();
      if (result.status === "success" && result.data) {
        setConnectStatus(result.data);
      }
      setIsLoading(false);
    }
    loadStatus();
  }, []);

  // Handle Connect Stripe button click
  async function handleConnectStripe() {
    setIsConnecting(true);
    setError(null);

    const result = await createStripeOnboardingLinkAction();

    if (result.status === "error") {
      setError(result.message ?? "Unable to start onboarding. Please try again.");
      setIsConnecting(false);
      return;
    }

    if (result.data?.url) {
      window.location.href = result.data.url;
      // Keep loading state while redirecting
    } else {
      setError("Unable to get onboarding link. Please try again.");
      setIsConnecting(false);
    }
  }

  // Handle refresh status button click
  async function handleRefreshStatus() {
    setIsRefreshing(true);
    setError(null);

    const result = await refreshStripeConnectStatusAction();

    if (result.status === "success" && result.data) {
      setConnectStatus(result.data);
    } else {
      setError(result.message ?? "Unable to refresh status. Please try again.");
    }

    setIsRefreshing(false);
  }

  // Handle view dashboard button click
  async function handleViewDashboard() {
    const result = await createStripeDashboardLinkAction();

    if (result.status === "success" && result.data?.url) {
      window.open(result.data.url, "_blank");
    } else {
      setError(result.message ?? "Unable to open dashboard. Please try again.");
    }
  }

  // Get status display info
  function getStatusDisplay(status: StripeConnectOnboardingStatus) {
    switch (status) {
      case "not_connected":
        return {
          label: "Not Connected",
          color: "text-slate-600",
          bgColor: "bg-slate-100",
          icon: CreditCard,
        };
      case "onboarding_incomplete":
        return {
          label: "Onboarding Incomplete",
          color: "text-amber-600",
          bgColor: "bg-amber-100",
          icon: AlertCircle,
        };
      case "pending_verification":
        return {
          label: "Pending Verification",
          color: "text-blue-600",
          bgColor: "bg-blue-100",
          icon: Clock,
        };
      case "payouts_ready":
        return {
          label: "Payouts Ready",
          color: "text-emerald-600",
          bgColor: "bg-emerald-100",
          icon: CheckCircle,
        };
    }
  }

  const statusDisplay = connectStatus
    ? getStatusDisplay(connectStatus.onboardingStatus)
    : null;

  return (
    <div className="space-y-6">
      {/* How Room Link Pricing Works */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">How Room Link Pricing Works</h2>
        <p className="mt-1 text-sm text-slate-500">
          Room Link is free to use. You only pay when tenants book and pay through the platform.
        </p>

        <div className="mt-6 space-y-4">
          {/* Host Fee */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-emerald-900">5% Host Fee</p>
                <p className="text-sm text-emerald-700">Deducted from each monthly rent payment</p>
              </div>
            </div>
          </div>

          {/* What You Keep */}
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                <CreditCard className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">You Keep 95%</p>
                <p className="text-sm text-slate-500">Receive 95% of the monthly rent directly to your bank</p>
              </div>
            </div>
          </div>

          {/* Example */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Example</p>
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Monthly Rent</span>
                <span className="font-medium">$1,000</span>
              </div>
              <div className="flex justify-between text-red-600">
                <span>Room Link Host Fee (5%)</span>
                <span>-$50</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold text-emerald-600">
                <span>Your Payout</span>
                <span>$950</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* No Subscription Required */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">No Monthly Subscription</h2>
        <p className="mt-1 text-sm text-slate-500">
          Room Link does not charge monthly or annual subscription fees.
        </p>

        <div className="mt-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Free to list properties</p>
              <p className="text-sm text-slate-500">Add unlimited properties, rooms, and beds at no cost</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Free to receive applications</p>
              <p className="text-sm text-slate-500">Review tenant applications without any platform fees</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Free digital agreements</p>
              <p className="text-sm text-slate-500">Send and sign monthly stay agreements electronically</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100">
              <DollarSign className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Pay only when you earn</p>
              <p className="text-sm text-slate-500">5% host fee is deducted only when tenants pay rent through Room Link</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Stripe Connect Payouts */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Payouts</h2>
            <p className="mt-1 text-sm text-slate-500">
              Receive monthly rent payments directly to your bank account.
            </p>
          </div>
          {connectStatus && connectStatus.onboardingStatus !== "not_connected" && (
            <button
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading state */}
        {isLoading ? (
          <div className="mt-6 flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="mt-6">
            {/* Status badge */}
            {statusDisplay && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Status:</span>
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium ${statusDisplay.bgColor} ${statusDisplay.color}`}>
                  <statusDisplay.icon className="h-4 w-4" />
                  {statusDisplay.label}
                </span>
              </div>
            )}

            {/* Not connected */}
            {connectStatus?.onboardingStatus === "not_connected" && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
                <CreditCard className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-3 font-medium text-slate-900">Connect Stripe to Receive Payouts</p>
                <p className="mt-1 text-sm text-slate-500">
                  Set up your bank account to receive automatic payouts when tenants pay rent.
                </p>
                <button
                  onClick={handleConnectStripe}
                  disabled={isConnecting}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Connect Stripe
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Onboarding incomplete */}
            {connectStatus?.onboardingStatus === "onboarding_incomplete" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-6 text-center">
                <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
                <p className="mt-3 font-medium text-slate-900">Complete Your Stripe Setup</p>
                <p className="mt-1 text-sm text-slate-500">
                  You started connecting Stripe but haven&apos;t finished. Complete your setup to receive payouts.
                </p>
                <button
                  onClick={handleConnectStripe}
                  disabled={isConnecting}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      Continue Setup
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Pending verification */}
            {connectStatus?.onboardingStatus === "pending_verification" && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-6 text-center">
                <Clock className="mx-auto h-10 w-10 text-blue-500" />
                <p className="mt-3 font-medium text-slate-900">Verification in Progress</p>
                <p className="mt-1 text-sm text-slate-500">
                  Stripe is verifying your account. This usually takes 1-2 business days.
                </p>
                {connectStatus.requirementsDue.length > 0 && (
                  <div className="mt-4 text-left">
                    <p className="text-sm font-medium text-slate-700">Pending items:</p>
                    <ul className="mt-1 list-inside list-disc text-sm text-slate-600">
                      {connectStatus.requirementsDue.slice(0, 3).map((req) => (
                        <li key={req}>{req.replace(/_/g, " ")}</li>
                      ))}
                      {connectStatus.requirementsDue.length > 3 && (
                        <li>...and {connectStatus.requirementsDue.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
                <button
                  onClick={handleConnectStripe}
                  disabled={isConnecting}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      Update Information
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Payouts ready */}
            {connectStatus?.onboardingStatus === "payouts_ready" && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-6 text-center">
                <CheckCircle className="mx-auto h-10 w-10 text-emerald-500" />
                <p className="mt-3 font-medium text-slate-900">Payouts Ready</p>
                <p className="mt-1 text-sm text-slate-500">
                  Your Stripe account is set up. When tenants pay rent, you&apos;ll receive 95% automatically.
                </p>
                <button
                  onClick={handleViewDashboard}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Stripe Dashboard
                </button>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

// Security Settings
function SecuritySettings() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Change Password</h2>
        <p className="mt-1 text-sm text-slate-500">Update your password regularly for security.</p>

        <div className="mt-6 max-w-md space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full rounded-lg border border-slate-200 py-2 pl-3 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Enter current password"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Enter new password"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Confirm New Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Confirm new password"
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            <Key className="h-4 w-4" />
            Update Password
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Two-Factor Authentication</h2>
        <p className="mt-1 text-sm text-slate-500">Add an extra layer of security to your account.</p>

        <div className="mt-6 flex items-center justify-between rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
              <Shield className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Authenticator App</p>
              <p className="text-sm text-slate-500">Use Google Authenticator or similar</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600">Enabled</span>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Active Sessions</h2>
        <p className="mt-1 text-sm text-slate-500">Manage devices where you&apos;re logged in.</p>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-4">
              <Laptop className="h-6 w-6 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900">MacBook Pro • Chrome</p>
                <p className="text-sm text-slate-500">Charlotte, NC • Current session</p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600">Active</span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-4">
              <Smartphone className="h-6 w-6 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900">iPhone 14 • Safari</p>
                <p className="text-sm text-slate-500">Charlotte, NC • Last active 2 hours ago</p>
              </div>
            </div>
            <button className="text-sm font-medium text-red-600 hover:text-red-700">Revoke</button>
          </div>
        </div>

        <button className="mt-4 flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700">
          <LogOut className="h-4 w-4" />
          Sign out of all devices
        </button>
      </Card>
    </div>
  );
}

// Integration Settings
function IntegrationSettings() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Connected Apps</h2>
        <p className="mt-1 text-sm text-slate-500">Manage third-party integrations.</p>

        <div className="mt-6 space-y-4">
          <IntegrationItem
            name="Stripe"
            description="Payment processing"
            status="connected"
            logo="S"
            logoColor="bg-purple-100 text-purple-600"
          />
          <IntegrationItem
            name="QuickBooks"
            description="Accounting & bookkeeping"
            status="connected"
            logo="QB"
            logoColor="bg-emerald-100 text-emerald-600"
          />
          <IntegrationItem
            name="Google Calendar"
            description="Sync move-ins and inspections"
            status="not_connected"
            logo="G"
            logoColor="bg-blue-100 text-blue-600"
          />
          <IntegrationItem
            name="Zapier"
            description="Workflow automation"
            status="not_connected"
            logo="Z"
            logoColor="bg-amber-100 text-amber-600"
          />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">API Access</h2>
        <p className="mt-1 text-sm text-slate-500">Manage API keys for custom integrations.</p>

        <div className="mt-6">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div>
              <p className="font-medium text-slate-900">Production API Key</p>
              <p className="font-mono text-sm text-slate-500">sk_live_****************************4f8c</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Copy</button>
              <button className="text-sm font-medium text-red-600 hover:text-red-700">Regenerate</button>
            </div>
          </div>

          <button className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
            <FileText className="h-4 w-4" />
            View API Documentation
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900">Webhooks</h2>
        <p className="mt-1 text-sm text-slate-500">Receive real-time notifications for events.</p>

        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
            <div>
              <p className="font-medium text-slate-900">Payment Webhook</p>
              <p className="text-sm text-slate-500">https://yoursite.com/webhooks/payments</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600">Active</span>
              <button className="text-slate-400 hover:text-slate-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 py-4 text-sm font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600">
            <Plus className="h-4 w-4" />
            Add Webhook Endpoint
          </button>
        </div>
      </Card>
    </div>
  );
}

// Reusable Components

function FormField({
  label,
  type = "text",
  defaultValue,
  icon,
  prefix,
  suffix,
}: {
  label: string;
  type?: string;
  defaultValue?: string;
  icon?: React.ReactNode;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        )}
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{prefix}</span>
        )}
        <input
          type={type}
          defaultValue={defaultValue}
          className={`w-full rounded-lg border border-slate-200 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
            icon ? "pl-9" : prefix ? "pl-7" : "pl-3"
          } ${suffix ? "pr-20" : "pr-3"}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">{suffix}</span>
        )}
      </div>
    </div>
  );
}

function ToggleSetting({
  title,
  description,
  defaultChecked,
}: {
  title: string;
  description: string;
  defaultChecked?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked ?? false);

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <button
        onClick={() => setChecked(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? "bg-indigo-600" : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function IntegrationItem({
  name,
  description,
  status,
  logo,
  logoColor,
}: {
  name: string;
  description: string;
  status: "connected" | "not_connected";
  logo: string;
  logoColor: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg font-semibold ${logoColor}`}>
          {logo}
        </div>
        <div>
          <p className="font-medium text-slate-900">{name}</p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      {status === "connected" ? (
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600">Connected</span>
          <button className="text-sm font-medium text-slate-600 hover:text-slate-700">Manage</button>
        </div>
      ) : (
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Connect
        </button>
      )}
    </div>
  );
}
