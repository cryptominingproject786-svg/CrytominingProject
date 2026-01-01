import Image from "next/image";

export default function MiningCard({ title, image, description }) {
    return (
        <div className="w-full md:w-2/5 px-4 sm:px-6 md:px-8">
            <div className="flex flex-col items-center justify-center bg-white rounded-3xl p-8 sm:p-10 md:p-12 lg:p-14 shadow-md hover:shadow-xl transition duration-300 min-h-96">

                <div className="text-center space-y-4 mb-8">
                    <p className="text-gray-900 text-sm sm:text-base font-medium italic">
                        {description}
                    </p>
                    <div className="flex justify-center">
                        <div className="h-1.5 w-16 bg-yellow-400 rounded-full"></div>
                    </div>
                    <h3 className="text-4xl sm:text-5xl md:text-6xl font-black">
                        {title}
                    </h3>
                </div>

                {/* Image is lazy by default */}
                <div className="relative w-full h-40 sm:h-48 md:h-56 mb-10">
                    <Image
                        src={image}
                        alt={`${title} Mining Hardware`}
                        fill
                        className="object-contain"
                        loading="lazy"
                        sizes="(max-width: 640px) 280px, (max-width: 1024px) 300px, 350px"
                    />
                </div>

                <button className="px-8 py-3 border-2 border-black font-semibold rounded-full hover:bg-black hover:text-white transition transform hover:scale-105">
                    Learn more
                </button>
            </div>
        </div>
    );
}
