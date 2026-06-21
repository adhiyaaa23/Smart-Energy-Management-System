# ⚡ SEMS — Smart Energy Management System
### Plant 3 Cikarang · PT Astra Honda Motor (AHM)

**Submisi Astranauts 2026 — Product Track**
*Tema: "ACCELERATE 2026: From Pilot to Business Transformation, Boosting Efficiency and Unlocking New Value"*
*Business Challenge: PT Astra Honda Motor (AHM)*

> Dashboard monitoring & otomasi energi industri berbasis IIoT yang membantu AHM Plant 3 Cikarang mendeteksi pemborosan energi (*vampire power*), menjaga Power Factor, dan mengubah data sensor mesin menjadi keputusan operasional serta dampak finansial yang terukur — real-time, dalam satu layar.

---

## 📋 Daftar Isi

- [Ringkasan Proyek](#-ringkasan-proyek)
- [Problem Statement](#-problem-statement)
- [Solusi: SEMS](#-solusi-sems)
- [Keselarasan dengan Tema Astranauts 2026](#-keselarasan-dengan-tema-astranauts-2026)
- [Dampak Bisnis & Nilai yang Diberikan](#-dampak-bisnis--nilai-yang-diberikan)
- [Fitur Produk (MVP)](#-fitur-produk-mvp)
- [Status Kesiapan MVP](#-status-kesiapan-mvp)
- [Tech Stack](#-tech-stack)
- [Struktur Proyek](#-struktur-proyek)
- [Cara Menjalankan Demo](#-cara-menjalankan-demo)
- [Akun Demo](#-akun-demo)
- [Roadmap Implementasi — Pilot ke Business Transformation](#-roadmap-implementasi--pilot-ke-business-transformation)
- [Arsitektur Integrasi Data Real](#-arsitektur-integrasi-data-real)
- [Tim](#-tim)
- [Disclaimer](#-disclaimer)
- [Lisensi](#-lisensi)

---

## 🧭 Ringkasan Proyek

**SEMS (Smart Energy Management System)** adalah dashboard IIoT yang dikembangkan untuk menjawab *business challenge* dari **PT Astra Honda Motor (AHM)** pada ajang **Astranauts 2026 — Product Track**. SEMS mengonsolidasikan data konsumsi energi, status mesin produksi, dan kondisi kelistrikan pabrik (Power Factor, tarif PLN industri) ke dalam satu dashboard operasional — lengkap dengan mesin otomasi (RPA) yang dapat bertindak otomatis atas kondisi sensor tanpa menunggu intervensi manual operator.

Studi kasus pada submisi ini menggunakan **Plant 3 Cikarang** sebagai lokasi pilot.

---

## ❗ Problem Statement

Pabrik manufaktur skala besar seperti Plant 3 Cikarang menghadapi tiga tantangan energi yang berulang namun sulit dipantau secara manual:

1. **Vampire power** — mesin yang tetap menyala/standby di luar jam produksi tetap menarik daya signifikan, namun jarang terdeteksi karena tidak ada visibilitas real-time per mesin.
2. **Power Factor (PF) yang tidak terjaga** — PF di bawah ambang batas PLN (umumnya 0.85) berisiko menimbulkan **denda kVARh** pada tagihan listrik industri, namun koreksinya sering terlambat karena baru diketahui setelah tagihan terbit.
3. **Minimnya data untuk pengambilan keputusan & pelaporan keberlanjutan** — tim energi dan manajemen kesulitan menghubungkan data sensor mentah dengan dampak finansial (Rp) dan metrik ESG yang dibutuhkan untuk pelaporan korporat maupun keputusan investasi efisiensi energi.

Akibatnya, potensi penghematan biaya energi tidak tergali maksimal, dan transisi dari *monitoring manual* ke *automation-driven efficiency* berjalan lambat.

---

## 💡 Solusi: SEMS

SEMS menjawab ketiga masalah di atas melalui satu platform terintegrasi:

| Masalah | Modul SEMS yang Menjawab |
|---|---|
| Vampire power tidak terdeteksi | **Vampire Power Detector** — heatmap 24 jam + flag anomali per mesin |
| Koreksi PF terlambat | **RPA Automation Engine** — auto capacitor bank saat PF < 0.85, eksekusi otomatis tanpa menunggu operator |
| Data sensor ≠ keputusan bisnis | **Financial Impact & ROI Calculator** + **Comprehensive ESG Report** — mengonversi data kW menjadi Rupiah, CO₂, dan metrik kepatuhan secara otomatis |
| Adopsi SDM yang lambat | **People Transformation Panel** — roadmap pelatihan & sertifikasi operator agar adopsi sistem berkelanjutan, bukan hanya proyek IT |

---

## 🚀 Keselarasan dengan Tema Astranauts 2026

Tema tahun ini, **"ACCELERATE 2026: From Pilot to Business Transformation, Boosting Efficiency and Unlocking New Value"**, secara langsung tercermin dalam desain SEMS:

- **From Pilot...** → SEMS dibangun sebagai MVP yang siap di-*pilot*-kan di satu lini/zona Plant 3 Cikarang terlebih dahulu, dengan arsitektur data adapter yang sudah disiapkan untuk integrasi bertahap (lihat [Arsitektur Integrasi Data Real](#-arsitektur-integrasi-data-real)).
- **...to Business Transformation** → Modul **RPA Automation Engine** mengubah cara kerja dari pemantauan pasif menjadi tindakan korektif otomatis, dan modul **People Transformation** memastikan transformasi ini melekat pada SDM, bukan hanya pada perangkat lunak.
- **Boosting Efficiency** → Simulator ROI dan Vampire Power Detector secara langsung menyasar efisiensi biaya energi operasional.
- **Unlocking New Value** → Laporan ESG otomatis (Environmental, Social, Governance) membuka nilai tambah berupa kesiapan pelaporan keberlanjutan dan kepatuhan (ISO 14001, ISO 45001, ISO 50001) yang dapat dimanfaatkan AHM untuk pelaporan korporat maupun citra keberlanjutan ke publik/investor.

---

## 📈 Dampak Bisnis & Nilai yang Diberikan

Berdasarkan kalkulasi yang sudah terpasang pada modul Financial Impact (menggunakan tarif PLN Industri I-4/TT — Rp 1.444,70/kWh sebagai basis simulasi):

- **Estimasi kerugian vampire power bulanan** dihitung otomatis dari mesin idle berdaya tinggi di luar jam shift produksi.
- **Potensi denda kVARh** diproyeksikan otomatis ketika Power Factor turun di bawah ambang aman, memberi peringatan dini sebelum tagihan terbit.
- **Proyeksi penghematan operasional (ROI)** dapat disimulasikan secara interaktif (slider reduksi konsumsi & basis konsumsi), membantu tim energi AHM membangun *business case* investasi efisiensi tanpa perlu spreadsheet manual.
- **Kesiapan adopsi SDM** dipetakan melalui skill matrix & roadmap pelatihan, sehingga implementasi tidak berhenti di tahap teknologi.

> Catatan kejujuran data: pada tahap submisi ini seluruh angka berjalan dalam **mode simulasi/demo** sebagai pembuktian konsep dan validitas formula perhitungan. Traksi yang ditawarkan pada tahap Product Track adalah **kesiapan integrasi teknis** (lihat bagian Status Kesiapan MVP) — bukan klaim data produksi aktual dari sistem AHM.

---

## ⭐ Fitur Produk (MVP)

- **Autentikasi & Manajemen Akun** — login email korporat, role-based access (Energy Manager, Plant Supervisor, IIoT Engineer), panel pengaturan personal
- **Energy Overview** — KPI real-time: total daya, vampire power, EIR, Power Factor
- **Monitor Mesin Real-Time** — status 10 mesin produksi (Die Casting, CNC Machining, Welding, Assembly, Compressor, HVAC, Heat Treatment) lengkap zona, beban, dan flag anomali
- **Alarm & Notifikasi** — panel alarm aktif dengan tingkat keparahan dan riwayat pengecekan
- **Vampire Power Detector** — heatmap intensitas pemborosan energi 24 jam
- **Analitik Energi** — distribusi energi per zona, tren 7 hari (sebelum vs sesudah SEMS vs vampire power), EIR per lini produksi, gauge Power Factor
- **Simulator ROI** — slider interaktif reduksi konsumsi & basis konsumsi bulanan
- **Financial Impact & ROI Calculator** — estimasi kerugian vampire power, potensi denda kVARh, proyeksi penghematan
- **Comprehensive ESG Report** — kartu Environmental / Social / Governance + ekspor laporan ke **PDF** (jsPDF + AutoTable)
- **RPA Automation Engine** — 4 rule otomasi aktif (Auto Capacitor Bank, Auto Shutdown Idle, HVAC Load Optimizer, Vampire Power Suppressor) lengkap execution log & manual override
- **People Transformation** — KPI transformasi SDM, skill matrix, roadmap 5 fase, tracker sertifikasi
- **IIoT Architecture Blueprint** — visualisasi arsitektur 4-layer (Field Devices → Edge Computing → MQTT Broker → Cloud & Dashboard) dengan chip protokol (Modbus TCP/RTU, MQTT v5.0, WebSocket, REST API, OPC-UA, TLS 1.3, RBAC Auth)

---

## ✅ Status Kesiapan MVP

| Aspek | Status |
|---|---|
| UI/UX dashboard lengkap & responsif | ✅ Selesai |
| Logika perhitungan finansial (ROI, denda kVARh, vampire power loss) | ✅ Selesai & dapat dikonfigurasi sesuai tarif riil |
| Mesin otomasi (RPA) dengan kondisi & eksekusi nyata di sisi UI | ✅ Selesai (simulasi kondisi sensor) |
| Ekspor laporan PDF (ESG) | ✅ Selesai |
| Adapter integrasi data real (REST / WebSocket / MQTT / Modbus) | ✅ Kerangka kode siap, **menunggu kredensial/endpoint riil dari sisi pabrik** |
| Integrasi sensor & PLC fisik di lapangan | ⏳ Tahap pilot lanjutan (membutuhkan kerja sama infrastruktur dengan AHM) |
| Autentikasi backend production-grade (SSO/OAuth2) | ⏳ Roadmap pasca-pilot |

---

## 🛠 Tech Stack

| Layer | Teknologi |
|---|---|
| Markup & Style | HTML5, CSS3 (custom properties) — tanpa framework CSS |
| Logic | Vanilla JavaScript (ES6+) — ringan, tanpa build step, mudah di-deploy di infrastruktur internal mana pun |
| Charts | [Chart.js](https://www.chartjs.org/) v4.4.1 |
| Animasi | [GSAP](https://gsap.com/) v3.12.5 |
| Export PDF | [jsPDF](https://github.com/parallax/jsPDF) v2.5.1 + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) v3.5.31 |
| Data Layer | Adapter kustom: REST API, WebSocket, MQTT-over-WS, Modbus TCP gateway |

---

## 📂 Struktur Proyek

```
sems-cikarang/
├── index.html        # Markup utama: login screen, account panel, seluruh layout dashboard
├── style.css          # Seluruh styling — tema gelap, komponen, animasi, responsif
├── script.js           # Logika dashboard: data demo, charts, RPA engine, ESG, IIoT diagram, dll.
├── auth.js             # Modul autentikasi: login, sesi, akun demo, pengaturan, panel akun
├── api-config.js      # Lapisan konfigurasi & adapter data (demo/REST/WebSocket/MQTT/Modbus)
└── AHM.jpg             # Logo perusahaan yang ditampilkan di topbar
```

---

## ▶️ Cara Menjalankan Demo

Tidak ada proses build — cukup jalankan sebagai file statis.

**Opsi 1 — Buka langsung:**
```bash
git clone https://github.com/<username>/<repo-name>.git
cd <repo-name>
open index.html
```

**Opsi 2 — Local server (disarankan):**
```bash
python3 -m http.server 8080
# atau
npx http-server -p 8080
```
Buka `http://localhost:8080` di browser.

**Opsi 3 — GitHub Pages (untuk juri/reviewer Astranauts):**
1. Push repo ke GitHub
2. **Settings → Pages** → pilih branch `main`, folder root (`/`)
3. Demo tersedia di `https://<username>.github.io/<repo-name>/`

---

## 🔑 Akun Demo

| Email | Role | Akses |
|---|---|---|
| `budi.santoso@astra-honda.com` | Energy Manager | Penuh |
| `siti.rahayu@astra-honda.com` | Plant Supervisor | Overview, Machines, Alarms |
| `ahmad.fauzi@astra-honda.com` | IIoT Engineer | Penuh |

**Password untuk semua akun:** `Sems2026!`

> Validasi akun dilakukan di sisi klien khusus untuk keperluan demo Product Track. Pada tahap implementasi pasca-pilot, autentikasi akan dipindahkan ke backend production-grade (SSO korporat AHM, hashing password, rate limiting).

---

## 🗺 Roadmap Implementasi — Pilot ke Business Transformation

| Fase | Periode | Fokus | Status |
|---|---|---|---|
| 1 — Foundation | Jan–Feb 2026 | Instalasi dashboard, orientasi & pelatihan IIoT dasar | Selesai (simulasi) |
| 2 — Integration | Mar–Apr 2026 | Integrasi sensor Modbus TCP ke mesin utama | Selesai (simulasi) |
| 3 — Automation | Mei–Jun 2026 | Aktivasi RPA Engine, sertifikasi ISO 50001 | **Berjalan** |
| 4 — Optimization | Jul–Sep 2026 | Ekspansi zona, optimasi prediktif berbasis ML | Direncanakan |
| 5 — Scale-Up | Okt–Des 2026 | Replikasi ke Plant 1 & Plant 2, target zero-incident | Direncanakan |

Roadmap ini menggambarkan jalur adopsi yang diusulkan SEMS apabila lolos sebagai solusi pilot di lingkungan AHM, selaras dengan filosofi *"from pilot to business transformation"* dari tema Astranauts 2026.

---

## 🔌 Arsitektur Integrasi Data Real

Seluruh konfigurasi sumber data terpusat di **`api-config.js`**, didesain agar tim IT/OT AHM dapat menyambungkan data sensor riil tanpa mengubah tampilan dashboard:

```js
const SEMS_CONFIG = {
  MODE: 'demo', // 'demo' | 'rest' | 'websocket' | 'mqtt' | 'modbus'
  ...
};
```

| Mode | Kegunaan |
|---|---|
| `demo` | Data simulasi internal — default untuk presentasi/demo juri |
| `rest` | Polling HTTP berkala ke REST API / endpoint SCADA pabrik |
| `websocket` | Streaming data real-time via WebSocket |
| `mqtt` | MQTT over WebSocket (broker MQTT pabrik) |
| `modbus` | Modbus TCP via HTTP gateway (mis. Node-RED + `node-red-contrib-modbus`) |

Fungsi `MAPPING` (`mapFacility`, `mapMachines`, `mapAlarms`, `mapTrend`, `mapDonut`, `mapHeatmap`, `mapEIR`) memungkinkan struktur JSON dari sistem SCADA/PLC AHM yang berbeda format tetap dapat dipetakan ke SEMS tanpa menyentuh logika dashboard utama — mempercepat fase integrasi pilot.

---

## 👥 Tim

> *Lengkapi bagian ini sebelum submisi final.*

| Nama | Peran | Kontak |
|---|---|---|
| _Nama Anggota 1_ | _Peran (mis. Product Lead / Full-stack Dev)_ | _email/LinkedIn_ |
| _Nama Anggota 2_ | _Peran_ | _email/LinkedIn_ |
| _Nama Anggota 3_ | _Peran_ | _email/LinkedIn_ |

**Nama Tim:** _diisi_
**Track:** Product Track — Astranauts 2026
**Business Challenge:** PT Astra Honda Motor (AHM)

---

## ⚠️ Disclaimer

- Seluruh data numerik (konsumsi energi, status mesin, alarm, dsb.) dalam mode demo **disimulasikan** untuk keperluan pembuktian konsep (proof of concept) pada submisi Astranauts 2026 — bukan data operasional aktual dari sistem PT Astra Honda Motor.
- Logo dan referensi PT Astra Honda Motor digunakan dalam konteks **business challenge resmi Astranauts 2026** sebagai studi kasus, sesuai ketentuan kompetisi.
- Kredensial pada bagian [Akun Demo](#-akun-demo) hanya untuk tujuan demonstrasi kepada juri/reviewer — bukan pola autentikasi yang direkomendasikan untuk produksi.

---

## 📄 Lisensi

Proyek ini belum menyertakan lisensi resmi. Tambahkan file `LICENSE` (mis. MIT) jika diperlukan sesuai ketentuan hak kekayaan intelektual Astranauts 2026.

---

<p align="center">Disusun untuk <strong>Astranauts 2026 — Product Track</strong> · Business Challenge PT Astra Honda Motor (AHM)<br>⚡ Dari pilot menuju transformasi bisnis yang efisien dan berkelanjutan.</p>
