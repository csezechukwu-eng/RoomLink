import "server-only";
import crypto from "crypto";
import { ok, fail, type Result } from "@/lib/result";

/**
 * Minimal DocuSign eSignature client (JWT Grant, one shared sender account).
 * Hand-rolled with Node `crypto` + `fetch` — no SDK dependency. Every call is
 * guarded by isDocuSignConfigured(); with no env set the UI stays in its
 * "Connect DocuSign" state instead of crashing.
 */

const OAUTH_BASE = process.env.DOCUSIGN_OAUTH_BASE || "account-d.docusign.com";

export function isDocuSignConfigured(): boolean {
  return Boolean(
    process.env.DOCUSIGN_INTEGRATION_KEY &&
      process.env.DOCUSIGN_USER_ID &&
      process.env.DOCUSIGN_ACCOUNT_ID &&
      process.env.DOCUSIGN_BASE_PATH &&
      process.env.DOCUSIGN_PRIVATE_KEY
  );
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function privateKeyPem(): string {
  // Allow either real newlines or escaped "\n" in the env var.
  return (process.env.DOCUSIGN_PRIVATE_KEY || "").replace(/\\n/g, "\n");
}

/** Exchange a signed JWT assertion for an access token (impersonation). */
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: process.env.DOCUSIGN_INTEGRATION_KEY,
      sub: process.env.DOCUSIGN_USER_ID,
      aud: OAUTH_BASE,
      iat: now,
      exp: now + 3600,
      scope: "signature impersonation",
    })
  );
  const signingInput = `${header}.${payload}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(signingInput)
    .sign(privateKeyPem());
  const assertion = `${signingInput}.${base64url(signature)}`;

  const res = await fetch(`https://${OAUTH_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `DocuSign auth failed (${res.status}). If this is the first run, grant ` +
        `consent once via the consent URL. Details: ${text}`
    );
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("DocuSign returned no access token.");
  return json.access_token;
}

function apiBase(): string {
  const base = process.env.DOCUSIGN_BASE_PATH!.replace(/\/$/, "");
  return `${base}/v2.1/accounts/${process.env.DOCUSIGN_ACCOUNT_ID}`;
}

export interface LeaseTabs {
  PropertyName?: string;
  PropertyAddress?: string;
  RoomName?: string;
  BedLabel?: string;
  MonthlyRent?: string;
  DepositAmount?: string;
  LeaseStart?: string;
  LeaseEnd?: string;
  TenantName?: string;
  LandlordName?: string;
  GoverningState?: string;
}

export interface SendLeaseInput {
  templateId: string;
  tenant: { name: string; email: string; clientUserId: string };
  landlord: { name: string; email: string; clientUserId: string };
  tabs: LeaseTabs;
}

/** Create + send an envelope from a template, prefilling the labeled text tabs. */
export async function sendEnvelopeFromTemplate(
  input: SendLeaseInput
): Promise<Result<{ envelopeId: string }>> {
  try {
    if (!isDocuSignConfigured()) return fail("DocuSign is not configured.");
    const token = await getAccessToken();

    const textTabs = Object.entries(input.tabs)
      .filter(([, value]) => value != null && value !== "")
      .map(([tabLabel, value]) => ({ tabLabel, value: String(value), locked: "true" }));

    const body = {
      templateId: input.templateId,
      status: "sent",
      templateRoles: [
        {
          roleName: "Tenant",
          name: input.tenant.name,
          email: input.tenant.email,
          clientUserId: input.tenant.clientUserId,
          tabs: { textTabs },
        },
        {
          roleName: "Landlord",
          name: input.landlord.name,
          email: input.landlord.email,
          clientUserId: input.landlord.clientUserId,
        },
      ],
    };

    const res = await fetch(`${apiBase()}/envelopes`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Create envelope failed (${res.status}): ${await res.text()}`);
    const json = (await res.json()) as { envelopeId?: string };
    if (!json.envelopeId) throw new Error("DocuSign returned no envelope id.");
    return ok({ envelopeId: json.envelopeId });
  } catch (error) {
    return fail(error);
  }
}

/** Generate an embedded (in-app) signing URL for one recipient. */
export async function createRecipientView(input: {
  envelopeId: string;
  returnUrl: string;
  signer: { name: string; email: string; clientUserId: string };
}): Promise<Result<{ url: string }>> {
  try {
    if (!isDocuSignConfigured()) return fail("DocuSign is not configured.");
    const token = await getAccessToken();
    const res = await fetch(
      `${apiBase()}/envelopes/${input.envelopeId}/views/recipient`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnUrl: input.returnUrl,
          authenticationMethod: "none",
          email: input.signer.email,
          userName: input.signer.name,
          clientUserId: input.signer.clientUserId,
        }),
      }
    );
    if (!res.ok) throw new Error(`Recipient view failed (${res.status}): ${await res.text()}`);
    const json = (await res.json()) as { url?: string };
    if (!json.url) throw new Error("DocuSign returned no signing URL.");
    return ok({ url: json.url });
  } catch (error) {
    return fail(error);
  }
}

/** Fetch the current envelope status (sent/delivered/completed/declined/voided). */
export async function getEnvelopeStatus(
  envelopeId: string
): Promise<Result<{ status: string }>> {
  try {
    if (!isDocuSignConfigured()) return fail("DocuSign is not configured.");
    const token = await getAccessToken();
    const res = await fetch(`${apiBase()}/envelopes/${envelopeId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Get envelope failed (${res.status}): ${await res.text()}`);
    const json = (await res.json()) as { status?: string };
    return ok({ status: json.status ?? "unknown" });
  } catch (error) {
    return fail(error);
  }
}
