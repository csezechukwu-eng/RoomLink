import { redirect } from "next/navigation";

/**
 * Rooms & Beds Redirect
 *
 * This page previously provided standalone room/bed management.
 * Rooms and beds are now managed inside each property detail page at:
 *   /dashboard/properties/[propertyId]
 *
 * This redirect preserves old bookmarks and links while guiding users
 * to the new location.
 */
export default function RoomsPage() {
  redirect("/dashboard/properties");
}
