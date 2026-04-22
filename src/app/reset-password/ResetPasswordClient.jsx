"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const MIN_PASSWORD_LENGTH = 6;

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);
  const [tokenValidationMessage, setTokenValidationMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      setTokenValidationMessage("Reset token is missing from the link.");
      return;
    }

    let active = true;

    async function validateToken() {
      try {
        const response = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await response.json();
        if (!active) return;

        if (!response.ok || data.valid !== true) {
          setTokenValid(false);
          setTokenValidationMessage(data.error || "Invalid or expired reset token.");
        } else {
          setTokenValid(true);
          setTokenValidationMessage("");
        }
      } catch (error) {
        if (!active) return;
        setTokenValid(false);
        setTokenValidationMessage("Unable to validate reset token. Please try again.");
      }
    }

    validateToken();
    return () => {
      active = false;
    };
  }, [token]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      if (!token) {
        setStatus({ type: "error", message: "Reset token is missing or invalid." });
        return;
      }

      if (newPassword.trim().length < MIN_PASSWORD_LENGTH) {
        setStatus({
          type: "error",
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        });
        return;
      }

      if (newPassword !== confirmPassword) {
        setStatus({ type: "error", message: "Passwords do not match." });
        return;
      }

      setIsSubmitting(true);
      setStatus({ type: "idle", message: "" });

      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        });

        const result = await response.json();

        if (!response.ok) {
          setStatus({ type: "error", message: result.error || "Unable to reset password." });
          return;
        }

        setStatus({ type: "success", message: result.message || "Password reset successfully." });
        setNewPassword("");
        setConfirmPassword("");
      } catch (error) {
        setStatus({ type: "error", message: "Network error. Please try again." });
      } finally {
        setIsSubmitting(false);
      }
    },
    [token, newPassword, confirmPassword]
  );

  useEffect(() => {
    if (status.type !== "success") {
      return;
    }

    const timeout = window.setTimeout(() => {
      router.replace("/join");
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [status.type, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black px-4 py-12 text-white flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-yellow-500/10 bg-gray-900/90 p-8 shadow-2xl shadow-black/70 backdrop-blur-md">
        <h1 className="text-3xl font-extrabold uppercase tracking-widest text-yellow-400">Reset Password</h1>
        <p className="mt-3 text-sm text-white/50">
          Enter a new password to finish resetting your account. The token from your email is required.
        </p>

        <div className="mt-6 space-y-4">
          {tokenValid === false && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {tokenValidationMessage || "Invalid or expired reset token. Please request a new password reset."}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="new-password" className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-yellow-500/70">
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                autoComplete="new-password"
                className="w-full rounded-xl border border-yellow-500/20 bg-black/60 px-4 py-3 text-sm text-white/90 outline-none transition focus:border-yellow-500/60 focus:ring-2 focus:ring-yellow-500/10"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-yellow-500/70">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-yellow-500/20 bg-black/60 px-4 py-3 text-sm text-white/90 outline-none transition focus:border-yellow-500/60 focus:ring-2 focus:ring-yellow-500/10"
              />
            </div>

            {status.message && (
              <div
                role={status.type === "error" ? "alert" : "status"}
                className={`rounded-2xl px-4 py-3 text-sm ${
                  status.type === "success"
                    ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                    : "border border-red-500/20 bg-red-500/10 text-red-200"
                }`}
              >
                {status.message}
              </div>
            )}

            {status.type === "success" && (
              <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-100">
                Your password was updated successfully. You will be redirected to sign in automatically, or
                <a href="/join" className="ml-1 font-bold text-yellow-300 underline hover:text-yellow-200">
                  click here to sign in now
                </a>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !token || tokenValid === false}
              className="w-full rounded-xl bg-yellow-500 py-3 text-sm font-extrabold uppercase tracking-widest text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Submitting…" : "Submit new password"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
