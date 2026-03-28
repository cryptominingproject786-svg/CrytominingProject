// "use client";
// import React, {
//     useEffect,
//     useReducer,
//     useCallback,
//     useMemo,
//     memo,
//     useState,
// } from "react";
// import { useRouter, useSearchParams } from "next/navigation";

// // ─── Reducer ────────────────────────────────────────────────────────────────
// const initialState = { withdraws: [], loading: true, error: null };

// function reducer(state, action) {
//     switch (action.type) {
//         case "SUCCESS":
//             return { loading: false, error: null, withdraws: action.payload };
//         case "ERROR":
//             return { loading: false, error: action.payload, withdraws: [] };
//         case "UPDATE_STATUS":
//             return {
//                 ...state,
//                 withdraws: state.withdraws.map((w) =>
//                     w && w._id === action.payload.id
//                         ? {
//                               ...w,
//                               status: action.payload.status,
//                               adminInvoice: action.payload.adminInvoice ?? w.adminInvoice,
//                           }
//                         : w
//                 ),
//             };
//         default:
//             return state;
//     }
// }

// // ─── Status Config ───────────────────────────────────────────────────────────
// const STATUS_CONFIG = Object.freeze({
//     approved: { label: "confirmed", color: "bg-emerald-500 text-black" },
//     rejected: { label: "rejected", color: "bg-red-500 text-white" },
//     pending: { label: "pending", color: "bg-yellow-500 text-black" },
// });

// const DEFAULT_STATUS = STATUS_CONFIG.pending;

// // ─── Pure Helpers ────────────────────────────────────────────────────────────
// const fmtDate = (d) =>
//     d ? new Date(d).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// // ─── WithdrawCard ─────────────────────────────────────────────────────────────
// const WithdrawCard = memo(function WithdrawCard({ withdraw: w, isLoading, onUpdateStatus }) {
//     const withdraw = w || {};
//     const router = useRouter();
//     const statusConfig = STATUS_CONFIG[withdraw.status] ?? DEFAULT_STATUS;

//     const [invoicePreview, setInvoicePreview] = useState(withdraw.adminInvoice || null);
//     const [pendingInvoice, setPendingInvoice] = useState(null);
//     const [fileError, setFileError] = useState("");

//     const handleFileSelect = useCallback((event) => {
//         const file = event.target.files?.[0];
//         if (!file) return;
//         if (!file.type.startsWith("image/")) {
//             setFileError("Only image files are allowed");
//             return;
//         }
//         const reader = new FileReader();
//         reader.onloadend = () => {
//             const dataUrl = reader.result;
//             setInvoicePreview(dataUrl);
//             const match = typeof dataUrl === "string" && dataUrl.match(/^data:(.+);base64,(.+)$/);
//             if (match) {
//                 setPendingInvoice({
//                     data: match[2],
//                     contentType: match[1],
//                     filename: file.name,
//                 });
//             }
//             setFileError("");
//         };
//         reader.readAsDataURL(file);
//     }, []);

//     const handleApprove = useCallback(() => {
//         if (!withdraw._id) return;
//         onUpdateStatus(withdraw._id, "approved", pendingInvoice || undefined);
//     }, [withdraw._id, pendingInvoice, onUpdateStatus]);

//     const handleReject = useCallback(() => {
//         if (!withdraw._id) return;
//         onUpdateStatus(withdraw._id, "rejected");
//     }, [withdraw._id, onUpdateStatus]);

//     const goToDetail = useCallback(() => {
//         if (!withdraw._id) return;
//         router.push(`/admin/withdraws/${withdraw._id}`);
//     }, [router, withdraw._id]);

//     const invoice = invoicePreview || withdraw.adminInvoice;

