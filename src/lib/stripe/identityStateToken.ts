import "server-only";
import { createHash, randomBytes } from "crypto";

/**
 * Identity Verification State Token Utilities
 *
 * Uses a secure state-token architecture for Stripe Identity returns:
 * 1. Generate cryptographically secure random token
 * 2. Store only the hashed version in database
 * 3. Send raw token in Stripe return_url
 * 4. On return, hash incoming token and compare to stored hash
 *
 * This allows verification even without an active session cookie.
 */

// Token expires after 1 hour (plenty of time for verification)
export const STATE_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate a secure random state token.
 * Returns a 32-byte hex string (64 characters).
 */
export function generateStateToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hash a state token using SHA-256.
 * Only the hash is stored in the database.
 */
export function hashStateToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Validate a state token by comparing its hash to the stored hash.
 */
export function validateStateToken(token: string, storedHash: string): boolean {
  const incomingHash = hashStateToken(token);
  // Use timing-safe comparison to prevent timing attacks
  if (incomingHash.length !== storedHash.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < incomingHash.length; i++) {
    result |= incomingHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Calculate expiration timestamp for a new state token.
 */
export function getStateTokenExpiry(): Date {
  return new Date(Date.now() + STATE_TOKEN_EXPIRY_MS);
}

/**
 * Check if a state token has expired.
 */
export function isStateTokenExpired(expiresAt: Date | string): boolean {
  const expiry = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return expiry.getTime() < Date.now();
}
