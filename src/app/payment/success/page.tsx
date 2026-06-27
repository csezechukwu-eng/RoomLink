import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Stripe Checkout Success Page
 *
 * IMPORTANT:
 * - This page does NOT mark the payment as successful.
 * - This page does NOT update the rent charge status.
 * - The webhook is the source of truth for payment confirmation.
 * - This page only shows a friendly message while waiting for webhook.
 */

interface SuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function PaymentSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const sessionId = params.session_id;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <CardTitle className="text-xl">Payment submitted</CardTitle>
            <CardDescription>
              We are confirming your payment. Your rent status will update once
              Stripe confirms the payment.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-600">
                Payment confirmation is handled automatically. This usually takes
                just a few seconds, but may take longer in some cases.
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Link href="/tenant/rent" className="w-full">
              <Button variant="primary" className="w-full">
                Back to Tenant Rent
              </Button>
            </Link>

            {sessionId ? (
              <p className="text-center text-xs text-slate-400">
                Stripe session: {sessionId}
              </p>
            ) : null}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