//     return (
//         <article className="bg-gradient-to-tr from-gray-900 to-black border border-yellow-500/30 rounded-3xl shadow-xl overflow-hidden">
//             <div
//                 role="button"
//                 tabIndex={0}
//                 className="h-64 bg-black flex items-center justify-center cursor-pointer border-b border-yellow-500/20"
//                 onClick={() => invoice && window.open(invoice, "_blank")}
//                 onKeyDown={(e) => e.key === "Enter" && invoice && window.open(invoice, "_blank")}
//             >
//                 {invoice ? (
//                     <img
//                         src={invoice}
//                         className="w-full h-full object-contain"
//                         alt="Withdrawal invoice"
//                         loading="lazy"
//                     />
//                 ) : (
//                     <span className="text-gray-500 text-lg">No Invoice Uploaded</span>
//                 )}
//             </div>

//             <div className="p-6 space-y-5">
//                 {withdraw.user && (
//                     <div className="space-y-1 text-sm">
//                         <div className="flex justify-between">
//                             <span className="text-gray-400">Username:</span>
//                             <span className="text-white font-medium">{withdraw.user.username || "Unknown"}</span>
//                         </div>
//                         <div className="flex justify-between">
//                             <span className="text-gray-400">Email:</span>
//                             <span className="text-white font-medium break-all">{withdraw.user.email || "Unknown"}</span>
//                         </div>
//                         <div className="flex justify-between">
//                             <span className="text-gray-400">Balance:</span>
//                             <span className="text-white">${withdraw.user.balance ?? 0}</span>
//                         </div>
//                         <div className="flex justify-between">
//                             <span className="text-gray-400">Invested:</span>
//                             <span className="text-white">${withdraw.user.investedAmount ?? 0}</span>
//                         </div>
//                         <div className="flex justify-between">
//                             <span className="text-gray-400">Total Earnings:</span>
//                             <span className="text-white">${withdraw.user.totalEarnings ?? 0}</span>
//                         </div>
//                         <div className="flex justify-between">
//                             <span className="text-gray-400">Daily Profit:</span>
//                             <span className="text-yellow-400 font-semibold">${withdraw.user.dailyProfit ?? 0}</span>
//                         </div>
//                     </div>
//                 )}

//                 <div className="text-center">
//                     <p className="text-4xl font-bold text-yellow-400 tracking-tight">
//                         {Number(withdraw.amount ?? 0).toLocaleString()} USDT
//                     </p>
//                 </div>

//                 {withdraw.txId && (
//                     <div className="flex items-center justify-between bg-black/50 rounded-2xl px-4 py-3">
//                         <div className="text-xs text-gray-400 font-mono break-all">
//                             TXID: {withdraw.txId.slice(0, 20)}...
//                         </div>
//                         <button
//                             onClick={() => {
//                                 navigator.clipboard.writeText(withdraw.txId);
//                                 alert("TXID copied");
//                             }}
//                             className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
//                         >
//                             Copy
//                         </button>
//                     </div>
//                 )}

//                 <div className="flex justify-center">
//                     <span
//                         className={`inline-block px-6 py-1.5 text-sm font-bold rounded-full tracking-wider uppercase ${statusConfig.color}`}
//                     >
//                         {statusConfig.label}
//                     </span>
//                 </div>

//                 {withdraw.status === "pending" && (
//                     <div className="space-y-4 pt-4 border-t border-yellow-500/20">
//                         <div>
//                             <label className="block text-xs text-gray-400 mb-2">Upload Payment Invoice (optional)</label>
//                             <input
//                                 type="file"
//                                 accept="image/*"
//                                 onChange={handleFileSelect}
//                                 className="text-sm text-gray-300 w-full file:mr-4 file:py-2 file:px-4 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-yellow-500/10 file:text-yellow-400 hover:file:bg-yellow-500/20 transition"
//                             />
//                             {fileError && <p className="text-red-400 text-xs mt-1">{fileError}</p>}
//                         </div>

//                         {invoicePreview && (
//                             <img src={invoicePreview} alt="Preview" className="rounded-2xl border border-yellow-500/20 max-h-40 object-contain mx-auto" />
//                         )}

