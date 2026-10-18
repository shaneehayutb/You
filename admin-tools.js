/* ============================================================
   כלי הניהול של שחר (בתוך האפליקציה, במצב ניהול).
   נטען אחרי app.js ומשתמש באותו מצב (S, ui) ובאותן פונקציות.
   בהדגמה: נתונים לדוגמה במכשיר. במצב חי: הכול דרך השרת (API ב-live.js).
   ============================================================ */

/* ---------- עזרים ---------- */
const DAY = 864e5;
const waLink = (phone, text = '') => {
  let d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('0')) d = '972' + d.slice(1);
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};
const firstName = n => String(n || '').trim().split(' ')[0];
const HEALTH_LABELS = { joints: 'מפרקים', surgery: 'ניתוח', pregnant: 'הריון' };
/** צילום: מסמנים רק מי שלא מצטלמת או רק בלי פנים (ומי שעוד לא בחרה) */
const photoBadge = p => p === 'no' ? '<span class="tag warn">🚫 לא מצטלמת</span>' : !p ? '<span class="tag">📷 עוד לא בחרה</span>' : '';
const healthBadges = h => !h ? '<span class="tag warn">אין הצהרה</span>'
  : [...Object.keys(HEALTH_LABELS).filter(k => h.dance?.[k]).map(k => `<span class="tag rose">${HEALTH_LABELS[k]}</span>`),
     h.needsCert && !h.cert ? '<span class="tag warn">חסר אישור רפואי</span>' : ''].join(' ');

/* ---------- נתוני תלמידות לדוגמה (רק בהדגמה) ---------- */
function ensureDemoStudents() {
  if (LIVE || S.students) return;
  const last = ['כהן', 'לוי', 'מזרחי', 'פרץ', 'ביטון', 'אברהם', 'פרידמן', 'שפירא', 'דהן', 'אזולאי', 'גבאי', 'חדד', 'עמר', 'סויסה'];
  const heard = ['אינסטגרם', 'חברה המליצה', 'אינסטגרם', 'אחר'];
  S.students = OTHER_NAMES.map((n, i) => {
    const prod = CONFIG.products[i % 3];
    const at = now() - (3 + ((i * 11) % 40)) * DAY;
    const remaining = [3, 1, 4, 6, 2, 8, 0, 4, 2, 5, 2, 7, 3, 1][i];
    const expiresAt = i === 8 ? now() - 5 * DAY : i === 2 ? now() + 6 * DAY : Math.max(at + prod.days * DAY, now() + 12 * DAY);
    return {
      id: 'st' + i, name: `${n} ${last[i]}`, phone: `05${2 + (i % 3)}-${String(4000000 + i * 137731).slice(0, 7)}`,
      age: 24 + ((i * 7) % 30), joinedAt: i % 5 === 0 ? now() - (2 + i) * DAY : at - 20 * DAY, heard: heard[i % 4], blocked: false, photo: i % 6 === 1 ? 'no' : 'yes',
      attended: i % 7 === 6 ? 0 : 3 + ((i * 5) % 22), lastAt: i % 7 === 6 ? null : now() - ((i * 9) % 40) * DAY, first: i % 7 === 6,
      health: i === 11 ? null : {
        dance: { joints: i % 5 === 1, surgery: i % 6 === 3, pregnant: i === 2 },
        needsCert: i === 4 || i === 9, cert: i === 9 ? { at: now() } : null,
        validUntil: now() + (300 - i * 10) * DAY,
      },
      purchases: [{ id: 'sp' + i, name: prod.name, credits: prod.credits, remaining: Math.min(remaining, prod.credits), price: prod.price, at, expiresAt }],
    };
  });
  S.att = S.att || {};
  addDemoHistory();
  save();
}

/** היסטוריית רכישות לדוגמה (שנה אחורה, במגמת עלייה) כדי שמסך ההכנסות יראה משהו */
function addDemoHistory() {
  if (LIVE || S._hist) return;
  const names = { single: 'שיעור בודד', five: 'כרטיסיית 5', ten: 'כרטיסיית 10' };
  S.students.forEach((st, i) => {
    for (let m = 1; m <= 11; m++) {
      if ((i * 7 + m * 3) % 10 < 4 + Math.floor((11 - m) / 3)) {
        const prod = CONFIG.products[(i + m) % 3];
        const d = new Date(); d.setDate(3 + ((i * 5 + m) % 24)); d.setMonth(d.getMonth() - m);
        st.purchases.push({ id: `h${i}-${m}`, name: names[prod.id] || prod.name, productId: prod.id, credits: prod.credits, remaining: 0, price: prod.price, at: d.getTime(), expiresAt: d.getTime() + prod.days * DAY });
      }
    }
    if (i % 4 === 0) { const d = new Date(); d.setDate(2); d.setMonth(d.getMonth() - (i % 3)); st.purchases.push({ id: `m${i}`, name: '2 שיעורים (הוספה ידנית)', credits: 2, remaining: 0, price: 0, at: d.getTime(), expiresAt: d.getTime() + 30 * DAY, note: 'שילמה בביט' }); }
  });
  S._hist = true;
}

/** מי רשומה לשיעור: בחי מהשרת, בהדגמה תלמידות לדוגמה לפי מספר הרשומות */
function rosterFor(c) {
  if (LIVE) return (ui.sheet?.roster || []).map(r => ({
    id: r.user_id, bookingId: r.id, name: r.name, phone: r.phone, photo: r.photo, health: r.health, first: r.first,
    attended: r.status === 'attended' ? true : r.status === 'no_show' ? false : null,
  }));
  ensureDemoStudents();
  const idx = S.classes.indexOf(c), list = S.students.filter(s => !s.blocked);
  const out = [];
  for (let k = 0; k < Math.min(c.others, list.length); k++) out.push(list[(idx * 3 + k) % list.length]);
  const att = S.att?.[c.id] || {};
  return out.map(s => ({ ...s, first: s.first && c.start > now(), bookingId: s.id, attended: att[s.id] ?? null }));
}

/** הכנסות החודש (₪) */
function allPurchases() {
  return LIVE ? (S.adminData?.purchases || []) : [...S.purchases, ...(ensureDemoStudents(), addDemoHistory(), S.students || []).flatMap(s => s.purchases)];
}
const monthStart = (back = 0) => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); d.setMonth(d.getMonth() - back); return d.getTime(); };
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

/** הכנסה נטו בטווח: רכישות ששולמו פחות זיכויים שבוצעו באותו טווח (זיכוי נספר בחודש שבו נעשה) */
const refundsBetween = (all, from, to) => all.filter(p => p.refunded > 0 && p.refundedAt >= from && p.refundedAt < to).reduce((t, p) => t + p.refunded, 0);
function incomeBetween(from, to) {
  const all = allPurchases();
  return all.filter(p => p.price > 0 && p.at >= from && p.at < to).reduce((t, p) => t + p.price, 0) - refundsBetween(all, from, to);
}

