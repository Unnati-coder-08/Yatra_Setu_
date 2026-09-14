import { NextResponse } from "next/server";
import { getDb } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

async function ownedItem(userId: number, id: string) {
  return getDb().prepare(
    "SELECT ti.* FROM trip_items ti JOIN trips t ON t.id = ti.trip_id WHERE ti.id = ? AND t.user_id = ?"
  ).get(id, userId);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { id } = await ctx.params;
  const item = await ownedItem(user.id, id);
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const fields: string[] = [];
  const vals: any[] = [];
  for (const key of ["day", "time", "title", "kind", "cost"]) {
    if (key in body) {
      fields.push(`${key} = ?`);
      vals.push(key === "day" || key === "cost" ? Number(body[key]) || 0 : body[key]);
    }
  }
  if ("done" in body) {
    fields.push("done = ?");
    vals.push(body.done ? 1 : 0);
  }
  if (!fields.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  vals.push(id);
  getDb().prepare(`UPDATE trip_items SET ${fields.join(", ")} WHERE id = ?`).run(...vals);
  return NextResponse.json({ item: getDb().prepare("SELECT * FROM trip_items WHERE id = ?").get(id) });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { id } = await ctx.params;
  const item = await ownedItem(user.id, id);
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  getDb().prepare("DELETE FROM trip_items WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
