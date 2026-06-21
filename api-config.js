/* ═══════════════════════════════════════════════════════════════
   SEMS · API Configuration & Data Adapter Layer
   Mendukung: REST API, WebSocket, MQTT-over-HTTP, Modbus TCP Gateway
   ═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── KONFIGURASI UTAMA ────────────────────────────────────────────
   Edit bagian ini sesuai infrastruktur perusahaan Anda.
   ─────────────────────────────────────────────────────────────── */
const SEMS_CONFIG = {

  /* Mode koneksi: 'demo' | 'rest' | 'websocket' | 'mqtt' | 'modbus'
     - 'demo'      : Data simulasi (default, tidak perlu server)
     - 'rest'      : Polling HTTP ke REST API / SCADA REST endpoint
     - 'websocket' : Streaming realtime via WebSocket
     - 'mqtt'      : MQTT over WebSocket (broker MQTT)
     - 'modbus'    : Modbus TCP via HTTP gateway (Node-RED / kepware)
  */
  MODE: 'demo',

  /* ── REST API CONFIG ─────────────────────────────────────────── */
  REST: {
    BASE_URL:      'https://api.ahm-sems.internal/v1',  // Base URL API Anda
    API_KEY:       'YOUR_API_KEY_HERE',                  // API Key / Bearer token
    POLL_INTERVAL: 5000,                                 // ms — polling interval

    ENDPOINTS: {
      FACILITY:   '/facility/aggregate',   // GET → data KPI agregat semua pabrik
      MACHINES:   '/machines/status',      // GET → status semua mesin
      ALARMS:     '/alarms/active',        // GET → alarm aktif
      TREND:      '/energy/trend/7d',      // GET → data tren 7 hari
      DONUT:      '/energy/distribution',  // GET → distribusi energi per zona
      HEATMAP:    '/vampire/heatmap/24h',  // GET → heatmap vampire power 24 jam
      EIR:        '/eir/production-lines', // GET → EIR per lini produksi
      TARIFF:     '/tariff/current',       // GET → tarif PLN aktif
    },

    /* Header tambahan jika diperlukan (misal: session cookie, tenant ID) */
    EXTRA_HEADERS: {
      'X-Tenant-ID': 'AHM-CKR',
      'X-Plant-ID':  'plant3',
    },
  },

  /* ── WEBSOCKET CONFIG ────────────────────────────────────────── */
  WS: {
    URL:            'wss://ws.ahm-sems.internal/live',   // WebSocket endpoint
    RECONNECT_MS:   3000,  // Reconnect delay jika koneksi terputus
    HEARTBEAT_MS:   25000, // Kirim ping setiap N ms

    /* Channel / topic yang di-subscribe setelah konek */
    SUBSCRIBE: {
      facility:  { action: 'subscribe', channel: 'plant3.facility.aggregate' },
      machines:  { action: 'subscribe', channel: 'plant3.machines.status' },
      alarms:    { action: 'subscribe', channel: 'plant3.alarms.active' },
    },
  },

  /* ── MQTT over WebSocket CONFIG ──────────────────────────────── */
  MQTT: {
    BROKER_URL:  'wss://mqtt.ahm-sems.internal:8083/mqtt', // MQTT broker WS
    USERNAME:    'sems_dashboard',
    PASSWORD:    'YOUR_MQTT_PASSWORD',
    CLIENT_ID:   'sems-plant3-ckr-' + Math.random().toString(16).slice(2, 8),

    TOPICS: {
      FACILITY:  'ahm/sems/plant3/facility/aggregate',
      MACHINES:  'ahm/sems/plant3/machines/+/status',
      ALARMS:    'ahm/sems/plant3/alarms/active',
      TREND:     'ahm/sems/plant3/energy/trend',
    },

    /* Library CDN — tambahkan ke <head> index.html jika mode MQTT aktif:
       <script src="https://unpkg.com/mqtt/dist/mqtt.min.js"></script>
    */
  },

  /* ── MODBUS TCP GATEWAY CONFIG ───────────────────────────────── */
  MODBUS: {
    /* Contoh: Node-RED dengan node "node-red-contrib-modbus"
       yang mengekspos endpoint HTTP untuk baca register */
    GATEWAY_URL:   'http://nodered.ahm-sems.internal:1880/api/modbus',
    POLL_INTERVAL: 2000,

    /* Peta register Modbus ke field data SEMS */
    REGISTERS: {
      // { unit: device ID, address: register address, length: jumlah register }
      TOTAL_KW:    { unit: 1, address: 40001, length: 2, scale: 0.1 },
      VAMPIRE_KW:  { unit: 1, address: 40003, length: 2, scale: 0.1 },
      POWER_FACTOR:{ unit: 1, address: 40005, length: 1, scale: 0.01 },
      // Tambah register lain sesuai PLC/meter Anda
    },
  },

  /* ── DATA MAPPING ────────────────────────────────────────────── */
  /* Jika struktur JSON API berbeda dari yang diharapkan SEMS,
     edit fungsi map* di bawah ini */
  MAPPING: {

    /**
     * Map response API fasilitas ke format FACILITY internal SEMS
     * @param {Object} raw - Raw response dari API
     * @returns {Object} - Format FACILITY
     */
    mapFacility(raw) {
      // Default passthrough — sesuaikan dengan struktur API Anda
      return {
        baseKw:  raw.total_kw        ?? raw.totalKw        ?? raw.baseKw        ?? 8742,
        vampKw:  raw.vampire_kw      ?? raw.vampireKw      ?? raw.vampKw        ?? 312,
        eir:     raw.eir_avg         ?? raw.eirAvg         ?? raw.eir           ?? 2.11,
        pf:      raw.power_factor    ?? raw.powerFactor    ?? raw.pf            ?? 0.87,
        saving:  raw.monthly_saving  ?? raw.monthlySaving  ?? raw.saving        ?? null,
      };
    },

    /**
     * Map response API mesin ke format MACHINES internal SEMS
     * @param {Array} rawList - Array dari API
     * @returns {Array}
     */
    mapMachines(rawList) {
      if (!Array.isArray(rawList)) rawList = rawList.data ?? rawList.machines ?? [];
      return rawList.map(m => ({
        id:     m.machine_id   ?? m.id,
        name:   m.machine_name ?? m.name,
        zone:   m.zone         ?? m.area,
        kw:     m.power_kw     ?? m.kw    ?? m.current_power,
        max:    m.rated_kw     ?? m.max   ?? m.rated_power,
        status: mapMachineStatus(m.status ?? m.state),
        anomaly:m.anomaly      ?? m.alarm_flag ?? false,
      }));
    },

    /**
     * Map response API alarm
     * @param {Array} rawList
     * @returns {Array}
     */
    mapAlarms(rawList) {
      if (!Array.isArray(rawList)) rawList = rawList.data ?? rawList.alarms ?? [];
      return rawList.map(a => ({
        level:   a.severity   ?? (a.level === 'critical' ? 'high' : a.level ?? 'med'),
        icon:    a.icon       ?? '⚡',
        title:   a.title      ?? a.alarm_name ?? a.description,
        desc:    a.detail     ?? a.message    ?? '',
        time:    a.time_ago   ?? formatTimeAgo(a.timestamp ?? a.created_at),
        machine: a.machine_id ?? a.device_id  ?? null,
      }));
    },

    /**
     * Map response trend 7 hari
     * @param {Object} raw
     * @returns {Object} { days, before, after, vamp }
     */
    mapTrend(raw) {
      const arr = raw.data ?? raw.trend ?? raw;
      if (!Array.isArray(arr)) return null;
      return {
        days:   arr.map(d => d.day   ?? d.label ?? d.date),
        before: arr.map(d => d.before ?? d.baseline),
        after:  arr.map(d => d.after  ?? d.with_sems  ?? d.actual),
        vamp:   arr.map(d => d.vampire ?? d.vampire_kw ?? d.vamp ?? 0),
      };
    },

    /**
     * Map response distribusi energi (donut chart)
     */
    mapDonut(raw) {
      const arr = raw.data ?? raw.distribution ?? raw;
      if (!Array.isArray(arr)) return null;
      return {
        labels: arr.map(d => d.zone ?? d.label ?? d.name),
        vals:   arr.map(d => d.percentage ?? d.value ?? d.pct),
        colors: arr.map(d => d.color) ?? null,
      };
    },

    /**
     * Map heatmap 24 jam
     * @returns {Array<number>} 24 nilai intensitas
     */
    mapHeatmap(raw) {
      const arr = raw.data ?? raw.hours ?? raw;
      if (!Array.isArray(arr)) return null;
      return arr.map(h => h.intensity ?? h.vampire_kw ?? h.value ?? 0);
    },

    /**
     * Map EIR per lini
     */
    mapEIR(raw) {
      const arr = raw.data ?? raw.lines ?? raw;
      if (!Array.isArray(arr)) return null;
      return arr.map(l => ({
        label: l.line_name ?? l.label ?? l.name,
        eir:   l.eir       ?? l.value,
        max:   l.eir_max   ?? l.target ?? 4.0,
        color: l.color     ?? null,
      }));
    },
  },
};

