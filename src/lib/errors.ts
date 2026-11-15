/** An error whose message is already written for the user, in Spanish. */
export class UserFacingError extends Error {}

/** The message to show for `e`: ours as is; anything else (often English) becomes `fallback`. */
export function userMessage(e: unknown, fallback: string): string {
  return e instanceof UserFacingError ? e.message : fallback;
}
