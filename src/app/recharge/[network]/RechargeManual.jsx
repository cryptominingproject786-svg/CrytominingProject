"use client";

import { useState } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";

export default function RechargeManual({ network }) {
    const goBack = () => window.history.back();

    const [amount, setAmount] = useState("");
    const [txId, setTxId] = useState("");
    const [slip, setSlip] = useState(null);

    const { data: session } = useSession();
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        if (!slip) {
            setMessage({ type: "error", text: "Please upload a slip image." });
            return;
        }

        if (!amount || Number(amount) < 2) {
            setMessage({ type: "error", text: "Amount must be at least 2 USDT." });
            return;
        }

        setSubmitting(true);

        try {
            const readAsDataURL = (file) =>
                new Promise((resolve, reject) => {
                    const fr = new FileReader();
                    fr.onload = () => resolve(fr.result);
                    fr.onerror = reject;
                    fr.readAsDataURL(file);
                });

            const dataUrl = await readAsDataURL(slip);

            if (!txId || !String(txId).trim()) {
                setMessage({ type: "error", text: "Please provide the transaction ID." });
                setSubmitting(false);
                return;
            }

            const payload = {
                network,
                amount,
                txId: String(txId).trim(),
                // include session info as a helpful hint for server-side linking (fallback)
                email: session?.user?.email,
                userId: session?.user?.id,
                name: session?.user?.name,
                slip: {
                    filename: slip.name,
                    contentType: slip.type,
                    data: dataUrl,
                },
            };

            const res = await fetch("/api/recharge", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (!res.ok) {
                setMessage({ type: "error", text: json?.error || "Upload failed" });
            } else {
                setMessage({ type: "success", text: "Recharge submitted — pending confirmation." });
                // reset form
                setAmount("");
                setTxId("");
                setSlip(null);
            }
        } catch (err) {
            console.error("submit error", err);
            setMessage({ type: "error", text: "Server error. Please try again." });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen w-full bg-gradient-to-br from-[#0f172a] via-[#020617] to-black text-white">

            {/* Top Bar */}
            <header className="w-full flex items-center justify-center relative px-6 py-5 border-b border-white/10">
                <button
                    onClick={goBack}
                    aria-label="Go back"
                    className="absolute left-6 text-yellow-400 text-3xl font-bold hover:scale-110 transition"
                >
                    ‹
                </button>
                <h1 className="text-2xl font-extrabold tracking-wide">
                    Confirm Recharge
                </h1>
            </header>

            {/* Content */}
            <section className="w-full flex justify-center px-4 sm:px-6 lg:px-10 py-10">
                <div className="w-full max-w-6xl bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 lg:p-12">

                    {/* Network Badge */}
                    <div className="flex justify-center mb-10">
                        <div className="flex items-center gap-3 bg-yellow-400/10 px-6 py-2 rounded-full">
                            <Image src="/TRC.png" alt="TRC20" width={28} height={28} />
                            <span className="font-semibold text-yellow-400 uppercase">
                                {network}-USDT
                            </span>
                        </div>
                    </div>

                    {/* Form */}
                    <form
                        onSubmit={handleSubmit}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
                    >
                        {/* Amount */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                Recharge Amount (USDT)
                            </label>
                            <input
                                type="number"
                                min="2"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount"
                                className="w-full rounded-xl px-4 py-4 bg-black/70 border border-white/10 focus:border-yellow-400 focus:outline-none"
                            />
                        </div>

                        {/* TRC20 TX ID */}
                        <div>
                            <label className="block text-sm font-semibold mb-2">
                                TRC20 Transaction ID
                            </label>
                            <input
                                type="text"
                                required
                                value={txId}
                                onChange={(e) => setTxId(e.target.value)}
                                placeholder="Enter transaction hash"
                                className="w-full rounded-xl px-4 py-4 bg-black/70 border border-white/10 focus:border-yellow-400 focus:outline-none"
                            />
                        </div>

                        {/* Slip Upload – full width */}
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-semibold mb-2">
                                Upload Recharge Slip
                            </label>

                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-yellow-400/40 rounded-2xl cursor-pointer bg-black/40 hover:bg-black/60 transition">
                                <input
                                    type="file"
                                    accept="image/*"
                                    required
                                    onChange={(e) => setSlip(e.target.files[0])}
                                    className="hidden"
                                />
                                <span className="text-sm text-gray-300">
                                    {slip ? slip.name : "Click to upload slip image"}
                                </span>
                            </label>
                        </div>

                        {/* Submit – full width */}
                        <div className="lg:col-span-2">
                            <button
                                type="submit"
                                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 rounded-xl text-lg transition"
                            >
                                Submit Recharge Proof
                            </button>
                        </div>
                    </form>

                    {/* Tips */}
                    <div className="mt-10 bg-black rounded-2xl p-5 text-sm text-gray-300 border border-yellow-400/40">
                        <ul className="space-y-2 list-disc list-inside">
                            <li>Minimum recharge: <span className="font-semibold">2 USDT</span></li>
                            <li>
                                Only{" "}
                                <span className="text-yellow-400 font-semibold">
                                    {network.toUpperCase()}
                                </span>{" "}
                                transactions are accepted
                            </li>
                            <li>Incorrect details may delay confirmation</li>
                        </ul>
                    </div>

                </div>
            </section>
        </main>
    );
}
