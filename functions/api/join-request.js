// POST /api/join-request - נקרא ע"י ה-Email Worker (email-worker/worker.js) כשמגיע מייל עם "הצטרפות".
// שולח לפונה את מייל ההצטרפות (טופס דינמי + HTML + טקסט) מ-info@lehathila.com דרך CloudMailin.
// אימות: כותרת X-Join-Secret = הסוד JOIN_SECRET (מוגדר גם ב-Pages וגם ב-Worker).
// הגבלה: מייל אחד לכתובת בכל 10 דקות, ועד 3 ביממה (טבלת join_requests; שליחות במצב בדיקה לא נספרות).
// בדיקה בלי שליחה: ?dry=1 מחזיר את המייל הגולמי.
import { json, getDb, validEmail } from "./_lib.js";
import { buildJoinMail, sendRaw, FROM_ADDRESS } from "./_mail.js";

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  const secret = env.JOIN_SECRET;
  if (!secret || request.headers.get("X-Join-Secret") !== secret) return json({ ok: false, error: "unauthorized" }, 401);

  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: "invalid_json" }, 400); }
  const to = String(d.email || "").trim().toLowerCase();
  if (!validEmail(to) || to.endsWith("@lehathila.com")) return json({ ok: false, error: "invalid_email" }, 400);

  const raw = buildJoinMail(to);
  if (new URL(request.url).searchParams.get("dry") === "1") return new Response(raw, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

  const db = getDb(env);
  const now = Date.now();
  const row = await db.prepare(
    `SELECT COUNT(*) AS day, SUM(CASE WHEN created_at > ? THEN 1 ELSE 0 END) AS recent
       FROM join_requests WHERE email = ? AND created_at > ? AND status = 'sent'`
  ).bind(new Date(now - 10 * 60e3).toISOString(), to, new Date(now - 24 * 3600e3).toISOString()).first();
  if (row && (row.recent > 0 || row.day >= 3)) {
    await log(db, to, "limited", "");
    return json({ ok: true, skipped: "rate_limited" });
  }

  try {
    const res = await sendRaw(env, to, raw);
    // במצב בדיקה (Test mode) CloudMailin לא שולח באמת - נרשם כ-test ולא נספר בהגבלת השליחות
    let test = false; try { test = JSON.parse(res).test_mode === true; } catch { /* תשובה לא צפויה */ }
    await log(db, to, test ? "test" : "sent", res.slice(0, 300));
    return json({ ok: true, from: FROM_ADDRESS, test_mode: test });
  } catch (e) {
    await log(db, to, "error", String(e.message || e).slice(0, 300));
    return json({ ok: false, error: "send_failed" }, 502);
  }
}

async function log(db, email, status, detail) {
  try {
    await db.prepare(`INSERT INTO join_requests (created_at, email, status, detail) VALUES (?,?,?,?)`)
      .bind(new Date().toISOString(), email, status, detail).run();
  } catch { /* הרישום ביומן לא יעצור את השליחה */ }
}
