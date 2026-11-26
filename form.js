/* טופס הרשמה לשיעור ראשון, בלי האפליקציה: פרטים, הצהרת בריאות, תקנון וצילומים.
   נשמר בשרת (submit_intake) ורק שחר רואה אותו, בניהול ← לקוחות ← "טפסים מהאתר".
   השאלות זהות לאלה שבאפליקציה (app.js → CONFIG.healthQuestions / danceQuestions). */

const WHATSAPP = '972545543035';
const CANCEL_HOURS = 12;

const HEALTH = [
  { q: 'האם רופא אמר לך שיש לך מחלת לב או לחץ דם גבוה?' },
  { g: 'האם את חשה כאבים בחזה…', q: 'בזמן מנוחה?' },
  { g: 'האם את חשה כאבים בחזה…', q: 'במהלך פעילויות שגרה ביום-יום?' },
  { g: 'האם את חשה כאבים בחזה…', q: 'בזמן פעילות גופנית?' },
  { g: 'במהלך השנה האחרונה…', q: 'איבדת שיווי משקל עקב סחרחורת? (לא — אם הסחרחורת נבעה מנשימת יתר במאמץ)' },
  { g: 'במהלך השנה האחרונה…', q: 'איבדת את הכרתך?' },
  { g: 'אם אובחנת עם אסתמה — בשלושת החודשים האחרונים…', q: 'נזקקת לטיפול תרופתי?' },
  { g: 'אם אובחנת עם אסתמה — בשלושת החודשים האחרונים…', q: 'סבלת מקוצר נשימה או צפצופים?' },
  { g: 'האם בן/בת משפחה מדרגה ראשונה נפטר/ה…', q: 'ממחלת לב?' },
  { g: 'האם בן/בת משפחה מדרגה ראשונה נפטר/ה…', q: 'ממוות פתאומי בגיל צעיר? (גבר לפני 55, אישה לפני 65)' },
  { q: 'האם רופא אמר לך ב-5 השנים האחרונות לבצע פעילות גופנית רק תחת השגחה רפואית?' },
  { q: 'האם יש לך מחלה כרונית אחרת שעלולה למנוע או להגביל פעילות גופנית?' },
  { q: 'אם את בהריון: האם ההריון הנוכחי או הריון קודם הוגדר "הריון בסיכון"?' },
];
const DANCE = [
  { k: 'joints', q: 'יש לך כאב או פציעה בגב, בברכיים, בקרסוליים או במפרקים אחרים (בשנה האחרונה)?' },
  { k: 'surgery', q: 'עברת ניתוח ב-6 החודשים האחרונים?' },
  { k: 'pregnant', q: 'את כרגע בהריון, או ילדת בחצי השנה האחרונה?' },
];
const PHOTO_TEXT = 'לפעמים אני מצלמת קטעים מהשיעורים כדי לשתף את האווירה באינסטגרם, בטיקטוק, בפייסבוק, בוואטסאפ ובאתר של הסטודיו, וכך להזמין עוד נשים לרקוד איתנו. מה מתאים לך?';
const PHOTO_FINE = 'הבחירה לא משפיעה על ההשתתפות בשיעורים, ואפשר לשנות אותה בכל רגע. אם אישרת, הסרטונים יכולים להיות ערוכים (חיתוך, מוזיקה, טקסט) ולהתפרסם בערוצים של הסטודיו בלי תמורה. אם תבקשי, אוריד פרסום שבו רואים אותך תוך 14 יום, וסטוריז נמחקים לבד אחרי 24 שעות.';

const sb = window.supabase.createClient(window.SUPA_CONFIG.url, window.SUPA_CONFIG.anonKey);
const $app = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const val = id => (document.getElementById(id)?.value || '').trim();
const f = { answers: HEALTH.map(() => null), dance: {}, photo: null };
let busy = false, sent = false;

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 3200);
}
const yn = (act, key, v) => `<div class="yn">
  <button type="button" class="${v === true ? 'on yes' : ''}" data-act="${act}" data-i="${key}" data-v="1">כן</button>
  <button type="button" class="${v === false ? 'on' : ''}" data-act="${act}" data-i="${key}" data-v="0">לא</button></div>`;

