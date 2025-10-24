# Reset Simulation Guide

## Cara Reset Simulasi ke Kondisi Awal

Ada 2 cara untuk mereset simulasi:

### Opsi 1: Menggunakan Script Otomatis (Recommended)

```bash
cd /Users/andichopradanarizky/nofaster/backend
./reset.sh
```

Script ini akan:
- Reset semua model ke equity $10,000
- Menghapus semua posisi
- Menghapus semua trade history
- Menampilkan status model setelah reset

### Opsi 2: Manual dengan SQLite

```bash
cd /Users/andichopradanarizky/nofaster/backend
sqlite3 prisma/dev.db < reset-simulation.sql
```

## Setelah Reset

1. **Restart Backend Server:**
   ```bash
   npm start
   ```

2. **Clear Browser localStorage:**
   - Buka Developer Tools (F12)
   - Masuk ke tab **Application** atau **Storage**
   - Pilih **Local Storage** > `http://localhost:3000`
   - Klik tombol **Clear All** atau hapus item `equityHistory`
   - Refresh halaman

3. **Verifikasi:**
   - Semua model harus menunjukkan equity $10,000
   - Chart harus mulai dari baseline baru
   - Tidak ada open positions

## Fitur Leverage Baru

Setiap kali AI model membuka posisi baru, leverage akan diacak antara **5x - 20x**.

- **Min Leverage:** 5x
- **Max Leverage:** 20x
- Leverage ditentukan saat posisi dibuka
- Leverage akan ditampilkan di tabel positions

## Troubleshooting

Jika chart masih menampilkan data lama:
1. Pastikan backend sudah direstart
2. Clear browser cache dan localStorage
3. Gunakan mode incognito/private untuk test
