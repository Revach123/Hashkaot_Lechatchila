// POST /api/register-amp - קבלת הטופס מתוך המייל הדינמי (AMP for Email, amp-form).
// Gmail שולח את הטופס כ-FormData, עם הכותרת AMP-Email-Sender (כתובת השולח של המייל).
// חובה להחזיר AMP-Email-Allow-Sender, אחרת Gmail לא יציג את התשובה.
import { json, normalize, saveRegistration, FIELD_NAMES } from "./_lib.js";
import { FROM_ADDRESS } from "./_mail.js";

function ampHeaders(request) {
  const sender = (request.headers.get("AMP-Email-Sender") || "").toLowerCase();
  if (sender) return sender === FROM_ADDRESS ? { "AMP-Email-Allow-Sender": FROM_ADDRESS } : null;
  // גרסה ישנה של הפרוטוקול (CORS עם __amp_source_origin)
  const origin = request.headers.get("Origin") || "";
  const source = new URL(request.url).searchParams.get("__amp_source_origin") || "";
  if (source.toLowerCase() !== FROM_ADDRESS) return null;
  return {
    "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true",
    "AMP-Access-Control-Allow-Source-Origin": source,
    "Access-Control-Expose-Headers": "AMP-Access-Control-Allow-Source-Origin",
  };
}

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return json({ ok: false, message: "method_not_allowed" }, 405);
  const h = ampHeaders(request);
  if (!h) return json({ ok: false, message: "שולח לא מורשה" }, 403);

  let d = {};
  try { for (const [k, v] of (await request.formData()).entries()) d[k] = String(v); }
  catch { return json({ ok: false, message: "הטופס לא התקבל, נא לנסות שוב." }, 400, h); }

  const { r, bad } = normalize(d);
  if (bad.length) {
    const list = bad.map((b) => FIELD_NAMES[b] || b).join(", ");
    return json({ ok: false, message: "נא לתקן: " + list }, 400, h);
  }
  try { await saveRegistration(env, r, "email"); }
  catch { return json({ ok: false, message: "אירעה תקלה בשמירה. אפשר להירשם באתר lehathila.com או בטלפון 03-306-5323." }, 500, h); }
  return json({ ok: true, first_name: r.first_name }, 200, h);
}
