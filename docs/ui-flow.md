# UI Flow UMKMStore

## Customer Flow (Storefront)
1. Buka /store/[slug]
2. Lihat katalog produk (filter kategori)
3. Tambah produk ke keranjang
4. Klik tombol keranjang floating
5. Review cart, input kode promo (opsional)
6. Klik "Lanjut ke Checkout"
7. Isi nama, HP, tipe pengiriman, catatan
8. Klik "Buat Pesanan"
9. Tampil QRIS + instruksi bayar
10. Klik "Saya Sudah Bayar" → success screen

## Owner/Kasir Flow (Dashboard)
1. Login di /login
2. Dashboard: lihat stats (omzet, order, pending)
3. Pesanan: lihat daftar, filter status
4. Detail pesanan: konfirmasi bayar / proses / selesai
5. Produk: tambah/edit/toggle aktif
6. Promo: buat kode diskon
7. Pengaturan: update profil toko, upload QRIS

## Onboarding Flow (Baru)
1. Daftar di /register
2. Isi nama pemilik, email, password
3. Isi nama toko + slug (auto-generate)
4. Toko langsung aktif di /store/[slug]
5. Redirect ke /login → masuk dashboard
6. Tambah produk pertama
7. Setup QRIS di Pengaturan
8. Share link toko ke pelanggan
