"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();

    // ✅ Hide navbar on any /admin/* route
    if (pathname?.startsWith("/admin")) return null;

    // ✅ Hide navbar if the logged-in user is an admin (on any page)
    if (status === "authenticated" && session?.user?.role === "admin") return null;

    // ✅ Show navbar for guests and regular users
    return <Navbar />;
}