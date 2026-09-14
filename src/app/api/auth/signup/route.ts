import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDb, hashPassword } from "@/lib/db.mjs";
import { createSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.password) {
    return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
  }
  const db = getDb();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(body.email.toLowerCase().trim());
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }
  const salt = crypto.randomBytes(8).toString("hex");
  const role = body.role === "host" ? "host" : "traveler";
  const info = db.prepare(
    "INSERT INTO users (name,email,phone,city,password_hash,salt,role) VALUES (?,?,?,?,?,?,?)"
  ).run(
    String(body.name).trim(),
    body.email.toLowerCase().trim(),
    body.phone || "",
    body.city || "",
    hashPassword(body.password, salt),
    salt,
    role
  );
  const token = createSession(Number(info.lastInsertRowid));
  await setSessionCookie(token);
  const user = db.prepare("SELECT id,name,email,role,city,phone,avatar FROM users WHERE id = ?").get(info.lastInsertRowid);
  return NextResponse.json({ user });
}
