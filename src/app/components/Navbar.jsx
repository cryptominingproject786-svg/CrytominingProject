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
import Image from "next/image";

// ── Module-level constants ────────────────────────────────────────────────────

const NAV_LINKS = Object.freeze([
    { href: "/", label: "Home" },
    { href: "/mining", label: "Mining" },
    { href: "/privacy", label: "Privacy" },
    { href: "/about", label: "About Us" },
]);

const BANNER_SRC = "/banner.png";
const LOGO_SRC = "/LogoWeb.png";

// ── Profile state reducer ─────────────────────────────────────────────────────

const PROFILE_INIT = Object.freeze({ loading: false, data: null });

function profileReducer(state, action) {
    switch (action.type) {
        case "LOADING": return { loading: true, data: null };
        case "SUCCESS": return { loading: false, data: action.payload };
        case "RESET": return PROFILE_INIT;
        default: return state;
    }
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const IconChevron = memo(function IconChevron({ open }) {
    return (
        <svg
            aria-hidden="true"
            className="w-3.5 h-3.5 transition-transform duration-300"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
    );
});

const IconHome = memo(function IconHome() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <path d="M3 11.5L12 4l9 7.5" />
            <path d="M9 21V12h6v9" />
            <path d="M21 11.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8.5" />
        </svg>
    );
});

const IconMining = memo(function IconMining() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <path d="M4 20l7-7 3 3 7-7" />
            <path d="M5 20l4-4" />
            <path d="M14 9l4-4" />
            <path d="M11 12l5-5" />
        </svg>
    );
});

const IconDashboard = memo(function IconDashboard() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    );
});

const IconSignIn = memo(function IconSignIn() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H4" />
            <path d="M20 19V5" />
            <path d="M17 5h3v14h-3" />
        </svg>
    );
});

const IconSignUp = memo(function IconSignUp() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
            <path d="M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2" />
            <path d="M18 8h4" />
            <path d="M20 6v4" />
        </svg>
    );
});

const IconPrivacy = memo(function IconPrivacy() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <path d="M12 3l7 4v5a7 7 0 0 1-14 0V7l7-4z" />
            <path d="M12 11v4" />
            <path d="M12 17h.01" />
        </svg>
    );
});

const IconAbout = memo(function IconAbout() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    );
});

const IconSettings = memo(function IconSettings() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    );
});

const IconLogout = memo(function IconLogout() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 18, height: 18 }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M16 12H9" />
        </svg>
    );
});

const IconMore = memo(function IconMore() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18 }}>
            <circle cx="6" cy="12" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="18" cy="12" r="1.5" />
        </svg>
    );
});

// ── Avatar ────────────────────────────────────────────────────────────────────

const Avatar = memo(function Avatar({ initial, isAdmin, size = "sm" }) {
    const dim = size === "lg" ? "36px" : "32px";
    return (
        <div
            aria-hidden="true"
            style={{
                width: dim, height: dim, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, fontSize: "13px", letterSpacing: "0.02em",
                background: isAdmin
                    ? "linear-gradient(135deg, #ef4444, #b91c1c)"
                    : "linear-gradient(135deg, #EAB308, #CA8A04)",
                color: isAdmin ? "#fff" : "#000",
                boxShadow: isAdmin
                    ? "0 0 0 2px rgba(239,68,68,0.3), 0 2px 8px rgba(239,68,68,0.25)"
                    : "0 0 0 2px rgba(234,179,8,0.3), 0 2px 8px rgba(234,179,8,0.25)",
            }}
        >
            {initial || "?"}
        </div>
    );
});

// ── DropdownMenu ──────────────────────────────────────────────────────────────

