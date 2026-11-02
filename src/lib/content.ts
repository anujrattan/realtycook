import type { LucideIcon } from "lucide-react";
import { Construction, Home, KeyRound, LandPlot, Store } from "lucide-react";

export type Mode = {
  id: string;
  title: string;
  /** Short line shown beside the hero model. */
  caption: string;
  /** Proof point on the lower hero chip. */
  proof: string;
  detail: string;
  kicker: string;
  body: string;
  points: string[];
  icon: LucideIcon;
  tone: "red" | "ink" | "gold";
};

/**
 * Order is the hero platter: Homes starts facing the camera, then Commercial,
 * Upcoming projects and Land parcels as it turns.
 */
export const MODES: Mode[] = [
  {
    id: "homes",
    title: "Homes",
    caption: "High-rise, low-rise & kothis",
    proof: "Shortlisted around how you live",
    detail: "Ready-to-move · walked in person",
    kicker: "High-rise · Low-rise · Kothis",
    body: "High-rise apartments, low-rise builder floors and independent kothis shortlisted around how you live, not whatever a portal is pushing this week.",
    points: ["Every home walked in person before you visit", "Home-loan tie-ups and eligibility check", "Negotiation done by us, not you"],
    icon: Home,
    tone: "red",
  },
  {
    id: "commercial",
    title: "Commercial",
    caption: "Retail shops & showrooms",
    proof: "Frontage checked on site",
    detail: "Main road · clear approach",
    kicker: "Retail shops · Showrooms · Built-up",
    body: "High-street retail shops and multi-floor showrooms, chosen for frontage, visibility and whether a business can actually thrive there.",
    points: ["Frontage, visibility and footfall checked", "Clear approach and customer parking", "Purchase or sale structured through to registration"],
    icon: Store,
    tone: "ink",
  },
  {
    id: "upcoming",
    title: "Upcoming projects",
    caption: "Sites still coming up",
    proof: "RERA registered",
    detail: "Approvals read, not assumed",
    kicker: "New launch · Under construction",
    body: "Projects still coming up. The builder, the approvals and the possession date are checked before any money is committed.",
    points: ["RERA registration and approvals", "Builder track record, not the brochure", "Possession date agreed in writing"],
    icon: Construction,
    tone: "gold",
  },
  {
    id: "land",
    title: "Land parcels",
    caption: "Plots held for growth",
    proof: "Layout approved",
    detail: "Zoning walked on the ground",
    kicker: "Plotted · Held for growth",
    body: "Land parcels in approved layouts, bought to hold, with zoning and access walked on the ground rather than taken from a brochure.",
    points: ["Layout approval and zoning checks", "Site visits with the survey map", "A reason to hold, and when to exit"],
    icon: LandPlot,
    tone: "ink",
  },
  {
    id: "leasing",
    title: "Leasing",
    caption: "Retail, office & residential leasing",
    proof: "Tenant & lock-in vetted",
    detail: "LOI · lock-in · registered lease",
    kicker: "Retail · Office · Residential",
    body: "Tenant placement, brand representation and end-to-end lease structuring for showrooms, corporate offices and residences—from LOI to registered lease deeds.",
    points: [
      "Tenant covenant, background and business-viability checks",
      "Rent escalation, lock-in period and security deposit structuring",
      "Fit-out terms, handover checklist and lease deed registration",
    ],
    icon: KeyRound,
    tone: "gold",
  },
];

export const STEPS = [
  {
    n: "01",
    title: "Know your appetite",
    body: "A 30-minute conversation about what you want: a home, an income or a long-term bet. We agree on budget, horizon and how much risk you're comfortable with.",
  },
  {
    n: "02",
    title: "Pick the ingredients",
    body: "We shortlist and verify: RERA registration, title chain, approvals, builder track record and fair-price checks against recent deals.",
  },
  {
    n: "03",
    title: "Cook the deal",
    body: "We negotiate price and terms, arrange financing and set up the deal structure: joint ownership, tax implications and the paperwork through to registration.",
  },
  {
    n: "04",
    title: "Serve & grow",
    body: "Registration, possession and handover, then leasing, upkeep and an annual portfolio check so your asset keeps working for you.",
  },
];

export type Listing = {
  id: string;
  title: string;
  locality: string;
  price: number;
  category: "buy" | "invest" | "rent";
  tag: string;
  specs: string[];
  metric?: string;
  floors: number;
  hue: "red" | "ink" | "gold";
};

export const LISTINGS: Listing[] = [
  {
    id: "l1",
    title: "3 BHK with a garden view",
    locality: "Sector 65, Gurugram",
    price: 2_45_00_000,
    category: "buy",
    tag: "Ready to move",
    specs: ["1,920 sq ft", "3 bath", "2 parking"],
    floors: 7,
    hue: "red",
  },
  {
    id: "l2",
    title: "Pre-leased office floor",
    locality: "Baner, Pune",
    price: 6_80_00_000,
    category: "invest",
    tag: "Tenant in place",
    specs: ["9,400 sq ft", "9-yr lease", "MNC tenant"],
    metric: "7.8% yield",
    floors: 5,
    hue: "ink",
  },
  {
    id: "l3",
    title: "2 BHK in a new launch tower",
    locality: "Sector 150, Noida",
    price: 1_12_00_000,
    category: "buy",
    tag: "New launch",
    specs: ["1,180 sq ft", "2 bath", "Possession 2028"],
    floors: 9,
    hue: "gold",
  },
  {
    id: "l4",
    title: "High-street retail unit",
    locality: "Indiranagar, Bengaluru",
    price: 3_95_00_000,
    category: "invest",
    tag: "Pre-leased",
    specs: ["1,450 sq ft", "Ground floor", "F&B brand"],
    metric: "6.9% yield",
    floors: 3,
    hue: "red",
  },
  {
    id: "l5",
    title: "Furnished 2 BHK near the metro",
    locality: "Andheri West, Mumbai",
    price: 85_000,
    category: "rent",
    tag: "Per month",
    specs: ["950 sq ft", "Fully furnished", "Metro 4 min"],
    floors: 8,
    hue: "ink",
  },
  {
    id: "l6",
    title: "Corner villa plot",
    locality: "Sohna Road, Gurugram",
    price: 1_65_00_000,
    category: "invest",
    tag: "Approved layout",
    specs: ["250 sq yd", "East facing", "30 m road"],
    metric: "Growth corridor",
    floors: 1,
    hue: "gold",
  },
];

export const COMPARE_ROWS: {
  label: string;
  portal: 0 | 1 | 2;
  broker: 0 | 1 | 2;
  us: 0 | 1 | 2;
}[] = [
  { label: "Buy, sell, invest and lease under one roof", portal: 1, broker: 1, us: 2 },
  { label: "Investment & lease analysis (yield, lock-in, exit)", portal: 0, broker: 0, us: 2 },
  { label: "Title, RERA and approval checks before visits", portal: 0, broker: 1, us: 2 },
  { label: "One named advisor from search to registration", portal: 0, broker: 2, us: 2 },
  { label: "Fees and commissions in writing, upfront", portal: 1, broker: 0, us: 2 },
  { label: "After-sale support: leasing, upkeep & portfolio review", portal: 0, broker: 1, us: 2 },
];
