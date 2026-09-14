import { NextResponse } from "next/server";
import { getDb, addActivity } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("dest");
  const db = getDb();
  const rows = slug
    ? db.prepare("SELECT * FROM reviews WHERE dest_slug = ? ORDER BY id DESC").all(slug)
    : db.prepare("SELECT * FROM reviews ORDER BY id DESC LIMIT 50").all();
  return NextResponse.json({ reviews: rows });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.dest_slug || !body?.rating || !body?.text) {
    return NextResponse.json({ error: "dest_slug, rating and text are required" }, { status: 400 });
  }
  const db = getDb();
  db.prepare("INSERT INTO reviews (dest_slug,user_id,name,rating,text) VALUES (?,?,?,?,?)").run(
    body.dest_slug, user.id, user.name, Math.min(5, Math.max(1, Number(body.rating))), String(body.text).slice(0, 600)
  );
  const dest = db.prepare("SELECT name FROM destinations WHERE slug = ?").get(body.dest_slug) as any;
  addActivity(user.id, "⭐", `You reviewed ${dest?.name || body.dest_slug}`);
  const reviews = db.prepare("SELECT * FROM reviews WHERE dest_slug = ? ORDER BY id DESC").all(body.dest_slug);
  return NextResponse.json({ reviews }, { status: 201 });
}
