/** Max length for message query param (GET URL limit). Document in README. */
export const MESSAGE_MAX_LENGTH = 2000;

/**
 * Auth code for bypassing session verification.
 * WARNING: Should only be used in development/testing.
 * Set via AUTH_CODE env var - must be non-empty to enable.
 * In production, this should be unset or very long random string.
 */
export const AUTH_CODE = process.env.AUTH_CODE ?? "";
