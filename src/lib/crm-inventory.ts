import type { CrmLead, CrmProperty } from "@/lib/crm-store";

/** Full Inventory Master payload stored inside `crm_properties.specs` as JSON. */
export type InventoryDetails = {
  project_name?: string | null;
  property_type?: string | null;
  city?: string | null;
  locality_area?: string | null;
  developer_name?: string | null;
  rera_number?: string | null;
  listing_link?: string | null;
  configuration?: string | null;
  unit_details?: string | null;
  super_area_sqft?: number | null;
  builtup_area_sqft?: number | null;
  carpet_area_sqft?: number | null;
  bathrooms?: number | null;
  availability_status?: string | null;
  possession_status?: string | null;
  expected_possession_date?: string | null;
  quoted_price?: number | null;
  price_per_sqft?: number | null;
  plc_notes?: string | null;
  ifms_amount?: number | null;
  club_charges?: number | null;
  other_charges?: number | null;
  charges_included?: string | null;
  price_list_link?: string | null;
  parking_included?: string | null;
  additional_parking_cost?: number | null;
  furnishing_status?: string | null;
  appliances_included?: string | null;
  power_backup?: string | null;
  gas_pipeline?: string | null;
  amenities?: string | null;
  verification_status?: string | null;
  price_verified_date?: string | null;
  availability_verified_date?: string | null;
  source_links?: string | null;
  assigned_to_email?: string | null;
  internal_notes?: string | null;
  last_updated?: string | null;
};

type SpecsPayload = {
  summary?: string;
  inventory?: InventoryDetails;
};

export function parsePropertySpecs(prop: CrmProperty): { summary: string; inventory: InventoryDetails | null } {
  const raw = prop.specs?.trim() || "";
  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as SpecsPayload;
      if (parsed && typeof parsed === "object") {
        return {
          summary: parsed.summary || prop.specs,
          inventory: parsed.inventory || null,
        };
      }
    } catch {
      // fall through
    }
  }
  return { summary: raw || "—", inventory: null };
}

export function propertySummary(prop: CrmProperty) {
  return parsePropertySpecs(prop).summary;
}

export function propertyInventory(prop: CrmProperty) {
  return parsePropertySpecs(prop).inventory;
}

export function propertyProjectName(prop: CrmProperty) {
  return propertyInventory(prop)?.project_name || prop.title.split(" — ")[0] || prop.title;
}

