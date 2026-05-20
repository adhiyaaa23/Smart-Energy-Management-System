/* ═══════════════════════════════════════════════════════════════
   SEMS · Smart Energy Management System — Main JS
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const STATE = {
  alarmCount: 2,
  notifications: [],
  charts: {},
  intervals: [],
};

// Agregat seluruh pabrik: KRW + CKR + STR + PGD
const FACILITY = {
  name: 'All Plants',
  baseKw: 8247 + 7180 + 4920 + 5640,   // 25987
  vampKw: 312  + 248  + 196  + 220,     // 976
  eir:    ((1.82 + 2.01 + 2.34 + 1.95) / 4),  // ~2.03 rata-rata
  pf:     ((0.91 + 0.88 + 0.86 + 0.90) / 4),  // ~0.89 rata-rata
};

const MACHINES = [
  { id:'M-01', name:'Paint Booth #1 — Oven Pengeringan',  zone:'Paint',     kw:1420, max:1600, status:'prod'  },
  { id:'M-02', name:'Paint Booth #2 — CED Painting Line', zone:'Paint',     kw:1380, max:1600, status:'prod'  },
  { id:'M-03', name:'Injection Molding #7',               zone:'Molding',   kw:312,  max:400,  status:'vamp'  },
  { id:'M-04', name:'Robotic Spot Welding — Arm A',       zone:'Welding',   kw:88,   max:220,  status:'idle'  },
  { id:'M-05', name:'Kompresor Pneumatik #1',             zone:'Compress',  kw:245,  max:300,  status:'prod'  },
  { id:'M-06', name:'Stamping Press 800T',                zone:'Stamping',  kw:680,  max:900,  status:'prod'  },
  { id:'M-07', name:'CNC Pipe Bending #3',                zone:'Machining', kw:42,   max:80,   status:'idle'  },
  { id:'M-08', name:'HVAC Zona Assembly A',               zone:'HVAC',      kw:195,  max:250,  status:'prod'  },
  { id:'M-09', name:'Heat Treatment Furnace',             zone:'Heat',      kw:375,  max:450,  status:'prod'  },
  { id:'M-10', name:'CNC Precision Machining #12',        zone:'Machining', kw:115,  max:150,  status:'prod'  },
];

const ALARMS = [
  { level:'high', icon:'⚡', title:'Vampire Power — Injection Molding #7', desc:'312 kW terdeteksi di luar sif.', time: '02 mnt lalu', machine:'M-03' },
  { level:'high', icon:'⏸', title:'Idle Berlebih — Robotic Welding Arm A', desc:'Motor servo idle 48 menit.', time: '18 mnt lalu', machine:'M-04' },
  { level:'med', icon:'📉', title:'Power Factor Kompresor #2 Menurun', desc:'PF = 0.78, periksa kapasitor bank.', time: '1 jam lalu', machine:'M-05' },
];

const DONUT_DATA = {
  labels: ['Paint & Oven','HVAC','Kompresor','Pengelasan','Lighting','Lainnya'],
  vals:   [42, 15, 13, 11, 8, 11],
  colors: ['#0A84FF','#00FFD4','#FF8C42','#D4537E','#FFB800','#4A7A6E'],
};

const TREND_DATA = {
  days:   ['Sel','Rab','Kam','Jum','Sab','Min','Sen'],
  before: [10200,10450,10100,10600,9800,8200,10300],
  after:  [8700, 8900, 8500, 9100, 8300,7200, 8247],
  vamp:   [480,  390,  420,  510,  280,  180,   312],
};

function initParticleCanvas() {
  const canvas = document.getElementById('canvas-bg');
  if(!canvas) return;
  const ctx    = canvas.getContext('2d');
  let W, H, particles, animId;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  class Particle {
    constructor() { this.reset(); }
    reset() { this.x = Math.random()*W; this.y = Math.random()*H; this.vx = (Math.random()-0.5)*0.25; this.vy = (Math.random()-0.5)*0.25; this.r = Math.random()*1.5+0.5; this.alpha = Math.random()*0.4+0.1; this.pulseT = 0; this.pulseDelay = Math.random()*300+60; this.pulsing = false; }
    update() { this.x += this.vx; this.y += this.vy; if(this.x<0) this.x=W; if(this.x>W) this.x=0; if(this.y<0) this.y=H; if(this.y>H) this.y=0; this.pulseT++; if(this.pulseT>=this.pulseDelay) { this.pulsing=true; this.pulseT=0; this.pulseDelay=Math.random()*300+60; } if(this.pulsing) { this.pulseR = (this.pulseR || 0)+0.4; if(this.pulseR>14) { this.pulsing=false; this.pulseR=0; } } }
    draw() { ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = '#00FFD4'; ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill(); if(this.pulsing && this.pulseR>0) { const a = 1 - this.pulseR/14; ctx.globalAlpha = a*0.35; ctx.strokeStyle = '#00FFD4'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.arc(this.x, this.y, this.pulseR, 0, Math.PI*2); ctx.stroke(); } ctx.restore(); }
  }
  function drawConnections() { const DIST = 120; for(let i=0; i<particles.length; i++) { for(let j=i+1; j<particles.length; j++) { const dx = particles[i].x - particles[j].x; const dy = particles[i].y - particles[j].y; const d = Math.sqrt(dx*dx + dy*dy); if(d<DIST) { const a = (1 - d/DIST)*0.08; ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#00FFD4'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y); ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); ctx.restore(); } } } }
  function draw() { ctx.clearRect(0,0,W,H); drawConnections(); particles.forEach(p => { p.update(); p.draw(); }); animId = requestAnimationFrame(draw); }
  resize(); particles = Array.from({length:60}, () => new Particle()); draw();
  window.addEventListener('resize', () => { cancelAnimationFrame(animId); resize(); animId = requestAnimationFrame(draw); });
}

function initCursor() {
  const ring = document.getElementById('cursor-ring');
  const dot  = document.getElementById('cursor-dot');
  let mx = 0, my = 0, rx = 0, ry = 0;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.left = mx+'px'; dot.style.top = my+'px'; });
  document.addEventListener('mouseover', e => { if(e.target.matches('button,.nav-item,.ftab,.alarm-item,.machine-table tr,.hm-cell')) { ring.style.width = '42px'; ring.style.height = '42px'; ring.style.borderColor = 'rgba(0,255,212,0.8)'; } });
  document.addEventListener('mouseout', () => { ring.style.width = '28px'; ring.style.height = '28px'; ring.style.borderColor = 'rgba(0,255,212,0.5)'; });
  function animateRing() { rx += (mx - rx)*0.12; ry += (my - ry)*0.12; ring.style.left = rx+'px'; ring.style.top = ry+'px'; requestAnimationFrame(animateRing); }
  animateRing();
}

function initLoader(onDone) {
  const msgs = ['Booting edge controller...','Authenticating nodes...','Handshaking Modbus TCP...','Loading baselines...','SEMS ONLINE ✓'];
  const fill = document.getElementById('loader-fill');
  const msg = document.getElementById('loader-msg');
  const nodes = document.querySelectorAll('.loader-node');
  let step = 0;
  const interval = setInterval(() => {
    if(step < msgs.length) {
      if(msg) msg.textContent = msgs[step];
      if(fill) fill.style.width = ((step+1)/msgs.length*100)+'%';
      if(nodes[step]) nodes[step].classList.add('on');
      step++;
    } else {
      clearInterval(interval);
      setTimeout(() => {
        const l = document.getElementById('loader');
        if(l) { l.style.opacity = '0'; setTimeout(() => { l.style.display = 'none'; onDone(); }, 600); }
      }, 200);
    }
  }, 250);
}

function initClock() {
  function tick() {
    const now = new Date();
    const c = document.getElementById('clock'), d = document.getElementById('date-display');
    if(c) c.textContent = now.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false});
    if(d) d.textContent = now.toLocaleDateString('id-ID', {weekday:'short', day:'2-digit', month:'short', year:'numeric'});
  }
  tick(); setInterval(tick, 1000);
}

function animateNumber(el, from, to, duration, formatter) {
  const start = performance.now();
  function update(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 4);
    el.textContent = formatter(from + (to - from) * ease);
    if (t < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function renderKPIs() {
  const f = FACILITY;
  const totalSaved = f.baseKw * 0.148 * 996.74 * 720 / 1e9;
  const kpis = [
    { id: 'kv-kwh', from: f.baseKw + 500, to: f.baseKw, fmt: v => Math.round(v).toLocaleString('id-ID'), color: '--plasma', glow: '--plasma-glow', sub: 'kW saat ini', delta: '↓ 14.2% vs baseline', deltaClass: 'delta-down-good', sparkData: [10200,10450,10100,10600,9800,8200,f.baseKw] },
    { id: 'kv-vamp', from: f.vampKw + 80, to: f.vampKw, fmt: v => Math.round(v).toLocaleString('id-ID'), color: '--danger', glow: '--danger-glow', sub: 'kW terbuang', delta: `⚠ ${(f.vampKw/f.baseKw*100).toFixed(1)}% beban`, deltaClass: 'delta-up-bad', sparkData: [480,390,420,510,280,180,f.vampKw] },
    { id: 'kv-idle', from: 800, to: 680, fmt: v => Math.round(v).toLocaleString('id-ID'), color: '--warn', glow: 'rgba(255,184,0,0.3)', sub: 'kW idle/standby', delta: '↑ 2 mesin idle', deltaClass: 'delta-up-bad', sparkData: [700,720,680,750,650,580,680] },
    { id: 'kv-eir', from: 2.50, to: f.eir, fmt: v => v.toFixed(2), color: '--plasma', glow: '--plasma-glow', sub: 'kWh / unit motor', delta: `↓ target tercapai`, deltaClass: 'delta-down-good', sparkData: [2.4,2.2,2.1,2.0,1.95,1.87,f.eir] },
    { id: 'kv-saving', from: 0, to: totalSaved, fmt: v => v.toFixed(2), color: '--plasma', glow: '--plasma-glow', sub: 'Miliar Rp hemat', delta: '✓ Target 15%', deltaClass: 'delta-up-good', sparkData: [1,2,3,4,5,6,totalSaved] }
  ];
  // Bug fix: HTML uses class="kpi-grid" with id="section-overview", not id="kpi-grid"
  const grid = document.querySelector('.kpi-grid') || document.getElementById('section-overview');
  if(!grid) return;
  grid.innerHTML = kpis.map(k => `
    <div class="kpi" style="--kpi-color: var(${k.color}); --kpi-glow: ${k.glow};">
      <div class="kpi-label">${k.id==='kv-kwh'?'Konsumsi Aktif':k.id==='kv-vamp'?'Vampire Power':k.id==='kv-idle'?'Beban Idle':k.id==='kv-eir'?'EIR Hari Ini':'Hemat Bulan Ini'}</div>
      <div class="kpi-value" id="${k.id}">—</div>
      <div class="kpi-sub">${k.sub}</div>
      <div class="kpi-delta ${k.deltaClass}">${k.delta}</div>
    </div>
  `).join('');
  kpis.forEach(k => { const el = document.getElementById(k.id); if(el) animateNumber(el, k.from, k.to, 1200, k.fmt); });
}

function startLiveFlicker() {
  const id = setInterval(() => {
    const f = FACILITY;
    const kwEl = document.getElementById('kv-kwh'), vEl = document.getElementById('kv-vamp'), latEl = document.getElementById('latency');
    if(kwEl) kwEl.textContent = (f.baseKw + Math.round((Math.random()-0.5)*600)).toLocaleString('id-ID');
    if(vEl) vEl.textContent = (f.vampKw + Math.round((Math.random()-0.5)*80)).toLocaleString('id-ID');
    if(latEl) latEl.textContent = (8 + Math.round(Math.random()*20)) + 'ms';
  }, 3500);
  STATE.intervals.push(id);
}

function renderMachines() {
  const tbody = document.getElementById('machine-body');
  if(!tbody) return;
  tbody.innerHTML = MACHINES.map(m => {
    const pct = Math.min(100, Math.round(m.kw / m.max * 100));
    const color = m.status === 'prod' ? '#00FFD4' : m.status === 'vamp' ? '#FF2D55' : '#FFB800';
    return `<tr>
      <td><div class="m-id">${m.id}</div><div class="m-name">${m.name}</div></td>
      <td><span class="m-zone-badge">${m.zone}</span></td>
      <td><span class="kw-num" style="color:${color};">${m.kw.toLocaleString('id-ID')}</span> kW</td>
      <td><div class="bar-wrap"><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color};"></div></div><span>${pct}%</span></div></td>
      <td><span class="status-pill">${m.status.toUpperCase()}</span></td>
      <td>NORMAL</td>
    </tr>`;
  }).join('');
}

function renderAlarms() {
  const el = document.getElementById('alarm-list'); if(!el) return;
  el.innerHTML = ALARMS.map(a => `<div class="alarm-item alarm-${a.level}"><div class="alarm-body"><div class="alarm-title">${a.title}</div><div class="alarm-desc">${a.desc}</div></div></div>`).join('');
}

function renderEIR() {
  const el = document.getElementById('eir-list'); if(!el) return;
  const baseEir = FACILITY.eir;
  el.innerHTML = `
    <div class="eir-row"><span class="eir-label">Main Line Alpha</span><div class="eir-track"><div class="eir-fill" style="width:${(baseEir/4.0)*100}%;background:#00FFD4;"></div></div><span class="eir-val">${baseEir.toFixed(2)}</span></div>
    <div class="eir-row"><span class="eir-label">Secondary Assembly</span><div class="eir-track"><div class="eir-fill" style="width:${((baseEir*1.1)/4.0)*100}%;background:#FFB800;"></div></div><span class="eir-val">${(baseEir*1.1).toFixed(2)}</span></div>
  `;
}

function renderSidebarEnergy() {
  const el = document.getElementById('sidebar-energy-rows'); if(!el) return;
  el.innerHTML = `
    <div class="se-row"><span class="se-label">Production</span><div class="se-track"><div class="se-fill" style="width:55%;background:#0A84FF;"></div></div><span>55%</span></div>
    <div class="se-row"><span class="se-label">HVAC System</span><div class="se-track"><div class="se-fill" style="width:25%;background:#00FFD4;"></div></div><span>25%</span></div>
  `;
}

function updatePFGauge(pf) {
  const el = document.getElementById('pf-gauge'); if(!el) return;
  const color = pf >= 0.85 ? '#00FFD4' : '#FFB800';
  el.setAttribute('viewBox', '0 0 130 130'); el.setAttribute('width', '130'); el.setAttribute('height', '130');
  el.innerHTML = `<circle cx="65" cy="65" r="50" fill="none" stroke="rgba(0,255,212,0.1)" stroke-width="8"/><circle cx="65" cy="65" r="50" fill="none" stroke="${color}" stroke-width="8" stroke-dasharray="200" stroke-dashoffset="${200 - (pf*200)}"/><text x="65" y="70" text-anchor="middle" font-family="Share Tech Mono" font-size="20" fill="${color}">${pf.toFixed(2)}</text>`;
}

/* ── NAV & SCROLL PADA SIDEBAR ───────────────────────────────── */
window.navClick = function(el, targetId) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');

  // Meluncur ke panel yang dituju (Smooth Scroll)
  if (targetId) {
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Tutup sidebar otomatis di mode HP
  if (window.innerWidth <= 680) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('mobile-overlay').classList.remove('active');
  }
};



