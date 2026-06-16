import { NextResponse, type NextRequest } from "next/server";
import { applyEnvelopeStatus } from "@/lib/services/leases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DocuSign Connect webhook. Configure your account's Connect listener to POST
 * the aggregated JSON here. We pull the envelope id + status and update the
 * matching lease (and the application's agreement status).
 *
 * Optionally protect with ?secret=... matching DOCUSIGN_CONNECT_SECRET.
 * TODO: upgrade to HMAC signature verification for production.
 */
export async function POST(request: NextRequest) {
  const expected = process.env.DOCUSIGN_CONNECT_SECRET;
  if (expected && request.nextUrl.searchParams.get("secret") !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let envelopeId: string | undefined;
  let status: string | undefined;
  try {
    const body = (await request.json()) as {
      event?: string;
      data?: {
        envelopeId?: string;
        envelopeSummary?: { status?: string };
      };
    };
    envelopeId = body.data?.envelopeId;
    status =
      body.data?.envelopeSummary?.status ??
      body.event?.replace(/^envelope-/, "");
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  if (!envelopeId || !status) {
    return NextResponse.json({ error: "missing envelope id or status" }, { status: 400 });
  }

  const result = await applyEnvelopeStatus(envelopeId, status);
  if (result.error !== null) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
