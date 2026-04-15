export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white px-4 py-12 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl rounded-3xl bg-gray-900/95 p-8 shadow-2xl border border-gray-700">
        <h1 className="text-4xl font-extrabold text-yellow-400 sm:text-5xl">About CrytoMining</h1>
        <p className="mt-6 text-lg leading-8 text-gray-300">
          Welcome to CrytoMining. We provide a secure platform for users to manage mining investments,
          track earnings, and stay connected with the latest account activity.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl bg-gray-800 p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white">Secure Investments</h2>
            <p className="mt-3 text-sm text-gray-400">
              Track and manage your active investments in real time and view your locked profit,
              referral status, and account balance.
            </p>
          </div>
          <div className="rounded-3xl bg-gray-800 p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white">Transparent Dashboard</h2>
            <p className="mt-3 text-sm text-gray-400">
              Your dashboard keeps all important details in one place, with quick access
              to wallet actions, referrals, and mining performance.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
