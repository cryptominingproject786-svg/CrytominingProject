"use client";

import { useSession } from "next-auth/react";

export default function Admin() {
  const { data: session } = useSession();

  if (session?.user.role !== "admin") {
    return <p>Access Denied</p>;
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
