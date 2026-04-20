export const metadata = {
  title: "About Us — Mining Dashboard",
  description:
    "Discover how our UK-based mining dashboard works, how mining machines operate, how the team earns, and how referral bonuses and reinvested mineral profits create reliable returns.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-12 text-white">
      <div className="mx-auto max-w-6xl space-y-10 rounded-3xl border border-yellow-500/10 bg-gray-950/90 p-8 shadow-xl shadow-black/60 backdrop-blur-md">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-[0.32em] text-yellow-400/80">About Our Project</p>
          <h1 className="text-4xl font-extrabold text-white">How the Mining Dashboard Works</h1>
          <p className="max-w-3xl text-base leading-8 text-white/70">
            Our platform brings mining operations, investment tracking, and earnings management together in one secure dashboard. Built for transparency and performance, the product is designed to keep your mining data safe while helping you grow returns from reinvested mineral operations.
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-black/20">
            <h2 className="text-2xl font-semibold text-yellow-400">Project logic and operation</h2>
            <p className="mt-4 text-white/75 leading-8">
              The project is built around a simple workflow: users deposit funds, choose mining packages, and monitor performance through automated dashboards. Each transaction is validated by secure APIs, and every profit calculation is derived from live mining machine output and mineral reinvestment strategies.
            </p>
            <ul className="mt-6 space-y-3 text-white/70">
              <li className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <strong>Smart tracking:</strong> investment, wallet, and claim history are updated in real time.
              </li>
              <li className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <strong>Secure validation:</strong> account actions, password updates, and withdrawals use protected routes.
              </li>
              <li className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <strong>Profit distribution:</strong> earnings are calculated from mineral reinvestment and returned to users on a regular cycle.
              </li>
            </ul>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-black/20">
            <h2 className="text-2xl font-semibold text-yellow-400">UK-based company and trusted support</h2>
            <p className="mt-4 text-white/75 leading-8">
              Our company is headquartered in the United Kingdom. That means operational oversight, customer support, and project governance are aligned with strict standards for security, compliance, and accountable service.
            </p>
            <div className="mt-6 space-y-4 text-white/70">
              <p className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <strong>Office location:</strong> United Kingdom-based operations ensure clear oversight and professional support.
              </p>
              <p className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <strong>Reliable governance:</strong> company procedures are built around secure account handling and transparent earnings reporting.
              </p>
            </div>
          </article>
        </section>

        <section className="space-y-8">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-black/20">
            <h2 className="text-2xl font-semibold text-yellow-400">Mining machines and resource reinvestment</h2>
            <p className="mt-4 text-white/75 leading-8">
              The core of the project is the mining machine network. Investments are reinvested into mineral operations, and the generated output is used to fund returns for the community.
            </p>
            <ul className="mt-6 space-y-3 text-white/70">
              <li className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <strong>Machine efficiency:</strong> mining machines are selected for stable yield and continuous production.
              </li>
              <li className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <strong>Mineral reinvestment:</strong> earned assets are reinvested to increase operational capacity and compound profit.
              </li>
              <li className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <strong>Profit flow:</strong> returns are generated from mineral extraction and distributed back to active investors.
              </li>
            </ul>
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-black/20">
            <h2 className="text-2xl font-semibold text-yellow-400">Team earning and rewards</h2>
            <p className="mt-4 text-white/75 leading-8">
              The platform rewards both personal performance and community growth. Team earning allows members to earn additional income from referred activity, while referral bonuses give immediate incentive for introducing new players.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-semibold text-white">Team earning</h3>
                <p className="mt-2 text-sm text-white/70 leading-7">
                  As your team grows, you earn commissions from network performance and shared mining results across referrals.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                <h3 className="text-lg font-semibold text-white">Referral bonus</h3>
                <p className="mt-2 text-sm text-white/70 leading-7">
                  Invite new users to the platform and unlock referral bonuses that reward your account with extra earnings.
                </p>
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-black/20">
          <h2 className="text-2xl font-semibold text-yellow-400">Why this project matters</h2>
          <p className="mt-4 text-white/75 leading-8">
            This platform is built for users who want a secure, transparent way to participate in mining-backed investments. The team reinvests profits into mineral operations, then shares returns with users so every contribution benefits the project and the community.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3 text-white/70">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <strong className="block text-white">Sustainable growth</strong>
              <p className="mt-2 text-sm leading-7">Reinvested profits fuel stronger mining capacity and higher long-term returns.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <strong className="block text-white">Community rewards</strong>
              <p className="mt-2 text-sm leading-7">Referral bonuses and team earnings help users earn while expanding the platform.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <strong className="block text-white">UK-based reliability</strong>
              <p className="mt-2 text-sm leading-7">Company governance is managed from the United Kingdom for strong oversight and trust.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
