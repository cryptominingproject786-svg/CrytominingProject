export default function CardSkeleton() {
    return (
        <div className="w-full md:w-2/5 px-4">
            <div className="bg-white rounded-3xl p-12 min-h-96 animate-pulse">
                <div className="h-4 w-32 bg-gray-300 rounded mb-6 mx-auto"></div>
                <div className="h-10 w-40 bg-gray-300 rounded mb-10 mx-auto"></div>
                <div className="h-48 bg-gray-200 rounded mb-10"></div>
                <div className="h-10 w-32 bg-gray-300 rounded mx-auto"></div>
            </div>
        </div>
    );
}
