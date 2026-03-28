"use client";
import React, { useState, useCallback, useMemo, memo } from "react";

// ────────────────────────────────────────────────────────────────────────────
// STATIC DATA (module-level, frozen)
// ────────────────────────────────────────────────────────────────────────────

const NETWORKS = Object.freeze(["TRC20", "BEP20"]);

const NETWORK_CONFIG = Object.freeze({
    TRC20: {
        placeholder: "Enter TRC20 TXID",
        minLength: 20,
        validator: (txid) => txid.length >= 20,
        errorMsg: "Invalid TRC20 TXID",
    },
    BEP20: {
        placeholder: "0xff2222bd53be58e8900e84e9e7fd54e647cc5d02",
        minLength: 42,
        validator: (txid) => txid.startsWith("0x"),
        errorMsg: "BEP20 TXID must start with 0x",
    },
});

Object.freeze(NETWORK_CONFIG);

// ────────────────────────────────────────────────────────────────────────────
// VALIDATION UTILITY (pure, memoizable)
// ────────────────────────────────────────────────────────────────────────────

const validateWithdrawal = (txid, amount, balance, network) => {
    const numAmount = Number(amount);

    if (!txid) return "TXID is required";
    if (!numAmount || numAmount <= 0) return "Enter valid amount";
    if (numAmount > balance) return "You can't enter more than available balance";

    const config = NETWORK_CONFIG[network];
    if (!config.validator(txid)) return config.errorMsg;

    return "";
};

// ────────────────────────────────────────────────────────────────────────────
// MEMOIZED SUB-COMPONENTS
// ────────────────────────────────────────────────────────────────────────────

/**
 * NetworkButton — Memoized to prevent re-renders
 * Only re-renders if network or isSelected prop changes
 */
