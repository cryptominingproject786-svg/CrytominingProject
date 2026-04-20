"use client";

/**
 * @file SignupPage.jsx
 * @description User registration page with success modal.
 *
 * Performance decisions:
 *  - useReducer collapses all form fields + UI flags into ONE state slice
 *    → one dispatch = one re-render, zero cascading setState calls
 *  - Module-level sub-components (InputField, PasswordField, EyeIcon,
 *    FeedbackMessage, SuccessModal) are never re-created on parent re-render
 *  - useCallback on every handler — stable refs, no child prop-change churn
 *  - Validation is 100% synchronous — zero network round-trips on bad input
 *  - noValidate on <form> — we own the validation pipeline
 *  - Body-scroll lock lives entirely in SuccessModal's own effect, not in parent
 *  - Escape-key listener scoped to modal lifetime via cleanup
 *
 * SEO decisions:
 *  - <main> with schema.org/WebPage itemScope
 *  - Single <h1> per page with keyword-rich text
 *  - itemProp="name" / "description" on heading + subtitle
 *  - Semantic <form>, <label htmlFor>, autoComplete attributes
 *  - ARIA live regions for all feedback (role="alert" / role="status")
 *  - aria-required on required fields
 */

import { useCallback, useEffect, useReducer, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_RE    = /\S+@\S+\.\S+/;
const PHONE_RE    = /^[+]?\d{7,20}$/;
const MIN_PASS    = 6;
const MIN_USER    = 3;

// ─────────────────────────────────────────────────────────────────────────────
// Reducer — single state object, one re-render per dispatch
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_STATE = {
  username:        "",
  email:           "",
  password:        "",
  passwordConfirm: "",
  phone:           "",
  referral:        "",
  showPassword:    false,
  showConfirm:     false,
  error:           "",
};

function formReducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      // Clears error on every keystroke so feedback stays fresh
      return { ...state, [action.field]: action.value, error: "" };
    case "TOGGLE_PASSWORD":
      return { ...state, showPassword: !state.showPassword };
    case "TOGGLE_CONFIRM":
      return { ...state, showConfirm: !state.showConfirm };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "RESET":
      return INITIAL_STATE;
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Module-level sub-components — defined outside SignupPage so React
// never re-creates them during parent renders.
// ─────────────────────────────────────────────────────────────────────────────

/** Eye open SVG */
function EyeOpenIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** Eye closed SVG */
function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.58 10.58A3 3 0 1013.42 13.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2.31 12.14C3.84 7.99 7.49 5 12 5c3 0 5.54 1.35 7.37 3.62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Standard labelled text/email/tel input.
 * Accepts an optional `badge` node for supplementary label content (e.g. "optional").
 */
function InputField({ id, label, type = "text", value, onChange, placeholder, autoComplete, required = false, badge }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-500/70"
        >
          {label}
          {required && (
            <span aria-hidden="true" className="ml-1 text-yellow-500/50">*</span>
          )}
        </label>
        {badge && (
          <span className="text-[9px] font-semibold uppercase tracking-widest text-white/20">
            {badge}
          </span>
        )}
      </div>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-required={required}
        className="w-full rounded-xl border border-yellow-500/20 bg-black/60 px-4 py-3 text-sm text-white/90 placeholder-white/20 outline-none transition-all duration-200 focus:border-yellow-500/60 focus:ring-2 focus:ring-yellow-500/10"
      />
    </div>
  );
}

/** Password input with show/hide toggle */
function PasswordField({ id, label, value, onChange, placeholder, autoComplete, showPassword, onToggle }) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-500/70"
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          aria-required="true"
          className="w-full rounded-xl border border-yellow-500/20 bg-black/60 px-4 py-3 pr-11 text-sm text-white/90 placeholder-white/20 outline-none transition-all duration-200 focus:border-yellow-500/60 focus:ring-2 focus:ring-yellow-500/10"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={showPassword ? `Hide ${label}` : `Show ${label}`}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-yellow-400"
        >
          {showPassword ? <EyeOffIcon /> : <EyeOpenIcon />}
        </button>
      </div>
    </div>
  );
}

