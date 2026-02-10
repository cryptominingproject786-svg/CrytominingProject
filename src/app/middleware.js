import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function middleware(req) {
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    });
    console.log("Middleware token", { token });

    const { pathname } = req.nextUrl;

    // Protect dashboard (any logged-in user)
    if (pathname.startsWith("/dashboard") && !token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // Protect admin routes
    if (pathname.startsWith("/admin")) {
        // not logged in
        if (!token) {
            return NextResponse.redirect(new URL("/admin/login", req.url));
        }

        // logged in but not admin
        if (token.role !== "admin") {
            return NextResponse.redirect(new URL("/", req.url));
        }
    }

    return NextResponse.next();
}
export const config = {
    matcher: [
        "/dashboard/:path*",
        "/admin((?!/Login|/SignUp).*)",
    ],
};

