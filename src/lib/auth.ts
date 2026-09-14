import { cookies } from "next/headers";
import { getDb, hashPassword, userFromToken } from "./db.mjs";

export const SESSION_COOKIE = "yatra_session";

export function createSession(userId: number): string {
  const token = crypto.randomUUID() + crypto.randomUUID().slice(0, 8);
  getDb().prepare("INSERT INTO sessions (token, user_id) VALUES (?, ?)").run(token, userId);
  return token;
}

export function destroySession(token: string) {
  getDb().prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export async function getCurrentUser() {
  const store = await cookies();
  return userFromToken(store.get(SESSION_COOKIE)?.value);
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function verifyPassword(password: string, hash: string, salt: string) {
  return hashPassword(password, salt) === hash;
}