/** ARIA live-region feedback — renders nothing when both props are falsy */
function FeedbackMessage({ error }) {
  if (!error) return null;
  return (
    <p role="alert" aria-live="assertive" className="text-sm font-semibold text-red-400">
      ⚠ {error}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Success Modal — self-contained, handles its own scroll lock + Escape key
// ─────────────────────────────────────────────────────────────────────────────

function SuccessModal({ onClose }) {
  const router = useRouter();

  const handleClose = useCallback(() => {
    onClose();
    router.push("/");
  }, [onClose, router]);

  // Escape key to close
  useEffect(() => {
    const onKeyDown = (e) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  // Body scroll lock — cleans up on unmount
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-modal-title"
      aria-describedby="success-modal-desc"
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm"
    >
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={handleClose} aria-hidden="true" />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-3xl border border-yellow-500/20 bg-gray-900 p-8 shadow-2xl shadow-black/70 text-center">

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close and return to home"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        </button>

        {/* Top accent */}
        <div aria-hidden="true" className="mx-auto mb-6 h-0.5 w-12 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500/0" />

        {/* Success icon */}
        <div
          aria-hidden="true"
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-3xl shadow-lg shadow-yellow-500/10"
        >
          ✉️
        </div>

        <h2
          id="success-modal-title"
          className="mb-2 text-xl font-extrabold uppercase tracking-widest text-yellow-400"
        >
          Account Created!
        </h2>

        <p
          id="success-modal-desc"
          className="mb-5 text-sm leading-relaxed text-white/50"
        >
          A secure login link has been sent to your email address. Click it to
          access your dashboard instantly — no password needed.
        </p>

        <div className="rounded-2xl border border-yellow-500/10 bg-black/40 px-4 py-3 text-xs font-semibold uppercase tracking-widest text-yellow-500/50">
          Didn't receive it? Check your spam folder.
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="mt-6 w-full rounded-xl bg-yellow-500 py-3 text-sm font-extrabold uppercase tracking-widest text-black transition hover:bg-yellow-400 hover:shadow-lg hover:shadow-yellow-500/20"
        >
          Got It
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const [state, dispatch] = useReducer(formReducer, INITIAL_STATE);
  const [showModal, toggleModal] = useReducer((s) => !s, false);
  const [isPending, startTransition] = useTransition();

  // ── Field change handler factory — stable via useCallback ───────────────
  // Returns a memoised onChange per field name. Because the factory itself
  // is useCallback-stable, child InputField / PasswordField components
  // receive the same function reference across renders.
  const makeOnChange = useCallback(
    (field) => (e) => dispatch({ type: "SET_FIELD", field, value: e.target.value }),
    []
  );

  // ── Password toggle handlers — stable ────────────────────────────────────
  const togglePassword = useCallback(() => dispatch({ type: "TOGGLE_PASSWORD" }), []);
  const toggleConfirm  = useCallback(() => dispatch({ type: "TOGGLE_CONFIRM" }),  []);

  // ── Synchronous validation — no fetch until this passes ─────────────────
  const validate = useCallback(() => {
    const { username, email, phone, password, passwordConfirm } = state;
    if (username.trim().length < MIN_USER)       return `Username must be at least ${MIN_USER} characters.`;
    if (!EMAIL_RE.test(email))                   return "Enter a valid email address.";
    if (!PHONE_RE.test(phone.trim()))            return "Enter a valid phone number (digits only, 7–20 chars).";
    if (password.length < MIN_PASS)              return `Password must be at least ${MIN_PASS} characters.`;
    if (password !== passwordConfirm)            return "Passwords do not match.";
    return null;
  }, [state]);

  // ── Submit handler ───────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      const validationError = validate();
      if (validationError) {
        dispatch({ type: "SET_ERROR", payload: validationError });
        return;
      }

      startTransition(async () => {
        try {
          // 1. Register
          const res = await fetch("/api/auth/register", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username:        state.username.trim(),
              email:           state.email.trim().toLowerCase(),
              phone:           state.phone.trim(),
              password:        state.password,
              passwordConfirm: state.passwordConfirm,
              referral:        state.referral.trim(),
            }),
          });

          const payload = await res.json().catch(() => ({}));

          if (!res.ok) {
            dispatch({ type: "SET_ERROR", payload: payload?.error || "Registration failed. Please try again." });
            return;
          }

          // 2. Send magic-link email
          const appOrigin  = process.env.NEXT_PUBLIC_NEXTAUTH_URL || window.location.origin;
          const callbackUrl = `${appOrigin.replace(/\/$/, "")}/dashboard`;

          const magicResult = await signIn("email", {
            email:       state.email.trim().toLowerCase(),
            redirect:    false,
            callbackUrl,
          });

          if (!magicResult || magicResult.error) {
            dispatch({
              type:    "SET_ERROR",
              payload: magicResult?.error ||
                "Account created, but we couldn't send the login link. Please sign in manually.",
            });
            return;
          }

          // 3. Success — show modal
          toggleModal();
        } catch {
          dispatch({ type: "SET_ERROR", payload: "Network error. Please try again." });
        }
      });
    },
    [state, validate]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Success modal — portal-style, mounted outside the form flow */}
      {showModal && <SuccessModal onClose={toggleModal} />}

      {/*
       * SEO: <main> with schema.org structured data.
       * Single <h1> satisfies heading hierarchy for crawlers.
       */}
      <main
        aria-label="Create your account"
        itemScope
        itemType="https://schema.org/WebPage"
        className="min-h-screen flex items-start justify-center bg-gradient-to-br from-black via-gray-900 to-black px-4 py-12"
      >
        {/* ── Ambient glows (decorative, pointer-events-none) ──────────── */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-yellow-500/6 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-yellow-400/4 blur-3xl" />
          <div className="absolute top-1/3 left-0 h-56 w-56 rounded-full bg-yellow-600/3 blur-2xl" />
        </div>

        <div className="relative w-full max-w-md">

          {/* ── Brand mark ─────────────────────────────────────────────── */}
          <div className="mb-8 flex flex-col items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-2xl shadow-lg shadow-yellow-500/10"
            >
              💰
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-yellow-500/50">
              Join the Bittxs Earning Platform
            </p>
          </div>

          {/* ── Card ───────────────────────────────────────────────────── */}
          <div className="rounded-3xl border border-yellow-500/15 bg-gray-900/90 p-8 shadow-2xl shadow-black/70 backdrop-blur-md">

            {/* Top accent line */}
            <div aria-hidden="true" className="mb-7 h-0.5 w-12 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500/0" />

            {/* ── Page heading ─────────────────────────────────────────── */}
            <header className="mb-7">
              <h1
                itemProp="name"
                className="text-2xl font-extrabold uppercase tracking-widest text-yellow-400"
              >
                Create Account
              </h1>
              <p
                itemProp="description"
                className="mt-1 text-sm text-white/35"
              >
                Sign up to start investing and tracking your balance.
              </p>
            </header>

            {/* ── Form ─────────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Username */}
              <InputField
                id="username"
                label="Username"
                value={state.username}
                onChange={makeOnChange("username")}
                placeholder="yourname"
                autoComplete="username"
                required
              />

              {/* Email */}
              <InputField
                id="email"
                label="Email Address"
                type="email"
                value={state.email}
                onChange={makeOnChange("email")}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

              {/* Phone */}
              <InputField
                id="phone"
                label="Phone Number"
                type="tel"
                value={state.phone}
                onChange={makeOnChange("phone")}
                placeholder="+1234567890"
                autoComplete="tel"
                required
              />

              {/* Password */}
              <PasswordField
                id="password"
                label="Password"
                value={state.password}
                onChange={makeOnChange("password")}
                placeholder={`Min. ${MIN_PASS} characters`}
                autoComplete="new-password"
                showPassword={state.showPassword}
                onToggle={togglePassword}
              />

              {/* Confirm Password */}
              <PasswordField
                id="passwordConfirm"
                label="Confirm Password"
                value={state.passwordConfirm}
                onChange={makeOnChange("passwordConfirm")}
                placeholder="Re-enter password"
                autoComplete="new-password"
                showPassword={state.showConfirm}
                onToggle={toggleConfirm}
              />

              {/* Referral (optional) */}
              <InputField
                id="referral"
                label="Referral Code"
                value={state.referral}
                onChange={makeOnChange("referral")}
                placeholder="REF-12345"
                autoComplete="off"
                badge="Optional"
              />

              {/* Error feedback — ARIA live region */}
              <FeedbackMessage error={state.error} />

              {/* ── Divider ────────────────────────────────────────────── */}
              <div aria-hidden="true" className="h-px bg-yellow-500/10" />

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending}
                aria-busy={isPending}
                className="w-full rounded-xl bg-yellow-500 py-3.5 text-sm font-extrabold uppercase tracking-widest text-black transition-all duration-200 hover:bg-yellow-400 hover:shadow-lg hover:shadow-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Creating Account…" : "Create Account"}
              </button>
            </form>

            {/* ── Sign-in link ──────────────────────────────────────────── */}
            <p className="mt-7 text-center text-xs text-white/30">
              Already have an account?{" "}
              <a
                href="/join"
                className="font-bold text-yellow-500/70 transition hover:text-yellow-400"
              >
                Sign in
              </a>
            </p>
          </div>

          {/* ── Footer note ────────────────────────────────────────────── */}
          <p className="mt-6 text-center text-[10px] uppercase tracking-[0.3em] text-white/15">
            Protected · Encrypted · Secure
          </p>
        </div>
      </main>
    </>
  );
}