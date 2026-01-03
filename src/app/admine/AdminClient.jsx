"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminClient() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/(auth)/join");
        } else if (status === "authenticated" && session?.user?.role !== "admin") {
            router.push("/");
        }
    }, [session, status, router]);

    if (status === "loading") {
        return <div className="p-10">Loading...</div>;
    }

    if (status === "unauthenticated" || session?.user?.role !== "admin") {
        return <div className="p-10">Redirecting...</div>;
    }

    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>

            <div className="grid md:grid-cols-2 gap-6">
                <AdminCard title="Total Users" value="1,245" />
                <AdminCard title="Total Invested" value="$2.4M" />
            </div>
        </div>
    );
}

function AdminCard({ title, value }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow">
            <p className="text-gray-500">{title}</p>
            <h2 className="text-2xl font-bold">{value}</h2>
        </div>
    );
}
