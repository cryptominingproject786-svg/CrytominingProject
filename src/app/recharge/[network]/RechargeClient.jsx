"use client";

import Image from "next/image";
import RechargeManual from "./RechargeManual";

export default function RechargeClient({ network }) {
    const address = "TMo2CQx16hNz2yVJScV1Xr7sVLJ3TR3KcC";

    const copyAddress = () => navigator.clipboard.writeText(address);
    const goBack = () => window.history.back();

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
                    Recharge
                </h1>
            </header>

            {/* Main Content */}
            <section className="w-full flex justify-center px-4 py-8">
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Left Side */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col items-center">

                        {/* Network */}
                        <div className="flex items-center gap-3 mb-6 bg-yellow-400/10 px-5 py-2 rounded-full">
                            <Image src="/TRC.png" alt={`${network} logo`} width={28} height={28} />
                            <span className="font-semibold text-yellow-400 uppercase">
                                {network}-USDT
                            </span>
                        </div>

                        {/* QR */}
                        <div className="bg-white rounded-3xl p-5 shadow-xl mb-6">
                            <Image
                                src="/T20QR.jpeg"
                                alt="Recharge QR code"
                                width={220}
                                height={220}
                                priority
                                unoptimized
                            />

                        </div>

                        <p className="text-sm text-gray-400 text-center">
                            Scan this QR code using your wallet to recharge
                        </p>
                    </div>

                    {/* Right Side */}
                    <div className="bg-white rounded-3xl p-6 text-black shadow-xl flex flex-col justify-between">

                        {/* Address */}
                        <div>
                            <h2 className="text-lg font-bold mb-3">Recharge Address</h2>

                            <div className="flex items-center justify-between bg-gray-100 rounded-xl px-4 py-3">
                                <span className="text-sm break-all font-medium">
                                    {address}
                                </span>
                                <button
                                    onClick={copyAddress}
                                    className="ml-4 bg-black text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition"
                                >
                                    Copy
                                </button>
                            </div>

                            <button className="mt-6 w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 rounded-xl text-lg transition">
                                I Have Completed Recharge
                            </button>
                        </div>

                        {/* Tips */}
                        <div className="mt-6 bg-black rounded-2xl p-4 text-sm text-gray-300 border border-yellow-400/40">
                            <ul className="space-y-2 list-disc list-inside">
                                <li>Use only <span className="text-yellow-400 font-semibold">{network.toUpperCase()}</span> network</li>
                                <li>Minimum recharge: <span className="font-semibold">2 USDT</span></li>
                                <li>Funds arrive within <span className="font-semibold">1–3 minutes</span></li>
                            </ul>
                        </div>

                    </div>
                </div>
            </section>
            <RechargeManual network={network} />
        </main>
    );
}
