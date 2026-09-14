import { NextResponse } from "next/server";
import { getDb, addActivity } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const db = getDb();
  const mine = db.prepare("SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC").all(user.id);
  const hosting = db.prepare("SELECT * FROM bookings WHERE host_user_id = ? ORDER BY created_at DESC").all(user.id);
  return NextResponse.json({ bookings: mine, hosting });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body?.kind || !body?.ref_id || !body?.title) {
    return NextResponse.json({ error: "kind, ref_id and title are required" }, { status: 400 });
  }
  const db = getDb();
  const info = db.prepare(
    "INSERT INTO bookings (user_id,kind,ref_id,title,dest_slug,host_user_id,date,guests,amount,status,note) VALUES (?,?,?,?,?,?,?,?,?,'pending',?)"
  ).run(
    user.id,
    body.kind,
    Number(body.ref_id),
    String(body.title).slice(0, 120),
    body.dest_slug || null,
    body.host_user_id || null,
    body.date || "",
    Number(body.guests) || 2,
    Number(body.amount) || 0,
    String(body.note || "").slice(0, 300)
  );
  addActivity(user.id, "🧾", `Booking requested: ${body.title}`);
  return NextResponse.json({ booking: db.prepare("SELECT * FROM bookings WHERE id = ?").get(info.lastInsertRowid) }, { status: 201 });
}
