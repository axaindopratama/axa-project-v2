# Mobile UI/UX Responsive Plan

## 1) Ringkasan Eksekutif

Dokumen ini merumuskan rencana profesional dan komprehensif untuk meningkatkan pengalaman **mobile** pada aplikasi AXA Project, dengan mempertahankan kondisi saat ini yang sudah baik di **desktop** dan **tablet**.

Fokus utama adalah menjadikan aplikasi benar-benar **mobile-first secara perilaku**, bukan hanya menumpuk breakpoint. Prioritas tertinggi adalah _app shell_ (navigasi utama), halaman operasional harian (Dashboard, Projects, Transactions, Settings), serta kualitas interaksi (tap target, alur satu tangan, aksesibilitas, dan stabilitas visual).

---

## 2) Tujuan, Cakupan, dan Target Device

### 2.1 Tujuan
- Menghapus friksi penggunaan di layar kecil (320–767 px).
- Menyediakan pola navigasi mobile yang jelas, cepat, dan konsisten.
- Menjamin fitur-fitur inti dapat dipakai nyaman dengan satu tangan.
- Menjaga agar perubahan mobile **tidak meregresi** desktop/tablet.

### 2.2 Cakupan (In Scope)
- Refactor layout shell protected (`Sidebar`, `TopAppBar`, `ProtectedLayout`) untuk mode mobile.
- Penyesuaian UI/UX pada halaman prioritas P0/P1/P2.
- Standarisasi spacing, typography, dan hierarchy di viewport mobile.
- QA matrix lintas device + browser untuk validasi UX.

### 2.3 Di Luar Cakupan (Out of Scope)
- Rebranding visual total.
- Perombakan arsitektur backend/API.
- Redesign menyeluruh semua komponen non-prioritas pada fase awal.

### 2.4 Target Viewport
- **Primary mobile:** 320, 360, 375, 390, 412 px (portrait).
- **Secondary:** 768 px (tablet portrait) sebagai jembatan layout.
- Landscape mobile dianggap _best-effort_ (konten tetap usable, bukan fokus utama fase 1).

---

## 3) Audit Kondisi Saat Ini (Evidence-Based)

### 3.1 Struktur Shell Protected
- `src/app/(protected)/layout.tsx`
  - Konten utama dipaksa offset `ml-64`.
  - Top bar berada di area yang diasumsikan selalu ada sidebar desktop.
  - Dampak mobile: potensi ruang sempit, overlap, dan komposisi layout tidak fleksibel.

### 3.2 Sidebar
- `src/components/layout/Sidebar.tsx`
  - Sidebar bersifat fixed permanen (`w-64 h-screen fixed left-0`).
  - Belum ada mode drawer/hamburger/scrim untuk layar kecil.
  - Dampak mobile: navigasi tidak ergonomis dan berisiko menutup area konten.

### 3.3 Top App Bar
- `src/components/layout/TopAppBar.tsx`
  - Header fixed dengan offset kiri desktop (`left-64`).
  - Komponen search + notif + profile masih desktop-centered.
  - Dampak mobile: tata letak padat dan hierarchy tindakan kurang optimal.

### 3.4 Halaman Protected
- Sudah ada fondasi responsive pada grid (`grid-cols-1 md:... lg:...`) di beberapa halaman.
- Namun pola spacing/visual hierarchy banyak yang masih desktop-first (`p-6 lg:p-10`, heading besar, panel horizontal).

### 3.5 Halaman Public Auth
- `login` dan `reset-password` sudah relatif mobile-friendly (card center + max width).
- Masih ada ruang optimasi: tap target, safe-area, hierarchy teks, dan keyboard ergonomics.

---

## 4) Prinsip UX Mobile yang Menjadi Guardrail

1. **Mobile-first default**: style dasar untuk mobile, lalu enhancement ke `md`/`lg`.
2. **Satu tangan & thumb zone**: action primer mudah dijangkau ibu jari.
3. **Tap target minimum 44x44 px** pada elemen interaktif penting.
4. **Progressive disclosure**: detail sekunder disembunyikan dulu, tampil saat perlu.
5. **Hierarchy tegas**: satu CTA primer per layar/flow.
6. **No horizontal scroll** untuk halaman inti.
7. **A11y baseline**: fokus, keyboard nav, kontras, dan label ARIA terpenuhi.

---

## 5) Arsitektur Responsif Target

### 5.1 Adaptive App Shell

#### Desktop/Tablet (>= `md` atau `lg`, final sesuai implementasi)
- Sidebar tetap permanen di kiri.
- TopAppBar mengikuti layout existing dengan optimasi minor.

