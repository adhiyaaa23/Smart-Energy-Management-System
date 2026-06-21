/* ═══════════════════════════════════════════════════════════════
   SEMS · Smart Energy Management System — Main JS
   v2.5 — Real-Time Data Adapter Integration
   ═══════════════════════════════════════════════════════════════ */

'use strict';

const STATE = {
  alarmCount: 0,
  notifications: [],
  charts: {},
  intervals: [],
  adapter: null,
};

/* ── DATA DEFAULT (Fallback / Demo) ──────────────────────────── */
const FACILITY = {
  name:    'Plant 3 — Cikarang',
  baseKw:  8742,
  vampKw:  312,
  eir:     2.11,
  pf:      0.87,
};

/* Finansial Industri — studi kasus Plant 3 AHM */
const TARIF_KWH_INDUSTRI = 1444.70; // Rp/kWh Tarif PLN I-4
const ESTIMASI_FAKTOR_DENDA = 45000000; // Faktor kasar denda kVARh jika PF drop

function formatRp(value) {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function updateFinancialROI(currentPf, currentVampKw) {
  const vampireLossMonthly = currentVampKw * 24 * 30 * TARIF_KWH_INDUSTRI;
  let pfPenaltyMonthly = 0;
  const pfCard = document.getElementById('pf-penalty-card');
  const pfStatusText = document.getElementById('roi-pf-status');

  if (currentPf < 0.85) {
    pfPenaltyMonthly = Math.round((0.85 - currentPf) * 10 * ESTIMASI_FAKTOR_DENDA);
    if (pfCard) {
      pfCard.className = 'roi-card card-loss alarm-blink';
    }
    if (pfStatusText) {
      pfStatusText.textContent = `KRITIS! PF ${currentPf.toFixed(2)} di bawah batas minimum PLN (0.85)`;
      pfStatusText.style.color = 'var(--danger)';
    }
  } else {
    pfPenaltyMonthly = 0;
    if (pfCard) {
      pfCard.className = 'roi-card card-normal';
    }
    if (pfStatusText) {
      pfStatusText.textContent = `Aman. Power Factor (${currentPf.toFixed(2)}) memenuhi regulasi PLN`;
      pfStatusText.style.color = 'var(--plasma)';
    }
  }

  const potentialSavings = (vampireLossMonthly * 0.8) + pfPenaltyMonthly;

  const vampireEl = document.getElementById('roi-vampire-loss');
  const penaltyEl = document.getElementById('roi-pf-penalty');
  const savingsEl = document.getElementById('roi-total-savings');
  if (vampireEl) vampireEl.textContent = formatRp(vampireLossMonthly);
  if (penaltyEl) penaltyEl.textContent = formatRp(pfPenaltyMonthly);
  if (savingsEl) savingsEl.textContent = formatRp(potentialSavings);
}

function enhanceSimulator() {
  let tick = 0;
  setInterval(() => {
    tick++;
    if (tick % 4 === 0) {
      FACILITY.pf = 0.81;
      FACILITY.vampKw = 420;
      triggerSmartAlarm(
        'ALM-PF-09',
        'CRITICAL',
        'Degradasi Power Factor di bawah batas aman (0.81) pada Lini Die Casting #1',
        'REKOMENDASI: Segera aktifkan modul otomatis Capacitor Bank Step 3 atau jadwalkan maintenance beban induktif motor P3-01.'
      );
    } else if (tick % 4 === 2) {
      FACILITY.pf = 0.89;
      FACILITY.vampKw = 210;
    }
    updateFinancialROI(FACILITY.pf, FACILITY.vampKw);
  }, 5000);
}

function triggerSmartAlarm(id, level, message, recommendation) {
  const alarmWrap = document.getElementById('alarm-list') || document.querySelector('.alarms-list');
  if (!alarmWrap) return;

  const alarmHtml = `
    <div class="alarm-item level-${level.toLowerCase()}">
      <div class="alarm-meta">
        <span class="alarm-id">[${id}]</span>
        <span class="alarm-level">${level}</span>
      </div>
      <div class="alarm-msg">${message}</div>
      <div class="alarm-recommendation">💡 ${recommendation}</div>
    </div>
  `;

  alarmWrap.insertAdjacentHTML('afterbegin', alarmHtml);
}

/* ESG METRICS & REPORTING */
const ESG_METRICS = {
  co2Factor: 0.82, // kg CO2 per kWh
  monthlyOperatingDays: 22,
  operatingHoursPerDay: 16,
};

function updateESGMetrics() {
  const vampireLossMonthly = FACILITY.vampKw * 24 * 30 * TARIF_KWH_INDUSTRI;
  const energySavedKwh = (vampireLossMonthly / TARIF_KWH_INDUSTRI) * 0.8;
  const co2Saved = (energySavedKwh * ESG_METRICS.co2Factor) / 1000;
  
  const safetyDaysNoIncident = 487;
  const operatorEfficiency = 92;
  const complianceRate = 100;

  if (document.getElementById('esg-co2-saved')) document.getElementById('esg-co2-saved').textContent = co2Saved.toFixed(2);
  if (document.getElementById('esg-energy-saved')) document.getElementById('esg-energy-saved').textContent = (energySavedKwh / 1000).toFixed(1);
  if (document.getElementById('esg-safety')) document.getElementById('esg-safety').textContent = safetyDaysNoIncident;
  if (document.getElementById('esg-efficiency')) document.getElementById('esg-efficiency').textContent = operatorEfficiency;
  if (document.getElementById('esg-compliance')) document.getElementById('esg-compliance').textContent = complianceRate;

  return {
    co2Saved: co2Saved.toFixed(2),
    energySaved: (energySavedKwh / 1000).toFixed(1),
    safetyDays: safetyDaysNoIncident,
    efficiency: operatorEfficiency,
    compliance: complianceRate,
  };
}

function generateESGReport() {
  try {
    const timestamp = new Date();
    const metrics   = updateESGMetrics();
    const { jsPDF } = window.jspdf;
    if (!jsPDF) { showToastNotification('[!] Library PDF belum dimuat. Refresh halaman.'); return; }

    const doc  = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const PW   = doc.internal.pageSize.getWidth();   // 210
    const PH   = doc.internal.pageSize.getHeight();  // 297
    const ML   = 15, MR = 15;
    const TW   = PW - ML - MR;   // 180 mm lebar konten — TIDAK BOLEH DILANGGAR

    // ── Pre-kalkulasi finansial ─────────────────────────────
    const vampLoss = FACILITY.vampKw * 24 * 30 * TARIF_KWH_INDUSTRI;
    const pfPen    = FACILITY.pf < 0.85 ? (0.85 - FACILITY.pf) * 10 * ESTIMASI_FAKTOR_DENDA : 0;
    const savings  = (vampLoss * 0.8) + pfPen;
    const co2      = parseFloat(metrics.co2Saved);

    const COL = {
      heading:   [14, 42, 71],
      accent:    [0, 160, 130],
      danger:    [180, 40, 60],
      warn:      [190, 130, 0],
      ok:        [20, 130, 60],
      gray:      [110, 120, 130],
      lightGray: [225, 228, 232],
      darkBg:    [20, 32, 46],
    };

    let y       = 16;
    let pageNum = 1;

    // ── Helpers ─────────────────────────────────────────────
    const rgb    = (r,g,b)    => doc.setTextColor(r,g,b);
    const fill   = (r,g,b)    => doc.setFillColor(r,g,b);
    const drw    = (r,g,b)    => doc.setDrawColor(r,g,b);
    const bold   = ()         => doc.setFont(undefined,'bold');
    const normal = ()         => doc.setFont(undefined,'normal');
    const sz     = n          => doc.setFontSize(n);
    const lw     = n          => doc.setLineWidth(n);

    // Tulis teks yang sudah dipastikan muat dalam TW
    const txt = (str, x, yp, opts) => {
      const wrapped = doc.splitTextToSize(String(str), TW - (x - ML));
      doc.text(wrapped, x, yp, opts || {});
      return wrapped.length;
    };

    // Tulis paragraf dan kembalikan tinggi yang dipakai (mm)
    const para = (str, x, yp, maxW) => {
      const w = maxW || TW - (x - ML);
      const lines = doc.splitTextToSize(String(str), w);
      doc.text(lines, x, yp);
      return lines.length * (doc.getFontSize() * 0.352778 * 1.35);
    };

    // Header strip tiap halaman
    const drawHdr = () => {
      fill(...COL.darkBg); drw(...COL.darkBg); lw(0);
      doc.rect(0, 0, PW, 11, 'F');
      sz(6.5); normal(); rgb(170, 200, 190);
      doc.text('SEMS | SMART ENERGY MANAGEMENT SYSTEM', ML, 7);
      doc.text('PT AHM Plant 3 Cikarang | CONFIDENTIAL', PW - MR, 7, { align:'right' });
    };

    // Footer tiap halaman
    const drawFtr = () => {
      const fy = PH - 13;
      drw(...COL.lightGray); lw(0.2); doc.line(ML, fy - 2, PW - MR, fy - 2);
      sz(6.2); normal(); rgb(...COL.gray);
      doc.text('SEMS v2.5 | PT Astra Honda Motor | Plant 3 Cikarang', ML, fy);
      doc.text('Hal. ' + pageNum, PW - MR, fy, { align:'right' });
      const ts = 'Dibuat: ' + timestamp.toLocaleDateString('id-ID') + ' ' + timestamp.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) + ' WIB | CONFIDENTIAL';
      doc.text(ts, ML, fy + 4.5);
    };

    const newPage = () => {
      drawFtr();
      doc.addPage();
      pageNum++;
      y = 16;
      drawHdr();
    };

    // Cek apakah perlu page break
    const need = (h) => { if (y + h > PH - 18) newPage(); };

    // Section title bar (full-width, pasti tidak overflow)
    const sectionBar = (label) => {
      need(12);
      fill(...COL.heading); drw(...COL.heading); lw(0);
      doc.rect(ML, y, TW, 8, 'F');
      sz(11); bold(); rgb(255,255,255);
      doc.text(label, ML + 4, y + 5.5);
      y += 13;
    };

    // Sub-section header bar (berwarna lebih terang)
    const subBar = (label, fillC, textC) => {
      need(10);
      fill(...fillC); drw(...fillC); lw(0);
      doc.rect(ML, y, TW, 7, 'F');
      sz(9); bold(); rgb(...textC);
      doc.text(label, ML + 3, y + 4.8);
      y += 10;
    };

    // autoTable wrapper — memastikan margin kiri + kanan TERKUNCI ke ML/MR
    const tbl = (opts) => {
      doc.autoTable(Object.assign({
        margin:        { left: ML, right: MR, top: 14 },
        startY:        y,
        theme:         'grid',
        styles:        { fontSize: 8, cellPadding: 2.5, overflow: 'linebreak', font: 'helvetica' },
        headStyles:    { fillColor: COL.heading, textColor: [255,255,255], fontStyle:'bold', fontSize: 8.5 },
        alternateRowStyles: { fillColor: [247,249,252] },
        tableWidth:    TW,
      }, opts));
      y = doc.lastAutoTable.finalY + 6;
    };

    // ══════════════════════════════════════════════════════
    // HAL 1 — COVER
    // ══════════════════════════════════════════════════════
    drawHdr();

    // Band gelap cover
    fill(...COL.darkBg); doc.rect(0, 12, PW, 65, 'F');

    // Judul
    sz(26); bold(); rgb(0, 215, 185);
    doc.text('SEMS', ML, 34);
    sz(13); normal(); rgb(170, 215, 205);
    doc.text('Laporan Komprehensif Operasional', ML, 44);
    sz(8.5); rgb(110, 165, 155);
    doc.text('Smart Energy Management System - PT Astra Honda Motor, Plant 3 Cikarang', ML, 52);
    doc.text('IIoT Platform v2.5 | Edge Node P3-CKR-GW-01 | 62/64 Sensor Aktif', ML, 58);

    // Badge tanggal (kanan atas, TIDAK melebihi PW - MR)
    const bdgX = ML + TW - 48;
    fill(0, 140, 120); doc.rect(bdgX, 18, 48, 28, 'F');
    sz(7); bold(); rgb(255,255,255);
    doc.text('TANGGAL LAPORAN', bdgX + 24, 26, { align:'center' });
    sz(9.5);
    doc.text(timestamp.toLocaleDateString('id-ID',{day:'2-digit',month:'short',year:'numeric'}), bdgX + 24, 33.5, { align:'center' });
    sz(7.5); normal();
    doc.text(timestamp.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) + ' WIB', bdgX + 24, 40, { align:'center' });

    y = 84;

    // Box ringkasan eksekutif
    fill(238, 247, 243); drw(0, 150, 130); lw(0.4);
    doc.rect(ML, y, TW, 38, 'FD');
    sz(8.5); bold(); rgb(...COL.heading); doc.text('RINGKASAN EKSEKUTIF', ML + 4, y + 6.5);
    sz(8); normal(); rgb(40, 52, 62);
    const sumH = para(
      'SEMS Plant 3 Cikarang adalah platform manajemen energi berbasis IIoT yang mengoptimalkan konsumsi listrik secara real-time, mendeteksi vampire power pada peralatan idle, dan memperbaiki Power Factor otomatis via RPA Engine. Laporan ini menyajikan dampak finansial aktual, kinerja ESG, status mesin, tren 7 hari, dan rekomendasi prioritas.',
      ML + 4, y + 13, TW - 8
    );
    y += 43;

    // 4 KPI mini-card (lebar masing-masing = TW/4 - 2 gap)
    const cardW = (TW - 9) / 4;
    const kpiCards = [
      { label:'KONSUMSI AKTIF',  val: FACILITY.baseKw.toLocaleString('id-ID') + ' kW', col: COL.accent },
      { label:'VAMPIRE POWER',   val: FACILITY.vampKw + ' kW',                          col: COL.danger },
      { label:'POWER FACTOR',    val: FACILITY.pf.toFixed(2),                           col: FACILITY.pf >= 0.85 ? COL.ok : COL.danger },
      { label:'EIR HARI INI',    val: FACILITY.eir.toFixed(2) + ' kWh/unit',            col: COL.accent },
    ];
    kpiCards.forEach((k, i) => {
      const cx = ML + i * (cardW + 3);
      fill(244,249,247); drw(...k.col); lw(0.3); doc.rect(cx, y, cardW, 20, 'FD');
      fill(...k.col); doc.rect(cx, y, cardW, 3.5, 'F');
      sz(6.5); bold(); rgb(...COL.gray); doc.text(k.label, cx + cardW/2, y + 9, { align:'center' });
      sz(10); bold(); rgb(...k.col); doc.text(k.val, cx + cardW/2, y + 16.5, { align:'center' });
    });
    y += 25;

    // Tabel info fasilitas
    sz(8.5); bold(); rgb(...COL.heading); doc.text('INFORMASI FASILITAS', ML, y); y += 4;
    const facRows = [
      ['Nama Fasilitas',    'PT Astra Honda Motor - Plant 3 Cikarang'],
      ['Node / Gateway',    'P3-CKR-GW-01 (Edge Controller)'],
      ['Sensor Aktif',      '62 / 64  (97% uptime)'],
      ['Tarif Listrik PLN', 'I-4/TT - Rp ' + TARIF_KWH_INDUSTRI.toLocaleString('id-ID') + '/kWh  (berlaku 2024)'],
      ['Jam Operasi',       '16 jam/hari, 22 hari kerja/bulan'],
      ['Kapasitas Grid',    '8.9 MW (Trafo P3, PLN Grid)'],
      ['Protokol IIoT',     'Modbus TCP/RTU, MQTT v5.0, OPC-UA, TLS 1.3'],
      ['Status Platform',   'ONLINE | Latency < 30ms | SEMS v2.5'],
    ];
    tbl({
      body: facRows,
      startY: y,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: undefined,
      columnStyles: {
        0: { fontStyle:'bold', cellWidth: 42, textColor: COL.heading },
        1: { cellWidth: TW - 42 },
      },
      alternateRowStyles: { fillColor: [244,248,252] },
    });

    drawFtr();

    // ══════════════════════════════════════════════════════
    // HAL 2 — FINANCIAL IMPACT & ROI
    // ══════════════════════════════════════════════════════
    newPage();
    sectionBar('1.  FINANCIAL IMPACT & ROI ANALYSIS');

    sz(8); normal(); rgb(50,60,70);
    y += para('Analisis dampak finansial aktual: kerugian akibat vampire power, potensi denda PLN atas Power Factor rendah, dan proyeksi penghematan implementasi SEMS.', ML, y, TW) + 5;

    // Tabel finansial — total kolom = 65 + 52 + 63 = 180 = TW ✓
    tbl({
      head: [['Parameter', 'Nilai', 'Keterangan']],
      body: [
        ['Tarif Listrik Industri PLN I-4/TT', 'Rp ' + TARIF_KWH_INDUSTRI.toLocaleString('id-ID') + '/kWh', 'Berlaku efektif 2024'],
        ['Konsumsi Daya Aktif', FACILITY.baseKw.toLocaleString('id-ID') + ' kW', 'Real-time sensor Plant 3'],
        ['Vampire Power Terdeteksi', FACILITY.vampKw + ' kW', 'Mesin idle di luar sif produksi'],
        ['Kerugian Vampire (bulanan)', 'Rp ' + Math.round(vampLoss).toLocaleString('id-ID'), FACILITY.vampKw + ' kW x 24j x 30hr x tarif'],
        ['Power Factor Aktual', FACILITY.pf.toFixed(2), FACILITY.pf >= 0.85 ? 'Aman - di atas batas PLN (0.85)' : 'KRITIS - di bawah batas PLN (0.85)'],
        ['Potensi Denda kVARh (bulanan)', 'Rp ' + Math.round(pfPen).toLocaleString('id-ID'), pfPen > 0 ? 'PF perlu koreksi segera' : 'Tidak ada denda saat ini'],
        ['Proyeksi Penghematan / bulan', 'Rp ' + Math.round(savings).toLocaleString('id-ID'), 'Reduksi 80% vampire + eliminasi denda'],
        ['Proyeksi Penghematan / tahun', 'Rp ' + Math.round(savings * 12).toLocaleString('id-ID'), 'Asumsi kondisi operasional stabil'],
      ],
      columnStyles: {
        0: { fontStyle:'bold', cellWidth: 65 },
        1: { cellWidth: 45, halign:'right' },
        2: { cellWidth: 70 },
      },
      didParseCell: (d) => {
        if (d.section==='body' && d.column.index===1 && String(d.cell.raw).startsWith('Rp'))
          d.cell.styles.textColor = COL.ok;
        if (d.section==='body' && d.column.index===2 && String(d.cell.raw).includes('KRITIS'))
          d.cell.styles.textColor = COL.danger;
      },
    });

    // Bar chart komposisi — lebar terkontrol
    need(40);
    sz(8.5); bold(); rgb(...COL.heading); doc.text('Komposisi Kerugian vs. Proyeksi Penghematan', ML, y); y += 5;
    const bars = [
      { label:'Kerugian Vampire Power', val: vampLoss,  col: COL.danger },
      { label:'Potensi Denda kVARh',    val: pfPen,     col: COL.warn   },
      { label:'Proyeksi Penghematan',   val: savings,   col: COL.ok     },
    ];
    const labelW = 52, valW = 28, barMaxW = TW - labelW - valW - 4;
    const maxBarVal = Math.max(...bars.map(b => b.val), 1);
    bars.forEach(b => {
      need(10);
      sz(7.5); bold(); rgb(...COL.gray);
      doc.text(b.label, ML, y + 4);
      const bw = (b.val / maxBarVal) * barMaxW;
      fill(225,230,236); doc.rect(ML + labelW, y, barMaxW, 6, 'F');
      if (bw > 0) { fill(...b.col); doc.rect(ML + labelW, y, bw, 6, 'F'); }
      sz(7.5); normal(); rgb(...b.col);
      doc.text('Rp ' + Math.round(b.val/1e6).toLocaleString('id-ID') + ' jt', ML + labelW + barMaxW + 2, y + 4.5);
      y += 9;
    });
    y += 4;
    drawFtr();

    // ══════════════════════════════════════════════════════
    // HAL 3 — ESG METRICS
    // ══════════════════════════════════════════════════════
    newPage();
    sectionBar('2.  ENVIRONMENTAL, SOCIAL & GOVERNANCE (ESG)');

    // E — Environmental
    subBar('[E]  ENVIRONMENTAL (E) - Sustainability & Emissions', [225, 245, 235], [0, 90, 50]);
    sz(8); normal(); rgb(40,55,50);
    y += para('Implementasi SEMS berkontribusi pada reduksi emisi CO2 melalui efisiensi konsumsi energi dan eliminasi vampire power. Target: Net Zero Emisi 2026.', ML, y, TW) + 4;
    tbl({
      head: [['Indikator', 'Nilai Aktual', 'Target 2026', 'Status']],
      body: [
        ['CO2 Terhemat (bulan ini)',   metrics.co2Saved + ' ton',      '>= 2.5 ton/bln',  co2 >= 2.5 ? 'TERCAPAI' : 'PROGRES'],
        ['Energi Terhemat (bln ini)',  metrics.energySaved + ' MWh',   '>= 1.5 MWh/bln',  parseFloat(metrics.energySaved)>=1.5 ? 'TERCAPAI' : 'PROGRES'],
        ['Faktor Emisi Grid',          '0.82 kg CO2/kWh',             '(ESDM 2024)',   'Referensi'],
        ['Reduksi vs Baseline 2020',   '~14.2%',                       '40% reduksi',     'On Track'],
        ['Solar Panel (pipeline)',      '100 kW kapasitas',             'Q3 2026',         'Perencanaan'],
      ],
      headStyles: { fillColor:[0,110,70], textColor:[255,255,255], fontStyle:'bold', fontSize:8.5 },
      alternateRowStyles: { fillColor:[240,252,246] },
      columnStyles: {
        0: { cellWidth: 62 },
        1: { cellWidth: 38, halign:'right' },
        2: { cellWidth: 38, halign:'center' },
        3: { cellWidth: 42, halign:'center', fontStyle:'bold' },
      },
      didParseCell: (d) => {
        if (d.section==='body' && d.column.index===3) {
          const v = String(d.cell.raw);
          const isGreen = ['TERCAPAI','Referensi'].some(s => v.startsWith(s));
          const isAmber = ['PROGRES','On Track','Perencanaan','1 program'].some(s => v.startsWith(s));
          if (isGreen) d.cell.styles.textColor = COL.ok;
          else if (isAmber) d.cell.styles.textColor = COL.warn;
        }
      },
    });

    // S — Social
    need(12);
    subBar('[S]  SOCIAL (S) - Ketenagakerjaan, K3 & Transformasi Digital', [228,238,255], [0,55,155]);
    tbl({
      head: [['Indikator', 'Nilai Aktual', 'Target', 'Keterangan']],
      body: [
        ['Hari Tanpa Insiden K3',        metrics.safetyDays + ' hari',  '365+ hari/thn',   'Tracking sejak SEMS deployed'],
        ['Efisiensi Operator',            metrics.efficiency + '%',      '>= 90%',           'Tugas monitoring otomatis'],
        ['Operator Terlatih SEMS',        '6 orang',                    '6 orang',          'Target terpenuhi'],
        ['Program Pelatihan',             '240 jam/tahun',              '240 jam/thn',      'Sesuai target'],
        ['Digital Skill Avg Score',       '83%',                        '>= 80%',            'Di atas target'],
        ['Lost Time Injury Rate',         '0',                          '0',                'Zero Incident'],
        ['Sertifikasi Ditempuh',          '5 program',                  '6 program',        '1 program tersisa'],
      ],
      headStyles: { fillColor:[0,70,165], textColor:[255,255,255], fontStyle:'bold', fontSize:8.5 },
      alternateRowStyles: { fillColor:[240,243,255] },
      columnStyles: {
        0: { cellWidth: 62 },
        1: { cellWidth: 30, halign:'right' },
        2: { cellWidth: 30, halign:'center' },
        3: { cellWidth: 58 },
      },
      didParseCell: (d) => {
        if (d.section==='body' && d.column.index===3) {
          const v = String(d.cell.raw);
          const isGreen = ['TERCAPAI','Referensi'].some(s => v.startsWith(s));
          const isAmber = ['PROGRES','On Track','Perencanaan','1 program'].some(s => v.startsWith(s));
          if (isGreen) d.cell.styles.textColor = COL.ok;
          else if (isAmber) d.cell.styles.textColor = COL.warn;
        }
      },
    });

    // G — Governance
    need(12);
    subBar('[G]  GOVERNANCE (G) - Kepatuhan, Audit & Keamanan Data', [255,248,228], [130,80,0]);
    tbl({
      head: [['Indikator', 'Nilai Aktual', 'Standar / Regulasi', 'Status']],
      body: [
        ['Kepatuhan Tarif PLN I-4/TT',  metrics.compliance + '%',  'Permen ESDM 28/2016',   'COMPLIANT'],
        ['Monitoring Real-Time',         '24/7 Audit Trail',        'ISO 14001:2015',         'AKTIF'],
        ['Sertifikasi Lingkungan',       'ISO 14001',               'Standar Internasional',  'Tersertifikasi'],
        ['Keselamatan Kerja',            'ISO 45001',               'Standar Internasional',  'Tersertifikasi'],
        ['Enkripsi Data Sensor',         'TLS 1.3 + RBAC',         'NIST Cybersecurity',     'Compliant'],
        ['Autentikasi Sistem',           'Multi-role RBAC',         'Internal AHM Policy',    'Diterapkan'],
        ['Retensi Data Log',             '90 hari rolling',         'SLA Internal AHM',       'Sesuai'],
      ],
      headStyles: { fillColor:[145,90,0], textColor:[255,255,255], fontStyle:'bold', fontSize:8.5 },
      alternateRowStyles: { fillColor:[255,250,238] },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 38, halign:'center' },
        2: { cellWidth: 44 },
        3: { cellWidth: 38, halign:'center', fontStyle:'bold' },
      },
      didParseCell: (d) => {
        if (d.section==='body' && d.column.index===3) {
          const v = String(d.cell.raw);
          const isGreen = ['COMPLIANT','AKTIF','Tersertifik','Compliant','Diterapkan','Sesuai'].some(s => v.startsWith(s));
          if (isGreen) d.cell.styles.textColor = COL.ok;
        }
      },
    });
    drawFtr();

    // ══════════════════════════════════════════════════════
    // HAL 4 — STATUS MESIN & KPI
    // ══════════════════════════════════════════════════════
    newPage();
    sectionBar('3.  STATUS MESIN & KEY PERFORMANCE INDICATORS');

    sz(8.5); bold(); rgb(...COL.heading); doc.text('Status Mesin Real-Time - Plant 3 Cikarang', ML, y); y += 4;
    // Kolom: ID=12, Nama=56, Zona=20, Daya=20, Beban=14, Status=22, Catatan=36 → total=180=TW ✓
    tbl({
      head: [['ID', 'Nama Mesin', 'Zona', 'Daya', 'Beban', 'Status', 'Catatan']],
      body: MACHINES.map(m => {
        const pct  = Math.round(m.kw / m.max * 100);
        const stat = m.status==='prod' ? 'PRODUKSI' : m.status==='vamp' ? 'VAMPIRE' : 'IDLE';
        const note = m.status==='vamp' ? 'Vampire terdeteksi' : m.status==='idle' ? 'Beban idle >50kW' : 'Normal';
        const name = m.name.length > 32 ? m.name.substring(0,31)+'...' : m.name;
        return [m.id, name, m.zone, m.kw.toLocaleString('id-ID')+' kW', pct+'%', stat, note];
      }),
      styles: { fontSize: 7.5, cellPadding: 2.2 },
      headStyles: { fillColor:COL.heading, textColor:[255,255,255], fontStyle:'bold', fontSize:8 },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 56 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20, halign:'right' },
        4: { cellWidth: 14, halign:'center' },
        5: { cellWidth: 22, halign:'center', fontStyle:'bold' },
        6: { cellWidth: 36 },
      },
      didParseCell: (d) => {
        if (d.section==='body' && d.column.index===5) {
          const v = String(d.cell.raw);
          d.cell.styles.textColor = v==='VAMPIRE' ? COL.danger : v==='IDLE' ? COL.warn : COL.ok;
        }
      },
    });

    need(10);
    sz(8.5); bold(); rgb(...COL.heading); doc.text('Key Performance Indicators (KPI) - Periode Berjalan', ML, y); y += 4;
    // Kolom: Metrik=58, Aktual=28, Target=22, Status=20, Catatan=52 → total=180=TW ✓
    tbl({
      head: [['KPI Metrik', 'Aktual', 'Target', 'Status', 'Catatan']],
      body: [
        ['Power Factor',              FACILITY.pf.toFixed(2),              '> 0.85',      FACILITY.pf>=0.85?'PASS':'FAIL',    FACILITY.pf>=0.85?'Aman':'Aktifkan Capacitor Bank'],
        ['Vampire Power Loss',        FACILITY.vampKw+' kW',               '< 150 kW',    FACILITY.vampKw<150?'PASS':'FAIL',  FACILITY.vampKw>=150?'Butuh shutdown otomatis':'Normal'],
        ['Reduksi Konsumsi',          '14.2%',                             '>= 10%',       'PASS',                             'vs baseline sebelum SEMS'],
        ['CO2 Terhemat',              metrics.co2Saved+' ton',             '>= 2.5 ton',   co2>=2.5?'PASS':'PROGRES',          'Faktor emisi ESDM 0.82 kg/kWh'],
        ['Energi Terhemat',           metrics.energySaved+' MWh',          '>= 1.5 MWh',   parseFloat(metrics.energySaved)>=1.5?'PASS':'PROGRES', 'Eliminasi vampire power'],
        ['Efisiensi Operator',        metrics.efficiency+'%',              '>= 90%',       metrics.efficiency>=90?'PASS':'PROGRES', 'Monitoring otomatis SEMS'],
        ['Keselamatan Kerja',         metrics.safetyDays+' hari',          '365+ hari',   'ON TRACK',                         'Zero LTI target tahunan'],
        ['Kepatuhan Regulasi PLN',    metrics.compliance+'%',              '100%',        metrics.compliance>=100?'PASS':'FAIL', 'Tarif I-4/TT | PF monitor'],
        ['Uptime Sensor IIoT',        '62/64 (97%)',                       '>= 95%',       'PASS',                             '2 sensor maintenance'],
        ['Latency Edge Controller',   '< 30ms',                            '< 50ms',      'PASS',                             'Node P3-CKR-GW-01'],
      ],
      styles: { fontSize: 7.8, cellPadding: 2.5 },
      headStyles: { fillColor:COL.heading, textColor:[255,255,255], fontStyle:'bold', fontSize:8.5 },
      columnStyles: {
        0: { cellWidth: 50, fontStyle:'bold' },
        1: { cellWidth: 28, halign:'right'   },
        2: { cellWidth: 24, halign:'center'  },
        3: { cellWidth: 22, halign:'center', fontStyle:'bold' },
        4: { cellWidth: 56  },
      },
      didParseCell: (d) => {
        if (d.section==='body' && d.column.index===3) {
          const v = String(d.cell.raw);
          d.cell.styles.textColor = v==='PASS'?COL.ok : v==='FAIL'?COL.danger : COL.warn;
        }
      },
    });
    drawFtr();

    // ══════════════════════════════════════════════════════
    // HAL 5 — TREN 7 HARI, RPA & REKOMENDASI
    // ══════════════════════════════════════════════════════
    newPage();
    sectionBar('4.  TREN KONSUMSI 7 HARI & STATUS RPA AUTOMATION');

    sz(8.5); bold(); rgb(...COL.heading); doc.text('Tren Konsumsi Harian - Sebelum vs. Sesudah SEMS', ML, y); y += 4;
    // Kolom: Hari=16, Sebelum=30, Sesudah=30, Vampire=24, Reduksi=18, Hemat=62 → total=180=TW ✓
    const trendTotBefore = TREND_DATA.before.reduce((a,b)=>a+b,0);
    const trendTotAfter  = TREND_DATA.after.reduce((a,b)=>a+b,0);
    const trendTotVamp   = TREND_DATA.vamp.reduce((a,b)=>a+b,0);
    tbl({
      head: [['Hari', 'Sebelum (kWh)', 'Sesudah (kWh)', 'Vampire (kWh)', 'Reduksi', 'Hemat (Rp)']],
      body: TREND_DATA.days.map((day,i) => {
        const red = (((TREND_DATA.before[i]-TREND_DATA.after[i])/TREND_DATA.before[i])*100).toFixed(1);
        const sav = Math.round((TREND_DATA.before[i]-TREND_DATA.after[i])*TARIF_KWH_INDUSTRI);
        return [day, TREND_DATA.before[i].toLocaleString('id-ID'), TREND_DATA.after[i].toLocaleString('id-ID'),
                TREND_DATA.vamp[i].toLocaleString('id-ID'), red+'%', 'Rp '+sav.toLocaleString('id-ID')];
      }),
      foot: [['RATA-RATA',
        Math.round(trendTotBefore/7).toLocaleString('id-ID'),
        Math.round(trendTotAfter/7).toLocaleString('id-ID'),
        Math.round(trendTotVamp/7).toLocaleString('id-ID'),
        (((trendTotBefore-trendTotAfter)/trendTotBefore)*100).toFixed(1)+'%',
        'Rp '+Math.round((trendTotBefore-trendTotAfter)*TARIF_KWH_INDUSTRI).toLocaleString('id-ID'),
      ]],
      styles: { fontSize: 8, cellPadding: 2.8 },
      headStyles: { fillColor:COL.heading, textColor:[255,255,255], fontStyle:'bold', fontSize:8.5 },
      footStyles: { fillColor:COL.heading, textColor:[255,255,255], fontStyle:'bold', fontSize:8 },
      columnStyles: {
        0: { cellWidth: 16, fontStyle:'bold' },
        1: { cellWidth: 32, halign:'right'   },
        2: { cellWidth: 32, halign:'right'   },
        3: { cellWidth: 26, halign:'right'   },
        4: { cellWidth: 20, halign:'center', fontStyle:'bold' },
        5: { cellWidth: 54, halign:'right'   },
      },
      didParseCell: (d) => {
        if (d.section==='body') {
          if (d.column.index===3) d.cell.styles.textColor = COL.danger;
          if (d.column.index===4) d.cell.styles.textColor = COL.ok;
          if (d.column.index===5) d.cell.styles.textColor = COL.ok;
        }
      },
    });

    // RPA Status
    need(14);
    sz(8.5); bold(); rgb(...COL.heading); doc.text('Status RPA Automation Engine', ML, y); y += 4;
    const rpaRows = typeof RPA !== 'undefined' ? RPA.RULES.map(r => {
      const stat = r.enabled ? (r.status==='active'?'AKTIF':r.status==='running'?'EKSEKUSI':'STANDBY') : 'DISABLED';
      const action = r.action.length > 55 ? r.action.substring(0,53)+'...' : r.action;
      return [r.name.replace(/^[^\s]+\s/,''), r.condition, action, r.executions+'x', stat];
    }) : [['Data RPA tidak tersedia','--','--','--','--']];
    // Kolom: Rule=44, Kondisi=40, Tindakan=58, Eksk=16, Status=22 → total=180=TW ✓
    tbl({
      head: [['Rule', 'Kondisi Trigger', 'Tindakan Otomatis', 'Eksekusi', 'Status']],
      body: rpaRows,
      headStyles: { fillColor:[28,55,95], textColor:[255,255,255], fontStyle:'bold', fontSize:8.5 },
      columnStyles: {
        0: { cellWidth: 44 },
        1: { cellWidth: 40 },
        2: { cellWidth: 58 },
        3: { cellWidth: 16, halign:'center', fontStyle:'bold' },
        4: { cellWidth: 22, halign:'center', fontStyle:'bold' },
      },
      didParseCell: (d) => {
        if (d.section==='body' && d.column.index===4) {
          const v = String(d.cell.raw);
          d.cell.styles.textColor = v==='AKTIF'?COL.ok : v==='EKSEKUSI'?COL.accent : COL.gray;
        }
      },
    });

    // Rekomendasi
    need(14);
    sectionBar('5.  REKOMENDASI & RENCANA TINDAK LANJUT');
    const recs = [
      { p:'SEGERA (< 24 Jam)', col:COL.danger,
        t:'Aktifkan Capacitor Bank Step 3 pada Robotic Welding Line B (P3-05) untuk mencegah Power Factor turun di bawah 0.85. Estimasi penghindaran denda PLN: Rp '+Math.round(pfPen*0.5/1e6).toFixed(1)+' juta/bulan.' },
      { p:'1-2 Minggu', col:COL.warn,
        t:'Jadwalkan maintenance preventif mesin idle (P3-04) guna eliminasi vampire power '+FACILITY.vampKw+' kW. Potensi penghematan: Rp '+Math.round(vampLoss*0.8/1e6).toFixed(1)+' juta/bulan.' },
      { p:'1 Bulan', col:[0,120,190],
        t:'Ekspansi monitoring SEMS ke Die Casting Zone #2 (P3-02). Integrasi 4 sensor tambahan: optimasi beban meningkat 15%, akurasi EIR dari +/-8% ke +/-3%.' },
      { p:'Q3 2026', col:[90,140,45],
        t:'Implementasi solar panel 100 kW untuk offset CO2 dan mendukung Net Zero 2026. Estimasi ROI: 4.2 tahun. Pengajuan proposal ke management: Juli 2026.' },
      { p:'Q4 2026', col:COL.heading,
        t:'Replikasi SEMS ke Plant 1 & Plant 2. Target: seluruh Plant AHM Indonesia terhubung ke platform terpusat pada Q1 2027.' },
    ];
    recs.forEach((rec, i) => {
      const textLines = doc.splitTextToSize(rec.t, TW - 6);
      const blockH = 5 + textLines.length * (8 * 0.352778 * 1.4) + 4;
      need(blockH);
      fill(...rec.col); doc.rect(ML, y, 3, blockH - 2, 'F');
      sz(7.5); bold(); rgb(...rec.col);
      doc.text('PRIORITAS '+(i+1)+' - '+rec.p, ML+5, y+4.5);
      sz(8); normal(); rgb(40,50,62);
      doc.text(textLines, ML+5, y+9);
      y += blockH;
    });
    y += 2;
    drawFtr();

    // ══════════════════════════════════════════════════════
    // HAL 6 — LEMBAR PENGESAHAN
    // ══════════════════════════════════════════════════════
    newPage();
    sectionBar('6.  LEMBAR PENGESAHAN & PENUTUP');

    sz(8); normal(); rgb(40,52,62);
    y += para(
      'Laporan ini disusun otomatis oleh sistem SEMS v2.5 berdasarkan data sensor real-time dari Edge Controller P3-CKR-GW-01 pada '+
      timestamp.toLocaleString('id-ID',{weekday:'long',day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})+
      ' WIB. Data telah diverifikasi melalui enkripsi TLS 1.3 dan audit trail 24/7 sesuai ISO 14001 dan ISO 45001.',
      ML, y, TW
    ) + 8;

    // 3 blok tanda tangan — lebar masing-masing = (TW - 2*gap) / 3
    need(58);
    sz(8.5); bold(); rgb(...COL.heading); doc.text('Diketahui & Disetujui Oleh:', ML, y); y += 5;
    const sigW   = (TW - 10) / 3;
    const sigs   = [
      { title:'Energy Manager',    name:'Budi Santoso',          id:'AHM-KRW-4821', dept:'Manufacturing Engineering' },
      { title:'Plant Manager',     name:'___________________',   id:'AHM-P3-____',  dept:'Plant 3 Cikarang'          },
      { title:'VP Operations',     name:'___________________',   id:'AHM-HQ-____',  dept:'PT Astra Honda Motor'      },
    ];
    const sigBoxH = 54;
    sigs.forEach((s, i) => {
      const sx = ML + i * (sigW + 5);
      fill(246,249,252); drw(...COL.lightGray); lw(0.3);
      doc.rect(sx, y, sigW, sigBoxH, 'FD');
      fill(220,228,238); doc.rect(sx, y, sigW, 7, 'F');
      sz(7.5); bold(); rgb(...COL.heading);
      doc.text(s.title.toUpperCase(), sx + sigW/2, y+5, { align:'center', maxWidth: sigW - 4 });
      sz(7); normal(); rgb(...COL.gray);
      doc.text('Tanda Tangan & Cap Basah:', sx+3, y+14);
      drw(...COL.lightGray); lw(0.2);
      doc.line(sx+3, y+32, sx+sigW-3, y+32);
      sz(8); bold(); rgb(28,38,54);
      doc.text(s.name, sx+sigW/2, y+36, { align:'center', maxWidth: sigW - 4 });
      sz(6.5); normal(); rgb(...COL.gray);
      doc.text(s.id,   sx+sigW/2, y+40, { align:'center', maxWidth: sigW - 4 });
      doc.text(s.dept, sx+sigW/2, y+44, { align:'center', maxWidth: sigW - 4 });
    });
    y += sigBoxH + 6;

    // Metadata dokumen
    need(38);
    fill(244,247,252); drw(...COL.lightGray); lw(0.3);
    doc.rect(ML, y, TW, 36, 'FD');
    sz(8.5); bold(); rgb(...COL.heading); doc.text('Metadata Dokumen', ML+4, y+6); y += 9;
    const docNum = 'SEMS-P3CKR-'+timestamp.getFullYear()+String(timestamp.getMonth()+1).padStart(2,'0')+String(timestamp.getDate()).padStart(2,'0');
    const metaRows = [
      ['Judul',          'Laporan Komprehensif Operasional SEMS Plant 3 Cikarang'],
      ['No. Dokumen',    docNum],
      ['Tanggal',        timestamp.toLocaleString('id-ID')],
      ['Dibuat Oleh',    'SEMS Auto-Report Engine v2.5'],
      ['Klasifikasi',    'CONFIDENTIAL - Kalangan Internal AHM'],
      ['Versi Sistem',   'SEMS v2.5 | Node P3-CKR-GW-01 | TLS 1.3'],
    ];
    metaRows.forEach(([k, v]) => {
      sz(7.5); bold(); rgb(...COL.heading); doc.text(k+':', ML+4, y);
      normal(); rgb(40,52,62);
      doc.text(doc.splitTextToSize(v, TW-48), ML+48, y);
      y += 4.5;
    });

    y += 6;
    need(12);
    sz(6.8); normal(); rgb(...COL.gray);
    doc.text(
      doc.splitTextToSize(
        'Laporan ini bersifat rahasia, hanya untuk keperluan internal PT Astra Honda Motor. Dilarang menyebarluaskan tanpa izin tertulis Management Plant 3 Cikarang. Data dihasilkan otomatis oleh sistem SEMS berbasis IIoT real-time; akurasi sensor +/-1.2%. (c) PT Astra Honda Motor 2026.',
        TW
      ),
      ML, y
    );

    drawFtr();

    // Simpan PDF
    const fname = 'SEMS_Laporan_P3CKR_'+timestamp.getFullYear()+String(timestamp.getMonth()+1).padStart(2,'0')+String(timestamp.getDate()).padStart(2,'0')+'_'+String(timestamp.getHours()).padStart(2,'0')+String(timestamp.getMinutes()).padStart(2,'0')+'.pdf';
    doc.save(fname);
    showToastNotification('[OK] Laporan PDF dibuat: '+fname+' ('+pageNum+' halaman)');

  } catch (err) {
    console.error('PDF Generation Error:', err);
    showToastNotification('[ERR] Error: ' + err.message);
  }
}

