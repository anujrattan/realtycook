# RealtyCook website

Landing page for **RealtyCook**, a real estate brand for buying, selling and investing in property (homes, pre-leased commercial, plots, fractional ownership and an NRI desk). The tagline is *Trust for growth…*

Built with Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui (Base UI) and React Three Fiber for the 3D scenes.

## Run locally

```bash
cd realtycook-web
npm install
npm run dev -- -p 4317
```

Open http://localhost:4317.

`npm run build && npm start` runs a production build. `npm run lint` runs ESLint.

## What's on the page

- **Hero**: interactive 3D city on a serving platter (pins, key, coin stack) that tilts with the cursor, plus an "I want to" intent picker that pre-fills the enquiry form.
- **Six ways to deal**: buy, sell, invest, fractional, plots, NRI, shown as 3D tilt cards.
- **The RealtyCook recipe**: four-step process.
- **Properties**: filterable sample listings with ₹ lakh/crore formatting.
- **Returns calculator**: sliders driving a live 3D bar chart of property value and rent collected.
- **Why RealtyCook**: comparison with listing portals and local brokers.
- **Enquiry form**: validated on the client and in `POST /api/enquiry`.

## Notes

- **Enquiries are mocked.** `src/app/api/enquiry/route.ts` validates and logs to the server console. Connect it to your CRM, email or WhatsApp provider before launch.
- **Listings are samples.** Edit `src/lib/content.ts` (listings, services, process steps, comparison rows).
- **Logo.** The wordmark and monogram are SVG redraws in `src/components/brand/logo.tsx`; the favicon is `src/app/icon.svg`. Put the original logo files in `public/brand/` if you'd rather use them.
- **No WebGL?** 3D scenes fall back to a static monogram and a 2D chart.

## Docs

- [`docs/style-guide.md`](docs/style-guide.md): colour, type, depth, motion, logo and voice rules.
- [`docs/competitive-analysis.md`](docs/competitive-analysis.md): Indian real estate competitor landscape and how the page responds to it.
