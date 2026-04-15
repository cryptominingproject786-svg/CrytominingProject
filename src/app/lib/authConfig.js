export const NEXTAUTH_URL =
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || process.env.SECRET;

export function ensureAuthConfig() {
  if (!NEXTAUTH_SECRET) {
    console.warn(
      "NEXTAUTH_SECRET is not configured. Authentication cookies and JWTs may fail."
    );
  }
  if (!NEXTAUTH_URL) {
    console.warn(
      "NEXTAUTH_URL is not configured. NextAuth may generate incorrect callback URLs."
    );
  }
}
