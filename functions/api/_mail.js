// בניית מייל ההצטרפות (טקסט + AMP דינמי + HTML) ושליחתו דרך CloudMailin.
// סודות ב-Cloudflare Pages: CLOUDMAILIN_USERNAME, CLOUDMAILIN_API_KEY (= SMTP Secret).
// אופציונלי: CLOUDMAILIN_TEST_MODE=1 - CloudMailin בודק את המייל ולא שולח אותו בפועל.

export const FROM_ADDRESS = "info@lehathila.com";
export const FROM_NAME = "השקעה לכתחילה";
export const SITE = "https://lehathila.com";
const SUBJECT = "טופס הצטרפות - חיסכון והשקעות למהדרין";
const PHONE = "03-306-5323";

const b64 = (s) => { const b = new TextEncoder().encode(s); let bin = ""; for (const x of b) bin += String.fromCharCode(x); return btoa(bin); };
const wrap76 = (s) => s.replace(/.{1,76}/g, "$&\r\n").trimEnd();
const encWord = (s) => `=?UTF-8?B?${b64(s)}?=`;

function part(type, body) {
  return `Content-Type: ${type}; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n${wrap76(b64(body))}\r\n`;
}

export function textBody() {
  return [
    "שלום,",
    "",
    "תודה על פנייתך לרישום המקדים לחיסכון והשקעות למהדרין ללא צורך בהיתר עיסקא.",
    "",
    "למילוי טופס הרישום:",
    `${SITE}/#register`,
    "",
    `קו מידע והרשמה טלפונית: ${PHONE} (ניתן להשאיר הודעות בשלוחה 8).`,
    "",
    "מדובר ברישום בלבד, הרישום אינו מחייב, ואין לראות בדברים המלצה, שיווק, או ייעוץ השקעות, או תחליף לשיקול דעת עצמאי.",
    "",
    "השקעה לכתחילה",
  ].join("\r\n");
}

export function htmlBody() {
  return `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#f6f8f4">
<div dir="rtl" style="max-width:600px;margin:0 auto;padding:16px;font-family:Arial,Helvetica,sans-serif;color:#1d2433">
<div style="background:#fff;border:1px solid #dde3d6;border-radius:12px;overflow:hidden">
<div style="text-align:center;padding:14px;border-bottom:4px solid #346d0c"><img src="${SITE}/logo.png" width="300" alt="${FROM_NAME}" style="max-width:100%;height:auto"></div>
<div style="padding:20px 22px">
<h1 style="font-size:22px;color:#002160;margin:0 0 10px">טופס רישום לחיסכון והשקעות למהדרין</h1>
<p style="font-size:16px;line-height:1.7;margin:0 0 12px">תודה על פנייתך. מטרתנו להביא לציבור המדקדקים מסלולי פנסיה והשקעות מחקי מדדים, בהידור הגבוה ביותר וללא כל חשש איסורי ריבית ושאר איסורים.</p>
<p style="text-align:center;margin:20px 0"><a href="${SITE}/#register" style="display:inline-block;background:#346d0c;color:#fff;text-decoration:none;font-weight:bold;font-size:17px;padding:12px 28px;border-radius:999px">למילוי טופס הרישום</a></p>
<p style="font-size:15px;margin:0 0 6px">קו מידע והרשמה טלפונית: <b dir="ltr">${PHONE}</b> - ניתן להשאיר הודעות בשלוחה 8.</p>
<p style="font-size:13px;color:#5b6476;line-height:1.6;margin:14px 0 0">מדובר ברישום בלבד, הרישום אינו מחייב, ואין לראות בדברים המלצה, שיווק, או ייעוץ השקעות, או תחליף לשיקול דעת עצמאי.</p>
</div></div></div></body></html>`;
}

const opts = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => `<option value="${from + i}">${from + i}</option>`).join("");

