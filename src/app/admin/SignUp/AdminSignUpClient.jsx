"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";


export default function AdminSignUpClient() {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [adminCode, setAdminCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (password !== passwordConfirm) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch("/api/auth/admin/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, passwordConfirm, adminCode }),
            });
            const json = await res.json();
            setLoading(false);
            if (!res.ok) {
                setError(json.error || "Registration failed");
                return;
            }
            setSuccess("Admin created. Signing you in...");

            await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            router.push("/admin");

        } catch (err) {
            setLoading(false);
            setError("Server error");
            console.error("admin signup error", err);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-white p-8 rounded shadow">
                <h1 className="text-2xl font-bold mb-4">Admin Sign Up</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium">Username</label>
                        <input value={username} onChange={(e) => setUsername(e.target.value)} required className="mt-1 w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Email</label>
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="mt-1 w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Password</label>
                        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="mt-1 w-full border rounded px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Confirm Password</label>
                        <input value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} type="password" required className="mt-1 w-full border rounded px-3 py-2" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium">Admin Signup Code</label>
                        <input value={adminCode} onChange={(e) => setAdminCode(e.target.value)} required className="mt-1 w-full border rounded px-3 py-2" />
                        <p className="text-xs text-gray-500 mt-1">This code must match the server ADMIN_SIGNUP_CODE env var.</p>
                    </div>

                    {error && <div className="text-red-600 text-sm">{error}</div>}
                    {success && <div className="text-green-600 text-sm">{success}</div>}

                    <div className="flex items-center justify-between">
                        <button disabled={loading} type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
                            {loading ? "Creating..." : "Create Admin"}
                        </button>
                        <a className="text-sm text-blue-600" href="/admin/Login">Back to login</a>
                    </div>
                </form>
            </div>
        </div>
    );
}