function showToastNotification(message) {
  const toast = document.createElement('div');
  toast.style.cssText = 'position: fixed; bottom: 24px; left: 24px; z-index: 9999; background: rgba(48, 209, 88, 0.15); border: 1px solid #30D158; border-left: 3px solid #30D158; border-radius: 4px; padding: 12px 16px; font-family: Share Tech Mono, monospace; font-size: 11px; color: #30D158; box-shadow: 0 0 20px rgba(48, 209, 88, 0.15); animation: toast-in .3s cubic-bezier(.22, 1, .36, 1);';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(function() {
    toast.style.animation = 'toast-out .3s ease forwards';
    setTimeout(function() { toast.remove(); }, 300);
  }, 5000);
}

const MACHINES = [
  { id:'P3-01', name:'Die Casting #1 — Honda Cub Frame',    zone:'Die Cast',  kw:920,  max:1100, status:'prod' },
  { id:'P3-02', name:'Die Casting #2 — Crankcase Cover',    zone:'Die Cast',  kw:875,  max:1100, status:'prod' },
  { id:'P3-03', name:'CNC Machining Center — Cylinder Head', zone:'Machining', kw:148,  max:200,  status:'prod' },
  { id:'P3-04', name:'Robotic Welding Line A — Frame',      zone:'Welding',   kw:94,   max:240,  status:'idle' },
  { id:'P3-05', name:'Robotic Welding Line B — Sub Frame',  zone:'Welding',   kw:280,  max:320,  status:'vamp' },
  { id:'P3-06', name:'Final Assembly Conveyor — Line 1',    zone:'Assembly',  kw:185,  max:220,  status:'prod' },
  { id:'P3-07', name:'Final Assembly Conveyor — Line 2',    zone:'Assembly',  kw:172,  max:220,  status:'prod' },
  { id:'P3-08', name:'Kompresor Screw #1',                  zone:'Compress',  kw:210,  max:260,  status:'prod' },
  { id:'P3-09', name:'HVAC Zona Assembly Utama',            zone:'HVAC',      kw:168,  max:210,  status:'prod' },
  { id:'P3-10', name:'Heat Treatment Furnace — Crankshaft', zone:'Heat',      kw:390,  max:450,  status:'prod' },
];

