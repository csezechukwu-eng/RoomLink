import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { getProperties, getAllRoomsWithBeds } from "@/lib/queries";
import { AddApplicationForm } from "./AddApplicationForm";

export const dynamic = "force-dynamic";

export default async function NewApplicationPage() {
  const [propertiesResult, roomsResult] = await Promise.all([
    getProperties(),
    getAllRoomsWithBeds(),
  ]);

  const properties = propertiesResult.data ?? [];
  const propertiesWithRooms = roomsResult.data ?? [];

  if (properties.length === 0) {
    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/applications"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Applications
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add Application</h1>
          <p className="text-slate-500">Manually add a tenant application.</p>
        </div>

        <Card className="p-8 text-center">
          <p className="text-slate-500">
            You need to create a property with beds first before you can add applications.
          </p>
          <Link
            href="/dashboard/properties"
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-700"
          >
            Go to Properties
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/applications"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Applications
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add Application</h1>
        <p className="text-slate-500">
          Manually add a tenant application on behalf of an applicant.
        </p>
      </div>

      <AddApplicationForm propertiesWithRooms={propertiesWithRooms} />
    </div>
  );
}
