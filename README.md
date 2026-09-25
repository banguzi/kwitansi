# Dokumen Thermal 58 mm

Aplikasi web / PWA statis offline-first untuk membuat dan mencetak **Kwitansi**, **Nota**, **Bon**, **Bukti Pembayaran**, dan **Bukti Serah Terima Uang** pada printer thermal 58 mm.

Pencetakan memakai `window.print()` dan stylesheet `@media print`. Printer thermal harus sudah terpasang sebagai printer sistem. Aplikasi ini **tidak** menghubungkan Bluetooth Classic SPP dari browser.

## Anatomi aplikasi (atas ke bawah)

1. **Kepala (kop & identitas)** — nama usaha, alamat, telepon, NPWP, diatur di panel preferensi dan tersimpan di `localStorage`.
2. **Leher (meta dokumen)** — jenis dokumen, nomor, dan tanggal.
3. **Batang tubuh (isi)** — pihak, uraian, daftar item, jumlah, metode, atau keperluan sesuai jenis dokumen.
4. **Tangan (tanda tangan)** — kolom penyetor/penerima, petugas/pelanggan, atau saksi.
5. **Kaki (footer struk)** — catatan toko yang ikut tercetak.

## Batasan teknis

- Tidak memakai Web Bluetooth Classic SPP. API itu tidak tersedia untuk printer SPP klasik dari browser.
- Tidak ada perintah ESC/POS, auto-cut, atau buka laci kasir dari halaman ini.
- Jika pencetakan ESC/POS tanpa dialog diperlukan, gunakan aplikasi pendamping / local print bridge. Itu di luar MVP web murni.
- Tidak ada server, database, framework, atau CDN. Semua aset lokal.
- Data transaksi tidak disimpan kecuali pengguna menekan **Simpan Draft**.
- Form tidak dikosongkan setelah cetak.

## Berkas proyek

```
thermal-dokumen/
  index.html
  styles.css
  app.js
  manifest.webmanifest
  sw.js
  README.md
  icons/
    icon-192.png
    icon-512.png
    icon-maskable-192.png
    icon-maskable-512.png
```

## Cara menjalankan

Aplikasi adalah situs statis. Service worker membutuhkan konteks aman (HTTPS atau `localhost`).

### Opsi A — server lokal sederhana

Dari folder proyek:

```bash
python3 -m http.server 8080
```

Buka `http://localhost:8080`.

### Opsi B — buka berkas langsung

`index.html` dapat dibuka sebagai file lokal untuk mengisi form dan pratinjau. Pemasangan PWA dan cache service worker memerlukan HTTP/HTTPS.

### Opsi C — Android

1. Sajikan folder lewat HTTPS atau jaringan lokal.
2. Buka di Chrome.
3. Menu → Add to Home screen / Install app.
4. Pastikan printer thermal sudah muncul di daftar printer sistem Android.

## Preferensi dan draft

| Data | Penyimpanan | Keterangan |
| --- | --- | --- |
| Kop usaha, lebar konten 48–52 mm, terbilang, tampilkan header | `localStorage` kunci `thermal-dokumen-prefs-v1` | Otomatis |
| Draft dokumen | `localStorage` kunci `thermal-dokumen-drafts-v1` | Hanya jika Simpan Draft |
| Transaksi selesai dicetak | Tidak disimpan | Form tetap terisi |

## Cetak 58 mm

- Lebar halaman: `58mm`.
- Lebar konten efektif: 48–52 mm (pengaturan pengguna).
- Font monospace, tinta hitam, tanpa latar belakang dekoratif.
- Tombol, form, dan navigasi disembunyikan oleh kelas `.no-print`.
- `page-break-inside: avoid` pada blok dokumen.

Pada dialog cetak browser:

1. Pilih printer thermal sistem.
2. Paper size: 58 mm / 58mm x receipt / roll paper.
3. Scale 100%, margin None / Minimum.
4. Matikan header dan footer browser.

## Jenis dokumen

- **Kwitansi** — diterima dari, jumlah, terbilang, untuk pembayaran, penyetor, penerima.
- **Nota** — daftar item, qty, satuan, harga satuan, subtotal, diskon, pajak, total, terbilang.
- **Bon** — daftar item dan total, tanpa pajak/diskon.
- **Bukti Pembayaran** — pembayar, penerima, metode, referensi, jumlah.
- **Bukti Serah Terima Uang** — pihak menyerahkan, pihak menerima, identitas opsional, saksi opsional.

Format rupiah otomatis (`1.250.000`) dan terbilang bahasa Indonesia.

## Checklist pengujian desktop

- [ ] Situs terbuka tanpa error konsol terkait CDN atau file hilang.
- [ ] Kelima jenis dokumen mengganti form secara dinamis.
- [ ] Nota: tambah/hapus item, qty × harga = subtotal, diskon dan pajak mengubah total.
- [ ] Input uang memformat pemisah ribuan.
- [ ] Terbilang sesuai angka, termasuk 0, belasan, ribuan, jutaan.
- [ ] Validasi menolak cetak jika field wajib kosong atau jumlah 0.
- [ ] Cetak menyembunyikan form dan tombol.
- [ ] Pratinjau dan hasil print-preview memakai font monospace hitam.
- [ ] Lebar konten berubah saat slider 48–52 mm digeser.
- [ ] Simpan Draft, muat draft, hapus draft berfungsi setelah reload.
- [ ] Bersihkan mengosongkan form aktif, draft lama tetap ada.
- [ ] Form tetap terisi setelah dialog cetak ditutup.
- [ ] Prefensi kop bertahan setelah reload.
- [ ] Service worker terdaftar di `localhost` / HTTPS.
- [ ] Mode offline (DevTools → Offline) masih membuka aplikasi dari cache.
- [ ] Dialog petunjuk cetak muncul sebelum `window.print()`.

### Windows

- [ ] Printer thermal 58 mm tampil di dialog cetak Chrome/Edge.
- [ ] Ukuran kertas roll 58 mm dapat dipilih di driver.
- [ ] Header/footer Chrome dimatikan; teks tidak terpotong kiri-kanan.

### macOS

- [ ] Printer muncul di daftar sistem.
- [ ] Safari/Chrome print preview menunjukkan pita sempit, bukan A4 penuh setelah paper size diubah.
- [ ] Margin minimum tidak memotong karakter tepi.

## Checklist pengujian Android

- [ ] Halaman terbuka di Chrome Android.
- [ ] Install PWA / Add to Home screen menampilkan ikon lokal.
- [ ] Aplikasi jalan di mode standalone tanpa bilah URL (setelah install).
- [ ] Form dan pratinjau dapat digulir; pratinjau 58 mm tidak pecah layout.
- [ ] Printer thermal yang sudah dipasang di sistem muncul pada Share / Print.
- [ ] Tidak ada tombol “hubungkan Bluetooth printer” yang mengaku memakai Web Bluetooth Classic.
- [ ] Offline: buka PWA terpasang dalam mode pesawat setelah sempat di-cache.
- [ ] Draft dan preferensi tetap ada setelah aplikasi ditutup.
- [ ] Cetak menghasilkan struk terbaca, bukan halaman UI.

## Yang sengaja tidak ada

- Pemilihan printer Bluetooth Classic dari JavaScript.
- Perintah potong kertas ESC/POS.
- Backend, akun pengguna, dan sinkronisasi awan.
- Library pihak ketiga.

## Lisensi pemakaian

Kode ini diberikan sebagai proyek statis siap pakai untuk operasional toko/kantor. Sesuaikan kop usaha sebelum dipakai ke pelanggan.