const ALARMS = [
  { level:'high', icon:'⚡', title:'Vampire Power — Robotic Welding Line B', desc:'280 kW terdeteksi di luar jam produksi.', time:'03 mnt lalu', machine:'P3-05' },
  { level:'high', icon:'⏸', title:'Idle Berlebih — Robotic Welding Line A', desc:'Motor servo idle 52 menit, daya terbuang 94 kW.', time:'21 mnt lalu', machine:'P3-04' },
  { level:'med',  icon:'📉', title:'Power Factor Kompresor Screw #1 Menurun', desc:'PF = 0.81, periksa kapasitor bank Plant 3.', time:'1 jam lalu', machine:'P3-08' },
];

const DONUT_DATA = {
  labels: ['Die Casting','Assembly','HVAC','Kompresor','Pengelasan','Lainnya'],
  vals:   [38, 18, 14, 12, 10, 8],
  colors: ['#0A84FF','#00FFD4','#FF8C42','#D4537E','#FFB800','#4A7A6E'],
};

const TREND_DATA = {
  days:   ['Sel','Rab','Kam','Jum','Sab','Min','Sen'],
  before: [3450, 3520, 3410, 3580, 3210, 2680, 3490],
  after:  [2940, 2980, 2860, 3060, 2730, 2350, 2920],
  vamp:   [168,  142,  155,  194,  98,   62,   118],
};

