/* ============================================================
   חיבור לשרת (Supabase). נטען לפני app.js.
   מצב חי = יש config + ספריית supabase, ואין ?demo= בכתובת.
   ============================================================ */
const LIVE = !!(window.SUPA_CONFIG && window.supabase) && !new URLSearchParams(location.search).has('demo');
const sb = LIVE ? window.supabase.createClient(window.SUPA_CONFIG.url, window.SUPA_CONFIG.anonKey) : null;

// האם רצים בתוך אפליקציית Capacitor (אייפון) ולא בדפדפן
const IS_NATIVE = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
// nonce: לאפל שולחים את ה-SHA-256, ול-Supabase את המקור
async function nativeAppleSignIn() {
  const raw = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
  const { SignInWithApple } = window.Capacitor.Plugins;
  const res = await SignInWithApple.authorize({
    clientId: 'com.shachardance.app',
    redirectURI: window.SUPA_CONFIG.url + '/auth/v1/callback',
    scopes: 'email name',
    nonce: await sha256Hex(raw),
  });
  const r = res.response;
  const data = await call(sb.auth.signInWithIdToken({ provider: 'apple', token: r.identityToken, nonce: raw }));
  // אפל שולחת את השם רק בפעם הראשונה — שומרים אותו
  const name = [r.givenName, r.familyName].filter(Boolean).join(' ');
  if (name) {
    await sb.auth.updateUser({ data: { full_name: name } }).catch(() => {});
    // הפרופיל נוצר לפני שהשם הגיע — שומרים אותו גם שם, כדי לא לבקש אותו שוב
    if (data?.user?.id) await sb.from('profiles').update({ full_name: name }).eq('id', data.user.id).eq('full_name', '').then(() => {}, () => {});
  }
  return data;
}

// Google: התחברות native באייפון (Client ID של iOS ב-Google Cloud, פרויקט you-by-shahar)
const GOOGLE_IOS_CLIENT_ID = '959969996716-q2v8o0c1bshsj3gmbcpe8o7jsj2562j9.apps.googleusercontent.com';
let googleReady = null;
async function nativeGoogleSignIn() {
  const { SocialLogin } = window.Capacitor.Plugins;
  googleReady = googleReady || SocialLogin.initialize({ google: { iOSClientId: GOOGLE_IOS_CLIENT_ID, mode: 'online' } });
  await googleReady;
  const res = await SocialLogin.login({ provider: 'google', options: { scopes: ['email', 'profile'] } });
  const token = res?.result?.idToken;
  if (!token) throw new Error('google_no_token');
  const data = await call(sb.auth.signInWithIdToken({ provider: 'google', token }));
  const name = res.result.profile?.name;
  if (name) await sb.auth.updateUser({ data: { full_name: name } }).catch(() => {});
  return data;
}

const ERR_HE = {
  not_signed_in: 'צריך להתחבר קודם',
  terms_missing: 'צריך לאשר את התקנון',
  health_missing: 'צריך למלא הצהרת בריאות (ואם ענית "כן" — להעלות אישור רפואי)',
  class_unavailable: 'השיעור כבר לא זמין להרשמה',
  already_booked: 'כבר נרשמת לשיעור הזה',
  class_full: 'השיעור הזה כבר מלא',
  no_credits: 'אין לך שיעורים בכרטיסייה',
  booking_not_found: 'ההרשמה לא נמצאה',
  class_started: 'השיעור כבר התחיל',
  not_admin: 'רק שחר יכולה לעשות את זה',
  user_blocked: 'אי אפשר להירשם כרגע. כדאי לפנות לשחר',
  admin_cannot_delete: 'אי אפשר למחוק את החשבון של המנהלת',
  refund_failed: 'הזיכוי לא עבר בתקבול. אפשר לנסות שוב או לבדוק באתר של תקבול',
  bad_refund_amount: 'הסכום גדול ממה ששולם על הכרטיסייה',
  not_takbull_purchase: 'אפשר לזכות רק רכישה ששולמה באפליקציה',
  'Invalid login credentials': 'המייל או הסיסמה לא נכונים',
  payment_unavailable: 'התשלום לא זמין כרגע, נסי שוב בעוד רגע',
  no_product: 'המוצר הזה כבר לא זמין',
  test_payments_off: 'התשלום עוד לא מחובר',
  anonymous_provider_disabled: 'כניסת הבדיקה עוד לא הופעלה בשרת',
  'Anonymous sign-ins are disabled': 'כניסת הבדיקה עוד לא הופעלה בשרת',
  'provider is not enabled': 'ההתחברות הזו עוד לא מחוברת — בקרוב',
  'error 1001': 'ההתחברות בוטלה',
  'canceled': 'ההתחברות בוטלה',
  'cancelled': 'ההתחברות בוטלה',
};
function errHe(e) {
  const m = (e && (e.message || e.error_description || e.msg)) || String(e || '');
  for (const k in ERR_HE) if (m.includes(k)) return ERR_HE[k];
  console.warn('server error:', m);
  return 'משהו השתבש, נסי שוב';
}
async function call(promise) {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}

