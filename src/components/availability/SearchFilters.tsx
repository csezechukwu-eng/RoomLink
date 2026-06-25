import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { OCCUPANCY_TYPES } from "@/lib/constants";
import type { AvailabilitySearch } from "@/lib/services/availability";

/**
 * Public search form. Submits via GET so filtering works without client JS —
 * the listing page reads searchParams and filters server-side.
 */
export function SearchFilters({ values }: { values: AvailabilitySearch }) {
  return (
    <form
      method="get"
      action="/availability"
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="City / location">
          <Input
            name="city"
            defaultValue={values.city ?? ""}
            placeholder="e.g. Charlotte"
          />
        </Field>

        <Field label="State">
          <Input
            name="state"
            defaultValue={values.state ?? ""}
            placeholder="e.g. NC"
          />
        </Field>

        <Field label="Move-in month">
          <Input type="month" name="moveIn" defaultValue={values.moveIn ?? ""} />
        </Field>

        <Field label="Occupancy">
          <Select name="occupancy" defaultValue={values.occupancy ?? "any"}>
            <option value="any">Any</option>
            {OCCUPANCY_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Available beds (min)">
          <Input
            type="number"
            min={1}
            name="minBeds"
            defaultValue={values.minBeds ?? ""}
            placeholder="Any"
          />
        </Field>

        <Field label="Monthly rent range">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              name="rentMin"
              defaultValue={values.rentMin ?? ""}
              placeholder="Min $"
            />
            <span className="text-slate-400">–</span>
            <Input
              type="number"
              min={0}
              name="rentMax"
              defaultValue={values.rentMax ?? ""}
              placeholder="Max $"
            />
          </div>
        </Field>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="submit" className="gap-2">
          <Search className="h-4 w-4" />
          Search
        </Button>
        <Link
          href="/availability"
          className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          Clear filters
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
