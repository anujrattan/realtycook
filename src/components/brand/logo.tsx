import { cn } from "@/lib/utils";

export function ChefHat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 44 34" className={className} aria-hidden="true">
      <path
        d="M9 27c-6-1-8-9-3-12-1-7 7-11 12-8 3-6 13-6 15 1 6 0 9 7 5 11l-1 8H10z"
        fill="#fff"
        stroke="var(--rc-red)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M34 9c5 1 7 8 3 11" fill="none" stroke="var(--rc-ink)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M11 28h26" stroke="var(--rc-ink)" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Monogram({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="RealtyCook">
      <path
        d="M33 13c1-5 9-6 11-2 3-3 10-1 10 4 4 1 4 7 0 8l-1 4H38l-1-4c-4-1-6-6-4-10z"
        fill="#fff"
        stroke="var(--rc-red)"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d="M51 16c3 1 3 6 1 7" fill="none" stroke="var(--rc-ink)" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M15 53V27h9.5a7.5 7.5 0 0 1 0 15H15m9 0 7 11"
        fill="none"
        stroke="var(--rc-red)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.5 46 15 37.5 25.5 46"
        fill="none"
        stroke="var(--rc-red)"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M55 36.5A13 13 0 1 0 55 49.5" fill="none" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({
  className,
  tagline = false,
  inverted = false,
}: {
  className?: string;
  tagline?: boolean;
  inverted?: boolean;
}) {
  return (
    <span className={cn("inline-flex flex-col leading-none", className)}>
      <span className="font-heading text-[1.6em] font-semibold tracking-[-0.03em]">
        <span className="text-brand-red">Realty</span>
        <span className={cn("relative", inverted ? "text-cream" : "text-ink")}>
          <ChefHat className="absolute -top-[0.66em] left-[0.04em] h-[0.8em] w-auto -rotate-6" />C
        </span>
        <span className={inverted ? "text-cream" : "text-ink"}>ook</span>
      </span>
      {tagline && (
        <span
          className={cn(
            "font-script mt-1 self-center text-[1.5em]",
            inverted ? "text-cream/80" : "text-ink/80",
          )}
        >
          Trust for growth…
        </span>
      )}
    </span>
  );
}
