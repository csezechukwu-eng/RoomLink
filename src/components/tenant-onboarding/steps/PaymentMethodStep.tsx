"use client";

import * as React from "react";
import { CreditCard, CheckCircle, ArrowRight, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TenantOnboardingState } from "@/lib/onboarding/tenant-state";

interface PaymentMethodStepProps {
  state: TenantOnboardingState;
  onContinue: () => void;
}

/**
 * PaymentMethodStep
 *
 * Payment method setup for tenants.
 */
export function PaymentMethodStep({ state, onContinue }: PaymentMethodStepProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const hasPaymentMethod = state.data.paymentMethodAdded;

  const handleAddPaymentMethod = async () => {
    setIsAdding(true);
    // In a real implementation, this would open Stripe Elements or Checkout
    // For now, we'll simulate it
    setTimeout(() => {
      setIsAdding(false);
      // Would redirect to Stripe
    }, 1000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <CreditCard className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900">Set up your payment method</h1>
        </div>
        <p className="text-slate-600">
          Add a payment method so you can easily pay rent and deposits when you find a place.
        </p>
      </div>

      {/* Payment Method Status */}
      <div className="rounded-xl border border-slate-200 p-6">
        {hasPaymentMethod ? (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mb-4">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Payment Method Added</h2>
            <p className="text-slate-600 mb-6">
              Your payment method is set up and ready to use.
            </p>
            <Button onClick={onContinue}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 mb-4">
                <CreditCard className="h-8 w-8 text-indigo-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Add a Payment Method</h2>
              <p className="text-slate-600 max-w-md mx-auto">
                Add a debit or credit card to pay for your deposits and rent. You won&apos;t be charged until you secure a bed.
              </p>
            </div>

            {/* Benefits */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-3">Why add a payment method now?</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Apply for beds instantly without delays
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Secure your spot faster when you find the right place
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Set up automatic rent payments later
                </li>
              </ul>
            </div>

            {/* Accepted Payment Methods */}
            <div className="flex items-center justify-center gap-4 py-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Accepted:</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-12 rounded bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                  Visa
                </div>
                <div className="h-8 w-12 rounded bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                  MC
                </div>
                <div className="h-8 w-12 rounded bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                  Amex
                </div>
                <div className="h-8 w-12 rounded bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                  Bank
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Button
                onClick={handleAddPaymentMethod}
                disabled={isAdding}
                size="md"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Add Payment Method
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={onContinue}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security Note */}
      <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-4">
        <Lock className="h-5 w-5 shrink-0 text-slate-600 mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-slate-900">Secure payments powered by Stripe</p>
          <p className="text-slate-600 mt-1">
            Your payment information is encrypted and securely stored by Stripe.
            We never have access to your full card details.
          </p>
        </div>
      </div>
    </div>
  );
}
