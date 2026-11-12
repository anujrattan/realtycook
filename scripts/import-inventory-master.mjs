/**
 * Import Inventory Master sheet into public.crm_properties.
 *
 * Usage:
 *   node scripts/import-inventory-master.mjs "/path/to/RealtyCook _ Residential Inventory Responses.xlsx"
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env
 * Stores full sheet fields as JSON inside `specs` until the expand migration is applied.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  const env = {};
  for (const line of raw.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    env[line.slice(0, i)] = line.slice(i + 1).replace(/^"|"$/g, "");
  }
  return env;
}

function cell(v) {
  if (v == null) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number" && Number.isInteger(v)) return v;
  if (typeof v === "string") {
    const s = v.trim();
    return s || null;
  }
  return v;
}

function budget(price) {
  if (typeof price !== "number") return "unsure";
  if (price < 5_000_000) return "under-50l";
  if (price < 10_000_000) return "50l-1cr";
  if (price < 30_000_000) return "1-3cr";
  if (price < 100_000_000) return "3-10cr";
  return "10cr-plus";
}

function priceLabel(price) {
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) return "Price on request";
  if (price >= 10_000_000) {
    const cr = price / 10_000_000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  const la = price / 100_000;
  return `₹${la % 1 === 0 ? la.toFixed(0) : la.toFixed(2)} L`;
}

function pillar(ptype, possession) {
  const t = (ptype || "").toLowerCase();
  if (t.includes("plot") && !t.includes("commercial")) return "land";
  if (
    t.includes("commercial") ||
    t.includes("retail") ||
    t.includes("office") ||
    t.includes("showroom") ||
    t.includes("sco") ||
    t.includes("shop") ||
    t.includes("virtual")
  ) {
    return "commercial";
  }
  if ((possession || "").toLowerCase() === "under construction") return "upcoming";
  return "homes";
}

function fmtNum(n) {
  if (typeof n !== "number") return null;
  return n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

function rowsFromXlsx(filePath) {
  let XLSX;
  try {
    XLSX = require("xlsx");
  } catch {
    throw new Error("Install xlsx: npm i -D xlsx");
  }
  const wb = XLSX.readFile(filePath, { cellDates: true });
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase().includes("inventory") && n.toLowerCase().includes("master")) ||
    wb.SheetNames.find((n) => n.toLowerCase().includes("inventory")) ||
    wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: true, blankrows: false });
  return json
    .map((row) => {
      const mapped = {};
      for (const [k, v] of Object.entries(row)) mapped[k] = cell(v);
      return mapped;
    })
    .filter((row) => {
      const name = row["Project / Society / Property Name"];
      return Boolean(name && String(name).trim());
    });
}

function rowsFromJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function toProperty(raw) {
  // Support both Excel row shape and already-normalized JSON from inventory-master.json
  if (raw.inventory || raw.specs?.includes?.("inventory")) {
    return raw;
  }
  const project = raw["Project / Society / Property Name"] || "Untitled";
  const city = raw.City;
  const area = raw["Locality / Sector / Area"];
  const config = raw.Configuration;
  const possession = raw["Possession Status"];
  const furnishing = raw["Furnishing Status"];
  const ptype = raw["Property Type"];
  const price = raw["Quoted Property Price (₹)"];
  const superA = raw["Super Area (sq. ft.)"];

  const inventory = {
    project_name: project,
    property_type: ptype,
    city,
    locality_area: area,
    developer_name: raw["Developer / Builder Name"],
    rera_number: raw["Project RERA Registration Number"],
    listing_link: raw["Project Website / Brochure / Listing Link"],
    configuration: config,
    unit_details: raw["Unit / Tower / Floor Details"],
    super_area_sqft: raw["Super Area (sq. ft.)"],
    builtup_area_sqft: raw["Built-up Area (sq. ft.)"],
    carpet_area_sqft: raw["Carpet Area (sq. ft.)"],
    bathrooms: raw["Number of Bathrooms"],
    availability_status: raw["Availability Status"],
    possession_status: possession,
    expected_possession_date: raw["Expected Possession Date"],
    quoted_price: price,
    price_per_sqft: raw["Calculated Price per sq. ft."],
    plc_notes: raw["PLC (₹)"],
    ifms_amount: raw["IFMS / Maintenance Fund (₹)"],
    club_charges: raw["Club Membership Charges (₹)"],
    other_charges: raw["Other Charges (₹)"],
    charges_included: raw["Charges Included in Quoted Price"],
    price_list_link: raw["Latest Price List / Cost Sheet Link"],
    parking_included: raw["Parking Included per Unit"],
    additional_parking_cost: raw["Cost per Additional Parking Space (₹)"],
    furnishing_status: furnishing,
    appliances_included: raw["Appliances Included"],
    power_backup: raw["Power Backup"],
    gas_pipeline: raw["Gas Pipeline"],
    amenities: raw["Project Amenities"],
    verification_status: raw["Verification Status"],
    price_verified_date: raw["Price Verified Date"],
    availability_verified_date: raw["Availability Verified Date"],
    source_links: raw["Source / Supporting Link"],
    assigned_to_email: raw["Assigned To"],
    internal_notes: raw["Internal Notes"],
    last_updated: raw["Last Updated"],
  };

  const summaryBits = [
    config,
    fmtNum(superA) ? `${fmtNum(superA)} sq.ft` : null,
    possession,
    furnishing,
  ].filter(Boolean);

  return {
    title: (config ? `${project} — ${config}` : project).slice(0, 200),
    pillar: pillar(ptype, possession),
    intent: "buy",
    locality: [city, area].filter(Boolean).join(" · ").slice(0, 240) || "Tricity",
    price_label: priceLabel(typeof price === "number" ? price : Number(price)),
    budget_bracket: budget(typeof price === "number" ? price : Number(price)),
    specs: JSON.stringify({
      summary: summaryBits.join(" · ") || ptype || "Inventory unit",
      inventory,
    }),
    verification_badge: String(raw["Verification Status"] || "Inventory").slice(0, 80),
    added_by_name: "Inventory Master",
    added_by_role: "admin",
    active: true,
  };
}

async function sb(url, key, path, init = {}) {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: init.method === "POST" ? "return=representation" : "return=minimal",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method || "GET"} ${path} → ${res.status}: ${text.slice(0, 500)}`);
  return text ? JSON.parse(text) : null;
}

async function main() {
  const env = loadEnv();
  const url = (env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");

  const input =
    process.argv[2] ||
    resolve(process.cwd(), "scripts/inventory-master.json");
  if (!existsSync(input)) throw new Error(`Input not found: ${input}`);

  const rawRows = input.endsWith(".json") ? rowsFromJson(input) : rowsFromXlsx(input);
  const properties = rawRows
    .map(toProperty)
    .filter((p) => p.title && p.locality);

  console.log(`Prepared ${properties.length} inventory rows from ${input}`);

  // Replace previous Inventory Master imports (and clear empty table seed).
  await sb(url, key, "crm_properties?added_by_name=eq.Inventory%20Master", { method: "DELETE" });

  const chunkSize = 40;
  let inserted = 0;
  for (let i = 0; i < properties.length; i += chunkSize) {
    const chunk = properties.slice(i, i + chunkSize).map((p) => ({
      title: p.title,
      pillar: p.pillar,
      intent: p.intent,
      locality: p.locality,
      price_label: p.price_label,
      budget_bracket: p.budget_bracket,
      specs: p.specs,
      verification_badge: p.verification_badge,
      added_by_name: p.added_by_name,
      added_by_role: p.added_by_role,
      active: true,
    }));
    const res = await sb(url, key, "crm_properties", {
      method: "POST",
      body: JSON.stringify(chunk),
    });
    inserted += Array.isArray(res) ? res.length : chunk.length;
    console.log(`Inserted ${inserted}/${properties.length}`);
  }

  const countRes = await fetch(`${url}/rest/v1/crm_properties?select=id&active=eq.true&added_by_name=eq.Inventory%20Master`, {
    headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact", Range: "0-0" },
  });
  console.log("Done. content-range:", countRes.headers.get("content-range"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