/* ─────────────────────────────────────────────────────────────── */
/* Helper: Map status mesin dari API ke internal format           */
/* ─────────────────────────────────────────────────────────────── */
function mapMachineStatus(apiStatus) {
  if (!apiStatus) return 'idle';
  const s = String(apiStatus).toLowerCase();
  if (['running', 'production', 'prod', 'on', 'active', '1'].includes(s)) return 'prod';
  if (['vampire', 'standby_draw', 'phantom', 'leak'].includes(s))         return 'vamp';
  if (['idle', 'standby', 'off', 'stop', '0'].includes(s))                return 'idle';
  return 'idle';
}

/* Helper: Format timestamp relatif */
function formatTimeAgo(timestamp) {
  if (!timestamp) return '—';
  const diff = Date.now() - new Date(timestamp).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'baru saja';
  if (m < 60) return m + ' mnt lalu';
  return Math.floor(m / 60) + ' jam lalu';
}

/* ═══════════════════════════════════════════════════════════════
   DATA ADAPTER — Kelas utama yang dipanggil oleh script.js
   ═══════════════════════════════════════════════════════════════ */
class SEMSDataAdapter {
  constructor(config) {
    this.cfg      = config;
    this.mode     = config.MODE;
    this._ws      = null;
    this._mqttClient = null;
    this._polls   = [];
    this._listeners = {};

    /* Fallback ke demo jika mode tidak dikenali */
    if (!['demo','rest','websocket','mqtt','modbus'].includes(this.mode)) {
      console.warn('[SEMS] Mode tidak dikenali, fallback ke demo.');
      this.mode = 'demo';
    }

    console.info(`[SEMS DataAdapter] Mode: ${this.mode.toUpperCase()}`);
  }

