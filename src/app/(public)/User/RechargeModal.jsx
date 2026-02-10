"use client";
import React from "react";
import { useRouter } from "next/navigation";

function RechargeModal({ onClose }) {
    const router = useRouter();

    const options = [
        {
            id: "bep20",
            label: "BEP20-USDT",
            image: "/TRC.png",
            path: "/recharge/bep20",
        },
        {
            id: "trc20",
            label: "TRC20-USDT",
            image: "/TRC.png",
            path: "/recharge/trc20",
        },
    ];

    const handleNavigate = (path) => {
        onClose();          // close modal first
        router.push(path); // navigate
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 sm:px-6">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="recharge-title"
                className="bg-white text-black rounded-3xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <header className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-200">
                    <h2 id="recharge-title" className="text-lg sm:text-xl font-extrabold">
                        Recharge
                    </h2>

                    <button
                        onClick={onClose}
                        aria-label="Close recharge modal"
                        className="text-gray-500 hover:text-black text-xl focus:ring-2 focus:ring-yellow-400 rounded"
                    >
                        ✕
                    </button>
                </header>

                {/* Options */}
                <section className="divide-y divide-dashed divide-gray-300 overflow-y-auto">
                    {options.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => handleNavigate(item.path)}
                            aria-label={`Select ${item.label} recharge method`}
                            className="w-full flex items-center justify-between px-5 sm:px-6 py-4 hover:bg-yellow-50 active:bg-yellow-100 transition focus:ring-2 focus:ring-yellow-400"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <img
                                    src={item.image}
                                    alt={`${item.label} network logo`}
                                    loading="lazy"
                                    className="w-7 h-7 object-contain flex-shrink-0"
                                />
                                <span className="font-semibold text-gray-900 truncate">
                                    {item.label}
                                </span>
                            </div>

                            <span aria-hidden className="text-gray-400 text-xl">
                                ›
                            </span>
                        </button>
                    ))}
                </section>
            </div>
        </div>
    );
}

export default RechargeModal;
