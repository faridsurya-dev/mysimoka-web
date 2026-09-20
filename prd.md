# Product Requirements Document (PRD)

## MySimoka SmartGrowth — Landing Page

---

## 1. Ringkasan

Pembuatan halaman landing page satu halaman (single page) untuk menampilkan produk **MySimoka SmartGrowth** — sebuah solusi pengukuran antropometri massal untuk sekolah dasar. Halaman ini bersifat statis (HTML/CSS/JS), menggunakan bahasa Inggris, dan menampilkan model 3D produk.

---

## 2. Tujuan

- Menampilkan produk MySimoka SmartGrowth sebagai portofolio
- Menjelaskan masalah yang dipecahkan oleh produk
- Menyampaikan value proposition dan fitur-fitur utama
- Mengarahkan pengguna untuk mengunduh aplikasi di Google Play Store

---

## 3. Target Pengguna

| Aspek | Keterangan |
|-------|------------|
| Pengunjung website | Pelanggan umum |
| Pengguna produk | Institusi Sekolah Dasar |

---

## 4. Spesifikasi Produk

| Aspek | Detail |
|-------|--------|
| Nama Produk | MySimoka SmartGrowth |
| Masalah | Membantu sekolah melakukan pengukuran antropometri secara massal dan menganalisis hasilnya |
| Value Proposition | Pencatatan antropometri dengan cepat, mudah, dan massal |
| Harga | Tidak ditampilkan di website |

---

## 5. Fitur Produk yang Ditampilkan

1. Aplikasi Android
2. Face Recognition untuk identifikasi siswa
3. Pencatatan otomatis melalui alat SmartGrowth
4. Dashboard Analytic untuk sekolah
5. Laporan pertumbuhan untuk orang tua

---

## 6. Struktur Halaman

| Section | Isi |
|---------|-----|
| **Navbar** | Logo produk + navigasi (Problem, Features, Team) |
| **Hero** | Nama produk, tagline, deskripsi singkat, model 3D interaktif (display fullscreen), CTA Download Google Play, fullscreen. |
| **Problem** | 3 kartu: Time Consuming, Error Prone, No Insights |
| **Value Proposition** | Penjelasan solusi terpadu yang ditawarkan |
| **Features** | 5 kartu fitur utama dengan ikon |
| **Team** | Nama-nama tim pengembang: Merita Arini (Doctor, Expert in public health), Farid Suryanto (Product Designer). Use a dummy photo first. |
| **Footer** | CTA Download Google Play + copyright |

---

## 7. Call to Action (CTA)

- Teks: "Download on Google Play"
- Target: Link eksternal ke Google Play Store

---

## 8. Model 3D

| Aspek | Detail |
|-------|--------|
| File | `models/smart_growth.stl` |
| Library | Three.js (STLLoader) |
| Interaksi | Zoom in/out (scroll), Rotate Y axis (drag horizontal) |
| Auto-rotate | Tidak |
| Posisi | Model berdiri (upright), default posisi rotate-x -90 derajat. |

---

## 9. Desain & UI

| Aspek | Detail |
|-------|--------|
| Layout | Single page (satu halaman, scroll) |
| Warna tema | Biru muda pastel |
| Font | Inter (Google Fonts) |
| Responsif | Ya (desktop, tablet, mobile) |
| Animasi | Hover effect pada kartu, smooth scroll |

---

## 10. Tech Stack

| Aspek | Detail |
|-------|--------|
| HTML | Statis, tanpa framework |
| CSS | Pure CSS, custom properties (variables) |
| JavaScript | ES Modules |
| 3D | Three.js + STLLoader + OrbitControls |
| Font | Google Fonts (Inter) |
| Hosting | Static hosting (bisa di-deploy ke Netlify, Vercel, GitHub Pages, dsb.) |

---

## 11. Struktur File

```
mysimoka_web/
├── index.html
├── prd.md
├── css/
│   └── style.css
├── js/
│   └── main.js
└── models/
    └── smart_growth.stl
```

---

## 12. Non-Fituran

- Tidak ada fitur pencarian atau filter produk
- Tidak ada CRUD / panel admin
- Tidak ada testimonial atau studi kasus
- Tidak ada form kontak
- Tidak ada harga produk
- Tidak ada autentikasi pengguna

---

## 13. Catatan

- Nama tim pengembang di section Team masih perlu diisi
- URL Google Play Store perlu diganti dengan link yang sebenarnya