/* Ekspor ke window agar api-config.js bisa membacanya di mode demo */
window.FACILITY   = FACILITY;
window.MACHINES   = MACHINES;
window.ALARMS     = ALARMS;
window.TREND_DATA = TREND_DATA;

/* ═══════════════════════════════════════════════════════════════
   INISIALISASI DATA ADAPTER — Real-Time Integration
   ═══════════════════════════════════════════════════════════════ */
function initDataAdapter() {
  if (typeof SEMSDataAdapter === 'undefined') {
    console.warn('[SEMS] api-config.js tidak dimuat, menggunakan data statis.');
    startLiveFlicker();
    return;
  }

  const adapter = new SEMSDataAdapter(SEMS_CONFIG);
  STATE.adapter = adapter;

  /* ── LISTENER: Data Fasilitas ─────────────────────────── */
  adapter.on('facility', (data) => {
    /* Update nilai live KPI */
    const kwEl   = document.getElementById('kv-kwh');
    const vEl    = document.getElementById('kv-vamp');
    const eirEl  = document.getElementById('kv-eir');

    if (kwEl  && data.baseKw !== undefined) kwEl.textContent  = Math.round(data.baseKw).toLocaleString('id-ID');
    if (vEl   && data.vampKw !== undefined) vEl.textContent   = Math.round(data.vampKw).toLocaleString('id-ID');
    if (eirEl && data.eir    !== undefined) eirEl.textContent = data.eir.toFixed(2);

    /* Update Power Factor gauge */
    if (data.pf !== undefined) {
      updatePFGauge(data.pf);
      const pfTag = document.getElementById('pf-tag');
      if (pfTag) pfTag.textContent = data.pf >= 0.85 ? 'Baik' : data.pf >= 0.80 ? 'Perhatikan' : 'Kritis';
    }

    /* Update hemat bulan ini */
    if (data.saving !== undefined && data.saving !== null) {
      const svEl = document.getElementById('kv-saving');
      if (svEl) svEl.textContent = data.saving.toFixed(2);
    } else if (data.baseKw !== undefined) {
      const auto = data.baseKw * 0.148 * TARIF_KWH_INDUSTRI * 720 / 1e9;
      const svEl = document.getElementById('kv-saving');
      if (svEl) animateNumber(svEl, parseFloat(svEl.textContent) || 0, auto, 800, v => v.toFixed(2));
    }

    /* Sync ke global untuk komponen lain */
    if (data.baseKw !== undefined) FACILITY.baseKw = data.baseKw;
    if (data.vampKw !== undefined) FACILITY.vampKw = data.vampKw;
    if (data.eir    !== undefined) FACILITY.eir    = data.eir;
    if (data.pf     !== undefined) FACILITY.pf     = data.pf;
  });

  /* ── LISTENER: Status Mesin ───────────────────────────── */
  adapter.on('machines', (machineList) => {
    /* Merge ke array MACHINES (update existing, tambah baru) */
    machineList.forEach(newM => {
      const idx = MACHINES.findIndex(m => m.id === newM.id);
      if (idx >= 0) Object.assign(MACHINES[idx], newM);
      else MACHINES.push(newM);
    });

    renderMachines();
    updateProdCount();

    /* Update jumlah mesin idle di KPI */
    const idleCount = MACHINES.filter(m => m.status === 'idle').length;
    const idleEl = document.getElementById('kv-idle');
    const totalIdle = MACHINES.filter(m => m.status === 'idle').reduce((s, m) => s + (m.kw || 0), 0);
    if (idleEl) idleEl.textContent = totalIdle.toLocaleString('id-ID');
  });

  /* ── LISTENER: Alarm Aktif — feed ke ALARM_ENGINE ──────── */
  adapter.on('alarms', (alarmList) => {
    ALARMS.length = 0;
    alarmList.forEach((a, i) => {
      ALARMS.push({
        ...a,
        uid: a.uid || `adapter-${a.machine || i}-${a.level}`,
        _ts: a._ts  || new Date(Date.now() - i * 60000),
      });
    });
    ALARM_ENGINE.detectFromMachines();
  });

  /* ── LISTENER: Tren 7 Hari ────────────────────────────── */
  adapter.on('trend', (trend) => {
    const chart = STATE.charts.trend;
    if (!chart) return;
    chart.data.labels           = trend.days;
    chart.data.datasets[0].data = trend.before;
    chart.data.datasets[1].data = trend.after;
    if (chart.data.datasets[2]) chart.data.datasets[2].data = trend.vamp;
    chart.update('active');
  });

  /* ── LISTENER: Distribusi Energi (Donut) ─────────────── */
  adapter.on('donut', (donut) => {
    const chart = STATE.charts.donut;
    if (!chart) return;
    chart.data.labels                     = donut.labels;
    chart.data.datasets[0].data           = donut.vals;
    if (donut.colors) chart.data.datasets[0].backgroundColor = donut.colors;
    chart.update('active');
  });

  /* ── LISTENER: Heatmap Vampire Power ─────────────────── */
  adapter.on('heatmap', (intensities) => {
    renderHeatmap(intensities);
  });

  /* ── LISTENER: EIR per Lini ───────────────────────────── */
  adapter.on('eir', (lines) => {
    renderEIR(lines);
  });

  /* ── LISTENER: Latency ────────────────────────────────── */
  adapter.on('latency', (ms) => {
    const el = document.getElementById('latency');
    if (el) el.textContent = ms + 'ms';
  });

  /* ── LISTENER: Status Koneksi ─────────────────────────── */
  adapter.on('connection', ({ state, msg }) => {
    const dot  = document.querySelector('.beacon-dot');
    const text = document.querySelector('.beacon-text');
    const modeTag = document.getElementById('conn-mode-tag');

    if (modeTag) {
      modeTag.textContent = SEMS_CONFIG.MODE.toUpperCase();
      modeTag.className   = 'conn-mode-tag mode-' + state;
    }

    if (state === 'online' || state === 'demo') {
      if (dot)  dot.style.background = state === 'demo' ? '#FFB800' : '#00FFD4';
      if (text) {
        const label = state === 'demo' ? 'DEMO MODE' : 'LIVE';
        text.textContent = `${label} · PLANT 3 CKR · 62/64 SENSOR`;
      }
    } else if (state === 'error' || state === 'reconnecting') {
      if (dot)  dot.style.background = '#FF2D55';
      if (text) text.textContent     = 'RECONNECTING...';
    }

    console.info(`[SEMS Connection] ${state.toUpperCase()}: ${msg}`);
  });

  adapter.start();
}

function updateProdCount() {
  const el = document.getElementById('prod-count');
  if (el) {
    const count = MACHINES.filter(m => m.status === 'prod').length;
    el.textContent = count + ' produksi';
  }
}

/* ═══════════════════════════════════════════════════════════════
   FUNGSI-FUNGSI UI (TIDAK BERUBAH DARI VERSI ORIGINAL)
   ═══════════════════════════════════════════════════════════════ */

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
  if (!ring || !dot) return;

  let mx = 0, my = 0;   // exact mouse position (dot follows this)
  let rx = 0, ry = 0;   // lagged position (glow orb follows this)

  /* Dot tracks exactly — no lag, precise for clicking */
  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  /* Hover state — enlarge glow orb, shrink dot to show "ready" */
  const HOVER_SEL = 'button, a, .nav-item, .ftab, .alarm-item, ' +
                    '.machine-table tbody tr, .hm-cell, .kpi, ' +
                    'input, select, [onclick], label';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(HOVER_SEL)) {
      ring.classList.add('hovering');
      dot.classList.add('hovering');
    }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(HOVER_SEL)) {
      ring.classList.remove('hovering');
      dot.classList.remove('hovering');
    }
  });

  /* Hide when leaving window */
  document.addEventListener('mouseleave', () => { ring.style.opacity = '0'; dot.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { ring.style.opacity = ''; dot.style.opacity = ''; });

  /* Smooth lag loop for glow orb — feels like it floats */
  function animateRing() {
    rx += (mx - rx) * 0.10;
    ry += (my - ry) * 0.10;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animateRing);
  }
  animateRing();
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD ENTRY ANIMATOR
   Called once after all content is rendered. Sets --dash-delay
   CSS variable on each animated element so CSS can stagger them.
   ═══════════════════════════════════════════════════════════════ */
function triggerDashEnter() {
  const app = document.getElementById('app');
  if (!app) return;

  /* Base delays (seconds) — tweak these to taste */
  const TOPBAR_DELAY   = 0.0;
  const SIDEBAR_DELAY  = 0.08;
  const KPI_BASE       = 0.22;   // first KPI card
  const KPI_STEP       = 0.07;   // each subsequent card
  const PANEL_BASE     = 0.52;   // first panel after KPIs
  const PANEL_STEP     = 0.10;   // each subsequent panel

  /* Tag topbar & sidebar */
  const topbar  = document.getElementById('topbar');
  const sidebar = document.getElementById('sidebar');
  if (topbar)  { topbar.dataset.dashI  = '0'; topbar.style.setProperty('--dash-delay',  TOPBAR_DELAY + 's'); }
  if (sidebar) { sidebar.dataset.dashI = '1'; sidebar.style.setProperty('--dash-delay', SIDEBAR_DELAY + 's'); }

  /* Tag every KPI card */
  document.querySelectorAll('.kpi').forEach((el, i) => {
    el.dataset.dashI = String(i + 2);
    el.style.setProperty('--dash-delay', (KPI_BASE + i * KPI_STEP) + 's');
  });

  /* Tag every .panel — in DOM order */
  document.querySelectorAll('#main .panel').forEach((el, i) => {
    el.dataset.dashI = String(i + 20);
    el.style.setProperty('--dash-delay', (PANEL_BASE + i * PANEL_STEP) + 's');
  });

  /* Activate — one rAF so the browser has painted initial hidden state */
  requestAnimationFrame(() => {
    app.classList.add('dash-enter');

    /* Remove class after all animations finish (~2.4s max) so hover/active
       states aren't blocked by lingering animation declarations */
    const totalMs = (PANEL_BASE + 6 * PANEL_STEP + 0.65) * 1000;
    setTimeout(() => {
      app.classList.remove('dash-enter');
      /* Clean up data attrs */
      app.querySelectorAll('[data-dash-i]').forEach(el => {
        delete el.dataset.dashI;
        el.style.removeProperty('--dash-delay');
      });
    }, totalMs);
  });
}

