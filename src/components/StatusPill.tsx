import { cn } from "@/lib/utils";

/** Generic status pill driven by a tone ({ label, badge classes }). */
export function StatusPill({
  tone,
  className,
}: {
  tone: { label: string; badge: string };
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone.badge,
        className
      )}
    >
      {tone.label}
    </span>
  );
}
