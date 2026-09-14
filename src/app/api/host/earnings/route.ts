import { NextResponse } from "next/server";
import { getDb } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const db = getDb();
  const row = db.prepare(
    `SELECT
       COALESCE(SUM(CASE WHEN status = 'confirmed' THEN amount END), 0) AS confirmed_total,
       COALESCE(SUM(CASE WHEN status = 'pending' THEN amount END), 0) AS pending_total,
       COUNT(*) AS requests
     FROM bookings WHERE host_user_id = ?`
  ).get(user.id) as any;
  return NextResponse.json({
    earnings: {
      confirmed_total: row.confirmed_total || 0,
      pending_total: row.pending_total || 0,
      requests: row.requests || 0,
    },
  });
}
