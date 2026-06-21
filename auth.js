
/* ═══════════════════════════════════════════════════════════════
   SEMS · Auth Module v1.0
   Login, Session, Account Panel, Settings
   ═══════════════════════════════════════════════════════════════ */
'use strict';

/* ── DIREKTORI AKUN DEMO ──────────────────────────────────────
   Di produksi, validasi dilakukan di backend.
   Format email wajib: *@astra-honda.com
   ─────────────────────────────────────────────────────────── */
const DEMO_ACCOUNTS = [
  {
    email:    'budi.santoso@astra-honda.com',
    password: 'Sems2026!',
    name:     'Budi Santoso',
    role:     'Energy Manager',
    plant:    'Cikarang',
    dept:     'Manufacturing Engineering',
    empId:    'AHM-KRW-4821',
    joined:   '12 Mar 2019',
    access:   ['overview','machines','alarms','trend','eir','roi','vampire'],
  },
  {
    email:    'siti.rahayu@astra-honda.com',
    password: 'Sems2026!',
    name:     'Siti Rahayu',
    role:     'Plant Supervisor',
    plant:    'Cikarang',
    dept:     'Production',
    empId:    'AHM-CKR-2204',
    joined:   '05 Jul 2021',
    access:   ['overview','machines','alarms'],
  },
  {
    email:    'ahmad.fauzi@astra-honda.com',
    password: 'Sems2026!',
    name:     'Ahmad Fauzi',
    role:     'IIoT Engineer',
    plant:    'All Plants',
    dept:     'Digital & IT',
    empId:    'AHM-IT-0091',
    joined:   '20 Jan 2023',
    access:   ['overview','machines','alarms','trend','eir','roi','vampire'],
  },
];

/* ── DOMAIN YANG DIIZINKAN ───────────────────────────────── */
const ALLOWED_DOMAINS = ['astra-honda.com'];

/* ── ACTIVITY LOG ──────────────────────────────────────────── */
const ACTIVITY_LOG = [
  { icon:'🔍', text:'Melihat laporan EIR Cikarang', time:'2 mnt lalu' },
  { icon:'🚨', text:'Menutup alarm Vampire Power M-03', time:'18 mnt lalu' },
  { icon:'⚙',  text:'Mengubah interval alarm ke 4 dtk', time:'1 jam lalu' },
  { icon:'📊', text:'Mengunduh tren 7 hari (PDF)', time:'3 jam lalu' },
  { icon:'🔑', text:'Login dari Jakarta · Chrome 124', time:'Kemarin 08:12' },
];

/* ════════════════════════════════════════════════════════════
   AUTH OBJECT
   ════════════════════════════════════════════════════════════ */