/** גרסת AMP: הטופס המלא בתוך המייל, נשלח ל-/api/register-amp */
export function ampBody(toEmail) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `<!doctype html>
<html ⚡4email lang="he">
<head>
<meta charset="utf-8">
<script async src="https://cdn.ampproject.org/v0.js"></script>
<script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>
<script async custom-template="amp-mustache" src="https://cdn.ampproject.org/v0/amp-mustache-0.2.js"></script>
<style amp4email-boilerplate>body{visibility:hidden}</style>
<style amp-custom>
body{margin:0;background:#f6f8f4;font-family:Arial,Helvetica,sans-serif;color:#1d2433}
.wrap{max-width:600px;margin:0 auto;padding:12px}
.box{background:#fff;border:1px solid #dde3d6;border-radius:12px}
.logo{padding:12px 40px;border-bottom:4px solid #346d0c}
.in{padding:16px 18px}
h1{font-size:21px;color:#002160;margin:0 0 8px}
h2{font-size:17px;color:#002160;margin:18px 0 8px;padding-bottom:4px;border-bottom:1px solid #dde3d6}
p{font-size:15px;line-height:1.6;margin:0 0 10px}
.note{background:#eaf3e1;border:1px solid #c9dfb6;border-radius:10px;padding:10px 12px;font-size:14px}
label.f{display:block;font-size:14px;font-weight:bold;margin:10px 0 4px}
.req{color:#b3261e}
.fld{width:100%;box-sizing:border-box;font-size:16px;padding:9px 10px;border:1px solid #c5ccbd;border-radius:8px;background:#fff;font-family:Arial,Helvetica,sans-serif}
textarea{height:70px}
.opt{border:1px solid #dde3d6;border-radius:10px;padding:9px 11px;margin:0 0 8px;font-size:15px}
.opt b{color:#002160}
.sel{width:auto;padding:4px 8px;font-size:15px;border:1px solid #c5ccbd;border-radius:8px;background:#fff}
.amt{width:160px}
.consent{background:#f3f5f0;border-radius:10px;padding:10px 12px;font-size:14px;line-height:1.55;margin:12px 0}
.err{color:#b3261e;font-size:13px}
button{display:block;width:100%;background:#002160;color:#fff;border:0;border-radius:10px;font-size:18px;font-weight:bold;padding:13px;margin-top:14px;font-family:Arial,Helvetica,sans-serif}
.ok{background:#eaf3e1;border:1px solid #c9dfb6;border-radius:10px;padding:16px;text-align:center;font-size:17px;color:#1e6b3a}
.bad{background:#fbeaea;border:1px solid #e9b8b5;border-radius:10px;padding:12px;font-size:15px;color:#b3261e;margin-top:10px}
.amp-form-submit-success .fields{display:none}
.amp-form-submitting button{opacity:.6}
.small{font-size:12px;color:#5b6476;line-height:1.5}
.foot{margin-top:16px}
</style>
</head>
<body>
<div class="wrap" dir="rtl"><div class="box">
<div class="logo"><amp-img src="${SITE}/logo.png" width="521" height="216" layout="responsive" alt="${FROM_NAME}"></amp-img></div>
<div class="in">
<h1>טופס רישום לחיסכון והשקעות למהדרין ללא צורך בהיתר עיסקא</h1>
<p>מטרתינו להביא לציבור המדקדקים מסלולי פנסיה והשקעות מחקי מדדים, בהידור הגבוה ביותר וללא כל חשש איסורי ריבית ושאר איסורים.</p>
<p>לדרישת החברות, וע"פ בקשת גדולי ההוראה שליט"א אנו עורכים כעת רישום מקדים בכדי להביא בפניהם את דרישת הציבור למסלולים אלו.</p>
<p class="note">מדובר ברישום בלבד, הרישום אינו מחייב, ואין לראות בדברים המלצה, שיווק, או ייעוץ השקעות, או תחליף לשיקול דעת עצמאי.</p>

<form method="post" action-xhr="${SITE}/api/register-amp" custom-validation-reporting="show-all-on-submit">
<div class="fields">
<h2>פרטים אישיים</h2>
<label class="f" for="fn">שם פרטי <span class="req">*</span></label>
<input class="fld" type="text" id="fn" name="first_name" required maxlength="60">
<span class="err" visible-when-invalid="valueMissing" validation-for="fn">נא למלא שם פרטי</span>
<label class="f" for="ln">שם משפחה <span class="req">*</span></label>
<input class="fld" type="text" id="ln" name="last_name" required maxlength="60">
<span class="err" visible-when-invalid="valueMissing" validation-for="ln">נא למלא שם משפחה</span>
<label class="f" for="tz">ת.ז. <span class="req">*</span></label>
<input class="fld" type="text" id="tz" name="id_number" required pattern="[0-9]{5,9}" maxlength="9">
<span class="err" visible-when-invalid="valueMissing" validation-for="tz">נא למלא ת.ז.</span>
<span class="err" visible-when-invalid="patternMismatch" validation-for="tz">ספרות בלבד</span>
<label class="f" for="ph">פלאפון <span class="req">*</span></label>
<input class="fld" type="tel" id="ph" name="phone" required maxlength="14" placeholder="05X-XXXXXXX">
<span class="err" visible-when-invalid="valueMissing" validation-for="ph">נא למלא פלאפון</span>
<label class="f" for="em">אימייל</label>
<input class="fld" type="email" id="em" name="email" value="${esc(toEmail)}" maxlength="120">

<h2>קופות גמל</h2>
<p><b>סמן את קופות הגמל הרלוונטיות בעבורך:</b></p>
<div class="opt"><label><input type="radio" name="pension" value="" checked> ללא קרן פנסיה</label></div>
<div class="opt"><label><input type="radio" name="pension" value="one"> <b>קרן פנסיה לאחד מבני הזוג</b></label></div>
<div class="opt"><label><input type="radio" name="pension" value="both"> <b>קרן פנסיה לשני בני הזוג</b></label></div>
<div class="opt"><label><input type="checkbox" name="child_savings" value="1"> <b>חיסכון לכל ילד</b></label><br>מספר הילדים שיש על שמם קופת חיסכון לכל ילד: <select class="sel" name="child_count">${opts(1, 20)}</select></div>
<div class="opt"><label><input type="checkbox" name="hishtalmut" value="1"> <b>קרן השתלמות</b></label><br>אם יש במשפחה כמה קרנות השתלמות, מספרן: <select class="sel" name="hishtalmut_count">${opts(1, 10)}</select></div>
<div class="opt"><label><input type="checkbox" name="gemel" value="1"> <b>קופת גמל להשקעה</b></label><br>אם יש במשפחה כמה קופות גמל, מספרן: <select class="sel" name="gemel_count">${opts(1, 10)}</select></div>

<div class="consent"><label><input type="checkbox" name="consent" value="1" required> <span class="req">*</span> אני מעוניין במסלולים במתווה "השקעה לכתחילה - חיסכון והשקעות למהדרין ללא צורך בהיתר עיסקא" בקופות הגמל שציינתי, ומאשר להעביר את המידע שמסרתי לסוכני ביטוח ו/או חברות המנהלות קרנות פנסיה וקופות גמל על מנת שיצרו עימי קשר.</label></div>

<label class="f" for="nt">הערות</label>
<textarea class="fld" id="nt" name="notes" maxlength="1000"></textarea>

<h2>שאלות נוספות</h2>
<div class="opt"><label><input type="checkbox" name="invest" value="1"> אני מעוניין גם להשקיע (בחשבון מסחר עצמאי) בקרנות סל ונאמנות ללא היתר עיסקא במתווה הנ"ל</label><br>סכום משוער (₪): <input class="fld amt" type="text" name="invest_amount" pattern="[0-9,]*" maxlength="16" placeholder="1,000"></div>
<div class="opt"><label><input type="checkbox" name="mortgage" value="1"> נטלתי הלוואת משכנתא (או שבכוונתי ליטול), ואני מעוניין בפתרונות למהדרין להלוואות משכנתא.</label></div>

<button type="submit">לאישור ושליחת הטופס</button>
</div>
<div submit-success><template type="amp-mustache"><div class="ok">תודה {{first_name}}, הרישום התקבל.<br>ניצור קשר כשהמסלולים יהיו זמינים.</div></template></div>
<div submit-error><template type="amp-mustache"><div class="bad">{{message}}</div></template></div>
</form>

<p class="small foot">קו מידע והרשמה טלפונית: ${PHONE} - ניתן להשאיר הודעות בשלוחה 8.<br>אפשר להירשם גם באתר: <a href="${SITE}/#register">lehathila.com</a></p>
</div></div></div>
</body>
</html>`;
}

