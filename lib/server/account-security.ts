export const RECENT_AUTH_WINDOW_SECONDS = 10 * 60;

export interface IdentityClaims {
  uid?: string;
  email_verified?: boolean;
  auth_time?: number;
}

export function getIdentityValidationError(
  sessionUserId: string,
  claims: IdentityClaims,
  nowSeconds = Math.floor(Date.now() / 1_000)
): string | null {
  if (!claims.uid || claims.uid !== sessionUserId) {
    return "The authentication token does not belong to this account.";
  }
  if (claims.email_verified !== true) {
    return "Verify your email before managing this account.";
  }
  if (
    typeof claims.auth_time !== "number" ||
    nowSeconds - claims.auth_time > RECENT_AUTH_WINDOW_SECONDS ||
    claims.auth_time > nowSeconds + 60
  ) {
    return "Sign in again before deleting your account.";
  }
  return null;
}
