"use client";

import { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function JoinPage() {
    const router = useRouter();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [isPending, startTransition] = useTransition();
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const validate = () => {
        if (!/\S+@\S+\.\S+/.test(form.email)) return "Enter a valid email address";
        if (form.password.length < 6) return "Password must be at least 6 characters";
        return null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        const v = validate();
        if (v) return setError(v);

        startTransition(async () => {
            try {
                const res = await signIn("credentials", {
                    redirect: false,
                    email: form.email,
                    password: form.password,
                });

                if (res?.error) {
                    setError(
                        res.error === "CredentialsSignin"
                            ? "Invalid email or password"
                            : res.error
                    );
                    return;
                }

                // router.push("/mining");
                router.push("/User");
            } catch {
                setError("Network error. Please try again.");
            }
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
                <h1 className="text-2xl font-bold text-gray-900 text-center">
                    Welcome back
                </h1>
                <p className="text-sm text-gray-600 text-center mt-1 mb-6">
                    Sign in to your account
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="relative mt-1">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={form.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M10.58 10.58A3 3 0 1013.42 13.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M2.31 12.14C3.84 7.99 7.49 5 12 5c3 0 5.54 1.35 7.37 3.62" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="2" />
                                        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">
                            {error}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
                    >
                        {isPending ? "Signing in…" : "Sign in"}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-600 mt-6">
                    Don’t have an account?{" "}
                    <a
                        href="/signup"
                        className="text-indigo-600 font-medium hover:underline"
                    >
                        Create one
                    </a>
                </p>
            </div>
        </div>
    );
}
