// Email Worker של lehathila.com - מקבל את כל המיילים ל-info@lehathila.com (Cloudflare Email Routing).
//
//   * מייל שיש בו "הצטרפות" (בנושא או בגוף) - שולח לפונה את טופס ההצטרפות (דרך https://lehathila.com/api/join-request).
//     המייל הזה לא מועבר ל-Gmail, כדי שלא ייווצר מעגל (Gmail מעביר "הצטרפות" לכאן).
//   * כל מייל אחר - מועבר כמו שהוא ל-FORWARD_TO (Gmail).
//
// הגדרות ב-Worker (Settings ← Variables and Secrets):
//   JOIN_SECRET  (Secret)  - אותו ערך כמו JOIN_SECRET בפרויקט ה-Pages
//   FORWARD_TO   (Text)    - אופציונלי, ברירת מחדל a033065323@gmail.com (חייבת להיות כתובת מאומתת ב-Email Routing)

const DEFAULT_FORWARD = "a033065323@gmail.com";
const JOIN_URL = "https://lehathila.com/api/join-request";
const KEYWORD = /הצטרפ|הצטרף/;                         // הצטרפות / להצטרף / הצטרפתי

export default {
  async email(message, env, ctx) {
    const forwardTo = env.FORWARD_TO || DEFAULT_FORWARD;
    let raw;
    try { raw = new Uint8Array(await new Response(message.raw).arrayBuffer()); }
    catch { return message.forward(forwardTo); }

    const mail = parseMail(raw);
    const h = mail.headers;
    const sender = firstAddress(h["reply-to"]) || firstAddress(h["from"]) || String(message.from || "").toLowerCase();
    const autoMail = /^(auto-|yes)/i.test(h["auto-submitted"] || "") || /bulk|junk|list|auto_reply/i.test(h["precedence"] || "")
      || /mailer-daemon|postmaster|noreply|no-reply/i.test(sender) || sender.endsWith("@lehathila.com");
    // תשובה למייל ששלחנו (בנושא שלו יש "הצטרפות") היא פנייה רגילה - עוברת ל-Gmail
    const isReply = !!h["in-reply-to"] || /^\s*(re|fw|fwd|השב|תגובה)\s*:/i.test(mail.subject);
    const isJoin = !autoMail && !isReply && KEYWORD.test(mail.subject + "\n" + mail.text);

    if (!isJoin) return message.forward(forwardTo);

    try {
      const res = await fetch(JOIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Join-Secret": env.JOIN_SECRET || "" },
        body: JSON.stringify({ email: sender }),
      });
      console.log("join-request", sender, res.status, await res.text());
      if (res.ok) return;
    } catch (e) {
      console.log("join-request failed", sender, String(e));
    }
    // השליחה נכשלה: מעבירים ל-Gmail כדי שהבקשה לא תאבד - רק אם המייל לא הגיע מ-Gmail עצמו (מניעת מעגל)
    if (!h["x-forwarded-for"] && !h["x-forwarded-to"]) return message.forward(forwardTo);
  },
};

// ---------- פענוח מייל (מינימלי: כותרות, נושא, וכל חלקי הטקסט) ----------

const latin1 = (bytes) => { let s = ""; for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)); return s; };
const toBytes = (bin) => Uint8Array.from(bin, (c) => c.charCodeAt(0) & 255);

function decodeCharset(bytes, charset) {
  const cs = String(charset || "utf-8").toLowerCase();
  for (const c of [cs, "utf-8"]) { try { return new TextDecoder(c).decode(bytes); } catch { /* charset לא נתמך */ } }
  return latin1(bytes);
}
function b64ToBin(s) { try { return atob(s.replace(/[^A-Za-z0-9+/=]/g, "")); } catch { return ""; } }
function qpToBin(s) { return s.replace(/=\r?\n/g, "").replace(/=([0-9A-Fa-f]{2})/g, (_, x) => String.fromCharCode(parseInt(x, 16))); }

function decodeWords(v) {                              // =?UTF-8?B?...?= / =?windows-1255?Q?...?=
  v = String(v || "");
  if (/[\x80-\xff]/.test(v)) v = decodeCharset(toBytes(v), "utf-8");   // כותרת בעברית בלי קידוד (8bit)
  return v.replace(/\?=\s+=\?/g, "?==?").replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_, cs, enc, txt) => {
    const bin = /b/i.test(enc) ? b64ToBin(txt) : qpToBin(txt.replace(/_/g, " "));
    return decodeCharset(toBytes(bin), cs);
  });
}

function splitHeaders(bin) {
  const m = bin.match(/\r?\n\r?\n/);
  const head = m ? bin.slice(0, m.index) : bin;
  const body = m ? bin.slice(m.index + m[0].length) : "";
  const headers = {};
  for (const line of head.replace(/\r?\n[ \t]+/g, " ").split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) { const k = line.slice(0, i).trim().toLowerCase(); if (!(k in headers)) headers[k] = line.slice(i + 1).trim(); }
  }
  return { headers, body };
}
const param = (v, name) => { const m = String(v || "").match(new RegExp(name + '\\s*=\\s*"?([^";]+)"?', "i")); return m ? m[1].trim() : ""; };

function collectText(bin, depth, out) {
  const { headers, body } = splitHeaders(bin);
  const type = (headers["content-type"] || "text/plain").toLowerCase();
  if (type.startsWith("multipart/") && depth < 6) {
    const b = param(headers["content-type"], "boundary");
    if (!b) return;
    for (const p of body.split("--" + b).slice(1)) { if (p.startsWith("--")) break; collectText(p.replace(/^\r?\n/, ""), depth + 1, out); }
    return;
  }
  if (!type.startsWith("text/")) return;
  const enc = (headers["content-transfer-encoding"] || "").toLowerCase();
  const data = enc === "base64" ? b64ToBin(body) : enc === "quoted-printable" ? qpToBin(body) : body;
  let text = decodeCharset(toBytes(data), param(headers["content-type"], "charset"));
  if (type.startsWith("text/html")) text = text.replace(/<[^>]+>/g, " ");
  out.push(text.slice(0, 20000));
}

function parseMail(bytes) {
  const bin = latin1(bytes.subarray(0, 2_000_000));
  const { headers } = splitHeaders(bin);
  for (const k of ["subject", "from", "reply-to"]) if (headers[k]) headers[k] = decodeWords(headers[k]);
  const parts = [];
  collectText(bin, 0, parts);
  return { headers, subject: headers.subject || "", text: parts.join("\n") };
}

function firstAddress(v) {
  if (!v) return "";
  const m = String(v).match(/<([^<>\s]+@[^<>\s]+)>/) || String(v).match(/([^\s<>,;"]+@[^\s<>,;"]+)/);
  return m ? m[1].toLowerCase() : "";
}