/** הכנסות לפי חודש: 12 חודשים אחורה, מהישן לחדש */
function revenueByMonth() {
  const all = allPurchases();
  return Array.from({ length: 12 }, (_, k) => {
    const back = 11 - k, from = monthStart(back), to = monthStart(back - 1);
    const ps = all.filter(p => p.at >= from && p.at < to);
    const paid = ps.filter(p => p.price > 0), manual = ps.filter(p => !(p.price > 0));
    const byName = {};
    for (const p of paid) { const n = p.credits === 1 ? 'שיעור בודד' : p.name; byName[n] = (byName[n] || 0) + 1; }
    const held = heldClasses(from, to);
    const rent = held.length * studioRate();
    const fixed = Math.round(fixedFor(from));
    const refunds = refundsBetween(all, from, to);
    const total = paid.reduce((s, p) => s + p.price, 0) - refunds;
    return { refunds, from, label: MONTHS[new Date(from).getMonth()], year: new Date(from).getFullYear(),
      total, rent, fixed, held: held.length, net: total - rent - fixed, count: paid.length, byName,
      manual: manual.length, manualLessons: manual.reduce((s, p) => s + p.credits, 0) };
  });
}
/** תשלום לסטודיו על כל שיעור שהתקיים (₪) — ניתן לשינוי בהגדרות */
const studioRate = () => +(S.studioRate ?? CONFIG.studioRatePerHour ?? 130);
/** שיעורים שמשלמים עליהם לסטודיו: כל שיעור שמועדו עבר, כולל שיעורים שבוטלו (ליתר ביטחון) */
function heldClasses(from, to) {
  const list = LIVE ? (S.adminData?.classes || []) : S.classes;
  return list.filter(c => c.start >= from && c.start < to && c.start <= now());
}
/** הוצאות קבועות: חודשיות, או שנתיות שמתחלקות ל-12. נספרות מהחודש שבו נוספו */
const DEFAULT_EXPENSES = [
  { id: 'apple', name: 'Apple (חשבון מפתחת)', amount: 365, period: 'year', since: monthStart(0) },
  { id: 'claude', name: 'Claude', amount: 70, period: 'month', since: monthStart(0) },
];
const fixedExpenses = () => S.fixedExpenses || DEFAULT_EXPENSES;
const monthlyCost = e => e.period === 'year' ? e.amount / 12 : e.amount;
const fixedFor = from => fixedExpenses().filter(e => !e.since || e.since <= from).reduce((t, e) => t + monthlyCost(e), 0);
function monthRevenue() { return revenueByMonth()[11].total.toLocaleString('he-IL'); }

function students() {
  if (LIVE) return S.adminData?.students || [];
  ensureDemoStudents();
  return S.students;
}
const activeCard = s => s.purchases.filter(p => p.remaining > 0 && p.expiresAt > now()).sort((a, b) => a.expiresAt - b.expiresAt)[0];

/** מי צריכה תשומת לב: כרטיסייה נגמרת, פג תוקף, חסר אישור רפואי */
function attention() {
  const out = [];
  for (const s of students()) {
    if (s.blocked) continue;
    const card = activeCard(s);
    const fn = firstName(s.name);
    if (s.health?.needsCert && !s.health.cert) out.push({ s, why: 'חסר אישור רפואי', msg: `היי ${fn} 🤍 רק תזכורת להעלות לאפליקציה אישור רפואי לפני השיעור הבא` });
    else if (card && card.remaining <= 1) out.push({ s, why: card.remaining ? 'נשאר שיעור אחד בכרטיסייה' : 'הכרטיסייה נגמרה', msg: `היי ${fn} 🤍 ראיתי שהכרטיסייה שלך כמעט נגמרה. אפשר לחדש באפליקציה מתי שנוח לך` });
    else if (card && card.expiresAt - now() < 10 * DAY) out.push({ s, why: `הכרטיסייה פגה ב-${fmtDate(card.expiresAt)} (נשארו ${card.remaining})`, msg: `היי ${fn} 🤍 הכרטיסייה שלך בתוקף עד ${fmtDate(card.expiresAt)}, ונשארו בה ${card.remaining} שיעורים. מחכה לך בשיעור!` });
    else if (!card && s.lastAt > now() - 45 * DAY) out.push({ s, why: 'אין כרטיסייה פעילה', msg: `היי ${fn} 🤍 מתגעגעת! מתי חוזרת לרקוד?` });
  }
  return out;
}

/* ---------- לשונית "לקוחות" ---------- */
function adminEnsureLoaded() {
  if (LIVE && !S.adminData && !S._adminLoading) {
    S._adminLoading = true;
    API.adminLoad().then(d => { S.adminData = d; }).catch(e => toast(errHe(e))).finally(() => { S._adminLoading = false; render(); });
  }
}

function vClients() {
  adminEnsureLoaded();
  const list = students(), att = attention(), q = (ui.clientQ || '').trim();
  const loading = LIVE && !S.adminData;
  const m0 = new Date(); m0.setDate(1); m0.setHours(0, 0, 0, 0);
  const active = list.filter(s => !s.blocked && activeCard(s)).length;
  const fresh = list.filter(s => s.joinedAt >= m0.getTime()).length;
  const shown = list.filter(s => !q || s.name.includes(q) || String(s.phone).replace(/\D/g, '').includes(q.replace(/\D/g, '') || '§'))
    .sort((a, b) => a.name.localeCompare(b.name, 'he'));
  return `${header('לקוחות')}
    <div class="stats">
      <div class="card center"><p class="muted small">כל הלקוחות</p><h2>${list.length}</h2></div>
      <div class="card center"><p class="muted small">עם כרטיסייה פעילה</p><h2>${active}</h2></div>
      <div class="card center"><p class="muted small">חדשות החודש</p><h2>${fresh}</h2></div>
    </div>
    <button class="btn block soft" style="margin-top:14px" data-act="adBroadcast">✉️ הודעה לכל הלקוחות</button>

    <div class="section-title"><h2>דורש תשומת לב</h2></div>
    ${att.length ? `<div class="card" style="padding:4px 18px">${att.slice(0, 6).map(({ s, why, msg }) => `
      <div class="list-row">
        <button class="grow plain" data-act="adStudent" data-id="${s.id}"><b>${esc(s.name)}</b><p class="tiny muted">${esc(why)}</p></button>
        <a class="btn sm ghost" href="${waLink(s.phone, msg)}" target="_blank" rel="noopener">וואטסאפ</a>
      </div>`).join('')}</div>`
      : `<div class="card muted center small">${loading ? 'טוען…' : 'הכול בסדר, אין מה לטפל בו כרגע 🤍'}</div>`}

    <div class="section-title"><h2>כל הלקוחות</h2></div>
    <input class="input" id="cl-q" data-search="clients" value="${esc(q)}" placeholder="חיפוש לפי שם או טלפון">
    <div class="card" style="padding:2px 14px;margin-top:12px">
      ${shown.map(s => { const card = activeCard(s); return `<button class="list-row plain" data-act="adStudent" data-id="${s.id}" style="width:100%">
        <div class="grow"><b>${esc(s.name)}</b>${s.blocked ? ' <span class="tag warn">חסומה</span>' : ''}
          <p class="tiny muted">${card ? `${card.remaining} שיעורים · עד ${fmtDate(card.expiresAt)}` : 'אין כרטיסייה פעילה'}</p></div>
        <span class="muted">‹</span></button>`; }).join('') || `<p class="muted small" style="padding:12px 0">${loading ? 'טוען…' : 'לא נמצאו לקוחות'}</p>`}
    </div>`;
}

