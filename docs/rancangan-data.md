# Rancangan Data — Money Manager (Firestore)

Semua data disimpan per user di bawah `users/{uid}` supaya aturan keamanan
Firestore cukup "user hanya boleh baca/tulis datanya sendiri".

```
users/{uid}                      ← profil + preferensi
  ├─ accounts/{accountId}        ← Sumber Dana (dari mana uangnya)
  ├─ categories/{categoryId}     ← Kategori pemasukan / pengeluaran
  └─ transactions/{txId}         ← Pencatatan
```

Nominal disimpan sebagai **integer rupiah** (bukan float) supaya tidak ada error pembulatan.
Tanggal disimpan sebagai `Timestamp` Firestore; di UI dipakai string `YYYY-MM-DD`.

## `users/{uid}`

| Field            | Tipe      | Keterangan                                  |
|------------------|-----------|---------------------------------------------|
| `displayName`    | string    | dari Firebase Auth                          |
| `currency`       | string    | default `IDR`                               |
| `monthStartDay`  | number    | tanggal awal periode bulanan (1–28), mis. tanggal gajian |
| `createdAt`      | Timestamp |                                             |

## `accounts/{accountId}` — Sumber Dana

| Field            | Tipe      | Keterangan                                        |
|------------------|-----------|---------------------------------------------------|
| `name`           | string    | "Dompet", "BCA", "GoPay"                          |
| `type`           | enum      | `cash` · `bank` · `ewallet` · `credit` · `investment` |
| `initialBalance` | number    | saldo awal saat akun dibuat                       |
| `color`          | string    | hex, untuk UI                                     |
| `icon`           | string    | kunci ikon                                        |
| `archived`       | boolean   | disembunyikan tanpa menghapus riwayat             |
| `order`          | number    | urutan tampil                                     |
| `createdAt`      | Timestamp |                                                   |

Saldo **tidak disimpan**, tapi dihitung: `initialBalance + Σ pemasukan − Σ pengeluaran ± transfer`.
Kalau nanti transaksi sudah ribuan, tambahkan field `balance` yang di-update
lewat `runTransaction` / Cloud Function.

## `categories/{categoryId}` — Kategori

| Field        | Tipe      | Keterangan                                   |
|--------------|-----------|----------------------------------------------|
| `name`       | string    | "Makan", "Gaji"                              |
| `kind`       | enum      | `income` · `expense`                         |
| `icon`       | string    | emoji                                        |
| `color`      | string    | hex                                          |
| `budget`     | number?   | batas bulanan (opsional, hanya `expense`)    |
| `archived`   | boolean   |                                              |
| `order`      | number    |                                              |

## `transactions/{txId}` — Pencatatan

| Field          | Tipe      | Keterangan                                        |
|----------------|-----------|---------------------------------------------------|
| `type`         | enum      | `income` · `expense` · `transfer`                 |
| `amount`       | number    | selalu positif                                    |
| `date`         | Timestamp | tanggal transaksi                                 |
| `accountId`    | string    | sumber dana (untuk transfer = akun asal)          |
| `toAccountId`  | string?   | hanya untuk `transfer`                            |
| `categoryId`   | string?   | kosong untuk `transfer`                           |
| `note`         | string    |                                                   |
| `createdAt`    | Timestamp |                                                   |
| `updatedAt`    | Timestamp |                                                   |

### Index yang dibutuhkan
- `transactions`: `date DESC` (single-field, otomatis)
- `transactions`: `accountId ASC, date DESC` (composite — filter per sumber dana)
- `transactions`: `categoryId ASC, date DESC` (composite — laporan per kategori)

## Security rules (draft)

Lihat [`firestore.rules`](../firestore.rules).

## Halaman Setting

| Menu           | Isi                                                         |
|----------------|-------------------------------------------------------------|
| Kategori       | CRUD kategori, tab Pengeluaran/Pemasukan, emoji + warna + budget |
| Sumber Dana    | CRUD akun (tunai, bank, e-wallet, kartu kredit, investasi) + saldo awal |
| Preferensi     | Mata uang, tanggal awal bulan                               |
| Data           | Export / import JSON, reset data                            |
| Akun           | Login Google (Firebase Auth), logout                        |

## Catatan PWA & hosting
- `next.config.ts` pakai `output: "export"` → hasil build di `out/` di-deploy ke Firebase Hosting.
- Firestore offline persistence (`persistentLocalCache`) dipakai agar pencatatan tetap bisa offline;
  service worker (`public/sw.js`) meng-cache aset statis app shell.
