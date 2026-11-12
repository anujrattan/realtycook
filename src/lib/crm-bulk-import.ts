import * as XLSX from "xlsx";
import {
  normalizeBudget,
  normalizeIntent,
  normalizePillar,
} from "@/components/crm/crm-shared";
import type { LeadIntent, ServicePillar } from "@/lib/crm-store";

export type BulkLeadRow = {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  intent?: LeadIntent;
  pillar?: ServicePillar;
  budget?: string;
  notes_summary?: string;
};

const NAME_KEYS = [
  "name",
  "client name",
  "client",
  "full name",
  "lead name",
  "customer",
  "customer name",
  "applicant",
  "contact name",
  "prospect",
];

const PHONE_KEYS = [
  "phone",
  "phone number",
  "mobile",
  "mobile number",
  "whatsapp",
  "contact",
  "contact number",
  "tel",
  "telephone",
  "cell",
];

const EMAIL_KEYS = ["email", "mail", "e-mail", "email id", "email address"];
const CITY_KEYS = ["city", "sector", "locality", "location", "area", "address"];
const INTENT_KEYS = ["intent", "requirement", "looking for", "type"];
const PILLAR_KEYS = ["pillar", "service", "category", "segment"];
const BUDGET_KEYS = ["budget", "budget bracket", "price range"];
const NOTES_KEYS = ["notes", "message", "remarks", "requirement details", "comment", "comments"];

const KNOWN_KEY_SET = new Set(
  [...NAME_KEYS, ...PHONE_KEYS, ...EMAIL_KEYS, ...CITY_KEYS, ...INTENT_KEYS, ...PILLAR_KEYS, ...BUDGET_KEYS, ...NOTES_KEYS].map(
    (k) => k.toLowerCase(),
  ),
);

const PHONE_IN_TEXT_RE = /(?:\+?91[\s-]*)?[6-9]\d{9}|\b\d{10,12}\b/;

function normHeader(value: string) {
  return value.trim().toLowerCase().replace(/[_./]+/g, " ").replace(/\s+/g, " ");
}

function pickFromRow(row: Record<string, unknown>, keys: string[]) {
  const entries = Object.entries(row);
  for (const key of keys) {
    const found = entries.find(([rk]) => normHeader(rk) === key);
    if (found && String(found[1] ?? "").trim()) return String(found[1]).trim();
  }
  // Fuzzy fallback: header contains key token
  for (const key of keys) {
    const found = entries.find(([rk]) => {
      const h = normHeader(rk);
      if (key === "name" && (h.includes("filename") || h.includes("file name"))) return false;
      return h === key || h.endsWith(` ${key}`) || h.startsWith(`${key} `) || h.includes(` ${key} `);
    });
    if (found && String(found[1] ?? "").trim()) return String(found[1]).trim();
  }
  return "";
}

function collectExtraNotes(row: Record<string, unknown>) {
  const extras: string[] = [];
  for (const [key, value] of Object.entries(row)) {
    const header = normHeader(key);
    if (!header || KNOWN_KEY_SET.has(header)) continue;
    const text = String(value ?? "").trim();
    if (!text) continue;
    extras.push(`${key.trim()}: ${text}`);
  }
  return extras.join("\n");
}

function cleanPhoneDigits(raw: string) {
  return raw.replace(/\D/g, "");
}

function isValidLeadNamePhone(name: string, phone: string) {
  return name.trim().length >= 2 && cleanPhoneDigits(phone).length >= 10;
}

export function mapSheetRowsToLeads(rows: Record<string, unknown>[]): BulkLeadRow[] {
  const out: BulkLeadRow[] = [];
  for (const row of rows) {
    const name = pickFromRow(row, NAME_KEYS);
    const phone = pickFromRow(row, PHONE_KEYS);
    if (!isValidLeadNamePhone(name, phone)) continue;

    const notesParts = [
      pickFromRow(row, NOTES_KEYS),
      collectExtraNotes(row),
    ].filter(Boolean);

    out.push({
      name: name.trim(),
      phone: cleanPhoneDigits(phone),
      email: pickFromRow(row, EMAIL_KEYS) || undefined,
      city: pickFromRow(row, CITY_KEYS) || undefined,
      intent: normalizeIntent(pickFromRow(row, INTENT_KEYS) || "buy"),
      pillar: normalizePillar(pickFromRow(row, PILLAR_KEYS) || "homes"),
      budget: normalizeBudget(pickFromRow(row, BUDGET_KEYS) || "unsure"),
      notes_summary: notesParts.join("\n") || "Imported via bulk upload",
    });
  }
  return out;
}

