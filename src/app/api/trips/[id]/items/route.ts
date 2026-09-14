import { NextResponse } from "next/server";
import { getDb } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { id } = await ctx.params;
  const db = getDb();
  const trip = db.prepare("SELECT id FROM trips WHERE id = ? AND user_id = ?").get(id, user.id);
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  // Accept either a single item ({title,...}) or a bulk payload ({items:[...]})
  const rawItems: any[] = Array.isArray(body.items) ? body.items : [body];
  const items = rawItems.filter((it) => it && typeof it.title === "string" && it.title.trim());
  if (!items.length) return NextResponse.json({ error: "Item title is required" }, { status: 400 });

  const ins = db.prepare(
    "INSERT INTO trip_items (trip_id,day,time,title,dest_slug,kind,cost) VALUES (?,?,?,?,?,?,?)"
  );
  let last;
  for (const it of items) {
    last = ins.run(
      id,
      Math.max(1, Number(it.day) || 1),
      it.time || "09:00",
      String(it.title).slice(0, 120),
      it.dest_slug || null,
      it.kind || "activity",
      Number(it.cost) || 0
    );
  }
  const created = db.prepare("SELECT * FROM trip_items WHERE id = ?").get(last.lastInsertRowid);
  return NextResponse.json({ item: created, count: items.length }, { status: 201 });
}