  /* ── PUBLIC API ─────────────────────────────────────────────── */

  /** Daftarkan listener untuk event data */
  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  }

  /** Mulai koneksi dan polling */
  start() {
    switch (this.mode) {
      case 'rest':      this._startREST();      break;
      case 'websocket': this._startWebSocket();  break;
      case 'mqtt':      this._startMQTT();       break;
      case 'modbus':    this._startModbus();     break;
      case 'demo':
      default:          this._startDemo();       break;
    }
  }

  /** Hentikan semua koneksi */
  stop() {
    this._polls.forEach(clearInterval);
    this._polls = [];
    if (this._ws) { this._ws.close(); this._ws = null; }
    if (this._mqttClient) { this._mqttClient.end(); this._mqttClient = null; }
  }

  /* ── REST API ────────────────────────────────────────────────── */
  async _startREST() {
    const r = this.cfg.REST;
    this._updateStatus('connecting', 'Menghubungkan ke REST API...');

    try {
      await this._fetchAll(r);
      this._updateStatus('online', 'REST API terhubung');
      const id = setInterval(() => this._fetchAll(r), r.POLL_INTERVAL);
      this._polls.push(id);
    } catch (e) {
      this._updateStatus('error', 'Gagal: ' + e.message);
      console.error('[SEMS REST]', e);
      /* Auto retry setelah 10 detik */
      setTimeout(() => this._startREST(), 10000);
    }
  }

  async _fetchAll(r) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${r.API_KEY}`,
      ...r.EXTRA_HEADERS,
    };

    const safe = async (endpoint, mapFn) => {
      try {
        const res = await fetch(r.BASE_URL + endpoint, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return mapFn(json);
      } catch(e) {
        console.warn('[SEMS REST] Endpoint gagal:', endpoint, e.message);
        return null;
      }
    };

    const m = this.cfg.MAPPING;
    const [facility, machines, alarms, trend, donut, heatmap, eir] = await Promise.all([
      safe(r.ENDPOINTS.FACILITY, m.mapFacility),
      safe(r.ENDPOINTS.MACHINES, m.mapMachines),
      safe(r.ENDPOINTS.ALARMS,   m.mapAlarms),
      safe(r.ENDPOINTS.TREND,    m.mapTrend),
      safe(r.ENDPOINTS.DONUT,    m.mapDonut),
      safe(r.ENDPOINTS.HEATMAP,  m.mapHeatmap),
      safe(r.ENDPOINTS.EIR,      m.mapEIR),
    ]);

    if (facility) this._emit('facility', facility);
    if (machines) this._emit('machines', machines);
    if (alarms)   this._emit('alarms',   alarms);
    if (trend)    this._emit('trend',    trend);
    if (donut)    this._emit('donut',    donut);
    if (heatmap)  this._emit('heatmap',  heatmap);
    if (eir)      this._emit('eir',      eir);
  }

  /* ── WEBSOCKET ───────────────────────────────────────────────── */
  _startWebSocket() {
    const wsCfg = this.cfg.WS;
    this._updateStatus('connecting', 'Menghubungkan WebSocket...');

    const connect = () => {
      try {
        const ws = new WebSocket(wsCfg.URL);
        this._ws = ws;

        ws.onopen = () => {
          this._updateStatus('online', 'WebSocket terhubung');
          Object.values(wsCfg.SUBSCRIBE).forEach(msg => ws.send(JSON.stringify(msg)));

          /* Heartbeat */
          this._heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ action: 'ping' }));
          }, wsCfg.HEARTBEAT_MS);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            const m   = this.cfg.MAPPING;

            if (msg.channel === 'facility.aggregate' || msg.type === 'facility') {
              this._emit('facility', m.mapFacility(msg.data ?? msg));
            } else if (msg.channel === 'machines.status' || msg.type === 'machines') {
              this._emit('machines', m.mapMachines(msg.data ?? msg));
            } else if (msg.channel === 'alarms.active' || msg.type === 'alarms') {
              this._emit('alarms', m.mapAlarms(msg.data ?? msg));
            } else if (msg.type === 'trend') {
              this._emit('trend', m.mapTrend(msg.data ?? msg));
            } else if (msg.type === 'donut') {
              this._emit('donut', m.mapDonut(msg.data ?? msg));
            } else if (msg.type === 'heatmap') {
              this._emit('heatmap', m.mapHeatmap(msg.data ?? msg));
            }
            /* Latency dari server timestamp */
            if (msg.server_ts) {
              const lat = Date.now() - msg.server_ts;
              this._emit('latency', lat);
            }
          } catch(e) {
            console.warn('[SEMS WS] Parse error:', e);
          }
        };

        ws.onerror = (e) => console.error('[SEMS WS] Error:', e);

        ws.onclose = () => {
          clearInterval(this._heartbeat);
          this._updateStatus('reconnecting', 'Reconnecting...');
          this._ws = null;
          setTimeout(connect, wsCfg.RECONNECT_MS);
        };
      } catch(e) {
        this._updateStatus('error', 'WebSocket gagal: ' + e.message);
        setTimeout(connect, wsCfg.RECONNECT_MS);
      }
    };

    connect();
  }

  /* ── MQTT over WebSocket ─────────────────────────────────────── */
  _startMQTT() {
    const mqCfg = this.cfg.MQTT;
    this._updateStatus('connecting', 'Menghubungkan MQTT...');

    if (typeof mqtt === 'undefined') {
      console.error('[SEMS MQTT] Library mqtt.js tidak ditemukan. Tambahkan script CDN di index.html.');
      this._updateStatus('error', 'mqtt.js tidak dimuat');
      return;
    }

    const client = mqtt.connect(mqCfg.BROKER_URL, {
      username: mqCfg.USERNAME,
      password: mqCfg.PASSWORD,
      clientId: mqCfg.CLIENT_ID,
    });
    this._mqttClient = client;

    client.on('connect', () => {
      this._updateStatus('online', 'MQTT terhubung');
      Object.values(mqCfg.TOPICS).forEach(topic => client.subscribe(topic));
    });

    client.on('message', (topic, payload) => {
      try {
        const data = JSON.parse(payload.toString());
        const m    = this.cfg.MAPPING;

        if (topic.includes('facility'))    this._emit('facility', m.mapFacility(data));
        else if (topic.includes('machines')) this._emit('machines', m.mapMachines(data));
        else if (topic.includes('alarms'))  this._emit('alarms',   m.mapAlarms(data));
        else if (topic.includes('energy/trend')) this._emit('trend', m.mapTrend(data));
      } catch(e) { console.warn('[SEMS MQTT] Parse error:', e); }
    });

    client.on('error',      e  => { this._updateStatus('error', e.message); console.error('[SEMS MQTT]', e); });
    client.on('reconnect',  () => this._updateStatus('reconnecting', 'MQTT reconnecting...'));
  }

  /* ── MODBUS TCP GATEWAY ──────────────────────────────────────── */
  async _startModbus() {
    const mbCfg = this.cfg.MODBUS;
    this._updateStatus('connecting', 'Menghubungkan Modbus Gateway...');

    const poll = async () => {
      try {
        const regs = mbCfg.REGISTERS;
        const readReg = async (reg) => {
          const res = await fetch(`${mbCfg.GATEWAY_URL}/read`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unit: reg.unit, address: reg.address, length: reg.length }),
          });
          const json = await res.json();
          return (json.value ?? json.registers?.[0] ?? 0) * (reg.scale ?? 1);
        };

        const [totalKw, vampKw, pf] = await Promise.all([
          readReg(regs.TOTAL_KW).catch(() => null),
          readReg(regs.VAMPIRE_KW).catch(() => null),
          readReg(regs.POWER_FACTOR).catch(() => null),
        ]);

        const facility = {};
        if (totalKw !== null) facility.baseKw = totalKw;
        if (vampKw  !== null) facility.vampKw = vampKw;
        if (pf      !== null) facility.pf     = pf;

        if (Object.keys(facility).length > 0) this._emit('facility', facility);
        this._updateStatus('online', 'Modbus aktif');
      } catch(e) {
        this._updateStatus('error', 'Modbus: ' + e.message);
        console.error('[SEMS Modbus]', e);
      }
    };

    await poll();
    const id = setInterval(poll, mbCfg.POLL_INTERVAL);
    this._polls.push(id);
  }

  /* ── DEMO (Simulasi) ─────────────────────────────────────────── */
  _startDemo() {
    this._updateStatus('demo', 'Mode Demo — Data Simulasi');

    /* Kirim data inisial dari konstanta yang sudah ada di script.js */
    setTimeout(() => {
      /* Facility dikirim dari data global FACILITY di script.js */
      this._emit('facility', window.FACILITY ?? null);
      this._emit('machines', window.MACHINES ?? null);
      this._emit('alarms',   window.ALARMS   ?? null);
      this._emit('trend',    window.TREND_DATA ? {
        days: window.TREND_DATA.days, before: window.TREND_DATA.before,
        after: window.TREND_DATA.after, vamp: window.TREND_DATA.vamp,
      } : null);
    }, 100);

    /* Simulasi flicker data live setiap 3.5 detik */
    const id = setInterval(() => {
      if (window.FACILITY) {
        this._emit('facility', {
          ...window.FACILITY,
          baseKw: window.FACILITY.baseKw + Math.round((Math.random()-0.5)*600),
          vampKw: window.FACILITY.vampKw + Math.round((Math.random()-0.5)*80),
        });
      }
    }, 3500);
    this._polls.push(id);
  }

  /* ── INTERNAL ────────────────────────────────────────────────── */
  _emit(event, data) {
    if (!data) return;
    (this._listeners[event] || []).forEach(cb => {
      try { cb(data); } catch(e) { console.error('[SEMS emit]', event, e); }
    });
  }

  _updateStatus(state, msg) {
    this._emit('connection', { state, msg });
    /* Update UI sidebar jika tersedia */
    const el = document.getElementById('conn-status-text');
    if (el) {
      el.textContent = msg;
      el.className   = 'conn-status ' + state;
    }
  }
}

/* Export ke global scope agar script.js bisa mengakses */
window.SEMS_CONFIG  = SEMS_CONFIG;
window.SEMSDataAdapter = SEMSDataAdapter;
