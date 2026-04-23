export const metadata = {
  title: "Company Profile — BittXS Mining Dashboard",
  description:
    "BittXS Corporation company profile showcasing corporate overview, headquarters, leadership, financial highlights, and awards.",
  alternates: {
    canonical: "/dashboard/company-profile",
  },
};

// ─── Data ────────────────────────────────────────────────────────────────────

const COMPANY_INFO = [
  { label: "Company Name", value: "Bittxs Corporation" },
  { label: "Industry", value: "Financial Services" },
  { label: "Founded", value: "March 30, 2021" },
  { label: "Chief Executive", value: "Jack Mathi" },
  { label: "Founders", value: "Novy Gate & Fary Rot" },
  { label: "Headquarters", value: "London, United Kingdom" },
  { label: "Employees", value: "402+" },
  { label: "Annual Revenue 2022", value: "$3.25 Billion" },
  { label: "Net Revenue 2022", value: "$1.28 Billion" },
];

const STATS = [
  { label: "Annual Revenue", value: "$3.25B", sub: "Fiscal 2022" },
  { label: "Net Revenue", value: "$1.28B", sub: "Fiscal 2022" },
  { label: "Global Employees", value: "402+", sub: "Full-time" },
  { label: "Years Active", value: "4+", sub: "Est. 2021" },
];

const AWARDS = [
  { year: "2022", label: "Best Company for Work-Life Balance", org: "UK Business Awards" },
  { year: "2021", label: "Best Place to Work in London", org: "London Chamber of Commerce" },
  { year: "2020", label: "Best Place to Work in London", org: "London Chamber of Commerce" },
  { year: "2019", label: "Best Company for Diversity", org: "Diversity in Finance" },
];

const PILLARS = [
  {
    icon: "◈",
    title: "Innovation-Led",
    body: "Pioneering fintech infrastructure that bridges legacy systems with next-generation digital asset markets.",
  },
  {
    icon: "◉",
    title: "Globally Trusted",
    body: "Regulated operations across major jurisdictions with institutional-grade compliance and risk management.",
  },
  {
    icon: "◎",
    title: "Sustainable Growth",
    body: "Consistent year-over-year revenue expansion underpinned by diversified product lines and strategic partnerships.",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border border-yellow-500/10 bg-black/40 px-5 py-4 backdrop-blur-sm">
      <span className="text-[11px] uppercase tracking-[0.28em] text-yellow-500/70">{label}</span>
      <span className="text-2xl font-bold tabular-nums text-white">{value}</span>
      <span className="text-xs text-slate-500">{sub}</span>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-white/[0.05] py-3.5 last:border-b-0 sm:flex-row sm:items-baseline sm:gap-6">
      <dt className="w-full shrink-0 text-[11px] uppercase tracking-[0.26em] text-yellow-500/70 sm:max-w-[200px]">
        {label}
      </dt>
      <dd className="text-sm leading-6 text-slate-200">{value}</dd>
    </div>
  );
}

function PillarCard({ icon, title, body }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-yellow-500/10 bg-black/30 p-6 transition-all duration-300 hover:border-yellow-400/25 hover:bg-black/50">
      <div className="mb-4 text-2xl text-yellow-400/80">{icon}</div>
      <h4 className="mb-2 text-sm font-semibold uppercase tracking-widest text-white">{title}</h4>
      <p className="text-sm leading-6 text-slate-400">{body}</p>
      {/* Subtle corner accent */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 h-16 w-16 translate-x-8 translate-y-8 rounded-full bg-yellow-400/5 transition-all duration-500 group-hover:translate-x-4 group-hover:translate-y-4 group-hover:bg-yellow-400/10"
      />
    </div>
  );
}