const DropdownMenu = memo(function DropdownMenu({ isAdmin, onClose, onLogout }) {
    const itemStyles = {
        display: "flex",
        alignItems: "center",
        gap: "10px",
    };

    const iconSlot = (icon) => (
        <span style={{ display: "inline-flex", width: 18, height: 18, alignItems: "center", justifyContent: "center" }}>
            {icon}
        </span>
    );

    return (
        <div
            role="menu"
            style={{
                position: "absolute", right: 0, top: "calc(100% + 12px)",
                width: "212px",
                background: "rgba(10, 10, 10, 0.95)",
                border: "1px solid rgba(234,179,8,0.15)",
                borderRadius: "16px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
                padding: "8px",
                zIndex: 50,
                backdropFilter: "blur(20px)",
                animation: "dropIn 0.18s ease",
            }}
        >
            <style>{`
                @keyframes dropIn {
                    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                .dd-item {
                    display: block; padding: 11px 14px;
                    font-size: 13px; font-weight: 550; border-radius: 12px;
                    color: #e5e5e5; text-decoration: none;
                    transition: background 0.2s, color 0.2s;
                    cursor: pointer; width: 100%; text-align: left;
                    background: transparent; border: none;
                    letter-spacing: 0.01em;
                }
                .dd-item:hover { background: rgba(234,179,8,0.12); color: #EAB308; }
                .dd-item-danger:hover { background: rgba(239,68,68,0.14); color: #f87171; }
            `}</style>

            {isAdmin ? (
                <Link role="menuitem" href="/admin/dashboard" onClick={onClose} className="dd-item" style={itemStyles}>
                    {iconSlot(<IconDashboard />)} Admin Dashboard
                </Link>
            ) : (
                <>
                    <Link role="menuitem" href="/dashboard" onClick={onClose} className="dd-item" style={itemStyles}>
                        {iconSlot(<IconDashboard />)} Dashboard
                    </Link>
                    <Link role="menuitem" href="/settings" onClick={onClose} className="dd-item" style={itemStyles}>
                        {iconSlot(<IconSettings />)} Settings
                    </Link>
                </>
            )}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.08)", margin: "6px 0" }} />
            <button role="menuitem" type="button" onClick={onLogout} className="dd-item dd-item-danger" style={itemStyles}>
                {iconSlot(<IconLogout />)} Sign Out
            </button>
        </div>
    );
});

// ── NavLink (desktop) ─────────────────────────────────────────────────────────

const NavLink = memo(function NavLink({ href, label }) {
    return (
        <Link
            href={href}
            style={{
                color: "rgba(255,255,255,0.75)",
                textDecoration: "none",
                fontSize: "13.5px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                padding: "6px 2px",
                position: "relative",
                transition: "color 0.2s",
            }}
            onMouseEnter={e => {
                e.currentTarget.style.color = "#EAB308";
                e.currentTarget.querySelector("span").style.transform = "scaleX(1)";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.color = "rgba(255,255,255,0.75)";
                e.currentTarget.querySelector("span").style.transform = "scaleX(0)";
            }}
        >
            {label}
            <span style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: "1.5px", background: "#EAB308", borderRadius: "2px",
                transform: "scaleX(0)", transformOrigin: "left",
                transition: "transform 0.25s ease",
            }} />
        </Link>
    );
});

// ── DesktopAuth ───────────────────────────────────────────────────────────────

