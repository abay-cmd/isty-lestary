# Isty Lestary — Portfolio

Website portfolio statis (HTML + CSS + JS), penuh animasi (GSAP, ScrollTrigger, Lenis).
Tidak ada proses build, jadi bisa langsung di-deploy ke Vercel.

## Struktur
```
index.html            ← seluruh konten & section
assets/css/style.css  ← desain & layout
assets/js/main.js     ← semua animasi & interaksi
assets/img/           ← foto hero + 5 sertifikat + laporan PTE (webp)
assets/qr/            ← QR WhatsApp, LinkedIn, Email
assets/fonts/         ← font (self-hosted)
assets/vendor/        ← gsap, ScrollTrigger, lenis (self-hosted)
vercel.json           ← konfigurasi Vercel
```

## Cara upload ke GitHub
1. Buat repo baru di github.com (misal `isty-portfolio`), kosong, tanpa README.
2. Di terminal, dari dalam folder ini:
```bash
git init
git add .
git commit -m "Portfolio Isty Lestary"
git branch -M main
git remote add origin https://github.com/USERNAME/isty-portfolio.git
git push -u origin main
```
(Tanpa terminal: di halaman repo klik **Add file → Upload files**, lalu seret semua isi folder ini.)

## Cara deploy ke Vercel
1. Buka vercel.com → **Add New… → Project** → pilih repo `isty-portfolio` dari GitHub.
2. **Framework Preset: Other**. Build Command & Output Directory dikosongkan. Klik **Deploy**.
3. Setiap `git push` berikutnya otomatis ter-deploy ulang.

## Yang mudah diubah
- Teks, nomor, link: `index.html`.
- Warna: variabel di bagian `:root` pada `assets/css/style.css`.
- Foto: ganti file di `assets/img/` dengan nama yang sama.
- Cover buku di section Publikasi saat ini berupa ilustrasi bergaya (bukan cover asli). Untuk memakai cover asli, ganti blok `.book-face.front` di `index.html` dengan `<img>`.
