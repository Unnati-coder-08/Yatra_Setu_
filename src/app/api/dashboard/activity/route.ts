import { NextResponse } from "next/server";
import { getDb } from "@/lib/db.mjs";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ activity: [] });
  const rows = getDb()
    .prepare("SELECT id, icon, text, created_at FROM activity WHERE user_id = ? ORDER BY id DESC LIMIT 20")
    .all(user.id);
  return NextResponse.json({ activity: rows });
}
