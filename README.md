# Money Manager

PWA pencatat keuangan pribadi (mobile first). Next.js (static export) + Tailwind + Firebase (Auth, Firestore, Hosting).

Halaman: **Dashboard**, **Pencatatan**, **Pelaporan**, **Setting** (Kategori, Sumber Dana, Preferensi, Data).

Rancangan data Firestore: [docs/rancangan-data.md](docs/rancangan-data.md).

## Development

```bash
npm install
npm run dev
```

Login memakai Google (Firebase Auth). Data tersimpan di `users/{uid}/…` di Firestore dengan cache offline.

## Deploy

```bash
npm run deploy                         # build + deploy hosting
firebase deploy --only firestore       # rules & indexes
```

Hasil build (`out/`) di-serve Firebase Hosting. Service worker (`public/sw.js`) hanya aktif di build produksi;
naikkan `VERSION` di file itu kalau daftar halaman app shell berubah.

## Struktur

```
src/app/            halaman (page.tsx = server, view.tsx = client)
src/components/     shell, sheet, form transaksi, UI dasar
src/lib/firebase.ts inisialisasi Firebase (lazy, offline cache)
src/lib/auth.tsx    login Google
src/lib/store.tsx   listener Firestore + operasi tulis
scripts/gen-icons.mjs  generate ikon PWA (npm run icons)
```
