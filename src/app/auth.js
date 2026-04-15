import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectDB from "./lib/mongoDb";
import User from "./models/User";
import limiter from "./lib/rateLimiter";

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SECRET;

if (!AUTH_SECRET) {
    throw new Error(
        "Missing authentication secret. Set AUTH_SECRET or NEXTAUTH_SECRET in your environment."
    );
}

if (!process.env.AUTH_TRUST_HOST) {
    console.warn(
        "AUTH_TRUST_HOST is not set. For dynamic host detection in production, set AUTH_TRUST_HOST=true."
    );
}

export const {
    handlers: { GET, POST },
    auth,
} = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Missing email or password");
                }

                const getHeader = (reqObj, name) => {
                    const headers = reqObj?.headers;
                    if (!headers) return undefined;
                    if (typeof headers.get === "function") return headers.get(name);
                    const key = Object.keys(headers).find(
                        (k) => k.toLowerCase() === name.toLowerCase()
                    );
                    return key ? headers[key] : undefined;
                };

                const ip =
                    getHeader(req, "x-forwarded-for") ||
                    getHeader(req, "x-real-ip") ||
                    "local";

                const { allowed } = await limiter.consume(`signin:${ip}`);
                if (!allowed) {
                    throw new Error("Too many login attempts. Please try again later.");
                }

                await connectDB();
                const email = credentials.email.trim().toLowerCase();
                const user = await User.findOne({ email }).select("+password");
                if (!user) return null;

                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) return null;

                return {
                    id: user._id.toString(),
                    email: user.email,
                    role: user.role ?? "user",
                    username: user.username,
                };
            },
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
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
        async redirect({ url, baseUrl }) {
            if (url.startsWith(baseUrl)) return url;
            return baseUrl;
        },
    },
    secret: AUTH_SECRET,
    pages: {
        signIn: "/join",
        error: "/join",
    },
});
