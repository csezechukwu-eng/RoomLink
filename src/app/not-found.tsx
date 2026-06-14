import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/EmptyState";

export default function NotFound() {
  return (
    <div className="py-8">
      <EmptyState
        title="Not found"
        description="We couldn't find what you're looking for. It may have been moved or deleted."
        action={
          <Link href="/dashboard">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        }
      />
    </div>
  );
}
