import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import limiter from "../../../lib/rateLimiter";

const authOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },

            async authorize(credentials, req) {
                // 1️⃣ Basic validation
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing email or password");
                }

                // 2️⃣ Normalize header access (Node / Edge safe)
                const getHeader = (reqObj, name) => {
                    const headers = reqObj?.headers;
                    if (!headers) return undefined;
                    if (typeof headers.get === "function") return headers.get(name);
                    const key = Object.keys(headers).find(
                        (k) => k.toLowerCase() === name.toLowerCase()
                    );
                    return key ? headers[key] : undefined;
                };

                // 3️⃣ Rate limiting
                const ip =
                    getHeader(req, "x-forwarded-for") ||
                    getHeader(req, "x-real-ip") ||
                    "local";

                const { allowed } = await limiter.consume(`signin:${ip}`);
                if (!allowed) {
                    throw new Error("Too many login attempts. Please try again later.");
                }

                // 4️⃣ DB lookup
                await connectDB();
                const email = credentials.email.trim().toLowerCase();

                const user = await User.findOne({ email }).select("+password");
                if (!user) return null;

                // 5️⃣ Password validation
                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) return null;

                // 6️⃣ Return FULL auth payload (this feeds jwt callback)
                return {
                    id: user._id.toString(),
                    email: user.email,
                    role: user.role ?? "user", // ✅ GUARANTEED
                };
            },
        }),
    ],

    // 🔐 JWT-based sessions (required for middleware)
    session: {
        strategy: "jwt",
    },

    callbacks: {
        /**
         * Runs on:
         * - initial sign-in
         * - every subsequent request
         */
        async jwt({ token, user }) {
            // Initial sign-in
            if (user) {
                console.log("JWT USER:", user);

                token.role = user.role ?? "user";
                token.email = user.email;
            }

            // Absolute safety net (prevents undefined role)
            if (!token.role) {
                token.role = "user";
            }

            return token;
        },

        /**
         * Client-side session shaping
         */
        async session({ session, token }) {
            session.user = {
                id: token.sub,
                email: token.email,
                role: token.role,
            };

            return session;
        },
    },

    // 🔑 MUST match middleware secret
    secret: process.env.NEXTAUTH_SECRET,

    // 🧪 Optional: safer error messages
    pages: {
        signIn: "/admin/Login",
        error: "/admin/Login",
    },

};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
