import { NextResponse } from "next/server";
import { getDb } from "@/lib/db.mjs";
import { createSession, setSessionCookie, verifyPassword } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }
  const db = getDb();
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(body.email.toLowerCase().trim()) as any;
  if (!user || !verifyPassword(body.password, user.password_hash, user.salt)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const token = createSession(user.id);
  await setSessionCookie(token);
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, city: user.city, phone: user.phone, avatar: user.avatar },
  });
}