function initLoader(onDone) {
  /* Pastikan loader visible setelah login (defaultnya disembunyikan) */
  const loaderEl = document.getElementById('loader');
  if (loaderEl) { loaderEl.style.display = ''; loaderEl.style.opacity = '1'; }

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
  const totalSaved = f.baseKw * 0.148 * TARIF_KWH_INDUSTRI * 720 / 1e9;
  const kpis = [
    { id: 'kv-kwh',    from: f.baseKw + 180, to: f.baseKw, fmt: v => Math.round(v).toLocaleString('id-ID'), color: '--plasma', glow: '--plasma-glow', sub: 'kW saat ini',    delta: '↓ 14.2% vs baseline', deltaClass: 'delta-down-good' },
    { id: 'kv-vamp',   from: f.vampKw + 30,  to: f.vampKw, fmt: v => Math.round(v).toLocaleString('id-ID'), color: '--danger', glow: '--danger-glow',  sub: 'kW terbuang',    delta: `⚠ ${(f.vampKw/f.baseKw*100).toFixed(1)}% beban`, deltaClass: 'delta-up-bad' },
    { id: 'kv-idle',   from: 280, to: 266,   fmt: v => Math.round(v).toLocaleString('id-ID'), color: '--warn',   glow: 'rgba(255,184,0,0.3)', sub: 'kW idle/standby', delta: '↑ 2 mesin idle', deltaClass: 'delta-up-bad' },
    { id: 'kv-eir',    from: 2.50, to: f.eir, fmt: v => v.toFixed(2), color: '--plasma', glow: '--plasma-glow', sub: 'kWh / unit motor', delta: '↓ target tercapai', deltaClass: 'delta-down-good' },
    { id: 'kv-saving', from: 0, to: totalSaved, fmt: v => v.toFixed(2), color: '--plasma', glow: '--plasma-glow', sub: 'Miliar Rp hemat', delta: '✓ Target 15%', deltaClass: 'delta-up-good' },
  ];
  const grid = document.querySelector('.kpi-grid') || document.getElementById('section-overview');
  if(!grid) return;

  const labels = {
    'kv-kwh':    'Konsumsi Aktif',
    'kv-vamp':   'Vampire Power',
    'kv-idle':   'Beban Idle',
    'kv-eir':    'EIR Hari Ini',
    'kv-saving': 'Hemat Bulan Ini',
  };

  grid.innerHTML = kpis.map(k => `
    <div class="kpi" style="--kpi-color: var(${k.color}); --kpi-glow: ${k.glow};">
      <div class="kpi-label">${labels[k.id]}</div>
      <div class="kpi-value" id="${k.id}">—</div>
      <div class="kpi-sub">${k.sub}</div>
      <div class="kpi-delta ${k.deltaClass}">${k.delta}</div>
    </div>
  `).join('');

  kpis.forEach(k => {
    const el = document.getElementById(k.id);
    if(el) animateNumber(el, k.from, k.to, 1200, k.fmt);
  });
}

/**
 * Fallback flicker (dipakai jika api-config.js tidak tersedia)
 */
function startLiveFlicker() {
  const id = setInterval(() => {
    const kwEl  = document.getElementById('kv-kwh');
    const vEl   = document.getElementById('kv-vamp');
    const latEl = document.getElementById('latency');
    if(kwEl)  kwEl.textContent  = (FACILITY.baseKw + Math.round((Math.random()-0.5)*600)).toLocaleString('id-ID');
    if(vEl)   vEl.textContent   = (FACILITY.vampKw + Math.round((Math.random()-0.5)*80)).toLocaleString('id-ID');
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
    const anomaly = m.status === 'vamp' ? '<span style="color:#FF2D55;font-size:10px;">⚡ VAMPIRE</span>' :
                    m.status === 'idle' ? '<span style="color:#FFB800;font-size:10px;">⏸ IDLE</span>' : 'NORMAL';
    return `<tr>
      <td><div class="m-id">${m.id}</div><div class="m-name">${m.name}</div></td>
      <td><span class="m-zone-badge">${m.zone}</span></td>
      <td><span class="kw-num" style="color:${color};">${m.kw.toLocaleString('id-ID')}</span> kW</td>
      <td><div class="bar-wrap"><div class="bar-track"><div class="bar-fill" style="width:${pct}%;background:${color};"></div></div><span>${pct}%</span></div></td>
      <td><span class="status-pill">${m.status.toUpperCase()}</span></td>
      <td>${anomaly}</td>
    </tr>`;
  }).join('');
}

/* ═══════════════════════════════════════════════════════════════
   ALARM MONITORING ENGINE — Real-Time Detection & Display
   ═══════════════════════════════════════════════════════════════ */

