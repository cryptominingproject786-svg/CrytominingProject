"use client";
import React, { useState, useCallback, useMemo, memo } from "react";

// ────────────────────────────────────────────────────────────────────────────
// STATIC DATA (module-level, frozen)
// ────────────────────────────────────────────────────────────────────────────

const NETWORKS = Object.freeze(["TRC20", "BEP20"]);

/**
 * TRC20 (TRON) address format — Base58Check encoding:
 *   • Always starts with uppercase "T"
 *   • Exactly 34 characters
 *   • Characters drawn from Base58 alphabet:
 *       123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz
 *     (excludes 0, O, I, l to prevent visual ambiguity)
 *
 * Reference address: TLiyJWr8A78tU3PCfKspr9F2yW1NNguvg8
 *
 * BEP20 (BSC/Ethereum-compatible) address format:
 *   • Starts with "0x"
 *   • Exactly 42 characters total (2-char prefix + 40 hex chars)
 */

// Base58 alphabet used by TRON (Bitcoin-style, no 0/O/I/l)
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_REGEX = new RegExp(`^T[${BASE58_ALPHABET}]{33}$`);

const NETWORK_CONFIG = Object.freeze({
    TRC20: {
        placeholder: "e.g. TLiyJWr8A78tU3PCfKspr9F2yW1NNguvg8",
        exactLength: 34,
        /**
         * Validates a TRC20 (TRON) address:
         *  1. Must be exactly 34 characters
         *  2. Must start with uppercase "T"
         *  3. All characters must belong to the Base58 alphabet
         */
        validator: (address) => BASE58_REGEX.test(address),
        errorMsg:
            "TRC20 address must be exactly 34 characters, start with 'T', and use only Base58 characters (no 0, O, I, or l)",
    },
    BEP20: {
        placeholder: "e.g. 0x7658427957142ed434de190c9bb53e5b6d8e4e94",
        exactLength: 42,
        /**
         * Validates a BEP20 (BSC/ETH-compatible) address:
         *  1. Must start with "0x"
         *  2. Must be exactly 42 characters total
         *  3. Remaining 40 chars must be valid hex digits
         */
        validator: (address) =>
            /^0x[0-9a-fA-F]{40}$/.test(address),
        errorMsg:
            "BEP20 address must start with '0x' followed by exactly 40 hexadecimal characters (total 42 chars)",
    },
});

const WITHDRAW_AMOUNT_STEP = 10;
const WITHDRAW_NOTICE = `Withdrawals must be requested in increments of ${WITHDRAW_AMOUNT_STEP} USDT (10, 20, 30, ...).`;

// ────────────────────────────────────────────────────────────────────────────
// VALIDATION UTILITY (pure, memoizable)
// ────────────────────────────────────────────────────────────────────────────

const validateWithdrawal = (address, amount, balance, network) => {
    const numAmount = Number(amount);
    const config = NETWORK_CONFIG[network];

    if (!address) return "Address is required";

    // Cross-network paste guard: BEP20 address entered in TRC20 field
    if (network === "TRC20" && address.startsWith("0x"))
        return "This looks like a BEP20 address. Please switch to BEP20 or enter a valid TRC20 address starting with 'T'.";

    // Cross-network paste guard: TRC20 address entered in BEP20 field
    if (network === "BEP20" && address.startsWith("T") && address.length === 34)
        return "This looks like a TRC20 address. Please switch to TRC20 or enter a valid BEP20 address starting with '0x'.";

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
                    autoComplete="off"
                    spellCheck={false}
                />
                {hint && (
                    <p className="text-xs text-gray-500">{hint}</p>
                )}
                {maxValue !== undefined && type === "number" && (
                    <p className="text-xs text-gray-500">
                        Available balance: {maxValue} USDT
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
                <div className="flex gap-3" role="group" aria-label="Select blockchain network">
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

    // ── Memoized real-time validation (shown only after user starts typing) ──
    const validationError = useMemo(() => {
        if (!address && !amount) return "";
        return validateWithdrawal(address, amount, balance, network);
    }, [address, amount, balance, network]);

    // ── Handlers ──

    // Clear address + error when switching networks to prevent cross-network entries
    const handleNetworkChange = useCallback((newNetwork) => {
        setNetwork(newNetwork);
        setAddress("");
        setError("");
    }, []);

    const handleAddressChange = useCallback(
        (e) => {
            const value = e.target.value;

            // Inline cross-network paste warnings
            if (network === "TRC20" && value.startsWith("0x")) {
                setError("You selected TRC20. TRC20 addresses start with 'T', not '0x'.");
            } else if (network === "BEP20" && value.startsWith("T") && value.length >= 2) {
                setError("You selected BEP20. BEP20 addresses start with '0x'.");
            } else {
                setError("");
            }

            setAddress(value);
        },
        [network]
    );

    const handleAmountChange = useCallback(
        (e) => {
            const value = e.target.value;
            if (Number(value) > balance && value !== "") {
                setError("Amount exceeds available balance");
                return;
            }
            setAmount(value);
            setError("");
        },
        [balance]
    );

    const handleSubmit = useCallback(async () => {
        const err = validateWithdrawal(address, amount, balance, network);
        if (err) { setError(err); return; }

        setError("");
        try {
            const res = await fetch("/api/withdraw", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    network,
                    amount: Number(amount),
                    address: address.trim(),
                }),
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="withdraw-title"
        >
            <section
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
                            ? `Must start with 'T' · exactly ${config.exactLength} Base58 characters`
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

                {/* Error Message — inline handler errors take priority */}
                <ErrorMessage error={error || validationError} />

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

                {/* Structured data for SEO / Google rich results */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "TransferAction",
                            name: "USDT Withdrawal",
                            description: "Secure USDT cryptocurrency withdrawal via TRC20 or BEP20 network",
                            instrument: {
                                "@type": "PaymentMethod",
                                name: "USDT (Tether)",
                            },
                        }),
                    }}
                />
            </section>
        </div>
    );
}

export default memo(WithdrawModal, (prev, next) =>
    prev.onClose === next.onClose && prev.balance === next.balance
);