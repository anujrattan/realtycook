import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Globe2,
  Home,
  KeyRound,
  LandPlot,
  PieChart,
} from "lucide-react";

export type Mode = {
  id: string;
  title: string;
  kicker: string;
  body: string;
  points: string[];
  icon: LucideIcon;
  tone: "red" | "ink" | "gold";
};

export const MODES: Mode[] = [
  {
    id: "buy",
    title: "Buy a home",
    kicker: "Resale · New launch · Ready-to-move",
    body: "Shortlists built around your commute, school run and budget, not whatever a portal wants to promote this week.",
    points: ["RERA and title checks before you visit", "Home-loan tie-ups and eligibility check", "Negotiation done by us, not you"],
    icon: Home,
    tone: "red",
  },
  {
    id: "sell",
    title: "Sell your property",
    kicker: "Pricing · Marketing · Closing",
    body: "A price backed by recent registrations nearby, a listing that photographs well, and serious buyers only.",
    points: ["Comparable-sales pricing report", "Professional shoot and listing", "Paperwork through to registration"],
    icon: KeyRound,
    tone: "ink",
  },
  {
    id: "invest",
    title: "Invest for income",
    kicker: "Pre-leased · Commercial · Retail",
    body: "Office floors, retail units and warehouses with tenants in place, chosen for rental yield and lease strength.",
    points: ["Tenant and lease-tenure diligence", "Yield and exit modelling", "Portfolio reviews every year"],
    icon: Building2,
    tone: "gold",
  },
  {
    id: "fractional",
    title: "Fractional ownership",
    kicker: "Start smaller · Grade-A assets",
    body: "Own a share of an institutional-grade property alongside other investors, with rental income paid out to you.",
    points: ["Platform and SPV structure explained", "Side-by-side comparison of offerings", "Clear view of lock-ins and exit"],
    icon: PieChart,
    tone: "red",
  },
  {
    id: "plots",
    title: "Land & plots",
    kicker: "Residential · Farm · Township",
    body: "Plots in approved layouts where growth corridors are forming, with zoning and access verified on the ground.",
    points: ["Layout approval and zoning checks", "Site visits with survey maps", "Long-horizon growth thesis"],
    icon: LandPlot,
    tone: "ink",
  },
  {
    id: "nri",
    title: "NRI desk",
    kicker: "Remote buying · Management",
    body: "Buy, sell or rent out property in India from abroad, with video walkthroughs and help with the documents you'll need.",
    points: ["Virtual site visits", "Help with power of attorney and repatriation paperwork", "Tenant and upkeep management"],
    icon: Globe2,
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
    body: "We negotiate price and terms, arrange financing and set up the deal structure: joint ownership, NRI rules and tax implications.",
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
  { label: "Buy, sell and invest under one roof", portal: 1, broker: 1, us: 2 },
  { label: "Investment-grade analysis (yield, exit, lease)", portal: 0, broker: 0, us: 2 },
  { label: "Title, RERA and approval checks before visits", portal: 0, broker: 1, us: 2 },
  { label: "One named advisor from search to registration", portal: 0, broker: 2, us: 2 },
  { label: "Fees and commissions in writing, upfront", portal: 1, broker: 0, us: 2 },
  { label: "After-sale support: leasing, upkeep, resale", portal: 0, broker: 1, us: 2 },
];
