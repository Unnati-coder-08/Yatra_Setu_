import { NextResponse } from "next/server";
import { getDb } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

// GET /api/guides/verify — current user's verification status
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const row = getDb().prepare("SELECT verification_status FROM users WHERE id = ?").get(user.id) as any;
  return NextResponse.json({ status: row?.verification_status || "none" });
}

// POST /api/guides/verify — submit an ID document for an existing account
// (used when a traveller account upgrades to a verified guide)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.id_doc_type || !body?.id_doc || typeof body.id_doc !== "string" || body.id_doc.length < 50) {
    return NextResponse.json({ error: "Choose an ID type and attach a readable photo" }, { status: 400 });
  }
  getDb().prepare("UPDATE users SET verification_status = 'verified', id_doc = ? WHERE id = ?").run(
    JSON.stringify({ type: body.id_doc_type, doc: body.id_doc.slice(0, 500_000), submitted_at: new Date().toISOString() }),
    user.id
  );
  return NextResponse.json({ ok: true, status: "verified" });
}
