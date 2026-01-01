import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import connectDB from "../../../lib/mongoDb";
import User from "../../../models/User";
import limiter from "../../../lib/rateLimiter";

const handler = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, req) {
                try {
                    if (!credentials?.email || !credentials?.password) {
                        console.debug("authorize: missing credentials");
                        throw new Error("Missing email or password");
                    }

                    // Resilient header access: NextAuth may pass a Request-like object with
                    // headers.get(), or a plain object on some runtimes. Normalize header access.
                    const getHeader = (reqObj, name) => {
                        const headers = reqObj?.headers;
                        if (!headers) return undefined;
                        if (typeof headers.get === "function") return headers.get(name);
                        // find case-insensitive key on plain object
                        const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
                        if (key) return headers[key];
                        return headers[name] || headers[name.toLowerCase()];
                    };

                    const ip = getHeader(req, "x-forwarded-for") || getHeader(req, "x-real-ip") || "local";
                    const { allowed, reset } = await limiter.consume(`signin:${ip}`);
                    if (!allowed) {
                        console.warn(`authorize: rate limit exceeded for ip=${ip}`);
                        throw new Error("Too many attempts, please try again later");
                    }

                    await connectDB();
                    const email = String(credentials.email || "").trim().toLowerCase();
                    console.debug("authorize: looking up user", { email });
                    const user = await User.findOne({ email }).select("+password");
                    if (!user) {
                        console.debug("authorize: user not found", { email });
                        // Follow NextAuth convention: return null for invalid credentials
                        return null;
                    }

                    const valid = await bcrypt.compare(credentials.password, user.password);
                    if (!valid) {
                        console.debug("authorize: invalid password", { email });
                        return null;
                    }
                    console.info("authorize: success", { id: user._id.toString(), email: user.email });
                    return { id: user._id.toString(), email: user.email, role: user.role };
                } catch (err) {
                    console.error("authorize error", err?.message || err);
                    // NextAuth surfaces thrown Error messages to the client as error text; rethrow
                    throw err;
                }
            },
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.email = user.email;
            }
            return token;
        },
        async session({ session, token }) {
            session.user = session.user || {};
            session.user.role = token.role;
            session.user.email = token.email;
            session.user.id = token.sub;
            return session;
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
