import { NextResponse } from "next/server";
import { getDb } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { id } = await ctx.params;
  const db = getDb();
  const trip = db.prepare("SELECT * FROM trips WHERE id = ? AND user_id = ?").get(id, user.id) as any;
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  const items = db.prepare("SELECT * FROM trip_items WHERE trip_id = ? ORDER BY day, time").all(id);
  return NextResponse.json({ trip: { ...trip, interests: JSON.parse(trip.interests || "[]"), items } });
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { id } = await ctx.params;
  const db = getDb();
  const trip = db.prepare("SELECT id FROM trips WHERE id = ? AND user_id = ?").get(id, user.id);
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const fields: string[] = [];
  const vals: any[] = [];
  for (const key of ["name", "start_date", "end_date", "budget", "pace", "status"]) {
    if (key in body) {
      fields.push(`${key} = ?`);
      vals.push(key === "budget" ? Number(body[key]) || 20000 : body[key]);
    }
  }
  if (body.interests) {
    fields.push("interests = ?");
    vals.push(JSON.stringify(body.interests));
  }
  if (!fields.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  vals.push(id);
  db.prepare(`UPDATE trips SET ${fields.join(", ")} WHERE id = ?`).run(...vals);
  const updated = db.prepare("SELECT * FROM trips WHERE id = ?").get(id);
  return NextResponse.json({ trip: { ...updated, interests: JSON.parse((updated as any).interests || "[]") } });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { id } = await ctx.params;
  const db = getDb();
  const trip = db.prepare("SELECT id FROM trips WHERE id = ? AND user_id = ?").get(id, user.id);
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  db.prepare("DELETE FROM trip_items WHERE trip_id = ?").run(id);
  db.prepare("DELETE FROM trips WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
