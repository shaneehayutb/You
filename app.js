/* ============================================================
   שחר שני · ריקוד — אב-טיפוס (PWA)
   נתונים: localStorage, סרטונים: IndexedDB (רק במכשיר הזה).
   בשלב הבא: Supabase (התחברות Google/Apple, מסד נתונים, אחסון פרטי לסרטונים) + תקבול.
   ============================================================ */

const CONFIG = {
  brand: 'YOU by Shahar',
  tagline: 'ריקוד · נשיות · חיבור',
  location: 'מנחם יקואל 6, בת ים',
  // טקסטים ששחר יכולה לשנות מהפרופיל שלה
  texts: {
    welcomeQuote: 'כל אישה יודעת לרקוד.\nרק צריך להזכיר את זה לגוף.',
    firstLetter: 'איזה כיף שבחרת להגיע. זה צעד אמיץ ויפה, ואני כבר מחכה לך.\nלא צריך שום ניסיון ולא צריך לדעת לרקוד. כל אחת מתחילה מאיפה שהיא, ומה שחשוב זה רק שתגיעי כמו שאת.',
  },
  whatsapp: '054-554-3035',
  studioRatePerHour: 130, // תשלום לסטודיו על כל שיעור שהתקיים (₪), לחישוב "נשאר בפועל"
  // הוראות הגעה: מוצגות רק ללקוחות שסיימו הרשמה (מסך הבית)
  directions: {
    video: 'media/directions.mp4',
    address: 'מנחם יקואל 6, בת ים',
    // קומה, דלת וקוד כניסה מגיעים רק מהשרת, ורק למי שמותר לראות אותם
    floor: '',
    door: '',
    code: '',
  },

  cancelHours: 12,     // ביטול חינם עד X שעות לפני
  horizonDays: 60,     // שיעורים קבועים מוצגים תמיד חודשיים קדימה
  healthValidYears: 2, // הצהרת בריאות מתחדשת כל שנתיים (כמו בטופס הרשמי)
  products: [
    { id: 'single', name: 'שיעור בודד',  credits: 1,  price: 75,  days: 21,  note: 'בתוקף 21 יום' },
    { id: 'five',   name: 'כרטיסיית 5',  credits: 5,  price: 350, days: 60,  payments: 2, note: '70 ₪ לשיעור · בתוקף חודשיים' },
    { id: 'ten',    name: 'כרטיסיית 10', credits: 10, price: 670, days: 120, payments: 3, note: '67 ₪ לשיעור · בתוקף 4 חודשים', featured: true },
  ],
  milestones: [
    { n: 1,  label: 'הצעד הראשון' },
    { n: 5,  label: 'מתחילה לזרום' },
    { n: 10, label: 'מרגישה בבית' },
    { n: 25, label: 'הגוף זוכר' },
    { n: 50, label: 'רוקדת את עצמה' },
  ],
  // חלק א' — לפי הטופס בתקנות מכוני כושר (הצהרת בריאות ותעודה רפואית), התשע"ה-2015.
  // "כן" על אחת מהן = צריך אישור רפואי מרופא (עד 3 חודשים) לפני השיעור הראשון.
  healthQuestions: [
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
  ],
  // חלק ב' — לא חלק מהטופס הרשמי: מידע ששחר צריכה כדי להתאים את התנועה (לא מחייב אישור רפואי)
  danceQuestions: [
    { k: 'joints', q: 'יש לך כאב או פציעה בגב, בברכיים, בקרסוליים או במפרקים אחרים (בשנה האחרונה)?' },
    { k: 'surgery', q: 'עברת ניתוח ב-6 החודשים האחרונים?' },
    { k: 'pregnant', q: 'את כרגע בהריון, או ילדת בחצי השנה האחרונה?' },
  ],
};

