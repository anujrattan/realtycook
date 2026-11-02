import { NextResponse } from "next/server";
import { createOrMergeLead, type LeadIntent } from "@/lib/crm-store";

const INTENTS = new Set(["buy", "sell", "invest", "lease"]);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const phone = String(body.phone ?? "").replace(/[^\d+]/g, "");
  const email = String(body.email ?? "").trim();
  const intent = String(body.intent ?? "");
  const errors: Record<string, string> = {};

  if (name.length < 2) errors.name = "Please tell us your name.";
  if (phone.replace(/\D/g, "").length < 10) errors.phone = "Enter a valid phone number with at least 10 digits.";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "That email doesn't look right.";
  if (!INTENTS.has(intent)) errors.intent = "Choose what you'd like to do.";

  if (Object.keys(errors).length) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const lead = await createOrMergeLead({
    name,
    phone,
    email,
    city: String(body.city ?? "").trim(),
    intent: intent as LeadIntent,
    budget: String(body.budget ?? "unsure"),
    message: String(body.message ?? "").trim(),
    source: "Website Form",
  });

  return NextResponse.json({ ok: true, leadId: lead.id });
}