function parseDelimitedTextToRows(text: string): Record<string, unknown>[] {
  const trimmed = text.replace(/^\uFEFF/, "").trim();
  if (!trimmed) return [];
  try {
    const wb = XLSX.read(trimmed, { type: "string" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  } catch {
    return [];
  }
}

function parsePdfLinesToLeads(text: string): BulkLeadRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // Try header-based table first (Name ... Phone ...)
  const headerIdx = lines.findIndex((line) => {
    const lower = line.toLowerCase();
    return (
      (lower.includes("name") || lower.includes("client") || lower.includes("customer")) &&
      (lower.includes("phone") || lower.includes("mobile") || lower.includes("whatsapp") || lower.includes("contact"))
    );
  });

  if (headerIdx >= 0) {
    const header = lines[headerIdx];
    const delimiter = header.includes("\t") ? "\t" : header.includes(",") ? "," : /\s{2,}|\s\|\s/;
    const headers = typeof delimiter === "string" ? header.split(delimiter) : header.split(delimiter);
    const mapped: Record<string, unknown>[] = [];
    for (const line of lines.slice(headerIdx + 1)) {
      const cells = typeof delimiter === "string" ? line.split(delimiter) : line.split(delimiter);
      if (cells.length < 2) continue;
      const row: Record<string, unknown> = {};
      headers.forEach((h, i) => {
        row[h.trim() || `col_${i}`] = (cells[i] ?? "").trim();
      });
      mapped.push(row);
    }
    const fromHeader = mapSheetRowsToLeads(mapped);
    if (fromHeader.length) return fromHeader;
  }

  // Fallback: any line with a phone — text before phone is the name
  const out: BulkLeadRow[] = [];
  for (const line of lines) {
    const match = line.match(PHONE_IN_TEXT_RE);
    if (!match || match.index == null) continue;
    const phone = cleanPhoneDigits(match[0]);
    if (phone.length < 10) continue;
    let name = line.slice(0, match.index).replace(/[,|•\-–]+/g, " ").trim();
    name = name.replace(/^(name|client|customer|lead)\s*[:#-]?\s*/i, "").trim();
    if (name.length < 2) {
      // Maybe "Phone Name" order — take text after phone
      name = line.slice(match.index + match[0].length).replace(/[,|•\-–]+/g, " ").trim();
    }
    if (!isValidLeadNamePhone(name, phone)) continue;
    if (out.some((r) => r.phone.endsWith(phone.slice(-10)))) continue;
    out.push({
      name,
      phone,
      budget: "unsure",
      intent: "buy",
      pillar: "homes",
      notes_summary: `Imported from PDF line: ${line}`,
    });
  }
  return out;
}

async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Browser worker (bulk parse runs client-side)
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(data) });
  const pdf = await loadingTask.promise;
  const chunks: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    // Group by approximate Y so table rows stay together
    type Item = { str: string; x: number; y: number };
    const items: Item[] = [];
    for (const raw of content.items) {
      if (!("str" in raw) || !raw.str) continue;
      const transform = "transform" in raw ? (raw.transform as number[]) : [1, 0, 0, 1, 0, 0];
      items.push({ str: String(raw.str), x: transform[4] ?? 0, y: Math.round((transform[5] ?? 0) * 10) / 10 });
    }
    items.sort((a, b) => b.y - a.y || a.x - b.x);
    let currentY: number | null = null;
    let line = "";
    for (const item of items) {
      if (currentY == null || Math.abs(item.y - currentY) > 2) {
        if (line.trim()) chunks.push(line.trim());
        currentY = item.y;
        line = item.str;
      } else {
        line += (line.endsWith(" ") || item.str.startsWith(" ") ? "" : " ") + item.str;
      }
    }
    if (line.trim()) chunks.push(line.trim());
    chunks.push("");
  }

  return chunks.join("\n");
}

export async function parseBulkLeadFile(file: File): Promise<BulkLeadRow[]> {
  const name = file.name.toLowerCase();
  const buffer = await file.arrayBuffer();

  if (name.endsWith(".pdf") || file.type === "application/pdf") {
    const text = await extractPdfText(buffer);
    // Prefer CSV/TSV embedded in PDF text if present
    const delimited = parseDelimitedTextToRows(text);
    const fromDelimited = mapSheetRowsToLeads(delimited);
    if (fromDelimited.length) return fromDelimited;
    return parsePdfLinesToLeads(text);
  }

  if (name.endsWith(".csv") || file.type === "text/csv" || file.type === "application/vnd.ms-excel") {
    // Try binary first (xlsx/xls), then string CSV
    try {
      const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const mapped = mapSheetRowsToLeads(json);
      if (mapped.length) return mapped;
    } catch {
      // fall through to text parse
    }
    const text = new TextDecoder().decode(buffer);
    return mapSheetRowsToLeads(parseDelimitedTextToRows(text));
  }

  // .xlsx / .xls / unknown spreadsheet
  const wb = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  return mapSheetRowsToLeads(json);
}
