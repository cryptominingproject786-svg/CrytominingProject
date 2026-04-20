"use client";

const footerLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Privacy", href: "/privacy" },
  {
    label: "Support",
    href: "https://wa.me/447988596249?text=Hi!%20I%20need%20support%20with%20the%20Mining%20Platform.",
    external: true,
  },
];

const socialLinks = [
  { label: "Facebook", href: "https://www.facebook.com/share/1QQDt7mjgv", bg: "#1877f2", text: "f" },
  {
    label: "WhatsApp",
    href: "https://whatsapp.com/channel/0029Vb8aKhr6hENp2j9ZRv2t",
    bg: "#25D366",
    text: "WA"
  },
  { label: "LinkedIn", href: "https://linkedin.com", bg: "#0a66c2", text: "in" },
  { label: "Instagram", href: "https://instagram.com", bg: "#e1306c", text: "ig" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/5 px-6 py-14 text-white">
      <div className="mx-auto max-w-6xl">

        {/* ── Top grid ── */}
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 mb-12">

          {/* Brand */}
          <div className="space-y-4">
            <p className="text-xs font-semibold tracking-[0.3em] uppercase text-yellow-400">
              Mining Dashboard
            </p>
            <h2 className="text-2xl font-extrabold leading-snug text-white">
              Secure mining.<br />Trusted rewards.
            </h2>
            <p className="text-sm leading-7 text-white/40">
              UK-based platform for fast wallet updates, clear investment
              tracking, and privacy-first infrastructure.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 mb-5">
              Quick links
            </h3>
            <nav className="flex flex-col gap-3">
              {footerLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-yellow-400"
                >
                  <span className="h-1 w-1 rounded-full bg-yellow-500/40" />
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 mb-5">
              Follow us
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {socialLinks.map((s) => (
                <a
                  key={s.href}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 text-xs text-white/50 transition-all hover:border-yellow-400/30 hover:bg-yellow-500/6 hover:text-yellow-400"
                >
                  <span
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                    style={{ background: s.bg }}
                  >
                    {s.text}
                  </span>
                  {s.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="border-t border-white/5 mb-6" />

        {/* ── Bottom bar ── */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-3 py-1.5">
              <span className="text-base">🇬🇧</span>
              <span className="text-xs text-white/40">
                <span className="font-semibold text-yellow-400">United Kingdom</span> — Registered office
              </span>
            </div>
            <a
              href="mailto:support@miningdashboard.com"
              className="text-xs text-white/30 transition-colors hover:text-yellow-400"
            >
              bittxsukofficial@gmail.com
            </a>
          </div>
          <p className="text-xs text-white/20">
            © {new Date().getFullYear()} BittXs all rights reserver 2016.
          </p>
        </div>

      </div>
    </footer>
  );
}