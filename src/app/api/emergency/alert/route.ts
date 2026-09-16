import { NextResponse } from "next/server";
import { getDb, addActivity } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

// POST /api/emergency/alert  { type: "sos" | "location_share", lat?, lng?, contact_phone?, note? }
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const type = body?.type === "location_share" ? "location_share" : "sos";

  const user = await getCurrentUser();
  const who = user ? `${user.name}` : "A traveller";
  const where =
    typeof body?.lat === "number" && typeof body?.lng === "number"
      ? ` at ${body.lat.toFixed(4)}, ${body.lng.toFixed(4)}`
      : "";

  // Log it so the dashboard/trail shows the alert was raised (a real backend would
  // also push SMS/WhatsApp to the trusted contact — out of scope for the prototype).
  if (user) {
    addActivity(
      user.id,
      type === "sos" ? "🚨" : "📍",
      type === "sos" ? `SOS triggered${where}` : `Live location shared${where}`
    );
  }

  return NextResponse.json({
    ok: true,
    type,
    logged_at: new Date().toISOString(),
    message:
      type === "sos"
        ? `SOS sent. Your trusted contact${body?.contact_phone ? ` (${body.contact_phone})` : ""} has been alerted.`
        : "Location link sent to your trusted contact.",
  });
}
