import { Logo, Mark } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Services",
    links: [
      { label: "Homes", href: "#modes" },
      { label: "Commercial", href: "#modes" },
      { label: "Upcoming projects", href: "#modes" },
      { label: "Land parcels", href: "#modes" },
      { label: "Leasing", href: "#modes" },
    ],
  },
  {
    title: "Explore",
    links: [
      { label: "How we work", href: "#process" },
      { label: "Why RealtyCook", href: "#why" },
      { label: "Contact", href: "#contact" },
      { label: "Advisor CRM", href: "/crm" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="dark bg-background text-foreground">
      <div className="section grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Logo inverted className="h-20 sm:h-24" />
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/55">
            RealtyCook advises on homes, commercial shoprooms and plots, upcoming projects, land parcels and leasing.
          </p>
          <a href="#contact" className="mt-6 inline-flex rounded-full bg-brand-red px-5 py-2.5 text-sm font-semibold text-white shadow-red hover:bg-brand-red/90">
            Book a free consultation
          </a>
        </div>
        {COLUMNS.map((c) => (
          <div key={c.title}>
            <p className="text-xs font-semibold tracking-[0.18em] text-white/40 uppercase">{c.title}</p>
            <ul className="mt-5 space-y-3 text-sm">
              {c.links.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-white/70 transition-colors hover:text-white">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="section flex flex-col items-start justify-between gap-4 py-6 text-xs text-white/40 sm:flex-row sm:items-center">
          <p>© 2026 RealtyCook. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <Mark inverted className="h-6" /> Property figures shown are indicative and subject to verification.
          </p>
        </div>
      </div>
    </footer>
  );
}
