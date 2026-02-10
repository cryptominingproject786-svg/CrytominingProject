"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginClient() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const res = await signIn("credentials", { redirect: false, email, password });
            setLoading(false);
            if (res?.error) {
                setError(res.error || "Invalid credentials");
                return;
            }
            // Redirect to admin dashboard
            router.push("/admin/dashboard");

        } catch (err) {
            setLoading(false);
            setError("Login failed");
            console.error("admin login error", err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white p-8 rounded shadow">
                <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Email</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full border rounded px-3 py-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Password</label>
                        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 w-full border rounded px-3 py-2" />
                    </div>

                    {error && <div className="text-red-600 text-sm">{error}</div>}

                    <div className="flex items-center justify-between">
                        <button disabled={loading} type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                            {loading ? "Signing in..." : "Sign in"}
                        </button>
                        <a className="text-sm text-blue-600" href="/admin/SignUp">Create admin</a>
                    </div>
                </form>
            </div>
        </div>
    );
}
