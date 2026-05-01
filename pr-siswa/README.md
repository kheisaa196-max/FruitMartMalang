# 📚 PR Tracker — Aplikasi Penjadwalan Pekerjaan Rumah Siswa

> Aplikasi web sederhana untuk mencatat dan mengelola PR (Pekerjaan Rumah) siswa, dengan penyimpanan data di **Google Sheets** menggunakan **Google Apps Script** sebagai API.

![Preview](https://img.shields.io/badge/Status-Ready%20to%20Use-brightgreen?style=flat-square)
![Tech](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JS-pink?style=flat-square)
![Database](https://img.shields.io/badge/Database-Google%20Sheets-green?style=flat-square)

---

## ✨ Fitur Aplikasi

| Fitur | Keterangan |
|-------|-----------|
| 📝 Form Input PR | Isi Hari, Mapel, Tugas, Deadline, dan Status |
| 📊 Tabel Data | Tampilkan semua PR dari Google Sheets |
| ✅ Toggle Status | Ubah status "Belum" ↔ "Selesai" langsung dari tabel |
| 🔍 Filter & Search | Filter berdasarkan Hari, Mapel, Status, atau kata kunci |
| 🔴 Highlight Deadline | Warna merah jika deadline ≤ 2 hari, kuning jika ≤ 5 hari |
| 📱 Responsive | Tampilan menyesuaikan layar HP maupun laptop |
| 🔔 Notifikasi Toast | Muncul notifikasi saat data berhasil disimpan |
| 📈 Statistik | Tampil jumlah Total PR, Belum, dan Selesai di header |

---

## 📁 Struktur Folder

```
pr-siswa/
├── index.html    → Halaman utama aplikasi (HTML + CSS inline)
├── script.js     → Logika JavaScript (fetch API, render tabel, filter)
├── Code.gs       → Kode Google Apps Script (doGet & doPost)
└── README.md     → Dokumentasi ini
```

---

## 🛠️ Cara Setup (Langkah demi Langkah)

### Langkah 1 — Buat Google Spreadsheet

1. Buka [Google Sheets](https://sheets.google.com) dan buat spreadsheet baru
2. Beri nama spreadsheet, misalnya: **"PR Tracker"**
3. Ganti nama tab/sheet di bawah menjadi **`PR`** (klik kanan tab → Rename)
4. Tambahkan **header kolom** di baris pertama:

   | A    | B     | C     | D        | E      |
   |------|-------|-------|----------|--------|
   | Hari | Mapel | Tugas | Deadline | Status |

5. Salin **ID Spreadsheet** dari URL browser:
   ```
   https://docs.google.com/spreadsheets/d/  INI_ADALAH_ID_NYA  /edit
   ```

---

### Langkah 2 — Setup Google Apps Script

1. Di Google Sheets, klik menu **Extensions → Apps Script**
2. Hapus kode default yang ada
3. Salin seluruh isi file **`Code.gs`** dan tempel di editor Apps Script
4. Ganti baris ini dengan ID Spreadsheet kamu:
   ```javascript
   const SPREADSHEET_ID = "GANTI_DENGAN_ID_SPREADSHEET_KAMU";
   ```
5. Klik **Save** (ikon disket atau Ctrl+S)

---

### Langkah 3 — Deploy sebagai Web App

1. Klik tombol **Deploy** (pojok kanan atas) → pilih **New deployment**
2. Klik ikon ⚙️ di sebelah "Select type" → pilih **Web app**
3. Isi pengaturan:
   - **Description**: PR Tracker API
   - **Execute as**: `Me (email kamu)`
   - **Who has access**: `Anyone` ← **PENTING!**
4. Klik **Deploy**
5. Izinkan akses saat muncul popup (klik **Authorize access**)
6. **Salin URL** yang muncul — contoh:
   ```
   https://script.google.com/macros/s/AKfycbxXXXXXXXXXXXXX/exec
   ```

---

### Langkah 4 — Hubungkan ke Website

1. Buka file **`script.js`**
2. Ganti baris paling atas dengan URL Apps Script kamu:
   ```javascript
   const API_URL = "https://script.google.com/macros/s/URL_KAMU_DI_SINI/exec";
   ```
3. Simpan file

---

### Langkah 5 — Jalankan Aplikasi

1. Buka file **`index.html`** di browser (double-click atau drag ke browser)
2. Atau gunakan ekstensi **Live Server** di VS Code untuk tampilan lebih baik
3. Aplikasi siap digunakan! 🎉

> **Catatan:** Jika URL API belum diisi, aplikasi akan berjalan dalam **mode demo** dengan data contoh.

---

## 🎨 Tampilan Aplikasi

- **Tema**: Pink pastel aesthetic — soft, clean, modern
- **Warna utama**: Pink (#ff5c8a), Putih, Abu muda
- **Font**: Poppins (Google Fonts)
- **Icon**: Font Awesome 6

### Kode Warna Deadline:
| Warna | Arti |
|-------|------|
| 🔴 Merah | Deadline sudah lewat atau ≤ 2 hari lagi |
| 🟡 Kuning | Deadline ≤ 5 hari lagi |
| ⚫ Normal | Deadline masih jauh |
| ~~Coret~~ | PR sudah selesai |

---

## ❓ FAQ

**Q: Kenapa data tidak muncul?**
A: Pastikan URL Apps Script sudah benar di `script.js` dan akses sudah diset ke "Anyone".

**Q: Kenapa muncul error CORS?**
A: Ini normal saat buka file HTML langsung. Gunakan Live Server atau upload ke hosting.

**Q: Apakah bisa dipakai offline?**
A: Bisa dalam mode demo, tapi data tidak tersimpan permanen tanpa koneksi ke Google Sheets.

**Q: Bagaimana cara hapus data?**
A: Hapus langsung dari Google Sheets. Fitur hapus dari web bisa ditambahkan di versi berikutnya.

---

## 👩‍💻 Teknologi yang Digunakan

- **HTML5** — Struktur halaman
- **CSS3** — Styling dengan variabel CSS dan Flexbox/Grid
- **JavaScript (Vanilla)** — Logika aplikasi dan fetch API
- **Google Apps Script** — Backend API serverless
- **Google Sheets** — Database gratis dan mudah diakses
- **Font Awesome** — Icon
- **Google Fonts (Poppins)** — Tipografi

---

## 📝 Lisensi

Bebas digunakan untuk keperluan belajar dan tugas sekolah. 💖

---

*Dibuat dengan ❤️ untuk membantu siswa lebih terorganisir dalam belajar*
