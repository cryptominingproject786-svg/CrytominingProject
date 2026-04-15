export const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || process.env.SECRET;

export function ensureNextAuthSecret() {
  if (!NEXTAUTH_SECRET) {
    console.warn(
      "NEXTAUTH_SECRET is not configured. Auth tokens and session verification may fail."
    );
  }
}