function keepInputs() {
  for (const id of ['name', 'age', 'phone', 'email', 'details', 'parent', 'sign']) { const el = document.getElementById('f-' + id); if (el) f[id] = el.value; }
  for (const id of ['pok', 'hok', 'tok', 'tpriv']) { const el = document.getElementById('f-' + id); if (el) f[id] = el.checked; }
}

function render() {
  if (sent) return renderDone();
  const anyYes = f.answers.some(x => x === true);
  const minor = f.age && +f.age < 18;
  let lastG = null;
  const rows = HEALTH.map((h, i) => {
    const head = h.g && h.g !== lastG ? `<div class="q-group">${esc(h.g)}</div>` : '';
    lastG = h.g || null;
    return `${head}<div class="q ${h.g ? 'sub' : ''}" id="hq-${i}"><div class="grow">${esc(h.q)}</div>${yn('yn', i, f.answers[i])}</div>`;
  }).join('');
  const y = window.scrollY;
  $app.innerHTML = `<div class="stack fade-in">
    <div class="f-logo"><img src="icon-512.png" alt="YOU by Shahar"></div>
    <div class="lead-card">
      <p class="hand">איזה כיף שאת מגיעה 💃</p>
      <p>כמה פרטים קצרים לפני השיעור הראשון.</p>
    </div>

    <p class="f-step">1 · נעים להכיר</p>
    <label class="field"><span>שם מלא</span><input class="input" id="f-name" value="${esc(f.name)}" autocomplete="name"></label>
    <label class="field"><span>גיל</span><input class="input" id="f-age" type="number" inputmode="numeric" min="14" max="99" value="${esc(f.age)}"></label>
    <label class="field"><span>טלפון</span><input class="input" id="f-phone" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" style="text-align:right" value="${esc(f.phone)}"></label>
    <label class="field"><span>אימייל <small class="muted">(לקבלות ולכניסה לאפליקציה)</small></span><input class="input" id="f-email" type="email" autocomplete="email" dir="ltr" style="text-align:right" value="${esc(f.email)}"></label>

    <p class="f-step">2 · הצהרת בריאות</p>
    <p class="muted small">המידע נשמר באופן מאובטח, ורק שחר רואה אותו.</p>
    <div class="card" style="padding:4px 16px">${rows}</div>
    ${anyYes ? `<div class="note warn">ענית "כן" על אחת השאלות. זה לא אומר שאי אפשר לרקוד 🤍 רק צריך אישור קצר מרופא (מהשלושה חודשים האחרונים) שאין מניעה לפעילות גופנית. שלחי אותו לשחר בוואטסאפ לפני השיעור.</div>` : ''}
    <h3 style="margin-top:10px">עוד משהו?</h3>
    <label class="field"><span>יש משהו בגוף שלך שחשוב שאדע? (לא חובה)</span><textarea class="input" id="f-details">${esc(f.details)}</textarea></label>
    <div id="minor-box" style="${minor ? '' : 'display:none'}"><div class="card stack"><h3>את מתחת לגיל 18</h3><p class="small muted">צריך גם הסכמה של אחד ההורים.</p>
      <label class="field"><span>שם ההורה</span><input class="input" id="f-parent" value="${esc(f.parent)}"></label>
      <label class="check"><input type="checkbox" id="f-pok" ${f.pok ? 'checked' : ''}> <span>ההורה מאשר/ת את השתתפותי בשיעורי ריקוד</span></label></div></div>
    <label class="check"><input type="checkbox" id="f-hok" ${f.hok ? 'checked' : ''}> <span>קראתי והבנתי את השאלון ומילאתי אותו בעצמי. מסרתי פרטים מלאים ונכונים, ואעדכן את שחר אם יחול שינוי במצבי הבריאותי.</span></label>

    <p class="f-step">3 · צילומים ותקנון</p>
    <div class="card stack" id="photo-box">
      <h3>צילומים בשיעורים 📷</h3>
      <p class="small">${PHOTO_TEXT}</p>
      <div class="stack" style="gap:8px">
        <button type="button" class="chip ${f.photo === 'yes' ? 'on' : ''}" style="text-align:right;justify-content:flex-start;width:100%" data-act="photo" data-v="yes">אני בעניין, אפשר לצלם אותי 🤍</button>
        <button type="button" class="chip ${f.photo === 'no' ? 'on' : ''}" style="text-align:right;justify-content:flex-start;width:100%" data-act="photo" data-v="no">אני מעדיפה לא להצטלם</button>
      </div>
      <p class="tiny muted">${PHOTO_FINE}${minor ? ' מתחת לגיל 18: ההורה שאישר/ה את ההשתתפות מאשר/ת גם את הבחירה הזו.' : ''}</p>
    </div>
    <div class="card terms" tabindex="0" role="region" aria-label="התקנון">
      <h3>מה אפשר לרכוש</h3>
      <ul>
        <li><b>מנוי חודשי:</b> מקום קבוע בשיעורים לפי המסלול שבחרת. החיוב אוטומטי בכרטיס האשראי, פעם בחודש, עד שמבטלים.</li>
        <li><b>שיעור ריקוד בודד:</b> לשיעור ריקוד אחד, בתוקף 21 יום.</li>
        <li><b>שיעור ניסיון גמישות:</b> פעם אחת בלבד, לשיעור גמישות אחד, בתוקף 30 יום.</li>
        <li>הרכישה אישית ואינה ניתנת להעברה.</li>
      </ul>
      <h3>המנוי</h3>
      <ul>
        <li>המקום שלך נשמר אוטומטית בכל שיעור במסלול. לא צריך להירשם כל פעם.</li>
        <li>אפשר להחליף את יום הריקוד בכל זמן, לפי המקום הפנוי.</li>
        <li><b>שינוי מסלול:</b> אפשר לעבור לכל מסלול אחר, דרך האפליקציה.</li>
        <li>מעבר למסלול יקר יותר נכנס מיד. משלמים עכשיו רק את ההפרש היחסי לימים שנשארו עד יום החידוש, ומיום החידוש החיוב לפי המסלול החדש.</li>
        <li>מעבר למסלול זול יותר נכנס ביום החידוש הבא.</li>
        <li><b>ביטול המנוי:</b> בכל רגע, לבד, דרך האפליקציה (במסך ניהול המנוי). אחרי הביטול אין חיובים נוספים, והמנוי פעיל עד יום החידוש הקרוב. על חיוב שכבר בוצע אין החזר, חוץ מביטול בתוך 14 יום (ראו בהמשך).</li>
        <li>נתקלת בבעיה בביטול? אפשר לכתוב לשחר בוואטסאפ.</li>
        <li>אם החיוב החודשי לא עובר, נעדכן אותך. עד שהתשלום מסודר, המקום בשיעורים הבאים לא נשמר.</li>
        <li>במקרים מיוחדים, למשל בעיה רפואית, אפשר לפנות לשחר.</li>
      </ul>
      <h3>ביטול רכישה</h3>
      <ul>
        <li>תוך 14 יום מהרכישה, ולפני שהשתתפת בשיעור: אפשר לבטל ולקבל החזר, בניכוי דמי ביטול של 5% או 100 ₪, הנמוך מביניהם.</li>
        <li><b>במנוי:</b> מבטלים לבד דרך האפליקציה, וההחזר נעשה אוטומטית לכרטיס האשראי.</li>
        <li><b>בשיעור בודד או בשיעור ניסיון:</b> כותבים לשחר בוואטסאפ.</li>
        <li>אחרי שהשתתפת בשיעור, או אחרי 14 יום, אין החזר כספי.</li>
      </ul>
      <h3>כשאת לא מגיעה</h3>
      <ul>
        <li><b>במנוי:</b> אם לא תוכלי להגיע, לוחצים "לא אגיע" באפליקציה כדי לפנות את המקום לאחרות. אין החזר או זיכוי על שיעור שלא הגעת אליו.</li>
        <li><b>בשיעור בודד או בכרטיסייה:</b> ביטול עד 12 שעות לפני השיעור, השיעור חוזר אלייך (לא כהחזר כספי). ביטול מאוחר יותר, אי-הגעה או איחור, השיעור נספר.</li>
        <li>אם שחר מבטלת שיעור, כל הנרשמות מקבלות הודעה באפליקציה. מי שנרשמה עם שיעור בודד או כרטיסייה, השיעור חוזר אליה.</li>
      </ul>
      <h3>חגים</h3>
      <ul>
        <li>בחגים אין שיעורים, ואין עליהם החזר או זיכוי. המחיר החודשי של המנוי לא משתנה.</li>
        <li>על כל יום בלי שיעור בגלל חג נודיע באפליקציה לפחות 30 יום מראש.</li>
      </ul>
      <h3>כרטיסיות שכבר נרכשו</h3>
      <ul>
        <li>כרטיסייה שנרכשה לפני המעבר למנויים ממשיכה לעבוד עד סוף התוקף שלה, לפי התנאים שבהם נרכשה (כרטיסיית 5: חודשיים, כרטיסיית 10: 4 חודשים).</li>
      </ul>
      <h3>צילום</h3>
      <ul>
        <li>מותר לצלם את עצמך בשיעור. נבקש לא לצלם משתתפות אחרות בלי הסכמתן.</li>
        <li>סרטונים ותמונות שמשתתפות מצלמות ומפרסמות, כולל כאלה שרואים בהם משתתפות אחרות, גם ברקע, הם באחריות מי שצילמה ופרסמה בלבד, ולא באחריות שחר או הסטודיו.</li>
        <li>אם מישהי פרסמה תמונה או סרטון שרואים בו אותך ואת לא מסכימה, אפשר לפנות אליה ישירות ולבקש שתוריד.</li>
      </ul>
      <h3>בריאות ואחריות</h3>
      <ul>
        <li>ההשתתפות באחריותך ובהתאם להצהרת הבריאות שמילאת.</li>
        <li>יש לעדכן את שחר על כל שינוי במצב הבריאותי, לפני השיעור.</li>
      </ul>
      <h3>שינויים</h3>
      <ul>
        <li>שחר יכולה לעדכן את התקנון, את מערכת השעות ואת המחירים. על שינוי חשוב נודיע באפליקציה מראש.</li>
        <li>מחיר של מנוי פעיל לא ישתנה בלי הודעה מראש, ותמיד אפשר לבטל.</li>
      </ul>
    </div>

    <p class="small">למסמכים המלאים: <a href="https://shaneehayutb.github.io/you-legal/#cancel" target="_blank" rel="noopener">תקנון וביטולים</a> · <a href="https://shaneehayutb.github.io/you-legal/#privacy" target="_blank" rel="noopener">מדיניות פרטיות</a> · <a href="https://shaneehayutb.github.io/you-legal/#access" target="_blank" rel="noopener">הצהרת נגישות</a></p>
    <label class="check"><input type="checkbox" id="f-tok" ${f.tok ? 'checked' : ''}> <span>קראתי ואני מאשרת את <b>התקנון</b></span></label>
    <label class="check"><input type="checkbox" id="f-tpriv" ${f.tpriv ? 'checked' : ''}> <span>קראתי ואני מאשרת את <b>מדיניות הפרטיות</b></span></label>

    <label class="field"><span>חתימה: הקלידי את שמך המלא</span><input class="input" id="f-sign" value="${esc(f.sign)}"></label>
    <button class="btn block" data-act="send" ${busy ? 'disabled' : ''}>${busy ? 'שולחת…' : 'שליחה'}</button>
    <p class="tiny muted center" style="margin-bottom:20px">YOU by Shahar · מנחם יקואל 6, בת ים</p>
  </div>`;
  window.scrollTo(0, y);
}