#### Mobile (< breakpoint target)
- Sidebar berubah menjadi **off-canvas drawer**.
- TopAppBar menampilkan tombol **hamburger** untuk buka/tutup drawer.
- Tambahkan **scrim overlay** saat drawer terbuka.
- Drawer menutup otomatis saat:
  - pengguna memilih menu,
  - pengguna tap scrim,
  - pengguna tekan `Esc`.

### 5.2 Opsional Lanjutan
- Evaluasi **bottom navigation** untuk 4–5 menu paling sering dipakai (fase lanjutan setelah stabil).

### 5.3 Strategi Breakpoint
- Default: mobile.
- `md`: tablet adjustments.
- `lg`: desktop optimization.

---

## 6) Rencana Implementasi per Komponen (Teknis + UX)

### 6.1 `ProtectedLayout`
- Hilangkan ketergantungan statis `ml-64` pada mobile.
- Introduce state shell untuk `isMobileNavOpen` (di client wrapper atau pendekatan sejenis).
- Pastikan area konten punya padding top yang sesuai tinggi top bar mobile.

### 6.2 `Sidebar`
- Pisahkan mode sidebar menjadi:
  - `desktopSidebar` (persisten),
  - `mobileDrawer` (slide-in).
- Tambahkan transisi transform berbasis GPU (`translate-x`) untuk performa.
- Auto-close drawer saat route berubah.
- Terapkan aksesibilitas:
  - role dialog/nav yang tepat,
  - focus trap,
  - restore focus ke tombol menu saat drawer ditutup.

### 6.3 `TopAppBar`
- Mobile: offset kiri 0, tinggi kompak, tombol menu terlihat jelas.
- Search behavior:
  - mode collapsed (ikon) atau
  - mode row kedua full width saat aktif.
- Notifikasi/profile dropdown di mobile dipertimbangkan menjadi sheet/popover yang lebih lebar dan mudah disentuh.

### 6.4 Shared UI Tokens
- Standarisasi spacing mobile (`px-4`, `py-3`, `gap-3`, dll).
- Turunkan ukuran heading besar untuk mobile agar tidak memakan fold.
- Konsolidasi utility class agar konsisten lintas halaman.

---

## 7) Prioritas Halaman (Impact-Based)

### P0 (Kritis Operasional Harian)
1. Dashboard (`src/app/(protected)/page.tsx`)
2. Projects list/detail/new/edit
3. Transactions list/detail/new
4. Settings (`SettingsPageClient.tsx`)
5. Login & Reset Password (public)

### P1 (Penting Menengah)
1. Entities list/detail
2. Keuangan
3. Kanban

### P2 (Lanjutan)
1. AI Chat
2. Scanner
3. Admin users & audit

---

## 8) Detail Target UX per Area Utama

### 8.1 Dashboard (P0)
- Ubah section hero supaya stack vertikal di mobile.
- Angka KPI utama tetap terlihat di fold awal.
- Chart diberi container yang tidak memicu overflow horizontal.
- Card side panel diturunkan ke urutan yang relevan (alerts di atas ringkasan sekunder).

### 8.2 Projects/Transactions (P0)
- Pastikan list/card mudah di-scan dengan garis informasi utama (judul, nominal, status, tanggal).
- Filter/sort/search gunakan panel sheet atau collapsible section.
- Tombol aksi (misal tambah data) selalu reachable (sticky CTA bila perlu).

### 8.3 Settings (P0)
- Grid kompleks dipecah jadi section vertikal.
- Form field full-width di mobile, label jelas, pesan validasi dekat field.
- Action buttons tidak berjejer terlalu rapat.

### 8.4 Login & Reset Password (P0)
- Tetap pertahankan pola card center.
- Optimasi:
  - area sentuh input dan tombol,
  - jarak antar elemen,
  - handling keyboard virtual agar CTA tidak tertutup.

---

## 9) Aksesibilitas (A11y) dan Usability

- Semua komponen interaktif memiliki label jelas dan state fokus terlihat.
- Drawer mobile:
  - `aria-expanded` pada tombol menu,
  - `aria-controls` terhubung,
  - fokus terkunci dalam drawer saat terbuka.
- Pastikan kontras teks memenuhi standar WCAG (minimal AA untuk teks utama).
- Hindari hanya mengandalkan warna untuk menyampaikan status/error.

---

## 10) Performance & Technical Quality

- Animasi drawer 150–250ms, gunakan `transform` + `opacity`.
- Hindari reflow berat saat membuka nav.
- Minimalisasi layout shift (CLS) pada top bar dan panel dropdown.
- Batasi render konten sekunder sampai benar-benar dibuka (lazy/show-on-demand).

---

## 11) Rencana QA & UAT

### 11.1 Device Matrix
- Android Chrome: 360x800, 390x844, 412x915.
- iOS Safari: 375x812, 390x844.
- Edge case kecil: 320x568.

### 11.2 Browser Matrix
- Chrome (Android)
- Safari (iOS)
- Chrome desktop responsive emulator (sanity)

