"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

// ── Success Modal ────────────────────────────────────────────────────────────
function SuccessModal({ onClose }) {
    const router = useRouter();

    // Close and redirect to home
    const handleClose = useCallback(() => {
        onClose();
        router.push("/");
    }, [onClose, router]);

    // Close on Escape key — accessibility best practice
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") handleClose();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [handleClose]);

    // Lock body scroll while modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            aria-describedby="modal-desc"
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
            {/* Backdrop click closes modal */}
            <div
                className="absolute inset-0"
                onClick={handleClose}
                aria-hidden="true"
            />

            {/* Modal panel */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 text-center">
                {/* Close (×) button */}
                <button
                    onClick={handleClose}
                    aria-label="Close and return to home"
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-400 transition"
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M1 1l12 12M13 1L1 13"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                        />
                    </svg>
                </button>

                {/* Success icon */}
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M5 13l4 4L19 7"
                            stroke="#16a34a"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>

                <h2
                    id="modal-title"
                    className="text-xl font-semibold text-gray-900 mb-2"
                >
                    Account created successfully!
                </h2>

                <p
                    id="modal-desc"
                    className="text-sm text-gray-600 leading-relaxed mb-5"
                >
                    A login link has been sent to your email. Check your inbox and click
                    the link to go to your dashboard.
                </p>

                <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
                    Didn&apos;t receive it? Check your spam or junk folder.
                </div>
            </div>
        </div>
    );
}

// ── Signup Page ──────────────────────────────────────────────────────────────
export default function SignupPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        passwordConfirm: "",
        referral: "",
        phone: "",
    });
    const [error, setError] = useState("");
    const [showModal, setShowModal] = useState(false);   // ← replaces success string
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validate = () => {
        if (form.username.trim().length < 3) return "Username must be at least 3 characters";
        if (!/\S+@\S+\.\S+/.test(form.email)) return "Please enter a valid email";
        if (!/^[+]?\d{7,20}$/.test(form.phone.trim())) return "Please enter a valid phone number";
        if (form.password.length < 6) return "Password must be at least 6 characters";
        if (form.password !== form.passwordConfirm) return "Passwords do not match";
        return null;
    };

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const v = validate();
        if (v) return setError(v);

        startTransition(async () => {
            try {
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: form.username,
                        email: form.email,
                        phone: form.phone,
                        password: form.password,
                        passwordConfirm: form.passwordConfirm,
                        referral: form.referral,
                    }),
                });

                const payload = await res.json().catch(() => ({}));

                if (!res.ok) {
                    setError(payload?.error || "Registration failed. Try again.");
                    return;
                }

                const email = form.email.trim().toLowerCase();
                const appOrigin =
                    process.env.NEXT_PUBLIC_NEXTAUTH_URL || window.location.origin;
                const callbackUrl = `${appOrigin.replace(/\/$/, "")}/dashboard`;

                const magicResult = await signIn("email", {
                    email,
                    redirect: false,
                    callbackUrl,
                });

                if (!magicResult || magicResult.error) {
                    setError(
                        magicResult?.error ||
                        "Signup succeeded but we could not send the login link. Please try signing in manually."
                    );
                    return;
                }

                setShowModal(true); // ← open the modal on success
            } catch {
                setError("Network error. Please try again.");
            }
        });
    };

    const EyeOpen = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        </svg>
    );

    const EyeOff = () => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10.58 10.58A3 3 0 1013.42 13.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2.31 12.14C3.84 7.99 7.49 5 12 5c3 0 5.54 1.35 7.37 3.62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    return (
        <>
            {/* Success modal — rendered outside the form flow */}
            {showModal && <SuccessModal onClose={() => setShowModal(false)} />}

            <div className="min-h-screen bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl p-8">
                    <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
                        Create your account
                    </h1>
                    <p className="text-gray-600 text-center mb-6">
                        Join us and get started 🚀
                    </p>

                    <form onSubmit={handleSubmit} noValidate className="space-y-4">
                        {/* Username */}
                        <div>
                            <label htmlFor="username" className="text-sm font-medium text-gray-700">
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                autoComplete="username"
                                value={form.username}
                                onChange={handleChange}
                                placeholder="yourname"
                                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="text-sm font-medium text-gray-700">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button
                                    type="button"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {showPassword ? <EyeOff /> : <EyeOpen />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="passwordConfirm" className="text-sm font-medium text-gray-700">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    id="passwordConfirm"
                                    name="passwordConfirm"
                                    type={showConfirmPassword ? "text" : "password"}
                                    autoComplete="new-password"
                                    value={form.passwordConfirm}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button
                                    type="button"
                                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {showConfirmPassword ? <EyeOff /> : <EyeOpen />}
                                </button>
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                                Phone Number <span className="text-red-500" aria-hidden="true">*</span>
                            </label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                autoComplete="tel"
                                value={form.phone}
                                onChange={handleChange}
                                placeholder="+1234567890"
                                required
                                aria-required="true"
                                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        {/* Referral */}
                        <div>
                            <label htmlFor="referral" className="text-sm font-medium text-gray-700">
                                Referral Code{" "}
                                <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input
                                id="referral"
                                name="referral"
                                autoComplete="off"
                                value={form.referral}
                                onChange={handleChange}
                                placeholder="REF-12345"
                                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>

                        {/* Error */}
                        {error && (
                            <div role="alert" className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
                        >
                            {isPending ? "Creating account…" : "Create Account"}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-600 mt-6">
                        Already have an account?{" "}
                        <a href="/join" className="text-indigo-600 font-medium hover:underline">
                            Sign in
                        </a>
                    </p>
                </div>
            </div>
        </>
    );
}