"use client";

import React, {
    useReducer,
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    memo,
} from "react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

// ── Module-level constants ────────────────────────────────────────────────────
// Defined once — never trigger any re-render, never reallocate memory.

const NAV_LINKS = Object.freeze([
    { href: "/", label: "Home" },
    { href: "/mining", label: "Mining" },
    { href: "/privacy", label: "Privacy" },
    { href: "/about", label: "About Us" },
]);

const BANNER_SRC = "/banner.png";

// ── Profile state reducer ────────────────────────────────────────────────────
// Collapses 8 setState branches into 1 dispatch = 1 re-render per outcome.

const PROFILE_INIT = Object.freeze({ loading: false, data: null });

function profileReducer(state, action) {
    switch (action.type) {
        case "LOADING": return { loading: true, data: null };
        case "SUCCESS": return { loading: false, data: action.payload };
        case "RESET": return PROFILE_INIT;
        default: return state;
    }
}

// ── Reusable SVG icons (module-level frozen JSX is not possible, but memo'd
//    components are the next best thing — created once, never remounted) ──────

const IconChevron = memo(function IconChevron({ open }) {
    return (
        <svg
            aria-hidden="true"
            className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
    );
});

const IconClose = memo(function IconClose() {
    return (
        <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
});

// ── Avatar — shared by desktop and mobile ────────────────────────────────────
const Avatar = memo(function Avatar({ initial, isAdmin, size = "sm" }) {
    const dim = size === "lg" ? "w-9 h-9 text-sm" : "w-8 h-8 text-sm";
    return (
        <div
            aria-hidden="true"
            className={`${dim} rounded-full shrink-0 flex items-center justify-center font-bold
                ${isAdmin ? "bg-red-500 text-white" : "bg-yellow-500 text-black"}`}
        >
            {initial || "?"}
        </div>
    );
});

// ── Desktop dropdown menu ─────────────────────────────────────────────────────
const DropdownMenu = memo(function DropdownMenu({ isAdmin, onClose, onLogout }) {
    return (
        <div
            role="menu"
            className="absolute right-0 mt-3 w-44 bg-zinc-900 border border-white/10 rounded-lg shadow-xl py-1 z-50"
        >
            {isAdmin ? (
                <Link
                    role="menuitem"
                    href="/admin/dashboard"
                    onClick={onClose}
                    className="block px-4 py-2.5 text-sm hover:bg-yellow-500 hover:text-black transition-colors"
                >
                    Admin Dashboard
                </Link>
            ) : (
                <>
                    <Link role="menuitem" href="/dashboard" onClick={onClose} className="block px-4 py-2.5 text-sm hover:bg-yellow-500 hover:text-black transition-colors">Dashboard</Link>
                    <Link role="menuitem" href="/settings" onClick={onClose} className="block px-4 py-2.5 text-sm hover:bg-yellow-500 hover:text-black transition-colors">Settings</Link>
                </>
            )}
            <hr className="border-white/10 my-1" />
            <button
                role="menuitem"
                onClick={onLogout}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-600 transition-colors"
            >
                Logout
            </button>
        </div>
    );
});

// ── DesktopAuth ───────────────────────────────────────────────────────────────
// LIFTED OUT of Navbar — React.memo now works perfectly.
// Only re-renders when its own props change (never on isOpen changes).
const DesktopAuth = memo(function DesktopAuth({
    isRegularUser,
    isAdmin,
    displayName,
    profileOpen,
    onToggle,
    onClose,
    onLogout,
    profileRef,
}) {
    const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

    if (isRegularUser || isAdmin) {
        return (
            <div className="relative" ref={profileRef}>
                <button
                    onClick={onToggle}
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                    aria-label={`Account menu for ${displayName || "user"}`}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                    <Avatar initial={initial} isAdmin={isAdmin} />
                    <span>{displayName}</span>
                    <IconChevron open={profileOpen} />
                </button>

                {profileOpen && (
                    <DropdownMenu isAdmin={isAdmin} onClose={onClose} onLogout={onLogout} />
                )}
            </div>
        );
    }

    return (
        <>
            <Link href="/join" className="hover:text-yellow-400 transition-colors duration-200">Join</Link>
            <Link href="/signup" className="bg-yellow-500 text-black px-4 py-2 rounded-md hover:bg-yellow-400 transition-colors duration-200">Sign Up</Link>
        </>
    );
});

// ── MobileAuth ────────────────────────────────────────────────────────────────
// LIFTED OUT — never re-renders when desktop profile dropdown opens/closes.
const MobileAuth = memo(function MobileAuth({
    isRegularUser,
    isAdmin,
    displayName,
    onClose,
    onLogout,
}) {
    const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

    if (isRegularUser || isAdmin) {
        return (
            <div>
                <div className="flex items-center gap-3 px-3 py-3 mb-1">
                    <Avatar initial={initial} isAdmin={isAdmin} size="lg" />
                    <span className="text-white font-semibold truncate">{displayName}</span>
                </div>

                {isAdmin ? (
                    <Link href="/admin/dashboard" onClick={onClose} className="block text-white font-semibold px-3 py-3 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors duration-200">
                        Admin Dashboard
                    </Link>
                ) : (
                    <>
                        <Link href="/dashboard" onClick={onClose} className="block text-white font-semibold px-3 py-3 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors duration-200">Dashboard</Link>
                        <Link href="/settings" onClick={onClose} className="block text-white font-semibold px-3 py-3 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors duration-200">Settings</Link>
                    </>
                )}

                <hr className="border-white/10 my-1" />
                <button onClick={onLogout} className="text-left text-white font-semibold px-3 py-3 rounded-lg hover:bg-red-600 transition-colors duration-200 w-full">
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            <Link href="/join" onClick={onClose} className="text-white font-semibold px-3 py-3 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors duration-200">Join</Link>
            <Link href="/signup" onClick={onClose} className="bg-yellow-500 text-black font-bold text-center px-3 py-3 rounded-lg hover:bg-yellow-400 transition-colors duration-200 mt-1">Sign Up</Link>
        </div>
    );
});

// ── Navbar (main component) ───────────────────────────────────────────────────
export default function Navbar() {
    const { data: session, status } = useSession();

    // UI state — two independent booleans, useState is perfectly fine here.
    const [isOpen, setIsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    // Profile data — single dispatch replaces 8 cascading setState calls.
    const [profile, dispatchProfile] = useReducer(profileReducer, PROFILE_INIT);

    const profileRef = useRef(null);

    // ── Role derivation (memoised) ────────────────────────────────────────────
    const isRegularUser = useMemo(
        () => status === "authenticated" && session?.user?.role === "user",
        [status, session?.user?.role]
    );

    const isAdmin = useMemo(
        () => status === "authenticated" && session?.user?.role === "admin",
        [status, session?.user?.role]
    );

    // ── Display name (memoised — no IIFE, no console.log) ────────────────────
    const displayName = useMemo(() => {
        const pd = profile.data;
        const uRole = session?.user?.role;
        const uEmail = session?.user?.email;

        if (
            pd?.username &&
            pd?.role === uRole &&
            pd?.email?.toLowerCase().trim() === uEmail?.toLowerCase().trim()
        ) {
            return pd.username;
        }
        return "";
    }, [profile.data, session?.user?.role, session?.user?.email]);

    // ── Profile fetch ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (status !== "authenticated") {
            dispatchProfile({ type: "RESET" });
            return;
        }

        const role = session?.user?.role;
        const email = session?.user?.email;

        if (!role || !email || (role !== "user" && role !== "admin")) {
            dispatchProfile({ type: "RESET" });
            return;
        }

        let canceled = false;
        dispatchProfile({ type: "LOADING" });

        (async () => {
            try {
                const endpoint = role === "admin"
                    ? "/api/auth/admin-profile"
                    : "/api/user/profile";

                const res = await fetch(endpoint, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                });

                if (canceled) return;

                if (!res.ok) {
                    dispatchProfile({ type: "RESET" });
                    return;
                }

                const json = await res.json();
                if (!json?.data) { dispatchProfile({ type: "RESET" }); return; }

                // Guard: reject if session/profile mismatch
                if (
                    json.data.email?.toLowerCase() !== email.toLowerCase() ||
                    json.data.role !== role
                ) {
                    dispatchProfile({ type: "RESET" });
                    return;
                }

                if (!canceled) dispatchProfile({ type: "SUCCESS", payload: json.data });

            } catch {
                if (!canceled) dispatchProfile({ type: "RESET" });
            }
        })();

        return () => { canceled = true; };

    }, [status, session?.user?.role, session?.user?.email]);

    // ── Stable handlers (useCallback — sub-components never break memo) ───────

    const closeDrawer = useCallback(() => setIsOpen(false), []);
    const toggleDrawer = useCallback(() => setIsOpen((p) => !p), []);
    const closeProfile = useCallback(() => setProfileOpen(false), []);
    const toggleProfile = useCallback(() => setProfileOpen((p) => !p), []);

    const handleLogout = useCallback(async () => {
        setIsOpen(false);
        await signOut({ redirect: true, callbackUrl: "/" });
    }, []);

    // ── Outside-click → close profile dropdown ────────────────────────────────
    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target))
                setProfileOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Close drawer on desktop resize ───────────────────────────────────────
    useEffect(() => {
        const handler = () => { if (window.innerWidth >= 768) setIsOpen(false); };
        window.addEventListener("resize", handler, { passive: true });
        return () => window.removeEventListener("resize", handler);
    }, []);

    // ── Body scroll lock while drawer is open ────────────────────────────────
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            {/*
             * Lighthouse LCP fix: preload the navbar background image.
             * React 18+ hoists <link> tags to <head> automatically.
             * This eliminates the render-blocking LCP penalty from the
             * inline background-image style below.
             */}
            <link
                rel="preload"
                as="image"
                href={BANNER_SRC}
                fetchPriority="high"
            />

            <nav
                role="navigation"
                aria-label="Main navigation"
                className="relative w-full h-20 flex items-center justify-between px-6 md:px-10 text-white bg-cover bg-center z-50"
                style={{ backgroundImage: `url('${BANNER_SRC}')` }}
            >
                {/* Overlay — aria-hidden so crawlers skip the decorative layer */}
                <div aria-hidden="true" className="absolute inset-0 bg-black/60" />

                {/* ── Desktop: Nav links ──────────────────────────────────── */}
                <div className="relative z-10 hidden md:flex items-center gap-8 font-black">
                    {NAV_LINKS.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            className="hover:text-yellow-400 transition-colors duration-200"
                        >
                            {label}
                        </Link>
                    ))}
                </div>

                {/* ── Desktop: Auth ───────────────────────────────────────── */}
                <div className="relative z-10 hidden md:flex items-center gap-4 font-black">
                    <DesktopAuth
                        isRegularUser={isRegularUser}
                        isAdmin={isAdmin}
                        displayName={displayName}
                        profileOpen={profileOpen}
                        onToggle={toggleProfile}
                        onClose={closeProfile}
                        onLogout={handleLogout}
                        profileRef={profileRef}
                    />
                </div>

                {/* ── Mobile: Brand ───────────────────────────────────────── */}
                <div className="relative z-10 flex md:hidden font-black text-lg tracking-wide">
                    <Link href="/" className="hover:text-yellow-400 transition-colors">
                        CrypTo Mining
                    </Link>
                </div>

                {/* ── Mobile: Hamburger ───────────────────────────────────── */}
                <button
                    onClick={toggleDrawer}
                    aria-label={isOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isOpen}
                    aria-controls="mobile-drawer"
                    className="relative z-10 flex md:hidden flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-md hover:bg-white/10 transition-colors"
                >
                    <span aria-hidden="true" className={`block w-6 h-0.5 bg-white rounded transition-all duration-300 ${isOpen ? "rotate-45 translate-y-2" : ""}`} />
                    <span aria-hidden="true" className={`block w-6 h-0.5 bg-white rounded transition-all duration-300 ${isOpen ? "opacity-0 scale-x-0" : ""}`} />
                    <span aria-hidden="true" className={`block w-6 h-0.5 bg-white rounded transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`} />
                </button>
            </nav>

            {/* ── Mobile: Backdrop ─────────────────────────────────────────── */}
            <div
                aria-hidden="true"
                onClick={closeDrawer}
                className={`fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300
                    ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
            />

            {/* ── Mobile: Slide-in drawer ──────────────────────────────────── */}
            <div
                id="mobile-drawer"
                role="dialog"
                aria-modal="true"
                aria-label="Mobile navigation menu"
                className={`fixed top-0 right-0 h-full w-72 max-w-[85vw] bg-zinc-900 z-50 md:hidden
                    flex flex-col shadow-2xl transition-transform duration-300 ease-in-out
                    ${isOpen ? "translate-x-0" : "translate-x-full"}`}
            >
                <div className="flex items-center justify-between px-6 h-20 border-b border-white/10">
                    <span className="text-white font-black text-lg">Menu</span>
                    <button
                        onClick={closeDrawer}
                        aria-label="Close menu"
                        className="text-white hover:text-yellow-400 transition-colors"
                    >
                        <IconClose />
                    </button>
                </div>

                {/* Nav links */}
                <nav aria-label="Mobile navigation links" className="flex flex-col px-4 py-4 gap-1">
                    {NAV_LINKS.map(({ href, label }) => (
                        <Link
                            key={href}
                            href={href}
                            onClick={closeDrawer}
                            className="text-white font-semibold px-3 py-3 rounded-lg hover:bg-yellow-500 hover:text-black transition-colors duration-200"
                        >
                            {label}
                        </Link>
                    ))}
                </nav>

                <hr className="border-white/10 mx-4" />

                {/* Mobile auth */}
                <div className="flex flex-col px-4 py-4 gap-1">
                    <MobileAuth
                        isRegularUser={isRegularUser}
                        isAdmin={isAdmin}
                        displayName={displayName}
                        onClose={closeDrawer}
                        onLogout={handleLogout}
                    />
                </div>
            </div>
        </>
    );
}