### 11.3 Test Scenario Kunci
1. Buka/tutup mobile drawer (menu, scrim, ESC, route-change).
2. Navigasi antar halaman inti tanpa elemen tertutup.
3. Form login/reset: validasi, error, sukses.
4. Daftar panjang/card list tidak overflow horizontal.
5. Dropdown notif/profile tetap usable pada mobile.
6. Rotasi portrait/landscape tidak memecahkan layout kritis.

### 11.4 Visual Regression
- Simpan baseline screenshot untuk P0 sebelum dan sesudah implementasi.
- Validasi konsistensi spacing, typography, dan alignment antar layar.

---

## 12) Roadmap Delivery (Fase Implementasi)

### Phase 1 — Foundation (Shell & Navigation)
- Implement adaptive shell mobile.
- Sidebar drawer + top bar mobile controls.
- Hardening a11y dasar.

### Phase 2 — P0 Screens
- Dashboard, Projects, Transactions, Settings, Auth.
- Perbaikan hierarchy, spacing, dan CTA placement.

### Phase 3 — P1/P2 Screens
- Entities, Keuangan, Kanban, lalu AI/Admin pages.

### Phase 4 — QA Hardening & Polish
- Bugfix cross-device.
- Visual polish final.
- Dokumentasi checklist final + handover.

---

## 13) Definition of Done (DoD)

Suatu fase dianggap selesai jika:
1. Tidak ada horizontal scroll di halaman target pada viewport mobile.
2. Navigasi mobile berfungsi stabil tanpa overlap konten.
3. Semua CTA utama pada halaman target mudah dijangkau dan dapat dioperasikan satu tangan.
4. A11y baseline untuk komponen navigasi mobile terpenuhi.
5. Test matrix untuk fase tersebut lulus.

---

## 14) Metrik Keberhasilan

### 14.1 Product Metrics
- Penurunan keluhan UI mobile (jika ada kanal support/issue tracker).
- Kenaikan keberhasilan penyelesaian tugas utama mobile (login, input transaksi, buka detail proyek).

### 14.2 Technical Metrics
- Penurunan bug regresi layout mobile per release.
- Lighthouse mobile: peningkatan Accessibility + Best Practices.
- Stabilitas visual (CLS rendah) pada halaman P0.

---

## 15) Risiko & Mitigasi

1. **Risiko regresi desktop/tablet**
   - Mitigasi: implementasi mobile-first terisolasi, snapshot visual lintas breakpoint.

2. **Risiko inkonsistensi utility class**
   - Mitigasi: konsolidasi style patterns reusable untuk spacing/typography.

3. **Risiko scope melebar**
   - Mitigasi: disiplin prioritas P0 > P1 > P2, approval per fase.

4. **Risiko aksesibilitas terlewat**
   - Mitigasi: checklist a11y wajib pada PR template.

---

## 16) Rekomendasi Eksekusi Tim

- Gunakan pendekatan **iteratif per fase** dengan PR kecil namun konsisten.
- Pastikan setiap PR memuat:
  - before/after screenshot mobile,
  - daftar skenario uji,
  - status checklist DoD terkait.
- Lakukan _review UX_ singkat setelah Phase 1 sebelum lanjut Phase 2 agar pola shell benar-benar solid.

---

## 17) Lampiran Ringkas (Checklist Implementasi)

- [x] Adaptive protected shell aktif di mobile.
- [x] Sidebar drawer + scrim + ESC + auto-close route.
- [x] TopAppBar mobile dengan menu trigger.
- [x] Search/notif/profile mobile behavior tervalidasi.
- [x] Halaman P0 dioptimasi tanpa overflow.
- [x] Auth flow mobile divalidasi end-to-end.
- [x] QA matrix device/browser lulus.
- [x] Baseline screenshot & regression check terdokumentasi.

Referensi evidence:
- `docs/mobile-uiux-qa-matrix-report.md`
- `docs/mobile-uiux-visual-regression-report.md`

---

## 18) Estimasi Timeline & Governance Eksekusi

### 18.1 Estimasi Timeline (Rekomendasi)
- Minggu 1: Phase 1 (adaptive shell + mobile navigation)
- Minggu 2–3: Phase 2 (halaman P0)
- Minggu 4: Phase 3 (halaman P1)
- Minggu 5: Phase 3 lanjutan (halaman P2)
- Minggu 6: Phase 4 (QA hardening, bugfix, final sign-off)

### 18.2 Governance Singkat
- **PIC Engineering:** implementasi teknis + unit/integration sanity.
- **PIC Product/UX:** validasi interaction pattern + prioritas perubahan.
- **PIC QA:** eksekusi test matrix device-browser + regression capture.
- **Ritme review:** 2x per minggu (progress + risk check), plus sign-off di akhir tiap fase.
