// POST /api/register - שמירת רישום מקדים מטופס דף הנחיתה ב-D1.
// Binding נדרש בפרויקט ה-Pages: Lechatchila (מסד D1 lehathila_db; גם DB נתמך). הטבלה: ראה schema.sql.
import { json, normalize, saveRegistration } from "./_lib.js";

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: "invalid_json" }, 400); }
  if (d.website) return json({ ok: true });                      // מלכודת לרובוטים: מתעלמים בשקט

  // בטופס באתר הכמויות נשלחות כ-0 כשהתיבה לא סומנה
  d.child_savings = Number(d.child_count) > 0;
  d.hishtalmut = Number(d.hishtalmut_count) > 0;
  d.gemel = Number(d.gemel_count) > 0;
  d.consent = d.consent === true;

  const { r, bad } = normalize(d);
  if (bad.length) return json({ ok: false, error: "invalid", fields: bad }, 400);
  try { await saveRegistration(env, r, "web"); }
  catch { return json({ ok: false, error: "db_error" }, 500); }
  return json({ ok: true });
}
