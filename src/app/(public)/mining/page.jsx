"use client";

import Image from "next/image";
import { useFadeIn } from "../../hooks/useFadeIn";
import AngMiner from "./AngMiner";

export default function Mining() {
    const { ref, isVisible } = useFadeIn();

    return (
        <>
            <section
                ref={ref}
                className="relative min-h-screen w-full flex items-center justify-center px-4 sm:px-6 lg:px-12 overflow-hidden"
            >
                {/* Background Image */}
                <Image
                    src="/miningbg.png"
                    alt="Mining Background"
                    fill
                    priority
                    className="object-cover"
                />

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/70" />

                {/* Content */}
                <div
                    className={
                        "relative z-10 w-full max-w-5xl text-center transition-all duration-1000 ease-out " +
                        (isVisible
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 translate-y-10")
                    }
                >
                    <p className="text-xs sm:text-sm md:text-base text-purple-300 tracking-wide mb-3 sm:mb-4">
                        Join a new generation of miners who value simplicity and innovation
                    </p>

                    <h1 className="font-extrabold text-white mb-5 text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">
                        Easy<span className="text-yellow-500">Mining</span>
                    </h1>

                    <p className="text-gray-300 mx-auto mb-8 sm:mb-10 text-sm sm:text-base md:text-lg max-w-md sm:max-w-xl md:max-w-2xl">
                        With CryptoMining, you’re not just mining—you’re actively contributing
                        to the blockchain ecosystem with confidence and control.
                    </p>

                    <button className="inline-flex items-center justify-center px-8 sm:px-10 md:px-12 py-3 sm:py-4 text-sm sm:text-base md:text-lg rounded-full bg-white text-black font-semibold hover:bg-yellow-500 hover:text-white transition-all duration-300 shadow-lg hover:shadow-2xl active:scale-95">
                        Start Now
                    </button>
                </div>

                {/* Floating Help Button */}
                <button className="fixed z-20 bottom-4 right-4 sm:bottom-6 sm:right-6 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm md:text-base bg-blue-500 text-white rounded-full shadow-xl hover:bg-blue-600 transition active:scale-95">
                    Need help?
                </button>
            </section>

            <AngMiner />
        </>
    );
}