const ALARM_ENGINE = {
  _active:    [],          // array alarm aktif saat ini
  _history:   [],          // log riwayat alarm (maks 50)
  _seenIds:   new Set(),   // ID unik alarm yang sudah ditampilkan toast-nya
  _pollId:    null,
  _listeners: [],

  /* ── ATURAN DETEKSI OTOMATIS DARI DATA MESIN ──────────────── */
  RULES: [
    {
      id:    m => `vamp-${m.id}`,
      match: m => m.status === 'vamp',
      level: 'high',
      icon:  '⚡',
      title: m => `Vampire Power — ${m.name}`,
      desc:  m => `${m.kw.toLocaleString('id-ID')} kW terdeteksi di luar sif produksi.`,
    },
    {
      id:    m => `idle-${m.id}`,
      match: m => m.status === 'idle' && m.kw > 50,
      level: 'high',
      icon:  '⏸',
      title: m => `Idle Berlebih — ${m.name}`,
      desc:  m => `Motor aktif namun tidak produksi. Daya terbuang: ${m.kw} kW.`,
    },
    {
      id:    m => `overload-${m.id}`,
      match: m => (m.kw / m.max) > 0.95,
      level: 'high',
      icon:  '🔴',
      title: m => `Overload — ${m.name}`,
      desc:  m => `Beban ${Math.round(m.kw/m.max*100)}% melebihi batas aman (>95%).`,
    },
    {
      id:    m => `highload-${m.id}`,
      match: m => (m.kw / m.max) > 0.85 && (m.kw / m.max) <= 0.95,
      level: 'med',
      icon:  '⚠',
      title: m => `Beban Tinggi — ${m.name}`,
      desc:  m => `Beban ${Math.round(m.kw/m.max*100)}%, mendekati batas kapasitas.`,
    },
  ],

  /* ── JALANKAN DETEKSI DARI KONDISI MESIN ─────────────────── */
  detectFromMachines() {
    const now       = new Date();
    const nowStr    = now.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    const detected  = [];

    MACHINES.forEach(m => {
      this.RULES.forEach(rule => {
        if (!rule.match(m)) return;
        const uid = rule.id(m);
        detected.push({
          uid,
          level:   rule.level,
          icon:    rule.icon,
          title:   rule.title(m),
          desc:    rule.desc(m),
          machine: m.id,
          zone:    m.zone,
          ts:      now,
          tsStr:   nowStr,
          // waktu relatif diperbarui tiap render
        });
      });
    });

    /* Gabungkan: alarm dari adapter (ALARMS) + yang terdeteksi otomatis */
    const adapterAlarms = ALARMS
      .filter(a => !a._auto)             // jangan duplikat alarm dari adapter
      .map((a, i) => ({
        uid:     a.uid || `adapter-${i}`,
        level:   a.level,
        icon:    a.icon  || '⚡',
        title:   a.title,
        desc:    a.desc  || '',
        machine: a.machine || null,
        zone:    null,
        ts:      a._ts   || new Date(Date.now() - (i + 1) * 60000),
        tsStr:   a.time  || '—',
      }));

    /* Tandai alarm baru untuk toast */
    const prev = new Set(this._active.map(a => a.uid));
    const combined = [...adapterAlarms, ...detected.map(d => ({ ...d, _auto: true }))];

    combined.forEach(a => {
      if (!prev.has(a.uid) && !this._seenIds.has(a.uid)) {
        this._seenIds.add(a.uid);
        this._pushHistory(a);
        if (a.level === 'high') this._showToast(a);
      }
    });

    /* Alarm yang sudah hilang → pindah ke histori */
    const newUids = new Set(combined.map(a => a.uid));
    this._active.filter(a => !newUids.has(a.uid)).forEach(a => {
      this._pushHistory({ ...a, _resolved: true });
    });

    this._active = combined;
    this._renderPanel();
    this._updateBadges();
  },

  /* ── RENDER PANEL ALARM ──────────────────────────────────── */
  _renderPanel() {
    const el = document.getElementById('alarm-list');
    if (!el) return;

    if (!this._active.length) {
      el.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:24px 16px;">
          <div style="font-size:24px;opacity:.5;">✅</div>
          <div style="font-family:var(--font-mono);font-size:11px;color:var(--text2);text-align:center;">
            Tidak ada alarm aktif
          </div>
          <div style="font-family:var(--font-mono);font-size:9px;color:var(--text3);">
            Diperbarui ${new Date().toLocaleTimeString('id-ID')}
          </div>
        </div>`;
      return;
    }

    /* Urutkan: high → med → info, lalu terbaru */
    const sorted = [...this._active].sort((a, b) => {
      const order = { high: 0, med: 1, info: 2 };
      return (order[a.level] ?? 3) - (order[b.level] ?? 3);
    });

    el.innerHTML = sorted.map(a => {
      const age     = this._relativeTime(a.ts);
      const dotClr  = a.level === 'high' ? '#FF2D55' : a.level === 'med' ? '#FFB800' : '#0A84FF';
      const dimBg   = a.level === 'high' ? 'rgba(255,45,85,0.07)' : a.level === 'med' ? 'rgba(255,184,0,0.07)' : 'rgba(10,132,255,0.07)';
      const borderClr = a.level === 'high' ? 'rgba(255,45,85,0.3)' : a.level === 'med' ? 'rgba(255,184,0,0.25)' : 'rgba(10,132,255,0.2)';

      return `
        <div class="alarm-item alarm-${a.level}" data-uid="${a.uid}"
             style="background:${dimBg};border-color:${borderClr};cursor:pointer;"
             onclick="ALARM_ENGINE._dismissAlarm('${a.uid}')">
          <div style="display:flex;align-items:flex-start;gap:8px;">
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0;margin-top:2px;">
              <span style="font-size:14px;">${a.icon}</span>
              <div style="width:6px;height:6px;border-radius:50%;background:${dotClr};
                          box-shadow:0 0 6px ${dotClr};
                          animation:${a.level==='high'?'alarm-breathe 1.4s ease-in-out infinite':'none'};"></div>
            </div>
            <div class="alarm-body" style="flex:1;min-width:0;">
              <div class="alarm-title" style="color:${dotClr};">${a.title}</div>
              <div class="alarm-desc">${a.desc}</div>
              <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
                ${a.zone ? `<span style="font-family:var(--font-mono);font-size:8px;color:var(--text3);background:rgba(0,255,212,0.06);border:1px solid rgba(0,255,212,0.1);border-radius:2px;padding:1px 5px;">${a.zone}</span>` : ''}
                <span class="alarm-time" data-ts="${a.ts?.getTime()}">${age}</span>
              </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text3);flex-shrink:0;opacity:.6;"
                 title="Klik untuk dismiss">✕</div>
          </div>
        </div>`;
    }).join('');
  },

  /* ── DISMISS SATU ALARM ──────────────────────────────────── */
  _dismissAlarm(uid) {
    const alarm = this._active.find(a => a.uid === uid);
    if (alarm) this._pushHistory({ ...alarm, _dismissed: true });
    this._active = this._active.filter(a => a.uid !== uid);
    this._renderPanel();
    this._updateBadges();
  },

  /* ── UPDATE SEMUA BADGE ──────────────────────────────────── */
  _updateBadges() {
    const total    = this._active.length;
    const critical = this._active.filter(a => a.level === 'high').length;

    const badge    = document.getElementById('alarm-badge');
    const topCount = document.getElementById('alarm-count');
    if (badge)    badge.textContent = critical > 0 ? critical + ' kritis' : total > 0 ? total + ' aktif' : 'clear';
    if (topCount) topCount.textContent = String(total);
    if (topCount) topCount.style.display = total > 0 ? 'flex' : 'none';

    /* Sync ke notif panel juga */
    const notifBody = document.querySelector('.notif-body');
    if (notifBody) {
      notifBody.innerHTML = this._active.length
        ? this._active.map(a => `
            <div style="padding:10px 0;border-bottom:1px solid rgba(0,255,212,0.07);">
              <div style="font-family:var(--font-mono);font-size:10px;color:${a.level==='high'?'#FF2D55':'#FFB800'};margin-bottom:3px;">${a.icon} ${a.title}</div>
              <div style="font-size:11px;color:#A8C8BE;">${a.desc}</div>
              <div style="font-size:9px;color:#243D35;margin-top:2px;">${this._relativeTime(a.ts)}</div>
            </div>`).join('')
        : '<div style="padding:16px;text-align:center;font-size:11px;color:#243D35;">Tidak ada alarm aktif</div>';
    }

    /* Live dot indicator di panel header */
    const dot = document.getElementById('alarm-live-dot');
    if (dot) {
      if (critical > 0) {
        dot.className = 'alarm-live-dot';           // merah, berdenyut
      } else if (total > 0) {
        dot.style.cssText = 'display:inline-block;width:7px;height:7px;border-radius:50%;background:#FFB800;box-shadow:0 0 6px #FFB800;animation:alarm-dot-pulse 1.8s ease-in-out infinite;margin-right:5px;vertical-align:middle;';
      } else {
        dot.className = 'alarm-live-dot clear';     // hijau, statis = aman
      }
    }

    /* Timestamp scan terakhir */
    const lastCheck = document.getElementById('alarm-last-check');
    if (lastCheck) {
      lastCheck.textContent = 'Scan: ' + new Date().toLocaleTimeString('id-ID');
    }
  },

  /* ── TOAST NOTIFIKASI SUDUT LAYAR ────────────────────────── */
  _showToast(alarm) {
    const container = document.getElementById('alarm-toast-container') || (() => {
      const c = document.createElement('div');
      c.id = 'alarm-toast-container';
      c.style.cssText = `
        position:fixed;bottom:24px;right:24px;z-index:9999;
        display:flex;flex-direction:column-reverse;gap:8px;
        pointer-events:none;max-width:320px;`;
      document.body.appendChild(c);
      return c;
    })();

    const toast = document.createElement('div');
    toast.style.cssText = `
      background:#030A10;border:1px solid rgba(255,45,85,0.5);
      border-left:3px solid #FF2D55;border-radius:4px;
      padding:10px 14px;pointer-events:all;cursor:pointer;
      box-shadow:0 0 20px rgba(255,45,85,0.2);
      animation:toast-in .3s cubic-bezier(.22,1,.36,1);
      font-family:var(--font-mono,'Share Tech Mono',monospace);`;

    toast.innerHTML = `
      <div style="font-size:10px;color:#FF2D55;font-weight:600;letter-spacing:.06em;margin-bottom:4px;">
        🔴 ALARM KRITIS
      </div>
      <div style="font-size:11px;color:#F0FAF7;margin-bottom:2px;">${alarm.icon} ${alarm.title}</div>
      <div style="font-size:10px;color:#A8C8BE;">${alarm.desc}</div>`;

    toast.onclick = () => toast.remove();
    container.appendChild(toast);

    /* Auto-hapus setelah 6 detik */
    setTimeout(() => {
      toast.style.animation = 'toast-out .3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }, 6000);

    /* Sinyal audio subtle (beep via Web Audio API) */
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [880, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = 'square';
        gain.gain.setValueAtTime(0.04, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.1);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.12);
      });
    } catch(_) {}
  },

  /* ── LOG HISTORI ─────────────────────────────────────────── */
  _pushHistory(alarm) {
    this._history.unshift({ ...alarm, _historyTs: new Date() });
    if (this._history.length > 50) this._history.pop();
  },

  /* ── WAKTU RELATIF ───────────────────────────────────────── */
  _relativeTime(ts) {
    if (!ts) return '—';
    const diff = Date.now() - new Date(ts).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 10)  return 'baru saja';
    if (s < 60)  return s + ' dtk lalu';
    const m = Math.floor(s / 60);
    if (m < 60)  return m + ' mnt lalu';
    return Math.floor(m / 60) + ' jam lalu';
  },

  /* ── UPDATE TIMESTAMP RELATIF DI DOM TANPA RE-RENDER ─────── */
  _tickTimestamps() {
    document.querySelectorAll('.alarm-time[data-ts]').forEach(el => {
      const ts = parseInt(el.dataset.ts);
      if (ts) el.textContent = this._relativeTime(new Date(ts));
    });
  },

  /* ── MULAI ENGINE ────────────────────────────────────────── */
  start(intervalMs = 4000) {
    this.detectFromMachines();   // deteksi awal langsung

    /* Polling utama: re-deteksi dari kondisi mesin terkini */
    this._pollId = setInterval(() => {
      this.detectFromMachines();
    }, intervalMs);

    /* Tick timestamp setiap detik (tanpa re-render penuh) */
    setInterval(() => this._tickTimestamps(), 1000);

    /* Inject CSS animasi toast jika belum ada */
    if (!document.getElementById('alarm-engine-style')) {
      const style = document.createElement('style');
      style.id = 'alarm-engine-style';
      style.textContent = `
        @keyframes toast-in  { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        @keyframes toast-out { from { opacity:1; transform:translateX(0); }   to { opacity:0; transform:translateX(20px); } }
      `;
      document.head.appendChild(style);
    }

    console.info('[SEMS AlarmEngine] Berjalan, interval:', intervalMs + 'ms');
  },

  stop() {
    if (this._pollId) { clearInterval(this._pollId); this._pollId = null; }
  },
};

/* Ekspor ke window agar bisa diakses dari devtools */
window.ALARM_ENGINE = ALARM_ENGINE;

function renderAlarms() {
  /* Dituangkan ke engine — fungsi ini tetap ada untuk kompatibilitas */
  ALARM_ENGINE.detectFromMachines();
}

function renderEIR(lines) {
  const el = document.getElementById('eir-list'); if(!el) return;

  /* Jika data array dari adapter */
  if (Array.isArray(lines)) {
    el.innerHTML = lines.map(l => {
      const pct = Math.min(100, (l.eir / (l.max || 4.0)) * 100);
      const color = l.color || (pct < 60 ? '#00FFD4' : pct < 80 ? '#FFB800' : '#FF2D55');
      return `<div class="eir-row">
        <span class="eir-label">${l.label}</span>
        <div class="eir-track"><div class="eir-fill" style="width:${pct}%;background:${color};"></div></div>
        <span class="eir-val">${l.eir.toFixed(2)}</span>
      </div>`;
    }).join('');
    return;
  }

  /* Fallback statis */
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
  const color = pf >= 0.85 ? '#00FFD4' : pf >= 0.80 ? '#FFB800' : '#FF2D55';
  el.setAttribute('viewBox','0 0 130 130'); el.setAttribute('width','130'); el.setAttribute('height','130');
  el.innerHTML = `<circle cx="65" cy="65" r="50" fill="none" stroke="rgba(0,255,212,0.1)" stroke-width="8"/>
    <circle cx="65" cy="65" r="50" fill="none" stroke="${color}" stroke-width="8" stroke-dasharray="200" stroke-dashoffset="${200-(pf*200)}"/>
    <text x="65" y="70" text-anchor="middle" font-family="Share Tech Mono" font-size="20" fill="${color}">${pf.toFixed(2)}</text>`;
}

window.navClick = function(el, targetId) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  if (targetId) {
    const target = document.getElementById(targetId);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  if (window.innerWidth <= 680) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('mobile-overlay').classList.remove('active');
  }
};

function initSimulator() {
  const slR = document.getElementById('sl-reduction'), slB = document.getElementById('sl-base'), res = document.getElementById('sim-results');
  if(!slR||!slB||!res) return;
  const calc = () => {
    const pct = parseInt(slR.value), base = parseInt(slB.value);
    const sv = document.getElementById('sv-reduction'), sb = document.getElementById('sv-base');
    if(sv) sv.textContent = pct+'%'; if(sb) sb.textContent = base;
    res.innerHTML = `<div class="sim-row"><span>Energi Diselamatkan:</span><span>${((base*1e6)*pct/100/1e6).toFixed(1)}M kWh/bln</span></div><div class="sim-row hl"><span>Est. Penghematan:</span><span>Rp ${((base*1e6*pct/100)*TARIF_KWH_INDUSTRI/1e9).toFixed(2)} M</span></div>`;
    updateFinancialROI(FACILITY.pf, FACILITY.vampKw);
  };
  slR.addEventListener('input', calc); slB.addEventListener('input', calc); calc();
}

/**
 * Render heatmap — menerima array 24 intensitas (0-1) atau data statis
 * @param {number[]|null} intensities
 */
function renderHeatmap(intensities) {
  const wrap = document.getElementById('heatmap-cells'); if(!wrap) return;

  if (Array.isArray(intensities) && intensities.length > 0) {
    const max = Math.max(...intensities) || 1;
    wrap.innerHTML = intensities.map((v, i) => {
      const norm = v / max;
      const bg = `rgba(255,45,85,${(norm * 0.9 + 0.1).toFixed(2)})`;
      return `<div class="hm-cell" style="background:${bg}" title="Jam ${String(i).padStart(2,'0')}:00 — ${v.toFixed(1)} kW"></div>`;
    }).join('');
    return;
  }

  /* Fallback statis */
  wrap.innerHTML = Array.from({length:24}, (_,i) =>
    `<div class="hm-cell" style="background:rgba(255,45,85,${i<6||i>20?0.8:0.2})"></div>`
  ).join('');
}

function buildCharts() {
  Chart.defaults.font.family = "'Share Tech Mono', monospace";
  Chart.defaults.color = '#4A7A6E';
  const tEl = document.getElementById('trend-chart'), dEl = document.getElementById('donut-chart');
  if(tEl) {
    STATE.charts.trend = new Chart(tEl, {
      type: 'line',
      data: {
        labels: TREND_DATA.days,
        datasets: [
          { label:'Sebelum', data: TREND_DATA.before, borderColor:'rgba(74,122,110,0.4)', borderWidth:1.5, fill:false },
          { label:'Sesudah', data: TREND_DATA.after,  borderColor:'#00FFD4', borderWidth:2.5, fill:true, backgroundColor:'rgba(0,255,212,0.02)' },
          { label:'Vampire', data: TREND_DATA.vamp,   borderColor:'#FF2D55', borderWidth:1.5, fill:false, borderDash:[4,4] },
        ],
      },
      options: { responsive:true, maintainAspectRatio:false, scales:{ y:{ ticks:{ callback: v => (v/1000)+'K' } } }, plugins:{ legend:{ display:false } } },
    });
  }
  if(dEl) {
    STATE.charts.donut = new Chart(dEl, {
      type: 'doughnut',
      data: { labels: DONUT_DATA.labels, datasets:[{ data: DONUT_DATA.vals, backgroundColor: DONUT_DATA.colors }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false } } },
    });
  }
}

function initMobileMenu() {
  const btn = document.getElementById('menu-toggle'), side = document.getElementById('sidebar'), ov = document.getElementById('mobile-overlay');
  if(!btn||!side||!ov) return;
  btn.addEventListener('click', () => { side.classList.toggle('open'); ov.classList.toggle('active'); });
  ov.addEventListener('click', () => { side.classList.remove('open'); ov.classList.remove('active'); });
}

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

/* ── POWER FLOW CANVAS ──────────────────────────────────────── */
function initFlowCanvas() {
  const canvas = document.getElementById('flow-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let animId;
  function resize() { canvas.width = canvas.offsetWidth; canvas.height = 450; }
  const NODES = [
    { label:'PLN Grid',    x:0.06, y:0.20, color:'#FFB800', val:'8.9 MW',  pulse: 0 },
    { label:'Trafo P3',    x:0.22, y:0.20, color:'#00FFD4', val:'8.7 MW',  pulse: 1 },
    { label:'Panel MDP',   x:0.38, y:0.20, color:'#00FFD4', val:'8.7 MW',  pulse: 2 },
    { label:'HVAC P3',     x:0.22, y:0.80, color:'#00FFD4', val:'1.2 MW',  pulse: 3 },
    { label:'Lighting',    x:0.38, y:0.80, color:'#30D158', val:'0.4 MW',  pulse: 4 },
    { label:'Prod Utama',  x:0.58, y:0.50, color:'#0A84FF', val:'4.8 MW',  pulse: 5 },
    { label:'Die Cast',    x:0.86, y:0.10, color:'#0A84FF', val:'1.8 MW',  pulse: 6 },
    { label:'Welding',     x:0.86, y:0.30, color:'#FF2D55', val:'0.4 MW',  pulse: 7 },
    { label:'Assembly',    x:0.86, y:0.50, color:'#FFB800', val:'0.9 MW',  pulse: 8 },
    { label:'Machining',   x:0.86, y:0.70, color:'#0A84FF', val:'0.5 MW',  pulse: 9 },
    { label:'Heat Treat',  x:0.86, y:0.90, color:'#00FFD4', val:'1.2 MW',  pulse: 10 },
  ];
  const EDGES = [[0,1],[1,2],[2,3],[2,4],[2,5],[5,6],[5,7],[5,8],[5,9],[5,10]];
  const packets = [];
  function spawnPacket(edgeIdx) {
    const e=EDGES[edgeIdx]; const a=NODES[e[0]], b=NODES[e[1]];
    packets.push({ ax:a.x,ay:a.y,bx:b.x,by:b.y,t:0,speed:0.004+Math.random()*0.004,color:b.color,len:0.07+Math.random()*0.05 });
  }
  let frameCount=0;
  function draw() {
    if(canvas.width!==canvas.offsetWidth) resize();
    const W=canvas.width,H=canvas.height;
    ctx.clearRect(0,0,W,H); frameCount++;
    if(frameCount%10===0) { EDGES.forEach((_,i) => { if(Math.random()>0.25) spawnPacket(i); }); }
    EDGES.forEach(e => {
      const a=NODES[e[0]],b=NODES[e[1]];
      ctx.save(); ctx.strokeStyle='rgba(0,255,212,0.04)'; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(a.x*W,a.y*H); ctx.lineTo(b.x*W,b.y*H); ctx.stroke();
      ctx.strokeStyle='rgba(0,255,212,0.2)'; ctx.lineWidth=2; ctx.setLineDash([6,10]); ctx.lineDashOffset=-frameCount*0.5;
      ctx.beginPath(); ctx.moveTo(a.x*W,a.y*H); ctx.lineTo(b.x*W,b.y*H); ctx.stroke(); ctx.restore();
    });
    for(let i=packets.length-1;i>=0;i--) {
      const p=packets[i]; p.t+=p.speed; if(p.t>=1){packets.splice(i,1);continue;}
      const px=(p.ax+(p.bx-p.ax)*p.t)*W,py=(p.ay+(p.by-p.ay)*p.t)*H;
      const tailT=Math.max(0,p.t-p.len),tx=(p.ax+(p.bx-p.ax)*tailT)*W,ty=(p.ay+(p.by-p.ay)*tailT)*H;
      ctx.save(); const grad=ctx.createLinearGradient(tx,ty,px,py); grad.addColorStop(0,'rgba(0,0,0,0)'); grad.addColorStop(1,p.color);
      ctx.strokeStyle=grad; ctx.lineWidth=4; ctx.lineCap='round'; ctx.shadowColor=p.color; ctx.shadowBlur=8;
      ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(px,py); ctx.stroke();
      ctx.fillStyle='#FFFFFF'; ctx.shadowColor=p.color; ctx.shadowBlur=15;
      ctx.beginPath(); ctx.arc(px,py,3,0,Math.PI*2); ctx.fill(); ctx.restore();
    }
    NODES.forEach(n => {
      const nx=n.x*W,ny=n.y*H; n.pulse+=0.035; const pSize=Math.sin(n.pulse)*2;
      ctx.save(); ctx.shadowColor=n.color; ctx.shadowBlur=15; ctx.fillStyle=n.color; ctx.globalAlpha=0.15;
      ctx.beginPath(); ctx.arc(nx,ny,14+pSize,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1.0; ctx.fillStyle='#030A10'; ctx.beginPath(); ctx.arc(nx,ny,7,0,Math.PI*2); ctx.fill();
      ctx.lineWidth=1.5; ctx.strokeStyle=n.color; ctx.stroke();
      ctx.fillStyle=n.color; ctx.beginPath(); ctx.arc(nx,ny,3,0,Math.PI*2); ctx.fill(); ctx.restore();
      ctx.fillStyle='#A8C8BE'; ctx.font='12px Share Tech Mono, monospace'; ctx.textAlign='center'; ctx.fillText(n.label,nx,ny+24);
      ctx.fillStyle=n.color; ctx.font='bold 12px Share Tech Mono, monospace'; ctx.fillText(n.val,nx,ny+38);
    });
    animId=requestAnimationFrame(draw);
  }
  resize(); draw();
  window.addEventListener('resize',()=>{cancelAnimationFrame(animId);resize();animId=requestAnimationFrame(draw);});
}

/* ── DEMO MACHINE SIMULATION ────────────────────────────────── */
function startDemoMachineSimulation() {
  const scenarios = [
    /* Skenario normal — semua mesin produksi */
    () => {
      MACHINES.forEach(m => { m.status = 'prod'; m.kw = Math.round(m.max * (0.6 + Math.random()*0.25)); });
    },
    /* Skenario vampire — beberapa mesin standby drain power */
    () => {
      MACHINES[2].status = 'vamp'; MACHINES[2].kw = 290 + Math.round(Math.random()*60);
      MACHINES[6].status = 'vamp'; MACHINES[6].kw = 55  + Math.round(Math.random()*20);
    },
    /* Skenario idle berlebih */
    () => {
      MACHINES[3].status = 'idle'; MACHINES[3].kw = 88  + Math.round(Math.random()*30);
      MACHINES[1].status = 'idle'; MACHINES[1].kw = 105 + Math.round(Math.random()*40);
    },
    /* Skenario overload */
    () => {
      MACHINES[5].kw = Math.round(MACHINES[5].max * (0.96 + Math.random()*0.05));
      MACHINES[8].kw = Math.round(MACHINES[8].max * (0.93 + Math.random()*0.05));
    },
    /* Skenario campuran */
    () => {
      MACHINES[2].status = 'vamp'; MACHINES[2].kw = 312;
      MACHINES[3].status = 'idle'; MACHINES[3].kw = 88;
      MACHINES[5].kw = Math.round(MACHINES[5].max * 0.97);
    },
    /* Skenario aman — kembali normal */
    () => {
      MACHINES.forEach(m => {
        m.status = 'prod';
        m.kw = Math.round(m.max * (0.55 + Math.random()*0.3));
      });
    },
  ];

  let step = 0;
  /* Jalankan skenario pertama segera */
  scenarios[0]();
  renderMachines();

  setInterval(() => {
    step = (step + 1) % scenarios.length;
    scenarios[step]();
    renderMachines();
    updateProdCount();
    /* Update KPI idle secara sinkron */
    const totalIdle = MACHINES.filter(m => m.status === 'idle').reduce((s,m) => s+(m.kw||0), 0);
    const idleEl = document.getElementById('kv-idle');
    if (idleEl) idleEl.textContent = totalIdle.toLocaleString('id-ID');
    /* Engine akan mendeteksi perubahan di tick berikutnya */
  }, 8000); /* Ganti skenario tiap 8 detik */
}

/* ── ENTRY POINT ────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  /* Cursor & partikel bg bisa jalan kapan saja, tidak butuh #app visible */
  initCursor();
  initParticleCanvas();
});

/* Dipanggil oleh auth.js setelah login berhasil & #app ditampilkan */
window.SEMS_INIT = (function () {
  let _called = false;
  return function () {
    if (_called) return;   // jangan inisialisasi dua kali
    _called = true;
    initLoader(() => {
      initClock();
      initMobileMenu();
      initNotifPanel();
      renderKPIs();
      renderMachines();
      renderEIR();
      renderSidebarEnergy();
      buildCharts();
      initSimulator();
      renderHeatmap();
      updatePFGauge(FACILITY.pf);
      updateESGMetrics();
      initFlowCanvas();
      updateProdCount();

      /* ← INISIALISASI DATA ADAPTER (Real-Time / Demo) */
      initDataAdapter();

      /* ← MULAI ALARM ENGINE */
      ALARM_ENGINE.start(4000);

      /* ← SIMULASI DINAMIS PF/VAMP & FINANSIAL */
      enhanceSimulator();

      /* ← SIMULASI DEMO */
      startDemoMachineSimulation();

      /* ← ANIMASI MASUK DASHBOARD */
      triggerDashEnter();

      /* ← MODUL BARU: RPA, PEOPLE TRANSFORM, IIoT */
      setTimeout(() => {
        RPA.init();
        PEOPLE.init();
        initIIoTCanvas();
      }, 1800);
    });
  };
}());

/* ═══════════════════════════════════════════════════════════════
   RPA AUTOMATION ENGINE
   Auto-response: capacitor bank, shutdown idle, HVAC optimization
   ═══════════════════════════════════════════════════════════════ */
const RPA = {
  _enabled: true,
  _execCount: 0,
  _logs: [],

  RULES: [
    {
      id: 'auto-capacitor',
      name: '⚡ Auto Capacitor Bank',
      condition: 'Power Factor < 0.85',
      action: 'Aktifkan Capacitor Bank Step 3 secara otomatis untuk koreksi PF',
      check: () => FACILITY.pf < 0.85,
      execute(ctx) {
        FACILITY.pf = Math.min(0.92, FACILITY.pf + 0.06);
        updatePFGauge(FACILITY.pf);
        const pfTag = document.getElementById('pf-tag');
        if (pfTag) pfTag.textContent = 'Diperbaiki';
        return 'Capacitor Bank Step 3 diaktifkan — PF diperbaiki ke ' + FACILITY.pf.toFixed(2);
      },
      executions: 0,
      status: 'idle',
      enabled: true,
    },
    {
      id: 'auto-shutdown-idle',
      name: '🔌 Auto Shutdown Idle',
      condition: 'Mesin idle > 50 kW di luar jam produksi',
      action: 'Kirim sinyal shutdown ke mesin idle via Modbus TCP untuk eliminasi vampire power',
      check: () => MACHINES.some(m => m.status === 'idle' && m.kw > 50),
      execute(ctx) {
        let count = 0;
        MACHINES.forEach(m => {
          if (m.status === 'idle' && m.kw > 50) {
            m.kw = Math.round(m.kw * 0.12);
            m.status = 'prod';
            count++;
          }
        });
        renderMachines();
        return count + ' mesin idle dimatikan via Modbus TCP — estimasi hemat ' + (count * 80) + ' kW';
      },
      executions: 0,
      status: 'idle',
      enabled: true,
    },
    {
      id: 'auto-hvac',
      name: '❄ HVAC Load Optimizer',
      condition: 'Konsumsi HVAC > 15% total beban',
      action: 'Sesuaikan setpoint HVAC secara bertahap berdasarkan occupancy sensor & cuaca',
      check: () => (FACILITY.baseKw > 0 && (1200 / FACILITY.baseKw) > 0.12),
      execute(ctx) {
        FACILITY.baseKw = Math.round(FACILITY.baseKw * 0.96);
        const el = document.getElementById('kv-kwh');
        if (el) el.textContent = FACILITY.baseKw.toLocaleString('id-ID');
        return 'HVAC setpoint disesuaikan — beban total turun ke ' + FACILITY.baseKw.toLocaleString('id-ID') + ' kW';
      },
      executions: 0,
      status: 'idle',
      enabled: true,
    },
    {
      id: 'auto-vampire-alert',
      name: '👁 Vampire Power Suppressor',
      condition: 'Vampire Power > 300 kW',
      action: 'Kirim notifikasi kritis + trigger pembatasan daya otomatis ke panel MDP',
      check: () => FACILITY.vampKw > 300,
      execute(ctx) {
        const saved = FACILITY.vampKw - 180;
        FACILITY.vampKw = 180;
        const el = document.getElementById('kv-vamp');
        if (el) el.textContent = FACILITY.vampKw.toLocaleString('id-ID');
        return 'Pembatasan daya MDP diaktifkan — Vampire Power turun ' + saved + ' kW';
      },
      executions: 0,
      status: 'idle',
      enabled: true,
    },
  ],

  init() {
    this._renderRules();
    setInterval(() => this._runCycle(), 6000);
  },

  _runCycle() {
    if (!this._enabled) return;
    this.RULES.forEach(rule => {
      if (!rule.enabled) return;
      if (rule.check()) {
        rule.status = 'running';
        this._updateRuleCard(rule);
        setTimeout(() => {
          const result = rule.execute(this);
          rule.executions++;
          rule.status = 'active';
          this._execCount++;
          this._addLog(rule.name, result, 'ok');
          this._updateRuleCard(rule);
          this._renderRules();
        }, 800 + Math.random() * 400);
      } else {
        rule.status = 'idle';
        this._updateRuleCard(rule);
      }
    });
  },

  _renderRules() {
    const grid = document.getElementById('rpa-rules-grid');
    if (!grid) return;
    grid.innerHTML = this.RULES.map(rule => `
      <div class="rpa-rule-card ${rule.status === 'running' ? 'triggered' : rule.status === 'active' ? 'active' : rule.status === 'idle' && !rule.enabled ? '' : ''}" id="rpa-card-${rule.id}">
        <div class="rpa-rule-header">
          <span class="rpa-rule-name">${rule.name}</span>
          <label class="rpa-toggle">
            <input type="checkbox" ${rule.enabled ? 'checked' : ''} onchange="RPA.toggleRule('${rule.id}', this.checked)">
            <span class="rpa-toggle-track"></span>
          </label>
        </div>
        <div class="rpa-rule-condition">IF: ${rule.condition}</div>
        <div class="rpa-rule-action">THEN: ${rule.action}</div>
        <div class="rpa-rule-footer">
          <span>Eksekusi: <span class="rpa-exec-count">${rule.executions}×</span></span>
          <span class="rpa-status-pill ${rule.status}">${rule.status === 'running' ? '⚙ EKSEKUSI' : rule.status === 'active' ? '✓ AKTIF' : '— STANDBY'}</span>
        </div>
      </div>
    `).join('');
    const countEl = document.getElementById('rpa-log-count');
    if (countEl) countEl.textContent = this._execCount + ' eksekusi';
  },

  _updateRuleCard(rule) {
    const card = document.getElementById('rpa-card-' + rule.id);
    if (!card) return;
    card.className = 'rpa-rule-card ' + (rule.status === 'running' ? 'triggered' : rule.status === 'active' ? 'active' : '');
    const pill = card.querySelector('.rpa-status-pill');
    if (pill) {
      pill.className = 'rpa-status-pill ' + rule.status;
      pill.textContent = rule.status === 'running' ? '⚙ EKSEKUSI' : rule.status === 'active' ? '✓ AKTIF' : '— STANDBY';
    }
    const cnt = card.querySelector('.rpa-exec-count');
    if (cnt) cnt.textContent = rule.executions + '×';
  },

  _addLog(ruleName, message, type) {
    const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this._logs.unshift({ time: now, name: ruleName, msg: message, type });
    if (this._logs.length > 30) this._logs.pop();
    this._renderLog();
  },

  _renderLog() {
    const el = document.getElementById('rpa-log');
    if (!el) return;
    if (!this._logs.length) {
      el.innerHTML = '<div style="padding:12px;text-align:center;font-size:10px;color:var(--text3);">Menunggu kondisi trigger...</div>';
      return;
    }
    el.innerHTML = this._logs.map(l => `
      <div class="rpa-log-entry">
        <span class="rpa-log-time">${l.time}</span>
        <span class="rpa-log-msg">${l.name} — ${l.msg}</span>
        <span class="rpa-log-result ${l.type}">${l.type === 'ok' ? '✓ OK' : '⚠'}</span>
      </div>
    `).join('');
    const countEl = document.getElementById('rpa-log-count');
    if (countEl) countEl.textContent = this._execCount + ' eksekusi';
  },

  toggleRule(id, enabled) {
    const rule = this.RULES.find(r => r.id === id);
    if (rule) rule.enabled = enabled;
  },

  toggleAutomation() {
    this._enabled = !this._enabled;
    const btn = document.querySelector('.rpa-btn-warn');
    if (btn) btn.textContent = this._enabled ? '⏸ Pause Otomasi' : '▶ Resume Otomasi';
    const tag = document.getElementById('rpa-status-tag');
    if (tag) { tag.textContent = this._enabled ? 'AKTIF' : 'PAUSED'; tag.style.color = this._enabled ? '' : '#FFB800'; }
    this._addLog('System', 'Otomasi ' + (this._enabled ? 'diaktifkan' : 'dijeda') + ' oleh operator', 'ok');
  },

  manualTrigger(type) {
    const map = { capacitor: 'auto-capacitor', shutdown: 'auto-shutdown-idle', hvac: 'auto-hvac' };
    const rule = this.RULES.find(r => r.id === map[type]);
    if (!rule) return;
    rule.status = 'running';
    this._updateRuleCard(rule);
    setTimeout(() => {
      const result = rule.execute(this);
      rule.executions++;
      rule.status = 'active';
      this._execCount++;
      this._addLog('[MANUAL] ' + rule.name, result, 'ok');
      this._updateRuleCard(rule);
      this._renderRules();
      showToastNotification('🤖 ' + result);
    }, 600);
  },
};
window.RPA = RPA;

/* ═══════════════════════════════════════════════════════════════
   PEOPLE TRANSFORMATION MODULE
   ═══════════════════════════════════════════════════════════════ */
const PEOPLE = {
  OPERATORS: [
    { name: 'Budi Santoso',     role: 'Energy Engineer',     skills: { 'Dashboard IIoT': 92, 'Data Analytics': 85, 'MQTT Config': 78, 'Alarm Response': 95 }, level: 'expert' },
    { name: 'Siti Rahayu',      role: 'Process Technician',  skills: { 'Dashboard IIoT': 78, 'Data Analytics': 70, 'MQTT Config': 45, 'Alarm Response': 88 }, level: 'advanced' },
    { name: 'Ahmad Fauzi',      role: 'Maintenance Lead',    skills: { 'Dashboard IIoT': 65, 'Data Analytics': 55, 'MQTT Config': 60, 'Alarm Response': 80 }, level: 'inter' },
    { name: 'Dewi Anggraini',   role: 'Quality Supervisor',  skills: { 'Dashboard IIoT': 55, 'Data Analytics': 72, 'MQTT Config': 30, 'Alarm Response': 68 }, level: 'inter' },
    { name: 'Rizky Pratama',    role: 'Shift Operator A',    skills: { 'Dashboard IIoT': 45, 'Data Analytics': 40, 'MQTT Config': 25, 'Alarm Response': 60 }, level: 'basic' },
    { name: 'Ika Permatasari',  role: 'Shift Operator B',    skills: { 'Dashboard IIoT': 50, 'Data Analytics': 42, 'MQTT Config': 28, 'Alarm Response': 65 }, level: 'basic' },
  ],

  CERTS: [
    { icon: '🏆', name: 'IIoT Fundamentals', body: 'Cisco Networking Academy — 32 jam', pct: 100, holders: 6 },
    { icon: '⚡', name: 'Energy Mgmt ISO 50001', body: 'BSN Indonesia — 48 jam', pct: 83, holders: 5 },
    { icon: '🔒', name: 'MQTT & Edge Security', body: 'Siemens Digital Ind. — 24 jam', pct: 67, holders: 4 },
    { icon: '📊', name: 'Industrial Data Analytics', body: 'Coursera x Google — 40 jam', pct: 50, holders: 3 },
    { icon: '🤖', name: 'RPA & Process Automation', body: 'UiPath Academy — 36 jam', pct: 33, holders: 2 },
    { icon: '🌿', name: 'ESG Reporting & Net Zero', body: 'GRI Academy — 20 jam', pct: 17, holders: 1 },
  ],

  TIMELINE: [
    { phase: 'Fase 1 — Foundation', date: 'Jan–Feb 2026', desc: 'Instalasi SEMS dashboard, orientasi operator, pelatihan IIoT dasar untuk seluruh shift.', status: 'done' },
    { phase: 'Fase 2 — Integration', date: 'Mar–Apr 2026', desc: 'Integrasi sensor Modbus TCP ke 10 mesin utama, pelatihan alarm response & eskalasi.', status: 'done' },
    { phase: 'Fase 3 — Automation', date: 'Mei–Jun 2026', desc: 'Aktivasi RPA Engine, training skenario otomasi, sertifikasi ISO 50001 batch pertama.', status: 'current' },
    { phase: 'Fase 4 — Optimization', date: 'Jul–Sep 2026', desc: 'Ekspansi ke Die Casting Zone #2, optimasi prediktif berbasis ML, sertifikasi Data Analytics.', status: 'upcoming' },
    { phase: 'Fase 5 — Scale-Up', date: 'Okt–Des 2026', desc: 'Replikasi SEMS ke Plant 1 & Plant 2, dokumentasi best practice, zero-incident target tercapai.', status: 'upcoming' },
  ],

  init() {
    this._renderKPIs();
    this._renderSkillTable();
    this._renderTimeline();
    this._renderCerts();
  },

  _renderKPIs() {
    const el = document.getElementById('people-kpi-grid');
    if (!el) return;
    const data = [
      { val: '6', unit: 'Operator', label: 'Terlatih SEMS' },
      { val: '240', unit: 'Jam/Tahun', label: 'Program Training' },
      { val: '83%', unit: 'Rata-rata', label: 'Digital Skill Score' },
      { val: '5', unit: 'Sertifikat', label: 'Aktif Ditempuh' },
      { val: '487', unit: 'Hari', label: 'Tanpa Insiden' },
      { val: '92%', unit: 'Efisiensi', label: 'Produktivitas Operator' },
    ];
    el.innerHTML = data.map(d => `
      <div class="people-kpi">
        <span class="people-kpi-val">${d.val}</span>
        <span class="people-kpi-unit">${d.unit}</span>
        <div class="people-kpi-label">${d.label}</div>
      </div>
    `).join('');
  },

  _renderSkillTable() {
    const el = document.getElementById('people-skill-table');
    if (!el) return;
    const skillNames = ['Dashboard IIoT', 'Data Analytics', 'MQTT Config', 'Alarm Response'];
    const colorMap = { expert: '#FFB800', advanced: '#00FFD4', inter: '#0A84FF', basic: '#4A7A6E' };
    el.innerHTML = `<table>
      <thead><tr>
        <th>Nama</th><th>Jabatan</th>
        ${skillNames.map(s => `<th>${s}</th>`).join('')}
        <th>Level</th>
      </tr></thead>
      <tbody>
        ${this.OPERATORS.map(op => `
          <tr>
            <td style="font-weight:600;color:var(--text1);white-space:nowrap;">${op.name}</td>
            <td style="white-space:nowrap;">${op.role}</td>
            ${skillNames.map(s => {
              const pct = op.skills[s] || 0;
              const col = pct >= 80 ? '#00FFD4' : pct >= 60 ? '#0A84FF' : pct >= 40 ? '#FFB800' : '#FF2D55';
              return `<td><div class="skill-bar-wrap">
                <div class="skill-bar-track"><div class="skill-bar-fill" style="width:${pct}%;background:${col};"></div></div>
                <span style="font-family:var(--font-mono);font-size:9px;color:${col};min-width:24px;">${pct}%</span>
              </div></td>`;
            }).join('')}
            <td><span class="skill-level-badge level-${op.level}">${op.level}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>`;
  },

  _renderTimeline() {
    const el = document.getElementById('people-timeline');
    if (!el) return;
    el.innerHTML = `<div class="timeline-track">
      ${this.TIMELINE.map(t => `
        <div class="tl-item ${t.status}">
          <div class="tl-phase">${t.phase}</div>
          <div class="tl-date">${t.date}</div>
          <div class="tl-desc">${t.desc}</div>
          <span class="tl-badge ${t.status}">${t.status === 'done' ? '✓ Selesai' : t.status === 'current' ? '⚙ Berjalan' : '○ Akan Datang'}</span>
        </div>
      `).join('')}
    </div>`;
  },

  _renderCerts() {
    const el = document.getElementById('people-cert-grid');
    if (!el) return;
    el.innerHTML = this.CERTS.map(c => `
      <div class="cert-card">
        <div class="cert-icon">${c.icon}</div>
        <div>
          <div class="cert-name">${c.name}</div>
          <div class="cert-body">${c.body}<br>${c.holders}/6 operator tersertifikasi</div>
          <div class="cert-progress-row">
            <div class="cert-progress-track"><div class="cert-progress-fill" style="width:${c.pct}%;"></div></div>
            <span class="cert-pct">${c.pct}%</span>
          </div>
        </div>
      </div>
    `).join('');
  },
};
window.PEOPLE = PEOPLE;

/* ═══════════════════════════════════════════════════════════════
   IIoT ARCHITECTURE CANVAS
   4-layer IIoT: Field → Edge → Broker → Cloud/Dashboard
   ═══════════════════════════════════════════════════════════════ */
function initIIoTCanvas() {
  const canvas = document.getElementById('iiot-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let animId, frame = 0;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = 520;
  }

  const LAYERS = [
    { label: 'LAYER 1 — FIELD DEVICES', y: 0.13, color: '#FFB800', nodes: [
      { label: 'Die Cast\nSensor', sub: 'Modbus RTU' },
      { label: 'Welding\nSensor', sub: 'Modbus TCP' },
      { label: 'Kompresor\nSensor', sub: 'Modbus TCP' },
      { label: 'HVAC\nSensor', sub: 'Analog I/O' },
      { label: 'Energy\nMeter P3', sub: 'RS-485' },
    ]},
    { label: 'LAYER 2 — EDGE COMPUTING', y: 0.37, color: '#00FFD4', nodes: [
      { label: 'Edge\nController', sub: 'P3-CKR-GW-01' },
      { label: 'OPC-UA\nServer', sub: 'Kepware' },
      { label: 'Local\nBuffer DB', sub: 'InfluxDB' },
    ]},
    { label: 'LAYER 3 — MQTT BROKER', y: 0.60, color: '#0A84FF', nodes: [
      { label: 'MQTT\nBroker', sub: 'Mosquitto v5' },
      { label: 'Message\nRouter', sub: 'Topic Filter' },
    ]},
    { label: 'LAYER 4 — CLOUD & DASHBOARD', y: 0.84, color: '#D4537E', nodes: [
      { label: 'SEMS\nDashboard', sub: 'WebSocket' },
      { label: 'REST\nAPI', sub: 'HTTPS / TLS' },
      { label: 'ESG\nReporting', sub: 'PDF Export' },
      { label: 'RPA\nEngine', sub: 'Auto-Response' },
    ]},
  ];

  const packets = [];

  function getNodePositions(W, H) {
    const positions = [];
    LAYERS.forEach(layer => {
      const n = layer.nodes.length;
      const spacing = W / (n + 1);
      layer.nodes.forEach((node, i) => {
        positions.push({
          x: spacing * (i + 1),
          y: H * layer.y,
          color: layer.color,
          label: node.label,
          sub: node.sub,
          layer: LAYERS.indexOf(layer),
        });
      });
    });
    return positions;
  }

  function spawnPacket(positions, W, H) {
    // Pick random pair: from lower layer node to higher layer node
    const fromLayer = Math.floor(Math.random() * 3);
    const toLayer   = fromLayer + 1;
    const fromNodes = positions.filter(p => p.layer === fromLayer);
    const toNodes   = positions.filter(p => p.layer === toLayer);
    if (!fromNodes.length || !toNodes.length) return;
    const from = fromNodes[Math.floor(Math.random() * fromNodes.length)];
    const to   = toNodes[Math.floor(Math.random() * toNodes.length)];
    packets.push({ ax: from.x, ay: from.y, bx: to.x, by: to.y, t: 0, speed: 0.006 + Math.random() * 0.005, color: to.color, len: 0.08 });
  }

  function draw() {
    if (canvas.width !== canvas.offsetWidth) resize();
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    frame++;

    const positions = getNodePositions(W, H);

    // Draw layer background bands
    LAYERS.forEach(layer => {
      const py = H * layer.y;
      ctx.save();
      ctx.fillStyle = layer.color;
      ctx.globalAlpha = 0.03;
      ctx.fillRect(0, py - 36, W, 72);
      ctx.globalAlpha = 0.5;
      ctx.font = '9px Share Tech Mono, monospace';
      ctx.fillStyle = layer.color;
      ctx.textAlign = 'left';
      ctx.fillText(layer.label, 12, py - 24);
      ctx.restore();
    });

    // Draw connections between adjacent layers
    LAYERS.forEach((layer, li) => {
      if (li >= LAYERS.length - 1) return;
      const fromNodes = positions.filter(p => p.layer === li);
      const toNodes   = positions.filter(p => p.layer === li + 1);
      fromNodes.forEach(f => {
        toNodes.forEach(t => {
          ctx.save();
          ctx.strokeStyle = `rgba(${layer.color === '#FFB800' ? '255,184,0' : layer.color === '#00FFD4' ? '0,255,212' : layer.color === '#0A84FF' ? '10,132,255' : '212,83,126'},0.07)`;
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 8]);
          ctx.lineDashOffset = -frame * 0.3;
          ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(t.x, t.y); ctx.stroke();
          ctx.restore();
        });
      });
    });

    // Spawn packets
    if (frame % 18 === 0) spawnPacket(positions, W, H);

    // Draw packets
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.t += p.speed;
      if (p.t >= 1) { packets.splice(i, 1); continue; }
      const px = p.ax + (p.bx - p.ax) * p.t;
      const py = p.ay + (p.by - p.ay) * p.t;
      const tailT = Math.max(0, p.t - p.len);
      const tx = p.ax + (p.bx - p.ax) * tailT;
      const ty = p.ay + (p.by - p.ay) * tailT;
      ctx.save();
      const grad = ctx.createLinearGradient(tx, ty, px, py);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, p.color);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(px, py, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    // Draw nodes
    positions.forEach(n => {
      const pulse = Math.sin(frame * 0.04 + n.x) * 2;
      // Glow
      ctx.save();
      ctx.shadowColor = n.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = n.color;
      ctx.globalAlpha = 0.12;
      ctx.beginPath(); ctx.arc(n.x, n.y, 20 + pulse, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Node circle
      ctx.save();
      ctx.shadowColor = n.color; ctx.shadowBlur = 10;
      ctx.fillStyle = '#030A10';
      ctx.beginPath(); ctx.arc(n.x, n.y, 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = n.color; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = n.color;
      ctx.beginPath(); ctx.arc(n.x, n.y, 4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      // Labels
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#A8C8BE';
      ctx.font = '10px Share Tech Mono, monospace';
      const lines = n.label.split('\n');
      lines.forEach((line, li) => ctx.fillText(line, n.x, n.y + 24 + li * 13));
      ctx.fillStyle = n.color;
      ctx.font = '8px Share Tech Mono, monospace';
      ctx.globalAlpha = 0.7;
      ctx.fillText(n.sub, n.x, n.y + 24 + lines.length * 13);
      ctx.restore();
    });

    animId = requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener('resize', () => { cancelAnimationFrame(animId); resize(); animId = requestAnimationFrame(draw); });
}


