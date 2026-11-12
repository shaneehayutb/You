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
  for (const id of ['pok', 'hok', 'tok']) { const el = document.getElementById('f-' + id); if (el) f[id] = el.checked; }
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
      <p>כמה פרטים קצרים לפני השיעור הראשון. לוקח בערך 3 דקות.</p>
    </div>

    <p class="f-step">1 · נעים להכיר</p>
    <label class="field"><span>שם מלא</span><input class="input" id="f-name" value="${esc(f.name)}" autocomplete="name"></label>
    <label class="field"><span>גיל</span><input class="input" id="f-age" type="number" inputmode="numeric" min="14" max="99" value="${esc(f.age)}"></label>
    <label class="field"><span>טלפון</span><input class="input" id="f-phone" type="tel" inputmode="tel" autocomplete="tel" dir="ltr" style="text-align:right" value="${esc(f.phone)}"></label>
    <label class="field"><span>אימייל <small class="muted">(לקבלה)</small></span><input class="input" id="f-email" type="email" autocomplete="email" dir="ltr" style="text-align:right" value="${esc(f.email)}"></label>

    <p class="f-step">2 · הצהרת בריאות</p>
    <p class="muted small">המידע נשמר באופן מאובטח, ורק שחר רואה אותו.</p>
    <div class="card" style="padding:4px 16px">${rows}</div>
    ${anyYes ? `<div class="note warn">ענית "כן" על אחת השאלות. זה לא אומר שאי אפשר לרקוד 🤍 רק צריך אישור קצר מרופא (מהשלושה חודשים האחרונים) שאין מניעה לפעילות גופנית. שלחי אותו לשחר בוואטסאפ לפני השיעור.</div>` : ''}
    <h3 style="margin-top:10px">כדי ששחר תתאים לך את התנועה</h3>
    <p class="muted small">לא משפיע על ההרשמה, רק עוזר לשחר לדעת.</p>
    <div class="card" style="padding:4px 16px">
      ${DANCE.map(d => `<div class="q"><div class="grow">${esc(d.q)}</div>${yn('dq', d.k, f.dance[d.k])}</div>`).join('')}
    </div>
    <label class="field"><span>עוד משהו ששחר כדאי שתדע? (לא חובה)</span><textarea class="input" id="f-details" placeholder="למשל: רגישות בכתף ימין">${esc(f.details)}</textarea></label>
    <div id="minor-box" style="${minor ? '' : 'display:none'}"><div class="card stack"><h3>את מתחת לגיל 18</h3><p class="small muted">צריך גם הסכמה של אחד ההורים.</p>
      <label class="field"><span>שם ההורה</span><input class="input" id="f-parent" value="${esc(f.parent)}"></label>
      <label class="check"><input type="checkbox" id="f-pok" ${f.pok ? 'checked' : ''}> <span>ההורה מאשר/ת את השתתפותי בשיעורי ריקוד</span></label></div></div>
    <label class="check"><input type="checkbox" id="f-hok" ${f.hok ? 'checked' : ''}> <span>קראתי והבנתי את השאלון ומילאתי אותו בעצמי. מסרתי פרטים מלאים ונכונים, ואעדכן את שחר אם יחול שינוי במצבי הבריאותי.</span></label>

    <p class="f-step">3 · התקנון</p>
    <div class="card terms">
      <h3>שיעורים ותוקף</h3>
      <ul>
        <li>שיעור בודד: בתוקף 21 יום. כרטיסיית 5: בתוקף חודשיים. כרטיסיית 10: בתוקף 4 חודשים.</li>
        <li>הכרטיסייה אישית ואינה ניתנת להעברה.</li>
        <li>אפשר לבטל רכישה תוך 14 יום, כל עוד לא השתמשת באף שיעור ממנה, בניכוי דמי ביטול כפי שהחוק מאפשר. אחרי זה אין החזר כספי, והשיעורים שנשארו מחכים לך עד סוף התוקף.</li>
      </ul>
      <h3>ביטולים</h3>
      <ul>
        <li>ביטול עד ${CANCEL_HOURS} שעות לפני השיעור: השיעור חוזר לכרטיסייה במלואו.</li>
        <li>ביטול בפחות מ-${CANCEL_HOURS} שעות לפני השיעור: השיעור נספר מהכרטיסייה.</li>
        <li>אי-הגעה או איחור: השיעור נספר מהכרטיסייה.</li>
        <li>שיעור שבוטל בזמן חוזר לכרטיסייה, ולא כהחזר כספי.</li>
        <li>אם שחר מבטלת שיעור, הוא חוזר לכרטיסייה של כל המשתתפות.</li>
      </ul>
      <h3>צילום</h3>
      <ul><li>מותר לצלם את עצמך בשיעור. סרטונים ותמונות שמשתתפות מצלמות בעצמן, והפרסום שלהם, הם באחריותן בלבד.</li></ul>
      <h3>בריאות ואחריות</h3>
      <ul><li>ההשתתפות באחריותך ובהתאם להצהרת הבריאות שמילאת.</li><li>יש לעדכן על כל שינוי במצב הבריאותי.</li></ul>
    </div>

    <div class="card stack" id="photo-box">
      <h3>צילומים בשיעורים 📷</h3>
      <p class="small">${PHOTO_TEXT}</p>
      <div class="stack" style="gap:8px">
        <button type="button" class="chip ${f.photo === 'yes' ? 'on' : ''}" style="text-align:right;justify-content:flex-start;width:100%" data-act="photo" data-v="yes">אני בעניין, אפשר לצלם אותי 🤍</button>
        <button type="button" class="chip ${f.photo === 'no' ? 'on' : ''}" style="text-align:right;justify-content:flex-start;width:100%" data-act="photo" data-v="no">אני מעדיפה לא להצטלם</button>
      </div>
      <p class="tiny muted">${PHOTO_FINE}${minor ? ' מתחת לגיל 18: ההורה שאישר/ה את ההשתתפות מאשר/ת גם את הבחירה הזו.' : ''}</p>
    </div>
    <p class="small">למסמכים המלאים: <a href="https://shaneehayutb.github.io/you-legal/#cancel" target="_blank" rel="noopener">ביטולים והחזרים</a> · <a href="https://shaneehayutb.github.io/you-legal/#privacy" target="_blank" rel="noopener">מדיניות פרטיות</a></p>
    <label class="check"><input type="checkbox" id="f-tok" ${f.tok ? 'checked' : ''}> <span>קראתי ואני מאשרת את התקנון ואת מדיניות הפרטיות</span></label>

    <label class="field"><span>חתימה: הקלידי את שמך המלא</span><input class="input" id="f-sign" value="${esc(f.sign)}"></label>
    <button class="btn block" data-act="send" ${busy ? 'disabled' : ''}>${busy ? 'שולחת…' : 'שליחה'}</button>
    <p class="tiny muted center" style="margin-bottom:20px">YOU by Shahar · מנחם יקואל 6, בת ים</p>
  </div>`;
  window.scrollTo(0, y);
}

function renderDone() {
  const msg = encodeURIComponent(`היי שחר 🤍 מילאתי את טופס ההרשמה${f.name ? ` (${f.name})` : ''}, והנה אישור התשלום בביט:`);
  const anyYes = f.answers.some(x => x === true);
  $app.innerHTML = `<div class="stack fade-in center">
    <div class="done-heart">🤍</div>
    <h1>תודה${f.name ? ', ' + esc(f.name.split(' ')[0]) : ''}!</h1>
    <p>הטופס התקבל אצל שחר.</p>
    <div class="card stack" style="text-align:right">
      <h3>מה עכשיו?</h3>
      <p class="small">1. מעבירות את התשלום בביט לשחר: <b dir="ltr">054-554-3035</b></p>
      <p class="small">2. שולחות לשחר צילום של אישור התשלום בוואטסאפ${anyYes ? ', יחד עם האישור הרפואי' : ''}.</p>
      <p class="small">3. שחר תאשר לך את השיעור 💃</p>
    </div>
    <a class="btn block" href="https://wa.me/${WHATSAPP}?text=${msg}" target="_blank" rel="noopener">💬 שליחה לשחר בוואטסאפ</a>
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
  const miss = f.answers.findIndex(x => x === null);
  if (miss >= 0) { mark(document.getElementById('hq-' + miss)); return toast('נשארו שאלות בלי תשובה בהצהרת הבריאות'); }
  if (DANCE.some(d => f.dance[d.k] == null)) return toast('נשארו שאלות בלי תשובה בהתאמת התנועה');
  if (age < 18 && (!(f.parent || '').trim() || !f.pok)) { mark(document.getElementById('f-parent')); return toast('צריך הסכמה של הורה'); }
  if (!f.hok) { mark(document.getElementById('f-hok')?.parentElement); return toast('צריך לאשר את הצהרת הבריאות'); }
  if (!f.photo) { mark(document.getElementById('photo-box')); return toast('בחרי מה מתאים לך לגבי צילומים'); }
  if (!f.tok) { mark(document.getElementById('f-tok')?.parentElement); return toast('צריך לאשר את התקנון'); }
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