function renderDone() {
  $app.innerHTML = `<div class="stack fade-in center">
    <div class="done-heart">🤍</div>
    <h1>תודה${f.name ? ', ' + esc(f.name.split(' ')[0]) : ''}!</h1>
    <p>הטופס התקבל אצל שחר.</p>
    <p class="tiny muted">נתראה בסטודיו · מנחם יקואל 6, בת ים</p>
  </div>`;
  window.scrollTo(0, 0);
}

function mark(el) { if (!el) return; el.classList.add('f-err'); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); setTimeout(() => el.classList.remove('f-err'), 2500); }

async function send() {
  keepInputs();
  if ((f.name || '').trim().length < 2) { mark(document.getElementById('f-name')); return toast('איך קוראים לך?'); }
  const age = +f.age;
  if (!(age >= 10 && age <= 99)) { mark(document.getElementById('f-age')); return toast('בת כמה את?'); }
  if ((f.phone || '').replace(/\D/g, '').length < 9) { mark(document.getElementById('f-phone')); return toast('מה מספר הטלפון?'); }
  if (!/^\S+@\S+\.\S+$/.test((f.email || '').trim())) { mark(document.getElementById('f-email')); return toast('מה כתובת המייל שלך?'); }
  const miss = f.answers.findIndex(x => x === null);
  if (miss >= 0) { mark(document.getElementById('hq-' + miss)); return toast('נשארו שאלות בלי תשובה בהצהרת הבריאות'); }
  if (age < 18 && (!(f.parent || '').trim() || !f.pok)) { mark(document.getElementById('f-parent')); return toast('צריך הסכמה של הורה'); }
  if (!f.hok) { mark(document.getElementById('f-hok')?.parentElement); return toast('צריך לאשר את הצהרת הבריאות'); }
  if (!f.photo) { mark(document.getElementById('photo-box')); return toast('בחרי מה מתאים לך לגבי צילומים'); }
  if (!f.tok) { mark(document.getElementById('f-tok')?.parentElement); return toast('צריך לאשר את התקנון'); }
  if (!f.tpriv) { mark(document.getElementById('f-tpriv')?.parentElement); return toast('צריך לאשר את מדיניות הפרטיות'); }
  if ((f.sign || '').trim().length < 2) { mark(document.getElementById('f-sign')); return toast('הקלידי את שמך המלא לחתימה'); }
  busy = true; render();
  const { error } = await sb.rpc('submit_intake', { p: {
    full_name: f.name.trim(), age, phone: f.phone.trim(), email: (f.email || '').trim(),
    answers: f.answers, dance: f.dance, details: (f.details || '').trim(),
    parent_name: age < 18 ? f.parent.trim() : null, signature: f.sign.trim(), photo: f.photo, terms_ok: true,
  } });
  busy = false;
  if (error) { render(); return toast('משהו השתבש בשליחה. נסי שוב בעוד רגע, או כתבי לשחר בוואטסאפ'); }
  sent = true; render();
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act;
  if (act === 'send') { e.preventDefault(); return send(); }
  keepInputs();
  if (act === 'yn') { const i = +el.dataset.i; f.answers[i] = el.dataset.v === '1'; }
  if (act === 'dq') { f.dance[el.dataset.i] = el.dataset.v === '1'; }
  if (act === 'photo') { f.photo = el.dataset.v; }
  render();
});
// הגיל קובע אם צריך הסכמת הורה (בלי לצייר מחדש, כדי לא לאבד את המקום בטופס)
document.addEventListener('input', e => {
  if (e.target.id !== 'f-age') return;
  const a = +e.target.value, box = document.getElementById('minor-box');
  if (box) box.style.display = a && a < 18 ? '' : 'none';
});

render();
