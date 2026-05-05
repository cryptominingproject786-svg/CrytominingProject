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

const IconClose = memo(function IconClose() {
    return (
        <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    );
});

const IconMenu = memo(function IconMenu({ open }) {
    return (
        <div className="flex flex-col justify-center items-center w-5 h-5 gap-[5px]">
            <span
                style={{
                    display: "block", width: "20px", height: "1.5px",
                    background: "currentColor", borderRadius: "2px",
                    transition: "transform 0.3s ease, opacity 0.3s ease",
                    transform: open ? "rotate(45deg) translateY(6.5px)" : "none",
                }}
            />
            <span
                style={{
                    display: "block", width: "20px", height: "1.5px",
                    background: "currentColor", borderRadius: "2px",
                    transition: "opacity 0.3s ease, transform 0.3s ease",
                    opacity: open ? 0 : 1,
                    transform: open ? "scaleX(0)" : "none",
                }}
            />
            <span
                style={{
                    display: "block", width: "20px", height: "1.5px",
                    background: "currentColor", borderRadius: "2px",
                    transition: "transform 0.3s ease, opacity 0.3s ease",
                    transform: open ? "rotate(-45deg) translateY(-6.5px)" : "none",
                }}
            />
        </div>
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
    return (
        <div
            role="menu"
            style={{
                position: "absolute", right: 0, top: "calc(100% + 12px)",
                width: "192px",
                background: "rgba(10, 10, 10, 0.95)",
                border: "1px solid rgba(234,179,8,0.15)",
                borderRadius: "12px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
                padding: "6px",
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
                    display: block; padding: 9px 12px;
                    font-size: 13px; font-weight: 500; border-radius: 8px;
                    color: #e5e5e5; text-decoration: none;
                    transition: background 0.15s, color 0.15s;
                    cursor: pointer; width: 100%; text-align: left;
                    background: transparent; border: none;
                    letter-spacing: 0.01em;
                }
                .dd-item:hover { background: rgba(234,179,8,0.12); color: #EAB308; }
                .dd-item-danger:hover { background: rgba(239,68,68,0.12); color: #f87171; }
            `}</style>

            {isAdmin ? (
                <Link role="menuitem" href="/admin/dashboard" onClick={onClose} className="dd-item">
                    ⚡ Admin Dashboard
                </Link>
            ) : (
                <>
                    <Link role="menuitem" href="/dashboard" onClick={onClose} className="dd-item">
                        Dashboard
                    </Link>
                    <Link role="menuitem" href="/settings" onClick={onClose} className="dd-item">
                        Settings
                    </Link>
                </>
            )}
            <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "4px 0" }} />
            <button role="menuitem" onClick={onLogout} className="dd-item dd-item-danger">
                Sign Out
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

// ── MobileAuth ────────────────────────────────────────────────────────────────

const MobileAuth = memo(function MobileAuth({
    isRegularUser, isAdmin, displayName, onClose, onLogout,
}) {
    const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

    if (isRegularUser || isAdmin) {
        return (
            <div>
                {/* User card */}
                <div style={{
                    display: "flex", alignItems: "center", gap: "12px",
                    padding: "12px 14px", marginBottom: "8px",
                    background: "rgba(234,179,8,0.06)",
                    border: "1px solid rgba(234,179,8,0.12)",
                    borderRadius: "12px",
                }}>
                    <Avatar initial={initial} isAdmin={isAdmin} size="lg" />
                    <div>
                        <p style={{ color: "#fff", fontWeight: 700, fontSize: "14px", margin: 0, letterSpacing: "0.01em" }}>
                            {displayName}
                        </p>
                        <p style={{ color: isAdmin ? "#f87171" : "#EAB308", fontSize: "11px", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                            {isAdmin ? "Administrator" : "Member"}
                        </p>
                    </div>
                </div>

                {isAdmin ? (
                    <MobileNavItem href="/admin/dashboard" onClick={onClose} icon="⚡">Admin Dashboard</MobileNavItem>
                ) : (
                    <>
                        <MobileNavItem href="/dashboard" onClick={onClose} icon="▦">Dashboard</MobileNavItem>
                        <MobileNavItem href="/settings" onClick={onClose} icon="⚙">Settings</MobileNavItem>
                    </>
                )}
                <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
                <button
                    onClick={onLogout}
                    style={{
                        width: "100%", textAlign: "left",
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "12px 14px", borderRadius: "10px",
                        background: "transparent", border: "none",
                        color: "#f87171", fontSize: "14px", fontWeight: 600,
                        cursor: "pointer", letterSpacing: "0.01em",
                        transition: "background 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                    <span style={{ fontSize: "16px" }}>↩</span> Sign Out
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <Link
                href="/join"
                onClick={onClose}
                style={{
                    display: "block", textAlign: "center",
                    padding: "13px", borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    color: "#fff", textDecoration: "none",
                    fontSize: "14px", fontWeight: 600,
                    transition: "background 0.2s, border-color 0.2s",
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                }}
            >
                Sign In
            </Link>
            <Link
                href="/signup"
                onClick={onClose}
                style={{
                    display: "block", textAlign: "center",
                    padding: "13px", borderRadius: "10px",
                    background: "linear-gradient(135deg, #EAB308, #CA8A04)",
                    color: "#000", textDecoration: "none",
                    fontSize: "14px", fontWeight: 700,
                    boxShadow: "0 4px 16px rgba(234,179,8,0.3)",
                }}
            >
                Get Started →
            </Link>
        </div>
    );
});

// ── MobileNavItem helper ──────────────────────────────────────────────────────

const MobileNavItem = memo(function MobileNavItem({ href, onClick, icon, children }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "12px 14px", borderRadius: "10px",
                color: "rgba(255,255,255,0.85)", textDecoration: "none",
                fontSize: "14px", fontWeight: 600,
                transition: "background 0.15s, color 0.15s",
                letterSpacing: "0.01em",
            }}
            onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(234,179,8,0.08)";
                e.currentTarget.style.color = "#EAB308";
            }}
            onMouseLeave={e => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(255,255,255,0.85)";
            }}
        >
            <span style={{ fontSize: "15px", opacity: 0.7 }}>{icon}</span>
            {children}
        </Link>
    );
});

const MobileBottomBar = memo(function MobileBottomBar({ isRegularUser, isAdmin }) {
    const accountHref = isAdmin ? "/admin/dashboard" : isRegularUser ? "/dashboard" : "/join";
    const accountLabel = isAdmin ? "Admin" : isRegularUser ? "Account" : "Join";

    const items = [
        { href: "/", label: "Home", icon: "🏠" },
        { href: "/mining", label: "Mining", icon: "⛏️" },
        { href: "/privacy", label: "Privacy", icon: "🔒" },
        { href: accountHref, label: accountLabel, icon: "👤" },
    ];

    return (
        <div className="nav-bottom-bar" role="navigation" aria-label="Mobile navigation">
            {items.map((item) => (
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
                .nav-bottom-bar {
                    position: fixed;
                    inset: auto 0 0 0;
                    z-index: 60;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 8px;
                    padding: 10px 10px calc(10px + env(safe-area-inset-bottom));
                    background: rgba(8, 8, 8, 0.96);
                    backdrop-filter: blur(18px);
                    border-top: 1px solid rgba(255,255,255,0.08);
                }
                .nav-bottom-link {
                    flex: 1 1 0;
                    min-width: 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: 10px 6px;
                    border-radius: 18px;
                    color: rgba(255,255,255,0.78);
                    text-decoration: none;
                    font-size: 10.75px;
                    font-weight: 700;
                    letter-spacing: 0.02em;
                    transition: background 0.15s, color 0.15s, transform 0.15s;
                }
                .nav-bottom-link:hover {
                    background: rgba(255,255,255,0.06);
                    color: #EAB308;
                    transform: translateY(-1px);
                }
                .nav-bottom-icon {
                    display: inline-flex;
                    font-size: 18px;
                    line-height: 1;
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
                        .nav-bottom-bar    { display: none !important; }
                        nav { padding: 0 40px !important; }
                    }
                `}</style>
            </nav>

            <MobileBottomBar
                isRegularUser={isRegularUser}
                isAdmin={isAdmin}
            />
        </>
    );
}