const AUTH = {
  _session:       null,
  _settings:      {},
  _accountOpen:   false,
  _activeTab:     'info',
  _inactiveTimer: null,

  /* ── INIT ──────────────────────────────────────────────── */
  init() {
    this._loadSettings();
    this._spawnLoginParticles();

    /* Cek session tersimpan (remember me) */
    const saved = this._loadSession();
    if (saved) {
      this._session = saved;
      this._enterDashboard(false);
    } else {
      this._showLogin();
    }

    /* Keyboard: Escape menutup account panel */
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && this._accountOpen) this.toggleAccountPanel();
    });
  },

  /* ── VALIDASI EMAIL REAL-TIME ──────────────────────────── */
  validateEmail(val) {
    const msg  = document.getElementById('email-msg');
    const wrap = document.getElementById('lf-email');
    if (!val) {
      msg.textContent = ''; wrap.classList.remove('valid','error');
      return false;
    }
    const parts  = val.split('@');
    const domain = parts[1] || '';
    const ok     = ALLOWED_DOMAINS.includes(domain) && parts[0].length >= 2;

    if (!ok && val.includes('@')) {
      msg.textContent = domain
        ? `Domain @${domain} tidak terdaftar. Gunakan email @astra-honda.com`
        : 'Format email tidak valid.';
      wrap.classList.add('error'); wrap.classList.remove('valid');
    } else if (ok) {
      msg.textContent = '✓ Domain terverifikasi';
      msg.style.color = '#00FFD4';
      wrap.classList.add('valid'); wrap.classList.remove('error');
    } else {
      msg.textContent = ''; wrap.classList.remove('valid','error');
    }
    return ok;
  },

  /* ── SUBMIT LOGIN ──────────────────────────────────────── */
  submitLogin() {
    const emailEl  = document.getElementById('login-email');
    const passEl   = document.getElementById('login-pass');
    const errEl    = document.getElementById('login-error');
    const btnText  = document.getElementById('login-btn-text');
    const btn      = document.getElementById('login-btn');
    const remember = document.getElementById('login-remember')?.checked;

    const email = emailEl.value.trim().toLowerCase();
    const pass  = passEl.value;

    /* Validasi domain */
    if (!this.validateEmail(email)) {
      this._shakeField('lf-email');
      errEl.textContent = 'Gunakan email korporat @astra-honda.com';
      errEl.classList.add('visible');
      return;
    }

    if (!pass) {
      this._shakeField('lf-pass');
      return;
    }

    /* Loading state */
    btn.disabled = true;
    btnText.textContent = 'MEMVERIFIKASI...';
    btn.classList.add('loading');
    errEl.classList.remove('visible');

    /* Simulasi network delay */
    setTimeout(() => {
      const account = DEMO_ACCOUNTS.find(
        a => a.email === email && a.password === pass
      );

      if (!account) {
        /* Gagal */
        btn.disabled = false;
        btnText.textContent = 'MASUK KE SISTEM';
        btn.classList.remove('loading');
        errEl.textContent = 'Email atau password tidak sesuai. Coba lagi.';
        errEl.classList.add('visible');
        passEl.value = '';
        this._shakeField('lf-pass');
        this._shakeField('lf-email');
        return;
      }

      /* Berhasil — buat session */
      const session = {
        ...account,
        loginAt:   new Date().toISOString(),
        loginIp:   '10.10.42.' + Math.floor(Math.random()*200 + 10),
        loginBrowser: this._detectBrowser(),
        remember,
      };

      this._session = session;
      if (remember) this._saveSession(session);

      this._enterDashboard(true);
    }, 900 + Math.random() * 400);
  },

  /* ── MASUK KE DASHBOARD ────────────────────────────────── */
  _enterDashboard(animated) {
    const ls  = document.getElementById('login-screen');
    const app = document.getElementById('app');

    /* Update avatar di topbar */
    this._updateAvatar();

    if (animated) {
      /* ── TAHAP 1 (0ms): Login card glitch-dissolve keluar ───── */
      ls.classList.add('ls-exit');

      /* ── TAHAP 2 (220ms): Glitch flash + scanline wipe masuk ── */
      setTimeout(() => {
        const flash   = document.getElementById('glitch-flash');
        const overlay = document.getElementById('transition-overlay');
        if (flash)   { flash.classList.remove('active');   void flash.offsetWidth;   flash.classList.add('active'); }
        if (overlay) { overlay.classList.remove('wipe-in','wipe-out'); void overlay.offsetWidth; overlay.classList.add('wipe-in'); }
      }, 220);

      /* ── TAHAP 3 (480ms): Sembunyikan login, tampilkan boot text */
      setTimeout(() => {
        ls.style.display = 'none';

        const bootEl = document.getElementById('boot-text');
        if (bootEl) {
          bootEl.classList.remove('active');
          void bootEl.offsetWidth;
          bootEl.classList.add('active');
        }
      }, 480);

      /* ── TAHAP 4 (700ms): Scanline wipe keluar, app masuk ───── */
      setTimeout(() => {
        const overlay = document.getElementById('transition-overlay');
        if (overlay) { overlay.classList.remove('wipe-in'); void overlay.offsetWidth; overlay.classList.add('wipe-out'); }

        app.style.display = 'grid';

        /* Init dashboard — SEMS_INIT akan trigger dash-enter setelah render */
        if (window.SEMS_INIT) window.SEMS_INIT();
      }, 700);

      /* ── TAHAP 5 (1400ms): Bersihkan overlay transisi login ──── */
      setTimeout(() => {
        const overlay = document.getElementById('transition-overlay');
        const flash   = document.getElementById('glitch-flash');
        const bootEl  = document.getElementById('boot-text');
        if (overlay) overlay.classList.remove('wipe-in','wipe-out');
        if (flash)   flash.classList.remove('active');
        if (bootEl)  bootEl.classList.remove('active');
      }, 1400);

    } else {
      ls.style.display = 'none';
      app.style.display = 'grid';
      /* Init dashboard langsung (session restore) */
      if (window.SEMS_INIT) window.SEMS_INIT();
    }

    /* Mulai inactivity timer jika setting aktif */
    this._startInactivityTimer();
    this._logActivity('🔑', 'Login dari ' + (this._session.loginBrowser || 'Browser'));
  },

  /* ── SHOW LOGIN ────────────────────────────────────────── */
  _showLogin() {
    const ls  = document.getElementById('login-screen');
    const app = document.getElementById('app');
    ls.style.display  = '';
    app.style.display = 'none';
    ls.classList.remove('ls-exit');
    setTimeout(() => document.getElementById('login-email')?.focus(), 300);
  },

  /* ── LOGOUT ────────────────────────────────────────────── */
  logout() {
    if (!confirm('Yakin ingin logout dari SEMS?')) return;
    this._clearSession();
    this._session = null;
    this._accountOpen = false;

    const panel = document.getElementById('account-panel');
    panel.classList.remove('open');

    /* Reset form */
    const emailEl = document.getElementById('login-email');
    const passEl  = document.getElementById('login-pass');
    const errEl   = document.getElementById('login-error');
    if (emailEl) emailEl.value = '';
    if (passEl)  passEl.value  = '';
    if (errEl)   errEl.classList.remove('visible');

    const btn = document.getElementById('login-btn');
    const txt = document.getElementById('login-btn-text');
    if (btn) btn.disabled = false;
    if (txt) txt.textContent = 'MASUK KE SISTEM';

    this._showLogin();
    if (this._inactiveTimer) clearTimeout(this._inactiveTimer);
  },

  /* ── GANTI AKUN (logout tanpa konfirmasi → tampil login) ── */
  switchAccount() {
    this._clearSession();
    this._session = null;
    this._accountOpen = false;
    document.getElementById('account-panel').classList.remove('open');
    const emailEl = document.getElementById('login-email');
    const passEl  = document.getElementById('login-pass');
    if (emailEl) { emailEl.value = ''; }
    if (passEl)  { passEl.value  = ''; }
    document.getElementById('login-error')?.classList.remove('visible');
    this._showLogin();
    setTimeout(() => emailEl?.focus(), 400);
  },

  /* ── TOGGLE ACCOUNT PANEL ──────────────────────────────── */
  toggleAccountPanel() {
    if (!this._session) return;
    this._accountOpen = !this._accountOpen;
    const panel = document.getElementById('account-panel');
    panel.classList.toggle('open', this._accountOpen);
    if (this._accountOpen) this._populatePanel();
  },

  /* ── POPULATE PANEL ────────────────────────────────────── */
  _populatePanel() {
    const s = this._session;
    if (!s) return;

    /* Header */
    const initials = this._getInitials(s.name);
    document.getElementById('acct-avatar-lg').textContent  = initials;
    document.getElementById('acct-name').textContent       = s.name;
    document.getElementById('acct-email').textContent      = s.email;
    document.getElementById('acct-role').textContent       = s.role;
    document.getElementById('acct-plant').textContent      = '🏭 ' + s.plant;

    /* Detail KV */
    const kvEl = document.getElementById('acct-details');
    kvEl.innerHTML = [
      ['ID Karyawan',    s.empId],
      ['Departemen',     s.dept],
      ['Pabrik',         s.plant],
      ['Bergabung',      s.joined],
      ['Akses Modul',    s.access.length + ' modul aktif'],
    ].map(([k,v]) => `
      <div class="acct-kv-row">
        <span class="acct-kv-key">${k}</span>
        <span class="acct-kv-val">${v}</span>
      </div>`).join('');

    /* Sesi aktif */
    const loginDate = new Date(s.loginAt);
    document.getElementById('acct-session-info').textContent =
      `Login ${loginDate.toLocaleString('id-ID')} · ${s.loginIp} · ${s.loginBrowser}`;

    /* Aktivitas */
    const actEl = document.getElementById('acct-activity');
    actEl.innerHTML = ACTIVITY_LOG.map(a => `
      <div class="acct-activity-row">
        <span class="acct-act-icon">${a.icon}</span>
        <div class="acct-act-body">
          <div class="acct-act-text">${a.text}</div>
          <div class="acct-act-time">${a.time}</div>
        </div>
      </div>`).join('');

    /* Settings values */
    this._loadSettingsUI();
  },

  /* ── SWITCH TAB ────────────────────────────────────────── */
  switchTab(tab) {
    this._activeTab = tab;
    ['info','settings'].forEach(t => {
      document.getElementById('tab-' + t)?.classList.toggle('active', t === tab);
      const p = document.getElementById('panel-' + t);
      if (p) p.style.display = t === tab ? 'block' : 'none';
    });
  },

  /* ── TOGGLE PASSWORD VISIBILITY ────────────────────────── */
  togglePass() {
    const inp = document.getElementById('login-pass');
    const btn = document.getElementById('ls-eye');
    if (!inp) return;
    inp.type = inp.type === 'password' ? 'text' : 'password';
    btn.textContent = inp.type === 'password' ? '👁' : '🙈';
  },

  /* ── FORGOT PASSWORD ───────────────────────────────────── */
  forgotPassword() {
    const email = document.getElementById('login-email')?.value;
    const msg   = email && email.includes('@astra-honda.com')
      ? `Link reset password akan dikirim ke:\n${email}`
      : 'Masukkan email @astra-honda.com terlebih dahulu.';
    alert(msg);
  },

  /* ── SETTINGS ──────────────────────────────────────────── */
  saveSetting(key, value) {
    this._settings[key] = value;
    localStorage.setItem('sems_settings', JSON.stringify(this._settings));
  },

  applySettings() {
    const interval = document.getElementById('set-alarm-interval')?.value;
    if (interval && window.ALARM_ENGINE) {
      ALARM_ENGINE.stop();
      ALARM_ENGINE.start(parseInt(interval));
    }
    const sound = document.getElementById('set-sound')?.checked;
    if (sound !== undefined) window._SEMS_SOUND_ENABLED = sound;

    const particles = document.getElementById('set-particles')?.checked;
    const bg = document.getElementById('canvas-bg');
    if (bg) bg.style.display = particles ? '' : 'none';

    this._showSettingsSaved();
  },

  _showSettingsSaved() {
    const btn = document.querySelector('.acct-save-btn');
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = '✓ Tersimpan';
    btn.style.color = '#00FFD4';
    setTimeout(() => {
      btn.textContent = orig;
      btn.style.color = '';
    }, 1800);
  },

  _loadSettings() {
    try {
      const s = localStorage.getItem('sems_settings');
      this._settings = s ? JSON.parse(s) : {};
    } catch(_) { this._settings = {}; }
  },

  _loadSettingsUI() {
    const s = this._settings;
    const ai = document.getElementById('set-alarm-interval');
    if (ai && s.alarmInterval) ai.value = s.alarmInterval;
    const snd = document.getElementById('set-sound');
    if (snd && s.sound !== undefined) snd.checked = s.sound;
    const part = document.getElementById('set-particles');
    if (part && s.particles !== undefined) part.checked = s.particles;
    const al = document.getElementById('set-auto-logout');
    if (al && s.autoLogout !== undefined) al.value = s.autoLogout;
  },

  /* ── SESSION STORAGE ───────────────────────────────────── */
  _saveSession(session) {
    try { localStorage.setItem('sems_session', JSON.stringify(session)); } catch(_) {}
  },
  _loadSession() {
    try {
      const s = localStorage.getItem('sems_session');
      return s ? JSON.parse(s) : null;
    } catch(_) { return null; }
  },
  _clearSession() {
    try { localStorage.removeItem('sems_session'); } catch(_) {}
  },

  /* ── INACTIVITY AUTO LOGOUT ────────────────────────────── */
  _startInactivityTimer() {
    const minutes = parseInt(this._settings.autoLogout || 30);
    if (!minutes) return;
    if (this._inactiveTimer) clearTimeout(this._inactiveTimer);
    const reset = () => {
      clearTimeout(this._inactiveTimer);
      this._inactiveTimer = setTimeout(() => {
        alert('Sesi Anda telah berakhir karena tidak aktif selama ' + minutes + ' menit.');
        this.logout();
      }, minutes * 60 * 1000);
    };
    ['mousemove','keydown','click','scroll'].forEach(e => document.addEventListener(e, reset, { passive: true }));
    reset();
  },

  /* ── UPDATE AVATAR DI TOPBAR ───────────────────────────── */
  _updateAvatar() {
    if (!this._session) return;
    const initials = this._getInitials(this._session.name);
    const el = document.getElementById('avatar-initials');
    if (el) el.textContent = initials;
  },

  /* ── HELPER: INITIALS ──────────────────────────────────── */
  _getInitials(name) {
    if (!name) return '?';
    return name.split(' ').slice(0,2).map(n => n[0]).join('').toUpperCase();
  },

  /* ── HELPER: BROWSER DETECT ────────────────────────────── */
  _detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome'))  return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari'))  return 'Safari';
    if (ua.includes('Edge'))    return 'Edge';
    return 'Browser';
  },

  /* ── HELPER: SHAKE ANIMATION ───────────────────────────── */
  _shakeField(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 500);
  },

  /* ── ACTIVITY LOGGER ───────────────────────────────────── */
  _logActivity(icon, text) {
    ACTIVITY_LOG.unshift({ icon, text, time: 'baru saja' });
    if (ACTIVITY_LOG.length > 20) ACTIVITY_LOG.pop();
  },

  /* ── LOGIN PAGE PARTICLES ──────────────────────────────── */
  _spawnLoginParticles() {
    const container = document.getElementById('ls-particles');
    if (!container) return;
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'ls-particle';
      p.style.cssText = `
        left:${Math.random()*100}%;
        top:${Math.random()*100}%;
        animation-delay:${Math.random()*6}s;
        animation-duration:${6 + Math.random()*8}s;
        width:${1 + Math.random()*2}px;
        height:${1 + Math.random()*2}px;
        opacity:${0.15 + Math.random()*0.35};`;
      container.appendChild(p);
    }
  },
};

window.AUTH = AUTH;

/* Auto-init setelah DOM siap */
document.addEventListener('DOMContentLoaded', () => AUTH.init());
