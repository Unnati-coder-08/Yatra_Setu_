import { NextResponse } from "next/server";
import { getDb, addActivity } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { id } = await ctx.params;
  const db = getDb();
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ? AND host_user_id = ?").get(id, user.id) as any;
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (!["confirmed", "declined"].includes(status)) {
    return NextResponse.json({ error: "status must be confirmed or declined" }, { status: 400 });
  }
  db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, id);
  addActivity(booking.user_id, status === "confirmed" ? "✅" : "❌", `Your booking "${booking.title}" was ${status}`);
  return NextResponse.json({ booking: db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) });
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { id } = await ctx.params;
  const db = getDb();
  const booking = db.prepare("SELECT * FROM bookings WHERE id = ? AND (user_id = ? OR host_user_id = ?)").get(id, user.id, user.id);
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  db.prepare("DELETE FROM bookings WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
