import { NextResponse } from "next/server";
import {
  deleteCrmPropertyImage,
  getCrmSnapshot,
  INVENTORY_MAX_IMAGES,
  setCrmPropertyCoverImage,
  uploadCrmPropertyImages,
} from "@/lib/crm-store";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  // JSON actions: delete / set_cover
  if (contentType.includes("application/json")) {
    let payload: Record<string, unknown>;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    const action = String(payload.action ?? "");
    const actorId = String(payload.actorId ?? "");
    const propertyId = String(payload.propertyId ?? "");
    const imageUrl = String(payload.imageUrl ?? "");

    if (!actorId || !propertyId) {
      return NextResponse.json({ error: "actorId and propertyId are required." }, { status: 422 });
    }

    if (action === "delete") {
      const result = await deleteCrmPropertyImage({ actorId, propertyId, imageUrl });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 422 });
      }
      const snapshot = await getCrmSnapshot();
      return NextResponse.json({ ok: true, property: result.property, snapshot });
    }

    if (action === "set_cover") {
      const result = await setCrmPropertyCoverImage({ actorId, propertyId, imageUrl });
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 422 });
      }
      const snapshot = await getCrmSnapshot();
      return NextResponse.json({ ok: true, property: result.property, snapshot });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  // Multipart upload
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }

  const actorId = String(form.get("actorId") ?? "");
  const propertyId = String(form.get("propertyId") ?? "");
  if (!actorId || !propertyId) {
    return NextResponse.json({ error: "actorId and propertyId are required." }, { status: 422 });
  }

  const files: Array<{ name: string; type: string; bytes: ArrayBuffer }> = [];
  for (const value of form.getAll("files")) {
    if (!(value instanceof File)) continue;
    if (!value.size) continue;
    files.push({
      name: value.name || "image.jpg",
      type: value.type || "image/jpeg",
      bytes: await value.arrayBuffer(),
    });
    if (files.length >= INVENTORY_MAX_IMAGES) break;
  }

  if (files.length === 0) {
    return NextResponse.json({ error: "No image files provided." }, { status: 422 });
  }

  const result = await uploadCrmPropertyImages({ actorId, propertyId, files });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  const snapshot = await getCrmSnapshot();
  return NextResponse.json({ ok: true, property: result.property, snapshot });
}
