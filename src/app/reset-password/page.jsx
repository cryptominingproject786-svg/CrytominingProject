import { Suspense } from "react";
import ResetPasswordClient from "./ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black px-4 py-12 text-white flex items-center justify-center">
          <div className="rounded-3xl border border-yellow-500/10 bg-gray-900/90 p-8 shadow-2xl shadow-black/70 backdrop-blur-md text-center">
            <p className="text-lg font-semibold text-yellow-400">Loading reset screen…</p>
          </div>
        </main>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  );
}
