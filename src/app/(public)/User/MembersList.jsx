"use client";
import React, { useEffect, useRef, useState } from "react";

const members = [
    { phone: "+49******998", amount: 2963.81 },
    { phone: "+33******214", amount: 1842.22 },
    { phone: "+44******781", amount: 2671.09 },
    { phone: "+39******552", amount: 1432.67 },
    { phone: "+34******901", amount: 2210.44 },
    { phone: "+31******883", amount: 1950.32 },
    { phone: "+46******119", amount: 1788.9 },
    { phone: "+41******440", amount: 3120.55 },
    { phone: "+43******775", amount: 1666.18 },
    { phone: "+45******602", amount: 2099.73 },
];

export default function MembersList() {
    const [list, setList] = useState(members.slice(0, 3));
    const indexRef = useRef(3);

    useEffect(() => {
        const interval = setInterval(() => {
            setList((prev) => {
                const next = members[indexRef.current % members.length];
                indexRef.current += 1;
                return [...prev.slice(1), next];
            });
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="w-full bg-yellow-500  p-3 sm:p-4 md:p-5 shadow-2xl">
            <h3 className="text-black font-extrabold text-base mb-3 uppercase tracking-wide">
                Member List
            </h3>

            <div className="relative h-[132px] sm:h-[150px] md:h-[168px] lg:h-[180px] overflow-hidden">
                <ul className="flex flex-col gap-2 sm:gap-3 animate-slide">
                    {list.map((m, i) => (
                        <li
                            key={`${m.phone}-${i}`}
                            className="flex items-center justify-between bg-white rounded-xl px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 md:py-3 shadow-md"
                        >
                            <span className="text-black font-semibold tracking-wide text-sm">
                                {m.phone}
                            </span>

                            <span className="font-extrabold text-black text-sm">
                                +{m.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}