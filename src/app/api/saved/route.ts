import { NextResponse } from "next/server";
import { getDb, addActivity } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ saved: [] });
  const rows = getDb().prepare(
    `SELECT d.* FROM saved_places s JOIN destinations d ON d.slug = s.dest_slug
     WHERE s.user_id = ? ORDER BY s.created_at DESC`
  ).all(user.id) as any[];
  return NextResponse.json({
    saved: rows.map((d) => ({ ...d, categories: JSON.parse(d.categories), images: JSON.parse(d.images) })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.dest_slug) return NextResponse.json({ error: "dest_slug required" }, { status: 400 });
  const db = getDb();
  const existing = db.prepare("SELECT 1 FROM saved_places WHERE user_id = ? AND dest_slug = ?").get(user.id, body.dest_slug);
  if (existing) {
    db.prepare("DELETE FROM saved_places WHERE user_id = ? AND dest_slug = ?").run(user.id, body.dest_slug);
    return NextResponse.json({ saved: false });
  }
  db.prepare("INSERT INTO saved_places (user_id, dest_slug) VALUES (?, ?)").run(user.id, body.dest_slug);
  const dest = db.prepare("SELECT name FROM destinations WHERE slug = ?").get(body.dest_slug) as any;
  addActivity(user.id, "❤️", `You added ${dest?.name || body.dest_slug} to your wishlist`);
  return NextResponse.json({ saved: true });
}
