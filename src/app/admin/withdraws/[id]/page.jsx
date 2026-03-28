import { Suspense } from "react";
import WithdrawDetailClient from "./WithdrawDetailClient";

// Inner async component — params access happens inside Suspense boundary
async function WithdrawPage({ params }) {
    const { id } = await params;
    return <WithdrawDetailClient withdrawId={id} />;
}

export default function AdminWithdrawDetailPage({ params }) {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center text-white animate-pulse">
                Loading…
            </div>
        }>
            <WithdrawPage params={params} />
        </Suspense>
    );
}

export const metadata = {
    title: "Withdraw Request — Admin",
};