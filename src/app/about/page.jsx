export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl rounded-3xl bg-gray-900/95 p-8 shadow-2xl border border-gray-700">
        <h1 className="text-4xl font-extrabold text-yellow-400 sm:text-5xl">About CryptoMining</h1>
        <p className="mt-6 text-lg leading-8 text-gray-300">
          CryptoMining is a secure platform for managing mining investments, tracking earnings, and monitoring your dashboard.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl bg-gray-800 p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white">Transparent Dashboard</h2>
            <p className="mt-3 text-sm text-gray-400">
              View your active investments, balance, and referral rewards in one place.
            </p>
          </div>
          <div className="rounded-3xl bg-gray-800 p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white">Fast Support</h2>
            <p className="mt-3 text-sm text-gray-400">
              Stay connected with support and get reliable updates for your mining account.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
