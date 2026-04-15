// lib/authToken.js
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

/**
 * Extracts and verifies the JWT token from the request.
 * Works in Next.js App Router API routes.
 *
 * @param {Request} req - The incoming Next.js request object
 * @returns {Promise<JWT|null>} decoded token or null
 */
export async function getAuthToken(req) {
    try {
        const token = await getToken({
            req,
            secret,
            // v4 in production uses __Secure- prefix automatically
            // when NEXTAUTH_URL is https. No manual cookie name needed.
        });
        return token ?? null;
    } catch {
        return null;
    }
}

/**
 * Extracts the userId from a decoded JWT token.
 * @param {JWT|null} token
 * @returns {string|null}
 */
export function getAuthUserId(token) {
    return token?.id ?? token?.sub ?? null;
}