const DesktopAuth = memo(function DesktopAuth({
    isRegularUser, isAdmin, displayName,
    profileOpen, onToggle, onClose, onLogout, profileRef,
}) {
    const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

    if (isRegularUser || isAdmin) {
        return (
            <div style={{ position: "relative" }} ref={profileRef}>
                <button
                    onClick={onToggle}
                    aria-expanded={profileOpen}
                    aria-haspopup="menu"
                    aria-label={`Account menu for ${displayName || "user"}`}
                    style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        background: profileOpen
                            ? "rgba(234,179,8,0.1)"
                            : "rgba(255,255,255,0.04)",
                        border: `1px solid ${profileOpen ? "rgba(234,179,8,0.35)" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: "10px",
                        padding: "5px 10px 5px 6px",
                        color: "#fff", cursor: "pointer",
                        transition: "background 0.2s, border-color 0.2s",
                    }}
                    onMouseEnter={e => {
                        if (!profileOpen) {
                            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                        }
                    }}
                    onMouseLeave={e => {
                        if (!profileOpen) {
                            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                        }
                    }}
                >
                    <Avatar initial={initial} isAdmin={isAdmin} />
                    <span style={{ fontSize: "13px", fontWeight: 600, letterSpacing: "0.01em", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {displayName}
                    </span>
                    <IconChevron open={profileOpen} />
                </button>
                {profileOpen && (
                    <DropdownMenu isAdmin={isAdmin} onClose={onClose} onLogout={onLogout} />
                )}
            </div>
        );
    }

    return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Link
                href="/join"
                style={{
                    color: "rgba(255,255,255,0.7)", textDecoration: "none",
                    fontSize: "13.5px", fontWeight: 600, letterSpacing: "0.03em",
                    padding: "7px 14px", borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    transition: "color 0.2s, border-color 0.2s, background 0.2s",
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.background = "transparent";
                }}
            >
                Sign In
            </Link>
            <Link
                href="/signup"
                style={{
                    background: "linear-gradient(135deg, #EAB308, #CA8A04)",
                    color: "#000", textDecoration: "none",
                    fontSize: "13.5px", fontWeight: 700, letterSpacing: "0.03em",
                    padding: "7px 16px", borderRadius: "8px",
                    boxShadow: "0 2px 12px rgba(234,179,8,0.3)",
                    transition: "filter 0.2s, box-shadow 0.2s, transform 0.15s",
                    display: "inline-block",
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.filter = "brightness(1.1)";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(234,179,8,0.45)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.filter = "none";
                    e.currentTarget.style.boxShadow = "0 2px 12px rgba(234,179,8,0.3)";
                    e.currentTarget.style.transform = "none";
                }}
            >
                Get Started
            </Link>
        </div>
    );
});

// ── Mobile bottom bar ───────────────────────────────────────────────────────

const MobileBottomBar = memo(function MobileBottomBar({ isRegularUser, isAdmin, onLogout }) {
    const [moreOpen, setMoreOpen] = useState(false);
    const moreRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (moreRef.current && !moreRef.current.contains(event.target)) {
                setMoreOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const baseLinks = [
        { href: "/", label: "Home", icon: <IconHome /> },
        { href: "/mining", label: "Mining", icon: <IconMining /> },
    ];

    const accountLinks = isRegularUser || isAdmin
        ? [{ href: isAdmin ? "/admin/dashboard" : "/dashboard", label: "Dashboard", icon: <IconDashboard /> }]
        : [
            { href: "/join", label: "Sign In", icon: <IconSignIn /> },
            { href: "/signup", label: "Sign Up", icon: <IconSignUp /> },
        ];

    const extraLinks = [
        { href: "/privacy", label: "Privacy", icon: <IconPrivacy /> },
        { href: "/about", label: "About Us", icon: <IconAbout /> },
        ...(isRegularUser || isAdmin ? [{ href: "/settings", label: "Settings", icon: <IconSettings /> }] : []),
        ...(isRegularUser || isAdmin ? [{ type: "logout", label: "Sign Out", icon: <IconLogout /> }] : []),
    ];

    const navItems = [...baseLinks, ...accountLinks];

    return (
        <div ref={moreRef} style={{ position: "relative", zIndex: 70 }}>
            <div className="nav-bottom-bar" role="navigation" aria-label="Mobile navigation">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="nav-bottom-link"
                        aria-label={item.label}
                    >
                        <span className="nav-bottom-icon" aria-hidden="true">{item.icon}</span>
                        <span>{item.label}</span>
                    </Link>
                ))}
                <button
                    type="button"
                    className="nav-bottom-link nav-bottom-more-button"
                    aria-haspopup="menu"
                    aria-expanded={moreOpen}
                    onClick={() => setMoreOpen((open) => !open)}
                >
                    <span className="nav-bottom-icon" aria-hidden="true"><IconMore /></span>
                    <span>More</span>
                </button>
            </div>
            {moreOpen && (
                <div className="nav-bottom-dropdown" role="menu" aria-label="More navigation links">
                    {extraLinks.map((item) => {
                        if (item.type === "logout") {
                            return (
                                <button
                                    key="logout"
                                    type="button"
                                    className="nav-bottom-dropdown-link"
                                    role="menuitem"
                                    onClick={() => {
                                        setMoreOpen(false);
                                        onLogout();
                                    }}
                                >
                                    <span className="nav-bottom-dropdown-icon" aria-hidden="true">{item.icon}</span>
                                    {item.label}
                                </button>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="nav-bottom-dropdown-link"
                                role="menuitem"
                                onClick={() => setMoreOpen(false)}
                            >
                                <span className="nav-bottom-dropdown-icon" aria-hidden="true">{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
});

// ── Navbar ────────────────────────────────────────────────────────────────────

export default function Navbar() {
    const { data: session, status } = useSession();

    const [profileOpen, setProfileOpen] = useState(false);
    const [profile, dispatchProfile] = useReducer(profileReducer, PROFILE_INIT);

    const profileRef = useRef(null);

    const isRegularUser = useMemo(
        () => status === "authenticated" && session?.user?.role === "user",
        [status, session?.user?.role]
    );

    const isAdmin = useMemo(
        () => status === "authenticated" && session?.user?.role === "admin",
        [status, session?.user?.role]
    );

    const displayName = useMemo(() => {
        const pd = profile.data;
        const uRole = session?.user?.role;
        const uEmail = session?.user?.email;
        if (
            pd?.username &&
            pd?.role === uRole &&
            pd?.email?.toLowerCase().trim() === uEmail?.toLowerCase().trim()
        ) return pd.username;
        return "";
    }, [profile.data, session?.user?.role, session?.user?.email]);

    useEffect(() => {
        if (status !== "authenticated") { dispatchProfile({ type: "RESET" }); return; }

        const role = session?.user?.role;
        const email = session?.user?.email;

        if (!role || !email || (role !== "user" && role !== "admin")) {
            dispatchProfile({ type: "RESET" }); return;
        }

        let canceled = false;
        dispatchProfile({ type: "LOADING" });

        (async () => {
            try {
                const endpoint = role === "admin" ? "/api/auth/admin-profile" : "/api/user/profile";
                const res = await fetch(endpoint, { method: "GET", credentials: "include", cache: "no-store" });
                if (canceled) return;
                if (!res.ok) { dispatchProfile({ type: "RESET" }); return; }
                const json = await res.json();
                if (!json?.data) { dispatchProfile({ type: "RESET" }); return; }
                if (
                    json.data.email?.toLowerCase() !== email.toLowerCase() ||
                    json.data.role !== role
                ) { dispatchProfile({ type: "RESET" }); return; }
                if (!canceled) dispatchProfile({ type: "SUCCESS", payload: json.data });
            } catch {
                if (!canceled) dispatchProfile({ type: "RESET" });
            }
        })();

        return () => { canceled = true; };
    }, [status, session?.user?.role, session?.user?.email]);

    const closeProfile = useCallback(() => setProfileOpen(false), []);
    const toggleProfile = useCallback(() => setProfileOpen((p) => !p), []);

    const handleLogout = useCallback(async () => {
        await signOut({ redirect: true, callbackUrl: "/" });
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (profileRef.current && !profileRef.current.contains(e.target))
                setProfileOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);


    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            <link rel="preload" as="image" href={BANNER_SRC} fetchPriority="high" />

            <style>{`
                @media (min-width: 768px) {
                    .nav-desktop-links { display: flex !important; }
                    .nav-desktop-auth  { display: flex !important; }
                }
            `}</style>

            <nav
                role="navigation"
                aria-label="Main navigation"
                style={{
                    position: "relative",
                    width: "100%",
                    height: "68px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 24px",
                    color: "#fff",
                    backgroundImage: `url('${BANNER_SRC}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    zIndex: 50,
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                {/* Dark overlay with slight blur-tint for glassmorphism feel */}
                <div style={{
                    position: "absolute", inset: 0,
                    background: "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(5,5,5,0.72) 100%)",
                    backdropFilter: "blur(2px)",
                }} />

                {/* ── Brand ── */}
                <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center" }}>
                    <Link
                        href="/"
                        style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            textDecoration: "none", color: "#fff",
                        }}
                    >
                        <div style={{ filter: "drop-shadow(0 2px 10px rgba(234,179,8,0.35))" }}>
                            <Image
                                src={LOGO_SRC}
                                alt="BittXS logo"
                                width={108}
                                height={90}
                                priority
                            />
                        </div>
                        <span style={{
                            fontSize: "18px", fontWeight: 800, letterSpacing: "0.08em",
                            background: "linear-gradient(135deg, #fff 40%, #EAB308 100%)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}>
                            BittXS
                        </span>
                    </Link>
                </div>

                {/* ── Desktop: Nav links ── */}
                <div style={{
                    position: "relative", zIndex: 10,
                    display: "none",
                    alignItems: "center", gap: "32px",
                }}
                    className="nav-desktop-links"
                >
                    {NAV_LINKS.map(({ href, label }) => (
                        <NavLink key={href} href={href} label={label} />
                    ))}
                </div>

                {/* ── Desktop: Auth ── */}
                <div style={{
                    position: "relative", zIndex: 10,
                    display: "none", alignItems: "center", gap: "12px",
                }}
                    className="nav-desktop-auth"
                >
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

                {/* Responsive CSS */}
                <style>{`
                    @media (min-width: 768px) {
                        .nav-desktop-links { display: flex !important; }
                        .nav-desktop-auth  { display: flex !important; }
                    }
                `}</style>
            </nav>

            <MobileBottomBar isRegularUser={isRegularUser} isAdmin={isAdmin} onLogout={handleLogout} />
        </>
    );
}