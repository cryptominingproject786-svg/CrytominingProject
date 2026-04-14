"use client";

import React, { useEffect, useState } from "react";

const PHONE_NUMBER = "923001234567"; // ← set your number here (no + or spaces)
const DEFAULT_MESSAGE = "Hi! I need support.";

function WhatsAppButton({ phoneNumber = PHONE_NUMBER, message = DEFAULT_MESSAGE, className = "" }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a

            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with support on WhatsApp"
            title="Chat with us on WhatsApp"
            className={`fixed bottom-6 right-6 z-[9999] inline-flex items-center justify-center
        w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-green-500 shadow-2xl
        hover:bg-green-400 hover:scale-110 transform transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-green-300 ${className}`}
        >
            {/* Ping animation ring */}
            <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-green-400 opacity-40 animate-ping"
            />

            {/* WhatsApp SVG icon */}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                className="relative w-8 h-8 sm:w-9 sm:h-9"
                fill="currentColor"
                aria-hidden="true"
                role="img"
            >
                <title>WhatsApp</title>
                <path d="M16 0C7.163 0 0 7.163 0 16c0 2.822.737 5.469 2.027 7.77L0 32l8.437-2.01A15.934
          15.934 0 0 0 16 32c8.837 0 16-7.163 16-16S24.837 0 16 0Zm8.258 22.366c-.343.965-1.69
          1.765-2.776 1.997-.74.157-1.706.282-4.958-1.065-4.163-1.72-6.845-5.952-7.053-6.228
          -.198-.276-1.674-2.228-1.674-4.248 0-2.02 1.058-3.008 1.433-3.42.375-.41.819-.513
          1.092-.513.272 0 .546.003.785.014.252.013.59-.096.923.704.343.824 1.165 2.844 1.268
          3.05.103.207.172.448.034.724-.138.277-.207.448-.41.689-.202.24-.425.536-.606.72-.202
          .202-.412.42-.178.824.235.404 1.044 1.721 2.24 2.788 1.538 1.37 2.834 1.794 3.237
          1.996.404.203.638.172.872-.103.235-.276.997-1.163 1.263-1.565.265-.402.53-.336.892
          -.202.363.135 2.307 1.088 2.703 1.285.395.197.659.297.755.46.097.164.097.948-.246
          1.913Z" />
            </svg>
        </a>
    );
}

export default React.memo(WhatsAppButton);