// שירים לדוגמה לשיעורים שעברו (שחר מעדכנת בממשק הניהול)
const DEMO_SONGS = [
  ['Levitating', 'Dua Lipa'], ['Crazy in Love', 'Beyoncé'], ["Hips Don't Lie", 'Shakira'],
  ['Despechá', 'Rosalía'], ['Say So', 'Doja Cat'], ['Unicorn', 'נועה קירל'], ['7 rings', 'Ariana Grande'],
];
const spotifySearch = (title, artist) => `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`)}`;
const OTHER_NAMES = ['נועה','מאיה','תמר','יעל','שירה','מיכל','רוני','ליה','הילה','דנה','אורית','גלי','קרן','ענבל'];

/** המערכת הקבועה של שחר: כל שורה = שיעור שחוזר כל שבוע */
const SEED_SERIES = [
  { id: 'sr1', dow: 0, h: 20, m: 0, title: 'נשיות בקצב', dur: 60, cap: 12 },
];

/* ---------------- time helpers ---------------- */
const H = 3600e3, D = 24 * H, W = 7 * D;
const now = () => Date.now();
const pad = n => String(n).padStart(2, '0');
const dayNames = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const fmtTime = t => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtDate = t => { const d = new Date(t); return `${d.getDate()}.${d.getMonth() + 1}`; };
const fmtDay = t => `יום ${dayNames[new Date(t).getDay()]}, ${fmtDate(t)}`;
const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
const startOfWeek = t => { const d = new Date(startOfDay(t)); d.setDate(d.getDate() - d.getDay()); return d.getTime(); };
const addDays = (t, n) => { const d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); };
const relDay = t => {
  const diff = Math.round((startOfDay(t) - startOfDay(now())) / D);
  if (diff === 0) return 'היום';
  if (diff === 1) return 'מחר';
  if (diff === -1) return 'אתמול';
  return `יום ${dayNames[new Date(t).getDay()]}`;
};
const weekLabel = ws => {
  const diff = Math.round((ws - startOfWeek(now())) / W);
  return ['השבוע', 'שבוע הבא', 'בעוד שבועיים'][diff] || `בעוד ${diff} שבועות`;
};
const weekRange = ws => `${fmtDate(ws)}–${fmtDate(addDays(ws, 6))}`;
const hoursUntil = t => (t - now()) / H;
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------- store ---------------- */
const KEY = 'shachar-dance-v4';
let S = load();

function load() {
  if (LIVE) {
    let p = {}; try { p = JSON.parse(localStorage.getItem('shachar-prefs')) || {}; } catch {}
    return { v: 7, user: null, purchases: [], bookings: [], series: [], classes: [], notices: [], prefs: p.prefs || { remind24: false, remind2: false, notify: false }, admin: !!p.admin, isAdmin: false };
  }
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 7) { ensureHorizon(s); return s; } } catch {}
  return fresh();
}
function save() {
  if (LIVE) { try { localStorage.setItem('shachar-prefs', JSON.stringify({ prefs: S.prefs, admin: S.admin })); } catch {} return; }
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch {}
}

/** פעולה מול השרת: מריצים, טוענים מחדש, מציגים. שגיאות מתורגמות לעברית */
let busy = false;
async function liveDo(fn, okMsg, close = true) {
  if (busy) return; busy = true;
  try {
    const r = await fn();
    await API.sync();
    if (close) closeSheet();
    render();
    if (okMsg) toast(typeof okMsg === 'function' ? okMsg(r) : okMsg);
    return r;
  } catch (e) { toast(errHe(e)); }
  finally { busy = false; }
}
function fresh() {
  const st = {
    v: 7,
    user: null,          // {auth, name, age, phone, email, profile, health, termsAt}
    purchases: [],       // {id, productId, name, credits, remaining, price, at, expiresAt}
    bookings: [],        // {id, classId, purchaseId, status, at, video}
    series: SEED_SERIES.map(x => ({ ...x, from: addDays(startOfWeek(now()), -365), until: null, demo: true })),
    classes: [],         // מופעים בפועל — נוצרים אוטומטית מתוך series
    notices: [],         // הודעות ללקוחה (למשל: שחר ביטלה שיעור)
    prefs: { remind24: false, remind2: false, notify: false },
    admin: false,
  };
  ensureHorizon(st);
  return st;
}


/**
 * כל שיעור קבוע מוצג תמיד חודשיים קדימה: בכל פתיחה של האפליקציה (ובשרת — פעם ביום)
 * נוצרים המופעים החסרים עד היום + 60. כך כל שבוע שעובר "נפתח" עוד שבוע בסוף.
 * מופע שבוטל נשאר במערכת כמבוטל ולא נוצר מחדש.
 */
function ensureHorizon(st = S) {
  const until = addDays(startOfDay(now()), CONFIG.horizonDays);
  let added = 0;
  for (const se of st.series) {
    for (let d = addDays(startOfWeek(se.from), se.dow); d < until; d = addDays(d, 7)) {
      const dt = new Date(d); dt.setHours(se.h, se.m, 0, 0);
      const start = dt.getTime();
      if (start < se.from || (se.until && start > se.until)) continue;
      const key = `${se.id}@${startOfDay(start)}`;
      if (st.classes.some(c => c.key === key)) continue;
      const n = st.classes.length;
      const [title, artist] = DEMO_SONGS[n % DEMO_SONGS.length];
      st.classes.push({
        id: uid(), key, seriesId: se.id, title: se.title, start, dur: se.dur, cap: se.cap,
        // משתתפות אחרות — רק בנתוני ההדגמה. "עקבים" השבוע מלא.
        others: !se.demo ? 0 : se.title === 'עקבים' && startOfWeek(start) === startOfWeek(now()) ? se.cap : 3 + ((n * 5) % (se.cap - 5)),
        cancelled: false,
        // שירים מהשיעור (בהדגמה: 2–3 שירים לכל שיעור שכבר היה)
        songs: se.demo && start < now() ? [0, 1, 2].slice(0, 2 + (n % 2)).map(k => {
          const [t, a] = DEMO_SONGS[(n + k) % DEMO_SONGS.length]; return { title: t, artist: a, url: spotifySearch(t, a) };
        }) : [],
      });
      added++;
    }
  }
  if (added) st.classes.sort((a, b) => a.start - b.start);
  return added;
}

/* ---------------- video storage (IndexedDB, רק במכשיר) ---------------- */
const VDB = {
  _db: null,
  open() {
    return this._db || (this._db = new Promise((res, rej) => {
      const r = indexedDB.open('shachar-videos', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('v');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
  },
  async tx(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const t = db.transaction('v', mode); const req = fn(t.objectStore('v'));
      t.oncomplete = () => res(req?.result); t.onerror = () => rej(t.error);
    });
  },
  put(k, blob) { return this.tx('readwrite', s => s.put(blob, k)); },
  get(k) { return this.tx('readonly', s => s.get(k)); },
  del(k) { return this.tx('readwrite', s => s.delete(k)); },
  clear() { return this.tx('readwrite', s => s.clear()); },
};
const videoUrls = {};
async function hydrateVideos() {
  for (const el of document.querySelectorAll('video[data-vid]')) {
    const k = el.dataset.vid;
    try {
      if (!videoUrls[k]) { const blob = await VDB.get(k); if (blob) videoUrls[k] = URL.createObjectURL(blob); }
      if (videoUrls[k] && el.src !== videoUrls[k]) el.src = videoUrls[k];
    } catch {}
  }
}

/* ---------------- domain logic ---------------- */
const cls = id => S.classes.find(c => c.id === id);
const myBooking = c => S.bookings.find(b => b.classId === c.id && b.status === 'booked');
const spotsLeft = c => c.cap - c.others - (myBooking(c) ? 1 : 0);
const activePurchases = () => S.purchases.filter(p => p.remaining > 0 && p.expiresAt > now()).sort((a, b) => a.expiresAt - b.expiresAt);
const totalCredits = () => activePurchases().reduce((s, p) => s + p.remaining, 0);
const pickPurchase = c => activePurchases().find(p => p.expiresAt > c.start);
const product = id => CONFIG.products.find(p => p.id === id);
const isOnboarded = () => S.user && S.user.health && S.user.termsAt;
const needsCertMissing = () => !!(S.user?.health?.needsCert && !S.user.health.cert);
/** שיעורים שהיא הייתה בהם, מהחדש לישן */
const attended = () => S.bookings
  .filter(b => b.status === 'booked' && cls(b.classId) && cls(b.classId).start + cls(b.classId).dur * 60e3 < now())
  .map(b => ({ b, c: cls(b.classId) }))
  .sort((x, y) => y.c.start - x.c.start);

function refund(b) {
  const p = S.purchases.find(p => p.id === b.purchaseId);
  if (p) p.remaining++;
}

/** פעולה שצריכה חשבון (הרשמה לשיעור, רכישה): מבקשים להתחבר */
function requireAuth() {
  closeSheet();
  toast('כדי להירשם לשיעורים ולרכוש צריך להתחבר 🤍');
  go({ screen: 'auth' });
}

function book(c) {
  if (S.guest || !S.user) return requireAuth();
  if (!isOnboarded()) return go({ screen: 'welcome' });
  if (c.cancelled || c.start < now()) return;
  if (spotsLeft(c) <= 0) return toast('השיעור הזה כבר מלא');
  if (needsCertMissing()) return openSheet({ type: 'cert' });
  const p = pickPurchase(c);
  if (!p) { toast('אין לך שיעורים בכרטיסייה — בואי נרכוש 💗'); return openSheet({ type: 'shop' }); }
  const first = isFirstTimer();
  const done = () => first ? openSheet({ type: 'firstClass', id: c.id }) : null;
  if (LIVE) return liveDo(() => API.book(c.id), first ? null : `נרשמת ל${c.title}! נתראה ${relDay(c.start)} ✨`).then(done);
  p.remaining--;
  S.bookings.push({ id: uid(), classId: c.id, purchaseId: p.id, status: 'booked', at: now() });
  save(); closeSheet();
  if (!first) toast(`נרשמת ל${c.title}! נתראה ${relDay(c.start)} ✨`);
  render(); done();
}

/** הסכמה לצילום בשיעורים: שלוש אפשרויות, בחירה פעילה (שום דבר לא מסומן מראש) */
const PHOTO = {
  yes: { label: 'אני בעניין, אפשר לצלם אותי 🤍', short: 'מצטלמת' },
  no:  { label: 'אני מעדיפה לא להצטלם', short: 'לא מצטלמת' },
};
function photoChoice(cur, act) {
  if (cur === 'back') cur = 'yes';
  return `<div class="stack" style="gap:8px">${Object.entries(PHOTO).map(([k, o]) =>
    `<button class="chip ${cur === k ? 'on' : ''}" style="text-align:right;justify-content:flex-start;width:100%" data-act="${act}" data-v="${k}">${o.label}</button>`).join('')}</div>`;
}
const PHOTO_TEXT = `לפעמים אני מצלמת קטעים מהשיעורים כדי לשתף את האווירה באינסטגרם, בטיקטוק, בפייסבוק, בוואטסאפ ובאתר של הסטודיו, וכך להזמין עוד נשים לרקוד איתנו. מה מתאים לך?`;
const photoShort = p => PHOTO[p === 'back' ? 'yes' : p]?.short;
const PHOTO_FINE = `הבחירה לא משפיעה על ההשתתפות בשיעורים, ואפשר לשנות אותה בכל רגע בפרופיל. אם אישרת, הסרטונים יכולים להיות ערוכים (חיתוך, מוזיקה, טקסט) ולהתפרסם בערוצים של הסטודיו בלי תמורה. אם תבקשי, אוריד פרסום שבו רואים אותך תוך 14 יום, וסטוריז נמחקים לבד אחרי 24 שעות.`;

const txt = k => (S.texts && S.texts[k]) || CONFIG.texts[k];

/** עוד לא נרשמה אף פעם לשיעור (לא כולל ביטולים) — ההרשמה הבאה היא השיעור הראשון שלה */
const isFirstTimer = () => !S.bookings.some(b => b.status === 'booked' || b.status === 'attended' || b.status === 'late_cancel');
/** השיעור הראשון שלה, אם הוא עוד לפניה */
function upcomingFirstClass() {
  const mine = S.bookings.filter(b => ['booked', 'attended', 'late_cancel'].includes(b.status)).map(b => ({ b, c: cls(b.classId) })).filter(x => x.c);
  if (mine.some(x => x.c.start < now())) return null;
  return mine.filter(x => x.b.status === 'booked').sort((a, z) => a.c.start - z.c.start)[0]?.c || null;
}

function shLegal({ id }) {
  // נטען מהאתר הציבורי, כך שעדכון בתקנון מגיע לכולן מיד בלי גרסה חדשה. בלי אינטרנט: העותק שבאפליקציה
  const src = navigator.onLine !== false ? 'https://shaneehayutb.github.io/you-legal/' : 'legal.html';
  return `<iframe class="legal-frame" src="${src}#${esc(id || 'privacy')}" title="מסמכים"></iframe>`;
}

function shFirstClass({ id, preview }) {
  const c = cls(id), d = { ...CONFIG.directions, ...(S.directions || {}) };
  const fn = preview ? 'נועה' : esc((S.user?.name || '').split(' ')[0]);
  return `<div class="stack first-class">
    <div class="center"><div class="fc-heart">🤍</div><p class="muted small">${fmtDay(c.start)} · ${fmtTime(c.start)}</p>
      <h1>${fn ? `${fn}, ` : ''}השיעור הראשון שלך!</h1></div>
    <p class="fc-letter">${esc(txt('firstLetter')).replace(/\n/g, '<br>')}</p>
    <p class="fc-sign">שחר</p>
    <div class="card" style="margin:0">
      <h3>מה להביא</h3>
      <ul class="fc-list"><li>בגדים נוחים שאפשר לזוז בהם</li><li>בקבוק מים</li><li>כדאי להגיע 10 דקות לפני, כדי להתמקם בנחת</li></ul>
    </div>
    <div class="card" style="margin:0"><h3>איפה</h3><p class="small">${esc(d.address)}${d.floor ? ` · קומה ${esc(d.floor)}` : ''}${d.door ? ` · דלת ${esc(d.door)}` : ''}</p></div>
    <button class="btn block" data-act="directions">📍 איך מגיעים</button>
    <a class="btn block soft" href="${icsFor(c)}" download="shiur.ics">הוספה ליומן</a>
  </div>`;
}

function cancelBooking(b, confirmed = false) {
  const c = cls(b.classId);
  if (LIVE) {
    if (hoursUntil(c.start) < CONFIG.cancelHours && !confirmed) return openSheet({ type: 'lateCancel', bookingId: b.id });
    return liveDo(() => API.cancel(b.id), r => r === 'refunded' ? 'ההרשמה בוטלה. השיעור חזר לכרטיסייה שלך 🤍' : 'ההרשמה בוטלה. הפעם השיעור נספר מהכרטיסייה');
  }
  if (hoursUntil(c.start) >= CONFIG.cancelHours) {
    b.status = 'cancelled'; refund(b);
    save(); closeSheet(); toast('ההרשמה בוטלה. השיעור חזר לכרטיסייה שלך 🤍'); return render();
  }
  if (!confirmed) return openSheet({ type: 'lateCancel', bookingId: b.id });
  b.status = 'late_cancel';
  save(); closeSheet(); toast('ההרשמה בוטלה. הפעם השיעור נספר מהכרטיסייה'); render();
}

function buy(productId) {
  const pr = product(productId);
  const at = now();
  S.purchases.push({ id: uid(), productId, name: pr.name, credits: pr.credits, remaining: pr.credits, price: pr.price, at, expiresAt: at + pr.days * D, frozen: false });
  save();
}

async function attachVideo(bookingId, file) {
  if (!file) return;
  if (!file.type.startsWith('video/')) return toast('זה לא נראה כמו סרטון');
  if (file.size > 500 * 1024 * 1024) return toast('הסרטון גדול מדי (עד 500MB)');
  try {
    await VDB.put(bookingId, file);
    delete videoUrls[bookingId];
    const b = S.bookings.find(b => b.id === bookingId);
    b.video = { name: file.name, at: now() };
    if (LIVE) setVideoMeta(bookingId, b.video);
    save(); render(); toast('הסרטון נשמר — רק את רואה אותו 🤍');
  } catch { toast('לא הצלחנו לשמור את הסרטון'); }
}
async function removeVideo(bookingId) {
  if (!confirm('למחוק את הסרטון?')) return;
  try { await VDB.del(bookingId); } catch {}
  if (videoUrls[bookingId]) { URL.revokeObjectURL(videoUrls[bookingId]); delete videoUrls[bookingId]; }
  const b = S.bookings.find(b => b.id === bookingId);
  delete b.video; if (LIVE) setVideoMeta(bookingId, null); save(); render();
}

/* ----- admin ----- */
function adminCancelClass(c, quiet = false) {
  if (LIVE) return liveDo(() => API.adminCancelClass(c.id), n => `השיעור בוטל · ${n} רשומות קיבלו הודעה והשיעור חזר להן לכרטיסייה`);
  c.cancelled = true;
  let n = 0;
  for (const b of S.bookings.filter(b => b.classId === c.id && b.status === 'booked')) {
    refund(b); b.status = 'studio_cancelled'; n++;
    // הודעה ללקוחה. באפליקציה האמיתית: גם התראת push ומייל
    S.notices.unshift({ id: uid(), at: now(), read: false, classId: c.id,
      title: `השיעור ${c.title} בוטל`,
      text: `שחר ביטלה את השיעור ב${fmtDay(c.start)} בשעה ${fmtTime(c.start)}. השיעור חזר לכרטיסייה שלך 🤍` });
  }
  save();
  if (!quiet) { closeSheet(); toast(`השיעור בוטל · ${c.others + n} משתתפות קיבלו הודעה והשיעור חזר להן לכרטיסייה`); render(); }
  return c.others + n;
}

function stopSeries(id) {
  if (LIVE) return liveDo(() => API.adminStopSeries(id), n => `השיעור הקבוע הופסק${n ? ` · ${n} רשומות קיבלו הודעה` : ''}`);
  const se = S.series.find(x => x.id === id);
  se.until = now();
  let n = 0;
  for (const c of S.classes.filter(c => c.seriesId === id && c.start > now() && !c.cancelled)) n += adminCancelClass(c, true);
  save(); closeSheet(); render();
  toast(`השיעור הקבוע הופסק${n ? ` · ${n} רשומות קיבלו הודעה` : ''}`);
}

function demoFill() {
  S = fresh();
  S.user = {
    auth: 'google', name: 'נועה לוי', age: 31, phone: '050-0000000', email: 'noa.demo@gmail.com',
    profile: { danced: 'קצת, פה ושם', wants: ['להתחבר לגוף', 'להרגיש נשית ויפה'], heard: 'אינסטגרם' },
    health: { answers: CONFIG.healthQuestions.map(() => false), dance: { joints: false, surgery: false, pregnant: false }, details: '',
              signedAt: now() - 40 * D, validUntil: addDays(now() - 40 * D, 365 * CONFIG.healthValidYears), signature: 'נועה לוי', needsCert: false, cert: null },
    termsAt: now() - 40 * D,
  };
  // משתמשת לדוגמה: קנתה כרטיסיית 10 לפני 5 שבועות ורקדה 5 שיעורים
  const at = now() - 35 * D;
  S.purchases.push({ id: 'p1', productId: 'ten', name: 'כרטיסיית 10', credits: 10, remaining: 4, price: 670, at, expiresAt: at + 120 * D });
  const past = S.classes.filter(c => c.start + c.dur * 60e3 < now());
  const picks = [past.length - 11, past.length - 8, past.length - 6, past.length - 3, past.length - 1].map(i => past[Math.max(0, i)]);
  [...new Set(picks)].forEach((c, i) => S.bookings.push({ id: 'demo' + i, classId: c.id, purchaseId: 'p1', status: 'booked', at }));
  const next = S.classes.find(c => c.start > now() + CONFIG.cancelHours * H && spotsLeft(c) > 0);
  if (next) S.bookings.push({ id: uid(), classId: next.id, purchaseId: 'p1', status: 'booked', at: now() });
  // דוגמה להודעת ביטול: נועה הייתה רשומה לשיעור ששחר ביטלה
  const toCancel = S.classes.find(c => c.start > now() + 3 * D && c !== next && spotsLeft(c) > 0);
  if (toCancel) { const p = S.purchases[0]; p.remaining--; S.bookings.push({ id: uid(), classId: toCancel.id, purchaseId: p.id, status: 'booked', at: now() }); adminCancelClass(toCancel, true); }
  save(); go({ screen: null, tab: 'home' });
  toast('נכנסת למצב הדגמה ✨');
  addDemoVideos();
}

/** סרטוני דמו (נוצרים בדפדפן) לשיעור הראשון ולרביעי — כדי להראות את ההשוואה במסע */
async function addDemoVideos() {
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) return;
  const make = async (label, hue) => {
    const cv = document.createElement('canvas'); cv.width = 270; cv.height = 480;
    const g = cv.getContext('2d'), st = cv.captureStream(24);
    const rec = new MediaRecorder(st); const parts = []; rec.ondataavailable = e => parts.push(e.data);
    rec.start(); let f = 0;
    await new Promise(r => { const t = setInterval(() => {
      const gr = g.createLinearGradient(0, 0, 270, 480); gr.addColorStop(0, `hsl(${hue},55%,86%)`); gr.addColorStop(1, `hsl(${hue + 15},45%,72%)`);
      g.fillStyle = gr; g.fillRect(0, 0, 270, 480);
      const sway = Math.sin(f / 6) * 18;
      g.fillStyle = '#4A2E35'; g.beginPath(); g.arc(135 + sway * .4, 150, 18, 0, 7); g.fill();
      g.fillRect(128 + sway * .3, 170, 14, 80);
      g.fillStyle = 'rgba(196,112,95,.85)'; g.beginPath(); g.moveTo(135 + sway * .3, 245); g.quadraticCurveTo(60 + sway, 330, 70 + sway * 1.4, 360); g.lineTo(200 + sway * 1.4, 360); g.quadraticCurveTo(210 + sway, 330, 135 + sway * .3, 245); g.fill();
      g.fillStyle = '#4A2E35'; g.font = '600 20px Assistant, sans-serif'; g.textAlign = 'center'; g.fillText(label, 135, 430);
      if (++f > 48) { clearInterval(t); r(); }
    }, 42); });
    rec.stop(); await new Promise(r => rec.onstop = r);
    return new Blob(parts, { type: 'video/webm' });
  };
  try {
    for (const [id, label, hue] of [['demo0', 'סרטון לדוגמה · שיעור 1', 12], ['demo3', 'סרטון לדוגמה · שיעור 4', 100]]) {
      const b = S.bookings.find(b => b.id === id); if (!b) continue;
      await VDB.put(id, await make(label, hue));
      b.video = { name: 'demo.webm', at: now() };
    }
    save(); if (!ui.screen) render();
  } catch {}
}

/* ---------------- calendar (.ics) ---------------- */
function icsFor(c) {
  const z = t => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//shachar-dance//he',
    'BEGIN:VEVENT', `UID:${c.id}@shachar-dance`, `DTSTAMP:${z(now())}`,
    `DTSTART:${z(c.start)}`, `DTEND:${z(c.start + c.dur * 60e3)}`,
    `SUMMARY:${c.title} · ${CONFIG.brand}`, `LOCATION:${CONFIG.location}`,
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:שיעור ריקוד בעוד שעתיים', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
}

/* ---------------- UI state ---------------- */
let ui = { tab: 'home', screen: LIVE ? 'loading' : S.user ? null : 'welcome', week: null, sheet: null, form: {} };
let pendingCertFile = null;   // קובץ האישור הרפואי שנבחר בטופס ההצהרה (נשלח לשרת עם ההצהרה)
if (S.user && !isOnboarded()) ui.screen = !S.user.health ? 'health' : 'terms';

function go(patch) { Object.assign(ui, patch); window.scrollTo(0, 0); render(); }
function openSheet(sheet) { ui.sheet = sheet; renderSheet(); }
function closeSheet() { ui.sheet = null; renderSheet(); }

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

/* ---------------- icons ---------------- */
const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="4" y="5.5" width="16" height="14.5" rx="3"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>',
  journey: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>',
  me: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.4-3.6 4.2-5.3 7.5-5.3s6.1 1.7 7.5 5.3"/></svg>',
  clients: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="9" cy="8.5" r="3.3"/><path d="M3 19.5c1.1-3.1 3.4-4.6 6-4.6s4.9 1.5 6 4.6"/><circle cx="17" cy="9.5" r="2.6"/><path d="M16.5 14.6c2.2.1 3.8 1.5 4.6 4"/></svg>',
  admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M5 7h14M5 12h14M5 17h9"/></svg>',
  music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/></svg>',
  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="13" height="12" rx="3"/><path d="m16 10 5-3v10l-5-3z"/></svg>',
  lock: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
  google: '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h6a5.1 5.1 0 0 1-2.2 3.4v2.8h3.6c2-1.9 3.2-4.7 3.2-8.2z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.9A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.1H2a11 11 0 0 0 0 9.8L5.7 14z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2 7.1L5.7 10c.9-2.7 3.4-4.6 6.3-4.6z"/></svg>',
  apple: '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16.37 12.5c-.02-2.1 1.72-3.12 1.8-3.17-.98-1.43-2.5-1.63-3.05-1.65-1.3-.13-2.53.76-3.19.76-.66 0-1.67-.74-2.75-.72-1.41.02-2.72.82-3.45 2.09-1.47 2.55-.38 6.330 1.06 8.400.7 1.010 1.530 2.150 2.620 2.110 1.050-.040 1.450-.680 2.720-.680 1.270 0 1.630.680 2.740.660 1.130-.020 1.850-1.030 2.540-2.050.8-1.170 1.130-2.300 1.150-2.360-.030-.010-2.200-.850-2.220-3.360zM14.3 6.33c.58-.7.97-1.68.86-2.650-.83.030-1.840.550-2.440 1.250-.53.620-1 1.610-.88 2.560.93.070 1.880-.470 2.460-1.160z"/></svg>',
};

/* ---------------- render ---------------- */
const $app = document.getElementById('app');
let lastScreen;

function render() {
  const view_ = ui.screen || 'tab:' + ui.tab, same = view_ === lastScreen; lastScreen = view_;
  if (ui.screen) {
    $app.className = 'no-nav' + (ui.screen === 'welcome' ? ' is-welcome' : '') + (same ? ' no-anim' : '');
    $app.innerHTML = ({ loading: vLoading, welcome: vWelcome, auth: vAuth, meet: vMeet, about: vAbout, contact: vContact, health: vHealth, terms: vTerms }[ui.screen])();
    return;
  }
  $app.className = same ? 'no-anim' : '';
  const tabs = S.admin
    ? [['admin', 'ניהול', ICON.admin], ['clients', 'לקוחות', ICON.clients], ['me', 'פרופיל', ICON.me]]
    : S.guest ? [['home', 'בית', ICON.home], ['schedule', 'מערכת', ICON.cal], ['me', 'פרופיל', ICON.me]]
    : [['home', 'בית', ICON.home], ['schedule', 'מערכת', ICON.cal], ['journey', 'המסע', ICON.journey], ['me', 'פרופיל', ICON.me]];
  if (!tabs.some(t => t[0] === ui.tab)) ui.tab = tabs[0][0];
  const view = { home: S.guest ? vGuestHome : vHome, schedule: vSchedule, journey: vJourney, me: vMe, admin: vAdmin, clients: () => vClients() }[ui.tab]();
  $app.innerHTML = view + `<nav class="nav">${tabs.map(([id, label, icon]) =>
    `<button data-act="tab" data-id="${id}" class="${ui.tab === id ? 'active' : ''}">${icon}<span>${label}</span></button>`).join('')}</nav>`;
  hydrateVideos();
}

// הלוגו כטקסט: כמו באייקון (YOU דק, ה-Y מעט גדולה, ו-by Shahar בכתב יד)
const BRAND_MARK = `<span class="mark" dir="ltr"><span class="mark-you"><span class="mark-y">Y</span>OU</span><span class="mark-by">by Shahar</span></span>`;

function header(title) {
  const initial = S.user ? esc(S.user.name.trim()[0] || '♡') : '♡';
  return `<div class="top">
    <div class="brand">${title ? esc(title) : BRAND_MARK}</div>
    <button class="avatar" data-act="tab" data-id="me" aria-label="פרופיל">${initial}</button>
  </div>`;
}

/* ----- onboarding ----- */
const DANCER = `<svg class="dancer" viewBox="0 0 240 300" aria-hidden="true">
  <g class="sparkles" fill="#C4705F">
    <path class="sp" d="M40 60l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/>
    <path class="sp" style="animation-delay:1.2s" d="M210 70l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>
    <path class="sp" style="animation-delay:2.1s" d="M30 170l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/>
  </g>
  <path class="ribbon" d="M160 16 C 205 30, 214 82, 182 108 S 196 168, 234 158" fill="none" stroke="#C4705F" stroke-width="2.2" stroke-linecap="round"/>
  <g class="body">
    <g class="skirt">
      <path d="M112 128 C 84 158, 50 186, 20 232 Q 44 250 68 240 Q 94 256 120 246 Q 140 260 154 252 C 178 226, 192 198, 204 168 C 172 160, 138 148, 112 128 Z" fill="#F3CDBF"/>
      <path d="M113 130 C 100 168, 84 206, 74 244 Q 96 254 120 246 Q 136 256 148 252 C 140 212, 128 170, 113 130 Z" fill="#E4A797" opacity=".75"/>
      <path d="M202 170 C 216 176, 228 190, 232 206 C 214 200, 196 206, 184 216 Z" fill="#E4A797"/>
    </g>
    <path d="M141 252 C 146 264, 152 276, 162 286" fill="none" stroke="#4A2E35" stroke-width="3" stroke-linecap="round"/>
    <path d="M117 58 C 108 78, 106 104, 110 128 L 119 128 C 125 104, 131 82, 129 62 Z" fill="#4A2E35"/>
    <path d="M126 66 C 140 56, 151 36, 160 15" fill="none" stroke="#4A2E35" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M115 70 C 99 80, 80 96, 58 101" fill="none" stroke="#4A2E35" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="125" cy="44" r="13" fill="#4A2E35"/>
    <path d="M115 38 C 98 42, 90 60, 76 66 C 92 68, 106 58, 114 50 Z" fill="#4A2E35"/>
  </g>