const NetworkButton = memo(
    function NetworkButton({ network, isSelected, onClick }) {
        return (
            <button
                onClick={onClick}
                aria-pressed={isSelected}
                className={`flex-1 py-2 rounded-xl font-bold transition ${isSelected
                    ? "bg-yellow-400 text-black"
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                type="button"
            >
                {network}
            </button>
        );
    },
    (prevProps, nextProps) => {
        // Custom comparison: only re-render if network or isSelected changes
        return (
            prevProps.network === nextProps.network &&
            prevProps.isSelected === nextProps.isSelected
        );
    }
);

/**
 * InputField — Memoized input component
 * Only re-renders if value prop changes
 */
const InputField = memo(
    function InputField({ label, value, onChange, placeholder, maxValue, type = "text" }) {
        return (
            <section className="space-y-2">
                <label className="text-sm text-gray-300 block font-medium">{label}</label>
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    max={maxValue}
                    inputMode={type === "number" ? "decimal" : "text"}
                    className="w-full p-3 rounded-xl bg-black border border-gray-700 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none text-white transition"
                    aria-label={label}
                />
                {maxValue && type === "number" && (
                    <p className="text-xs text-gray-500">
                        Available balance: ${maxValue}
                    </p>
                )}
            </section>
        );
    },
    (prevProps, nextProps) => {
        // Re-render only if value actually changes
        return prevProps.value === nextProps.value && prevProps.maxValue === nextProps.maxValue;
    }
);

/**
 * ErrorMessage — Memoized error display
 * Only renders if error message changes
 */
const ErrorMessage = memo(function ErrorMessage({ error }) {
    if (!error) return null;

    return (
        <div
            role="alert"
            aria-live="polite"
            className="p-3 rounded-xl bg-red-500/20 border border-red-500/50 text-red-400 text-sm"
        >
            ⚠️ {error}
        </div>
    );
});

/**
 * NetworkSelector — Memoized network selection
 * Only re-renders if network prop changes
 */
const NetworkSelector = memo(
    function NetworkSelector({ network, onNetworkChange }) {
        return (
            <section className="space-y-3">
                <label className="text-sm text-gray-300 block font-medium">
                    Select Network
                </label>
                <div className="flex gap-3" role="group">
                    {NETWORKS.map((n) => (
                        <NetworkButton
                            key={n}
                            network={n}
                            isSelected={network === n}
                            onClick={() => onNetworkChange(n)}
                        />
                    ))}
                </div>
            </section>
        );
    },
    (prevProps, nextProps) => prevProps.network === nextProps.network
);

// ────────────────────────────────────────────────────────────────────────────
// MAIN MODAL COMPONENT
// ────────────────────────────────────────────────────────────────────────────

function WithdrawModal({ onClose, balance = 0 }) {
    // ── State (minimal) ──
    const [network, setNetwork] = useState("TRC20");
    const [txid, setTxid] = useState("");
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");

    // ── Memoized validation ──
    // Only recalculates when txid, amount, balance, or network changes
    // This function is expensive (multiple checks), so memo it
    const validationError = useMemo(() => {
        if (!txid && !amount) return ""; // Don't validate empty form until submit
        return validateWithdrawal(txid, amount, balance, network);
    }, [txid, amount, balance, network]);

    // ── Memoized handlers (stable references) ──
    // Prevent child components from re-rendering due to new function references

    const handleNetworkChange = useCallback((newNetwork) => {
        setNetwork(newNetwork);
        setError(""); // Clear error when changing network
    }, []);

    const handleTxidChange = useCallback((e) => {
        const value = e.target.value;
        setTxid(value);
        setError(""); // Clear error on input change
    }, []);

    const handleAmountChange = useCallback((e) => {
        const value = e.target.value;
        const numValue = Number(value);

        // Prevent entering more than balance
        if (numValue > balance && value !== "") {
            setError("You can't enter more than available balance");
            return;
        }

        setAmount(value);
        setError("");
    }, [balance]);

    const handleSubmit = useCallback(async () => {
        // Validate on submit
        const err = validateWithdrawal(txid, amount, balance, network);

        if (err) {
            setError(err);
            return;
        }

        // Clear error and submit
        setError("");

        try {
            const res = await fetch("/api/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ network, txId: txid, amount: Number(amount) }),
            });

            const json = await res.json();
            console.log("Withdrawal response:", json);
            if (!res.ok) {
                throw new Error(json.error || "Withdrawal request failed");
            }

            onClose();
        } catch (e) {
            setError(e.message);
        }
    }, [txid, amount, balance, network, onClose]);

    // ── Modal structure ──
    // Semantic HTML for SEO
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            role="presentation"
            aria-modal="true"
        >
            {/* Modal Card */}
            <section
                aria-labelledby="withdraw-title"
                className="w-full max-w-md bg-gradient-to-br from-gray-900 to-black border border-yellow-400 rounded-3xl shadow-2xl p-6 space-y-5 animate-fadeIn"
            >
                {/* Header */}
                <header className="space-y-1">
                    <h2
                        id="withdraw-title"
                        className="text-2xl font-extrabold text-yellow-400"
                    >
                        Withdraw Funds
                    </h2>
                    <p className="text-sm text-gray-400">
                        Enter your transaction details securely
                    </p>
                </header>

                {/* Network Selection */}
                <NetworkSelector
                    network={network}
                    onNetworkChange={handleNetworkChange}
                />

                {/* TXID Input */}
                <InputField
                    label={`TXID (${network})`}
                    value={txid}
                    onChange={handleTxidChange}
                    placeholder={NETWORK_CONFIG[network].placeholder}
                    type="text"
                />

                {/* Amount Input */}
                <InputField
                    label="Amount (USDT)"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Enter amount"
                    type="number"
                    maxValue={balance}
                />

                {/* Error Message (only renders if error exists) */}
                <ErrorMessage error={error} />

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 rounded-xl bg-gray-800 text-gray-300 font-medium hover:bg-gray-700 transition"
                        type="button"
                    >
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={!!validationError || (!txid && !amount)}
                        className="flex-1 py-2 rounded-xl bg-yellow-400 text-black font-bold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                        aria-label="Submit withdrawal request"
                    >
                        Submit
                    </button>
                </div>

                {/* Hidden metadata for SEO */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "TransferAction",
                        description: "Cryptocurrency withdrawal form",
                        purpose: "Withdraw funds from investment account",
                    })}
                </script>
            </section>
        </div>
    );
}

// ────────────────────────────────────────────────────────────────────────────
// EXPORT (memoized to prevent re-renders on parent updates)
// ────────────────────────────────────────────────────────────────────────────

export default memo(WithdrawModal, (prevProps, nextProps) => {
    // Custom comparison: only re-render if onClose or balance actually changes
    return (
        prevProps.onClose === nextProps.onClose &&
        prevProps.balance === nextProps.balance
    );
});