export function formatInrAmount(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  if (value >= 10_000_000) {
    const cr = value / 10_000_000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (value >= 100_000) {
    const la = value / 100_000;
    return `₹${la % 1 === 0 ? la.toFixed(0) : la.toFixed(2)} L`;
  }
  return `₹${value.toLocaleString("en-IN")}`;
}

export function uniqueInventoryValues(properties: CrmProperty[], key: keyof InventoryDetails) {
  const set = new Set<string>();
  for (const prop of properties) {
    const inv = propertyInventory(prop);
    const value = inv?.[key];
    if (value != null && String(value).trim()) set.add(String(value).trim());
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export type InventoryFilters = {
  query: string;
  city: string;
  propertyType: string;
  configuration: string;
  possession: string;
  furnishing: string;
  verification: string;
  budget: string;
};

export const EMPTY_INVENTORY_FILTERS: InventoryFilters = {
  query: "",
  city: "",
  propertyType: "",
  configuration: "",
  possession: "",
  furnishing: "",
  verification: "",
  budget: "",
};

export function filterInventory(properties: CrmProperty[], filters: InventoryFilters) {
  const q = filters.query.trim().toLowerCase();
  return properties.filter((prop) => {
    const inv = propertyInventory(prop);
    if (filters.city && (inv?.city || "") !== filters.city) return false;
    if (filters.propertyType && (inv?.property_type || "") !== filters.propertyType) return false;
    if (filters.configuration && (inv?.configuration || "") !== filters.configuration) return false;
    if (filters.possession && (inv?.possession_status || "") !== filters.possession) return false;
    if (filters.furnishing && (inv?.furnishing_status || "") !== filters.furnishing) return false;
    if (filters.verification && (inv?.verification_status || prop.verification_badge) !== filters.verification) {
      return false;
    }
    if (filters.budget && prop.budget_bracket !== filters.budget) return false;
    if (!q) return true;
    const hay = [
      prop.title,
      prop.locality,
      prop.price_label,
      propertySummary(prop),
      inv?.project_name,
      inv?.developer_name,
      inv?.configuration,
      inv?.city,
      inv?.locality_area,
      inv?.rera_number,
      inv?.amenities,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

/** Suggest inventory only — score by city/locality + budget + pillar. */
export function suggestInventoryForLead(properties: CrmProperty[], lead: CrmLead | null, limit = 8) {
  if (!properties.length) return [];
  if (!lead) return properties.slice(0, limit);

  const cityNeedle = (lead.city || "").toLowerCase();
  const scored = properties
    .map((prop) => {
      const inv = propertyInventory(prop);
      let score = 0;
      if (prop.budget_bracket === lead.budget) score += 4;
      if (prop.pillar === lead.pillar) score += 3;
      if (prop.intent === lead.intent) score += 1;
      const locality = `${prop.locality} ${inv?.city || ""} ${inv?.locality_area || ""}`.toLowerCase();
      if (cityNeedle && locality.includes(cityNeedle)) score += 5;
      else if (cityNeedle) {
        const tokens = cityNeedle.split(/[\s,/-]+/).filter((t) => t.length > 2);
        if (tokens.some((t) => locality.includes(t))) score += 3;
      }
      return { prop, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.prop.title.localeCompare(b.prop.title));

  // Always stay within inventory; if no soft matches, show top inventory by price fit only.
  if (scored.length === 0) {
    return properties
      .slice()
      .sort((a, b) => Number(a.budget_bracket === lead.budget) * -1 || a.title.localeCompare(b.title))
      .slice(0, limit);
  }
  return scored.slice(0, limit).map((row) => row.prop);
}

export const INVENTORY_DETAIL_FIELDS: Array<{ key: keyof InventoryDetails; label: string; money?: boolean }> = [
  { key: "project_name", label: "Project" },
  { key: "property_type", label: "Property type" },
  { key: "city", label: "City" },
  { key: "locality_area", label: "Locality" },
  { key: "developer_name", label: "Developer" },
  { key: "rera_number", label: "RERA" },
  { key: "configuration", label: "Configuration" },
  { key: "unit_details", label: "Unit / tower / floor" },
  { key: "super_area_sqft", label: "Super area (sq.ft)" },
  { key: "builtup_area_sqft", label: "Built-up area (sq.ft)" },
  { key: "carpet_area_sqft", label: "Carpet area (sq.ft)" },
  { key: "bathrooms", label: "Bathrooms" },
  { key: "availability_status", label: "Availability" },
  { key: "possession_status", label: "Possession" },
  { key: "expected_possession_date", label: "Expected possession" },
  { key: "quoted_price", label: "Quoted price", money: true },
  { key: "price_per_sqft", label: "Price / sq.ft", money: true },
  { key: "plc_notes", label: "PLC" },
  { key: "ifms_amount", label: "IFMS", money: true },
  { key: "club_charges", label: "Club charges", money: true },
  { key: "other_charges", label: "Other charges", money: true },
  { key: "charges_included", label: "Charges included" },
  { key: "parking_included", label: "Parking" },
  { key: "additional_parking_cost", label: "Extra parking cost", money: true },
  { key: "furnishing_status", label: "Furnishing" },
  { key: "appliances_included", label: "Appliances" },
  { key: "power_backup", label: "Power backup" },
  { key: "gas_pipeline", label: "Gas pipeline" },
  { key: "amenities", label: "Amenities" },
  { key: "verification_status", label: "Verification" },
  { key: "price_verified_date", label: "Price verified" },
  { key: "availability_verified_date", label: "Availability verified" },
  { key: "source_links", label: "Sources" },
  { key: "assigned_to_email", label: "Assigned to" },
  { key: "internal_notes", label: "Internal notes" },
  { key: "last_updated", label: "Last updated" },
  { key: "listing_link", label: "Listing / brochure" },
  { key: "price_list_link", label: "Price list" },
];
