export const metadata = {
  title: "About Privacy — Mining Dashboard",
  description:
    "About our Mining Dashboard project, its secure architecture, and the privacy-first approach that protects user accounts and wallet data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white">
      <div className="mx-auto max-w-6xl rounded-3xl border border-yellow-500/10 bg-gray-950/90 p-8 shadow-xl shadow-black/60 backdrop-blur-md">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-[0.32em] text-yellow-400/80">About the Project</p>
          <h1 className="mt-4 text-4xl font-extrabold text-white">About Mining Dashboard, Privacy, and Security</h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-white/70">
            Mining Dashboard is built to provide secure mining asset monitoring, fast wallet management, and transparent privacy controls. This page explains how the application works, how data is handled, and why users can trust the platform.
          </p>
        </header>

        <section className="space-y-8">
          <article>
            <h2 className="text-2xl font-bold text-yellow-400">What this project does</h2>
            <p className="mt-3 text-base leading-8 text-white/75">
              The Mining Dashboard project combines investment tracking, recharge management, withdrawal support, and mining performance insights into one polished experience. Users can monitor balances, claim rewards, and manage their profile through a secure, responsive interface built on Next.js.
            </p>
            <ul className="mt-4 space-y-3 text-white/70">
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <strong className="text-white">Intuitive account experience:</strong> sign in, review your dashboard, and manage recharges and withdrawals with confidence.
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <strong className="text-white">Optimized application flow:</strong> only the data needed for each page is loaded, reducing wait time and improving reliability.
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <strong className="text-white">Secure backend architecture:</strong> server-side APIs and protected routes ensure user actions are validated before state changes occur.
              </li>
            </ul>
          </article>

          <article>
            <h2 className="text-2xl font-bold text-yellow-400">About data privacy</h2>
            <p className="mt-3 text-base leading-8 text-white/75">
              Data privacy is central to the platform. We store only the information needed to operate your account and protect your wallet, and we never expose private details in the UI or through unsecured endpoints.
            </p>
            <ul className="mt-4 space-y-3 text-white/70">
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <strong className="text-white">Minimal collection:</strong> only essential profile fields such as username, email, phone, and encrypted credentials are retained.
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <strong className="text-white">Clear usage:</strong> personal data is used only for authentication, account operations, and delivering core mining dashboard features.
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <strong className="text-white">No resale of data:</strong> user information is never sold or shared with third parties outside the service scope.
              </li>
            </ul>
          </article>

          <article>
            <h2 className="text-2xl font-bold text-yellow-400">About security</h2>
            <p className="mt-3 text-base leading-8 text-white/75">
              Our security approach protects both accounts and data. The project uses password hashing, reset tokens, secure authentication routes, and API guards so every action is checked and validated.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-semibold text-white">Protected authentication</h3>
                <p className="mt-2 text-sm leading-7 text-white/70">
                  Sign-in and profile updates pass through protected routes that only authorized users can access.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <h3 className="font-semibold text-white">Secure password recovery</h3>
                <p className="mt-2 text-sm leading-7 text-white/70">
                  Password reset links are delivered securely and expire quickly, preventing unauthorized access.
                </p>
              </div>
            </div>
          </article>

          <article>
            <h2 className="text-2xl font-bold text-yellow-400">Why users trust this product</h2>
            <p className="mt-3 text-base leading-8 text-white/75">
              The platform focuses on transparency, performance, and trust. Users rely on it for secure wallet operations, seamless dashboard navigation, and clear privacy policies that keep their mining data safe.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/70">
                <strong className="text-white">Dependable operations</strong>
                <p className="mt-2">Fast access to balances, investments, and claims with minimal delays.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/70">
                <strong className="text-white">High data integrity</strong>
                <p className="mt-2">User inputs and transactions are validated before they take effect.</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-white/70">
                <strong className="text-white">Privacy-first design</strong>
                <p className="mt-2">Every page and feature is created with safe data handling in mind.</p>
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
