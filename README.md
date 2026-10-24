# KuliahBit

KuliahBit adalah aplikasi web untuk membantu mahasiswa Indonesia mengatur kegiatan kuliah dan membuat materi belajar. Aplikasi dibuat dengan React, TypeScript, Vite, dan Tailwind CSS. Data disimpan di browser sehingga pengguna dapat mulai tanpa membuat akun.

## Daftar isi

- [Fitur](#fitur)
- [Teknologi](#teknologi)
- [Persyaratan](#persyaratan)
- [Menjalankan di komputer lokal](#menjalankan-di-komputer-lokal)
- [Konfigurasi AI Groq](#konfigurasi-ai-groq)
- [Perintah yang tersedia](#perintah-yang-tersedia)
- [Paket Free dan Pro](#paket-free-dan-pro)
- [Penyimpanan dan privasi](#penyimpanan-dan-privasi)
- [Struktur proyek](#struktur-proyek)
- [Build dan deployment](#build-dan-deployment)
- [Pemecahan masalah](#pemecahan-masalah)

## Fitur

### Belajar dan materi

- Ringkas materi, buat flashcard, dan buat soal dari teks.
- Flashcard dan kuis untuk latihan mandiri.
- Mode Cram untuk menyusun rencana belajar menjelang ujian.
- Pembuat outline slide dan presentasi PowerPoint.
- Parafrase untuk merapikan tulisan.
- Pencarian materi, bank soal/materi, catatan, dan alat sitasi.

### Perkuliahan dan produktivitas

- Dashboard, tugas dan deadline, jadwal, agenda, serta prioritas tugas.
- Absensi.
- Bantuan format tugas, pembuat makalah, surat kilat, serta konverter dokumen.
- CV builder.

### Pengaturan

- Tema terang dan gelap.
- Impor beberapa jenis data melalui berkas JSON.
- Hapus data lokal dari halaman Pengaturan.

## Teknologi

- React 19 dan TypeScript
- Vite 6
- Tailwind CSS 4
- React Router
- Groq API untuk fitur AI (opsional)
- `localStorage` untuk data aplikasi di browser

## Persyaratan

- Node.js 18 atau lebih baru
- npm
- Browser modern

## Menjalankan di komputer lokal

1. Clone repositori dan masuk ke folder proyek.

   ```bash
   git clone <URL_REPOSITORY>
   cd kuliahbit
   ```

2. Pasang dependensi.

   ```bash
   npm install
   ```

3. (Opsional) Siapkan API key Groq seperti dijelaskan di [Konfigurasi AI Groq](#konfigurasi-ai-groq).
4. Jalankan server pengembangan.

   ```bash
   npm run dev
   ```

5. Buka alamat lokal yang ditampilkan Vite di terminal (biasanya `http://localhost:5173`).

## Konfigurasi AI Groq

Fitur AI memerlukan API key Groq. Tanpa key, beberapa fitur tetap menampilkan hasil demo atau template dasar.

1. Buat API key di [Groq Console](https://console.groq.com/keys).
2. Salin `.env.example` menjadi `.env` di direktori utama proyek.
3. Isi key pada variabel berikut:

   ```dotenv
   VITE_GROQ_API_KEY=gsk_key_anda
   ```

4. Jalankan ulang server Vite setelah mengubah `.env`.

Jangan commit `.env` atau membagikan API key. Variabel dengan awalan `VITE_` dimasukkan ke bundle frontend dan dapat dilihat oleh pengguna aplikasi. Karena itu, penggunaan key langsung di frontend hanya sesuai untuk pengembangan atau demo pribadi. Untuk deployment publik, pindahkan pemanggilan Groq ke backend/serverless function dan simpan key sebagai secret di server.

Model AI saat ini ditentukan di `src/lib/ai.ts`. Fitur yang menggunakan AI meliputi ringkasan, flashcard/soal dari materi, Mode Cram, outline slide, parafrase, dan pembuatan slide.

## Perintah yang tersedia

| Perintah | Kegunaan |
| --- | --- |
| `npm run dev` | Menjalankan server pengembangan Vite. |
| `npm run build` | Memeriksa TypeScript lalu membuat build produksi di `dist/`. |
| `npm run preview` | Menyajikan build `dist/` secara lokal untuk pratinjau. Jalankan `npm run build` terlebih dahulu. |

## Paket Free dan Pro

Batas paket Free didefinisikan di `src/lib/limits.ts` dan ditampilkan pada halaman `/pricing`.

| Fitur terbatas | Jatah Free saat ini |
| --- | ---: |
| Generate AI | 5 kali per bulan |
| Unduh teks CV | 5 kali per bulan |
| Semua unduhan PDF (CV, presentasi, surat, dan konverter) | 5 kali per bulan total |
| Flashcard | 5 set dan 5 kartu total |
| Kuis | 5 set dan 5 soal total |
| Bank soal/materi | 5 item |
| Catatan | 5 item |
| Impor PDF | Maksimal 10 MB dan teks dibatasi 30.000 karakter |

Ketika kuota tercapai, aksi yang dibatasi mengarahkan pengguna ke halaman `/pricing`. Fitur yang tidak tercantum pada tabel tetap tersedia sesuai implementasi aplikasi.

**Catatan Pro:** harga yang ditetapkan adalah Rp25.000 per bulan. Endpoint Vercel membuat sesi DOKU Checkout, memverifikasi notifikasi bertanda tangan, lalu memperbarui langganan di Supabase. Setiap pembayaran menambah masa aktif satu bulan; pembayaran tidak ditagih otomatis. Identitas paket saat ini terikat pada browser yang melakukan checkout. Fitur aplikasi dan limit masih berjalan di client, sehingga backend ini belum menjadi otorisasi server untuk data atau fitur berbayar.

### Menyiapkan pembayaran DOKU

1. Buat proyek Supabase dan jalankan migration `supabase/migrations/202610240001_doku_billing.sql` dan `supabase/migrations/202610240002_pro_feedback.sql` melalui SQL Editor.
2. Tambahkan `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `DOKU_ENV`, `APP_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dan `ADMIN_DASHBOARD_TOKEN` sebagai environment variables di Vercel. Gunakan `DOKU_ENV=sandbox` saat uji coba dan `production` setelah kredensial live siap. Buat token admin acak minimal 32 karakter heksadesimal (contoh pembuatannya ada di `.env.example`). Service role key, token admin, dan secret DOKU hanya boleh disimpan sebagai secret server; jangan gunakan prefix `VITE_`.
3. Arahkan DOKU HTTP Notification ke `https://<domain-aplikasi>/api/doku-notification` untuk kanal pembayaran yang diaktifkan di dashboard DOKU.
4. Untuk menjalankan fungsi server lokal, gunakan `vercel dev` setelah mengisi environment variables lokal dari `.env.example`. `APP_URL` harus menunjuk origin yang dipakai membuka aplikasi.

Email diminta pada checkout untuk diteruskan ke DOKU. Status Pro tersimpan pada cookie browser HttpOnly; menghapus cookie atau berpindah browser memutus akses ke status langganan itu karena aplikasi belum memiliki login/akun. Pembayaran berikutnya harus dimulai manual untuk memperpanjang masa aktif.

Halaman pemantauan admin tersedia di `/admin/pembayaran`. Masukkan `ADMIN_DASHBOARD_TOKEN` untuk login; server mengirim token sebagai cookie HttpOnly berumur 8 jam. Endpoint admin membaca invoice serta tabel ulasan/dukungan langsung dari database dan tidak membuka tabel Supabase ke browser. Daftar ulasan/dukungan diperbarui otomatis setiap 15 detik selama dashboard admin terbuka. Pengguna dengan langganan Pro aktif dapat mengirim ulasan atau pertanyaan dari bagian Ulasan dan dukungan Pro di halaman `/pricing`; identitas email diambil dari transaksi berbayar dan pesan muncul di tabel dashboard admin.

## Penyimpanan dan privasi

- Data tugas, materi, tema, paket demo, dan penggunaan AI disimpan pada `localStorage` browser.
- Data tidak tersinkron otomatis antarperangkat dan dapat hilang ketika data situs/browser dibersihkan.
- Pemanggilan AI mengirim teks yang dimasukkan pengguna ke Groq jika API key tersedia.
- File PDF diproses di browser untuk mengekstrak teks; sebagian teks dapat dikirim ke Groq saat pengguna menjalankan fitur AI.
- Gunakan halaman Pengaturan untuk impor atau menghapus data. Ekspor data lengkap belum tersedia.

## Struktur proyek

```text
src/
  components/       Komponen bersama dan layout aplikasi
  context/          Context tema dan paket pengguna
  lib/              AI, penyimpanan lokal, limit, PDF, dan konversi
  pages/            Halaman dan fitur aplikasi
  types/            Tipe TypeScript
  App.tsx           Pemetaan rute aplikasi
  main.tsx          Entry point React
public/             Aset statis
index.html          Dokumen HTML utama
vite.config.ts      Konfigurasi Vite
```

## Build dan deployment

Buat build produksi:

```bash
npm run build
```

Hasilnya berada di `dist/`. Deploy isi folder tersebut ke hosting static yang mendukung single-page application. Atur fallback rute ke `index.html` agar URL seperti `/dashboard` dan `/pricing` dapat dibuka langsung.

Jika menggunakan AI di lingkungan deployment, atur `VITE_GROQ_API_KEY` sebelum build. Ingat bahwa key `VITE_` tertanam di bundle frontend; gunakan proxy/backend untuk aplikasi publik.

## Pemecahan masalah

### Perubahan `.env` tidak terbaca

Pastikan nama variabel tepat `VITE_GROQ_API_KEY`, file `.env` ada di direktori utama, lalu hentikan dan jalankan kembali `npm run dev`.

### Fitur AI menampilkan mode demo

Periksa API key dan terminal/browser console. Tanpa key yang valid, fitur tertentu berjalan dalam mode demo. Periksa juga kuota harian Free.

### Data tidak muncul di perangkat lain

Data disimpan secara lokal per browser dan perangkat. Sinkronisasi akun belum tersedia.

### Build gagal

Pastikan versi Node.js memenuhi persyaratan, dependensi sudah terpasang dengan `npm install`, lalu jalankan kembali `npm run build` dan periksa pesan error TypeScript.
