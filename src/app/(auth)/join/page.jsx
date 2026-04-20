"use client";

/**
 * @file JoinPage.jsx
 * @description User sign-in page with forgot-password flow.
 * Two views are rendered in a single component — "signin" and "forgot" —
 * toggled with a local string state. No router navigation needed for the
 * forgot-password panel; the transition is instant and zero-cost.
 *
 * Optimisations:
 *  - useReducer collapses all form state into one dispatch → one re-render
 *  - Validation runs synchronously before any async work
 *  - Stable callbacks via useCallback (no new function refs on re-render)
 *  - Module-level sub-components (InputField, EyeIcon) never re-created
 *  - noValidate on <form> — we own validation, no browser double-fire
 *  - autoComplete attributes guide password managers correctly
 *  - ARIA live regions surface errors to screen readers without focus traps
 */

import { useCallback, useReducer, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { isValidEmail, sendForgotPasswordEmail } from "../../lib/forgotPassword";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_RE = /\S+@\S+\.\S+/;
const MIN_PASS = 6;

/** Which panel is visible */
const VIEW = Object.freeze({ SIGNIN: "signin", FORGOT: "forgot" });

// ─────────────────────────────────────────────────────────────────────────────
// Reducers
// ─────────────────────────────────────────────────────────────────────────────

const SIGNIN_INITIAL = {
  email: "",
  password: "",
  showPassword: false,
  error: "",
};

const FORGOT_INITIAL = {
  email: "",
  error: "",
  success: "",
};

function signinReducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value, error: "" };
    case "TOGGLE_PASSWORD":
      return { ...state, showPassword: !state.showPassword };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "RESET":
      return SIGNIN_INITIAL;
    default:
      return state;
  }
}

