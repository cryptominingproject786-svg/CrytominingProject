"use client";
import React, { useState, useCallback, useMemo, memo } from "react";

// ────────────────────────────────────────────────────────────────────────────
// STATIC DATA (module-level, frozen)
// ────────────────────────────────────────────────────────────────────────────

const NETWORKS = Object.freeze(["TRC20", "BEP20"]);

// TRC20 addresses: 64 lowercase hex characters (no prefix)
// BEP20 addresses: start with "0x", exactly 42 characters
const NETWORK_CONFIG = Object.freeze({
    TRC20: {
        placeholder: "e.g. fbdfd84f2d304c3d0263f9d3ae7430ca83d55db23310e882187341f922b03242",
        exactLength: 64,
        validator: (address) => /^[0-9a-fA-F]{64}$/.test(address),
        errorMsg: "TRC20 address must be exactly 64 hexadecimal characters (0–9, a–f)",
    },
    BEP20: {
        placeholder: "e.g. 0x7658427957142ed434de190c9bb53e5b6d8e4e94",
        exactLength: 42,
        validator: (address) =>
            address.startsWith("0x") && address.length === 42,
        errorMsg: "BEP20 address must start with '0x' and be exactly 42 characters",
    },
});

const WITHDRAW_AMOUNT_STEP = 10;
const WITHDRAW_NOTICE = `Withdrawals must be requested in increments of ${WITHDRAW_AMOUNT_STEP} USDT (10, 20, 30, ...).`;

Object.freeze(NETWORK_CONFIG);

// ────────────────────────────────────────────────────────────────────────────
// VALIDATION UTILITY (pure, memoizable)
// ────────────────────────────────────────────────────────────────────────────

const validateWithdrawal = (address, amount, balance, network) => {
    const numAmount = Number(amount);
    const config = NETWORK_CONFIG[network];

    if (!address) return "Address is required";

    // BEP20 address pasted into TRC20 field
    if (network === "TRC20" && address.startsWith("0x"))
        return "This looks like a BEP20 address. Please switch to BEP20 or enter a TRC20 address.";

    if (!config.validator(address)) return config.errorMsg;
    if (!numAmount || numAmount <= 0) return "Enter a valid amount";
    if (!Number.isInteger(numAmount / WITHDRAW_AMOUNT_STEP))
        return `Amount must be a multiple of ${WITHDRAW_AMOUNT_STEP} USDT.`;
    if (numAmount > balance) return "Amount exceeds available balance";

    return "";
};

// ────────────────────────────────────────────────────────────────────────────
// MEMOIZED SUB-COMPONENTS
// ────────────────────────────────────────────────────────────────────────────

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
    (prev, next) =>
        prev.network === next.network && prev.isSelected === next.isSelected
);

const InputField = memo(
    function InputField({ label, value, onChange, placeholder, maxValue, type = "text", hint, step }) {
        return (
            <section className="space-y-2">
                <label className="text-sm text-gray-300 block font-medium">{label}</label>
                <input
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    max={maxValue}
                    step={step}
                    inputMode={type === "number" ? "decimal" : "text"}
                    className="w-full p-3 rounded-xl bg-black border border-gray-700 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 outline-none text-white transition"
                    aria-label={label}
                />
                {hint && (
                    <p className="text-xs text-gray-500">{hint}</p>
                )}
                {maxValue && type === "number" && (
                    <p className="text-xs text-gray-500">
                        Available balance: ${maxValue}
                    </p>
                )}
            </section>
        );
    },
    (prev, next) =>
        prev.value === next.value &&
        prev.maxValue === next.maxValue &&
        prev.placeholder === next.placeholder &&
        prev.hint === next.hint
);

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
    (prev, next) => prev.network === next.network
);

// ────────────────────────────────────────────────────────────────────────────
// MAIN MODAL COMPONENT
// ────────────────────────────────────────────────────────────────────────────

function WithdrawModal({ onClose, balance = 0 }) {
    const [network, setNetwork] = useState("TRC20");
    const [address, setAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");

    // ── Memoized validation ──
    const validationError = useMemo(() => {
        if (!address && !amount) return "";
        return validateWithdrawal(address, amount, balance, network);
    }, [address, amount, balance, network]);

    // ── Handlers ──

    // Clear address when switching networks to prevent cross-network entries
    const handleNetworkChange = useCallback((newNetwork) => {
        setNetwork(newNetwork);
        setAddress("");
        setError("");
    }, []);

    const handleAddressChange = useCallback((e) => {
        const value = e.target.value;

        // Soft guard: warn if BEP20 address pasted into TRC20 field
        if (network === "TRC20" && value.startsWith("0x")) {
            setError("You selected TRC20. Please enter a TRC20 address (64 hex characters).");
        } else if (network === "BEP20" && !value.startsWith("0x") && value.length > 1) {
            setError("You selected BEP20. Please enter a BEP20 address (starts with '0x').");
        } else {
            setError("");
        }

        setAddress(value);
    }, [network]);

    const handleAmountChange = useCallback((e) => {
        const value = e.target.value;
        if (Number(value) > balance && value !== "") {
            setError("Amount exceeds available balance");
            return;
        }
        setAmount(value);
        setError("");
    }, [balance]);

    const handleSubmit = useCallback(async () => {
        const err = validateWithdrawal(address, amount, balance, network);
        if (err) { setError(err); return; }

        setError("");
        try {
            const res = await fetch("/api/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ network, amount: Number(amount), address: address.trim() }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Withdrawal request failed");
            onClose();
        } catch (e) {
            setError(e.message);
        }
    }, [address, amount, balance, network, onClose]);

    const config = NETWORK_CONFIG[network];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            role="presentation"
            aria-modal="true"
        >
            <section
                aria-labelledby="withdraw-title"
                className="w-full max-w-md bg-gradient-to-br from-gray-900 to-black border border-yellow-400 rounded-3xl shadow-2xl p-6 space-y-5 animate-fadeIn"
            >
                {/* Header */}
                <header className="space-y-1">
                    <h2 id="withdraw-title" className="text-2xl font-extrabold text-yellow-400">
                        Withdraw Funds
                    </h2>
                    <p className="text-sm text-gray-400">
                        Enter your transaction details securely
                    </p>
                </header>

                {/* Network Selection */}
                <NetworkSelector network={network} onNetworkChange={handleNetworkChange} />

                {/* Address Input */}
                <InputField
                    label={`Address (${network})`}
                    value={address}
                    onChange={handleAddressChange}
                    placeholder={config.placeholder}
                    type="text"
                    hint={
                        network === "TRC20"
                            ? `Must be exactly ${config.exactLength} hexadecimal characters (0–9, a–f)`
                            : `Must start with '0x' · exactly ${config.exactLength} characters`
                    }
                />

                {/* Amount Input */}
                <InputField
                    label="Amount (USDT)"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Enter amount"
                    type="number"
                    step={WITHDRAW_AMOUNT_STEP}
                    maxValue={balance}
                    hint={WITHDRAW_NOTICE}
                />

                {/* Error Message */}
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
                        disabled={!!validationError || (!address && !amount)}
                        className="flex-1 py-2 rounded-xl bg-yellow-400 text-black font-bold hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        type="button"
                        aria-label="Submit withdrawal request"
                    >
                        Submit
                    </button>
                </div>

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

export default memo(WithdrawModal, (prev, next) =>
    prev.onClose === next.onClose && prev.balance === next.balance
);