import type { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,#f7e8ea_0%,#fff_42%,#f3f6f4_100%)] px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(28,28,28,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(28,28,28,0.04) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="relative w-full max-w-md rounded-[28px] border border-border/80 bg-white/95 p-8 shadow-lift backdrop-blur-sm sm:p-10">
        <p className="font-heading text-2xl font-bold tracking-tight text-brand-red">RealtyCook</p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