function initSimulator() {
  const slR = document.getElementById('sl-reduction'), slB = document.getElementById('sl-base'), res = document.getElementById('sim-results');
  if(!slR || !slB || !res) return;
  const calc = () => {
    const pct = parseInt(slR.value), base = parseInt(slB.value);
    const sv = document.getElementById('sv-reduction'), sb = document.getElementById('sv-base');
    if(sv) sv.textContent = pct+'%'; if(sb) sb.textContent = base;
    res.innerHTML = `<div class="sim-row"><span>Energi Diselamatkan:</span><span>${((base*1e6)*pct/100/1e6).toFixed(1)}M kWh/bln</span></div><div class="sim-row hl"><span>Est. Penghematan:</span><span>Rp ${((base*1e6*pct/100)*996.74/1e9).toFixed(2)} M</span></div>`;
  };
  slR.addEventListener('input', calc); slB.addEventListener('input', calc); calc();
}

function renderHeatmap() {
  const wrap = document.getElementById('heatmap-cells'); if(!wrap) return;
  wrap.innerHTML = Array.from({length:24}, (_,i) => `<div class="hm-cell" style="background:rgba(255,45,85,${i<6||i>20?0.8:0.2})"></div>`).join('');
}

function buildCharts() {
  Chart.defaults.font.family = "'Share Tech Mono', monospace"; Chart.defaults.color = '#4A7A6E';
  const tEl = document.getElementById('trend-chart'), dEl = document.getElementById('donut-chart');
  if(tEl) {
    STATE.charts.trend = new Chart(tEl, {
      type: 'line',
      data: { labels: TREND_DATA.days, datasets: [
        { label: 'Sebelum', data: TREND_DATA.before, borderColor: 'rgba(74,122,110,0.4)', borderWidth: 1.5, fill: false },
        { label: 'Sesudah', data: TREND_DATA.after, borderColor: '#00FFD4', borderWidth: 2.5, fill: true, backgroundColor: 'rgba(0,255,212,0.02)' }
      ]},
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { ticks: { callback: v => (v/1000)+'K' } } } }
    });
  }
  if(dEl) {
    STATE.charts.donut = new Chart(dEl, {
      type: 'doughnut',
      data: { labels: DONUT_DATA.labels, datasets: [{ data: DONUT_DATA.vals, backgroundColor: DONUT_DATA.colors }]},
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }
}

function initMobileMenu() {
  const btn = document.getElementById('menu-toggle'), side = document.getElementById('sidebar'), ov = document.getElementById('mobile-overlay');
  if(!btn || !side || !ov) return;
  btn.addEventListener('click', () => { side.classList.toggle('open'); ov.classList.toggle('active'); });
  ov.addEventListener('click', () => { side.classList.remove('open'); ov.classList.remove('active'); });
}

/* ── POWER FLOW CANVAS (RESIZED & SCALED UP) ───────────── */
function initFlowCanvas() {
  const canvas = document.getElementById('flow-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let animId;
  
  function resize() { 
    canvas.width = canvas.offsetWidth; 
    canvas.height = 450; // Tinggi kanvas sudah besar
  }

  // Posisi (Y) sudah disebar agar lebih mengisi ruang atas-bawah
  const NODES = [
    { label:'PLN Grid',    x:0.06, y:0.20, color:'#FFB800', val:'25.9 MW', pulse: 0 },
    { label:'Trafo Utama', x:0.22, y:0.20, color:'#00FFD4', val:'25.8 MW', pulse: 1 },
    { label:'Panel MDP',   x:0.38, y:0.20, color:'#00FFD4', val:'25.8 MW', pulse: 2 },
    
    { label:'HVAC System', x:0.22, y:0.80, color:'#00FFD4', val:'6.5 MW',  pulse: 3 },
    { label:'Lighting',    x:0.38, y:0.80, color:'#30D158', val:'5.1 MW',  pulse: 4 },
    
    { label:'Prod Utama',  x:0.58, y:0.50, color:'#0A84FF', val:'14.2 MW', pulse: 5 },
    
    { label:'Machining',   x:0.86, y:0.10, color:'#0A84FF', val:'3.1 MW',  pulse: 6 },
    { label:'Welding',     x:0.86, y:0.30, color:'#FF2D55', val:'2.7 MW',  pulse: 7 },
    { label:'Stamping',    x:0.86, y:0.50, color:'#FFB800', val:'3.5 MW',  pulse: 8 },
    { label:'Molding',     x:0.86, y:0.70, color:'#0A84FF', val:'2.9 MW',  pulse: 9 },
    { label:'Paint Booth', x:0.86, y:0.90, color:'#00FFD4', val:'2.0 MW',  pulse: 10 }
  ];
  
  const EDGES = [
    [0, 1], [1, 2], [2, 3], [2, 4], [2, 5], 
    [5, 6], [5, 7], [5, 8], [5, 9], [5, 10]
  ];
  
  const packets = [];

  function spawnPacket(edgeIdx) {
    const e = EDGES[edgeIdx]; 
    const a = NODES[e[0]], b = NODES[e[1]];
    packets.push({ 
      ax: a.x, ay: a.y, 
      bx: b.x, by: b.y, 
      t: 0, 
      speed: 0.004 + Math.random() * 0.004, 
      color: b.color,
      len: 0.07 + Math.random() * 0.05 
    });
  }

  let frameCount = 0;
  function draw() {
    if(canvas.width !== canvas.offsetWidth) resize();
    
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    
    frameCount++;
    if(frameCount % 10 === 0) { 
      EDGES.forEach((_, i) => { if(Math.random() > 0.25) spawnPacket(i); }); 
    }

    // 1. Gambar Kabel (Lebih tebal)
    EDGES.forEach(e => {
      const a = NODES[e[0]], b = NODES[e[1]];
      
      ctx.save(); 
      ctx.strokeStyle = 'rgba(0, 255, 212, 0.04)'; 
      ctx.lineWidth = 6; // Ketebalan kabel dasar diperbesar
      ctx.beginPath(); ctx.moveTo(a.x*W, a.y*H); ctx.lineTo(b.x*W, b.y*H); ctx.stroke(); 
      
      ctx.strokeStyle = 'rgba(0, 255, 212, 0.2)'; 
      ctx.lineWidth = 2; // Garis putus-putus dipertebal
      ctx.setLineDash([6, 10]);
      ctx.lineDashOffset = -frameCount * 0.5;
      ctx.beginPath(); ctx.moveTo(a.x*W, a.y*H); ctx.lineTo(b.x*W, b.y*H); ctx.stroke(); 
      ctx.restore();
    });

    // 2. Gambar Paket Energi (Lebih besar)
    for(let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i]; 
      p.t += p.speed;
      if(p.t >= 1) { packets.splice(i, 1); continue; }
      
      const px = (p.ax + (p.bx - p.ax) * p.t) * W; 
      const py = (p.ay + (p.by - p.ay) * p.t) * H;
      const tailT = Math.max(0, p.t - p.len);
      const tx = (p.ax + (p.bx - p.ax) * tailT) * W; 
      const ty = (p.ay + (p.by - p.ay) * tailT) * H;

      ctx.save(); 
      const grad = ctx.createLinearGradient(tx, ty, px, py);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, p.color);

      ctx.strokeStyle = grad; 
      ctx.lineWidth = 4; // Ekor komet lebih tebal
      ctx.lineCap = 'round';
      ctx.shadowColor = p.color; 
      ctx.shadowBlur = 8; 
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(px, py); ctx.stroke(); 

      ctx.fillStyle = '#FFFFFF'; 
      ctx.shadowColor = p.color; 
      ctx.shadowBlur = 15; 
      ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill(); // Kepala komet lebih besar
      ctx.restore();
    }

    // 3. Gambar Node & Teks (Teks lebih besar dan jelas)
    NODES.forEach(n => {
      const nx = n.x * W, ny = n.y * H;
      n.pulse += 0.035;
      const pSize = Math.sin(n.pulse) * 2;

      ctx.save(); 
      // Lingkaran luar (Aura)
      ctx.shadowColor = n.color; 
      ctx.shadowBlur = 15; 
      ctx.fillStyle = n.color;
      ctx.globalAlpha = 0.15;
      ctx.beginPath(); ctx.arc(nx, ny, 14 + pSize, 0, Math.PI*2); ctx.fill(); // Radius aura diperbesar

      // Lingkaran batas
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#030A10'; 
      ctx.beginPath(); ctx.arc(nx, ny, 7, 0, Math.PI*2); ctx.fill(); // Radius node diperbesar
      ctx.lineWidth = 1.5; 
      ctx.strokeStyle = n.color; 
      ctx.stroke();

      // Titik tengah
      ctx.fillStyle = n.color;
      ctx.beginPath(); ctx.arc(nx, ny, 3, 0, Math.PI*2); ctx.fill();
      ctx.restore();

      // TEKS: Diperbesar agar jelas terbaca
      ctx.fillStyle = '#A8C8BE'; 
      ctx.font = '12px Share Tech Mono, monospace'; // Font label membesar dari 10px ke 12px
      ctx.textAlign = 'center';
      ctx.fillText(n.label, nx, ny + 24);

      ctx.fillStyle = n.color; 
      ctx.font = 'bold 12px Share Tech Mono, monospace'; // Font value membesar dari 9px ke 12px
      ctx.fillText(n.val, nx, ny + 38);
    });

    animId = requestAnimationFrame(draw);
  }
  
  resize(); draw();
  window.addEventListener('resize', () => { 
    cancelAnimationFrame(animId); 
    resize(); 
    animId = requestAnimationFrame(draw); 
  });
}

