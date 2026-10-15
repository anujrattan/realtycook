const CRORE = 1_00_00_000;
const LAKH = 1_00_000;

/** Formats rupees the way Indian buyers read prices: ₹1.25 Cr, ₹48.5 L. */
export function formatINR(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= CRORE) return `${sign}₹${trim(abs / CRORE)} Cr`;
  if (abs >= LAKH) return `${sign}₹${trim(abs / LAKH)} L`;
  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
}

function trim(n: number) {
  return n >= 100 ? n.toFixed(0) : n.toFixed(2).replace(/\.?0+$/, "");
}

export type Projection = {
  year: number;
  value: number;
  cumulativeRent: number;
};

export function projectInvestment({
  price,
  appreciation,
  rentalYield,
  years,
}: {
  price: number;
  appreciation: number;
  rentalYield: number;
  years: number;
}): Projection[] {
  const rows: Projection[] = [];
  let value = price;
  let rent = 0;
  for (let year = 1; year <= years; year++) {
    rent += value * (rentalYield / 100);
    value *= 1 + appreciation / 100;
    rows.push({ year, value, cumulativeRent: rent });
  }
  return rows;
}
