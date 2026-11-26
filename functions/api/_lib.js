// משותף לטופס באתר (register.js) ולטופס שבמייל הדינמי (register-amp.js):
// ניקוי ובדיקת שדות, ושמירה בטבלת registrations.

export const json = (o, status = 200, extra = {}) =>
  new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...extra } });

export const getDb = (env) => env.Lechatchila || env.DB;

export function validId(id) {
  if (!/^\d{5,9}$/.test(id)) return false;
  id = id.padStart(9, "0");
  let sum = 0;
  for (let i = 0; i < 9; i++) { const n = Number(id[i]) * ((i % 2) + 1); sum += n > 9 ? n - 9 : n; }
  return sum % 10 === 0;
}
export const validEmail = (e) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(e);

const str = (v, max) => String(v ?? "").trim().slice(0, max);
const int = (v, min, max) => { const n = Math.floor(Number(String(v ?? "").replace(/[^\d.]/g, "")) || 0); return n < min ? 0 : Math.min(n, max); };
const yes = (v) => v === true || v === "on" || v === "1" || v === "true";

/** d: שדות גולמיים (מ-JSON או מטופס). מחזיר { r, bad } - bad = רשימת שדות שגויים */
export function normalize(d) {
  const phone = str(d.phone, 20).replace(/[\s\-()]/g, "").replace(/^\+972/, "0");
  const invest = yes(d.invest);
  // מזהה: ת.ז. (9 ספרות עם ספרת ביקורת) או דרכון (5-15 אותיות באנגלית / ספרות). דרכון נשמר עם הקידומת P:
  const idType = d.id_type === "passport" ? "passport" : "tz";
  const passport = str(d.id_number, 30).replace(/[\s\-]/g, "").toUpperCase();
  const idNumber = idType === "passport" ? "P:" + passport : str(d.id_number, 12).replace(/\D/g, "");
  const r = {
    first_name: str(d.first_name, 60), last_name: str(d.last_name, 60),
    id_number: idNumber, phone,
    email: str(d.email, 120).toLowerCase(),
    pension: ["one", "both"].includes(d.pension) ? d.pension : "",
    child_count: yes(d.child_savings) ? int(d.child_count, 1, 20) : 0,
    hishtalmut_count: yes(d.hishtalmut) ? int(d.hishtalmut_count, 1, 10) : 0,
    gemel_count: yes(d.gemel) ? int(d.gemel_count, 1, 10) : 0,
    invest: invest ? 1 : 0, invest_amount: invest ? int(d.invest_amount, 0, 1e12) : 0,
    mortgage: yes(d.mortgage) ? 1 : 0, notes: str(d.notes, 1000),
  };
  const bad = [];
  if (!r.first_name) bad.push("first_name");
  if (!r.last_name) bad.push("last_name");
  if (idType === "passport" ? !/^[A-Z0-9]{5,15}$/.test(passport) : !validId(r.id_number)) bad.push("id_number");
  if (!/^05\d{8}$/.test(r.phone)) bad.push("phone");
  if (r.email && !validEmail(r.email)) bad.push("email");
  if (!r.pension && !r.child_count && !r.hishtalmut_count && !r.gemel_count) bad.push("funds");
  if (!yes(d.consent)) bad.push("consent");
  return { r, bad };
}

export const FIELD_NAMES = {
  first_name: "שם פרטי", last_name: "שם משפחה", id_number: "ת.ז. / דרכון", phone: "פלאפון",
  email: "אימייל", funds: "סימון קופה אחת לפחות", consent: "אישור העברת המידע",
};

export async function saveRegistration(env, r, source) {
  await getDb(env).prepare(
    `INSERT INTO registrations (created_at, first_name, last_name, id_number, phone, email, pension,
       child_count, hishtalmut_count, gemel_count, invest, invest_amount, mortgage, notes, source)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).bind(new Date().toISOString(), r.first_name, r.last_name, r.id_number, r.phone, r.email, r.pension,
    r.child_count, r.hishtalmut_count, r.gemel_count, r.invest, r.invest_amount, r.mortgage, r.notes, source).run();
}