function AwardRow({ year, label, org, index }) {
  return (
    <li className="group flex items-start gap-4 rounded-2xl border border-yellow-500/10 bg-black/30 p-5 transition-all duration-200 hover:border-yellow-400/30 hover:bg-black/50">
      {/* Index badge */}
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-yellow-500/20 text-[10px] font-semibold text-yellow-500"
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-5 text-slate-100">{label}</p>
        <p className="mt-1 text-[11px] text-slate-500">{org}</p>
      </div>
      <span className="shrink-0 rounded-full border border-yellow-500/20 px-2.5 py-0.5 text-[11px] tracking-wide text-yellow-500/80">
        {year}
      </span>
    </li>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="mb-5 text-[11px] uppercase tracking-[0.35em] text-yellow-500/60">{children}</p>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CompanyProfilePage() {
  return (
    <main
      itemScope
      itemType="https://schema.org/Organization"
      aria-label="Bittxs Corporation company profile"
      className="min-h-screen bg-[#080808] px-4 py-10 text-white sm:px-6 lg:px-10"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(234,179,8,0.06) 0%, transparent 70%)",
      }}
    >
      <div className="mx-auto max-w-6xl space-y-8">

        {/* ── Header ── */}
        <header className="flex flex-col gap-6 border-b border-white/[0.06] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.4em] text-yellow-500/70">
              Company Profile
            </p>
            <h1
              itemProp="name"
              className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Bittxs Corporation
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              <span itemProp="foundingDate">Est. 2021</span>
              {" · "}
              <span itemProp="address">London, United Kingdom</span>
              {" · "}
              Financial Services
            </p>
          </div>

          {/* Status pill */}
          <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-yellow-500/20 bg-yellow-500/5 px-4 py-2 sm:self-auto">
            <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
            <span className="text-xs font-medium text-yellow-400">Active · Public Markets</span>
          </div>
        </header>

        {/* ── KPI Strip ── */}
        <section aria-label="Key financial metrics">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STATS.map((s) => (
              <StatCard key={s.label} {...s} />
            ))}
          </div>
        </section>

        {/* ── Main Grid ── */}
        <div className="grid gap-6 xl:grid-cols-[1fr_400px]">

          {/* Left column */}
          <div className="space-y-6">

            {/* Corporate Summary */}
            <section
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
              aria-labelledby="corporate-summary-heading"
            >
              <SectionLabel>Corporate Summary</SectionLabel>
              <h2 id="corporate-summary-heading" className="sr-only">Corporate Summary</h2>
              <p itemProp="description" className="text-sm leading-7 text-slate-300">
                Bittxs Corporation is a London-based global financial technology leader with a reputation
                for innovation, institutional trust, and sustainable growth. Since its founding in 2021,
                the company has scaled aggressively across digital asset infrastructure, proprietary
                mining operations, and enterprise financial services — establishing itself among the most
                recognized names in the sector within just four years of operation.
              </p>
            </section>

            {/* Company Information */}
            <section
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
              aria-labelledby="company-info-heading"
            >
              <SectionLabel>Company Information</SectionLabel>
              <h2 id="company-info-heading" className="sr-only">Company Information</h2>
              <dl className="divide-y divide-transparent">
                {COMPANY_INFO.map((row) => (
                  <InfoRow key={row.label} label={row.label} value={row.value} />
                ))}
              </dl>
            </section>

            {/* Strategic Pillars */}
            <section aria-labelledby="pillars-heading">
              <SectionLabel>Strategic Pillars</SectionLabel>
              <h2 id="pillars-heading" className="sr-only">Strategic Pillars</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {PILLARS.map((p) => (
                  <PillarCard key={p.title} {...p} />
                ))}
              </div>
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-6">

            {/* Awards */}
            <section
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
              aria-labelledby="awards-heading"
            >
              <SectionLabel>Awards &amp; Recognition</SectionLabel>
              <h2 id="awards-heading" className="sr-only">Awards and Recognition</h2>
              <ol className="space-y-3">
                {AWARDS.map((award, i) => (
                  <AwardRow key={award.year + award.label} index={i} {...award} />
                ))}
              </ol>
            </section>

            {/* Leadership Snapshot */}
            <section
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6"
              aria-labelledby="leadership-heading"
            >
              <SectionLabel>Leadership</SectionLabel>
              <h2 id="leadership-heading" className="sr-only">Leadership</h2>

              {/* CEO */}
              <div className="flex items-center gap-4 rounded-xl border border-white/[0.05] bg-black/40 p-4">
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-yellow-500/20 bg-yellow-500/10 text-xs font-bold text-yellow-400"
                >
                  JM
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Jack Mathi</p>
                  <p className="text-[11px] text-slate-500">Chief Executive Officer</p>
                </div>
                <span className="ml-auto rounded-full border border-yellow-500/20 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-yellow-500/70">
                  CEO
                </span>
              </div>

              {/* Founders */}
              <div className="mt-3 space-y-2">
                {["Novy Gate", "Fary Rot"].map((name) => {
                  const initials = name.split(" ").map((n) => n[0]).join("");
                  return (
                    <div
                      key={name}
                      className="flex items-center gap-4 rounded-xl border border-white/[0.04] bg-black/20 px-4 py-3"
                    >
                      <div
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-[10px] font-bold text-slate-300"
                      >
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm text-slate-200">{name}</p>
                        <p className="text-[11px] text-slate-600">Co-Founder</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Compliance / Trust note */}
            <aside className="rounded-2xl border border-yellow-500/10 bg-yellow-500/[0.03] p-5">
              <p className="mb-1 text-[11px] uppercase tracking-[0.28em] text-yellow-500/60">
                Regulatory Standing
              </p>
              <p className="text-sm leading-6 text-slate-400">
                Bittxs Corporation operates under applicable UK financial services regulation
                and maintains institutional-grade AML, KYC, and data governance frameworks
                across all product lines.
              </p>
            </aside>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="border-t border-white/[0.05] pt-6 text-center">
          <p className="text-[11px] text-slate-600">
            © {new Date().getFullYear()} Bittxs Corporation. All data reflects fiscal year 2022 unless stated otherwise.
          </p>
        </footer>

      </div>
    </main>
  );
}