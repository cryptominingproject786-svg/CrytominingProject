"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import UserData from "./UserData";
import Miners from "./Miners";
import MembersList from "./MembersList";

function UserHome() {
    const images = ["/Trading.png", "/coins.png"];
    const [currentIndex, setCurrentIndex] = useState(0);
    const [mounted, setMounted] = useState(false); // << add this


    useEffect(() => {
        setMounted(true); // ensures client-only rendering

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <main
                className="min-h-screen text-white px-4 py-4 sm:px-6 lg:px-10"
                style={{
                    backgroundImage: "url('/banner.png')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            >
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <header className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div
                                className="w-8 h-8 sm:w-9 sm:h-9 bg-orange-500 rounded-full flex items-center justify-center font-bold text-sm sm:text-base"
                                aria-hidden="true"
                            >
                                ₿
                            </div>

                            {/* H1 — REQUIRED FOR SEO */}
                            <h1 className="font-semibold text-base sm:text-lg lg:text-xl">
                                Crypto Mining Platform
                            </h1>
                        </div>
                    </header>

                    {/* Tags */}
                    <section
                        className="flex justify-between gap-4 mb-4 sm:mb-6 text-xs sm:text-sm"
                        aria-label="Platform benefits"
                    >
                        <span>💰 Save money</span>
                        <span>⏱ Save time</span>
                    </section>

                    {/* Announcement */}
                    <section
                        className="bg-blue-950 text-yellow-500 rounded-full px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-3 mb-4 sm:mb-6 overflow-hidden"
                        aria-label="Announcements"
                    >
                        <div className="bg-white p-2 rounded-full flex-shrink-0 text-sm sm:text-base">
                            🔊
                        </div>

                        <div className="relative overflow-hidden flex-1">
                            <div className="whitespace-nowrap animate-scroll pl-3 sm:pl-4">
                                <p className="text-sm sm:text-base lg:text-lg font-medium">
                                    Your Level 1 team's total deposits reach 2,800 USDT, you will receive a reward of 200 USDT.
                                    When your Level 1 team's total deposits reach higher milestones, more rewards will be unlocked.
                                </p>
                            </div>
                        </div>
                    </section>
                    <section className="relative w-full rounded-2xl overflow-hidden shadow-lg h-[220px] sm:h-[300px] md:h-[380px] lg:h-[450px] xl:h-[520px]">



                        {mounted && (
                            <Image
                                src={images[currentIndex]}
                                alt="Crypto mining dashboard and investment performance visualization"
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                                className="object-cover transition-opacity duration-1000"
                                priority
                            />
                        )}

                    </section>


                </div>

            </main>
            <UserData />
            <Miners />
            <MembersList />
        </>

    );
}

export default UserHome;
