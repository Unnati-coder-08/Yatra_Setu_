import { NextResponse } from "next/server";
import { getDb } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { id } = await ctx.params;
  const db = getDb();
  const listing = db.prepare("SELECT * FROM host_listings WHERE id = ? AND user_id = ?").get(id, user.id);
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  db.prepare("DELETE FROM host_listings WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