function forgotReducer(state, action) {
  switch (action.type) {
    case "SET_EMAIL":
      return { ...state, email: action.payload, error: "", success: "" };
    case "SET_ERROR":
      return { ...state, error: action.payload, success: "" };
    case "SET_SUCCESS":
      return { ...state, success: action.payload, error: "" };
    case "RESET":
      return FORGOT_INITIAL;
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Module-level sub-components (never re-created on parent re-render)
// ─────────────────────────────────────────────────────────────────────────────

/** Reusable labelled input — module-level so it's never re-instantiated */
function InputField({ id, label, type = "text", value, onChange, placeholder, autoComplete, children }) {
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
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-yellow-500/20 bg-black/60 px-4 py-3 text-sm text-white/90 placeholder-white/20 outline-none transition-all duration-200 focus:border-yellow-500/60 focus:ring-2 focus:ring-yellow-500/10 pr-11"
        />
        {children}
      </div>
    </div>
  );
}

/** Eye / eye-off SVG icons — pure, no state */
function EyeIcon({ open }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.58 10.58A3 3 0 1013.42 13.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M2.31 12.14C3.84 7.99 7.49 5 12 5c3 0 5.54 1.35 7.37 3.62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** Feedback message — rendered as an ARIA live region */
function FeedbackMessage({ error, success }) {
  if (!error && !success) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      aria-live="polite"
      className={`text-sm font-semibold ${error ? "text-red-400" : "text-emerald-400"}`}
    >
      {error ? `⚠ ${error}` : `✓ ${success}`}
    </p>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function JoinPage() {
  const router = useRouter();

  // Active panel — "signin" | "forgot"
  const [view, setView] = useReducer(
    (_, next) => next,
    VIEW.SIGNIN
  );

  const [signin, dispatchSignin] = useReducer(signinReducer, SIGNIN_INITIAL);
  const [forgot, dispatchForgot] = useReducer(forgotReducer, FORGOT_INITIAL);

  const [isSigninPending, startSigninTransition] = useTransition();
  const [isForgotPending, startForgotTransition] = useTransition();

  // ── Navigation helpers ───────────────────────────────────────────────────

  const goToForgot = useCallback(() => {
    dispatchForgot({ type: "RESET" });
    // Pre-fill forgot email from signin email if already typed
    if (signin.email) dispatchForgot({ type: "SET_EMAIL", payload: signin.email });
    setView(VIEW.FORGOT);
  }, [signin.email]);

  const goToSignin = useCallback(() => {
    dispatchSignin({ type: "RESET" });
    setView(VIEW.SIGNIN);
  }, []);

  // ── Sign-in submit ───────────────────────────────────────────────────────

  const handleSignin = useCallback(
    (e) => {
      e.preventDefault();

      // Synchronous validation — no fetch until this passes
      if (!EMAIL_RE.test(signin.email)) {
        dispatchSignin({ type: "SET_ERROR", payload: "Enter a valid email address." });
        return;
      }
      if (signin.password.length < MIN_PASS) {
        dispatchSignin({ type: "SET_ERROR", payload: `Password must be at least ${MIN_PASS} characters.` });
        return;
      }

      startSigninTransition(async () => {
        try {
          // Role guard — block admin emails from signing in here
          const checkRes = await fetch("/api/auth/check-role", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: signin.email.trim().toLowerCase() }),
          });
          const checkData = await checkRes.json();

          if (checkData.role === "admin") {
            dispatchSignin({
              type: "SET_ERROR",
              payload: "This email belongs to an admin account. Use the admin login.",
            });
            return;
          }

          // NextAuth credentials sign-in
          const res = await signIn("credentials", {
            email: signin.email.trim().toLowerCase(),
            password: signin.password,
            redirect: false,
            callbackUrl: "/dashboard",
          });

          if (!res) {
            dispatchSignin({ type: "SET_ERROR", payload: "Unexpected error. Please try again." });
            return;
          }

          if (!res.ok) {
            dispatchSignin({
              type: "SET_ERROR",
              payload:
                res.error === "CredentialsSignin"
                  ? "Invalid email or password."
                  : res.error || "Sign in failed. Please try again.",
            });
            return;
          }

          // Warm the session cache before navigating
          await fetch("/api/auth/session", { cache: "no-store" });
          router.replace(res.url || "/dashboard");
        } catch {
          dispatchSignin({ type: "SET_ERROR", payload: "Network error. Please try again." });
        }
      });
    },
    [signin, router]
  );

  // ── Forgot-password submit ───────────────────────────────────────────────

  const handleForgot = useCallback(
    (e) => {
      e.preventDefault();

      if (!isValidEmail(forgot.email)) {
        dispatchForgot({ type: "SET_ERROR", payload: "Enter a valid email address." });
        return;
      }

      startForgotTransition(async () => {
        try {
          const result = await sendForgotPasswordEmail(forgot.email.trim().toLowerCase());

          if (!result.ok) {
            dispatchForgot({
              type: "SET_ERROR",
              payload: result.error || "Unable to send reset email. Please try again.",
            });
            return;
          }

          dispatchForgot({
            type: "SET_SUCCESS",
            payload: "Reset link sent! Check your inbox (and spam folder).",
          });
        } catch {
          dispatchForgot({ type: "SET_ERROR", payload: "Network error. Please try again." });
        }
      });
    },
    [forgot.email]
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    /**
     * SEO: <main> with schema.org structured data.
     * One <h1> per view satisfies heading hierarchy for crawlers.
     */
    <main
      aria-label={view === VIEW.SIGNIN ? "Sign in to your account" : "Reset your password"}
      itemScope
      itemType="https://schema.org/WebPage"
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black px-4 py-12"
    >
      {/* ── Ambient glows (decorative) ───────────────────────────────────── */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-yellow-500/6 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-yellow-400/4 blur-3xl" />
        <div className="absolute top-1/2 left-0 h-48 w-48 -translate-y-1/2 rounded-full bg-yellow-600/3 blur-2xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* ── Brand mark ───────────────────────────────────────────────── */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-500/30 bg-yellow-500/10 text-2xl shadow-lg shadow-yellow-500/10"
          >
            💰
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-yellow-500/50">
            Secure Access to BitXXS
          </p>
        </div>

        {/* ── Card ─────────────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-yellow-500/15 bg-gray-900/90 p-8 shadow-2xl shadow-black/70 backdrop-blur-md">

          {/* Top accent line */}
          <div
            aria-hidden="true"
            className="mb-7 h-0.5 w-12 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500/0"
          />

          {/* ════════════════════════════════════════════════════════════
              SIGN-IN VIEW
          ════════════════════════════════════════════════════════════ */}
          {view === VIEW.SIGNIN && (
            <section aria-labelledby="signin-heading">
              <header className="mb-7">
                <h1
                  id="signin-heading"
                  itemProp="name"
                  className="text-2xl font-extrabold uppercase tracking-widest text-yellow-400"
                >
                  Welcome Back
                </h1>
                <p
                  itemProp="description"
                  className="mt-1 text-sm text-white/35"
                >
                  Sign in to access your account and dashboard.
                </p>
              </header>

              <form onSubmit={handleSignin} noValidate className="space-y-5">

                {/* Email */}
                <InputField
                  id="email"
                  label="Email Address"
                  type="email"
                  value={signin.email}
                  onChange={(e) =>
                    dispatchSignin({ type: "SET_FIELD", field: "email", value: e.target.value })
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                />

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="password"
                      className="text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-500/70"
                    >
                      Password
                    </label>
                    {/* Forgot password link — inside the password label row */}
                    <button
                      type="button"
                      onClick={goToForgot}
                      className="text-[10px] font-bold uppercase tracking-[0.2em] text-yellow-500/50 transition hover:text-yellow-400"
                    >
                      Forgot?
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={signin.showPassword ? "text" : "password"}
                      value={signin.password}
                      onChange={(e) =>
                        dispatchSignin({ type: "SET_FIELD", field: "password", value: e.target.value })
                      }
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-yellow-500/20 bg-black/60 px-4 py-3 pr-11 text-sm text-white/90 placeholder-white/20 outline-none transition-all duration-200 focus:border-yellow-500/60 focus:ring-2 focus:ring-yellow-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => dispatchSignin({ type: "TOGGLE_PASSWORD" })}
                      aria-label={signin.showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 transition hover:text-yellow-400"
                    >
                      <EyeIcon open={signin.showPassword} />
                    </button>
                  </div>
                </div>

                {/* Error feedback */}
                <FeedbackMessage error={signin.error} />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSigninPending}
                  aria-busy={isSigninPending}
                  className="w-full rounded-xl bg-yellow-500 py-3.5 text-sm font-extrabold uppercase tracking-widest text-black transition-all duration-200 hover:bg-yellow-400 hover:shadow-lg hover:shadow-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSigninPending ? "Signing in…" : "Sign In"}
                </button>
              </form>

              {/* Sign-up link */}
              <p className="mt-7 text-center text-xs text-white/30">
                Don't have an account?{" "}
                <a
                  href="/signup"
                  className="font-bold text-yellow-500/70 transition hover:text-yellow-400"
                >
                  Create one
                </a>
              </p>
            </section>
          )}

          {/* ════════════════════════════════════════════════════════════
              FORGOT PASSWORD VIEW
          ════════════════════════════════════════════════════════════ */}
          {view === VIEW.FORGOT && (
            <section aria-labelledby="forgot-heading">
              <header className="mb-7">
                {/* Back button */}
                <button
                  type="button"
                  onClick={goToSignin}
                  className="mb-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.25em] text-yellow-500/50 transition hover:text-yellow-400"
                  aria-label="Back to sign in"
                >
                  <span aria-hidden="true">←</span> Back to Sign In
                </button>

                <h1
                  id="forgot-heading"
                  className="text-2xl font-extrabold uppercase tracking-widest text-yellow-400"
                >
                  Reset Password
                </h1>
                <p className="mt-1 text-sm text-white/35">
                  Enter your email and we'll send a reset link instantly.
                </p>
              </header>

              <form onSubmit={handleForgot} noValidate className="space-y-5">

                <InputField
                  id="forgot-email"
                  label="Email Address"
                  type="email"
                  value={forgot.email}
                  onChange={(e) =>
                    dispatchForgot({ type: "SET_EMAIL", payload: e.target.value })
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                />

                {/* Error / success feedback */}
                <FeedbackMessage error={forgot.error} success={forgot.success} />

                <button
                  type="submit"
                  disabled={isForgotPending || !!forgot.success}
                  aria-busy={isForgotPending}
                  className="w-full rounded-xl bg-yellow-500 py-3.5 text-sm font-extrabold uppercase tracking-widest text-black transition-all duration-200 hover:bg-yellow-400 hover:shadow-lg hover:shadow-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isForgotPending ? "Sending…" : forgot.success ? "Email Sent ✓" : "Send Reset Link"}
                </button>
              </form>

              {/* Back to sign-in text link */}
              <p className="mt-7 text-center text-xs text-white/30">
                Remembered it?{" "}
                <button
                  type="button"
                  onClick={goToSignin}
                  className="font-bold text-yellow-500/70 transition hover:text-yellow-400"
                >
                  Sign in instead
                </button>
              </p>
            </section>
          )}

        </div>

        {/* ── Footer note ─────────────────────────────────────────────── */}
        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.3em] text-white/15">
          Protected · Encrypted · Secure
        </p>
      </div>
    </main>
  );
}