// סרטונים נשמרים כרגע רק במכשיר (IndexedDB); כאן רק "איזו הרשמה יש לה סרטון"
const VMETA_KEY = 'shachar-video-meta';
const videoMeta = () => { try { return JSON.parse(localStorage.getItem(VMETA_KEY)) || {}; } catch { return {}; } };
function setVideoMeta(bookingId, meta) {
  const m = videoMeta(); if (meta) m[bookingId] = meta; else delete m[bookingId];
  try { localStorage.setItem(VMETA_KEY, JSON.stringify(m)); } catch {}
}

let pushStarted = false, pushToken = null;
const API = {
  uid: null,
  provider: null,

  async session() {
    const { data } = await sb.auth.getSession();
    this.uid = data.session?.user?.id || null;
    this.provider = data.session?.user?.app_metadata?.provider || null;
    return data.session;
  },

  /** טוען הכול מהשרת וממיר לצורה שהאפליקציה מציגה (S) */
  async sync() {
    const uid = this.uid;
    if (!uid) return this.syncGuest();
    const D = 864e5, from = new Date(Date.now() - 150 * D).toISOString(), to = new Date(Date.now() + 61 * D).toISOString();
    let [prof, health, prods, purch, classes, avail, books, notes, series, settings] = await Promise.all([
      call(sb.from('profiles').select('*').eq('id', uid).maybeSingle()),
      call(sb.from('health_declarations').select('*').eq('user_id', uid).order('signed_at', { ascending: false }).limit(1).maybeSingle()),
      call(sb.from('products').select('*')),
      call(sb.from('purchases').select('*').eq('user_id', uid)),
      call(sb.from('classes').select('*').gte('starts_at', from).lte('starts_at', to).order('starts_at')),
      call(sb.from('class_availability').select('*')),
      call(sb.from('bookings').select('*').eq('user_id', uid)),
      call(sb.from('notices').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(20)),
      call(sb.from('class_series').select('*')),
      call(sb.rpc('client_settings')),   // לקוחה: וואטסאפ, טקסטים, ופרטי הגעה רק אם רשומה
    ]);
    // שחר רואה את כל ההגדרות (כולל הוצאות ותעריף סטודיו)
    if (prof?.is_admin) settings = await call(sb.from('app_settings').select('*').eq('id', 1).maybeSingle());
    const ts = x => x ? Date.parse(x) : null;
    const pname = id => prods.find(p => p.id === id)?.name || id;
    const vm = videoMeta();
    const myBooked = new Set(books.filter(b => b.status === 'booked' || b.status === 'attended').map(b => b.class_id));
    const taken = Object.fromEntries(avail.map(a => [a.id, a.taken]));

    S.isAdmin = !!prof?.is_admin;
    if (!S.isAdmin) S.admin = false;
    if (prof && prof.remind24 != null) S.prefs = { remind24: prof.remind24, remind2: prof.remind2, notify: !!prof.notify_studio };
    S.user = prof ? {
      id: prof.id, auth: this.provider, name: prof.full_name || '', age: prof.age, phone: prof.phone || '', email: prof.email || '',
      profile: { danced: prof.danced, wants: prof.wants || [], heard: prof.heard },
      health: health ? {
        id: health.id, answers: health.answers, dance: health.dance, signedAt: ts(health.signed_at), validUntil: ts(health.valid_until),
        needsCert: health.needs_cert, cert: health.cert_path ? { name: 'אישור רפואי', at: ts(health.cert_uploaded_at) } : null,
      } : null,
      termsAt: ts(prof.terms_accepted_at),
      photo: prof.photo_consent || null,
    } : null;
    S.purchases = purch.map(p => ({ id: p.id, productId: p.product_id, name: pname(p.product_id), credits: p.credits, remaining: p.remaining, price: p.price_ils, at: ts(p.purchased_at), expiresAt: ts(p.expires_at) }));
    S.classes = classes.map(c => ({
      id: c.id, seriesId: c.series_id, title: c.title, note: c.note || '', start: ts(c.starts_at), dur: c.duration_min, cap: c.capacity,
      cancelled: !!c.cancelled_at,
      songs: Array.isArray(c.songs) && c.songs.length ? c.songs
        : c.song_title ? [{ title: c.song_title, artist: c.song_artist || '', url: c.song_url || spotifySearch(c.song_title, c.song_artist || '') }] : [],
      others: Math.max(0, (taken[c.id] || 0) - (myBooked.has(c.id) ? 1 : 0)),
    }));
    // "attended" בשרת = "booked" באפליקציה (היא הייתה בשיעור)
    S.bookings = books.map(b => ({ id: b.id, classId: b.class_id, purchaseId: b.purchase_id, status: b.status === 'attended' ? 'booked' : b.status, at: ts(b.created_at), video: vm[b.id] || null }));
    S.notices = notes.map(n => ({ id: n.id, title: n.title, text: n.body, read: !!n.read_at }));
    if (settings?.directions) S.directions = settings.directions;
    if (settings?.studio_rate != null) S.studioRate = settings.studio_rate;
    if (Array.isArray(settings?.fixed_expenses)) S.fixedExpenses = settings.fixed_expenses;
    if (settings?.whatsapp) S.whatsapp = settings.whatsapp;
    if (settings?.texts) S.texts = settings.texts;
    if (settings?.admin_notify) S.adminNotify = settings.admin_notify;
    if (typeof applyProducts === 'function') applyProducts(prods.map(p => ({ id: p.id, price: p.price_ils, credits: p.credits, days: p.valid_days })));
    if (S.isAdmin) S.adminData = null;   // נטען מחדש במסך הניהול
    S.series = series.map(x => { const [h, m] = x.start_time.split(':').map(Number); return { id: x.id, dow: x.dow, h, m, title: x.title, dur: x.duration_min, cap: x.capacity, until: ts(x.active_until) }; });
  },

  /** בלי התחברות: מערכת שיעורים, מחירים ומקומות פנויים (מידע ציבורי בלבד) */
  async syncGuest() {
    const D = 864e5, to = new Date(Date.now() + 61 * D).toISOString();
    const [prods, classes, avail, settings] = await Promise.all([
      call(sb.from('products').select('*')),
      call(sb.from('classes').select('*').gte('starts_at', new Date(Date.now() - D).toISOString()).lte('starts_at', to).order('starts_at')),
      call(sb.from('class_availability').select('*')),
      call(sb.rpc('client_settings')),
    ]);
    const ts = x => x ? Date.parse(x) : null;
    const taken = Object.fromEntries(avail.map(a => [a.id, a.taken]));
    S.isAdmin = false; S.admin = false; S.user = null;
    S.purchases = []; S.bookings = []; S.notices = [];
    S.classes = classes.map(c => ({ id: c.id, seriesId: c.series_id, title: c.title, note: c.note || '', start: ts(c.starts_at), dur: c.duration_min, cap: c.capacity, cancelled: !!c.cancelled_at, songs: [], others: taken[c.id] || 0 }));
    if (settings?.whatsapp) S.whatsapp = settings.whatsapp;
    if (settings?.texts) S.texts = settings.texts;
    if (typeof applyProducts === 'function') applyProducts(prods.map(p => ({ id: p.id, price: p.price_ils, credits: p.credits, days: p.valid_days })));
  },

  /* ---- התחברות ---- */
  // כניסה עם מייל וסיסמה (חשבון הבדיקה של אפל)
  signInPassword(email, password) { return call(sb.auth.signInWithPassword({ email, password })); },
  async signIn(provider) {
    if (provider === 'test') return call(sb.auth.signInAnonymously());
    // באפליקציית האייפון: התחברות native של אפל (חלון של המערכת), ואז מעבירים את הטוקן ל-Supabase
    if (provider === 'apple' && IS_NATIVE) return nativeAppleSignIn();
    if (provider === 'google' && IS_NATIVE) return nativeGoogleSignIn();
    return call(sb.auth.signInWithOAuth({ provider, options: { redirectTo: (location.origin + location.pathname).replace(/\/(index\.html)?$/, '') } }));
  },
  async signOut() {
    if (pushToken) await sb.from('push_tokens').delete().eq('token', pushToken).then(() => {}, () => {});
    return sb.auth.signOut();
  },

  /** התראות לטלפון — רק אחרי שהלקוחה הדליקה מתג בפרופיל (דרישה של אפל). מחזיר true אם אישרה */
  async enablePush(ask = true) {
    const PN = IS_NATIVE && window.Capacitor.Plugins.PushNotifications;
    if (!PN || !this.uid) return false;
    try {
      if (!pushStarted) {
        pushStarted = true;
        PN.addListener('registration', async t => {
          pushToken = t.value;
          await sb.from('push_tokens').upsert({ token: t.value, user_id: this.uid, platform: 'ios', updated_at: new Date().toISOString() });
        });
        PN.addListener('registrationError', e => console.warn('push', e));
      }
      let perm = await PN.checkPermissions();
      if (ask && (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale')) perm = await PN.requestPermissions();
      if (perm.receive !== 'granted') return false;
      await PN.register();
      return true;
    } catch (e) { console.warn('push', e); return false; }
  },
  /** כשכל המתגים כבויים — מוחקים את הטלפון מרשימת ההתראות */
  async disablePush() {
    await sb.from('push_tokens').delete().eq('user_id', this.uid).then(() => {}, () => {});
  },
  savePrefs(prefs) { return call(sb.from('profiles').update({ remind24: !!prefs.remind24, remind2: !!prefs.remind2, notify_studio: !!prefs.notify }).eq('id', this.uid)); },
  classMessage(classId, title, body) { return call(sb.rpc('admin_class_message', { p_class: classId, p_title: title, p_body: body })); },
  // מחיקת חשבון: קודם האישורים הרפואיים (קבצים), אחר כך כל השאר בשרת
  async deleteAccount() {
    const { data: files } = await sb.storage.from('certs').list(this.uid);
    if (files?.length) await sb.storage.from('certs').remove(files.map(f => `${this.uid}/${f.name}`));
    await call(sb.rpc('delete_my_account'));
    await sb.auth.signOut().catch(() => {});
  },

  /* ---- הרשמה ראשונית ---- */
  saveProfile(fields) { return call(sb.from('profiles').update(fields).eq('id', this.uid)); },
  async signHealth({ answers, dance, details, signature, parentName }, certFile) {
    const row = await call(sb.from('health_declarations').insert({ user_id: this.uid, answers, dance, details, signature }).select().single());
    if (parentName) await this.saveProfile({ parent_name: parentName });
    if (certFile && row.needs_cert) await this.uploadCert(row.id, certFile);
    return row;
  },
  async uploadCert(healthId, file) {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
    const path = `${this.uid}/cert-${Date.now()}.${ext}`;
    await call(sb.storage.from('certs').upload(path, file, { contentType: file.type || undefined }));
    await call(sb.from('health_declarations').update({ cert_path: path, cert_uploaded_at: new Date().toISOString() }).eq('id', healthId));
  },
  acceptTerms(photo) { return this.saveProfile({ terms_accepted_at: new Date().toISOString(), ...(photo ? { photo_consent: photo, photo_consent_at: new Date().toISOString() } : {}) }); },
  savePhoto(photo) { return this.saveProfile({ photo_consent: photo, photo_consent_at: new Date().toISOString() }); },

  /* ---- פעולות לקוחה ---- */
  book(classId) { return call(sb.rpc('book_class', { p_class: classId })); },
  cancel(bookingId) { return call(sb.rpc('cancel_booking', { p_booking: bookingId })); },
  testPurchase(productId) { return call(sb.rpc('test_purchase', { p_product: productId })); },
  // תקבול: יוצרים הזמנה בשרת ומקבלים קישור לטופס האשראי (נפתח בתוך האפליקציה)
  async payCreate(productId) {
    const { data: r, error } = await sb.functions.invoke('takbull', { body: { action: 'create', productId } });
    if (error) {
      const b = await error.context?.json?.().catch(() => null);
      throw new Error(b?.error || 'payment_unavailable');
    }
    if (!r?.url) throw new Error(r?.error || 'payment_unavailable');
    return r;
  },
  async payCheck(uniqId) {
    const r = await call(sb.functions.invoke('takbull', { body: { action: 'check', uniqId } }));
    return r?.status;
  },
  readNotice(id) { return call(sb.from('notices').update({ read_at: new Date().toISOString() }).eq('id', id)); },

  /* ---- פעולות של שחר ---- */
  adminCancelClass(classId, message) { return call(sb.rpc('admin_cancel_class', { p_class: classId, p_message: message || null })); },
  adminStopSeries(seriesId) { return call(sb.rpc('admin_stop_series', { p_series: seriesId, p_message: null })); },
  addSeries({ title, dow, h, m, dur, cap }) {
    return call(sb.from('class_series').insert({ title, dow, start_time: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, duration_min: dur, capacity: cap }));
  },
  addClass({ title, start, dur, cap }) { return call(sb.from('classes').insert({ title, starts_at: new Date(start).toISOString(), duration_min: dur, capacity: cap })); },
  /* ---- רשימת משימות (רק שחר) ---- */
  async tasksLoad() {
    const rows = await call(sb.from('admin_tasks').select('*').order('created_at', { ascending: true }));
    return rows.map(t => ({ id: t.id, title: t.title, done: t.done }));
  },
  taskAdd(title) { return call(sb.from('admin_tasks').insert({ title })); },
  taskToggle(id, done) { return call(sb.from('admin_tasks').update({ done, done_at: done ? new Date().toISOString() : null }).eq('id', id)); },
  taskDel(id) { return call(sb.from('admin_tasks').delete().eq('id', id)); },

  saveSongs(classId, songs) {
    const first = songs[0];
    return call(sb.from('classes').update({ songs, song_title: first?.title || null, song_artist: first?.artist || null, song_url: first?.url || null }).eq('id', classId));
  },
  async classRoster(classId) {
    const rows = await call(sb.from('bookings').select('id,status,user_id').eq('class_id', classId).in('status', ['booked', 'attended', 'no_show']));
    if (!rows.length) return [];
    const ids = rows.map(r => r.user_id);
    const [profs, hs, cl, prev] = await Promise.all([
      call(sb.from('profiles').select('id,full_name,phone,photo_consent').in('id', ids)),
      call(sb.from('health_declarations').select('user_id,dance,needs_cert,cert_path,valid_until,signed_at').in('user_id', ids).order('signed_at', { ascending: false })),
      call(sb.from('classes').select('starts_at').eq('id', classId).single()),
      call(sb.from('bookings').select('user_id,classes(starts_at)').in('user_id', ids).in('status', ['booked', 'attended', 'no_show', 'late_cancel'])),
    ]);
    // פעם ראשונה = אין לה אף שיעור קודם לשיעור הזה
    const t0 = Date.parse(cl.starts_at);
    const hadBefore = new Set(prev.filter(b => b.classes && Date.parse(b.classes.starts_at) < t0).map(b => b.user_id));
    return rows.map(r => {
      const p = profs.find(x => x.id === r.user_id), h = hs.find(x => x.user_id === r.user_id);
      return { ...r, first: !hadBefore.has(r.user_id), name: p?.full_name || '—', phone: p?.phone, photo: p?.photo_consent || null, health: h ? { dance: h.dance, needsCert: h.needs_cert, cert: h.cert_path ? {} : null, validUntil: Date.parse(h.valid_until) } : null };
    });
  },

  /* ---- כלי ניהול ---- */
  async adminLoad() {
    const yearAgo = new Date(Date.now() - 400 * 864e5).toISOString();
    const [profs, purch, hs, books, prods, cls] = await Promise.all([
      call(sb.from('profiles').select('*').eq('is_admin', false)),
      call(sb.from('purchases').select('*')),
      call(sb.from('health_declarations').select('user_id,dance,needs_cert,cert_path,valid_until,signed_at').order('signed_at', { ascending: false })),
      call(sb.from('bookings').select('user_id,status,created_at,classes(starts_at)').in('status', ['attended', 'booked'])),
      call(sb.from('products').select('id,name')),
      call(sb.from('classes').select('starts_at,duration_min,cancelled_at').gte('starts_at', yearAgo)),
    ]);
    const ts = x => x ? Date.parse(x) : null;
    const pname = id => id === 'manual' ? 'הוספה ידנית' : prods.find(p => p.id === id)?.name || id;
    const purchases = purch.map(p => ({ id: p.id, userId: p.user_id, name: pname(p.product_id), credits: p.credits, remaining: p.remaining, price: p.price_ils, at: ts(p.purchased_at), expiresAt: ts(p.expires_at), note: p.note,
      refunded: +p.refunded_ils || 0, refundedAt: ts(p.refunded_at), takbull: !!p.takbull_ref && !/^(MANUAL|TEST)-/.test(p.takbull_ref) }));
    const students = profs.map(p => {
      const h = hs.find(x => x.user_id === p.id);
      const mine = books.filter(b => b.user_id === p.id && b.classes && ts(b.classes.starts_at) < Date.now());
      return {
        id: p.id, name: p.full_name || '—', phone: p.phone || '', photo: p.photo_consent || null, termsAt: p.terms_accepted_at ? Date.parse(p.terms_accepted_at) : null, age: p.age, heard: p.heard, joinedAt: ts(p.created_at), blocked: !!p.blocked,
        attended: mine.filter(b => b.status === 'attended').length || mine.length,
        lastAt: Math.max(0, ...mine.map(b => ts(b.classes.starts_at))) || null,
        health: h ? { dance: h.dance, needsCert: h.needs_cert, cert: h.cert_path ? {} : null, validUntil: ts(h.valid_until) } : null,
        purchases: purchases.filter(x => x.userId === p.id),
      };
    });
    const classes = cls.map(c => ({ start: ts(c.starts_at), dur: c.duration_min, cancelled: !!c.cancelled_at }));
    return { students, purchases, classes };
  },
  markAttendance(bookingId, attended) { return call(sb.rpc('admin_mark_attendance', { p_booking: bookingId, p_attended: attended })); },
  updateClass(classId, { title, note, start, cap, all }) {
    return call(sb.rpc('admin_edit_class', { p_class: classId, p_title: title, p_note: note || '', p_starts_at: new Date(start).toISOString(), p_capacity: cap, p_all: !!all }));
  },
  broadcast(title, body) { return call(sb.rpc('admin_broadcast', { p_title: title, p_body: body })); },
  grantCredits(userId, credits, days, note) { return call(sb.rpc('admin_grant_credits', { p_user: userId, p_credits: credits, p_days: days, p_note: note || null })); },
  // זיכוי דרך תקבול (השרת בודק שזו שחר, מבצע בתקבול ורק אז רושם)
  async refund(purchaseId, amount) {
    const { data, error } = await sb.functions.invoke('takbull', { body: { action: 'refund', purchaseId, amount } });
    if (error) {
      const b = await error.context?.json?.().catch(() => null);
      throw new Error(b?.error || 'refund_failed');
    }
    return data;
  },
  markRefunded(purchaseId, amount) { return call(sb.rpc('admin_mark_refunded', { p_purchase: purchaseId, p_amount: amount })); },
  extendPurchase(purchaseId, days) { return call(sb.rpc('admin_extend_purchase', { p_purchase: purchaseId, p_days: days })); },
  setBlocked(userId, blocked) { return call(sb.rpc('admin_set_blocked', { p_user: userId, p_blocked: blocked })); },
  async saveProducts(list) {
    for (const p of list) await call(sb.from('products').update({ price_ils: p.price, credits: p.credits, valid_days: p.days }).eq('id', p.id));
  },
  saveSettings(patch) { return call(sb.from('app_settings').update(patch).eq('id', 1)); },
  saveExpenses(list) { return call(sb.from('app_settings').update({ fixed_expenses: list }).eq('id', 1)); },
  saveStudioRate(r) { return call(sb.from('app_settings').update({ studio_rate: r }).eq('id', 1)); },
  saveDirections(d) { return call(sb.from('app_settings').update({ directions: d }).eq('id', 1)); },
};