/** מייל מלא בפורמט RFC 822: טקסט, AMP, HTML (בסדר הזה - HTML אחרון) */
export function buildJoinMail(to) {
  const boundary = "lh_" + crypto.randomUUID().replace(/-/g, "");
  const headers = [
    `From: ${encWord(FROM_NAME)} <${FROM_ADDRESS}>`,
    `To: <${to}>`,
    `Reply-To: ${FROM_ADDRESS}`,
    `Subject: ${encWord(SUBJECT)}`,
    `Date: ${new Date().toUTCString().replace("GMT", "+0000")}`,
    `Message-ID: <${crypto.randomUUID()}@lehathila.com>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ].join("\r\n");
  return headers + "\r\n\r\n" +
    `--${boundary}\r\n` + part("text/plain", textBody()) +
    `--${boundary}\r\n` + part("text/x-amp-html", ampBody(to)) +
    `--${boundary}\r\n` + part("text/html", htmlBody()) +
    `--${boundary}--\r\n`;
}

/** שליחה דרך ה-API של CloudMailin (הודעה גולמית) */
export async function sendRaw(env, to, raw) {
  const user = env.CLOUDMAILIN_USERNAME, key = env.CLOUDMAILIN_API_KEY;
  if (!user || !key) throw new Error("missing CLOUDMAILIN_USERNAME / CLOUDMAILIN_API_KEY");
  const res = await fetch(`https://api.cloudmailin.com/api/v0.1/${encodeURIComponent(user)}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({ from: FROM_ADDRESS, to, raw, tags: ["join"], test_mode: env.CLOUDMAILIN_TEST_MODE === "1" }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`cloudmailin ${res.status}: ${text.slice(0, 300)}`);
  return text;
}
