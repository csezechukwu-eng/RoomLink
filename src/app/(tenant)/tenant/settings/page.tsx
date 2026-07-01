import {
  User,
  Mail,
  Phone,
  CreditCard,
  Bell,
  Shield,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentTenantId } from "@/lib/auth";
import { getUser } from "@/lib/services/users";

export const dynamic = "force-dynamic";

export default async function TenantSettingsPage() {
  const tenantId = await getCurrentTenantId();
  const userRes = await getUser(tenantId);
  const user = userRes.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-xl font-semibold text-indigo-600">
            {user?.full_name?.charAt(0) || user?.email?.charAt(0) || "?"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {user?.full_name || "Your Name"}
            </h2>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        <h3 className="text-sm font-medium text-slate-900 mb-4">Personal Information</h3>

        <div className="space-y-4">
          <SettingRow
            icon={<User className="h-5 w-5" />}
            label="Full Name"
            value={user?.full_name || "Not set"}
          />
          <SettingRow
            icon={<Mail className="h-5 w-5" />}
            label="Email Address"
            value={user?.email || "Not set"}
          />
          <SettingRow
            icon={<Phone className="h-5 w-5" />}
            label="Phone Number"
            value={user?.phone || "Not set"}
          />
        </div>

        <Button variant="outline" className="mt-6">
          Edit Profile
        </Button>
      </Card>

      {/* Payment Method Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Payment Method</h3>

        <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <CreditCard className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-slate-900">Payment Settings</p>
            <p className="text-sm text-slate-500">
              Manage your payment methods for rent payments
            </p>
          </div>
        </div>

        <Button variant="outline" className="mt-4">
          Manage Payment Methods
        </Button>
      </Card>

      {/* Verification Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Verification Status</h3>

        <div className="space-y-4">
          <VerificationItem
            label="Email Verified"
            verified={!!user?.email}
            description="Your email address has been verified"
          />
          <VerificationItem
            label="Identity Verified"
            verified={user?.verification_status === "verified"}
            description={
              user?.verification_status === "verified"
                ? "Your identity has been verified"
                : "Complete identity verification to unlock all features"
            }
          />
          <VerificationItem
            label="Profile Complete"
            verified={!!user?.full_name && !!user?.phone}
            description={
              user?.full_name && user?.phone
                ? "Your profile is complete"
                : "Complete your profile for a better experience"
            }
          />
        </div>
      </Card>

      {/* Notifications Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Notifications</h3>

        <div className="space-y-4">
          <NotificationToggle
            icon={<Bell className="h-5 w-5" />}
            label="Email Notifications"
            description="Receive updates about your rental via email"
            enabled={true}
          />
          <NotificationToggle
            icon={<Bell className="h-5 w-5" />}
            label="Rent Reminders"
            description="Get reminded before rent is due"
            enabled={true}
          />
          <NotificationToggle
            icon={<Bell className="h-5 w-5" />}
            label="Announcement Alerts"
            description="Be notified of new property announcements"
            enabled={true}
          />
        </div>
      </Card>

      {/* Security Section */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Security</h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-slate-600" />
              <div>
                <p className="font-medium text-slate-900">Password</p>
                <p className="text-sm text-slate-500">Last changed: Never</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Change
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
        <p className="text-sm text-slate-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
          Delete Account
        </Button>
      </Card>
    </div>
  );
}

function SettingRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function VerificationItem({
  label,
  verified,
  description,
}: {
  label: string;
  verified: boolean;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-50">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
        verified ? "bg-emerald-100" : "bg-slate-200"
      }`}>
        {verified ? (
          <CheckCircle className="h-5 w-5 text-emerald-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-slate-400" />
        )}
      </div>
      <div>
        <p className="font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function NotificationToggle({
  icon,
  label,
  description,
  enabled,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  enabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50">
      <div className="flex items-center gap-3">
        <div className="text-slate-600">{icon}</div>
        <div>
          <p className="font-medium text-slate-900">{label}</p>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className={`relative h-6 w-11 rounded-full transition-colors ${
        enabled ? "bg-indigo-600" : "bg-slate-300"
      }`}>
        <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-5" : "translate-x-0.5"
        }`} />
      </div>
    </div>
  );
}
