import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getDb, hashPassword, addActivity } from "@/lib/db.mjs";
import { createSession, setSessionCookie } from "@/lib/auth";

// POST /api/auth/guide-signup
// Guide registration with identity verification: creates the account (role=host),
// stores the ID document (data-URL or reference) and marks the profile as
// verified so the "Verified Guide ✓" badge appears. In production this is where
// a KYC provider / manual review step would sit; the prototype approves instantly.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.email || !body?.password || !body?.id_doc) {
    return NextResponse.json({ error: "Name, email, password and an ID document are required" }, { status: 400 });
  }
  if (!body.id_doc_type || !["aadhaar", "pan", "driving_license", "voter_id", "passport"].includes(body.id_doc_type)) {
    return NextResponse.json({ error: "Choose a valid ID document type" }, { status: 400 });
  }
  if (typeof body.id_doc !== "string" || body.id_doc.length < 50) {
    return NextResponse.json({ error: "Please attach a readable photo of your ID" }, { status: 400 });
  }
  const db = getDb();
  const email = String(body.email).toLowerCase().trim();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }
  const salt = crypto.randomBytes(8).toString("hex");
  const info = db.prepare(
    "INSERT INTO users (name,email,phone,city,password_hash,salt,role,avatar,verification_status,id_doc) VALUES (?,?,?,?,?,?,?,?,?,?)"
  ).run(
    String(body.name).trim(),
    email,
    body.phone || "",
    body.city || "",
    hashPassword(body.password, salt),
    salt,
    "host",
    "",
    "verified",
    JSON.stringify({ type: body.id_doc_type, doc: body.id_doc.slice(0, 500_000), submitted_at: new Date().toISOString() })
  );
  const userId = Number(info.lastInsertRowid);
  addActivity(userId, "🛡️", "Guide account verified via ID document");
  const token = createSession(userId);
  await setSessionCookie(token);
  const user = db.prepare("SELECT id,name,email,role,city,phone,avatar,verification_status FROM users WHERE id = ?").get(userId);
  return NextResponse.json({ user }, { status: 201 });
}