/* ---------- גיליונות ---------- */
function shAdminClass2({ id }) {
  const c = cls(id);
  const past = c.start < now() + 60 * 60e3;
  const roster = rosterFor(c);
  const songs = c.songs || [];
  return `<div class="stack">
    <div class="row between"><div><p class="muted small">${fmtDay(c.start)} · ${fmtTime(c.start)}</p><h1>${esc(c.title)}</h1>${c.note ? `<p class="small" style="color:var(--rose-deep)">${esc(c.note)}</p>` : ''}</div>
      ${c.cancelled ? '' : `<button class="btn sm ghost" data-act="adEditClass" data-id="${c.id}">עריכה</button>`}</div>

    <div class="row between"><h3>${past ? 'נוכחות' : 'רשומות'} (${roster.length}/${c.cap})</h3>
      ${past && !c.cancelled && roster.some(r => r.attended !== true) ? `<button class="btn sm soft" data-act="adAttendAll" data-id="${c.id}">✓ כולן הגיעו</button>` : ''}</div>
    ${past && !c.cancelled && roster.length ? '<p class="tiny muted" style="margin-top:-4px">מסמנים ✓ למי שהגיעה ו-✕ למי שלא. אפשר "כולן הגיעו" ואז לתקן רק את מי שחסרה.</p>' : ''}
    <div class="card" style="padding:2px 14px;margin:0">
      ${roster.map(r => `<div class="list-row">
        <div class="grow"><b>${esc(r.name)}</b><div class="tags">${r.first ? '<span class="tag first">פעם ראשונה ✨</span>' : ''}${photoBadge(r.photo)}${healthBadges(r.health)}</div></div>
        ${past && !c.cancelled ? `<div class="att">
          <button class="${r.attended === true ? 'on' : ''}" data-act="adAttend" data-id="${c.id}" data-b="${r.bookingId}" data-v="1" aria-label="הגיעה">✓</button>
          <button class="${r.attended === false ? 'on no' : ''}" data-act="adAttend" data-id="${c.id}" data-b="${r.bookingId}" data-v="0" aria-label="לא הגיעה">✕</button>
        </div>` : ''}
      </div>`).join('') || '<p class="muted small" style="padding:12px 0">עוד אין רשומות</p>'}
    </div>

    ${!c.cancelled && roster.length ? `<h3>הודעה לרשומות לשיעור</h3>
    <p class="tiny muted" style="margin-top:4px">תגיע רק ל-${roster.length} הרשומות, כהודעה באפליקציה וכהתראה בטלפון. למשל: "מביאות היום מגבת קטנה 🤍"</p>
    <textarea class="input" id="cm-body" rows="2" placeholder="מה רוצה לעדכן?"></textarea>
    <button class="btn block soft" data-act="adClassMsg" data-id="${c.id}">שליחה ל-${roster.length} ${roster.length === 1 ? 'רשומה' : 'רשומות'}</button>` : ''}

    <h3>🎵 השירים מהשיעור</h3>
    <p class="tiny muted" style="margin-top:4px">יופיעו לכל מי שהייתה בשיעור, ב"המסע שלי"${past ? '' : ' (אחרי השיעור)'}</p>
    ${songs.length ? `<div class="card" style="padding:2px 14px;margin:8px 0 0">${songs.map((sg, i) => `<div class="list-row">
        <span class="song-n">${i + 1}</span>
        <div class="grow"><b>${esc(sg.title)}</b>${sg.artist ? `<p class="tiny muted">${esc(sg.artist)}</p>` : ''}</div>
        <button class="btn sm ghost" data-act="adSongDel" data-id="${c.id}" data-i="${i}" aria-label="הסרת השיר">הסרה</button>
      </div>`).join('')}</div>` : ''}
    <div class="row">
      <label class="field grow"><span>שם השיר</span><input class="input" id="sg-title"></label>
      <label class="field grow"><span>אמן/ית</span><input class="input" id="sg-artist"></label>
    </div>
    <label class="field"><span>קישור לספוטיפיי (לא חובה)</span><input class="input" id="sg-url" dir="ltr" placeholder="https://open.spotify.com/track/…"></label>
    <button class="btn block soft" data-act="adSongAdd" data-id="${c.id}">+ הוספת שיר</button>

    ${c.cancelled ? '<div class="note warn">השיעור בוטל</div>' : c.start > now() ? `
      <button class="btn block ghost" data-act="adminCancel" data-id="${c.id}" style="color:var(--rose-deep)">ביטול השיעור (מחזיר לכולן לכרטיסייה)</button>` : ''}
  </div>`;
}

function shEditClass({ id }) {
  const c = cls(id), d = new Date(c.start);
  return `<div class="stack">
    <h1>עריכת שיעור</h1>
    <p class="muted small">${fmtDay(c.start)} · ${fmtTime(c.start)}</p>
    <label class="field"><span>שם השיעור</span><input class="input" id="ec-title" value="${esc(c.title)}"></label>
    <label class="field"><span>הערה ללקוחות (לא חובה)</span><input class="input" id="ec-note" value="${esc(c.note || '')}" placeholder="למשל: רמת מתחילות"></label>
    <div class="row">
      <label class="field grow"><span>תאריך</span><input class="input" id="ec-date" type="date" value="${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}"></label>
      <label class="field grow"><span>שעה</span><input class="input" id="ec-time" type="time" value="${fmtTime(c.start)}"></label>
    </div>
    <label class="field"><span>מקומות</span><input class="input" id="ec-cap" type="number" value="${c.cap}"></label>
    ${c.seriesId ? `<div class="card" style="margin:0;padding:6px 14px">
      <label class="check" style="margin:6px 0"><input type="radio" name="ec-scope" value="one" checked> <span>רק השיעור של ${fmtDate(c.start)}</span></label>
      <label class="check" style="margin:6px 0"><input type="radio" name="ec-scope" value="all"> <span>כל השיעורים הקבועים של יום ${dayNames[d.getDay()]} ${fmtTime(c.start)}, מהתאריך הזה והלאה</span></label>
      <p class="tiny muted">"כל השיעורים" משנה שם, הערה ומקומות. שינוי של תאריך או שעה חל רק על השיעור הזה.</p>
    </div>` : '<p class="tiny muted">הרשומות יקבלו הודעה אם השעה משתנה.</p>'}
    <button class="btn block" data-act="adSaveClass" data-id="${c.id}">שמירה</button>
  </div>`;
}

function shBroadcast() {
  const n = students().filter(s => !s.blocked).length;
  return `<div class="stack">
    <h1>הודעה לכל הלקוחות</h1>
    <p class="muted small">ההודעה תופיע אצל ${n} לקוחות במסך הבית של האפליקציה.</p>
    <label class="field"><span>כותרת</span><input class="input" id="bc-title" placeholder="השבוע נרקוד עם עקבים 👠"></label>
    <label class="field"><span>ההודעה</span><textarea class="input" id="bc-body" rows="4" placeholder="תביאו נעלי עקב נוחות ובקבוק מים 🤍"></textarea></label>
    <button class="btn block" data-act="adSend">שליחה</button>
  </div>`;
}

function shStudents() {
  const q = (ui.sheet.q || '').trim();
  const list = students().filter(s => !q || s.name.includes(q) || String(s.phone).replace(/\D/g, '').includes(q.replace(/\D/g, '') || '§'))
    .sort((a, b) => a.name.localeCompare(b.name, 'he'));
  return `<div class="stack">
    <h1>תלמידות</h1>
    <input class="input" id="st-q" data-search="students" value="${esc(q)}" placeholder="חיפוש לפי שם או טלפון">
    <div class="card" style="padding:2px 14px;margin-top:12px">
      ${list.map(s => { const card = activeCard(s); return `<button class="list-row plain" data-act="adStudent" data-id="${s.id}" style="width:100%">
        <div class="grow"><b>${esc(s.name)}</b>${s.blocked ? ' <span class="tag warn">חסומה</span>' : ''}
          <p class="tiny muted">${card ? `${card.remaining} שיעורים · עד ${fmtDate(card.expiresAt)}` : 'אין כרטיסייה פעילה'}</p></div>
        <span class="muted">‹</span></button>`; }).join('') || '<p class="muted small" style="padding:12px 0">לא נמצאו תלמידות</p>'}
    </div>
  </div>`;
}

