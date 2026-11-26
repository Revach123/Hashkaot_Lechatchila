// אימות לדף הניהול. כניסה מותרת באחת משתי דרכים:
//  1. Cloudflare Access (מומלץ): בקשה שעברה את Access מגיעה עם הכותרת Cf-Access-Jwt-Assertion.
//     בודקים את החתימה מול המפתחות של הצוות, את ה-AUD של האפליקציה ואת התוקף.
//     משתנים ב-Pages (Text): ACCESS_TEAM_DOMAIN (למשל lehathila.cloudflareaccess.com), ACCESS_AUD (ה-AUD tag של האפליקציה).
//  2. סיסמה (אופציונלי): הסוד ADMIN_KEY, בכותרת Authorization: Bearer <ADMIN_KEY>.

const b64url = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));
let certCache = { team: "", at: 0, keys: [] };

async function accessKeys(team) {
  if (certCache.team === team && Date.now() - certCache.at < 3600e3) return certCache.keys;
  const res = await fetch(`https://${team}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error("certs " + res.status);
  const { keys = [] } = await res.json();
  certCache = { team, at: Date.now(), keys };
  return keys;
}

/** מחזיר את המייל של המשתמש אם ה-JWT תקין, אחרת "" */
export async function accessUser(request, env) {
  const team = String(env.ACCESS_TEAM_DOMAIN || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "").toLowerCase();
  const auds = String(env.ACCESS_AUD || "").split(",").map((s) => s.trim()).filter(Boolean);
  const token = request.headers.get("Cf-Access-Jwt-Assertion") || "";
  if (!team || !auds.length || !token) return "";
  try {
    const [h, p, sig] = token.split(".");
    const header = JSON.parse(new TextDecoder().decode(b64url(h)));
    const payload = JSON.parse(new TextDecoder().decode(b64url(p)));
    if (header.alg !== "RS256") return "";
    const jwk = (await accessKeys(team)).find((k) => k.kid === header.kid);
    if (!jwk) return "";
    const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
    const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64url(sig), new TextEncoder().encode(h + "." + p));
    if (!ok) return "";
    const now = Date.now() / 1000;
    if (payload.exp && payload.exp < now) return "";
    if (payload.nbf && payload.nbf > now + 60) return "";
    if (payload.iss !== `https://${team}`) return "";
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.some((a) => auds.includes(a))) return "";
    return String(payload.email || payload.sub || "access");
  } catch {
    return "";
  }
}

async function sameSecret(a, b) {
  const enc = new TextEncoder();
  const [x, y] = await Promise.all([crypto.subtle.digest("SHA-256", enc.encode(a)), crypto.subtle.digest("SHA-256", enc.encode(b))]);
  const u = new Uint8Array(x), v = new Uint8Array(y);
  let diff = 0;
  for (let i = 0; i < u.length; i++) diff |= u[i] ^ v[i];
  return diff === 0;
}

/** { ok, user, configured } */
export async function adminAuth(request, env) {
  const accessOn = !!(env.ACCESS_TEAM_DOMAIN && env.ACCESS_AUD);
  const keyOn = !!(env.ADMIN_KEY && env.ADMIN_KEY.length >= 10);
  if (!accessOn && !keyOn) return { ok: false, configured: false };
  if (accessOn) { const u = await accessUser(request, env); if (u) return { ok: true, user: u, configured: true }; }
  if (keyOn) {
    const given = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (given && (await sameSecret(given, env.ADMIN_KEY))) return { ok: true, user: "password", configured: true };
  }
  return { ok: false, configured: true };
}
