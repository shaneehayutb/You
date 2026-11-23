/* ============================================================
   מנויים חודשיים (הוראת קבע בתקבול).
   - באפליקציה האמיתית: פעיל כשהמנויים הודלקו בשרת (app_settings.subs_enabled), ותמיד אצל שחר (לבדיקה).
   - תצוגה מקדימה בלי שרת ובלי חיוב: ?demo=1&subs=1
   מסלולים (מהשרת, טבלת sub_plans): גמישות 240 · ריקוד 260 · גמישות+ריקוד 460 · ריקוד פעמיים 480 · הכול 680
   ============================================================ */
(function () {
  const PREVIEW = !LIVE && new URLSearchParams(location.search).has('subs');
  if (!LIVE && !PREVIEW) return;
  const on = () => PREVIEW || (LIVE && !!S.user && (S.subsEnabled || S.isAdmin));

  /* ---------- נתונים: מסלולים ומשבצות ---------- */
  const DEMO_SLOTS = {
    flex: { dow: 0, h: 19, m: 0, title: 'שיעור גמישות', cap: 10, label: 'גמישות' },
    sun:  { dow: 0, h: 20, m: 0, title: 'שיעור ריקוד', cap: 12, label: 'ריקוד' },
    wed:  { dow: 3, h: 18, m: 0, title: 'שיעור ריקוד', cap: 12, label: 'ריקוד' },
  };
  const DEMO_PLANS = [
    { id: 'flex',   name: 'גמישות',                price: 240, fixed: ['flex'],               choose: 0 },
    { id: 'dance1', name: 'ריקוד',                 price: 260, fixed: [],                     choose: 1 },
    { id: 'combo',  name: 'גמישות + ריקוד',        price: 460, fixed: ['flex'],               choose: 1 },
    { id: 'dance2', name: 'ריקוד פעמיים בשבוע',     price: 480, fixed: ['sun', 'wed'],         choose: 0 },
    { id: 'all',    name: 'גמישות + ריקוד פעמיים', price: 680, fixed: ['flex', 'sun', 'wed'], choose: 0 },
  ];
  const EMOJI = { flex: '🧘‍♀️', dance1: '💃', combo: '🧘‍♀️💃', dance2: '💃💃', all: '✨', test: '🧪' };
  const TIMES = ['', 'פעם בשבוע', 'פעמיים בשבוע', 'שלוש פעמים בשבוע'];
  const DANCE_DAYS = ['sun', 'wed'];

  function slotInfo(k) {
    if (PREVIEW) return { ...DEMO_SLOTS[k], seriesId: k };
    const row = (S.subSlots || []).find(x => x.slot === k);
    const se = row && S.series.find(x => x.id === row.series_id);
    return se ? { dow: se.dow, h: se.h, m: se.m, title: se.title, cap: se.cap, label: row.label, seriesId: se.id }
      : { dow: k === 'wed' ? 3 : 0, h: k === 'flex' ? 19 : k === 'wed' ? 18 : 20, m: 0, title: '', cap: 0, label: row?.label || '', seriesId: null };
  }
  function plans() {
    const list = PREVIEW ? DEMO_PLANS : (S.subPlans || []).map(p => ({ id: p.id, name: p.name, price: p.price_ils, fixed: p.fixed_slots || [], choose: p.choose,
      from: p.available_from ? Date.parse(p.available_from) : null, adminOnly: p.admin_only }));
    return list.map(p => ({ ...p, emoji: EMOJI[p.id] || '✨', sub: p.id === 'dance2' ? 'ראשון + רביעי' : TIMES[p.fixed.length + (p.choose ? 1 : 0)] || '',
      best: p.id === 'all', soon: !!(p.from && p.from > now()) }));
  }
  const plan = id => plans().find(p => p.id === id) || { id, name: id, price: 0, fixed: [], choose: 0, emoji: '✨' };
  const slotTime = k => { const s = slotInfo(k); return `${pad(s.h)}:${pad(s.m)}`; };
  const dayOf = k => dayNames[slotInfo(k).dow];
  const slotsOf = (p, day) => [...p.fixed, ...(p.choose ? [day] : [])];
  const addMonth = t => { const d = new Date(t); d.setMonth(d.getMonth() + 1); return d.getTime(); };
  const fullDate = t => `${fmtDate(t)}.${String(new Date(t).getFullYear()).slice(2)}`;
  const TERMS = [
    'המנוי מתחדש אוטומטית בחיוב לכרטיס האשראי, בכל חודש מיום הרכישה, עד שמבטלים.',
    'מקום שמור לך אוטומטית בכל שיעור במסלול. אם לא תוכלי להגיע, לוחצים "לא אגיע" כדי לפנות את המקום.',
    'אין החזר או זיכוי על שיעור שלא הגעת אליו.',
    'בחגים אין שיעורים, ואין עליהם החזר או זיכוי. נודיע לפחות 30 יום מראש.',
    'אפשר לעבור לכל מסלול אחר. מסלול יקר יותר נכנס מיד, ומשלמים רק את ההפרש עד יום החידוש. מסלול זול יותר נכנס ביום החידוש.',
    'אפשר לבטל את המנוי בכל רגע דרך האפליקציה. אחרי הביטול לא יהיו חיובים נוספים, והמנוי פעיל עד מועד החידוש הקרוב. על חיוב שכבר בוצע אין החזר.',
    'המנוי אישי ואינו ניתן להעברה.',
  ];

  /* ---------- המנוי של הלקוחה ---------- */
  function sub() {
    if (PREVIEW) return S.sub || null;
    const ts = x => x ? Date.parse(x) : null, t = now();
    const all = (S.subs || []).map(x => ({ id: x.id, plan: x.plan_id, day: x.day, slots: x.slots || [], status: x.status, replaces: x.replaces,
      startAt: ts(x.started_at), renewAt: ts(x.renew_at), endsAt: ts(x.ends_at) }));
    const cur = all.find(x => ['active', 'failed', 'cancelled'].includes(x.status) && x.startAt && x.startAt <= t && (!x.endsAt || x.endsAt > t));
    if (!cur) return null;
    const next = all.find(x => x.status === 'active' && x.replaces === cur.id && x.startAt > t);
    return { ...cur, endsAt: next ? null : cur.endsAt, pending: next ? { plan: next.plan, day: next.day, slots: next.slots } : null };
  }
  const subBooking = c => S.bookings.find(b => b.classId === c.id && b.subId);

  /* ---------- הדגמה: נתונים ושיבוץ במכשיר ---------- */
  function setupPreview() {
    const from = addDays(startOfWeek(now()), -365);
    S.series = Object.entries(DEMO_SLOTS).map(([id, s]) => ({ id, dow: s.dow, h: s.h, m: 0, title: s.title, dur: 60, cap: s.cap, from, until: null, demo: true }));
    S.classes = []; ensureHorizon(S);
    S.bookings = []; S.purchases = []; S.notices = []; S.sub = null;
    if (S.user) S.user.photo = 'yes';
    const names = (students() || []).map(s => s.name);
    const ex = [['all'], ['dance1', 'sun'], ['dance1', 'wed'], ['combo', 'wed'], ['dance2'], ['flex'], ['dance1', 'sun'], ['combo', 'sun'], ['dance2']];
    S.demoSubs = ex.map(([pid, day], i) => {
      const start = now() - (3 + i * 3) * D;
      return { name: names[i] || 'לקוחה ' + (i + 1), plan: pid, day: day || null, slots: slotsOf(plan(pid), day), startAt: start, renewAt: addMonth(start),
        endsAt: i === 4 ? addMonth(start) : null, status: i === 4 ? 'cancelled' : 'active', pending: i === 1 ? { plan: 'combo', day: 'sun', slots: ['flex', 'sun'] } : null };
    });
  }
  function previewSync() {
    const s = sub();
    const want = c => !!s && !c.cancelled && c.start > now() && (s.pending && c.start >= s.renewAt ? s.pending.slots : s.slots).includes(c.seriesId) && (!s.endsAt || c.start < s.endsAt);
    S.bookings = S.bookings.filter(b => { if (!b.subId) return true; const c = cls(b.classId); return !c || c.start <= now() || want(c); });
    for (const c of S.classes) if (want(c) && !subBooking(c) && spotsLeft(c) > 0) S.bookings.push({ id: uid(), classId: c.id, subId: 'sub', status: 'booked', at: now() });
    save();
  }
  // פעולה: בהדגמה במכשיר, באמת — בשרת ואז טעינה מחדש
  async function act(liveFn, previewFn, okMsg) {
    try {
      if (PREVIEW) { previewFn(); previewSync(); }
      else { await liveFn(); await API.sync(); }
      render();
      if (okMsg) toast(okMsg);
      return true;
    } catch (e) { toast(errHe(e) + (e?.detail ? ' · ' + e.detail : '')); return false; }
  }

  /* ---------- מסך הבית ---------- */
  upcomingFirstClass = (orig => () => (on() && sub()) ? null : orig())(upcomingFirstClass);
  const origPunch = punchCard;
  punchCard = function () {
    if (!on()) return origPunch();
    const s = sub();
    const credits = totalCredits() > 0 ? origPunch() : '';
    if (!s) return credits || `<div class="card punch empty">
      <p class="small muted">המנוי שלך</p>
      <div class="row between" style="margin-top:6px"><h2>עוד אין לך מנוי</h2>
        <button class="btn sm" data-act="shop">לבחירת מנוי</button></div></div>`;
    const p = plan(s.plan), np = s.pending && plan(s.pending.plan);
    return `<div class="card punch" data-act="sbManage" role="button">
      <div class="row between"><p class="small">המנוי שלך</p>
        <span class="tag" style="background:rgba(255,255,255,.6)">${s.status === 'failed' ? 'החיוב לא עבר' : s.endsAt ? `מסתיים ב-${fullDate(s.endsAt)}` : `מתחדש ב-${fullDate(s.renewAt)}`}</span></div>
      <h2 style="margin-top:6px">${p.emoji} ${esc(p.name)}</h2>
      <div class="stack" style="gap:4px;margin-top:8px">${s.slots.map(k => `<p class="small">✓ כל יום ${dayOf(k)} ${slotTime(k)} · ${slotInfo(k).label}</p>`).join('')}</div>
      ${np ? `<p class="tiny" style="margin-top:8px">מ-${fullDate(s.renewAt)}: ${esc(np.name)} · ${np.price}₪</p>` : ''}
      <p class="tiny muted" style="margin-top:10px">ניהול המנוי ‹</p></div>${credits}`;
  };

  const origRow = classRow;
  classRow = function (c, o) {
    let h = origRow(c, o);
    if (!on()) return h;
    const b = subBooking(c);
    if (b && b.status === 'booked') h = h.replace('רשומה ✓', 'במנוי ✓');
    else if (b && b.status === 'cancelled' && c.start > now() && !c.cancelled) h = h.replace(/<div style="margin-top:4px">.*?<\/div>/s, '<div style="margin-top:4px"><span class="tag">לא מגיעה השבוע</span></div>');
    return h;
  };

  /* ---------- רכישה ---------- */
  function shSubShop() {
    const s = sub(), single = CONFIG.products.find(p => p.id === 'single') || CONFIG.products[0];
    const trials = s ? [] : CONFIG.products.filter(p => p.trial && !trialUsed(p.id));
    // קודם שיעור ניסיון ושיעור בודד, אחר כך המנויים
    const singleCard = single ? `<div class="card product" data-act="pick" data-id="${single.id}" role="button">
        <div class="count">1</div>
        <div class="grow"><h3>שיעור בודד</h3><p class="small muted">לשיעור ריקוד · בתוקף ${single.days} יום</p></div>
        <div class="price">${single.price}₪</div></div>` : '';
    return `<div class="stack">
      <h1>${s ? 'שיעור נוסף' : 'בחירת מנוי'}</h1>
      ${s ? `<p class="muted">יש לך מנוי פעיל (${esc(plan(s.plan).name)}). רוצה להגיע לשיעור נוסף?</p>${singleCard}`
          : `${trials.length ? '<p class="small muted">רוצה קודם לנסות?</p>' : ''}
      ${trials.map(p => `<div class="card product" data-act="pick" data-id="${p.id}" role="button">
        <div class="count" style="font-size:20px">${p.kind === 'flex' ? '🧘‍♀️' : '💃'}</div>
        <div class="grow"><h3>${esc(p.name)}</h3><p class="small muted">פעם אחת · בתוקף ${p.days} יום</p></div>
        <div class="price">${p.price}₪</div></div>`).join('')}
      ${singleCard}
      <h3 style="margin-top:10px">מנוי חודשי</h3>
      <p class="muted small" style="margin-top:4px">מנוי שמתחדש לבד. המקום שלך נשמר בכל שבוע, ולא צריך להירשם כל פעם מחדש.</p>
      ${plans().map(p => `<div class="card product ${p.best ? 'featured' : ''}" ${p.soon ? 'style="opacity:.55"' : `data-act="sbPick" data-id="${p.id}" role="button"`}>
        ${p.best && !p.soon ? '<span class="badge">הכי משתלם</span>' : ''}
        <div class="count" style="font-size:20px">${p.emoji}</div>
        <div class="grow"><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.sub)}${p.soon ? ` · נפתח ב-${fullDate(p.from)}` : ''}</p></div>
        <div class="price">${p.price}₪<small class="tiny muted" style="display:block;font-weight:400">לחודש</small></div></div>`).join('')}`}
      ${s ? '<button class="link small" data-act="sbManage">לניהול המנוי ‹</button>' : ''}
    </div>`;
  }

  function shSubDay({ id, mode }) {
    const p = plan(id);
    return `<div class="stack">
      <button class="link small" data-act="${mode === 'new' ? 'shop' : 'sbManage'}" style="align-self:flex-start">→ חזרה</button>
      <h1>באיזה יום תרקדי? 💃</h1>
      <p class="muted">${p.fixed.includes('flex') ? `שיעור הגמישות כבר כלול (${dayOf('flex')} ${slotTime('flex')}). עכשיו בוחרים את יום הריקוד הקבוע שלך.` : 'בוחרים יום אחד קבוע. המקום שלך יישמר בו בכל שבוע.'}</p>
      ${DANCE_DAYS.map(k => `<div class="card product" data-act="sbDay" data-id="${id}" data-day="${k}" data-mode="${mode}" role="button">
        <div class="count" style="font-size:15px;line-height:1.1">${dayOf(k)}<br><small>${slotTime(k)}</small></div>
        <div class="grow"><h3>כל יום ${dayOf(k)} ב-${slotTime(k)}</h3></div></div>`).join('')}
    </div>`;
  }

  function shSubConfirmDay({ id, day, mode }) {
    const d = dayOf(day), other = DANCE_DAYS.find(k => k !== day);
    return `<div class="stack center">
      <div class="done-heart" style="font-size:44px;margin-top:10px">🗓️</div>
      <h1>רק לוודא 🤍</h1>
      <p>בחרת לרקוד <b>כל יום ${d} ב-${slotTime(day)}</b>.</p>
      <div class="card" style="text-align:right;margin:0">
        <p class="small">✓ המקום שלך יישמר אוטומטית בכל יום ${d} ב-${slotTime(day)}.</p>
        <p class="small muted" style="margin-top:6px">ביום ${dayOf(other)} לא שמור לך מקום${mode === 'new' ? '. אפשר להגיע גם אליו עם שיעור נוסף.' : '.'}</p>
      </div>
      <button class="btn block rose" data-act="sbDayOk" data-id="${id}" data-day="${day}" data-mode="${mode}">כן, יום ${d} זה היום שלי</button>
      <button class="btn block ghost" data-act="sbPick" data-id="${id}" data-mode="${mode}">רוצה לבחור יום אחר</button>
    </div>`;
  }

  function shSubSummary({ id, day }) {
    const p = plan(id), slots = slotsOf(p, day), renew = addMonth(now());
    return `<div class="stack">
      <button class="link small" data-act="${p.choose ? 'sbPick' : 'shop'}" data-id="${id}" data-mode="new" style="align-self:flex-start">→ חזרה</button>
      <h1>${p.emoji} ${esc(p.name)}</h1>
      <div class="card" style="padding:4px 18px">
        ${slots.map(k => `<div class="list-row"><span class="grow">${slotInfo(k).label}</span><b>כל יום ${dayOf(k)} ${slotTime(k)}</b></div>`).join('')}
        <div class="list-row"><span class="grow">חיוב חודשי</span><b class="price">${p.price}₪</b></div>
        <div class="list-row"><span class="grow">החיוב הבא</span><b>${fullDate(renew)}</b></div>
      </div>
      <div class="card terms" style="max-height:none"><h3>תנאי המנוי</h3><ul>${TERMS.map(t => `<li>${t}</li>`).join('')}</ul></div>
      <label class="check"><input type="checkbox" id="sb-ok"> <span>קראתי ואני מאשרת את תנאי המנוי, כולל חיוב חודשי אוטומטי של ${p.price}₪ עד שאבטל</span></label>
      <div class="note">🔒 התשלום מאובטח דרך תקבול. קבלה תישלח אלייך במייל בכל חודש.${PREVIEW ? '<br><b>תצוגה מקדימה:</b> לא מתבצע חיוב.' : ''}</div>
      <button class="btn block rose" data-act="sbPay" data-id="${id}" data-day="${day || ''}">לתשלום ${p.price}₪ לחודש</button>
    </div>`;
  }

  // טופס האשראי של תקבול (אותו מנגנון כמו ברכישת כרטיסייה)
  const origPay = typeof shPay === 'function' ? shPay : null;
  function shSubPay(o) {
    if (!String(o.id || '').startsWith('sub:')) return origPay(o);
    const [, pid, mode, amt] = o.id.split(':'), p = plan(pid);
    return `<div class="stack">
      <h1>${p.emoji} ${esc(p.name)} · ${p.price}₪ לחודש</h1>
      ${mode === 'change' ? `<p class="small muted">החיוב הראשון במסלול החדש יהיה ביום החידוש. עכשיו רק מאשרים את הכרטיס.</p>` : ''}
      ${mode === 'upgrade' && amt ? `<p class="small muted">עכשיו יחויבו ${amt}₪, ההפרש עד יום החידוש. אחר כך ${p.price}₪ בכל חודש.</p>` : ''}
      <iframe class="pay-frame" src="${esc(o.url)}" title="תשלום מאובטח" allow="payment"></iframe>
      <p class="small muted center">🔒 תשלום מאובטח בתקן PCI דרך תקבול</p>
    </div>`;
  }
  if (LIVE) {
    const origFinish = finishPay;
    finishPay = async function (uniqId) {
      const had = !!sub(), wasSub = String(ui.sheet?.id || '').startsWith('sub:');
      await origFinish(uniqId);
      if (on() && wasSub && !had && sub()) openSheet({ type: 'sbWelcome' });
    };
  }

  function shSubWelcome() {
    const s = sub(); if (!s) return '<p class="muted">המנוי ייפתח בעוד רגע. אם הוא לא מופיע, נסי לרענן.</p>';
    const p = plan(s.plan);
    return `<div class="stack center">
      <div class="done-heart" style="font-size:54px;margin-top:10px">🤍</div>
      <h1>ברוכה הבאה למנוי!</h1>
      <p>${esc(p.name)} · ${p.price}₪ לחודש</p>
      <div class="card" style="text-align:right;margin:0">
        <h3>המקום שלך כבר שמור 🎉</h3>
        ${s.slots.map(k => `<p class="small" style="margin-top:6px">✓ כל יום ${dayOf(k)} ${slotTime(k)} · ${slotInfo(k).label}</p>`).join('')}
        <p class="tiny muted" style="margin-top:8px">לא צריך להירשם כל פעם מחדש.</p>
      </div>
      <button class="btn block" data-act="sbClose">מעולה</button>
    </div>`;
  }

  /* ---------- ניהול המנוי (הלקוחה) ---------- */
  function shSubManage() {
    const s = sub(); if (!s) return shSubShop();
    const p = plan(s.plan), np = s.pending && plan(s.pending.plan);
    const up = S.classes.filter(c => c.start > now() && !c.cancelled && subBooking(c)).slice(0, 8);
    return `<div class="stack">
      <h1>${p.emoji} ${esc(p.name)}</h1>
      <div class="card" style="padding:4px 18px;margin:0">
        <div class="list-row"><span class="grow">חיוב חודשי</span><b>${p.price}₪</b></div>
        <div class="list-row"><span class="grow">${s.endsAt ? 'המנוי מסתיים' : 'החיוב הבא'}</span><b>${fullDate(s.endsAt || s.renewAt)}</b></div>
        ${s.slots.map(k => `<div class="list-row"><span class="grow">${slotInfo(k).label}</span><b>כל יום ${dayOf(k)} ${slotTime(k)}</b></div>`).join('')}
      </div>
      ${s.status === 'failed' ? `<div class="note warn">החיוב החודשי לא עבר. כדאי לבדוק את כרטיס האשראי, או לכתוב לשחר.</div>` : ''}
      ${np ? `<div class="note">מ-${fullDate(s.renewAt)} המנוי יעבור ל<b>${esc(np.name)}</b> (${np.price}₪).</div>` : ''}
      ${s.endsAt ? `<div class="note warn">המנוי בוטל. הוא פעיל עד ${fullDate(s.endsAt)}, ולא יהיו חיובים נוספים.</div>` : ''}

      <h3>השיעורים הקרובים שלך</h3>
      <p class="tiny muted" style="margin-top:-6px">לא מגיעה? מבטלים כאן, כדי לפנות את המקום לאחרות. אין החזר על שיעור שלא מגיעים אליו.</p>
      <div class="card" style="padding:2px 14px;margin:0">${up.map(c => { const b = subBooking(c); return `<div class="list-row">
        <span class="grow"><b>${fmtDay(c.start)}</b><span class="tiny muted" style="display:block">${fmtTime(c.start)} · ${esc(c.title)}</span></span>
        ${b.status === 'booked' ? `<button class="btn sm ghost" data-act="sbSkip" data-id="${b.id}">לא אגיע</button>`
          : `<button class="btn sm soft" data-act="sbUnskip" data-id="${b.id}">בכל זאת אגיע</button>`}</div>`; }).join('') || '<p class="small muted" style="padding:10px 0">אין שיעורים קרובים בתקופה ששולמה</p>'}</div>

      ${!s.endsAt && s.status === 'active' ? `${p.choose && !np ? `<button class="btn block soft" data-act="sbPick" data-id="${p.id}" data-mode="changeDay">החלפת יום הריקוד</button>` : ''}
        ${!np ? '<button class="btn block soft" data-act="sbChange">שינוי מסלול</button>' : ''}
        <button class="btn block ghost" data-act="sbCancelAsk" style="color:var(--rose-deep)">ביטול המנוי</button>` : ''}
    </div>`;
  }

  // שדרוג (מסלול יקר יותר): נכנס עכשיו, משלמים את ההפרש עד החידוש. מסלול זול יותר: מיום החידוש.
  const curPrice = s => (PREVIEW ? plan(s.plan).price : (S.subs || []).find(x => x.id === s.id)?.price_ils) ?? plan(s.plan).price;
  const isUp = (s, p) => p.price > curPrice(s);
  function upNow(s, p) {
    const DAY = 86400000, start = new Date(s.renewAt); start.setMonth(start.getMonth() - 1);
    const period = Math.round((s.renewAt - start.getTime()) / DAY);
    const left = Math.min(period, Math.max(0, Math.ceil((s.renewAt - now()) / DAY)));
    return Math.max(1, Math.round((p.price - curPrice(s)) * left / period));
  }
  // כל המסלולים שהיא לא נמצאת בהם. יקר יותר: מתחיל עכשיו (משלמים הפרש). זול יותר: מיום החידוש.
  function shSubChange() {
    const s = sub(), cur = plan(s.plan);
    return `<div class="stack">
      <button class="link small" data-act="sbManage" style="align-self:flex-start">→ חזרה</button>
      <h1>שינוי מסלול</h1>
      <p class="muted">עכשיו את ב<b>${esc(cur.name)}</b>. לאיזה מסלול לעבור?</p>
      ${plans().filter(p => p.id !== s.plan && !p.soon).map(p => `<div class="card product" data-act="sbPick" data-id="${p.id}" data-mode="change" role="button">
        <div class="count" style="font-size:20px">${p.emoji}</div>
        <div class="grow"><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.sub)}</p>
          <p class="tiny muted">${isUp(s, p) ? `מתחיל מיד · עכשיו רק ${upNow(s, p)}₪` : `מתחיל ב-${fullDate(s.renewAt)}`}</p></div>
        <div class="price">${p.price}₪</div></div>`).join('')}
    </div>`;
  }

  function shSubConfirmChange({ id, day }) {
    const s = sub(), p = plan(id), cur = plan(s.plan);
    if (isUp(s, p)) { const amt = upNow(s, p); return `<div class="stack">
      <h1>לשדרג את המנוי?</h1>
      <div class="card" style="padding:4px 18px;margin:0">
        <div class="list-row"><span class="grow">המסלול החדש</span><b>${esc(p.name)}</b></div>
        ${slotsOf(p, day).map(k => `<div class="list-row"><span class="grow">${slotInfo(k).label}</span><b>כל יום ${dayOf(k)} ${slotTime(k)}</b></div>`).join('')}
        <div class="list-row"><span class="grow">לתשלום עכשיו</span><b>${amt}₪</b></div>
        <div class="list-row"><span class="grow">מ-${fullDate(s.renewAt)}, כל חודש</span><b>${p.price}₪</b></div>
      </div>
      <p class="small muted">${amt}₪ זה ההפרש בין המסלולים, רק על הימים שנשארו עד ${fullDate(s.renewAt)}. המקום שלך נשמר בשיעורים החדשים כבר מעכשיו.</p>
      <button class="btn block rose" data-act="sbChangeOk" data-id="${id}" data-day="${day || ''}">כן, לשדרג ולשלם ${amt}₪</button>
      <button class="btn block ghost" data-act="sbManage">לא, להשאיר כמו שזה</button>
    </div>`; }
    return `<div class="stack">
      <h1>לאשר את השינוי?</h1>
      <div class="card" style="padding:4px 18px;margin:0">
        <div class="list-row"><span class="grow">עד ${fullDate(s.renewAt)}</span><b>${esc(cur.name)} · ${cur.price}₪</b></div>
        <div class="list-row"><span class="grow">מ-${fullDate(s.renewAt)}</span><b>${esc(p.name)} · ${p.price}₪</b></div>
        ${slotsOf(p, day).map(k => `<div class="list-row"><span class="grow">${slotInfo(k).label}</span><b>כל יום ${dayOf(k)} ${slotTime(k)}</b></div>`).join('')}
      </div>
      <p class="small muted">החיוב החודשי ישתנה ל-${p.price}₪ מיום החידוש, והמקום שלך יישמר אוטומטית בשיעורים החדשים.${PREVIEW ? '' : ' בשלב הבא מאשרים שוב את כרטיס האשראי, בלי חיוב עכשיו.'}</p>
      <button class="btn block rose" data-act="sbChangeOk" data-id="${id}" data-day="${day || ''}">כן, לשנות מ-${fullDate(s.renewAt)}</button>
      <button class="btn block ghost" data-act="sbManage">לא, להשאיר כמו שזה</button>
    </div>`;
  }

  // בתוך 14 יום מתחילת המנוי, ולפני ששמר מקום בשיעור שכבר עבר: ביטול עסקה עם החזר (פחות 5% או 100 ₪)
  function withdrawInfo(s) {
    if (!s || s.replaces || !s.startAt || now() - s.startAt > 14 * D) return null;
    if (S.bookings.some(b => b.subId === s.id && b.status === 'booked' && cls(b.classId)?.start < now())) return null;
    const price = curPrice(s), fee = Math.round(Math.min(price * 0.05, 100) * 100) / 100;
    return { fee, amount: Math.round((price - fee) * 100) / 100 };
  }
  function shSubCancel() {
    const s = sub(), w = withdrawInfo(s);
    if (w) return `<div class="stack">
      <h1>ביטול המנוי</h1>
      <div class="card" style="margin:0">
        <p class="small">עוד לא עברו 14 יום מהרכישה, ועוד לא השתתפת בשיעור, אז אפשר לבטל את העסקה ולקבל החזר.</p>
        <p class="small" style="margin-top:6px">✓ יוחזרו לך <b>${w.amount}₪</b> לכרטיס האשראי (אחרי דמי ביטול של ${w.fee}₪).</p>
        <p class="small" style="margin-top:6px">✓ המנוי נסגר עכשיו, ולא יהיו חיובים נוספים.</p>
      </div>
      <button class="btn block" data-act="sbWithdrawOk" style="background:var(--rose-deep)">כן, לבטל ולקבל החזר</button>
      <button class="btn block ghost" data-act="sbManage">לא, אני נשארת 🤍</button>
      <p class="tiny muted center">נתקלת בבעיה? אפשר לכתוב לשחר בוואטסאפ.</p>
    </div>`;
    return `<div class="stack">
      <h1>ביטול המנוי</h1>
      <div class="card" style="margin:0">
        <p class="small">✓ המנוי שלך ימשיך עד <b>${fullDate(s.renewAt)}</b>, והמקום שלך נשמר עד אז.</p>
        <p class="small" style="margin-top:6px">✓ לא יהיו חיובים נוספים.</p>
        <p class="small muted" style="margin-top:6px">על החודש ששולם אין החזר.</p>
      </div>
      <button class="btn block" data-act="sbCancelOk" style="background:var(--rose-deep)">כן, לבטל את המנוי</button>
      <button class="btn block ghost" data-act="sbManage">לא, אני נשארת 🤍</button>
      <p class="tiny muted center">נתקלת בבעיה? אפשר לכתוב לשחר בוואטסאפ.</p>
    </div>`;
  }

  function shSubSkip({ bookingId }) {
    const b = S.bookings.find(x => x.id === bookingId), c = cls(b.classId);
    return `<div class="stack">
      <h1>לא מגיעה השבוע?</h1>
      <p>${fmtDay(c.start)} · ${fmtTime(c.start)} · ${esc(c.title)}</p>
      <div class="note">המקום שלך יתפנה לבנות אחרות. השיעור הזה לא מוחזר ולא מזוכה, והמנוי ממשיך כרגיל בשבוע הבא.</div>
      <button class="btn block" data-act="sbSkipOk" data-id="${b.id}">כן, לא אגיע</button>
      <button class="btn block ghost" data-act="sbClose">ביטול</button>
    </div>`;
  }

  /* ---------- מסך הניהול של שחר ---------- */
  function adminSubs() {
    if (PREVIEW) return [...(sub() ? [{ ...sub(), name: (S.user?.name || 'נועה') + ' (את, בתצוגה)' }] : []), ...(S.demoSubs || [])];
    const ts = x => x ? Date.parse(x) : null, t = now();
    const rows = (S.adminData?.subs || []).map(x => ({ id: x.id, userId: x.user_id, name: x.name, plan: x.plan_id, day: x.day, slots: x.slots || [], status: x.status,
      replaces: x.replaces, startAt: ts(x.started_at), renewAt: ts(x.renew_at), endsAt: ts(x.ends_at) }));
    const cur = rows.filter(x => x.startAt && x.startAt <= t && (!x.endsAt || x.endsAt > t));
    return cur.map(x => { const nx = rows.find(y => y.replaces === x.id && y.status === 'active' && y.startAt > t);
      return nx ? { ...x, endsAt: null, pending: { plan: nx.plan, day: nx.day, slots: nx.slots } } : x; });
  }
  const openSlots = new Set();   // אילו שיעורים פתוחים ברשימת המנויים (בניהול)
  function adminSubsBlock() {
    const list = adminSubs(), active = list.filter(s => !s.endsAt && s.status !== 'failed');
    const mrr = active.reduce((t, s) => t + plan(s.plan).price, 0);
    const week = ['flex', 'sun', 'wed'].map(k => {
      const si = slotInfo(k); if (!si.seriesId) return '';
      const c = S.classes.find(x => x.seriesId === si.seriesId && x.start > now() && !x.cancelled);
      const who = list.filter(s => s.slots.includes(k)).sort((a, b) => String(a.name).localeCompare(String(b.name), 'he'));
      const open = openSlots.has(k);
      return c ? `<button class="list-row plain" style="width:100%;text-align:right" data-act="sbSlotToggle" data-k="${k}" aria-expanded="${open}">
          <span class="grow">${fmtDay(c.start)} ${slotTime(k)}<span class="tiny muted" style="display:block">${esc(si.title)}</span></span>
          <b>${who.length}/${si.cap} מנויות</b><span class="muted" style="margin-inline-start:8px">${open ? '▴' : '▾'}</span></button>
        ${open ? `<div style="padding:0 6px 10px">${who.map(s => `<button class="list-row plain" style="width:100%;text-align:right;padding:8px 0" ${s.userId ? `data-act="adStudent" data-id="${s.userId}"` : ''}>
            <span class="grow">${esc(s.name || '—')}<span class="tiny muted" style="display:block">${esc(plan(s.plan).name)}${s.endsAt ? ` · מסתיים ${fullDate(s.endsAt)}` : ''}${s.status === 'failed' ? ' · החיוב לא עבר' : ''}</span></span>
            ${s.userId ? '<span class="muted">‹</span>' : ''}</button>`).join('') || '<p class="small muted" style="padding:8px 0">עוד אין מנויות בשיעור הזה</p>'}</div>` : ''}` : '';
    }).join('');
    return `<div class="section-title"><h2>מנויים</h2><a href="#" data-act="sbAdminList">לכל המנויות</a></div>
      ${LIVE && !S.subsEnabled ? '<div class="note">המנויים עוד כבויים ללקוחות. רק את רואה אותם כרגע.</div>' : ''}
      <div class="stats">
        <div class="card center"><p class="muted small">מנויות פעילות</p><h2>${active.length}</h2></div>
        <div class="card center"><p class="muted small">הכנסה חודשית קבועה</p><h2>${mrr.toLocaleString('he-IL')}₪</h2></div>
      </div>
      ${week ? `<div class="card" style="padding:4px 18px">${week}</div>` : ''}`;
  }
  function adminSubsList() {
    const list = adminSubs();
    return `<div class="section-title"><h2>מנויות</h2></div>
      <div class="card" style="padding:4px 18px">${list.map((s, i) => { const p = plan(s.plan), np = s.pending && plan(s.pending.plan); return `
        <button class="list-row plain" style="width:100%;text-align:right" data-act="sbAdminEdit" data-i="${i}">
          <span class="grow"><b>${esc(s.name)}</b><span class="tiny muted" style="display:block">${esc(p.name)} · ${s.slots.map(k => `${dayOf(k)} ${slotTime(k)}`).join(', ')}</span>
            ${s.status === 'failed' ? '<span class="tag warn" style="margin-top:4px">החיוב לא עבר</span>'
              : s.endsAt ? `<span class="tag warn" style="margin-top:4px">מסתיים ${fullDate(s.endsAt)}</span>`
              : np ? `<span class="tag" style="margin-top:4px">עוברת ל${esc(np.name)} ב-${fullDate(s.renewAt)}</span>` : `<span class="tiny muted">מתחדש ${fullDate(s.renewAt)}</span>`}</span>
          <b>${p.price}₪</b></button>`; }).join('') || '<p class="muted small" style="padding:12px 0">עוד אין מנויות</p>'}</div>`;
  }
  const origAdmin = vAdmin;
  vAdmin = function () { const h = origAdmin(); if (!on()) return h; const i = h.indexOf('<div class="section-title">'); return i < 0 ? h + adminSubsBlock() : h.slice(0, i) + adminSubsBlock() + h.slice(i); };
  const origClients = vClients;
  vClients = function () { const h = origClients(); if (!on()) return h; const i = h.indexOf('<div class="section-title"><h2>כל הלקוחות'); const blk = adminSubsList(); return i < 0 ? h + blk : h.slice(0, i) + blk + h.slice(i); };
  function shSubAdminList() { return `<div class="stack"><h1>מנויות</h1>${adminSubsList()}</div>`; }
  function shSubAdminEdit({ i }) {
    const s = adminSubs()[i], p = plan(s.plan);
    return `<div class="stack">
      <h1>${esc(s.name)}</h1>
      <div class="card" style="padding:4px 18px;margin:0">
        <div class="list-row"><span class="grow">מסלול</span><b>${esc(p.name)} · ${p.price}₪</b></div>
        ${s.slots.map(k => `<div class="list-row"><span class="grow">${slotInfo(k).label}</span><b>${dayOf(k)} ${slotTime(k)}</b></div>`).join('')}
        <div class="list-row"><span class="grow">${s.endsAt ? 'מסתיים' : 'חידוש הבא'}</span><b>${fullDate(s.endsAt || s.renewAt)}</b></div>
        <div class="list-row"><span class="grow">התחילה</span><b>${fullDate(s.startAt)}</b></div>
      </div>
      <p class="small muted">הלקוחה יכולה לשנות יום ומסלול, ולבטל, בעצמה באפליקציה.</p>
      ${!s.endsAt && s.status !== 'cancelled' ? `<button class="btn block ghost" data-act="sbAdminCancel" data-i="${i}" style="color:var(--rose-deep)">ביטול המנוי שלה (בלי חיובים נוספים)</button>` : ''}
    </div>`;
  }

  /* ---------- חלוניות ---------- */
  const origShop = shShop;
  window.EXTRA_SHEETS = { ...(window.EXTRA_SHEETS || {}),
    shop: o => on() ? shSubShop() : origShop(o), pay: shSubPay,
    sbDay: shSubDay, sbConfirmDay: shSubConfirmDay, sbSummary: shSubSummary, sbWelcome: shSubWelcome, sbManage: shSubManage,
    sbChange: shSubChange, sbConfirmChange: shSubConfirmChange, sbCancel: shSubCancel, sbSkip: shSubSkip,
    sbAdminList: shSubAdminList, sbAdminEdit: shSubAdminEdit };

  /* ---------- פעולות ---------- */
  let working = false;
  async function startPay(action, id, day, mode, btn) {
    if (working) return; working = true;
    if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = 'פותחות את דף התשלום…'; }
    try {
      const r = await API.subOrder(action, id, day || '');
      payDone = false;
      openSheet({ type: 'pay', id: `sub:${id}:${mode}:${r.amountNow ?? ''}`, uniqId: r.uniqId, url: r.url });
    } catch (e) {
      toast(errHe(e) + (e?.detail ? ' · ' + e.detail : ''));
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
    }
    finally { working = false; }
  }
  document.addEventListener('click', e => {
    if (!on()) return;
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act_ = el.dataset.act, id = el.dataset.id, ds = el.dataset;
    // ביטול הרשמה לשיעור שבמנוי = "לא אגיע השבוע"
    if (act_ === 'cancel') { const b = S.bookings.find(x => x.id === id); if (b?.subId) { e.stopImmediatePropagation(); return openSheet({ type: 'sbSkip', bookingId: b.id }); } return; }
    if (act_ === 'book') {
      const c = cls(id), b = c && subBooking(c);
      if (b && b.status === 'cancelled') { e.stopImmediatePropagation(); closeSheet(); return act(() => API.subUnskip(b.id), () => { b.status = 'booked'; }, 'מעולה, את בפנים 🤍'); }
      return;
    }
    if (!act_.startsWith('sb')) return;
    if (el.tagName === 'A') e.preventDefault();
    e.stopImmediatePropagation();
    switch (act_) {
      case 'sbPick': { const p = plan(id), mode = ds.mode || 'new';
        if (mode === 'new' && !p.choose) return openSheet({ type: 'sbSummary', id });
        if (mode === 'change' && !p.choose) return openSheet({ type: 'sbConfirmChange', id });
        return openSheet({ type: 'sbDay', id, mode }); }
      case 'sbDay': return openSheet({ type: 'sbConfirmDay', id, day: ds.day, mode: ds.mode });
      case 'sbDayOk': {
        if (ds.mode === 'new') return openSheet({ type: 'sbSummary', id, day: ds.day });
        if (ds.mode === 'change') return openSheet({ type: 'sbConfirmChange', id, day: ds.day });
        return act(() => API.subChangeDay(ds.day), () => { const s = sub(); s.day = ds.day; s.slots = slotsOf(plan(s.plan), ds.day); },
          `עודכן 🤍 מעכשיו המקום שלך שמור ביום ${dayOf(ds.day)}`).then(ok => ok && openSheet({ type: 'sbManage' }));
      }
      case 'sbPay': {
        if (!document.getElementById('sb-ok')?.checked) return toast('צריך לאשר את תנאי המנוי');
        const p = plan(id), day = ds.day || null;
        if (PREVIEW) {
          S.sub = { plan: id, day, slots: slotsOf(p, day), startAt: now(), renewAt: addMonth(now()), endsAt: null, pending: null, status: 'active' };
          previewSync(); render(); return openSheet({ type: 'sbWelcome' });
        }
        return startPay('subCreate', id, day, 'new', el);
      }
      case 'sbManage': return openSheet({ type: 'sbManage' });
      case 'sbChange': return openSheet({ type: 'sbChange' });
      case 'sbChangeOk': {
        const p = plan(id), s = sub();
        const up = isUp(s, p);
        if (PREVIEW && up) { S.sub = { ...s, plan: id, day: ds.day || null, slots: slotsOf(p, ds.day || null) }; previewSync(); render(); openSheet({ type: 'sbManage' }); return toast(`המנוי שודרג ל${p.name} 🤍`); }
        if (PREVIEW) { s.pending = { plan: id, day: ds.day || null, slots: slotsOf(p, ds.day || null) }; previewSync(); render(); openSheet({ type: 'sbManage' }); return toast(`מ-${fullDate(s.renewAt)} המנוי יעבור ל${p.name}`); }
        return startPay(up ? 'subUpgrade' : 'subChange', id, ds.day, up ? 'upgrade' : 'change', el);
      }
      case 'sbCancelAsk': return openSheet({ type: 'sbCancel' });
      case 'sbCancelOk': {
        const s = sub();
        return act(() => API.subCancel(), () => { s.endsAt = s.renewAt; s.pending = null; }, 'המנוי בוטל. נתראה עד ' + fullDate(s.renewAt) + ' 🤍')
          .then(ok => ok && openSheet({ type: 'sbManage' }));
      }
      case 'sbWithdrawOk': {
        if (PREVIEW) { S.sub = null; previewSync(); render(); closeSheet(); return toast('המנוי בוטל, וההחזר בדרך 🤍'); }
        if (working) return; working = true; el.disabled = true; el.textContent = 'מבטלות…';
        return API.subWithdraw().then(async r => { await API.sync(); render(); closeSheet(); toast(`המנוי בוטל. יוחזרו לך ${r.amount}₪ 🤍`); })
          .catch(err => { toast(errHe(err)); el.disabled = false; el.textContent = 'כן, לבטל ולקבל החזר'; })
          .finally(() => { working = false; });
      }
      case 'sbSkip': return openSheet({ type: 'sbSkip', bookingId: id });
      case 'sbSkipOk': { const b = S.bookings.find(x => x.id === id);
        return act(() => API.cancel(id), () => { b.status = 'cancelled'; }, 'המקום התפנה. נתראה בשבוע הבא 🤍').then(ok => ok && openSheet({ type: 'sbManage' })); }
      case 'sbUnskip': { const b = S.bookings.find(x => x.id === id);
        if (PREVIEW && spotsLeft(cls(b.classId)) <= 0) return toast('השיעור כבר מלא');
        return act(() => API.subUnskip(id), () => { b.status = 'booked'; }, 'מעולה, את בפנים 🤍').then(ok => ok && openSheet({ type: 'sbManage' })); }
      case 'sbClose': closeSheet(); return render();
      case 'sbSlotToggle': { const k = ds.k; openSlots.has(k) ? openSlots.delete(k) : openSlots.add(k); return render(); }
      case 'sbAdminList': return openSheet({ type: 'sbAdminList' });
      case 'sbAdminEdit': return openSheet({ type: 'sbAdminEdit', i: +ds.i });
      case 'sbAdminCancel': {
        const s = adminSubs()[+ds.i];
        if (!confirm(`לבטל את המנוי של ${s.name}? היא תמשיך עד ${fullDate(s.renewAt)}, ולא יהיו חיובים נוספים.`)) return;
        if (PREVIEW) { s.endsAt = s.renewAt; closeSheet(); render(); return toast('המנוי בוטל'); }
        return API.subCancel(s.id).then(async () => { S.adminData = await API.adminLoad(); closeSheet(); render(); toast('המנוי בוטל'); })
          .catch(err => toast(errHe(err) + (err?.detail ? ' · ' + err.detail : '')));
      }
      case 'sbRole': S.admin = !S.admin; save(); closeSheet(); return go({ screen: null, tab: S.admin ? 'admin' : 'home' });
      case 'sbReset': location.reload(); return;
    }
  }, true);

  /* ---------- תצוגה מקדימה: פס עליון והפעלה ---------- */
  if (PREVIEW) {
    const bar = document.createElement('div');
    bar.id = 'sb-preview';
    bar.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 6px);left:50%;transform:translateX(-50%);z-index:60;background:#4A2E33;color:#fff;border-radius:999px;padding:6px 8px 6px 14px;font-size:13px;display:flex;gap:8px;align-items:center;box-shadow:0 6px 20px rgba(0,0,0,.18);white-space:nowrap';
    bar.innerHTML = '<span>👀 תצוגה מקדימה · מנויים</span><button data-act="sbRole" style="background:#fff;color:#4A2E33;border:0;border-radius:999px;padding:4px 10px;font-size:12px">לקוחה / ניהול</button><button data-act="sbReset" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5);border-radius:999px;padding:4px 10px;font-size:12px">מההתחלה</button>';
    document.body.appendChild(bar);
    document.getElementById('app').style.paddingTop = '44px';
    setupPreview(); save(); go({ screen: null, tab: 'home' });
  }
})();
