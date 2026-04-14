"use client";

import React, { useState, useEffect, memo } from "react";
import Image from "next/image";

const CAROUSEL_IMAGES = Object.freeze([
    { src: "/Trading.png", alt: "Crypto trading dashboard performance visualization" },
    { src: "/coins.png", alt: "Cryptocurrency coins investment overview" },
]);

const BLUR_PLACEHOLDER =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

function ImageCarousel() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(
            () => setIndex((p) => (p + 1) % CAROUSEL_IMAGES.length),
            3000
        );
        return () => clearInterval(id);
    }, []);

    return (
        <section
            aria-label="Featured investment visuals"
            aria-roledescription="carousel"
            className="relative w-full rounded-2xl overflow-hidden shadow-lg h-[220px] sm:h-[300px] md:h-[380px] lg:h-[450px] xl:h-[520px]"
        >
            <Image
                src={CAROUSEL_IMAGES[index].src}
                alt={CAROUSEL_IMAGES[index].alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                className="object-cover transition-opacity duration-1000"
                priority={index === 0}
                loading={index === 0 ? undefined : "lazy"}
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
            />
        </section>
    );
}

export default memo(ImageCarousel);