function shStudent({ id }) {
  const s = students().find(x => x.id === id);
  if (!s) return '<p class="muted">התלמידה לא נמצאה</p>';
  const h = s.health;
  return `<div class="stack">
    <div><h1>${esc(s.name)}</h1><p class="muted small">${s.age ? `בת ${s.age} · ` : ''}הצטרפה ב-${fmtDate(s.joinedAt)}${s.heard ? ` · הגיעה דרך ${esc(s.heard)}` : ''}</p></div>
    <div class="row" style="gap:8px">
      <a class="btn sm" href="${waLink(s.phone)}" target="_blank" rel="noopener">וואטסאפ</a>
      <span class="small muted" dir="ltr">${esc(s.phone)}</span>
    </div>
    <div class="row" style="gap:12px">
      <div class="card grow center" style="margin:0"><p class="muted small">שיעורים שרקדה</p><h2>${s.attended || 0}</h2></div>
      <div class="card grow center" style="margin:0"><p class="muted small">שיעור אחרון</p><h2 style="font-size:20px">${s.lastAt ? fmtDate(s.lastAt) : '—'}</h2></div>
    </div>

    <h3>צילומים</h3>
    <div class="card" style="margin:0"><div class="tags">${photoBadge(s.photo) || '<span class="tag green">📷 מאשרת צילום ושיתוף</span>'}</div></div>

    <h3>בריאות</h3>
    <div class="card" style="margin:0">${h ? `<div class="tags">${healthBadges(h) || '<span class="tag green">ללא הערות</span>'}</div>
      <p class="tiny muted" style="margin-top:6px">הצהרה בתוקף עד ${fmtDate(h.validUntil)}${h.cert ? ' · אישור רפואי התקבל' : ''}</p>` : '<span class="tag warn">עוד לא מילאה הצהרת בריאות</span>'}</div>

    <h3>כרטיסיות</h3>
    ${s.purchases.length ? [...s.purchases].sort((a, b) => b.at - a.at).map(p => {
      const active = p.remaining > 0 && p.expiresAt > now();
      return `<div class="card" style="margin:0">
        <div class="row between"><b>${esc(p.name)}</b>${active ? '<span class="tag green">פעילה</span>' : '<span class="tag">הסתיימה</span>'}</div>
        <p class="small muted" style="margin-top:4px">${p.remaining}/${p.credits} נותרו · בתוקף עד ${fmtDate(p.expiresAt)}${p.price > 0 ? ` · שולם ${p.price} ₪` : ''}${p.note ? ` · ${esc(p.note)}` : ''}</p>
        ${p.refunded > 0 ? `<p class="small" style="margin-top:4px;color:var(--rose-deep)">זוכה ${p.refunded} ₪ · ${fmtDate(p.refundedAt)}</p>` : ''}
        ${p.takbull && p.price > 0 && p.refunded < p.price ? `<div class="row" style="gap:6px;margin-top:8px;flex-wrap:wrap">
          <button class="btn sm ghost" data-act="adRefund" data-id="${s.id}" data-p="${p.id}">זיכוי דרך תקבול</button>
          <button class="btn sm ghost" data-act="adRefund" data-mark="1" data-id="${s.id}" data-p="${p.id}">כבר זיכיתי באתר של תקבול</button></div>` : ''}
        <div class="row" style="gap:6px;margin-top:8px"><span class="tiny muted">הארכת תוקף:</span>
          ${[7, 14, 30].map(d => `<button class="btn sm ghost" data-act="adExtend" data-id="${s.id}" data-p="${p.id}" data-d="${d}">+${d} יום</button>`).join('')}</div>
      </div>`; }).join('') : '<div class="card muted center small" style="margin:0">אין כרטיסיות</div>'}

    <h3>הוספת שיעורים ידנית</h3>
    <p class="tiny muted" style="margin-top:4px">למשל כששילמה במזומן או בביט, או כמתנה. היא תקבל הודעה באפליקציה.</p>
    <div class="row">
      <label class="field grow"><span>כמה שיעורים</span><input class="input" id="gc-n" type="number" min="1" value="1"></label>
      <label class="field grow"><span>בתוקף (ימים)</span><input class="input" id="gc-days" type="number" min="1" value="30"></label>
    </div>
    <label class="field"><span>הערה (רק את רואה)</span><input class="input" id="gc-note" placeholder="שילמה בביט"></label>
    <button class="btn block soft" data-act="adGrant" data-id="${s.id}">הוספה</button>

    <button class="btn block ghost" data-act="adBlock" data-id="${s.id}" style="color:var(--rose-deep)">${s.blocked ? 'ביטול החסימה' : 'חסימה (לא תוכל להירשם לשיעורים)'}</button>
  </div>`;
}

/* ---------- לשונית "פרופיל" של שחר ---------- */
const NOTIFY = [
  ['booked', 'מישהי נרשמה לשיעור'],
  ['cancelled', 'מישהי ביטלה הרשמה'],
  ['newClient', 'לקוחה חדשה הצטרפה'],
  ['cardEnding', 'כרטיסייה של לקוחה נגמרת'],
];
const notifyPrefs = () => ({ booked: true, cancelled: true, newClient: true, cardEnding: false, ...(S.adminNotify || {}) });

