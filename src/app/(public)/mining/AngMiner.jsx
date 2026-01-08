import Image from "next/image";

const miners = [
    {
        name: "ANG Miner S15",
        image: "/ANG.png",
        returnRate: "26.00%",
        cycle: "30 Day",
        progress: "82.75%",
        price: "10.00 ~ 999.00 USDT",
    },
    {
        name: "ANG Miner RIG-819",
        image: "/Rig.png",
        returnRate: "28.00%",
        cycle: "33 Day",
        progress: "56.30%",
        price: "98.00 ~ 999.00 USDT",
    },
    {
        name: "ANG Minerbase L11",
        image: "/ANG.png",
        returnRate: "31.00%",
        cycle: "35Day",
        progress: "40.84%",
        price: "598.00 ~ 9,999.00 USDT",
    },
    {
        name: "ANG Miner D9",
        image: "/D9.png",
        returnRate: "35.00%",
        cycle: "40Day",
        progress: "44.30%",
        price: "1,688.00 ~ 99,999.00 USDT",
    },
    {
        name: "ANG Miner S21",
        image: "/S21.png",
        returnRate: "41.00%",
        cycle: "50Day",
        progress: "38.41%",
        price: "5,688.00 ~ 99,999.00 USDT",
    },
    {
        name: "ANG Miner L9",
        image: "/L9.png",
        returnRate: "48.00%",
        cycle: "50Day",
        progress: "39.76%",
        price: "15,888.00 ~ 999,999.00 USDT",
    },
];

export default function MiningOptions() {
    return (
        <section
            aria-labelledby="mining-options-heading"
            className="w-full bg-gradient-to-b from-[#6d028d] to-[#4a0066] py-14 px-4"
        >
            <h2 id="mining-options-heading" className="sr-only">
                Crypto Mining Investment Plans
            </h2>

            <div className="max-w-5xl mx-auto space-y-8">
                {miners.map((miner, index) => (
                    <article
                        key={miner.name}
                        itemScope
                        itemType="https://schema.org/Product"
                        className="flex flex-col md:flex-row items-center bg-[#7b3a8f] rounded-2xl p-6 md:p-8 shadow-lg"
                    >
                        <div className="w-32 h-32 relative flex-shrink-0 mb-6 md:mb-0">
                            <Image
                                src={miner.image}
                                alt={`${miner.name} crypto mining hardware`}
                                fill
                                sizes="(max-width: 768px) 128px, 160px"
                                priority={index === 0}
                                className="object-contain"
                            />
                        </div>

                        <div className="flex-1 md:pl-8 text-white w-full">
                            <h3 itemProp="name" className="text-xl font-semibold mb-4">
                                {miner.name}
                            </h3>

                            <meta itemProp="priceCurrency" content="USDT" />
                            <meta itemProp="price" content={miner.price} />

                            <dl className="grid grid-cols-2 gap-y-2 text-sm mb-4">
                                <dt className="opacity-80">Rate of return</dt>
                                <dd className="text-green-400 font-medium text-right">{miner.returnRate}</dd>

                                <dt className="opacity-80">Investment cycle</dt>
                                <dd className="text-green-400 font-medium text-right">{miner.cycle}</dd>

                                <dt className="opacity-80">Investments per day</dt>
                                <dd className="text-right">Unlimited</dd>

                                <dt className="opacity-80">Total investments</dt>
                                <dd className="text-right">Unlimited</dd>
                            </dl>

                            <div
                                className="relative h-3 bg-purple-300/30 rounded-full mb-5 overflow-hidden"
                                role="progressbar"
                                aria-valuenow={parseFloat(miner.progress)}
                                aria-valuemin="0"
                                aria-valuemax="100"
                            >
                                <div
                                    className="h-full bg-purple-400 rounded-full"
                                    style={{ width: miner.progress }}
                                />
                                <span className="absolute right-2 -top-6 text-xs text-white">
                                    {miner.progress}
                                </span>
                            </div>

                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="bg-black text-white px-4 py-2 rounded-full text-sm">
                                    {miner.price}
                                </div>

                                <button
                                    aria-label={`Buy ${miner.name} mining plan`}
                                    className="bg-black text-white px-6 py-2 rounded-full hover:bg-gray-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                                >
                                    Buy now
                                </button>
                            </div>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}