//                         <div className="flex gap-3">
//                             <button
//                                 disabled={isLoading}
//                                 onClick={handleApprove}
//                                 className="flex-1 bg-green-500 hover:bg-green-600 py-3 rounded-2xl font-semibold transition disabled:opacity-50"
//                             >
//                                 ✓ Approve
//                             </button>
//                             <button
//                                 disabled={isLoading}
//                                 onClick={handleReject}
//                                 className="flex-1 bg-red-500 hover:bg-red-600 py-3 rounded-2xl font-semibold transition disabled:opacity-50"
//                             >
//                                 ✕ Reject
//                             </button>
//                         </div>
//                     </div>
//                 )}

//                 <button
//                     onClick={goToDetail}
//                     className="w-full mt-2 bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 hover:to-amber-300 text-black py-3 rounded-2xl font-semibold transition active:scale-95"
//                 >
//                     {withdraw.status === "pending" ? "Review Request" : "View Full Details"} →
//                 </button>
//             </div>
//         </article>
//     );
// });

// // ─── Additional components and main page present in existing code, omitted for brevity

// export default function WithdrawsClient() {
//     const router = useRouter();
//     const searchParams = useSearchParams();
//     const statusFilter = searchParams.get("status");

//     const [{ withdraws, loading, error }, dispatch] = useReducer(reducer, initialState);
//     const [actionLoading, setActionLoading] = useState({});

//     const fetchWithdraws = useCallback(async () => {
//         try {
//             const res = await fetch("/api/withdraw/admin");
//             const json = await res.json();
//             if (res.ok && json?.data) {
//                 dispatch({ type: "SUCCESS", payload: json.data });
//             } else {
//                 dispatch({ type: "ERROR", payload: json?.error || `Error ${res.status}` });
//             }
//         } catch (err) {
//             dispatch({ type: "ERROR", payload: err.message || "Network error" });
//         }
//     }, []);

//     useEffect(() => { fetchWithdraws(); }, [fetchWithdraws]);

//     const handleUpdateStatus = useCallback(async (id, newStatus, adminInvoice = null) => {
//         setActionLoading((prev) => ({ ...prev, [id]: true }));
//         try {
//             const body = { status: newStatus };
//             if (adminInvoice) body.adminInvoice = adminInvoice;

//             const res = await fetch(`/api/withdraw/admin/${id}`, {
//                 method: "PATCH",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify(body),
//             });
//             const json = await res.json();
//             if (res.ok && json?.data) {
//                 dispatch({ type: "UPDATE_STATUS", payload: { id, status: newStatus, adminInvoice: json.data.adminInvoice }});
//                 fetchWithdraws();
//             }
//         } catch (err) {
//             console.error(err);
//         } finally {
//             setActionLoading((prev) => ({ ...prev, [id]: false }));
//         }
//     }, [fetchWithdraws]);

//     const { pending, approved, rejected } = useMemo(() => {
//         const filtered = statusFilter ? withdraws.filter((w) => w.status === statusFilter) : withdraws;
//         return {
//             pending: filtered.filter((w) => w.status === "pending"),
//             approved: filtered.filter((w) => w.status === "approved"),
//             rejected: filtered.filter((w) => w.status === "rejected"),
//         };
//     }, [withdraws, statusFilter]);

//     return (
//         <main className="min-h-screen bg-[#080808] text-white">
//             <nav className="p-4">
//                 <button onClick={() => router.push("/admin/dashboard")} className="text-gray-400 hover:text-yellow-400">← Back to Dashboard</button>
//             </nav>

//             {/* status cards etc ... */}

//             {loading && <p>Loading...</p>}
//             {error && <p>Error: {error}</p>}

//             {!loading && !error && (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
//                     {pending.map((w) => (
//                         <WithdrawCard
//                             key={w._id}
//                             withdraw={w}
//                             isLoading={actionLoading[w._id] || false}
//                             onUpdateStatus={handleUpdateStatus}
//                         />
//                     ))}
//                 </div>
//             )}
//         </main>
//     );
// }
