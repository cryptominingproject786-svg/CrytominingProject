import { auth } from "./auth";
import { NextResponse } from "next/server";

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const token = req.auth?.token;

    if (pathname.startsWith("/dashboard")) {
        if (!token) {
            return NextResponse.redirect(new URL("/join", req.url));
        }
        if (token.role === "admin") {
            return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
    }

    if (pathname.startsWith("/admin")) {
        if (pathname.toLowerCase() === "/admin/login" && pathname !== "/admin/login") {
            return NextResponse.redirect(new URL("/admin/login", req.url));
        }
        if (pathname.toLowerCase() === "/admin/signup" && pathname !== "/admin/signup") {
            return NextResponse.redirect(new URL("/admin/signup", req.url));
        }

        if (!token) {
            return NextResponse.redirect(new URL("/admin/login", req.url));
        }
        if (token.role !== "admin") {
            return NextResponse.redirect(new URL("/", req.url));
        }
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/admin((?!/login|/signup).*)",
    ],
};


