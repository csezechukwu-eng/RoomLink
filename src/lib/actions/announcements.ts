"use server";

import { getCurrentOwnerId } from "@/lib/auth";
import { createAnnouncement } from "@/lib/services/announcements";
import {
  type ActionState,
  errorState,
  revalidateApp,
  str,
  successState,
} from "@/lib/actions/_shared";

export async function createAnnouncementAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const propertyId = str(formData, "property_id");
  const title = str(formData, "title");
  const body = str(formData, "body");

  const fieldErrors: Record<string, string> = {};
  if (!propertyId) fieldErrors.property_id = "Choose a property.";
  if (!title) fieldErrors.title = "Title is required.";
  if (!body) fieldErrors.body = "Message is required.";
  if (Object.keys(fieldErrors).length > 0)
    return errorState("Please fix the highlighted fields.", fieldErrors);

  const ownerId = await getCurrentOwnerId();
  const result = await createAnnouncement({
    propertyId,
    authorId: ownerId,
    title,
    body,
  });
  if (result.error !== null) return errorState(result.error);
  revalidateApp();
  return successState("Announcement sent.");
}
