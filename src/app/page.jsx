"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useFadeIn } from "./hooks/useFadeIn";
import CardSkeleton from "./components/CardSkeleton";

const Card = dynamic(() => import("./components/MiningCard"), {
  ssr: false,
  loading: () => <CardSkeleton />,
});

export default function Page() {
  const hero = useFadeIn();
  const content = useFadeIn();
  const trust = useFadeIn();

  return (
    <div className="w-full overflow-hidden">
      {/* HERO */}
      <section
        ref={hero.ref}
        className={`relative h-screen transition-all duration-1000 ${hero.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
      >
        <Image
          src="/banner.png"
          alt="Crypto Mining Platform"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/70" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-8 px-6">
          <h4 className="text-yellow-400 text-lg sm:text-xl italic font-semibold tracking-wide">
            Passive Income Made Simple
          </h4>

          <h1 className="text-white text-4xl sm:text-6xl font-extrabold leading-tight">
            Earn Daily with <span className="text-yellow-400">Crypto Mining</span>
          </h1>

          <Link href="/signup">
            <button className="bg-yellow-400 text-black px-10 py-4 rounded-full text-lg font-bold hover:bg-yellow-300 transition transform hover:scale-105">
              Start Earning Today
            </button>
          </Link>
        </div>
      </section>

      {/* CONTENT */}
      <section
        ref={content.ref}
        className={`bg-slate-50 py-28 transition-all duration-1000 ${content.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
      >
        <p className="text-center max-w-5xl mx-auto text-gray-800 text-lg sm:text-xl md:text-2xl leading-relaxed font-semibold tracking-wide mb-24">
          Build long-term wealth with a{" "}
          <span className="text-black font-extrabold">secure</span>,{" "}
          <span className="text-black font-extrabold">transparent</span>, and{" "}
          <span className="text-black font-extrabold">high-performance</span>{" "}
          crypto mining platform — engineered to deliver{" "}
          <span className="text-yellow-500 font-extrabold">daily earnings</span>{" "}
          with confidence.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center relative">
          <Card title="ASIC" image="/asic.png" description="Mining with" />

          <div className="hidden md:flex absolute z-20">
            <div className="w-28 h-28 rounded-full bg-black flex items-center justify-center shadow-xl">
              <span className="text-white font-bold">OR / AND</span>
            </div>
          </div>

          <Card title="GPU / CPU" image="/gpu.png" description="Mining with" />
        </div>
      </section>

      {/* TRUST */}
      <section
        ref={trust.ref}
        className={`py-28 transition-all duration-1000 ${trust.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
      >
        <p className="text-center max-w-5xl mx-auto text-gray-800 text-lg sm:text-xl md:text-2xl leading-relaxed font-semibold tracking-wide">
          Trusted by thousands of investors worldwide, we provide{" "}
          <span className="font-extrabold text-black">real-time mining insights</span>,{" "}
          <span className="font-extrabold text-black">secure daily payouts</span>, and{" "}
          <span className="font-extrabold text-black">bank-grade security</span> —
          so your capital works for you while you stay in control.
        </p>
      </section>
    </div>
  );
}
// cryptominingproject786_db_user
// z9DC3Vx62DyroEDq