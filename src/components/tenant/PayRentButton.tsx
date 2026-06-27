"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { createRentCheckoutSessionAction } from "@/lib/actions/stripe";

interface PayRentButtonProps {
  rentChargeId: string;
  className?: string;
}

/**
 * Client component for Pay Now button on tenant rent page.
 *
 * Behavior:
 * - Calls createRentCheckoutSessionAction server action
 * - On success, redirects to Stripe Checkout URL
 * - Shows loading state while processing
 * - Shows error message if action fails
 * - Prevents double-click with disabled state during loading
 */
export function PayRentButton({ rentChargeId, className }: PayRentButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handlePayNow() {
    // Prevent double-click
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await createRentCheckoutSessionAction(rentChargeId);

      if (result.status === "error") {
        setError(result.message ?? "Unable to start payment. Please try again.");
        setIsLoading(false);
        return;
      }

      // Success - redirect to Stripe Checkout
      const url = result.data?.url;
      if (url) {
        // Use window.location.href for full-page redirect to Stripe
        window.location.href = url;
        // Keep loading state true while redirecting
      } else {
        setError("Unable to get checkout URL. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("[PayRentButton] Error:", err);
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <div className={className}>
      <Button
        variant="primary"
        size="sm"
        onClick={handlePayNow}
        disabled={isLoading}
      >
        {isLoading ? "Processing..." : "Pay Now"}
      </Button>
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
