// /api/admin/data - נתוני דף הניהול (admin.html). מוגן בסיסמה: הסוד ADMIN_KEY ב-Cloudflare Pages.
//   GET                - כל הרישומים (מהחדש לישן)
//   GET ?log=1         - יומן בקשות ההצטרפות במייל (500 אחרונות)
//   DELETE ?id=123     - מחיקת רישום
// הסיסמה נשלחת בכותרת Authorization: Bearer <ADMIN_KEY>.
import { json, getDb } from "../_lib.js";

const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

async function sameSecret(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < u.length; i++) diff |= u[i] ^ v[i];
  return diff === 0;
}

export async function onRequest({ request, env }) {
  const key = env.ADMIN_KEY;
  if (!key || key.length < 10) return json({ ok: false, error: "ADMIN_KEY לא הוגדר ב-Cloudflare" }, 503, NO_STORE);
  const given = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!given || !(await sameSecret(given, key))) {
    await new Promise((r) => setTimeout(r, 800));                 // האטה לניסיונות ניחוש
    return json({ ok: false, error: "unauthorized" }, 401, NO_STORE);
  }

  const db = getDb(env);
  const url = new URL(request.url);
  try {
    if (request.method === "GET" && url.searchParams.get("log") === "1") {
      const { results } = await db.prepare(`SELECT id, created_at, email, status, detail FROM join_requests ORDER BY id DESC LIMIT 500`).all();
      return json({ ok: true, log: results }, 200, NO_STORE);
    }
    if (request.method === "GET") {
      const { results } = await db.prepare(`SELECT * FROM registrations ORDER BY id DESC`).all();
      return json({ ok: true, rows: results }, 200, NO_STORE);
    }
    if (request.method === "DELETE") {
      const id = Number(url.searchParams.get("id"));
      if (!Number.isInteger(id) || id <= 0) return json({ ok: false, error: "bad_id" }, 400, NO_STORE);
      const r = await db.prepare(`DELETE FROM registrations WHERE id = ?`).bind(id).run();
      return json({ ok: true, deleted: r.meta ? r.meta.changes : 0 }, 200, NO_STORE);
    }
  } catch (e) {
    return json({ ok: false, error: "db_error", detail: String(e.message || e).slice(0, 200) }, 500, NO_STORE);
  }
  return json({ ok: false, error: "method_not_allowed" }, 405, NO_STORE);
}
