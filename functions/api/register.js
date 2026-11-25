// lehathila/functions/api/register.js
// POST /api/register - שמירת רישום מקדים מטופס דף הנחיתה ב-D1.
// Binding נדרש בפרויקט ה-Pages: Lechatchila (מסד D1 lehathila_db; גם DB נתמך). הטבלה: ראה schema.sql.

const H = { "Content-Type": "application/json; charset=utf-8" };
const out = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: H });

function validId(id) {
  if (!/^\d{5,9}$/.test(id)) return false;
  id = id.padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i++) { let n = Number(id[i]) * ((i % 2) + 1); sum += n > 9 ? n - 9 : n; }
  return sum % 10 === 0;
}
const str = (v, max) => String(v ?? "").trim().slice(0, max);
const int = (v, min, max) => { const n = Math.floor(Number(v) || 0); return n < min ? 0 : Math.min(n, max); };

export async function onRequest({ request, env }) {
  if (request.method !== "POST") return out({ ok: false, error: "method_not_allowed" }, 405);
  let d;
  try { d = await request.json(); } catch { return out({ ok: false, error: "invalid_json" }, 400); }

  if (d.website) return out({ ok: true });                       // מלכודת לרובוטים: מתעלמים בשקט

  const r = {
    first_name: str(d.first_name, 60), last_name: str(d.last_name, 60),
    id_number: str(d.id_number, 9), phone: str(d.phone, 10).replace(/\D/g, ""),
    email: str(d.email, 120).toLowerCase(),
    pension: ["one", "both"].includes(d.pension) ? d.pension : "",
    child_count: int(d.child_count, 1, 20), hishtalmut_count: int(d.hishtalmut_count, 1, 10), gemel_count: int(d.gemel_count, 1, 10),
    invest: d.invest ? 1 : 0, invest_amount: d.invest ? int(d.invest_amount, 0, 1e12) : 0,
    mortgage: d.mortgage ? 1 : 0, notes: str(d.notes, 1000),
  };

  const bad = [];
  if (!r.first_name) bad.push("first_name");
  if (!r.last_name) bad.push("last_name");
  if (!validId(r.id_number)) bad.push("id_number");
  if (!/^05\d{8}$/.test(r.phone)) bad.push("phone");
  if (r.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) bad.push("email");
  if (!r.pension && !r.child_count && !r.hishtalmut_count && !r.gemel_count) bad.push("funds");
  if (d.consent !== true) bad.push("consent");
  if (bad.length) return out({ ok: false, error: "invalid", fields: bad }, 400);

  try {
    const db = env.Lechatchila || env.DB;
    await db.prepare(
      `INSERT INTO registrations (created_at, first_name, last_name, id_number, phone, email, pension,
         child_count, hishtalmut_count, gemel_count, invest, invest_amount, mortgage, notes, source)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(new Date().toISOString(), r.first_name, r.last_name, r.id_number, r.phone, r.email, r.pension,
      r.child_count, r.hishtalmut_count, r.gemel_count, r.invest, r.invest_amount, r.mortgage, r.notes, "web").run();
  } catch (e) {
    return out({ ok: false, error: "db_error" }, 500);
  }
  return out({ ok: true });
}
