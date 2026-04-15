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
        if (!token) {
            return NextResponse.redirect(new URL("/admin/Login", req.url));
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
        "/admin((?!/Login|/SignUp).*)",
    ],
};


