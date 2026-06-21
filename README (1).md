# ⚡ SEMS — Smart Energy Management System
### Plant 3 Cikarang · Industrial IIoT Dashboard

> Dashboard monitoring & otomasi energi industri berbasis web, dirancang dengan tema HUD/cyberpunk industrial — menampilkan konsumsi energi real-time, status mesin, deteksi *vampire power*, simulasi ROI, laporan ESG, automasi RPA, hingga visualisasi arsitektur IIoT 4-layer.

Proyek ini adalah **prototipe / konsep dashboard** (data simulasi) untuk studi kasus efisiensi energi pabrik manufaktur otomotif, menggunakan nama & konteks fiktif/ilustratif "Plant 3 Cikarang — Astra Honda Motor" sebagai contoh kasus penggunaan industri. Tidak berafiliasi dengan atau merepresentasikan sistem resmi PT Astra Honda Motor.

---

## 📋 Daftar Isi

- [Ringkasan](#-ringkasan)
- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Struktur Proyek](#-struktur-proyek)
- [Cara Menjalankan](#-cara-menjalankan)
- [Akun Demo](#-akun-demo)
- [Menghubungkan ke Data Real](#-menghubungkan-ke-data-real)
- [Kustomisasi](#-kustomisasi)
- [Roadmap](#-roadmap)
- [Disclaimer](#-disclaimer)
- [Lisensi](#-lisensi)

---

## 🧭 Ringkasan

SEMS adalah single-page dashboard (HTML/CSS/JS murni, tanpa build step) yang mensimulasikan sebuah sistem **Industrial IoT (IIoT)** untuk manajemen energi pabrik. Dashboard ini dibangun untuk menunjukkan bagaimana data sensor mesin, meter listrik, dan sistem SCADA/PLC dapat diagregasi menjadi satu panel kontrol yang informatif — lengkap dengan login berbasis email korporat, panel akun, notifikasi alarm real-time, dan kalkulator dampak finansial.

Semua data secara default berjalan dalam **mode demo** (disimulasikan di browser), namun arsitektur kode sudah disiapkan untuk terhubung ke REST API, WebSocket, MQTT, maupun Modbus TCP gateway sungguhan tanpa perlu mengubah tampilan.

---

## ✨ Fitur Utama

### 🔐 Autentikasi & Manajemen Akun
- Login dengan validasi domain email korporat (`@astra-honda.com`)
- Multi-akun demo dengan role & hak akses berbeda (Energy Manager, Plant Supervisor, IIoT Engineer)
- Panel akun (side drawer): info profil, sesi aktif, log aktivitas, dan pengaturan
- Pengaturan personal: interval refresh alarm, notifikasi suara, animasi partikel, zona pantau default, auto-logout
- Ganti akun & logout

### ⚡ Energy Overview (KPI Real-Time)
- Total konsumsi daya (kW), vampire power, EIR rata-rata, dan Power Factor
- Status koneksi data (DEMO / REST / WebSocket / MQTT / Modbus), latency, dan jumlah sensor aktif

### 🏭 Monitor Mesin Real-Time
- Tabel status 10 mesin produksi (Die Casting, CNC Machining, Robotic Welding, Assembly, Compressor, HVAC, Heat Treatment) lengkap dengan zona, daya (kW), beban, status (produksi/idle/vampire), dan flag anomali
- Highlight visual untuk mesin yang mengalami *vampire power* (menyala namun tidak produktif)

### 🚨 Alarm & Notifikasi
- Panel alarm aktif dengan tingkat keparahan (kritis/menengah)
- Beep & badge notifikasi real-time, panel alarm pop-up

### 👁 Vampire Power Detector
- **Heatmap 24 jam** intensitas energi terbuang per jam, untuk mengidentifikasi pola pemborosan di luar jam produksi

### 📊 Analitik Energi
- **Distribusi Energi per Zona** (donut chart)
- **Tren Konsumsi 7 Hari**: sebelum vs sesudah implementasi SEMS vs vampire power
- **EIR (Energy Intensity Ratio) per Lini Produksi** (kWh/unit)
- **Power Factor Gauge** dengan status kepatuhan PLN

### 💰 Simulator ROI & Dampak Finansial
- Slider interaktif untuk simulasi reduksi konsumsi & basis konsumsi bulanan
- Kalkulator estimasi kerugian vampire power, potensi denda kVARh (penalti Power Factor PLN), dan proyeksi penghematan operasional — berbasis tarif industri PLN I-4/TT

### 📋 Comprehensive ESG Report
- Kartu metrik **Environmental** (CO₂ terhemat, energi terhemat), **Social** (hari tanpa insiden, efisiensi operator), **Governance** (kepatuhan regulasi, audit trail)
- Tombol **Generate Report** untuk mengekspor laporan profesional ke **PDF** (via jsPDF + AutoTable)

### 🤖 RPA Automation Engine
- 4 rule otomasi berbasis kondisi sensor real-time:
  - **Auto Capacitor Bank** — koreksi otomatis saat Power Factor < 0.85
  - **Auto Shutdown Idle** — mematikan mesin idle berdaya tinggi via simulasi Modbus TCP
  - **HVAC Load Optimizer** — penyesuaian setpoint HVAC otomatis
  - **Vampire Power Suppressor** — pembatasan daya otomatis saat vampire power melebihi ambang batas
- Execution log real-time & tombol manual override per rule

### 👥 People Transformation
- KPI transformasi SDM digital (operator terlatih, jam pelatihan, skor digital skill, sertifikasi, hari tanpa insiden, efisiensi)
- Skill matrix kompetensi digital operator
- Roadmap/timeline implementasi 5 fase (Foundation → Integration → Automation → Optimization → Scale-Up)
- Tracker sertifikasi & pencapaian

### 🌐 IIoT Architecture Blueprint
- Visualisasi interaktif arsitektur 4-layer: **Field Devices → Edge Computing → MQTT Broker → Cloud & Dashboard**
- Chip protokol yang digunakan: Modbus TCP/RTU, MQTT v5.0, WebSocket, REST API, OPC-UA, TLS 1.3, RBAC Auth

### 🎨 Pengalaman Visual
- Tema HUD industrial gelap (dark cyberpunk) dengan efek scanline, grid overlay, vignette, glitch transition, dan kursor kustom
- Animasi partikel & transisi halus (GSAP)
- Sepenuhnya responsif (sidebar collapsible untuk mobile)

---

## 🛠 Tech Stack

| Layer | Teknologi |
|---|---|
| Markup & Style | HTML5, CSS3 (custom properties / CSS variables) — tanpa framework CSS |
| Logic | Vanilla JavaScript (ES6+, tanpa framework) |
| Charts | [Chart.js](https://www.chartjs.org/) v4.4.1 |
| Animasi | [GSAP](https://gsap.com/) v3.12.5 |
| Export PDF | [jsPDF](https://github.com/parallax/jsPDF) v2.5.1 + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable) v3.5.31 |
| Data Layer | Adapter kustom mendukung REST, WebSocket, MQTT-over-WS, dan Modbus TCP gateway |

Tidak ada proses build/bundler — proyek murni file statis yang bisa langsung dibuka di browser atau di-deploy ke static hosting apa pun.

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

## 🚀 Cara Menjalankan

Karena tidak ada proses build, cukup jalankan sebagai file statis.

**Opsi 1 — Buka langsung:**
```bash
git clone https://github.com/<username>/<repo-name>.git
cd <repo-name>
open index.html      # macOS
# atau klik dua kali index.html di file explorer
```

**Opsi 2 — Local server (disarankan, agar tidak ada isu CORS pada beberapa browser):**
```bash
# Dengan Python
python3 -m http.server 8080

# Dengan Node.js (http-server)
npx http-server -p 8080
```
Lalu buka `http://localhost:8080` di browser.

**Opsi 3 — GitHub Pages:**
1. Push repo ini ke GitHub
2. Buka **Settings → Pages**
3. Pilih branch `main` dan folder root (`/`)
4. Dashboard akan tersedia di `https://<username>.github.io/<repo-name>/`

---

## 🔑 Akun Demo

Gunakan salah satu akun berikut pada layar login:

| Email | Role | Akses |
|---|---|---|
| `budi.santoso@astra-honda.com` | Energy Manager | Penuh |
| `siti.rahayu@astra-honda.com` | Plant Supervisor | Overview, Machines, Alarms |
| `ahmad.fauzi@astra-honda.com` | IIoT Engineer | Penuh |

**Password untuk semua akun:** `Sems2026!`

> ⚠️ Validasi akun dilakukan sepenuhnya di sisi klien (browser) untuk keperluan demo. Pada implementasi produksi, autentikasi **wajib** dipindahkan ke backend yang aman (mis. OAuth2/SSO korporat, hashing password, rate limiting, dll).

---

## 🔌 Menghubungkan ke Data Real

Seluruh konfigurasi sumber data terpusat di **`api-config.js`**. Ubah `MODE` sesuai infrastruktur yang tersedia:

```js
const SEMS_CONFIG = {
  MODE: 'demo', // 'demo' | 'rest' | 'websocket' | 'mqtt' | 'modbus'
  ...
};
```

| Mode | Kegunaan |
|---|---|
| `demo` | Data simulasi internal — default, tanpa server |
| `rest` | Polling HTTP berkala ke REST API / endpoint SCADA |
| `websocket` | Streaming data real-time via WebSocket |
| `mqtt` | MQTT over WebSocket (broker MQTT pabrik) |
| `modbus` | Modbus TCP via HTTP gateway (mis. Node-RED + `node-red-contrib-modbus`) |

Setiap mode memiliki bagian konfigurasi sendiri (`REST`, `WS`, `MQTT`, `MODBUS`) lengkap dengan endpoint, kredensial, dan interval polling. Bagian `MAPPING` menyediakan fungsi-fungsi (`mapFacility`, `mapMachines`, `mapAlarms`, `mapTrend`, `mapDonut`, `mapHeatmap`, `mapEIR`) yang dapat disesuaikan jika struktur JSON dari API/PLC Anda berbeda dari format internal SEMS — tanpa perlu menyentuh `script.js`.

Untuk mode `mqtt`, tambahkan library client MQTT ke `index.html`:
```html
<script src="https://unpkg.com/mqtt/dist/mqtt.min.js"></script>
```

---

## 🎛 Kustomisasi

- **Daftar mesin & zona** — edit array `MACHINES` di `script.js` (id, nama, zona, daya, kapasitas, status)
- **Tarif listrik & faktor finansial** — edit `TARIF_KWH_INDUSTRI` dan `ESTIMASI_FAKTOR_DENDA` di `script.js`
- **Rule otomasi RPA** — tambah/ubah objek pada `RPA.RULES` (kondisi `check()` dan aksi `execute()`)
- **Zona pantau default & preferensi tampilan** — disimpan melalui panel **Akun → Pengaturan**
- **Branding/logo** — ganti `AHM.jpg` dan referensinya di `index.html`
- **Tema warna** — variabel CSS (`--bg0`, `--bg1`, dst. serta warna aksen cyan `#00FFD4`) terpusat di awal `style.css`

---

## 🗺 Roadmap

Berdasarkan panel **People Transformation** dalam dashboard, berikut roadmap implementasi yang disimulasikan:

| Fase | Periode | Fokus |
|---|---|---|
| 1 — Foundation | Jan–Feb 2026 | Instalasi dashboard, orientasi & pelatihan IIoT dasar |
| 2 — Integration | Mar–Apr 2026 | Integrasi sensor Modbus TCP ke mesin utama |
| 3 — Automation | Mei–Jun 2026 | Aktivasi RPA Engine, sertifikasi ISO 50001 |
| 4 — Optimization | Jul–Sep 2026 | Ekspansi zona, optimasi prediktif berbasis ML |
| 5 — Scale-Up | Okt–Des 2026 | Replikasi ke plant lain, target zero-incident |

---

## ⚠️ Disclaimer

- Seluruh data numerik (konsumsi energi, status mesin, alarm, dsb.) dalam mode demo **disimulasikan secara acak/statik** untuk keperluan presentasi — bukan data operasional sungguhan.
- Nama, logo, dan referensi perusahaan digunakan sebagai **studi kasus ilustratif** dan tidak merepresentasikan sistem resmi atau afiliasi dengan entitas terkait.
- Kredensial login pada bagian [Akun Demo](#-akun-demo) hanya untuk tujuan demonstrasi — jangan gunakan pola autentikasi sisi-klien ini di lingkungan produksi.

---

## 📄 Lisensi

Proyek ini belum menyertakan lisensi resmi. Tambahkan file `LICENSE` (mis. MIT) jika ingin mengizinkan penggunaan ulang kode secara terbuka.

---

<p align="center">Dibangun dengan ⚡ untuk visi pabrik manufaktur yang lebih efisien dan berkelanjutan.</p>
