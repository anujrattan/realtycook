# RealtyCook style guide

Tokens live in `src/app/globals.css` and are exposed as Tailwind utilities (`bg-brand-red`, `text-ink`, `bg-cream`, `font-heading`, `font-script`, `shadow-lift` …).

## Brand idea

**"Real estate, cooked right."** RealtyCook treats every deal like a recipe: understand the appetite, pick verified ingredients, cook the deal, serve and grow. The visual language is warm and confident: a clean kitchen-cream canvas, bold red for action, ink black for authority, and gold kept for money and returns.

## Colour

| Token | Hex | Utility | Use |
|---|---|---|---|
| Realty Red | `#C8102E` | `brand-red` | Primary actions, highlights, roof in the 3D scene. One dominant red element per viewport. |
| Red Deep | `#8E0B1F` | `brand-red-deep` | Hover/pressed, text on red-soft |
| Red Soft | `#FBE7EA` | `brand-red-soft` | Selected states, subtle tints |
| Cook Ink | `#111111` | `ink` | Headlines, body text, dark bands |
| Ink 2 | `#2A2A2D` | `ink-2` | Secondary dark surfaces, 3D towers |
| Kitchen Cream | `#FAF7F2` | `cream` | Page background |
| Cream 2 | `#F1ECE3` | `cream-2` | Alternating section background, muted fills |
| Stone | `#6B6862` | `stone` | Muted text |
| Saffron Gold | `#C9952B` | `gold` | Yield, rent, returns, data only. Never for buttons. |
| Gold Soft | `#F6EAD0` | `gold-soft` | Gold tints |

Body text is `ink` at 65–75% opacity on cream. Pure white (`#FFFFFF`) is used for cards to lift them off the cream page.

## Typography

| Role | Typeface | Weights | Notes |
|---|---|---|---|
| Display / headings | **Poppins** (`font-heading`) | 500, 600, 700 | Geometric like the logo wordmark. Tracking −0.02em. H1 4.1rem desktop / 2.6rem mobile. |
| Body / UI | **Inter** (`font-sans`) | 400–600 | 16–18px body, 1.6 line-height |
| Signature | **Kristi** (`font-script`) | 400 | Only for the tagline *Trust for growth…* and single accent words, such as *craving*. Never for sentences. |

Eyebrows: 12px, uppercase, 0.18em tracking, red, with a 24px leading rule (`.eyebrow`).

## Shape, depth and motion

- Radius: 12px base (`--radius`); cards 24px (`rounded-3xl`); pills for buttons and filters.
- Shadows: `shadow-soft` (resting cards), `shadow-lift` (hover / hero chips), `shadow-red` (primary CTA glow).
- 3D: React Three Fiber scenes use clay-style materials (matte whites, red roofs, gold metal coins) lit by a warm key light. Scenes lazy-mount when scrolled into view, fall back to a static monogram or 2D chart without WebGL, and stop auto-rotating for `prefers-reduced-motion`.
- Cards tilt up to 8° toward the cursor with a soft specular highlight (`TiltCard`). Mouse only; touch devices get flat cards.
- Transitions: 300ms ease-out; hovers lift 2–4px.

## Logo usage

- Wordmark: "Realty" in Realty Red + "Cook" in Ink with the chef hat on the C; on dark backgrounds "Cook" switches to cream (`<Wordmark inverted />`).
- Monogram (`<Monogram />`, `src/app/icon.svg`): red key-house R + ink C with chef hat. Used for favicon and small spaces.
- Keep clear space equal to the height of the "C" around the logo. Don't recolour the red, and don't put the wordmark on red backgrounds.
- The site uses SVG redraws of the supplied logo. Drop the original files into `public/brand/` to swap them in.

## Voice

Plain, warm, specific. Use cooking metaphors in headings ("Fresh off the stove", "Taste-test your returns"), and keep body copy literal and factual. No hype numbers without a source; show disclaimers wherever returns are mentioned.
