# השקעה לכתחילה - lehathila.com

דף נחיתה לרישום מקדים לחיסכון והשקעות למהדרין ללא צורך בהיתר עיסקא.

## מבנה
- `index.html` - דף הנחיתה והטופס
- `functions/api/register.js` - קבלת הטופס ושמירה ב-D1 (`POST /api/register`)
- `schema.sql` - טבלת `registrations`
- `fonts/` - גופני Heebo ו-Frank Ruhl Libre

## הקמה ב-Cloudflare (פעם אחת)
1. **D1:** Storage & Databases ← D1 ← Create, בשם `lehathila_db`. בלשונית Console מריצים את תוכן `schema.sql`.
2. **Pages:** Workers & Pages ← Create ← Pages ← Connect to Git ← הריפו הזה.
   Framework preset: None, Build command: ריק, Build output directory: `/`.
3. **Binding:** בפרויקט ← Settings ← Bindings ← Add ← D1 database: שם המשתנה `DB`, המסד `lehathila_db`. אחר כך Deployments ← Retry deployment.
4. **דומיין:** בפרויקט ← Custom domains ← `lehathila.com` (ואם רוצים גם `www.lehathila.com`).

## קבצים שחסרים
- **לוגו:** לשמור כ-`logo.png` ולהחליף את ההערה בראש הדף ב-`<img src="logo.png" alt="השקעה לכתחילה">`.
- **קריאת גדולי ההוראה:** לשמור כ-`kria.pdf` ולהסיר את `hidden` מהקישור `letter-link`.

## צפייה ברישומים
ב-D1 ← Console: `SELECT * FROM registrations ORDER BY id DESC;`
