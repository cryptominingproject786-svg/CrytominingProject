"use client";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function Navbar() {
    const { data: session, status } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(false);
    const profileRef = useRef(null);

    // ── Derive display state directly from session ──
    // role="user"  → isRegularUser=true  → show username + dropdown
    // role="admin" → isRegularUser=false → show Join / Sign Up
    // not logged in→ isRegularUser=false → show Join / Sign Up
    const isRegularUser = status === "authenticated" && session?.user?.role === "user";
    const isAdmin = status === "authenticated" && session?.user?.role === "admin";

    // ── Fetch profile data based on role ──
    useEffect(() => {
        // Stop if session not ready
        if (status !== "authenticated") {
            setProfileData(null);
            return;
        }

        const role = session?.user?.role;
        const email = session?.user?.email;

        // Stop if role or email missing
        if (!role || !email) {
            setProfileData(null);
            return;
        }

        // Only allow valid roles
        if (role !== "user" && role !== "admin") {
            console.error("[Navbar] ❌ Invalid role:", role);
            setProfileData(null);
            return;
        }

        setLoading(true);
        setProfileData(null);

        let isMounted = true;

        const fetchProfile = async () => {
            try {

                // 🔐 STRICT ROLE ROUTING
                const endpoint =
                    role === "admin"
                        ? "/api/auth/admin-profile"
                        : "/api/user/profile";

                console.log(`[Navbar] Fetching ${role} profile → ${endpoint}`);

                const res = await fetch(endpoint, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                });

                if (!isMounted) return;

                if (!res.ok) {
                    console.error("[Navbar] Profile fetch failed:", res.status);
                    setProfileData(null);
                    setLoading(false);
                    return;
                }

                const json = await res.json();

                if (!json?.data) {
                    setProfileData(null);
                    setLoading(false);
                    return;
                }

                // Extra safety check
                if (
                    json.data.email?.toLowerCase() !== email.toLowerCase() ||
                    json.data.role !== role
                ) {
                    console.error("[Navbar] ❌ Session mismatch");
                    setProfileData(null);
                    setLoading(false);
                    return;
                }

                setProfileData(json.data);
                setLoading(false);

            } catch (error) {
                console.error("[Navbar] Fetch error:", error);
                if (isMounted) {
                    setProfileData(null);
                    setLoading(false);
                }
            }
        };

        fetchProfile();

        return () => {
            isMounted = false;
        };

    }, [status, session?.user?.role, session?.user?.email]);

    // ── Safe display name - ONLY use profileData when valid ──
    const displayName = (() => {
        // ✅ CRITICAL: Only show name from profileData if both role AND email match
        if (
            profileData?.username &&
            profileData?.role === session?.user?.role &&
            profileData?.email?.toLowerCase().trim() === session?.user?.email?.toLowerCase().trim()
        ) {
            console.log(`[Navbar] 🎯 Displaying name: ${profileData.username}`);
            return profileData.username;
        }

        // ✅ If no valid profileData, don't show any name to prevent stale data
        // This is safer than falling back to session data
        if (session?.user?.role && !profileData?.username) {
            console.log(`[Navbar] ⚠️  No valid profileData, displayName will be empty`);
            console.log(`[Navbar] Debug info:`, {
                hasProfileData: !!profileData,
                profileUsername: profileData?.username,
                profileRole: profileData?.role,
                sessionRole: session?.user?.role,
                profileEmail: profileData?.email,
                sessionEmail: session?.user?.email
            });
        }

        return "";
    })();

    // ── Session identifier for forcing re-render on session change ──
    const sessionKey = `${session?.user?.email}-${session?.user?.role}`;

    // ── Refetch profile data when session changes (not on interval) ──
    // Removed the 30-second interval to prevent stale data issues
    // useEffect with [status, session?.user?.email, session?.user?.role] handles all updates

    // Close profile dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target))
                setProfileOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Close mobile drawer on resize to desktop
    useEffect(() => {
        const handler = () => { if (window.innerWidth >= 768) setIsOpen(false); };
        window.addEventListener("resize", handler);
        return () => window.removeEventListener("resize", handler);
    }, []);

    // Lock body scroll while drawer is open
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    const handleLogout = async () => {
        setIsOpen(false);
        await signOut({ redirect: true, callbackUrl: "/" });
    };

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/mining", label: "Mining" },
        { href: "/privacy", label: "Privacy" },
        { href: "/about", label: "About Us" },
    ];

    /* ── Shared auth UI ── */

    // Desktop right-side
    const DesktopAuth = () =>
        isRegularUser ? (
            // ✅ Regular user → avatar + username + dropdown
            <div key={`desktop-${sessionKey}`} className="relative" ref={profileRef}>
                <button
                    onClick={() => setProfileOpen((p) => !p)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                >
                    <div className="w-8 h-8 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold text-sm">
                        {displayName ? displayName.charAt(0).toUpperCase() : "?"}
                    </div>
                    <span>{displayName}</span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {profileOpen && (
                    <div className="absolute right-0 mt-3 w-44 bg-zinc-900 border border-white/10 rounded-lg shadow-xl py-1 z-50">
                        <Link href="/dashboard" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-yellow-500 hover:text-black transition-colors">Dashboard</Link>
                        <Link href="/settings" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-yellow-500 hover:text-black transition-colors">Settings</Link>
                        <hr className="border-white/10 my-1" />
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-600 transition-colors">Logout</button>
                    </div>
                )}
            </div>
        ) : isAdmin ? (
            // ✅ Admin → avatar + admin name + dropdown
            <div key={`desktop-${sessionKey}`} className="relative" ref={profileRef}>
                <button
                    onClick={() => setProfileOpen((p) => !p)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    aria-expanded={profileOpen}
                    aria-haspopup="true"
                >
                    <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span>{displayName}</span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {profileOpen && (
                    <div className="absolute right-0 mt-3 w-44 bg-zinc-900 border border-white/10 rounded-lg shadow-xl py-1 z-50">
                        <Link href="/admin/dashboard" onClick={() => setProfileOpen(false)} className="block px-4 py-2.5 text-sm hover:bg-yellow-500 hover:text-black transition-colors">Admin Dashboard</Link>
                        <hr className="border-white/10 my-1" />
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-600 transition-colors">Logout</button>
                    </div>
                )}
            </div>
        ) : (
            // ✅ Guest → Join / Sign Up
            <>
                <Link href="/join" className="hover:text-yellow-400 transition-colors duration-200">Join</Link>
                <Link href="/signup" className="bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-400 transition-colors duration-200">Sign Up</Link>
            </>
        );

    // Mobile drawer auth section
    const MobileAuth = () =>
        isRegularUser ? (
            // ✅ Regular user → avatar chip + links
            <div key={`mobile-${sessionKey}`}>
                <div className="flex items-center gap-3 px-3 py-3 mb-1">
                    <div className="w-9 h-9 rounded-full bg-yellow-500 text-black flex items-center justify-center font-bold text-sm shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-semibold truncate">{displayName}</span>
                </div>
                <Link href="/dashboard" onClick={() => setIsOpen(false)} className="text-white font-semibold px-3 py-3 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors duration-200">Dashboard</Link>
                <Link href="/settings" onClick={() => setIsOpen(false)} className="text-white font-semibold px-3 py-3 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors duration-200">Settings</Link>
                <hr className="border-white/10 my-1" />
                <button onClick={handleLogout} className="text-left text-white font-semibold px-3 py-3 rounded-lg hover:bg-red-600 transition-colors duration-200">Logout</button>
            </div>
        ) : isAdmin ? (
            // ✅ Admin → avatar chip + admin links
            <div key={`mobile-${sessionKey}`}>
                <div className="flex items-center gap-3 px-3 py-3 mb-1">
                    <div className="w-9 h-9 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-sm shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-semibold truncate">{displayName}</span>
                </div>
                <Link href="/admin/dashboard" onClick={() => setIsOpen(false)} className="text-white font-semibold px-3 py-3 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors duration-200">Admin Dashboard</Link>
                <hr className="border-white/10 my-1" />
                <button onClick={handleLogout} className="text-left text-white font-semibold px-3 py-3 rounded-lg hover:bg-red-600 transition-colors duration-200">Logout</button>
            </div>
        ) : (
            // ✅ Guest → Join / Sign Up
            <div key={`mobile-${sessionKey}`}>
                <Link href="/join" onClick={() => setIsOpen(false)} className="text-white font-semibold px-3 py-3 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors duration-200">Join</Link>
                <Link href="/signup" onClick={() => setIsOpen(false)} className="bg-yellow-500 text-black font-bold text-center px-3 py-3 rounded-lg hover:bg-yellow-400 transition-colors duration-200 mt-1">Sign Up</Link>
            </div>
        );

    return (
        <>
            <nav
                className="relative w-full h-20 flex items-center justify-between px-6 md:px-10 text-white bg-cover bg-center z-50"
                style={{ backgroundImage: "url('/banner.png')" }}
            >
                <div className="absolute inset-0 bg-black/60" />

                {/* Desktop: Left nav links */}
                <div className="relative z-10 hidden md:flex items-center gap-8 font-black">
                    {navLinks.map(({ href, label }) => (
                        <Link key={href} href={href} className="hover:text-yellow-400 transition-colors duration-200">{label}</Link>
                    ))}
                </div>

                {/* Desktop: Right auth */}
                <div className="relative z-10 hidden md:flex items-center gap-4 font-black">
                    <DesktopAuth />
                </div>

                {/* Mobile: Brand */}
                <div className="relative z-10 flex md:hidden font-black text-lg tracking-wide">
                    <Link href="/" className="hover:text-yellow-400 transition-colors">CrypTo Mining</Link>
                </div>

                {/* Mobile: Hamburger */}
                <button
                    onClick={() => setIsOpen((p) => !p)}
                    className="relative z-10 flex md:hidden flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-md hover:bg-white/10 transition-colors"
                    aria-label={isOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isOpen}
                >
                    <span className={`block w-6 h-0.5 bg-white rounded transition-all duration-300 ${isOpen ? "rotate-45 translate-y-2" : ""}`} />
                    <span className={`block w-6 h-0.5 bg-white rounded transition-all duration-300 ${isOpen ? "opacity-0 scale-x-0" : ""}`} />
                    <span className={`block w-6 h-0.5 bg-white rounded transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`} />
                </button>
            </nav>

            {/* Mobile: Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
                onClick={() => setIsOpen(false)}
            />

            {/* Mobile: Slide-in drawer */}
            <div className={`fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-zinc-900 z-50 md:hidden flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                <div className="flex items-center justify-between px-6 h-20 border-b border-white/10">
                    <span className="text-white font-black text-lg">Menu</span>
                    <button onClick={() => setIsOpen(false)} className="text-white hover:text-yellow-400 transition-colors" aria-label="Close menu">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-col px-4 py-4 gap-1">
                    {navLinks.map(({ href, label }) => (
                        <Link key={href} href={href} onClick={() => setIsOpen(false)} className="text-white font-semibold px-3 py-3 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors duration-200">{label}</Link>
                    ))}
                </div>

                <hr className="border-white/10 mx-4" />

                <div className="flex flex-col px-4 py-4 gap-1">
                    <MobileAuth />
                </div>
            </div>
        </>
    );
}