function vAdminProfile() {
  const d = { ...CONFIG.directions, ...(S.directions || {}) };
  const np = notifyPrefs();
  return `${header('הפרופיל שלי')}
    <div class="card row">
      <div class="avatar" style="width:52px;height:52px;font-size:22px">ש</div>
      <div class="grow"><h3>שחר שני</h3><p class="small muted">מנהלת · YOU by Shahar</p></div>
    </div>

    <div class="section-title"><h2>פרטי העסק</h2></div>
    <div class="card stack" style="margin:0">
      <label class="field"><span>וואטסאפ ללקוחות</span><input class="input" id="bz-wa" type="tel" dir="ltr" style="text-align:right" value="${esc(S.whatsapp || CONFIG.whatsapp)}"></label>
      <button class="btn block soft" data-act="adSaveWa">שמירה</button>
    </div>

    <div class="section-title"><h2>איך מגיעים</h2></div>
    <div class="card stack" style="margin:0">
      <label class="field"><span>כתובת</span><input class="input" id="dr-address" value="${esc(d.address)}"></label>
      <div class="row">
        <label class="field grow"><span>קומה</span><input class="input" id="dr-floor" value="${esc(d.floor)}"></label>
        <label class="field grow"><span>דלת</span><input class="input" id="dr-door" value="${esc(d.door)}"></label>
        <label class="field grow"><span>קוד כניסה</span><input class="input" id="dr-code" value="${esc(d.code)}" dir="ltr"></label>
      </div>
      <button class="btn block soft" data-act="adSaveDirections">שמירת פרטי ההגעה</button>
    </div>

    <div class="section-title"><h2>מחירים</h2></div>
    <div class="card stack" style="margin:0">
      ${CONFIG.products.map((p, i) => `<div>
        <b>${esc(p.name)}</b>
        <div class="row" style="margin-top:6px">
          <label class="field grow"><span>מחיר (₪)</span><input class="input" id="pr-price-${i}" type="number" value="${p.price}"></label>
          <label class="field grow"><span>שיעורים</span><input class="input" id="pr-credits-${i}" type="number" value="${p.credits}"></label>
          <label class="field grow"><span>תוקף (ימים)</span><input class="input" id="pr-days-${i}" type="number" value="${p.days}"></label>
        </div></div>`).join('')}
      <button class="btn block soft" data-act="adSavePrices">שמירת המחירים</button>
    </div>

    <div class="section-title"><h2>הוצאות</h2></div>
    <div class="card stack" style="margin:0">
      <label class="field"><span>תשלום לסטודיו על כל שיעור (₪)</span><input class="input" id="st-rate" type="number" value="${studioRate()}"></label>
      <p class="tiny muted">נספר על כל שיעור, בלי קשר לאורך שלו או לכמה הגיעו. כרגע גם שיעור שבוטל נספר.</p>
      <button class="btn block soft" data-act="adSaveRate">שמירה</button>
      <hr>
      <b>הוצאות קבועות</b>
      <p class="tiny muted">הוצאה שנתית מתחלקת ל-12 ויורדת כל חודש.</p>
      <div>${fixedExpenses().map(e => `<div class="list-row">
        <div class="grow"><b>${esc(e.name)}</b><p class="tiny muted">${e.amount.toLocaleString('he-IL')} ₪ ${e.period === 'year' ? `לשנה · ${Math.round(e.amount / 12)} ₪ לחודש` : 'לחודש'}</p></div>
        <button class="btn sm ghost" data-act="adExpDel" data-id="${e.id}">הסרה</button></div>`).join('') || '<p class="muted small">אין הוצאות קבועות</p>'}</div>
      <label class="field"><span>שם ההוצאה</span><input class="input" id="ex-name" placeholder="ביטוח"></label>
      <div class="row">
        <label class="field grow"><span>סכום (₪)</span><input class="input" id="ex-amount" type="number"></label>
        <label class="field grow"><span>כל</span><select class="input" id="ex-period"><option value="month">חודש</option><option value="year">שנה</option></select></label>
      </div>
      <button class="btn block soft" data-act="adExpAdd">+ הוספת הוצאה</button>
    </div>

    <div class="section-title"><h2>הטקסטים שלי</h2></div>
    <div class="card stack" style="margin:0">
      <label class="field"><span>המשפט במסך הפתיחה</span><textarea class="input" id="tx-quote" rows="3">${esc(txt('welcomeQuote'))}</textarea></label>
      <label class="field"><span>ההודעה למי שנרשמת לשיעור הראשון</span><textarea class="input" id="tx-first" rows="6">${esc(txt('firstLetter'))}</textarea></label>
      <button class="btn block soft" data-act="adSaveTexts">שמירת הטקסטים</button>
      <button class="btn block ghost" data-act="adPreviewFirst">איך זה נראה אצל הלקוחה?</button>
    </div>

    <div class="section-title"><h2>התראות אלייך</h2></div>
    <div class="card" style="padding:4px 18px;margin:0">
      ${NOTIFY.map(([k, label]) => `<div class="list-row"><span class="grow">${label}</span>
        <button class="switch ${np[k] ? 'on' : ''}" data-act="adNotify" data-k="${k}" aria-label="${label}"></button></div>`).join('')}
    </div>
    <p class="tiny muted" style="margin:8px 4px 0">ההתראות יתחילו להגיע לטלפון אחרי שנחבר התראות (push).</p>

    <div class="section-title"><h2>עוד</h2></div>
    <div class="card" style="padding:4px 18px;margin:0">
      <button class="list-row plain" data-act="legal" data-id="privacy" style="width:100%"><span class="grow">מדיניות פרטיות, ביטולים ותמיכה</span><span class="muted">‹</span></button>
      <button class="list-row plain" data-act="adViewClient" style="width:100%"><span class="grow">צפייה באפליקציה כמו לקוחה</span><span class="muted">‹</span></button>
      <button class="list-row plain" data-act="reset" style="width:100%"><span class="grow" style="color:var(--rose-deep)">${LIVE ? 'התנתקות' : 'איפוס ההדגמה'}</span></button>
    </div>`;
}

function shRevenue() {
  const rows = revenueByMonth();
  const sel = ui.sheet.m ?? 11, m = rows[sel], prev = rows[sel - 1];
  const partial = sel === 11;
  // החודש הנוכחי עוד לא נגמר: משווים לאותם ימים בחודש הקודם
  let prevNet = prev ? prev.net : 0;
  if (prev && partial) {
    const cut = prev.from + (now() - m.from);
    const inc = incomeBetween(prev.from, cut);
    const rent = heldClasses(prev.from, cut).length * studioRate();
    prevNet = inc - rent - prev.fixed;
  }
  const delta = prevNet > 0 ? Math.round((m.net - prevNet) / prevNet * 100) : null;
  const ils = n => `${n < 0 ? '−' : ''}${Math.abs(Math.round(n)).toLocaleString('he-IL')} ₪`;

  // גרף: עמודה = הכנסות, מחולקת לשכירות (למטה) ולמה שנשאר (למעלה)
  const max = Math.max(1, ...rows.map(r => Math.max(r.total, r.rent + r.fixed)));
  const W = 340, H = 150, top = 18, base = 128, bw = 18, step = W / 12, sc = v => (v / max) * (base - top);
  const seg = (x, y0, h, cls, round) => {
    if (h <= 0) return '';
    const y = y0 - h;
    return round && h > 5
      ? `<path class="${cls}" d="M${x} ${y0} V${y + 4} Q${x} ${y} ${x + 4} ${y} H${x + bw - 4} Q${x + bw} ${y} ${x + bw} ${y + 4} V${y0} Z"/>`
      : `<rect class="${cls}" x="${x}" y="${y}" width="${bw}" height="${h}"/>`;
  };
  const bars = rows.map((r, i) => {
    const x = i * step + (step - bw) / 2, on = i === sel;
    const cost = r.rent + r.fixed;
    const rentH = sc(Math.min(cost, r.total)), netH = sc(Math.max(0, r.net));
    const lossH = sc(Math.max(0, cost - r.total));
    return `<g class="rv-bar${on ? ' on' : ''}" data-act="adRevMonth" data-m="${i}">
      <rect x="${i * step}" y="0" width="${step}" height="${H}" fill="transparent"/>
      ${seg(x, base, rentH, 'rv-rent', !netH && !lossH)}
      ${seg(x, base - rentH - (netH ? 2 : 0), netH ? netH - 2 : 0, 'rv-net', true)}
      ${seg(x, base - rentH - (lossH ? 2 : 0), lossH ? lossH - 2 : 0, 'rv-loss', true)}
      ${i % 2 === 1 || on ? `<text x="${x + bw / 2}" y="${H - 4}" text-anchor="middle">${r.label.slice(0, 3)}</text>` : ''}
    </g>`;
  }).join('');

  return `<div class="stack">
    <h1>הכנסות</h1>
    <div class="center">
      <p class="muted small">${m.label} ${m.year}${partial ? ' · עד היום' : ''} · נשאר לך בפועל</p>
      <div class="rv-hero${m.net < 0 ? ' neg' : ''}">${ils(m.net)}</div>
      ${delta !== null ? `<p class="small ${delta >= 0 ? 'rv-up' : 'rv-down'}">${delta >= 0 ? '↑' : '↓'} ${Math.abs(delta)}% ${partial ? `מאותה תקופה ב${prev.label}` : `מ${prev.label}`}</p>` : '<p class="small muted">&nbsp;</p>'}
    </div>
    <div class="card rv-calc" style="margin:0">
      ${m.refunds ? `<div class="row between"><span>מכירות</span><b class="num">${ils(m.total + m.refunds)}</b></div>
      <div class="row between"><span>זיכויים</span><b class="num">− ${ils(m.refunds)}</b></div>` : ''}
      <div class="row between"><span>הכנסות${m.refunds ? ' נטו' : ''}</span><b class="num">${ils(m.total)}</b></div>
      <div class="row between"><span>שכירות לסטודיו <span class="tiny muted">(${m.held} ${m.held === 1 ? 'שיעור' : 'שיעורים'} × ${studioRate()} ₪)</span></span><b class="num">− ${ils(m.rent)}</b></div>
      ${m.fixed ? `<div class="row between"><span>הוצאות קבועות <span class="tiny muted">(${fixedExpenses().filter(e => !e.since || e.since <= m.from).map(e => esc(e.name.split(' (')[0])).join(', ')})</span></span><b class="num">− ${ils(m.fixed)}</b></div>` : ''}
      <div class="row between rv-total"><span>נשאר</span><b class="num">${ils(m.net)}</b></div>
    </div>
    <svg class="rv-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="הכנסות לפי חודש, מחולקות לשכירות ולמה שנשאר">
      <line x1="0" y1="${base}" x2="${W}" y2="${base}" class="rv-axis"/>
      ${bars}
    </svg>
    <div class="rv-legend"><span><i class="rv-net"></i>נשאר</span><span><i class="rv-rent"></i>הוצאות</span>${rows.some(r => r.net < 0) ? '<span><i class="rv-loss"></i>הפסד</span>' : ''}</div>
    <p class="tiny muted center" style="margin-top:0">לחצי על חודש כדי לראות פירוט</p>
    <button class="btn block ghost" data-act="adExport" data-m="${sel}">⬇︎ ייצוא ${m.label} לרואה החשבון (אקסל)</button>
    <div class="card" style="margin:0" data-act="adSales" data-m="${sel}" role="button">
      <div class="row between"><h3>${m.label}: מה נמכר</h3>${m.count || m.manual || m.refunds ? '<span class="small" style="color:var(--rose-deep)">פירוט ‹</span>' : ''}</div>
      ${m.count ? Object.entries(m.byName).map(([n, c]) => `<div class="row between small" style="margin-top:6px"><span>${esc(n)}</span><b>${c}</b></div>`).join('') : '<p class="small muted" style="margin-top:6px">לא היו מכירות</p>'}
      ${m.manual ? `<p class="tiny muted" style="margin-top:10px">ועוד ${m.manualLessons} שיעורים שהוספת ידנית (מזומן / ביט / מתנה), לא כלולים בסכום</p>` : ''}
    </div>
    <h3>כל החודשים</h3>
    <div class="card" style="padding:2px 14px;margin:0">
      ${[...rows].reverse().map((r, k) => `<button class="list-row plain${11 - k === sel ? ' rv-sel' : ''}" data-act="adRevMonth" data-m="${11 - k}" style="width:100%">
        <span class="grow">${r.label} ${r.year}<span class="tiny muted" style="display:block">הכנסות ${ils(r.total)} · הוצאות ${ils(r.rent + r.fixed)}</span></span>
        <b class="num${r.net < 0 ? ' neg' : ''}">${ils(r.net)}</b></button>`).join('')}
    </div>
  </div>`;
}