/* ── NOTIF PANEL TOGGLE ──────────────────────────────────────── */
function initNotifPanel() {
  const btn=document.querySelector('.alert-btn'), panel=document.getElementById('notif-panel');
  const close=document.querySelector('.notif-close'), body=document.querySelector('.notif-body');
  if(!btn||!panel) return;
  if(body) body.innerHTML = ALARMS.map(a => `
    <div style="padding:10px 0;border-bottom:1px solid rgba(0,255,212,0.07);">
      <div style="font-family:var(--font-mono);font-size:10px;color:${a.level==='high'?'#FF2D55':'#FFB800'};margin-bottom:3px;">${a.icon} ${a.title}</div>
      <div style="font-size:11px;color:#A8C8BE;">${a.desc}</div>
      <div style="font-size:9px;color:#243D35;margin-top:2px;">${a.time}</div>
    </div>`).join('');
  btn.addEventListener('click', () => panel.classList.toggle('open'));
  if(close) close.addEventListener('click', () => panel.classList.remove('open'));
  document.addEventListener('click', e => { if(!panel.contains(e.target)&&!btn.contains(e.target)) panel.classList.remove('open'); });
}

document.addEventListener('DOMContentLoaded', () => {
  initCursor();
  initLoader(() => {
    initParticleCanvas(); initClock(); initMobileMenu(); initNotifPanel();
    renderKPIs(); renderMachines(); renderAlarms(); renderEIR(); renderSidebarEnergy();
    buildCharts(); initSimulator(); renderHeatmap(); updatePFGauge(FACILITY.pf); startLiveFlicker(); initFlowCanvas();
  });
});

