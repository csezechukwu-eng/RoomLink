import Link from "next/link";
import { XCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Stripe Checkout Cancel Page
 *
 * IMPORTANT:
 * - This page does NOT mark the payment as failed or cancelled.
 * - This page does NOT update any database records.
 * - The pending payment record will be cleaned up by webhook/expiration handler later.
 * - This page only shows a friendly message and lets the tenant retry.
 */

interface CancelPageProps {
  searchParams: Promise<{ rent_charge_id?: string }>;
}

export default async function PaymentCancelPage({ searchParams }: CancelPageProps) {
  const params = await searchParams;
  const rentChargeId = params.rent_charge_id;

  // Build the return link - include rent_charge_id for potential future retry routing
  const returnHref = "/tenant/rent";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <XCircle className="h-6 w-6 text-slate-500" />
            </div>
            <CardTitle className="text-xl">Payment was not completed</CardTitle>
            <CardDescription>
              No payment was recorded. You can return to your rent page and try
              again.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-600">
                If you experienced an issue during checkout, please try again or
                contact your landlord for assistance.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Link href={returnHref} className="w-full">
              <Button variant="primary" className="w-full">
                Back to Tenant Rent
              </Button>
            </Link>

            {rentChargeId ? (
              <p className="text-center text-xs text-slate-400">
                Rent charge: {rentChargeId}
              </p>
            ) : null}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
