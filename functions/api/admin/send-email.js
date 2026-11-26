// POST /api/admin/send-email  { to }  - שליחת מייל ההצטרפות (AMP + HTML + טקסט) לכתובת כלשהי, מדף הניהול.
// משמש לשליחת המייל לבדיקת גוגל (ampforemail.whitelisting@gmail.com) ולבדיקות. מוגן כמו שאר דף הניהול.
import { json, getDb, validEmail } from "../_lib.js";
import { buildJoinMail, sendRaw } from "../_mail.js";
import { adminAuth } from "./_auth.js";

const NO_STORE = { "Cache-Control": "no-store" };

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405, NO_STORE);
  const auth = await adminAuth(request, env);
  if (!auth.configured) return json({ ok: false, error: "not_configured" }, 503, NO_STORE);
  if (!auth.ok) return json({ ok: false, error: "unauthorized" }, 401, NO_STORE);

  let d; try { d = await request.json(); } catch { return json({ ok: false, error: "invalid_json" }, 400, NO_STORE); }
  const to = String(d.to || "").trim().toLowerCase();
  if (!validEmail(to)) return json({ ok: false, error: "invalid_email" }, 400, NO_STORE);

  const db = getDb(env);
  const log = (status, detail) => db.prepare(`INSERT INTO join_requests (created_at, email, status, detail) VALUES (?,?,?,?)`)
    .bind(new Date().toISOString(), to, status, ("[admin " + auth.user + "] " + detail).slice(0, 300)).run().catch(() => {});
  try {
    const res = await sendRaw(env, to, buildJoinMail(to));
    let test = false; try { test = JSON.parse(res).test_mode === true; } catch { /* */ }
    await log(test ? "test" : "sent", res);
    return json({ ok: true, test_mode: test }, 200, NO_STORE);
  } catch (e) {
    await log("error", String(e.message || e));
    return json({ ok: false, error: "send_failed", detail: String(e.message || e).slice(0, 200) }, 502, NO_STORE);
  }
}