</svg>`;

const PILLARS = [
  ['תנועה', 'לשחרר את מה שנתקע בגוף', '<path d="M3 14c3-6 6-6 9 0s6 6 9 0" />'],
  ['נשיות', 'להרגיש יפה, בדיוק כמו שאת', '<path d="M12 21c-4-3-7-6-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 4-3 7-7 10z"/>'],
  ['חיבור', 'לעצמך ולנשים שסביבך', '<circle cx="8.5" cy="12" r="5"/><circle cx="15.5" cy="12" r="5"/>'],
];

function vWelcome() {
  // מסך פתיחה נקי, בלי גלילה: שם הסטודיו, המשפט, שלוש הקופסאות וכפתור
  return `<div class="welcome">
    <div class="w-head fade" style="--d:0s">
      <h1 class="w-brand" aria-label="YOU by Shahar">${BRAND_MARK}</h1>
      <p class="w-tagline">${esc(CONFIG.tagline)}</p>
    </div>
    <blockquote class="w-quote fade" style="--d:.4s">"${esc(txt('welcomeQuote')).replace(/\n/g, '<br>')}"<cite>— שחר —</cite></blockquote>
    <div class="pillars fade" style="--d:.7s">
      ${PILLARS.map(([t, d, ic]) => `<div class="pillar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ic}</svg>
        <b>${t}</b><span>${d}</span></div>`).join('')}
    </div>
    <div class="w-cta">
      <button class="btn block rose" data-act="go" data-screen="auth">בואי נכיר 🤍</button>
      <button class="link" data-act="guest">הצצה בלי הרשמה: מערכת שיעורים ומחירים</button>
      ${LIVE ? '' : `<button class="link" data-act="demo">כניסה מהירה להדגמה</button>
      <button class="link" data-act="demoAdmin">הדגמה: כניסה כשחר (מנהלת)</button>`}
    </div>
  </div>`;
}

function vLoading() {
  return `<div class="hero"><div class="loader" aria-label="טוען"></div></div>`;
}

/** אחרי התחברות: לאן ממשיכים לפי מה שכבר מולא */
function routeAfterSync() {
  const u = S.user;
  if (!u) return go({ screen: 'welcome' });
  S.guest = false;
  // שחר (מנהלת) לא עוברת את תהליך ההרשמה של הלקוחות — ישר למסך הניהול
  if (S.isAdmin) { S.admin = true; return go({ screen: null, tab: 'admin' }); }
  if (u.age == null) { ui.form = { ...ui.form, auth: u.auth, name: ui.form.name || u.name, email: u.email || ui.form.email }; return go({ screen: 'meet' }); }
  if (!u.health) return go({ screen: 'health' });
  if (!u.termsAt) return go({ screen: 'terms' });
  go({ screen: null, tab: S.admin ? 'admin' : 'home' });
  // אם כבר הדליקה התראות בעבר — מוודאים שהטלפון רשום (בלי לשאול שוב)
  if (LIVE && (S.prefs.remind24 || S.prefs.remind2 || S.prefs.notify)) API.enablePush(false);
}
async function boot() {
  render();
  // חזרה מאפל/גוגל עם שגיאה — מציגים אותה (זמני, לאבחון)
  const qp = new URLSearchParams(location.search + '&' + location.hash.slice(1));
  if (qp.get('error_description') || qp.get('error')) toast('שגיאת התחברות: ' + (qp.get('error_description') || qp.get('error')));
  try {
    if (!(await API.session())) return go({ screen: 'welcome' });
    await API.sync();
    routeAfterSync();
  } catch (e) { toast(errHe(e) + ' · ' + (e?.message || e)); go({ screen: 'welcome' }); }
}

function vAuth() {
  return `${backBtn('welcome')}
  <div class="auth fade-in">
    <h1>בואי נכיר 🤍</h1>
    <p class="muted">כניסה בלחיצה אחת, בלי שם משתמש ובלי סיסמה.</p>
    <div class="stack" style="margin-top:28px">
      <button class="btn block auth-btn google" data-act="auth" data-id="google">${ICON.google}<span>המשך עם Google</span></button>
      <button class="btn block auth-btn apple" data-act="auth" data-id="apple">${ICON.apple}<span>המשך עם Apple</span></button>
    </div>
    <p class="tiny muted center" style="margin-top:14px">בהמשך את מאשרת את <a href="#" data-act="legal" data-id="privacy">מדיניות הפרטיות</a></p>
    <p class="tiny muted center" style="margin-top:6px">כבר נרשמת בעבר? אותו כפתור מחזיר אותך פנימה.${LIVE ? '' : '<br>מצב הדגמה: ההתחברות האמיתית תחובר בשלב השרת.'}</p>
    ${LIVE ? (ui.form.pw ? `<div class="stack" style="margin-top:22px">
        <label class="field"><span>אימייל</span><input class="input" id="pw-email" type="email" autocomplete="username" dir="ltr" style="text-align:right"></label>
        <label class="field"><span>סיסמה</span><input class="input" id="pw-pass" type="password" autocomplete="current-password" dir="ltr" style="text-align:right"></label>
        <button class="btn block ghost" data-act="pwLogin">כניסה</button>
      </div>` : `<div class="center" style="margin-top:22px"><button class="link tiny muted" data-act="pwShow">כניסה עם מייל וסיסמה</button></div>`) : ''}
  </div>`;
}

const STEP_COUNT = 5;
function steps(n) { return `<div class="steps">${Array.from({ length: STEP_COUNT }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>`; }
function backBtn(screen) { return `<button class="back" data-act="go" data-screen="${screen}" aria-label="חזרה">→</button>`; }

function vMeet() {
  const f = ui.form;
  return `${backBtn('auth')}${steps(1)}
  <div class="stack fade-in">
    <h1>נעים להכיר 🤍</h1>
    <p class="muted">כמה דברים קטנים, כדי ששחר תדע מי מגיעה.</p>
    ${f.auth === 'apple' ? '' : `<label class="field"><span>איך קוראים לך?</span><input class="input" id="f-name" value="${esc(f.name)}" autocomplete="name" placeholder="שם מלא"></label>`}
    <label class="field"><span>בת כמה את? <small class="muted">(נדרש להצהרת הבריאות)</small></span><input class="input" id="f-age" type="number" inputmode="numeric" min="14" max="99" value="${esc(f.age)}"></label>
    <button class="btn block" data-act="meet">המשך</button>
  </div>`;
}

const ABOUT = [
  { key: 'danced', q: 'רקדת פעם?', multi: false, opts: ['אף פעם — וזה בדיוק הזמן', 'קצת, פה ושם', 'כן, הרבה'] },
  { key: 'wants', q: 'מה הכי מושך אותך? (אפשר כמה)', multi: true, opts: ['להשתחרר', 'להתחבר לגוף', 'להרגיש נשית ויפה', 'זמן לעצמי', 'כושר וחיוניות', 'להכיר נשים חדשות'] },
  { key: 'heard', q: 'איך הגעת אלינו?', multi: false, opts: ['אינסטגרם', 'חברה המליצה', 'אחר'] },
];

function vAbout() {
  const f = ui.form;
  const first = esc((f.name || '').split(' ')[0]);
  return `${backBtn('meet')}${steps(2)}
  <div class="stack fade-in">
    <h1>נעים מאוד${first ? ', ' + first : ''} ✨</h1>
    <p class="muted">שלוש שאלות קטנות, רק לוחצים. לא חובה.</p>
    ${ABOUT.map(a => {
      const v = f[a.key] || (a.multi ? [] : null);
      return `<div class="card stack" style="margin-top:12px"><h3>${a.q}</h3><div class="chips">
        ${a.opts.map(o => `<button class="chip ${a.multi ? (v.includes(o) ? 'on' : '') : (v === o ? 'on' : '')}" data-act="about" data-k="${a.key}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}
      </div></div>`;
    }).join('')}
    <button class="btn block" data-act="aboutNext">המשך</button>
  </div>`;
}

function vContact() {
  const f = ui.form;
  const prov = f.auth === 'apple' ? 'Apple' : f.auth === 'google' ? 'Google' : null;
  return `${backBtn('about')}${steps(3)}
  <div class="stack fade-in">
    <h1>איך נשמור על קשר?</h1>
    <p class="muted">לשם יגיעו התזכורות לשיעורים והקבלות. בלי ספאם, מבטיחות.</p>
    <label class="field"><span>טלפון <small class="muted">(לא חובה)</small></span><input class="input" id="f-phone" type="tel" inputmode="tel" value="${esc(f.phone)}" autocomplete="tel" dir="ltr" style="text-align:right"></label>
    ${prov && f.email
      ? `<div class="note row"><span class="grow">האימייל שלך, מ-${prov}:<br><b dir="ltr">${esc(f.email)}</b></span></div>
         <p class="tiny muted">אפשר לשנות אותו אחר כך בפרופיל.${f.demoEmail ? ' (בהדגמה זו כתובת לדוגמה)' : ''}</p>`
      : `<label class="field"><span>אימייל</span><input class="input" id="f-email" type="email" value="${esc(f.email)}" autocomplete="email" dir="ltr" style="text-align:right"></label>`}
    <button class="btn block" data-act="contact">המשך</button>
  </div>`;
}

function vHealth() {
  const f = ui.form;
  const a = f.answers || (f.answers = CONFIG.healthQuestions.map(() => null));
  const b = f.dance || (f.dance = {});
  const anyYes = a.some(x => x === true);
  const first = esc((S.user?.name || '').split(' ')[0]);
  const minor = (S.user?.age || 99) < 18;
  const yn = (act, key, v) => `<div class="yn">
      <button class="${v === true ? 'on yes' : ''}" data-act="${act}" data-i="${key}" data-v="1">כן</button>
      <button class="${v === false ? 'on' : ''}" data-act="${act}" data-i="${key}" data-v="0">לא</button></div>`;
  let lastG = null;
  const rows = CONFIG.healthQuestions.map((h, i) => {
    const head = h.g && h.g !== lastG ? `<div class="q-group">${esc(h.g)}</div>` : '';
    lastG = h.g || null;
    return `${head}<div class="q ${h.g ? 'sub' : ''}"><div class="grow">${esc(h.q)}</div>${yn('yn', i, a[i])}</div>`;
  }).join('');
  return `${steps(4)}
  <div class="stack fade-in">
    <div class="lead-card">
      <p class="hand">כמעט רוקדות, ${first} 💃</p>
      <p>הגוף שלך הוא הכלי הכי יקר כאן. כמה שאלות קצרות, כדי ששחר תוכל לשמור עלייך בכל תנועה.</p>
    </div>
    <h1>הצהרת בריאות</h1>
    <p class="muted small">המידע נשמר באופן מאובטח, ורק שחר רואה אותו.</p>
    <div class="card" style="padding:4px 16px">${rows}</div>
    ${anyYes ? `<div class="note warn">ענית "כן" על אחת השאלות. זה לא אומר שאי אפשר לרקוד 🤍 רק צריך אישור קצר מרופא (מהשלושה חודשים האחרונים) שאין מניעה לפעילות גופנית. אפשר להעלות אותו עכשיו או אחר כך מהפרופיל — עד אז אי אפשר להירשם לשיעור.</div>
      <label class="upload" style="margin-top:0">${ICON.lock}<span>${f.cert ? `✓ ${esc(f.cert.name)}` : 'העלאת אישור רפואי'}</span><small>תמונה או PDF · אפשר גם אחר כך</small>
        <input type="file" accept="image/*,application/pdf" hidden data-cert="form"></label>` : ''}

    <h2 style="margin-top:22px">כדי ששחר תתאים לך את התנועה</h2>
    <p class="muted small">לא משפיע על ההרשמה — רק עוזר לשחר לדעת.</p>
    <div class="card" style="padding:4px 16px">
      ${CONFIG.danceQuestions.map(d => `<div class="q"><div class="grow">${esc(d.q)}</div>${yn('dq', d.k, b[d.k])}</div>`).join('')}
    </div>
    <label class="field"><span>עוד משהו ששחר כדאי שתדע? (לא חובה)</span><textarea class="input" id="f-details" placeholder="למשל: רגישות בכתף ימין">${esc(f.details)}</textarea></label>

    ${minor ? `<div class="card stack"><h3>את מתחת לגיל 18</h3><p class="small muted">צריך גם הסכמה של אחד ההורים.</p>
      <label class="field"><span>שם ההורה</span><input class="input" id="f-parent" value="${esc(f.parent)}"></label>
      <label class="check"><input type="checkbox" id="f-pok"> <span>ההורה מאשר/ת את השתתפותי בשיעורי ריקוד</span></label></div>` : ''}

    <label class="field"><span>חתימה — הקלידי את שמך המלא</span><input class="input" id="f-sign" value="${esc(f.sign || S.user?.name)}"></label>
    <label class="check"><input type="checkbox" id="f-hok"> <span>קראתי והבנתי את השאלון ומילאתי אותו בעצמי. מסרתי פרטים מלאים ונכונים, ואעדכן את שחר אם יחול שינוי במצבי הבריאותי. ידוע לי שההצהרה מתחדשת כל שנתיים.</span></label>
    <button class="btn block" data-act="health">המשך</button>
  </div>`;
}

function vTerms() {
  return `${steps(5)}
  <div class="stack fade-in">
    <p class="hand" style="font-size:20px;color:var(--rose-deep)">ועוד דבר קטן אחרון…</p>
    <h1>התקנון</h1>
    <p class="muted">קצר וברור, מבטיחה.</p>
    <div class="card terms">
      <h3>שיעורים ותוקף</h3>
      <ul>
        <li>שיעור בודד — בתוקף 21 יום.</li>
        <li>כרטיסיית 5 — בתוקף חודשיים. כרטיסיית 10 — בתוקף 4 חודשים.</li>
        <li>הכרטיסייה אישית ואינה ניתנת להעברה.</li>
        <li>אפשר לבטל רכישה תוך 14 יום, כל עוד לא השתמשת באף שיעור ממנה, בניכוי דמי ביטול כפי שהחוק מאפשר. אחרי זה אין החזר כספי, והשיעורים שנשארו מחכים לך עד סוף התוקף.</li>
      </ul>
      <h3>ביטולים</h3>
      <ul>
        <li>ביטול עד ${CONFIG.cancelHours} שעות לפני השיעור — השיעור חוזר לכרטיסייה במלואו.</li>
        <li>ביטול בפחות מ-${CONFIG.cancelHours} שעות לפני השיעור — השיעור נספר מהכרטיסייה.</li>
        <li>אי-הגעה או איחור — השיעור נספר מהכרטיסייה.</li>
        <li>שיעור שבוטל בזמן חוזר לכרטיסייה, ולא כהחזר כספי.</li>
        <li>אם שחר מבטלת שיעור — הוא חוזר לכרטיסייה של כל המשתתפות.</li>
      </ul>
      <h3>צילום</h3>
      <ul>
        <li>מותר לצלם את עצמך בשיעור. סרטונים ותמונות שמשתתפות מצלמות בעצמן, והפרסום שלהם, הם באחריותן בלבד.</li>
      </ul>
      <h3>בריאות ואחריות</h3>
      <ul>
        <li>ההשתתפות באחריותך ובהתאם להצהרת הבריאות שמילאת.</li>
        <li>יש לעדכן על כל שינוי במצב הבריאותי.</li>
      </ul>
    </div>
    <div class="card stack" style="margin-top:6px">
      <h3>צילומים בשיעורים 📷</h3>
      <p class="small">${PHOTO_TEXT}</p>
      ${photoChoice(ui.form.photo, 'photoForm')}
      <p class="tiny muted">${PHOTO_FINE}${(S.user?.age || 99) < 18 ? ' מתחת לגיל 18: ההורה שאישר/ה את ההשתתפות מאשר/ת גם את הבחירה הזו.' : ''}</p>
    </div>
    <p class="small" style="margin-top:4px">למסמכים המלאים: <a href="#" data-act="legal" data-id="cancel">ביטולים והחזרים</a> · <a href="#" data-act="legal" data-id="privacy">מדיניות פרטיות</a></p>
    <label class="check"><input type="checkbox" id="f-tok"> <span>קראתי ואני מאשרת את התקנון ואת מדיניות הפרטיות</span></label>
    <button class="btn block" data-act="terms">סיום והמשך לרכישה</button>
  </div>`;
}

/* ----- main views ----- */
function punchCard() {
  const act = activePurchases();
  const total = totalCredits();
  if (!act.length) {
    return `<div class="card punch empty">
      <p class="small muted">הכרטיסייה שלך</p>
      <div class="row between" style="margin-top:6px">
        <h2>עוד אין שיעורים</h2>
        <button class="btn sm" data-act="shop">לרכישת שיעורים</button>
      </div>
    </div>`;
  }
  const main = act[0];
  const daysLeft = Math.ceil((main.expiresAt - now()) / D);
  return `<div class="card punch">
    <div class="row between">
      <p class="small">${esc(main.name)}${act.length > 1 ? ` +${act.length - 1}` : ''}</p>
      <span class="tag" style="background:rgba(255,255,255,.6)">בתוקף עוד ${daysLeft} ימים</span>
    </div>
    <div class="row" style="align-items:baseline;margin-top:8px">
      <span class="big">${total}</span><span>${total === 1 ? 'שיעור נותר' : 'שיעורים נותרו'}</span>
    </div>
    <div class="dots">${Array.from({ length: main.credits }, (_, i) =>
      `<span class="dot ${i < main.credits - main.remaining ? 'used' : ''}">${i < main.credits - main.remaining ? '' : '♡'}</span>`).join('')}</div>
    ${total <= 1 ? `<button class="btn sm" style="margin-top:14px;position:relative;z-index:1" data-act="shop">לרכישת שיעורים</button>` : ''}
  </div>`;
}

function classRow(c, opts = {}) {
  const b = myBooking(c);
  const left = spotsLeft(c);
  let tag = '';
  if (c.cancelled) tag = '<span class="tag warn">בוטל</span>';
  else if (b) tag = '<span class="tag green">רשומה ✓</span>';
  else if (c.start < now()) tag = '<span class="tag">הסתיים</span>';
  else if (left <= 0) tag = '<span class="tag">מלא</span>';
  else if (left <= 3) tag = `<span class="tag rose">נשארו ${left} מקומות</span>`;
  return `<div class="card class-item ${c.cancelled ? 'cancelled' : ''}" data-act="class" data-id="${c.id}" role="button">
    <div class="time-pill">${fmtTime(c.start)}<small>${c.dur} דק׳</small></div>
    <div class="info">
      <div class="title">${esc(c.title)}</div>
      ${c.note && !c.cancelled ? `<div class="small" style="color:var(--rose-deep)">${esc(c.note)}</div>` : ''}
      ${opts.showDay ? `<div class="small muted">${fmtDay(c.start)} · ${relDay(c.start)}</div>` : ''}
      <div style="margin-top:4px">${tag}</div>
    </div>
    ${opts.cancel && b && !c.cancelled ? `<button class="btn sm ghost" data-act="cancel" data-id="${b.id}">ביטול</button>` : ''}
  </div>`;
}

/** הודעות מהסטודיו (למשל ביטול שיעור) */
function noticesBlock() {
  const list = S.notices.filter(n => !n.read);
  return list.map(n => `<div class="card notice fade-in">
    <div class="row between"><b>${esc(n.title)}</b><button class="link tiny" data-act="readNotice" data-id="${n.id}">סגירה</button></div>
    <p class="small" style="margin-top:4px">${esc(n.text)}</p>
  </div>`).join('');
}

function vHome() {
  const mine = S.classes.filter(c => c.start > now() && myBooking(c));
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'בוקר טוב' : hour < 18 ? 'צהריים טובים' : 'ערב טוב';
  return `${header()}
    <h1>${hello}, ${esc(S.user?.name.split(' ')[0] || '')} 🤍</h1>
    <p class="muted" style="margin:4px 0 20px">מה הגוף שלך מבקש השבוע?</p>
    ${noticesBlock()}
    ${S.user && S.user.termsAt && !S.user.photo ? `<div class="card stack fade-in">
      <h3>שאלה קטנה על צילומים 📷</h3>
      <p class="small">${PHOTO_TEXT}</p>
      ${photoChoice(null, 'photoSet')}
      <p class="tiny muted">${PHOTO_FINE}</p>
    </div>` : ''}
    ${(() => { const fc = upcomingFirstClass(); return fc ? `<button class="card first-banner" data-act="firstClass" data-id="${fc.id}">
      <span class="fb-star">✨</span><span class="grow"><b>בקרוב: השיעור הראשון שלך</b><span class="small" style="display:block">${fmtDay(fc.start)} · ${fmtTime(fc.start)} · כל מה שצריך לדעת ‹</span></span></button>` : ''; })()}
    ${punchCard()}
    <div class="dir-wrap"><button class="dir-pill" data-act="directions">📍 איך מגיעים</button></div>
    <div class="section-title"><h2>השיעורים שלי</h2><a href="#" data-act="tab" data-id="schedule">להרשמה</a></div>
    ${mine.length ? mine.map(c => classRow(c, { showDay: true })).join('')
      : `<div class="card empty-state"><div class="emoji">💃</div><p class="muted">עוד לא נרשמת לשיעורים.</p>
         <button class="btn sm soft" style="margin-top:12px" data-act="tab" data-id="schedule">למערכת השיעורים</button></div>`}
`;
}

/** בית בלי התחברות: מה זה הסטודיו, מחירים, איך מגיעים, והזמנה להירשם */
function vGuestHome() {
  const next = S.classes.filter(c => c.start > now() && !c.cancelled).slice(0, 3);
  return `${header()}
    <h1>שלום 🤍</h1>
    <p class="muted" style="margin:4px 0 20px">${esc(CONFIG.tagline)}</p>
    <div class="card stack">
      <h3>רוצה להצטרף לשיעור?</h3>
      <p class="small muted">כדי להירשם לשיעורים ולרכוש כרטיסייה צריך להתחבר עם Apple או Google.</p>
      <button class="btn block rose" data-act="go" data-screen="auth">התחברות והרשמה</button>
    </div>
    <div class="dir-wrap"><button class="dir-pill" data-act="directions">📍 איך מגיעים</button></div>
    <div class="section-title"><h2>השיעורים הקרובים</h2><a href="#" data-act="tab" data-id="schedule">לכל המערכת</a></div>
    ${next.length ? next.map(c => classRow(c, { showDay: true })).join('') : '<div class="card muted center">אין שיעורים בתקופה הקרובה</div>'}
    <div class="section-title"><h2>מחירים</h2><a href="#" data-act="shop">פירוט</a></div>
    <div class="card" style="padding:4px 18px">${CONFIG.products.map(p => `<div class="list-row"><span class="grow">${esc(p.name)}<span class="tiny muted" style="display:block">${esc(p.note)}</span></span><b>${p.price}₪</b></div>`).join('')}</div>`;
}

function vGuestMe() {
  return `${header('פרופיל')}
    <div class="card stack center">
      <h3>עוד לא התחברת</h3>
      <p class="small muted">התחברי כדי להירשם לשיעורים, לראות את הכרטיסייה שלך ולעקוב אחרי המסע שלך.</p>
      <button class="btn block rose" data-act="go" data-screen="auth">התחברות</button>
    </div>
    <div class="section-title"><h2>מסמכים</h2></div>
    <div class="card" style="padding:4px 18px">
      <button class="list-row plain" style="width:100%" data-act="legal" data-id="privacy"><span class="grow">מדיניות פרטיות</span><span class="muted">‹</span></button>
      <button class="list-row plain" style="width:100%" data-act="legal" data-id="cancel"><span class="grow">ביטולים והחזרים</span><span class="muted">‹</span></button>
      <button class="list-row plain" style="width:100%" data-act="legal" data-id="support"><span class="grow">תמיכה ושאלות נפוצות</span><span class="muted">‹</span></button>
    </div>
    <a class="btn block soft" style="margin-top:20px" href="${typeof waLink === 'function' ? waLink(S.whatsapp || CONFIG.whatsapp) : '#'}" target="_blank" rel="noopener">💬 שאלה? כתבי לשחר בוואטסאפ</a>`;
}

function vSchedule() {
  const from = startOfDay(now()), to = addDays(from, CONFIG.horizonDays);
  const list = S.classes.filter(c => c.start >= from && c.start < to && (S.admin || !c.cancelled || myBooking(c)));
  const months = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
  let html = '', lastDay = null, lastMonth = null;
  for (const c of list) {
    const d = startOfDay(c.start), m = new Date(d).getMonth();
    if (m !== lastMonth) { html += `<p class="month-head">${months[m]}</p>`; lastMonth = m; }
    if (d !== lastDay) {
      html += `<p class="day-head ${sameDayAsToday(d) ? 'today' : ''}">${fmtDay(d)}${sameDayAsToday(d) ? ' · היום' : d === addDays(from, 1) ? ' · מחר' : ''}</p>`;
      lastDay = d;
    }
    html += classRow(c);
  }
  return `${header('מערכת שיעורים')}
    <p class="muted small" style="margin-top:-8px">חודשיים קדימה · לחצי על שיעור ${S.guest ? 'כדי לראות פרטים' : 'כדי להירשם'}</p>
    ${html || '<div class="card empty-state"><div class="emoji">🌙</div><p class="muted">אין שיעורים בתקופה הקרובה.</p></div>'}`;
}
const sameDayAsToday = d => startOfDay(now()) === d;

function journeyEntry({ b, c }) {
  return `<div class="card j-entry">
    <div class="row between">
      <div><h3>${esc(c.title)}</h3><p class="small muted">${fmtDay(c.start)}</p></div>
    </div>
    ${c.songs?.length ? `<p class="tiny muted" style="margin:10px 0 4px">${c.songs.length === 1 ? 'השיר מהשיעור' : `השירים מהשיעור (${c.songs.length})`}</p>`
        + c.songs.map(sg => `<a class="song" href="${esc(sg.url)}" target="_blank" rel="noopener">${ICON.music}<span><b>${esc(sg.title)}</b>${sg.artist ? ` · ${esc(sg.artist)}` : ''}</span><small>בספוטיפיי ‹</small></a>`).join('')
      : '<p class="small muted" style="margin-top:10px">השירים מהשיעור יעלו בקרוב 🎶</p>'}
    ${b.video
      ? `<video data-vid="${b.id}" controls playsinline preload="metadata"></video>
         <div class="row between tiny muted"><span class="row" style="gap:4px">${ICON.lock} רק את רואה</span><button class="link tiny" data-act="delVideo" data-id="${b.id}">מחיקה</button></div>`
      : `<label class="upload">${ICON.video}<span>העלאת סרטון מהשיעור</span><small class="row" style="gap:4px">${ICON.lock} רק את רואה</small>
           <input type="file" accept="video/*" hidden data-upload="${b.id}"></label>`}
  </div>`;
}

function vJourney() {
  const list = attended();
  const n = list.length;
  const next = CONFIG.milestones.find(m => m.n > n);
  const reached = [...CONFIG.milestones].reverse().find(m => m.n <= n);
  const vids = list.filter(x => x.b.video);
  const first = vids[vids.length - 1], latest = vids[0];
  return `${header('המסע שלי')}
    <div class="card center" style="padding:26px 18px">
      <p class="muted small">רקדת איתנו</p>
      <div style="font-family:var(--serif);font-size:64px;line-height:1.1">${n}</div>
      <p>${n === 1 ? 'שיעור' : 'שיעורים'}</p>
      ${reached ? `<p class="feel-word" style="margin-top:10px">${esc(reached.label)}</p>` : '<p class="muted" style="margin-top:10px">המסע שלך מתחיל בשיעור הראשון ✨</p>'}
      <div class="milestones">${CONFIG.milestones.map(m => `<div class="ms ${n >= m.n ? 'done' : ''}"><b>${m.n}</b></div>`).join('')}</div>
      ${next ? `<p class="small muted">עוד ${next.n - n} ${next.n - n === 1 ? 'שיעור' : 'שיעורים'} ל"${esc(next.label)}"</p>` : '<p class="small">50 פעמים בחרת בעצמך. ממשיכות לרקוד 🤍</p>'}
    </div>

    ${n ? `<div class="section-title"><h2>ההתקדמות שלי</h2></div>
    ${vids.length >= 2 ? `<div class="card">
        <div class="compare">
          <div><video data-vid="${first.b.id}" controls playsinline preload="metadata"></video><p class="small center">${fmtDate(first.c.start)} · ההתחלה</p></div>
          <div><video data-vid="${latest.b.id}" controls playsinline preload="metadata"></video><p class="small center">${fmtDate(latest.c.start)} · היום</p></div>
        </div>
        <p class="small muted center" style="margin-top:8px">${vids.length} סרטונים במסע שלך. תסתכלי כמה השתנית 🤍</p>
      </div>`
      : `<div class="card note-soft"><p class="small">העלי סרטונים מכמה שיעורים, ותוכלי לראות כאן את הסרטון הראשון שלך לצד האחרון.${vids.length === 1 ? ' יש לך כבר אחד, עוד אחד וזה מתחיל ✨' : ''}</p></div>`}

    <div class="section-title"><h2>השיעורים שרקדת</h2></div>
    ${list.map(journeyEntry).join('')}` : ''}`;
}

function vMe() {
  if (S.guest) return vGuestMe();
  if (S.admin && typeof vAdminProfile === 'function') return vAdminProfile();
  const u = S.user;
  return `${header('הפרופיל שלי')}
    <div class="card row">
      <div class="avatar" style="width:52px;height:52px;font-size:22px">${esc(u?.name.trim()[0] || '♡')}</div>
      <div class="grow" style="min-width:0">
        <h3>${esc(u?.name)}</h3>
        <p class="small muted" dir="ltr" style="text-align:right">${esc(u?.phone)}</p>
        <p class="small muted" dir="ltr" style="text-align:right;overflow:hidden;text-overflow:ellipsis">${esc(u?.email)}</p>
      </div>
      <button class="btn sm ghost" data-act="editProfile">עריכה</button>
    </div>
    ${u?.auth === 'apple' || u?.auth === 'google' ? `<p class="tiny muted" style="margin:8px 4px 0">מחוברת עם ${u.auth === 'apple' ? 'Apple' : 'Google'}</p>` : u?.auth === 'anonymous' ? '<p class="tiny muted" style="margin:8px 4px 0">חשבון בדיקה</p>' : ''}

    <div class="section-title"><h2>הכרטיסיות שלי</h2><a href="#" data-act="shop">לרכישת שיעורים</a></div>
    ${S.purchases.length ? [...S.purchases].reverse().map(p => {
      const active = p.remaining > 0 && p.expiresAt > now();
      return `<div class="card">
        <div class="row between"><h3>${esc(p.name)}</h3>${active ? '<span class="tag green">פעילה</span>' : '<span class="tag">הסתיימה</span>'}</div>
        <p class="small muted" style="margin-top:4px">${p.remaining}/${p.credits} נותרו · בתוקף עד ${fmtDate(p.expiresAt)}</p>
      </div>`;
    }).join('') : '<div class="card muted center">עוד אין כרטיסיות</div>'}

    <div class="section-title"><h2>התראות לטלפון</h2></div>
    <p class="tiny muted" style="margin:-6px 4px 8px">כבויות עד שתדליקי. אפשר לשנות בכל רגע.</p>
    <div class="card" style="padding:4px 18px">
      <div class="list-row"><div class="grow">הודעות מהסטודיו<p class="tiny muted">שיעור שבוטל או הוזז, ועדכונים משחר</p></div><button class="switch ${S.prefs.notify ? 'on' : ''}" data-act="pref" data-k="notify" aria-label="הודעות מהסטודיו"></button></div>
      <div class="list-row"><div class="grow">יום לפני השיעור<p class="tiny muted">עם אפשרות לבטל בזמן</p></div><button class="switch ${S.prefs.remind24 ? 'on' : ''}" data-act="pref" data-k="remind24" aria-label="תזכורת יום לפני"></button></div>
      <div class="list-row"><div class="grow">שעתיים לפני<p class="tiny muted">כתובת ומה להביא</p></div><button class="switch ${S.prefs.remind2 ? 'on' : ''}" data-act="pref" data-k="remind2" aria-label="תזכורת שעתיים לפני"></button></div>
    </div>

    <div class="section-title"><h2>מסמכים</h2></div>
    <div class="card" style="padding:4px 18px">
      <div class="list-row"><span class="grow">הצהרת בריאות</span><span class="small muted">בתוקף עד ${u?.health?.validUntil ? fmtDate(u.health.validUntil) + '.' + String(new Date(u.health.validUntil).getFullYear()).slice(2) : '—'}</span></div>
      ${u?.health?.needsCert ? `<div class="list-row"><span class="grow">אישור רפואי</span>${u.health.cert
        ? '<span class="tag green">התקבל ✓</span>'
        : '<label class="btn sm rose">העלאה<input type="file" accept="image/*,application/pdf" hidden data-cert="profile"></label>'}</div>` : ''}
      <button class="list-row plain" style="width:100%" data-act="photoSheet"><span class="grow">צילומים בשיעורים<span class="tiny muted" style="display:block">${u?.photo ? photoShort(u.photo) : 'עוד לא בחרת'}</span></span><span class="muted">‹</span></button>
      <div class="list-row"><span class="grow">תקנון</span><span class="small muted">אושר ${u?.termsAt ? fmtDate(u.termsAt) : '—'}</span></div>
      <button class="list-row plain" style="width:100%" data-act="legal" data-id="privacy"><span class="grow">מדיניות פרטיות</span><span class="muted">‹</span></button>
      <button class="list-row plain" style="width:100%" data-act="legal" data-id="cancel"><span class="grow">ביטולים והחזרים</span><span class="muted">‹</span></button>
      <button class="list-row plain" style="width:100%" data-act="legal" data-id="support"><span class="grow">תמיכה ושאלות נפוצות</span><span class="muted">‹</span></button>
    </div>

    <a class="btn block soft" style="margin-top:20px" href="${typeof waLink === 'function' ? waLink(S.whatsapp || CONFIG.whatsapp) : '#'}" target="_blank" rel="noopener">💬 שאלה? כתבי לשחר בוואטסאפ</a>
    ${!LIVE || S.isAdmin ? `<hr>
    <div class="card" style="padding:4px 18px">
      <div class="list-row"><div class="grow"><b>מצב ניהול (שחר)</b><p class="tiny muted">${LIVE ? 'מופיע רק בחשבון של שחר' : 'באפליקציה האמיתית — רק לחשבון של שחר'}</p></div><button class="switch ${S.admin ? 'on' : ''}" data-act="admin" aria-label="מצב ניהול"></button></div>
    </div>` : ''}
    <div class="center" style="margin-top:18px"><button class="link" data-act="reset">${LIVE ? 'התנתקות' : 'איפוס נתוני ההדגמה'}</button></div>
    ${LIVE && !S.isAdmin ? `<div class="center" style="margin-top:6px"><button class="link tiny muted" data-act="deleteAccount">מחיקת החשבון</button></div>` : ''}`;
}

function shPhoto() {
  return `<div class="stack">
    <h1>צילומים בשיעורים 📷</h1>
    <p>${PHOTO_TEXT}</p>
    ${photoChoice(S.user?.photo, 'photoSet')}
    <p class="tiny muted">${PHOTO_FINE}</p>
  </div>`;
}

function shDeleteAccount() {
  return `<div class="stack">
    <h1>מחיקת החשבון</h1>
    <p>אם תמחקי את החשבון, יימחקו לצמיתות:</p>
    <div class="note">הפרטים שלך, הצהרת הבריאות והאישור הרפואי, ההרשמות לשיעורים, וגם <b>שיעורים שנשארו בכרטיסייה</b>.</div>
    <p class="small muted">פרטי התשלום נשמרים אצל תקבול לצורך קבלות, כפי שהחוק מחייב.</p>
    <button class="btn block rose" data-act="confirmDelete">כן, למחוק את החשבון</button>
    <button class="btn block ghost" data-act="close">ביטול</button>
  </div>`;
}

function vAdmin() {
  // שיעור שבוטל לא מוצג ברשימה (רק מבלגן). ההרשמות שלו כבר חזרו לכרטיסיות והלקוחות קיבלו הודעה
  const upcoming = S.classes.filter(c => c.start > now() - 7 * D && !c.cancelled).slice(0, 14);
  const weekCls = S.classes.filter(c => c.start > now() && c.start < now() + 7 * D && !c.cancelled);
  if (typeof adminEnsureLoaded === 'function') adminEnsureLoaded();
  return `${header('ניהול')}
    <div class="stats">
      <div class="card center"><p class="muted small">שיעורים השבוע</p><h2>${weekCls.length}</h2></div>
      <div class="card center"><p class="muted small">הרשמות השבוע</p><h2>${weekCls.reduce((s, c) => s + c.cap - spotsLeft(c), 0)}</h2></div>
      <button class="card center rv-tile" data-act="adRevenue"><p class="muted small">הכנסות החודש ‹</p><h2>${typeof monthRevenue === 'function' ? monthRevenue() : 0}₪</h2></button>
    </div>

    ${typeof tasksBlock === 'function' ? tasksBlock() : ''}

    <div class="section-title"><h2>שיעורים קרובים</h2><a href="#" data-act="newClass">+ שיעור חדש</a></div>
    ${upcoming.map(c => {
      const taken = c.cap - spotsLeft(c);
      const past = c.start < now();
      return `<div class="card ${c.cancelled ? 'cancelled' : ''} class-item" data-act="adminClass" data-id="${c.id}" role="button">
        <div class="time-pill">${fmtTime(c.start)}<small>${fmtDate(c.start)}</small></div>
        <div class="info"><div class="title">${esc(c.title)}</div>
          <div class="small muted">${c.cancelled ? 'בוטל' : `${taken}/${c.cap} רשומות`}${past && !c.cancelled ? (c.songs?.length ? ` · 🎵 ${c.songs.length} ${c.songs.length === 1 ? 'שיר' : 'שירים'}` : ' · <b style="color:var(--rose-deep)">חסרים שירים</b>') : ''}</div></div>
      </div>`;
    }).join('') || '<div class="card muted center small">אין שיעורים קרובים</div>'}

    <div class="section-title"><h2>המערכת הקבועה</h2></div>
    <div class="card" style="padding:4px 18px">
      ${S.series.filter(x => !x.until).sort((a, b) => a.dow - b.dow || a.h - b.h).map(x => `<div class="list-row">
        <div class="grow"><b>${esc(x.title)}</b><p class="tiny muted">כל יום ${dayNames[x.dow]} · ${pad(x.h)}:${pad(x.m)} · ${x.cap} מקומות</p></div>
        <button class="btn sm ghost" data-act="stopSeries" data-id="${x.id}">הפסקה</button></div>`).join('') || '<p class="muted small" style="padding:12px 0">אין שיעורים קבועים</p>'}
    </div>
    <p class="tiny muted" style="margin:8px 4px 0">כל שיעור קבוע מוצג אוטומטית חודשיים קדימה</p>
`;
}

/* ---------------- sheets ---------------- */
const $sheet = document.getElementById('sheet-root');

/** החלקה של חלונית כלפי מטה סוגרת אותה (כשהיא גלולה למעלה) */
(function sheetSwipe() {
  let y0 = null, dy = 0, el = null;
  document.addEventListener('touchstart', e => {
    el = e.target.closest('.sheet');
    if (!el || el.scrollTop > 0) { el = null; return; }
    y0 = e.touches[0].clientY; dy = 0; el.style.transition = 'none';
  }, { passive: true });
  document.addEventListener('touchmove', e => {
    if (!el) return;
    dy = e.touches[0].clientY - y0;
    if (dy > 0 && el.scrollTop <= 0) { el.style.transform = `translate(-50%, ${dy}px)`; if (e.cancelable) e.preventDefault(); }
  }, { passive: false });
  document.addEventListener('touchend', () => {
    if (!el) return;
    const s = el; el = null;
    s.style.transition = 'transform .22s ease';
    if (dy > 90) { s.style.transform = 'translate(-50%, 100%)'; setTimeout(closeSheet, 200); }
    else s.style.transform = '';
  });
})();

function renderSheet() {
  if (!ui.sheet) { $sheet.innerHTML = ''; return; }
  const s = ui.sheet;
  const body = ({ ...{ class: shClass, shop: shShop, checkout: shCheckout, pay: shPay, lateCancel: shLateCancel, cert: shCert, newClass: shNewClass, editProfile: shEditProfile, directions: shDirections, firstClass: shFirstClass, legal: shLegal, deleteAccount: shDeleteAccount, photo: shPhoto }, ...(window.EXTRA_SHEETS || {}) })[s.type](s);
  $sheet.innerHTML = `<div class="backdrop" data-act="close"></div><div class="sheet" role="dialog"><div class="grab"></div>${body}</div>`;
}

function shDirections() {
  const d = { ...CONFIG.directions, ...(S.directions || {}) }, q = encodeURIComponent(d.address);
  if (S.guest || !S.user || !d.code) return `<h2>איך מגיעים</h2>
    <div class="dir-facts"><p class="dir-address">${esc(d.address)}</p>
      <p class="small muted">סרטון ההגעה, הקומה וקוד הכניסה יופיעו כאן ${S.guest || !S.user ? 'אחרי ההרשמה ורכישת כרטיסייה' : 'אחרי רכישת כרטיסייה'} 🤍</p></div>
    <a class="btn block" href="https://waze.com/ul?q=${q}&navigate=yes" target="_blank" rel="noopener">ניווט ב-Waze</a>
    <a class="btn block ghost" style="margin-top:8px" href="https://maps.apple.com/?q=${q}" target="_blank" rel="noopener">ניווט במפות</a>`;
  return `<h2>איך מגיעים</h2>
    <video class="dir-video" src="${d.video}" poster="media/directions-poster.jpg" controls playsinline preload="metadata"></video>
    <div class="dir-facts">
      <p class="dir-address">${esc(d.address)}</p>
      <div class="dir-grid">
        <div><span>קומה</span><b>${esc(d.floor)}</b></div>
        <div><span>דלת</span><b>${esc(d.door)}</b></div>
        <div><span>קוד כניסה</span><b dir="ltr">${esc(d.code)}</b></div>
      </div>
    </div>
    <a class="btn block" href="https://waze.com/ul?q=${q}&navigate=yes" target="_blank" rel="noopener">ניווט ב-Waze</a>
    <a class="btn block ghost" style="margin-top:8px" href="https://maps.apple.com/?q=${q}" target="_blank" rel="noopener">ניווט במפות</a>`;
}

function shClass({ id }) {
  const c = cls(id);
  const b = myBooking(c);
  const left = spotsLeft(c);
  const past = c.start < now();
  const hrs = hoursUntil(c.start);
  let action = '';
  if (c.cancelled) action = '<div class="note warn">שחר ביטלה את השיעור הזה. אם נרשמת — השיעור חזר לכרטיסייה שלך.</div>';
  else if (past) action = '<div class="note">השיעור הזה כבר הסתיים.</div>';
  else if (b) action = `
    <a class="btn block soft" href="${icsFor(c)}" download="shiur.ics">הוספה ליומן</a>
    <button class="btn block ghost" data-act="cancel" data-id="${b.id}">ביטול ההרשמה</button>
    <p class="tiny muted center">${hrs >= CONFIG.cancelHours ? `ביטול חינם עד ${relDay(c.start - CONFIG.cancelHours * H)} ב-${fmtTime(c.start - CONFIG.cancelHours * H)}` : 'עברנו את חלון הביטול החינמי — ביטול עכשיו ייספר מהכרטיסייה'}</p>`;
  else if (left > 0 && (S.guest || !S.user)) action = `<button class="btn block rose" data-act="go" data-screen="auth">להרשמה לשיעור צריך להתחבר</button>
    <p class="tiny muted center">ההרשמה דורשת חשבון, כרטיסייה והצהרת בריאות</p>`;
  else if (left > 0) action = `<button class="btn block rose" data-act="book" data-id="${c.id}">הרשמה לשיעור</button>
    <p class="tiny muted center">ייספר שיעור אחד מהכרטיסייה · נותרו לך ${totalCredits()}</p>`;
  else action = '<div class="note">השיעור הזה מלא.</div>';
  return `<div class="stack">
    <div><p class="muted small">${fmtDay(c.start)}</p><h1>${esc(c.title)}</h1>${c.note ? `<p style="color:var(--rose-deep);margin-top:4px">${esc(c.note)}</p>` : ''}</div>
    <div class="row" style="gap:8px;flex-wrap:wrap">
      <span class="tag">${fmtTime(c.start)}–${fmtTime(c.start + c.dur * 60e3)}</span>
      <span class="tag">${c.dur} דקות</span>
      ${!c.cancelled && !past ? `<span class="tag ${left <= 3 ? 'rose' : ''}">${left > 0 ? `${left} מקומות פנויים` : 'מלא'}</span>` : ''}
    </div>
    <p class="small muted">📍 ${esc(CONFIG.location)}</p>
    ${action}
  </div>`;
}

function shShop() {
  return `<div class="stack">
    <h1>לרכישת שיעורים</h1>
    <p class="muted">בחרי מה מתאים לך. התשלום מאובטח דרך תקבול.</p>
    ${CONFIG.products.map(p => `
      <div class="card product ${p.featured ? 'featured' : ''}" data-act="pick" data-id="${p.id}" role="button">
        ${p.featured ? '<span class="badge">הכי משתלם</span>' : ''}
        <div class="count">${p.credits}</div>
        <div class="grow"><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.note)}${p.payments ? ` · עד ${p.payments} תשלומים` : ''}</p></div>
        <div class="price">${p.price}₪</div>
      </div>`).join('')}
  </div>`;
}

function shCheckout({ id }) {
  const p = product(id);
  return `<div class="stack">
    <h1>${esc(p.name)}</h1>
    <div class="card" style="padding:4px 18px">
      <div class="list-row"><span class="grow">שיעורים</span><b>${p.credits}</b></div>
      <div class="list-row"><span class="grow">תוקף</span><b>${p.days} יום</b></div>
      <div class="list-row"><span class="grow">לתשלום</span><b class="price">${p.price}₪</b></div>
      ${p.payments ? `<div class="list-row"><span class="grow">אפשר לחלק</span><b>עד ${p.payments} תשלומים</b></div>` : ''}
    </div>
    <div class="note">🔒 התשלום מאובטח דרך תקבול. פרטי האשראי לא נשמרים אצלנו, וקבלה תישלח אלייך במייל.${LIVE ? '' : '<br><b>מצב הדגמה:</b> לא מתבצע חיוב.'}</div>
    <button class="btn block rose" data-act="pay" data-id="${p.id}">לתשלום ${p.price}₪</button>
  </div>`;
}

// טופס האשראי של תקבול, בתוך האפליקציה
function shPay({ id, url }) {
  const p = product(id);
  return `<div class="stack">
    <h1>${esc(p.name)} · ${p.price}₪</h1>
    <iframe class="pay-frame" src="${esc(url)}" title="תשלום מאובטח" allow="payment"></iframe>
    <p class="small muted center">🔒 תשלום מאובטח בתקן PCI דרך תקבול</p>
  </div>`;
}

// תקבול שולח הודעה מתוך הטופס: מספר = גובה, אובייקט paymentreplay = תוצאת התשלום
let payDone = false;
async function finishPay(uniqId) {
  if (payDone) return; payDone = true;
  toast('מאשרות את התשלום…');
  try {
    for (let i = 0; i < 6; i++) {
      if (await API.payCheck(uniqId) === 'paid') break;
      await new Promise(r => setTimeout(r, 1500));
    }
    await API.sync();
  } catch (e) { console.warn(e); }
  closeSheet(); render();
  toast('איזה כיף! השיעורים שלך מחכים לך 💗');
}
window.addEventListener('message', e => {
  if (e.origin !== 'https://api.takbull.co.il' || ui.sheet?.type !== 'pay') return;
  let d = e.data;
  if (typeof d === 'string') { try { d = JSON.parse(d); } catch {} }
  if (d != null && !isNaN(parseInt(d))) {
    const f = document.querySelector('.pay-frame');
    if (f) f.style.height = Math.min(parseInt(d) + 50, window.innerHeight * 0.85) + 'px';
    return;
  }
  if (d?.message !== 'paymentreplay') return;
  let v = d.value;
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch {} }
  if (!v || isNaN(v.InternalCode)) return;
  if (+v.InternalCode !== 0) return toast(v.InternalDescription || 'התשלום לא עבר, אפשר לנסות שוב');
  finishPay(v.uniqId || ui.sheet.uniqId);
});

function shLateCancel({ bookingId }) {
  const b = S.bookings.find(b => b.id === bookingId);
  const c = cls(b.classId);
  return `<div class="stack">
    <h1>רגע לפני שמבטלים</h1>
    <p>השיעור מתחיל בעוד ${Math.max(1, Math.round(hoursUntil(c.start)))} שעות — פחות מ-${CONFIG.cancelHours} שעות.</p>
    <div class="note">לפי התקנון, ביטול מאוחר נספר מהכרטיסייה.</div>
    <button class="btn block" data-act="confirmCancel" data-id="${b.id}">כן, לבטל</button>
    <button class="btn block ghost" data-act="close">אני מגיעה בכל זאת</button>
  </div>`;
}

// גיליון שיעור במצב ניהול (משתתפות, נוכחות, שירים, עריכה): admin-tools.js

function shNewClass() {
  const d = new Date(now() + D);
  const dateVal = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const kind = ui.sheet.kind || 'weekly';
  return `<div class="stack">
    <h1>שיעור חדש</h1>
    <div class="seg">
      <button class="${kind === 'weekly' ? 'on' : ''}" data-act="ncKind" data-id="weekly">קבוע · כל שבוע</button>
      <button class="${kind === 'once' ? 'on' : ''}" data-act="ncKind" data-id="once">חד-פעמי</button>
    </div>
    <label class="field"><span>שם השיעור</span><input class="input" id="nc-title" value="זרימה נשית"></label>
    <div class="row">
      ${kind === 'weekly'
        ? `<label class="field grow"><span>יום</span><select class="input" id="nc-dow">${dayNames.map((n, i) => `<option value="${i}">יום ${n}</option>`).join('')}</select></label>`
        : `<label class="field grow"><span>תאריך</span><input class="input" id="nc-date" type="date" value="${dateVal}"></label>`}
      <label class="field grow"><span>שעה</span><input class="input" id="nc-time" type="time" value="20:00"></label>
    </div>
    <div class="row">
      <label class="field grow"><span>משך (דקות)</span><input class="input" id="nc-dur" type="number" value="60"></label>
      <label class="field grow"><span>מקומות</span><input class="input" id="nc-cap" type="number" value="12"></label>
    </div>
    ${kind === 'weekly' ? '<p class="note small">השיעור יופיע במערכת תמיד חודשיים קדימה. כל שבוע שעובר — נפתח אוטומטית עוד שבוע בסוף. לא צריך להוסיף אותו שוב.</p>' : ''}
    <button class="btn block" data-act="createClass">יצירה</button>
  </div>`;
}

function shCert() {
  return `<div class="stack">
    <h1>רגע לפני השיעור הראשון</h1>
    <p>בהצהרת הבריאות ענית "כן" על אחת השאלות, ולכן צריך אישור קצר מרופא שאין מניעה לפעילות גופנית (מהשלושה חודשים האחרונים).</p>
    <label class="btn block rose">העלאת אישור רפואי<input type="file" accept="image/*,application/pdf" hidden data-cert="profile"></label>
    <button class="btn block ghost" data-act="close">אחר כך</button>
  </div>`;
}

function shEditProfile() {
  const u = S.user;
  return `<div class="stack">
    <h1>עריכת פרטים</h1>
    <label class="field"><span>שם</span><input class="input" id="ep-name" value="${esc(u.name)}"></label>
    <label class="field"><span>טלפון <small class="muted">(לא חובה)</small></span><input class="input" id="ep-phone" type="tel" value="${esc(u.phone)}" dir="ltr" style="text-align:right"></label>
    <label class="field"><span>אימייל</span><input class="input" id="ep-email" type="email" value="${esc(u.email)}" dir="ltr" style="text-align:right"></label>
    <button class="btn block" data-act="saveProfile">שמירה</button>
  </div>`;
}

/* ---------------- events ---------------- */
const val = id => document.getElementById(id)?.value.trim() ?? '';
const validPhone = p => p.replace(/\D/g, '').length >= 9;
const validEmail = e => /^\S+@\S+\.\S+$/.test(e);

document.addEventListener('change', e => {
  const id = e.target.dataset?.upload;
  if (id) attachVideo(id, e.target.files[0]);
  const cert = e.target.dataset?.cert;
  if (cert) {
    const file = e.target.files[0]; if (!file) return;
    const rec = { name: file.name, at: now() };
    if (cert === 'form') { ui.form.cert = rec; pendingCertFile = file; const y = window.scrollY; render(); window.scrollTo(0, y); return toast('האישור יישלח יחד עם ההצהרה 🤍'); }
    if (LIVE) return liveDo(() => API.uploadCert(S.user.health.id, file), 'האישור הרפואי התקבל 🤍');
    S.user.health.cert = rec; save(); closeSheet(); render();
    toast('האישור הרפואי התקבל 🤍');
  }
});

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act, id = el.dataset.id;
  if (el.tagName === 'A' && el.getAttribute('href') === '#') e.preventDefault();

  switch (act) {
    case 'tab': closeSheet(); return go({ tab: id, week: id === 'schedule' ? null : ui.week });
    case 'go': return go({ screen: el.dataset.screen });
    case 'guest': {
      if (!LIVE) { S.guest = true; return go({ screen: null, tab: 'home' }); }
      if (busy) return; busy = true;
      return API.sync()
        .then(() => { S.guest = true; go({ screen: null, tab: 'home' }); })
        .catch(e => toast(errHe(e)))
        .finally(() => { busy = false; });
    }
    case 'pwShow': ui.form.pw = true; return render();
    case 'pwLogin': {
      const email = val('pw-email'), pass = document.getElementById('pw-pass')?.value || '';
      if (!validEmail(email) || !pass) return toast('צריך מייל וסיסמה');
      if (busy) return; busy = true;
      return (async () => {
        try { await API.signInPassword(email, pass); await API.session(); await API.sync(); ui.form = {}; routeAfterSync(); }
        catch (e) { toast(errHe(e)); }
        finally { busy = false; }
      })();
    }
    case 'demo': if (LIVE) { location.href = '?demo=home'; return; } return demoFill();
    case 'demoAdmin': demoFill(); S.user.name = 'שחר שני'; S.admin = true; save(); return go({ tab: 'admin' });
    case 'close': return closeSheet();
    case 'week': return go({ week: el.dataset.t ? +el.dataset.t : null });
    case 'class': return openSheet({ type: 'class', id });
    case 'book': return book(cls(id));
    case 'cancel': return cancelBooking(S.bookings.find(b => b.id === id));
    case 'confirmCancel': return cancelBooking(S.bookings.find(b => b.id === id), true);
    case 'shop': return openSheet({ type: 'shop' });
    case 'directions': return openSheet({ type: 'directions' });
    case 'firstClass': return openSheet({ type: 'firstClass', id });
    case 'legal': return openSheet({ type: 'legal', id });
    case 'pick': if (S.guest || !S.user) return requireAuth(); return openSheet({ type: 'checkout', id });
    case 'pay': {
      if (LIVE) {
        if (busy) return; busy = true;
        el.disabled = true; el.textContent = 'פותחות את דף התשלום…';
        return API.payCreate(id)
          .then(r => { payDone = false; openSheet({ type: 'pay', id, uniqId: r.uniqId, url: r.url }); })
          .catch(e => { toast(errHe(e)); renderSheet(); })
          .finally(() => { busy = false; });
      }
      buy(id); closeSheet(); render();
      return toast('איזה כיף! השיעורים שלך מחכים לך 💗');
    }
    case 'pref': {
      const k = el.dataset.k, on = !S.prefs[k];
      if (!LIVE) { S.prefs[k] = on; save(); return render(); }
      return (async () => {
        if (on && !(await API.enablePush(true))) {
          return toast(IS_NATIVE ? 'כדי לקבל התראות צריך לאשר אותן בהגדרות האייפון ← YOU ← הודעות' : 'התראות לטלפון יגיעו עם האפליקציה בחנות. בינתיים כל העדכונים מופיעים כאן בבית 🤍');
        }
        S.prefs[k] = on; save(); render();
        if (!S.prefs.remind24 && !S.prefs.remind2 && !S.prefs.notify) await API.disablePush();
        API.savePrefs(S.prefs).catch(e => toast(errHe(e)));
      })();
    }
    case 'admin': if (LIVE && !S.isAdmin) return; S.admin = !S.admin; save(); return go({ tab: S.admin ? 'admin' : 'me' });
    case 'readNotice': if (LIVE) return liveDo(() => API.readNotice(id), null, false);
    { S.notices.find(n => n.id === id).read = true; save(); return render(); }
    case 'delVideo': return removeVideo(id);
    case 'editProfile': return openSheet({ type: 'editProfile' });
    case 'saveProfile': {
      const name = val('ep-name'), phone = val('ep-phone'), email = val('ep-email');
      if (name.length < 2) return toast('חסר שם');
      if (phone && !validPhone(phone)) return toast('נראה שחסר משהו במספר הטלפון');
      if (email && !validEmail(email)) return toast('כתובת האימייל לא נראית תקינה');
      if (LIVE) return liveDo(() => API.saveProfile({ full_name: name, phone: phone || null, email: email || null }), 'הפרטים עודכנו ✨');
      Object.assign(S.user, { name, phone, email }); save(); closeSheet(); render();
      return toast('הפרטים עודכנו ✨');
    }
    case 'deleteAccount': return openSheet({ type: 'deleteAccount' });
    case 'photoSheet': return openSheet({ type: 'photo' });
    case 'photoForm': { ui.form.photo = el.dataset.v; const y = window.scrollY; render(); window.scrollTo(0, y); return; }
    case 'photoSet': {
      const v = el.dataset.v;
      if (LIVE) return liveDo(() => API.savePhoto(v), 'נשמר, תודה 🤍', true);
      S.user.photo = v; save(); closeSheet(); render(); return toast('נשמר, תודה 🤍');
    }
    case 'confirmDelete': {
      if (busy) return; busy = true;
      el.disabled = true; el.textContent = 'מוחקות…';
      return API.deleteAccount()
        .then(() => { try { localStorage.clear(); } catch {} location.reload(); })
        .catch(e => { busy = false; toast(errHe(e)); renderSheet(); });
    }
    case 'reset':
      if (LIVE) { if (confirm('להתנתק?')) API.signOut().then(() => location.reload()); return; }
      if (confirm('לאפס את כל נתוני ההדגמה?')) { S = fresh(); save(); VDB.clear().catch(() => {}); ui.form = {}; go({ screen: 'welcome', tab: 'home', week: null }); }
      return;

    case 'auth':
      if (LIVE) {
        // Apple / Google: מעבר לדף ההתחברות שלהם וחזרה לכאן. בדיקה: משתמשת אנונימית זמנית
        return (async () => {
          try {
            await API.signIn(id);
            // בדפדפן אפל/גוגל מעבירים לדף אחר; בבדיקה או באייפון (native) ממשיכים מכאן
            if (id !== 'test' && !((id === 'apple' || id === 'google') && IS_NATIVE)) return;
            await API.session(); await API.sync(); ui.form = {}; routeAfterSync();
          } catch (e) { toast(errHe(e)); }
        })();
      }
      // הדגמה בלבד — בשרת האמיתי: Supabase Auth עם Google / Sign in with Apple, והמייל מגיע מהחשבון
      ui.form = { auth: id, demoEmail: true, email: id === 'apple' ? 'your.name@privaterelay.appleid.com' : 'your.name@gmail.com' };
      return go({ screen: 'meet' });
    case 'meet': {
      const apple = ui.form.auth === 'apple';
      const name = apple ? (ui.form.name || '') : val('f-name'), age = val('f-age');
      Object.assign(ui.form, { name, age });
      if (!apple && name.length < 2) return toast('איך קוראים לך?');
      if (!(+age >= 14 && +age <= 99)) return toast('בת כמה את? 🙂');
      return go({ screen: 'about' });
    }
    case 'about': {
      const a = ABOUT.find(a => a.key === el.dataset.k), v = el.dataset.v;
      if (a.multi) {
        const arr = ui.form[a.key] || (ui.form[a.key] = []);
        arr.includes(v) ? arr.splice(arr.indexOf(v), 1) : arr.push(v);
      } else ui.form[a.key] = v;
      const y = window.scrollY; render(); window.scrollTo(0, y); return;
    }
    case 'aboutNext':
      return go({ screen: 'contact' });
    case 'contact': {
      const phone = val('f-phone'), email = document.getElementById('f-email') ? val('f-email') : ui.form.email;
      Object.assign(ui.form, { phone, email });
      if (phone && !validPhone(phone)) return toast('נראה שחסר משהו במספר הטלפון');
      if (email && !validEmail(email)) return toast('כתובת האימייל לא נראית תקינה');
      if (!email && ui.form.auth !== 'apple') return toast('כתובת האימייל חסרה');
      const f = ui.form;
      if (LIVE) {
        return (async () => {
          try {
            await API.saveProfile({ full_name: f.name, age: +f.age, phone: phone || null, email: email || null, danced: f.danced, wants: f.wants || [], heard: f.heard || null });
            await API.sync(); go({ screen: 'health' });
          } catch (e) { toast(errHe(e)); }
        })();
      }
      S.user = { auth: f.auth || null, name: f.name, age: +f.age, phone, email, profile: { danced: f.danced, wants: f.wants || [], heard: f.heard || null }, health: null, termsAt: null };
      save();
      return go({ screen: 'health' });
    }
    case 'yn': case 'dq': {
      ui.form.details = val('f-details') || ui.form.details;
      ui.form.sign = val('f-sign') || ui.form.sign;
      ui.form.parent = val('f-parent') || ui.form.parent;
      if (act === 'yn') ui.form.answers[+el.dataset.i] = el.dataset.v === '1';
      else ui.form.dance[el.dataset.i] = el.dataset.v === '1';
      const y = window.scrollY; render(); window.scrollTo(0, y); return;
    }
    case 'health': {
      const f = ui.form, a = f.answers;
      if (a.some(x => x === null)) return toast('נשארו שאלות בלי תשובה בחלק הראשון');
      if (CONFIG.danceQuestions.some(d => f.dance[d.k] == null)) return toast('נשארו שאלות בלי תשובה');
      if ((S.user.age || 99) < 18 && (val('f-parent').length < 2 || !document.getElementById('f-pok').checked)) return toast('צריך הסכמה של הורה');
      if (val('f-sign').length < 2) return toast('חסרה חתימה');
      if (!document.getElementById('f-hok').checked) return toast('צריך לאשר את ההצהרה');
      const needsCert = a.some(Boolean);
      if (LIVE) {
        const payload = { answers: a, dance: f.dance, details: val('f-details'), signature: val('f-sign'), parentName: (S.user.age || 99) < 18 ? val('f-parent') : null };
        return (async () => {
          try { await API.signHealth(payload, pendingCertFile); pendingCertFile = null; await API.sync(); go({ screen: 'terms' }); }
          catch (e) { toast(errHe(e)); }
        })();
      }
      S.user.health = {
        answers: a, dance: f.dance, details: val('f-details'), signature: val('f-sign'), signedAt: now(),
        validUntil: addDays(now(), 365 * CONFIG.healthValidYears),
        needsCert, cert: needsCert ? (f.cert || null) : null,
        parent: (S.user.age || 99) < 18 ? val('f-parent') : null,
      };
      save();
      return go({ screen: 'terms' });
    }
    case 'terms': {
      if (!ui.form.photo) return toast('בחרי מה מתאים לך לגבי צילומים בשיעור 📷');
      if (!document.getElementById('f-tok').checked) return toast('צריך לאשר את התקנון כדי להמשיך');
      if (LIVE) {
        return (async () => {
          try { await API.acceptTerms(ui.form.photo); await API.sync(); } catch (e) { return toast(errHe(e)); }
          go({ screen: null, tab: 'home' });
          if (needsCertMissing()) toast('תודה! אל תשכחי להעלות אישור רפואי מהפרופיל לפני השיעור הראשון 🤍');
          openSheet({ type: 'shop' });
        })();
      }
      S.user.termsAt = now(); S.user.photo = ui.form.photo; save();
      go({ screen: null, tab: 'home' });
      if (needsCertMissing()) toast('תודה! אל תשכחי להעלות אישור רפואי מהפרופיל לפני השיעור הראשון 🤍');
      return openSheet({ type: 'shop' });
    }

    /* admin */
    case 'adminClass':
      if (LIVE) return API.classRoster(id).then(roster => openSheet({ type: 'adminClass', id, roster })).catch(e => toast(errHe(e)));
      return openSheet({ type: 'adminClass', id });
    case 'adminCancel':
      if (confirm('לבטל את השיעור? כל הרשומות יקבלו הודעה שהשיעור בוטל, והשיעור יחזור להן לכרטיסייה.')) adminCancelClass(cls(id));
      return;
    case 'newClass': return openSheet({ type: 'newClass' });
    case 'ncKind': ui.sheet.kind = id; return renderSheet();
    case 'createClass': {
      const title = val('nc-title'), time = val('nc-time');
      const dur = +val('nc-dur') || 60, cap = +val('nc-cap') || 12;
      if (!title || !time) return toast('חסרים פרטים');
      const [h, m] = time.split(':').map(Number);
      if ((ui.sheet.kind || 'weekly') === 'weekly') {
        const dow = +val('nc-dow');
        if (LIVE) return liveDo(() => API.addSeries({ title, dow, h, m, dur, cap }), `נוסף שיעור קבוע ביום ${dayNames[dow]} ב-${time} · מוצג חודשיים קדימה ✨`);
        S.series.push({ id: 'sr' + uid(), dow, h, m, title, dur, cap, from: now(), until: null });
        const n = ensureHorizon();
        save(); closeSheet(); render();
        return toast(`נוסף שיעור קבוע ביום ${dayNames[dow]} ב-${time} · ${n} מופעים בחודשיים הקרובים ✨`);
      }
      const date = val('nc-date'); if (!date) return toast('חסר תאריך');
      if (LIVE) return liveDo(() => API.addClass({ title, start: new Date(`${date}T${time}`).getTime(), dur, cap }), 'השיעור נוצר ✨');
      S.classes.push({ id: uid(), title, start: new Date(`${date}T${time}`).getTime(), dur, cap, others: 0, cancelled: false, songs: [] });
      S.classes.sort((a, b) => a.start - b.start); save(); closeSheet(); render();
      return toast('השיעור נוצר ✨');
    }
    case 'stopSeries':
      if (confirm('להפסיק את השיעור הקבוע? כל המופעים העתידיים יבוטלו, והרשומות יקבלו הודעה והשיעור יחזור להן לכרטיסייה.')) stopSeries(id);
      return;
  }
});

document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.sheet) closeSheet(); });

// קישור ישיר לדוגמה: ?demo=journey (המסע של משתמשת לדוגמה) או ?demo=home
const demoParam = new URLSearchParams(location.search).get('demo');
if (LIVE) boot();
else if (demoParam) { demoFill(); go({ tab: ['home', 'schedule', 'journey', 'me'].includes(demoParam) ? demoParam : 'home' }); }
else render();
