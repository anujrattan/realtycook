import { NextResponse } from "next/server";

const INTENTS = new Set(["buy", "sell", "invest", "rent"]);

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

  // No CRM is connected yet, so enquiries are only logged on the server.
  console.info("[enquiry]", {
    name,
    phone,
    email,
    intent,
    budget: body.budget,
    city: body.city,
    message: body.message,
    receivedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
