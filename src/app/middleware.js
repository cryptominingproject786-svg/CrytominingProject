import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { NEXTAUTH_SECRET } from "./lib/authConfig";

export async function middleware(req) {
    const token = await getToken({
        req,
        secret: NEXTAUTH_SECRET,
    });
    console.log("Middleware token", { token });

    const { pathname } = req.nextUrl;

    // Protect dashboard (any logged-in user, but NOT admin)
    if (pathname.startsWith("/dashboard")) {
        if (!token) {
            return NextResponse.redirect(new URL("/join", req.url));
        }

        // Prevent admin accounts from accessing user dashboard
        if (token.role === "admin") {
            return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
    }

    // Protect admin routes
    if (pathname.startsWith("/admin")) {
        // not logged in
        if (!token) {
            return NextResponse.redirect(new URL("/admin/Login", req.url));
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


