/* ============================================================
   תצוגה מקדימה: מנויים חודשיים (עדיין לא פעיל ללקוחות).
   נטען תמיד, אבל פועל רק בכתובת עם ?demo=1&subs=1 (מצב הדגמה, בלי שרת ובלי חיוב).
   מסלולים: גמישות 240 · ריקוד פעם בשבוע 260 · גמישות+ריקוד 460 · ריקוד פעמיים 480 · הכול 680
   ============================================================ */
(function () {
  if (LIVE || !new URLSearchParams(location.search).has('subs')) return;

  const SLOTS = {
    flex: { dow: 0, h: 19, title: 'שיעור גמישות', cap: 10, label: 'גמישות' },
    sun:  { dow: 0, h: 20, title: 'נשיות בקצב', cap: 12, label: 'ריקוד' },
    wed:  { dow: 3, h: 18, title: 'נשיות בקצב', cap: 12, label: 'ריקוד' },
  };
  const DANCE_DAYS = ['sun', 'wed'];
  const PLANS = [
    { id: 'flex',   name: 'גמישות',                sub: 'פעם בשבוע',        price: 240, fixed: ['flex'],               choose: 0, emoji: '🧘‍♀️' },
    { id: 'dance1', name: 'ריקוד',                 sub: 'פעם בשבוע',        price: 260, fixed: [],                     choose: 1, emoji: '💃' },
    { id: 'combo',  name: 'גמישות + ריקוד',        sub: 'פעמיים בשבוע',     price: 460, fixed: ['flex'],               choose: 1, emoji: '🧘‍♀️💃' },
    { id: 'dance2', name: 'ריקוד פעמיים בשבוע',     sub: 'ראשון + רביעי',     price: 480, fixed: ['sun', 'wed'],         choose: 0, emoji: '💃💃' },
    { id: 'all',    name: 'גמישות + ריקוד פעמיים', sub: 'שלוש פעמים בשבוע', price: 680, fixed: ['flex', 'sun', 'wed'], choose: 0, emoji: '✨', best: true },
  ];
  const plan = id => PLANS.find(p => p.id === id);
  const slotTime = k => `${pad(SLOTS[k].h)}:00`;
  const slotName = k => `${SLOTS[k].label} · יום ${dayNames[SLOTS[k].dow]} ${slotTime(k)}`;
  const slotsOf = (p, day) => [...p.fixed, ...(p.choose ? [day] : [])];
  const perClass = p => Math.round(p.price / (slotsOf(p, 'sun').length * 4.33));
  const addMonth = t => { const d = new Date(t); d.setMonth(d.getMonth() + 1); return d.getTime(); };
  const fullDate = t => `${fmtDate(t)}.${String(new Date(t).getFullYear()).slice(2)}`;
  const nextDates = (k, n = 3) => S.classes.filter(c => c.seriesId === k && c.start > now() && !c.cancelled).slice(0, n);
  const TERMS = [
    'המנוי מתחדש אוטומטית בחיוב לכרטיס האשראי, בכל חודש מיום הרכישה, עד שמבטלים.',
    'מקום שמור לך אוטומטית בכל שיעור במסלול. אם לא תוכלי להגיע, אפשר לבטל את השיעור באפליקציה כדי לפנות את המקום.',
    'אין החזר או זיכוי על שיעור שלא הגעת אליו.',
    'בחגים אין שיעורים.',
    'אפשר לבטל את המנוי בכל רגע דרך האפליקציה. אחרי הביטול לא יהיו חיובים נוספים, והמנוי פעיל עד מועד החידוש הקרוב. על חיוב שכבר בוצע אין החזר.',
    'המנוי אישי ואינו ניתן להעברה.',
  ];

  /* ---------- נתוני ההדגמה ---------- */
  function setup() {
    const from = addDays(startOfWeek(now()), -365);
    S.series = Object.entries(SLOTS).map(([id, s]) => ({ id, dow: s.dow, h: s.h, m: 0, title: s.title, dur: 60, cap: s.cap, from, until: null, demo: true }));
    S.classes = []; ensureHorizon(S);
    S.bookings = []; S.purchases = []; S.notices = []; S.sub = null;
    if (S.user) S.user.photo = 'yes';
    // מנויות לדוגמה במסך הניהול
    const names = (students() || []).map(s => s.name);
    const ex = [['all'], ['dance1', 'sun'], ['dance1', 'wed'], ['combo', 'wed'], ['dance2'], ['flex'], ['dance1', 'sun'], ['combo', 'sun'], ['dance2']];
    S.demoSubs = ex.map(([pid, day], i) => {
      const start = now() - (3 + i * 3) * D;
      return { name: names[i] || 'לקוחה ' + (i + 1), plan: pid, day: day || null, startAt: start, renewAt: addMonth(start),
        endsAt: i === 4 ? addMonth(start) : null, pending: i === 1 ? { plan: 'combo', day: 'sun' } : null };
    });
    S.demoSubs.forEach(s => { s.slots = slotsOf(plan(s.plan), s.day); });
  }

  /* ---------- שיבוץ אוטומטי לשיעורים ---------- */
  const sub = () => S.sub;
  const slotsAt = t => { const s = sub(); if (!s) return []; return s.pending && t >= s.renewAt ? s.pending.slots : s.slots; };
  const shouldBook = c => { const s = sub(); return !!s && !c.cancelled && c.start > now() && slotsAt(c.start).includes(c.seriesId) && (!s.endsAt || c.start < s.endsAt); };
  const subBooking = c => S.bookings.find(b => b.classId === c.id && b.subId);
  function resync() {
    S.bookings = S.bookings.filter(b => {
      if (!b.subId) return true;
      const c = cls(b.classId);
      return !c || c.start <= now() || shouldBook(c);
    });
    for (const c of S.classes) if (shouldBook(c) && !subBooking(c) && spotsLeft(c) > 0) S.bookings.push({ id: uid(), classId: c.id, subId: 'sub', status: 'booked', at: now() });
    save();
  }

  /* ---------- מסך הבית: כרטיס המנוי במקום הכרטיסייה ---------- */
  // למנויות אין צורך בבאנר "השיעור הראשון שלך": הן יודעות באילו ימים
  upcomingFirstClass = () => null;

  punchCard = function () {
    const s = sub();
    if (!s) return `<div class="card punch empty">
      <p class="small muted">המנוי שלך</p>
      <div class="row between" style="margin-top:6px"><h2>עוד אין לך מנוי</h2>
        <button class="btn sm" data-act="shop">לבחירת מנוי</button></div></div>`;
    const p = plan(s.plan), np = s.pending && plan(s.pending.plan);
    return `<div class="card punch" data-act="sbManage" role="button">
      <div class="row between"><p class="small">המנוי שלך</p>
        <span class="tag" style="background:rgba(255,255,255,.6)">${s.endsAt ? `מסתיים ב-${fullDate(s.endsAt)}` : `מתחדש ב-${fullDate(s.renewAt)}`}</span></div>
      <h2 style="margin-top:6px">${p.emoji} ${esc(p.name)}</h2>
      <div class="stack" style="gap:4px;margin-top:8px">${s.slots.map(k => `<p class="small">✓ כל יום ${dayNames[SLOTS[k].dow]} ${slotTime(k)} · ${SLOTS[k].label}</p>`).join('')}</div>
      ${np ? `<p class="tiny" style="margin-top:8px">מ-${fullDate(s.renewAt)}: ${esc(np.name)} · ${np.price}₪</p>` : ''}
      <p class="tiny muted" style="margin-top:10px">ניהול המנוי ‹</p></div>`;
  };

  // שיעור במנוי: "במנוי ✓" במקום "רשומה ✓"
  const origRow = classRow;
  classRow = function (c, o) {
    let h = origRow(c, o);
    const b = subBooking(c);
    if (b && b.status === 'booked') h = h.replace('רשומה ✓', 'במנוי ✓');
    else if (b && b.status === 'cancelled' && c.start > now()) h = h.replace(/<div style="margin-top:4px">.*?<\/div>/s, '<div style="margin-top:4px"><span class="tag">לא מגיעה השבוע</span></div>');
    return h;
  };

  /* ---------- רכישת מנוי ---------- */
  function shSubShop() {
    const s = sub(), single = CONFIG.products.find(p => p.id === 'single') || CONFIG.products[0];
    return `<div class="stack">
      <h1>${s ? 'שיעור נוסף' : 'בחירת מנוי'}</h1>
      ${s ? `<p class="muted">יש לך מנוי פעיל (${esc(plan(s.plan).name)}). רוצה להגיע לשיעור נוסף?</p>`
          : `<p class="muted">מנוי חודשי שמתחדש לבד. המקום שלך נשמר בכל שבוע, ולא צריך להירשם כל פעם מחדש.</p>
      ${PLANS.map(p => `<div class="card product ${p.best ? 'featured' : ''}" data-act="sbPick" data-id="${p.id}" role="button">
        ${p.best ? '<span class="badge">הכי משתלם</span>' : ''}
        <div class="count" style="font-size:20px">${p.emoji}</div>
        <div class="grow"><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.sub)}</p></div>
        <div class="price">${p.price}₪<small class="tiny muted" style="display:block;font-weight:400">לחודש</small></div></div>`).join('')}
      <p class="small muted" style="margin-top:6px">רוצה רק לנסות?</p>`}
      <div class="card product" data-act="pick" data-id="${single.id}" role="button">
        <div class="count">1</div>
        <div class="grow"><h3>שיעור בודד</h3><p class="small muted">לכל שיעור במערכת</p></div>
        <div class="price">${single.price}₪</div></div>
      ${s ? '<button class="link small" data-act="sbManage">לניהול המנוי ‹</button>' : ''}
    </div>`;
  }

  // שלב: בחירת יום (רק במסלולים עם יום ריקוד לבחירה)
  function shSubDay({ id, mode }) {
    const p = plan(id);
    return `<div class="stack">
      <button class="link small" data-act="${mode === 'new' ? 'shop' : 'sbManage'}" style="align-self:flex-start">→ חזרה</button>
      <h1>באיזה יום תרקדי? 💃</h1>
      <p class="muted">${p.fixed.includes('flex') ? 'שיעור הגמישות כבר כלול (ראשון 19:00). עכשיו בוחרים את יום הריקוד הקבוע שלך.' : 'בוחרים יום אחד קבוע. המקום שלך יישמר בו בכל שבוע.'}</p>
      ${DANCE_DAYS.map(k => `<div class="card product" data-act="sbDay" data-id="${id}" data-day="${k}" data-mode="${mode}" role="button">
        <div class="count" style="font-size:15px;line-height:1.1">${dayNames[SLOTS[k].dow]}<br><small>${slotTime(k)}</small></div>
        <div class="grow"><h3>כל יום ${dayNames[SLOTS[k].dow]} ב-${slotTime(k)}</h3></div></div>`).join('')}
    </div>`;
  }

  // שלב: וידוא היום שנבחר, כדי שלא יהיו טעויות
  function shSubConfirmDay({ id, day, mode }) {
    const p = plan(id), d = dayNames[SLOTS[day].dow], other = DANCE_DAYS.find(k => k !== day);
    return `<div class="stack center">
      <div class="done-heart" style="font-size:44px;margin-top:10px">🗓️</div>
      <h1>רק לוודא 🤍</h1>
      <p>בחרת לרקוד <b>כל יום ${d} ב-${slotTime(day)}</b>.</p>
      <div class="card" style="text-align:right;margin:0">
        <p class="small">✓ המקום שלך יישמר אוטומטית בכל יום ${d} ב-${slotTime(day)}.</p>
        <p class="small muted" style="margin-top:6px">ביום ${dayNames[SLOTS[other].dow]} לא שמור לך מקום${mode === 'new' ? '. אפשר להגיע גם אליו עם שיעור נוסף.' : '.'}</p>
      </div>
      <button class="btn block rose" data-act="sbDayOk" data-id="${id}" data-day="${day}" data-mode="${mode}">כן, יום ${d} זה היום שלי</button>
      <button class="btn block ghost" data-act="sbPick" data-id="${id}" data-mode="${mode}">רוצה לבחור יום אחר</button>
    </div>`;
  }

  // שלב: סיכום ותשלום
  function shSubSummary({ id, day }) {
    const p = plan(id), slots = slotsOf(p, day), renew = addMonth(now());
    return `<div class="stack">
      <button class="link small" data-act="${p.choose ? 'sbPick' : 'shop'}" data-id="${id}" data-mode="new" style="align-self:flex-start">→ חזרה</button>
      <h1>${p.emoji} ${esc(p.name)}</h1>
      <div class="card" style="padding:4px 18px">
        ${slots.map(k => `<div class="list-row"><span class="grow">${SLOTS[k].label}</span><b>כל יום ${dayNames[SLOTS[k].dow]} ${slotTime(k)}</b></div>`).join('')}
        <div class="list-row"><span class="grow">חיוב חודשי</span><b class="price">${p.price}₪</b></div>
        <div class="list-row"><span class="grow">החיוב הבא</span><b>${fullDate(renew)}</b></div>
      </div>
      <div class="card terms" style="max-height:none"><h3>תנאי המנוי</h3><ul>${TERMS.map(t => `<li>${t}</li>`).join('')}</ul></div>
      <label class="check"><input type="checkbox" id="sb-ok"> <span>קראתי ואני מאשרת את תנאי המנוי, כולל חיוב חודשי אוטומטי של ${p.price}₪ עד שאבטל</span></label>
      <div class="note">🔒 התשלום מאובטח דרך תקבול. קבלה תישלח אלייך במייל בכל חודש.<br><b>תצוגה מקדימה:</b> לא מתבצע חיוב.</div>
      <button class="btn block rose" data-act="sbPay" data-id="${id}" data-day="${day || ''}">לתשלום ${p.price}₪ לחודש</button>
    </div>`;
  }

  function shSubWelcome() {
    const s = sub(), p = plan(s.plan);
    return `<div class="stack center">
      <div class="done-heart" style="font-size:54px;margin-top:10px">🤍</div>
      <h1>ברוכה הבאה למנוי!</h1>
      <p>${esc(p.name)} · ${p.price}₪ לחודש</p>
      <div class="card" style="text-align:right;margin:0">
        <h3>המקום שלך כבר שמור 🎉</h3>
        ${s.slots.map(k => `<p class="small" style="margin-top:6px">✓ כל יום ${dayNames[SLOTS[k].dow]} ${slotTime(k)} · ${SLOTS[k].label}</p>`).join('')}
        <p class="tiny muted" style="margin-top:8px">לא צריך להירשם כל פעם מחדש.</p>
      </div>
      <button class="btn block" data-act="sbClose">מעולה</button>
    </div>`;
  }

  /* ---------- ניהול המנוי (הלקוחה) ---------- */
  function shSubManage() {
    const s = sub(); if (!s) return shSubShop();
    const p = plan(s.plan), np = s.pending && plan(s.pending.plan);
    const up = S.classes.filter(c => c.start > now() && subBooking(c)).slice(0, 6);
    return `<div class="stack">
      <h1>${p.emoji} ${esc(p.name)}</h1>
      <div class="card" style="padding:4px 18px;margin:0">
        <div class="list-row"><span class="grow">חיוב חודשי</span><b>${p.price}₪</b></div>
        <div class="list-row"><span class="grow">${s.endsAt ? 'המנוי מסתיים' : 'החיוב הבא'}</span><b>${fullDate(s.endsAt || s.renewAt)}</b></div>
        ${s.slots.map(k => `<div class="list-row"><span class="grow">${SLOTS[k].label}</span><b>כל יום ${dayNames[SLOTS[k].dow]} ${slotTime(k)}</b></div>`).join('')}
      </div>
      ${np ? `<div class="note">מ-${fullDate(s.renewAt)} המנוי יעבור ל<b>${esc(np.name)}</b> (${np.price}₪). <button class="link small" data-act="sbUndoChange">ביטול השינוי</button></div>` : ''}
      ${s.endsAt ? `<div class="note warn">המנוי בוטל. הוא פעיל עד ${fullDate(s.endsAt)}, ולא יהיו חיובים נוספים. <button class="link small" data-act="sbUndoCancel">חזרה למנוי</button></div>` : ''}

      <h3>השיעורים הקרובים שלך</h3>
      <p class="tiny muted" style="margin-top:-6px">לא מגיעה? מבטלים כאן, כדי לפנות את המקום לאחרות. אין החזר על שיעור שלא מגיעים אליו.</p>
      <div class="card" style="padding:2px 14px;margin:0">${up.map(c => { const b = subBooking(c); return `<div class="list-row">
        <span class="grow"><b>${fmtDay(c.start)}</b><span class="tiny muted" style="display:block">${fmtTime(c.start)} · ${esc(c.title)}</span></span>
        ${b.status === 'booked' ? `<button class="btn sm ghost" data-act="sbSkip" data-id="${b.id}">לא אגיע</button>`
          : `<button class="btn sm soft" data-act="sbUnskip" data-id="${b.id}">בכל זאת אגיע</button>`}</div>`; }).join('') || '<p class="small muted" style="padding:10px 0">אין שיעורים קרובים</p>'}</div>

      ${!s.endsAt ? `${p.choose ? `<button class="btn block soft" data-act="sbPick" data-id="${p.id}" data-mode="changeDay">החלפת יום הריקוד</button>` : ''}
        <button class="btn block soft" data-act="sbChange">שינוי מסלול</button>
        <button class="btn block ghost" data-act="sbCancelAsk" style="color:var(--rose-deep)">ביטול המנוי</button>` : ''}
    </div>`;
  }

  function shSubChange() {
    const s = sub();
    return `<div class="stack">
      <button class="link small" data-act="sbManage" style="align-self:flex-start">→ חזרה</button>
      <h1>שינוי מסלול</h1>
      <p class="muted">השינוי ייכנס לתוקף ביום החידוש, <b>${fullDate(s.renewAt)}</b>. עד אז המנוי הנוכחי ממשיך כרגיל.</p>
      ${PLANS.filter(p => p.id !== s.plan).map(p => `<div class="card product" data-act="sbPick" data-id="${p.id}" data-mode="change" role="button">
        <div class="count" style="font-size:20px">${p.emoji}</div>
        <div class="grow"><h3>${esc(p.name)}</h3><p class="small muted">${esc(p.sub)}</p></div>
        <div class="price">${p.price}₪</div></div>`).join('')}
    </div>`;
  }

  function shSubConfirmChange({ id, day }) {
    const s = sub(), p = plan(id), cur = plan(s.plan);
    return `<div class="stack">
      <h1>לאשר את השינוי?</h1>
      <div class="card" style="padding:4px 18px;margin:0">
        <div class="list-row"><span class="grow">עד ${fullDate(s.renewAt)}</span><b>${esc(cur.name)} · ${cur.price}₪</b></div>
        <div class="list-row"><span class="grow">מ-${fullDate(s.renewAt)}</span><b>${esc(p.name)} · ${p.price}₪</b></div>
        ${slotsOf(p, day).map(k => `<div class="list-row"><span class="grow">${SLOTS[k].label}</span><b>כל יום ${dayNames[SLOTS[k].dow]} ${slotTime(k)}</b></div>`).join('')}
      </div>
      <p class="small muted">החיוב החודשי ישתנה ל-${p.price}₪ מיום החידוש, והמקום שלך יישמר אוטומטית בשיעורים החדשים.</p>
      <button class="btn block rose" data-act="sbChangeOk" data-id="${id}" data-day="${day || ''}">כן, לשנות מ-${fullDate(s.renewAt)}</button>
      <button class="btn block ghost" data-act="sbManage">לא, להשאיר כמו שזה</button>
    </div>`;
  }

  function shSubCancel() {
    const s = sub();
    return `<div class="stack">
      <h1>ביטול המנוי</h1>
      <div class="card" style="margin:0">
        <p class="small">✓ המנוי שלך ימשיך עד <b>${fullDate(s.renewAt)}</b>, והמקום שלך נשמר עד אז.</p>
        <p class="small" style="margin-top:6px">✓ לא יהיו חיובים נוספים.</p>
        <p class="small muted" style="margin-top:6px">על החודש ששולם אין החזר.</p>
      </div>
      <button class="btn block" data-act="sbCancelOk" style="background:var(--rose-deep)">כן, לבטל את המנוי</button>
      <button class="btn block ghost" data-act="sbManage">לא, אני נשארת 🤍</button>
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
  const allSubs = () => [...(sub() ? [{ ...sub(), name: (S.user?.name || 'נועה') + ' (את, בתצוגה)' }] : []), ...(S.demoSubs || [])];
  function adminSubsBlock() {
    const list = allSubs(), active = list.filter(s => !s.endsAt);
    const mrr = active.reduce((t, s) => t + plan(s.plan).price, 0);
    const week = Object.keys(SLOTS).map(k => {
      const c = S.classes.find(x => x.seriesId === k && x.start > now() && !x.cancelled);
      const n = list.filter(s => s.slots.includes(k)).length;
      return c ? `<div class="list-row"><span class="grow">${fmtDay(c.start)} ${slotTime(k)}<span class="tiny muted" style="display:block">${esc(SLOTS[k].title)}</span></span><b>${n}/${SLOTS[k].cap} מנויות</b></div>` : '';
    }).join('');
    return `<div class="section-title"><h2>מנויים</h2><a href="#" data-act="sbAdminList">לכל המנויות</a></div>
      <div class="stats">
        <div class="card center"><p class="muted small">מנויות פעילות</p><h2>${active.length}</h2></div>
        <div class="card center"><p class="muted small">הכנסה חודשית קבועה</p><h2>${mrr.toLocaleString('he-IL')}₪</h2></div>
      </div>
      <div class="card" style="padding:4px 18px">${week}</div>`;
  }
  const origAdmin = vAdmin;
  vAdmin = function () { const h = origAdmin(); const i = h.indexOf('<div class="section-title">'); return i < 0 ? h + adminSubsBlock() : h.slice(0, i) + adminSubsBlock() + h.slice(i); };
  const origClients = vClients;
  vClients = function () { const h = origClients(); const i = h.indexOf('<div class="section-title"><h2>כל הלקוחות'); const blk = adminSubsList(); return i < 0 ? h + blk : h.slice(0, i) + blk + h.slice(i); };

  function adminSubsList() {
    return `<div class="section-title"><h2>מנויות</h2></div>
      <div class="card" style="padding:4px 18px">${allSubs().map((s, i) => { const p = plan(s.plan), np = s.pending && plan(s.pending.plan); return `
        <button class="list-row plain" style="width:100%;text-align:right" data-act="sbAdminEdit" data-i="${i}">
          <span class="grow"><b>${esc(s.name)}</b><span class="tiny muted" style="display:block">${esc(p.name)} · ${s.slots.map(k => `${dayNames[SLOTS[k].dow]} ${slotTime(k)}`).join(', ')}</span>
            ${s.endsAt ? `<span class="tag warn" style="margin-top:4px">מסתיים ${fullDate(s.endsAt)}</span>` : np ? `<span class="tag" style="margin-top:4px">עוברת ל${esc(np.name)} ב-${fullDate(s.renewAt)}</span>` : `<span class="tiny muted">מתחדש ${fullDate(s.renewAt)}</span>`}</span>
          <b>${p.price}₪</b></button>`; }).join('')}</div>`;
  }
  function shSubAdminList() { return `<div class="stack"><h1>מנויות</h1>${adminSubsList()}</div>`; }
  function shSubAdminEdit({ i }) {
    const s = allSubs()[i], p = plan(s.plan);
    return `<div class="stack">
      <h1>${esc(s.name)}</h1>
      <div class="card" style="padding:4px 18px;margin:0">
        <div class="list-row"><span class="grow">מסלול</span><b>${esc(p.name)} · ${p.price}₪</b></div>
        ${s.slots.map(k => `<div class="list-row"><span class="grow">${SLOTS[k].label}</span><b>${dayNames[SLOTS[k].dow]} ${slotTime(k)}</b></div>`).join('')}
        <div class="list-row"><span class="grow">${s.endsAt ? 'מסתיים' : 'חידוש הבא'}</span><b>${fullDate(s.endsAt || s.renewAt)}</b></div>
        <div class="list-row"><span class="grow">התחילה</span><b>${fullDate(s.startAt)}</b></div>
      </div>
      <p class="small muted">הלקוחה יכולה לשנות יום ומסלול בעצמה באפליקציה. אם היא מבקשת ממך, אפשר לשנות גם מכאן:</p>
      ${p.choose ? DANCE_DAYS.filter(k => !s.slots.includes(k)).map(k => `<button class="btn block soft" data-act="sbAdminDay" data-i="${i}" data-day="${k}">להעביר ליום ${dayNames[SLOTS[k].dow]} ${slotTime(k)}</button>`).join('') : ''}
      <p class="tiny muted">בתצוגה המקדימה הכפתורים כאן רק מדגימים.</p>
    </div>`;
  }

  window.EXTRA_SHEETS = { ...(window.EXTRA_SHEETS || {}), shop: shSubShop, sbDay: shSubDay, sbConfirmDay: shSubConfirmDay, sbSummary: shSubSummary,
    sbWelcome: shSubWelcome, sbManage: shSubManage, sbChange: shSubChange, sbConfirmChange: shSubConfirmChange, sbCancel: shSubCancel,
    sbSkip: shSubSkip, sbAdminList: shSubAdminList, sbAdminEdit: shSubAdminEdit };

  /* ---------- פעולות ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act, id = el.dataset.id, ds = el.dataset;
    // ביטול הרשמה לשיעור שבמנוי = "לא אגיע השבוע"
    if (act === 'cancel') { const b = S.bookings.find(x => x.id === id); if (b?.subId) { e.stopImmediatePropagation(); return openSheet({ type: 'sbSkip', bookingId: b.id }); } return; }
    if (act === 'book') { const c = cls(id), b = c && subBooking(c); if (b) { e.stopImmediatePropagation(); b.status = 'booked'; save(); closeSheet(); render(); return toast('מעולה, את בפנים 🤍'); } return; }
    if (!act.startsWith('sb')) return;
    if (el.tagName === 'A') e.preventDefault();
    const stop = () => e.stopImmediatePropagation();
    stop();
    switch (act) {
      case 'sbPick': { const p = plan(id), mode = ds.mode || 'new';
        if (mode === 'new' && !p.choose) return openSheet({ type: 'sbSummary', id });
        if (mode === 'change' && !p.choose) return openSheet({ type: 'sbConfirmChange', id });
        return openSheet({ type: 'sbDay', id, mode }); }
      case 'sbDay': return openSheet({ type: 'sbConfirmDay', id, day: ds.day, mode: ds.mode });
      case 'sbDayOk': {
        if (ds.mode === 'new') return openSheet({ type: 'sbSummary', id, day: ds.day });
        if (ds.mode === 'change') return openSheet({ type: 'sbConfirmChange', id, day: ds.day });
        // החלפת יום במנוי הקיים: מהשבוע הבא
        const s = sub(); s.day = ds.day; s.slots = slotsOf(plan(s.plan), ds.day); resync();
        openSheet({ type: 'sbManage' }); render();
        return toast(`עודכן 🤍 מעכשיו המקום שלך שמור ביום ${dayNames[SLOTS[ds.day].dow]}`);
      }
      case 'sbPay': {
        if (!document.getElementById('sb-ok')?.checked) return toast('צריך לאשר את תנאי המנוי');
        const p = plan(id), day = ds.day || null;
        S.sub = { plan: id, day, slots: slotsOf(p, day), startAt: now(), renewAt: addMonth(now()), endsAt: null, pending: null };
        resync(); render();
        return openSheet({ type: 'sbWelcome' });
      }
      case 'sbManage': return openSheet({ type: 'sbManage' });
      case 'sbChange': return openSheet({ type: 'sbChange' });
      case 'sbChangeOk': { const s = sub(), p = plan(id); s.pending = { plan: id, day: ds.day || null, slots: slotsOf(p, ds.day || null) }; resync(); render(); openSheet({ type: 'sbManage' }); return toast(`מ-${fullDate(s.renewAt)} המנוי יעבור ל${p.name}`); }
      case 'sbUndoChange': sub().pending = null; resync(); render(); return openSheet({ type: 'sbManage' });
      case 'sbCancelAsk': return openSheet({ type: 'sbCancel' });
      case 'sbCancelOk': { const s = sub(); s.endsAt = s.renewAt; s.pending = null; resync(); render(); openSheet({ type: 'sbManage' }); return toast('המנוי בוטל. נתראה עד ' + fullDate(s.endsAt) + ' 🤍'); }
      case 'sbUndoCancel': sub().endsAt = null; resync(); render(); openSheet({ type: 'sbManage' }); return toast('איזה כיף שנשארת 🤍');
      case 'sbSkip': return openSheet({ type: 'sbSkip', bookingId: id });
      case 'sbSkipOk': { const b = S.bookings.find(x => x.id === id); b.status = 'cancelled'; save(); render(); openSheet({ type: 'sbManage' }); return toast('המקום התפנה. נתראה בשבוע הבא 🤍'); }
      case 'sbUnskip': { const b = S.bookings.find(x => x.id === id); if (spotsLeft(cls(b.classId)) <= 0) return toast('השיעור כבר מלא'); b.status = 'booked'; save(); render(); return openSheet({ type: 'sbManage' }); }
      case 'sbClose': closeSheet(); return render();
      case 'sbAdminList': return openSheet({ type: 'sbAdminList' });
      case 'sbAdminEdit': return openSheet({ type: 'sbAdminEdit', i: +ds.i });
      case 'sbAdminDay': return toast('בתצוגה המקדימה זה רק מדגים. בגרסה האמיתית היום יתעדכן והלקוחה תקבל הודעה');
      case 'sbRole': S.admin = !S.admin; save(); closeSheet(); return go({ screen: null, tab: S.admin ? 'admin' : 'home' });
      case 'sbReset': location.reload(); return;
    }
  }, true);

  /* ---------- פס "תצוגה מקדימה" ---------- */
  const bar = document.createElement('div');
  bar.id = 'sb-preview';
  bar.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 6px);left:50%;transform:translateX(-50%);z-index:60;background:#4A2E33;color:#fff;border-radius:999px;padding:6px 8px 6px 14px;font-size:13px;display:flex;gap:8px;align-items:center;box-shadow:0 6px 20px rgba(0,0,0,.18);white-space:nowrap';
  bar.innerHTML = '<span>👀 תצוגה מקדימה · מנויים</span><button data-act="sbRole" style="background:#fff;color:#4A2E33;border:0;border-radius:999px;padding:4px 10px;font-size:12px">לקוחה / ניהול</button><button data-act="sbReset" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5);border-radius:999px;padding:4px 10px;font-size:12px">מההתחלה</button>';
  document.body.appendChild(bar);
  document.getElementById('app').style.paddingTop = '44px';

  setup();
  save();
  go({ screen: null, tab: 'home' });
})();
