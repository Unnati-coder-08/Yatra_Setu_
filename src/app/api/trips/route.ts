import { NextResponse } from "next/server";
import { getDb } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const db = getDb();
  const trips = db.prepare("SELECT * FROM trips WHERE user_id = ? ORDER BY start_date").all(user.id) as any[];
  const items = db.prepare(
    `SELECT ti.* FROM trip_items ti JOIN trips t ON t.id = ti.trip_id WHERE t.user_id = ? ORDER BY ti.trip_id, ti.day, ti.time`
  ).all(user.id);
  const byTrip: Record<number, any[]> = {};
  for (const it of items) (byTrip[it.trip_id] ||= []).push(it);
  return NextResponse.json({
    trips: trips.map((t) => ({ ...t, interests: JSON.parse(t.interests || "[]"), items: byTrip[t.id] || [] })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.name) return NextResponse.json({ error: "Trip name is required" }, { status: 400 });
  const db = getDb();
  const info = db.prepare(
    "INSERT INTO trips (user_id,name,start_date,end_date,interests,budget,pace,status) VALUES (?,?,?,?,?,?,?,'upcoming')"
  ).run(
    user.id,
    String(body.name).slice(0, 80),
    body.start_date || "",
    body.end_date || "",
    JSON.stringify(body.interests || []),
    Number(body.budget) || 20000,
    body.pace === "packed" ? "packed" : "relaxed"
  );
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(info.lastInsertRowid);
  return NextResponse.json({ trip: { ...trip, interests: JSON.parse((trip as any).interests || "[]"), items: [] } }, { status: 201 });
}
