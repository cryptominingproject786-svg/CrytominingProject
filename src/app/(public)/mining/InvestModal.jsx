"use client";

import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import { closePurchaseModal } from "../../../Redux/Slices/MiningSlice";
import { useState, useMemo } from "react";

export default function InvestModal() {
    const dispatch = useDispatch();
    const { selectedMiner, isModalOpen } = useSelector(
        (state) => state.mining
    );

    const [amount, setAmount] = useState("");

    if (!isModalOpen || !selectedMiner) return null;

    /* ------------------ PARSING EXISTING DATA ------------------ */

    // "10.00 ~ 100.00 USDT"
    const [minAmount, maxAmount] = selectedMiner.price
        .replace("USDT", "")
        .split("~")
        .map(v => parseFloat(v.trim()));

    // "26.00%" → 0.26
    const returnRate = parseFloat(selectedMiner.returnRate) / 100;

    // "30Day", "21Day", "7 Days", "Daily"
    const cycleDays = selectedMiner.cycle.toLowerCase().includes("daily")
        ? 1
        : parseInt(selectedMiner.cycle);

    /* ------------------ CALCULATIONS ------------------ */

    const dailyProfit = useMemo(() => {
        if (!amount) return 0;
        return amount * returnRate;
    }, [amount, returnRate]);

    const totalProfit = dailyProfit * cycleDays;
    const fixedIncome = Number(amount || 0) + totalProfit;

    /* ------------------ UI ------------------ */

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="w-full max-w-xl max-h-[80vh] overflow-y-auto rounded-2xl bg-gradient-to-b from-[#6d028d] to-[#4a0066] p-4 text-white relative">


                {/* Close */}
                <button
                    onClick={() => dispatch(closePurchaseModal())}
                    className="absolute right-4 top-4 text-xl"
                >
                    ✕
                </button>

                {/* Image */}
                <div className="flex justify-center mb-4">
                    <div className="w-32 h-32 relative bg-white rounded-xl p-2">
                        <Image
                            src={selectedMiner.image}
                            alt={selectedMiner.name}
                            fill
                            className="object-contain"
                        />
                    </div>
                </div>

                {/* Title */}
                <h2 className="text-lg font-semibold mb-4 text-center">
                    {selectedMiner.name}
                </h2>

                {/* Price Range */}
                <div className="mb-4">
                    <p className="text-sm opacity-80">Purchase amount range</p>
                    <div className="bg-purple-900 rounded-lg p-3 mt-1">
                        ${minAmount} ~ ${maxAmount}
                    </div>
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                    <label className="text-sm opacity-80">Enter Amount</label>
                    <input
                        type="number"
                        min={minAmount}
                        max={maxAmount}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="Enter Amount"
                        className="w-full mt-1 rounded-lg bg-purple-900 px-4 py-3 outline-none"
                    />
                    <p className="text-xs mt-1 opacity-70">
                        Available Balance: $0
                    </p>
                </div>

                {/* Info */}
                <div className="bg-purple-900 rounded-xl p-4 text-sm space-y-2 mb-5">
                    <div className="flex justify-between">
                        <span>Invest cycle</span>
                        <span>{cycleDays} Day</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Daily profit</span>
                        <span>${dailyProfit.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Total profit</span>
                        <span>${totalProfit.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-red-400">
                        <span>Fixed Income</span>
                        <span>
                            ${amount || 0} + ${totalProfit.toFixed(2)}
                        </span>
                    </div>

                    <div className="flex justify-between">
                        <span>Total investments</span>
                        <span>Unlimited</span>
                    </div>

                    <div className="text-xs opacity-80 pt-2">
                        Interest is returned daily and the principal is repaid upon maturity
                    </div>
                </div>

                {/* Action */}
                <button
                    className="w-full bg-purple-500 py-3 rounded-full font-semibold hover:bg-purple-600 transition"
                >
                    Start Now
                </button>
            </div>
        </div>
    );
}
