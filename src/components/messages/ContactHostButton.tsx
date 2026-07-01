"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { sendInquiryMessageAction } from "@/lib/actions/messages";
import { initialActionState } from "@/lib/actions/types";

interface ContactHostButtonProps {
  propertyId: string;
  propertyName: string;
  isLoggedIn: boolean;
}

export function ContactHostButton({
  propertyId,
  propertyName,
  isLoggedIn,
}: ContactHostButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [state, formAction, isPending] = useActionState(
    sendInquiryMessageAction,
    initialActionState
  );
  const formRef = React.useRef<HTMLFormElement>(null);

  // Close modal on success
  React.useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
      // Keep modal open briefly to show success message
      setTimeout(() => setIsOpen(false), 2000);
    }
  }, [state.status]);

  const handleClick = () => {
    if (!isLoggedIn) {
      // Redirect to signin with return URL
      router.push(`/signin?redirect=/availability/${propertyId}`);
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleClick}
        variant="outline"
        className="gap-2"
      >
        <MessageCircle className="h-4 w-4" />
        Contact Host
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal Content */}
          <Card className="relative z-10 w-full max-w-md p-6">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-semibold text-slate-900">
              Message the Host
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Send a message about {propertyName}
            </p>

            {state.status === "success" ? (
              <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-center">
                <p className="font-medium text-emerald-700">{state.message}</p>
              </div>
            ) : (
              <form ref={formRef} action={formAction} className="mt-4 space-y-4">
                <input type="hidden" name="property_id" value={propertyId} />

                {state.status === "error" && state.message && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {state.message}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Your message
                  </label>
                  <textarea
                    id="message"
                    name="body"
                    rows={4}
                    required
                    placeholder="Hi! I'm interested in this property and would like to learn more..."
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending} className="flex-1 gap-2">
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