/** קובץ לרואה החשבון: כל המכירות והזיכויים בחודש (CSV שנפתח באקסל, בעברית) */
async function exportMonth(sel) {
  const m = revenueByMonth()[sel], to = monthStart(10 - sel);
  const who = {};
  for (const st of students()) for (const p of st.purchases) who[p.id] = st;
  const d = t => { const x = new Date(t); return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()}`; };
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const all = allPurchases();
  const lines = [
    q('דוח מכירות חודשי · ' + m.label + ' ' + m.year),
    q('שאיין · שני חיות · עוסק מס׳ 212291546 · בר יהודה 17, בת ים'),
    q('הופק מהאפליקציה ב-' + d(now()) + ' · הקבלות והחשבוניות הרשמיות נמצאות במערכת תקבול'),
    '',
    ['תאריך', 'סוג', 'לקוחה', 'טלפון', 'מוצר', 'סכום (₪)', 'הערה'].map(q).join(',')];
  for (const p of all.filter(p => p.at >= m.from && p.at < to).sort((a, b) => a.at - b.at))
    lines.push([d(p.at), p.price > 0 ? 'מכירה' : 'הוספה ידנית', who[p.id]?.name || '—', who[p.id]?.phone || '', p.credits === 1 ? 'שיעור בודד' : p.name, p.price > 0 ? p.price : 0, p.price > 0 ? '' : p.note || ''].map(q).join(','));
  for (const p of all.filter(p => p.refunded > 0 && p.refundedAt >= m.from && p.refundedAt < to).sort((a, b) => a.refundedAt - b.refundedAt))
    lines.push([d(p.refundedAt), 'זיכוי', who[p.id]?.name || '—', who[p.id]?.phone || '', p.credits === 1 ? 'שיעור בודד' : p.name, -p.refunded, `זיכוי על רכישה מ-${d(p.at)}`].map(q).join(','));
  lines.push('', [q('סה"כ מכירות'), '', '', '', '', m.total + m.refunds, ''].join(','));
  if (m.refunds) lines.push([q('סה"כ זיכויים'), '', '', '', '', -m.refunds, ''].join(','));
  lines.push([q('סה"כ הכנסות נטו'), '', '', '', '', m.total, ''].join(','));
  const name = `YOU-${m.year}-${pad(new Date(m.from).getMonth() + 1)}.csv`;
  const file = new File(['\ufeff' + lines.join('\r\n')], name, { type: 'text/csv' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) return await navigator.share({ files: [file], title: name });
  } catch (e) { if (e?.name === 'AbortError') return; }
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(file), download: name });
  document.body.appendChild(a); a.click(); a.remove();
}

/** פירוט המכירות בחודש: מי קנתה, מה, מתי וכמה (כולל זיכויים והוספות ידניות) */
function shSales({ m: sel }) {
  const m = revenueByMonth()[sel], to = monthStart(10 - sel);
  const who = {};
  for (const st of students()) for (const p of st.purchases) who[p.id] = st;
  const all = allPurchases();
  const sold = all.filter(p => p.at >= m.from && p.at < to).sort((a, b) => b.at - a.at);
  const refunds = all.filter(p => p.refunded > 0 && p.refundedAt >= m.from && p.refundedAt < to).sort((a, b) => b.refundedAt - a.refundedAt);
  const when = t => `${fmtDate(t)} · ${new Date(t).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`;
  const row = (p, right, sub) => { const st = who[p.id]; return `<button class="list-row plain" style="width:100%;text-align:right" ${st ? `data-act="adStudent" data-id="${st.id}"` : ''}>
      <span class="grow"><b>${esc(st?.name || 'לקוחה שמחקה את החשבון')}</b><span class="tiny muted" style="display:block">${sub}</span></span>${right}</button>`; };
  return `<div class="stack">
    <button class="link small" data-act="adRevenue" data-m="${sel}" style="align-self:flex-start">→ חזרה להכנסות</button>
    <h1>מכירות · ${m.label} ${m.year}</h1>
    <p class="small muted">${sold.filter(p => p.price > 0).length} רכישות · ${m.total + m.refunds} ₪${m.refunds ? ` · זיכויים ${m.refunds} ₪` : ''}</p>
    <div class="card" style="padding:4px 18px;margin:0">
      ${sold.length ? sold.map(p => row(p,
        p.price > 0 ? `<b class="num">${p.price} ₪</b>` : '<span class="tag">ידני</span>',
        `${esc(p.credits === 1 ? 'שיעור בודד' : p.name)} · ${when(p.at)}${p.refunded > 0 ? ` · <span style="color:var(--rose-deep)">זוכה ${p.refunded} ₪</span>` : ''}${p.note && !(p.price > 0) ? ` · ${esc(p.note)}` : ''}`)).join('')
        : '<p class="small muted center" style="padding:14px 0">לא היו מכירות החודש</p>'}
    </div>
    ${refunds.length ? `<h3>זיכויים החודש</h3><div class="card" style="padding:4px 18px;margin:0">
      ${refunds.map(p => row(p, `<b class="num" style="color:var(--rose-deep)">− ${p.refunded} ₪</b>`, `${esc(p.credits === 1 ? 'שיעור בודד' : p.name)} · זוכה ב-${when(p.refundedAt)}`)).join('')}
    </div>` : ''}
    <p class="tiny muted center">לחיצה על לקוחה פותחת את הכרטיס שלה</p>
  </div>`;
}

window.EXTRA_SHEETS = { sales: shSales, revenue: shRevenue, adminClass: shAdminClass2, editClass: shEditClass, broadcast: shBroadcast, students: shStudents, student: shStudent };

/* ---------- פעולות ---------- */
const reopen = () => { renderSheet(); render(); };
function afterLive(p, msg) {
  return liveDo(async () => { await p(); S.adminData = await API.adminLoad(); }, msg, false).then(() => renderSheet());
}

document.addEventListener('input', e => {
  if (e.target.dataset.search === 'clients') {
    ui.clientQ = e.target.value;
    const pos = e.target.selectionStart;
    render();
    const el = document.getElementById('cl-q'); el.focus(); el.setSelectionRange(pos, pos);
    return;
  }
  if (e.target.dataset.search === 'students') {
    ui.sheet.q = e.target.value;
    const pos = e.target.selectionStart;
    renderSheet();
    const el = document.getElementById('st-q'); el.focus(); el.setSelectionRange(pos, pos);
  }
});

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || !el.dataset.act.startsWith('ad') || el.dataset.act === 'adminClass' || el.dataset.act === 'adminCancel' || el.dataset.act === 'admin') return;
  const act = el.dataset.act, id = el.dataset.id;

  switch (act) {
    case 'adBroadcast': return openSheet({ type: 'broadcast' });
    case 'adRevenue': return openSheet({ type: 'revenue', ...(el.dataset.m != null ? { m: +el.dataset.m } : {}) });
    case 'adExport': return exportMonth(+el.dataset.m);
    case 'adSales': return openSheet({ type: 'sales', m: +el.dataset.m });
    case 'adRevMonth': ui.sheet.m = +el.dataset.m; return renderSheet();
    case 'adStudents': return openSheet({ type: 'students' });
    case 'adStudent': return openSheet({ type: 'student', id });
    case 'adEditClass': return openSheet({ type: 'editClass', id });

    case 'adAttend': {
      const v = el.dataset.v === '1', b = el.dataset.b;
      if (LIVE) return API.markAttendance(b, v).then(() => API.classRoster(id)).then(r => { ui.sheet.roster = r; renderSheet(); }).catch(err => toast(errHe(err)));
      S.att = S.att || {}; S.att[id] = S.att[id] || {};
      S.att[id][b] = S.att[id][b] === v ? null : v;
      save(); return renderSheet();
    }

    case 'adClassMsg': {
      const body = val('cm-body'), c = cls(id);
      if (body.length < 2) return toast('מה רוצה לכתוב?');
      const title = `עדכון לשיעור ${c.title} · ${fmtDay(c.start)}`;
      if (LIVE) return liveDo(() => API.classMessage(id, title, body), n => `ההודעה נשלחה ל-${n} ${n === 1 ? 'רשומה' : 'רשומות'} 🤍`, false).then(() => renderSheet());
      return toast(`ההודעה נשלחה ל-${rosterFor(c).length} רשומות 🤍`);
    }
    case 'adAttendAll': {
      const rows = rosterFor(cls(id)).filter(r => r.attended !== true);
      if (LIVE) return Promise.all(rows.map(r => API.markAttendance(r.bookingId, true))).then(() => API.classRoster(id))
        .then(r => { ui.sheet.roster = r; renderSheet(); toast('סומן: כולן הגיעו ✓'); }).catch(err => toast(errHe(err)));
      S.att = S.att || {}; S.att[id] = S.att[id] || {};
      for (const r of rows) S.att[id][r.bookingId] = true;
      save(); renderSheet(); return toast('סומן: כולן הגיעו ✓');
    }

    case 'adSongAdd': {
      const c = cls(id), title = val('sg-title'), artist = val('sg-artist');
      if (!title) return toast('מה שם השיר?');
      const songs = [...(c.songs || []), { title, artist, url: val('sg-url') || spotifySearch(title, artist) }];
      if (LIVE) return liveDo(() => API.saveSongs(id, songs), 'השיר נוסף 🎶', false).then(() => openSheet({ ...ui.sheet }));
      c.songs = songs; save(); reopen();
      return toast('השיר נוסף 🎶');
    }
    case 'adSongDel': {
      const c = cls(id), songs = (c.songs || []).filter((_, i) => i !== +el.dataset.i);
      if (LIVE) return liveDo(() => API.saveSongs(id, songs), 'השיר הוסר', false).then(() => openSheet({ ...ui.sheet }));
      c.songs = songs; save(); return reopen();
    }

    case 'adSaveClass': {
      const c = cls(id), title = val('ec-title'), note = val('ec-note'), date = val('ec-date'), time = val('ec-time'), cap = +val('ec-cap');
      const all = document.querySelector('input[name=ec-scope]:checked')?.value === 'all';
      if (!title || !date || !time || !cap) return toast('חסרים פרטים');
      const start = new Date(`${date}T${time}`).getTime();
      if (cap < c.cap - spotsLeft(c)) return toast('כבר רשומות יותר נשים ממספר המקומות הזה');
      if (LIVE) return liveDo(() => API.updateClass(id, { title, note, start, cap, all }), all ? 'כל השיעורים הקבועים עודכנו' : 'השיעור עודכן');
      const moved = start !== c.start;
      if (all && c.seriesId) S.classes.filter(k => k.seriesId === c.seriesId && k.start > c.start && !k.cancelled).forEach(k => Object.assign(k, { title, note, cap }));
      Object.assign(c, { title, note, start, cap });
      S.classes.sort((a, b) => a.start - b.start);
      if (moved && myBooking(c)) S.notices.unshift({ id: uid(), title: `השיעור ${title} הוזז`, text: `השיעור עבר ל${fmtDay(start)} בשעה ${fmtTime(start)}. ההרשמה שלך נשמרה 🤍`, read: false });
      save(); closeSheet(); render();
      return toast(moved ? 'השיעור עודכן · הרשומות קיבלו הודעה' : 'השיעור עודכן');
    }

    case 'adSend': {
      const title = val('bc-title'), body = val('bc-body');
      if (!title || !body) return toast('חסרים כותרת או הודעה');
      if (LIVE) return liveDo(() => API.broadcast(title, body), n => `ההודעה נשלחה ל-${n} תלמידות 🤍`);
      const n = students().filter(s => !s.blocked).length;
      S.notices.unshift({ id: uid(), title, text: body, read: false });
      save(); closeSheet(); render();
      return toast(`ההודעה נשלחה ל-${n} תלמידות 🤍`);
    }

    case 'adGrant': {
      const n = +val('gc-n'), days = +val('gc-days'), note = val('gc-note');
      if (!(n > 0) || !(days > 0)) return toast('בדקי את מספר השיעורים והתוקף');
      if (LIVE) return afterLive(() => API.grantCredits(id, n, days, note), `נוספו ${n} שיעורים 🤍`);
      const s = students().find(x => x.id === id);
      s.purchases.push({ id: uid(), name: n === 1 ? 'שיעור (הוספה ידנית)' : `${n} שיעורים (הוספה ידנית)`, credits: n, remaining: n, price: 0, at: now(), expiresAt: now() + days * DAY, note });
      save(); renderSheet(); render();
      return toast(`נוספו ל${firstName(s.name)} ${n} שיעורים 🤍`);
    }
    case 'adRefund': {
      const pid = el.dataset.p;
      const p = students().find(x => x.id === id).purchases.find(x => x.id === pid);
      const left = p.price - (p.refunded || 0);
      const mark = el.dataset.mark === '1';
      const v = prompt(mark ? `כמה זיכית באתר של תקבול? (עד ${left} ₪)\nהאפליקציה רק תעדכן את ההכנסות, בלי לזכות שוב.` : `סכום הזיכוי בשקלים (עד ${left} ₪).\nלזיכוי מלא השאירי ${left}.`, String(left));
      if (v == null) return;
      const amount = Math.round(+String(v).replace(/[^\d.]/g, '') * 100) / 100;
      if (!(amount > 0) || amount > left) return toast(`הסכום צריך להיות בין 1 ל-${left} ₪`);
      if (!confirm(mark ? `לסמן זיכוי של ${amount} ₪?\nהשיעורים שנשארו בכרטיסייה יבוטלו, והיא תקבל הודעה.` : `לזכות ${amount} ₪ בכרטיס האשראי של הלקוחה?\nהשיעורים שנשארו בכרטיסייה יבוטלו, והיא תקבל הודעה.`)) return;
      if (!LIVE) { p.refunded = (p.refunded || 0) + amount; p.refundedAt = now(); p.remaining = 0; save(); renderSheet(); render(); return toast(`זוכו ${amount} ₪`); }
      return afterLive(() => mark ? API.markRefunded(pid, amount) : API.refund(pid, amount), mark ? `סומן זיכוי של ${amount} ₪ ✓` : `זוכו ${amount} ₪ ✓`);
    }
    case 'adExtend': {
      const d = +el.dataset.d, pid = el.dataset.p;
      if (LIVE) return afterLive(() => API.extendPurchase(pid, d), `התוקף הוארך ב-${d} יום`);
      const p = students().find(x => x.id === id).purchases.find(x => x.id === pid);
      p.expiresAt = Math.max(p.expiresAt, now()) + d * DAY;
      save(); renderSheet(); render();
      return toast(`התוקף הוארך עד ${fmtDate(p.expiresAt)}`);
    }
    case 'adBlock': {
      const s = students().find(x => x.id === id);
      if (!s.blocked && !confirm(`לחסום את ${s.name}? היא לא תוכל להירשם לשיעורים חדשים.`)) return;
      if (LIVE) return afterLive(() => API.setBlocked(id, !s.blocked), s.blocked ? 'החסימה בוטלה' : 'התלמידה נחסמה');
      s.blocked = !s.blocked; save(); renderSheet(); render();
      return toast(s.blocked ? 'התלמידה נחסמה' : 'החסימה בוטלה');
    }

    case 'adSavePrices': {
      const list = CONFIG.products.map((p, i) => ({ ...p, price: +val(`pr-price-${i}`) || p.price, credits: +val(`pr-credits-${i}`) || p.credits, days: +val(`pr-days-${i}`) || p.days }));
      if (LIVE) return liveDo(() => API.saveProducts(list), 'המחירים עודכנו');
      applyProducts(list); S.productsOverride = list; save(); closeSheet(); render();
      return toast('המחירים עודכנו');
    }
    case 'adSaveWa': {
      const wa = val('bz-wa');
      if (wa.replace(/\D/g, '').length < 9) return toast('המספר לא נראה תקין');
      if (LIVE) return liveDo(() => API.saveSettings({ whatsapp: wa }), 'המספר נשמר');
      S.whatsapp = wa; save(); render(); return toast('המספר נשמר');
    }
    case 'adSaveTexts': {
      const texts = { welcomeQuote: val('tx-quote'), firstLetter: val('tx-first') };
      if (!texts.welcomeQuote || !texts.firstLetter) return toast('הטקסטים לא יכולים להיות ריקים');
      if (LIVE) return liveDo(() => API.saveSettings({ texts }), 'הטקסטים נשמרו');
      S.texts = texts; save(); render(); return toast('הטקסטים נשמרו');
    }
    case 'adPreviewFirst': {
      const c = S.classes.find(x => x.start > now() && !x.cancelled);
      if (!c) return toast('אין שיעור קרוב להצגה');
      return openSheet({ type: 'firstClass', id: c.id, preview: true });
    }
    case 'adNotify': {
      const k = el.dataset.k, np = { ...notifyPrefs(), [k]: !notifyPrefs()[k] };
      S.adminNotify = np; save(); render();
      if (LIVE) API.saveSettings({ admin_notify: np }).catch(err => toast(errHe(err)));
      return;
    }
    case 'adViewClient': S.admin = false; save(); toast('תצוגת לקוחה · כדי לחזור: פרופיל ← מצב ניהול'); return go({ tab: 'home' });
    case 'adSaveRate': {
      const r = +val('st-rate');
      if (!(r >= 0)) return toast('בדקי את הסכום');
      if (LIVE) return liveDo(() => API.saveStudioRate(r), 'השכירות עודכנה');
      S.studioRate = r; save(); closeSheet(); render();
      return toast('השכירות עודכנה');
    }
    case 'adExpAdd': case 'adExpDel': {
      let list = [...fixedExpenses()];
      if (act === 'adExpDel') list = list.filter(e => e.id !== id);
      else {
        const name = val('ex-name'), amount = +val('ex-amount'), period = val('ex-period');
        if (!name || !(amount > 0)) return toast('חסרים שם או סכום');
        list.push({ id: uid(), name, amount, period, since: monthStart(0) });
      }
      if (LIVE) return liveDo(() => API.saveExpenses(list), act === 'adExpDel' ? 'ההוצאה הוסרה' : 'ההוצאה נוספה', false).then(() => renderSheet());
      S.fixedExpenses = list; save(); renderSheet(); render();
      return toast(act === 'adExpDel' ? 'ההוצאה הוסרה' : 'ההוצאה נוספה');
    }
    case 'adSaveDirections': {
      const d = { address: val('dr-address'), floor: val('dr-floor'), door: val('dr-door'), code: val('dr-code') };
      if (!d.address) return toast('חסרה כתובת');
      if (LIVE) return liveDo(() => API.saveDirections(d), 'פרטי ההגעה עודכנו');
      S.directions = d; save(); closeSheet(); render();
      return toast('פרטי ההגעה עודכנו');
    }
  }
});

/** מחירים: מעדכן את CONFIG.products (כולל הטקסט הקטן מתחת) */
function applyProducts(list) {
  for (const n of list) {
    const p = CONFIG.products.find(x => x.id === n.id);
    if (!p) continue;
    Object.assign(p, { price: n.price, credits: n.credits, days: n.days });
    const per = Math.round(p.price / p.credits);
    const valid = p.days % 30 === 0 && p.days >= 60 ? `${p.days / 30 === 2 ? 'חודשיים' : `${p.days / 30} חודשים`}` : `${p.days} יום`;
    p.note = p.credits === 1 ? `בתוקף ${valid}` : `${per} ₪ לשיעור · בתוקף ${valid}`;
  }
}
if (!LIVE && S.productsOverride) applyProducts(S.productsOverride);
