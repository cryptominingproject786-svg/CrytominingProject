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

                // 6️⃣ Return full auth payload (feeds jwt callback)
                return {
                    id: user._id.toString(),
                    email: user.email,
                    role: user.role ?? "user",
                    username: user.username,
                };
            },
        }),
    ],

    session: {
        strategy: "jwt",
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id || user._id?.toString();
                token.role = user.role;
                token.email = user.email;
                token.username = user.username;
            }
            return token;
        },

        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.role = token.role;
                session.user.email = token.email;
                session.user.username = token.username;
            }
            return session;
        },

        async redirect({ url, baseUrl, token }) {
            // ✅ After sign-in, route based on role
            // token.role is available here after jwt callback runs
            if (url.startsWith(baseUrl)) {
                // Admin → go to admin dashboard
                if (token?.role === "admin") {
                    return `${baseUrl}/admin/dashboard`;
                }
                // Regular user → go to user dashboard
                return `${baseUrl}/dashboard`;
            }
            return url;
        },
    },

    secret: process.env.NEXTAUTH_SECRET,

    pages: {
        // ✅ Regular users land here when unauthenticated
        // Admin login is handled separately at /admin/Login
        signIn: "/join",
        error: "/join",
    },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };