import { ChefHat } from "@/components/brand/logo";
import { STEPS } from "@/lib/content";

export function Process() {
  return (
    <section id="process" className="relative scroll-mt-24 overflow-hidden bg-white py-24 sm:py-32">
      <div className="section">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="eyebrow">The RealtyCook recipe</span>
            <h2 className="mt-4 text-4xl font-semibold text-ink sm:text-5xl">
              Four steps from <em className="font-script text-[1.25em] font-normal text-brand-red not-italic">craving</em> to keys.
            </h2>
            <p className="mt-6 max-w-md text-ink/65">
              The same tested method for a first home, a ₹50 crore warehouse or a quick resale. Nothing is skipped,
              and you always know which step you&apos;re on.
            </p>
            <div className="mt-10 hidden items-center gap-4 rounded-2xl border border-border bg-cream p-5 lg:flex">
              <ChefHat className="h-10 w-auto shrink-0" />
              <p className="text-sm text-ink/70">
                Every deal gets a written checklist and a single advisor. You&apos;ll never chase three people for one answer.
              </p>
            </div>
          </div>

          <ol className="relative space-y-5">
            <span className="absolute top-6 bottom-6 left-[27px] w-px bg-gradient-to-b from-brand-red via-border to-transparent" aria-hidden />
            {STEPS.map((s) => (
              <li key={s.n} className="group relative flex gap-6 rounded-3xl p-1">
                <span className="relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-cream font-heading text-lg font-semibold text-ink transition-all duration-300 group-hover:-translate-y-1 group-hover:border-brand-red group-hover:bg-brand-red group-hover:text-white group-hover:shadow-red">
                  {s.n}
                </span>
                <div className="flex-1 rounded-3xl border border-border bg-cream/60 p-6 transition-colors group-hover:bg-cream sm:p-7">
                  <h3 className="text-xl font-semibold text-ink sm:text-2xl">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink/65">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
