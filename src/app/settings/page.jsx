"use client";

/**
 * @file SettingsPage.jsx
 * @description User account settings — displays profile info and password reset.
 * Fully optimized: single fetch, stable callbacks, zero redundant renders,
 * semantic HTML for on-page SEO, accessible ARIA markup.
 */

import { useCallback, useEffect, useReducer, useTransition } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// Types / Constants
// ─────────────────────────────────────────────────────────────────────────────

const MIN_PASSWORD_LENGTH = 6;

/** Shape of the modal form — kept separate from profile so each slice
 *  re-renders in isolation (profile data never triggers modal re-render). */
const MODAL_INITIAL = {
  newPassword: "",
  confirmPassword: "",
  error: "",
  success: "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Reducers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Profile reducer — manages fetch lifecycle + data.
 * Using a reducer (vs. four separate useState calls) collapses into
 * a single state object → one dispatch = one re-render.
 */
function profileReducer(state, action) {
  switch (action.type) {
    case "FETCH_SUCCESS":
      return { ...state, loading: false, data: action.payload };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

const PROFILE_INITIAL = { loading: true, data: null, error: "" };

/**
 * Modal reducer — manages password form state.
 * Single dispatch collapses field + feedback updates into one re-render.
 */
function modalReducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value, error: "", success: "" };
    case "SET_ERROR":
      return { ...state, error: action.payload, success: "" };
    case "SET_SUCCESS":
      return { ...state, success: action.payload, newPassword: "", confirmPassword: "", error: "" };
    case "RESET":
      return MODAL_INITIAL;
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components (module-level → never re-created on parent render)
// ─────────────────────────────────────────────────────────────────────────────

/** Single read-only profile field row */
function ProfileField({ label, value, icon }) {
  return (
    <div className="group relative flex items-center gap-4 rounded-2xl border border-yellow-500/10 bg-black/40 px-5 py-4 transition-all duration-300 hover:border-yellow-500/30 hover:bg-black/60">
      {/* Icon glow capsule */}
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 text-xl text-yellow-400 transition-colors duration-300 group-hover:bg-yellow-500/20"
      >
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        {/* dt/dd pair — semantically correct for label:value */}
        <dt className="text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-500/60">
          {label}
        </dt>
        <dd className="mt-0.5 truncate text-sm font-semibold text-white/90">
          {value || <span className="italic text-white/30">Not set</span>}
        </dd>
      </div>

      {/* Decorative right accent line */}
      <span
        aria-hidden="true"
        className="absolute right-0 top-1/2 h-6 w-0.5 -translate-y-1/2 rounded-full bg-yellow-500/0 transition-all duration-300 group-hover:bg-yellow-500/40"
      />
    </div>
  );
}

/** Password input with label — uncontrolled via dispatch */
function PasswordField({ id, label, value, onChange, placeholder }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-yellow-500/70"
      >
        {label}
      </label>
      <input
        id={id}
        type="password"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={id === "newPassword" ? "new-password" : "new-password"}
        className="w-full rounded-xl border border-yellow-500/20 bg-black/60 px-4 py-3 text-sm text-white/90 placeholder-white/20 outline-none transition-all duration-200 focus:border-yellow-500/60 focus:ring-2 focus:ring-yellow-500/10"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading Skeleton
// ─────────────────────────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading profile" className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[62px] animate-pulse rounded-2xl bg-yellow-500/5"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [profile, dispatchProfile] = useReducer(profileReducer, PROFILE_INITIAL);
  const [modal, dispatchModal] = useReducer(modalReducer, MODAL_INITIAL);
  const [showModal, setShowModal] = useReducer((s) => !s, false);
  const [isPending, startTransition] = useTransition();

  // ── Fetch profile (once on mount) ────────────────────────────────────────
  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const res = await fetch("/api/user/profile", { cache: "no-store" });
        const json = await res.json();
        if (!active) return;

        if (!res.ok) {
          dispatchProfile({ type: "FETCH_ERROR", payload: json?.error || "Unable to load account information." });
          return;
        }

        dispatchProfile({
          type: "FETCH_SUCCESS",
          payload: {
            username: json?.data?.username ?? "",
            email: json?.data?.email ?? "",
            phone: json?.data?.phone ?? "",
          },
        });
      } catch {
        if (!active) return;
        dispatchProfile({ type: "FETCH_ERROR", payload: "Network error. Please refresh." });
      }
    }

    loadProfile();
    return () => { active = false; };
  }, []);

  // ── Modal open/close — stable, no dependencies ───────────────────────────
  const openModal = useCallback(() => {
    dispatchModal({ type: "RESET" });
    setShowModal();
  }, []);

  const closeModal = useCallback(() => {
    setShowModal();
    dispatchModal({ type: "RESET" });
  }, []);

  // ── Password submit ──────────────────────────────────────────────────────
  const handlePasswordChange = useCallback(
    (e) => {
      e.preventDefault();

      const { newPassword, confirmPassword } = modal;

      if (newPassword.trim().length < MIN_PASSWORD_LENGTH) {
        dispatchModal({ type: "SET_ERROR", payload: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` });
        return;
      }
      if (newPassword !== confirmPassword) {
        dispatchModal({ type: "SET_ERROR", payload: "Passwords do not match." });
        return;
      }

      startTransition(async () => {
        try {
          const res = await fetch("/api/user/password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ newPassword, confirmPassword }),
          });
          const payload = await res.json();

          if (!res.ok) {
            dispatchModal({ type: "SET_ERROR", payload: payload?.error || "Unable to update password." });
            return;
          }
          dispatchModal({ type: "SET_SUCCESS", payload: "Password updated successfully." });
        } catch {
          dispatchModal({ type: "SET_ERROR", payload: "Network error. Please try again." });
        }
      });
    },
    [modal]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/*
       * ── SEO: <main> with structured data markup ──────────────────────────
       * itemScope / itemType signals to crawlers this is a WebPage.
       * The <h1> with descriptive text satisfies on-page heading hierarchy.
       */}
      <main
        aria-label="Account Settings"
        itemScope
        itemType="https://schema.org/WebPage"
        className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black px-4 py-10 sm:px-6 md:px-10 text-white flex justify-center items-start"
      >
        {/* ── Ambient background glow (decorative, non-interactive) ── */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-yellow-500/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-yellow-500/4 blur-3xl" />
        </div>

        <div className="relative w-full max-w-2xl flex flex-col gap-6">

          {/* ── Page header ───────────────────────────────────────── */}
          <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              {/* SEO: primary keyword in h1 */}
              <h1
                itemProp="name"
                className="text-3xl font-extrabold uppercase tracking-widest text-yellow-400"
              >
                Settings
              </h1>
              <p
                itemProp="description"
                className="mt-1 text-sm text-white/40"
              >
                Manage your account information and security preferences.
              </p>
            </div>

            {/* Reset Password CTA — always visible, not gated behind load */}
            <button
              type="button"
              onClick={openModal}
              aria-haspopup="dialog"
              aria-controls="reset-password-dialog"
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-5 py-2.5 text-sm font-bold uppercase tracking-widest text-yellow-400 transition-all duration-300 hover:border-yellow-500/60 hover:bg-yellow-500/20 hover:shadow-lg hover:shadow-yellow-500/10 focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
            >
              <span aria-hidden="true">🔑</span>
              Reset Password
            </button>
          </header>

          {/* ── Account card ──────────────────────────────────────── */}
          <section
            aria-labelledby="account-info-heading"
            className="rounded-3xl border border-yellow-500/10 bg-gray-900/80 p-6 shadow-2xl shadow-black/60 backdrop-blur-md"
          >
            {/* Decorative top accent bar */}
            <div
              aria-hidden="true"
              className="mb-6 h-0.5 w-16 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500/0"
            />

            <h2
              id="account-info-heading"
              className="mb-5 text-xs font-bold uppercase tracking-[0.3em] text-yellow-500/60"
            >
              Account Information
            </h2>

            {/* ── Conditional render: loading / error / data ──────── */}
            {profile.loading ? (
              <ProfileSkeleton />
            ) : profile.error ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-500/30 bg-red-950/40 px-5 py-4 text-sm text-red-300"
              >
                {profile.error}
              </div>
            ) : (
              /* Semantic definition list — screen-reader & SEO friendly */
              <dl className="space-y-3">
                <ProfileField icon="👤" label="Username" value={profile.data.username} />
                <ProfileField icon="✉️" label="Email Address" value={profile.data.email} />
                <ProfileField icon="📱" label="Phone Number" value={profile.data.phone} />
              </dl>
            )}
          </section>

          {/* ── Security card (static — no fetch dependency) ──────── */}
          <section
            aria-labelledby="security-heading"
            className="rounded-3xl border border-yellow-500/10 bg-gray-900/80 p-6 shadow-2xl shadow-black/60 backdrop-blur-md"
          >
            <div
              aria-hidden="true"
              className="mb-6 h-0.5 w-16 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500/0"
            />

            <h2
              id="security-heading"
              className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-yellow-500/60"
            >
              Security
            </h2>
            <p className="mb-5 text-sm text-white/30">
              Keep your account safe with a strong, unique password.
            </p>

            <div className="flex items-center justify-between rounded-2xl border border-yellow-500/10 bg-black/40 px-5 py-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10 text-xl text-yellow-400"
                >
                  🔒
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-500/60">
                    Password
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-white/50 tracking-widest">
                    ••••••••
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openModal}
                aria-haspopup="dialog"
                aria-controls="reset-password-dialog"
                className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-yellow-400 transition-all duration-200 hover:border-yellow-500/50 hover:bg-yellow-500/20"
              >
                Change
              </button>
            </div>
          </section>

        </div>
      </main>

      {/* ── Reset Password Modal ──────────────────────────────────────────── */}
      {showModal && (
        <div
          role="dialog"
          id="reset-password-dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-desc"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-3xl border border-yellow-500/20 bg-gray-900 p-7 shadow-2xl shadow-black/60">

            {/* Modal header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2
                  id="modal-title"
                  className="text-xl font-extrabold uppercase tracking-widest text-yellow-400"
                >
                  Reset Password
                </h2>
                <p
                  id="modal-desc"
                  className="mt-1 text-sm text-white/40"
                >
                  Enter a new password for your account.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close reset password dialog"
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Divider */}
            <div aria-hidden="true" className="mb-6 h-px bg-yellow-500/10" />

            {/* Form — onSubmit handles validation before any fetch */}
            <form className="space-y-4" onSubmit={handlePasswordChange} noValidate>
              <PasswordField
                id="newPassword"
                label="New Password"
                value={modal.newPassword}
                onChange={(e) =>
                  dispatchModal({ type: "SET_FIELD", field: "newPassword", value: e.target.value })
                }
                placeholder={`Min. ${MIN_PASSWORD_LENGTH} characters`}
              />

              <PasswordField
                id="confirmPassword"
                label="Confirm Password"
                value={modal.confirmPassword}
                onChange={(e) =>
                  dispatchModal({ type: "SET_FIELD", field: "confirmPassword", value: e.target.value })
                }
                placeholder="Re-enter new password"
              />

              {/* Feedback messages */}
              {modal.error && (
                <p role="alert" className="text-sm font-semibold text-red-400">
                  ⚠ {modal.error}
                </p>
              )}
              {modal.success && (
                <p role="status" className="text-sm font-semibold text-emerald-400">
                  ✓ {modal.success}
                </p>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex justify-center rounded-xl border border-white/10 px-5 py-3 text-sm font-bold uppercase tracking-widest text-white/50 transition hover:border-white/20 hover:text-white/80"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  aria-busy={isPending}
                  className="inline-flex justify-center rounded-xl bg-yellow-500 px-5 py-3 text-sm font-extrabold uppercase tracking-widest text-black transition-all duration-200 hover:bg-yellow-400 hover:shadow-lg hover:shadow-yellow-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "Updating…" : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}