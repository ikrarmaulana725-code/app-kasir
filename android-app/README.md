# Qasir Modern Android

Versi Android dibuat dengan React + Vite + Capacitor. Aplikasi ini adalah client mobile untuk backend Qasir Modern di folder utama.

## Backend

Jalankan backend Next.js terlebih dahulu:

```bash
cd ..
npm.cmd run dev
```

Untuk emulator Android, default API adalah:

```env
VITE_API_BASE_URL=http://10.0.2.2:3000
```

Untuk HP fisik, ganti ke IP komputer di jaringan lokal, misalnya:

```env
VITE_API_BASE_URL=http://192.168.1.10:3000
```

## Jalankan Mode Web

```bash
npm.cmd run dev
```

## Build dan Sync Android

```bash
npm.cmd run build
npm.cmd run cap:sync
```

## Buka di Android Studio

```bash
npm.cmd run android
```

Atau buka folder `android-app/android` langsung dari Android Studio.

## Build APK Debug

Butuh Java JDK dan Android SDK.

```bash
cd android
gradlew.bat assembleDebug
```

APK debug akan muncul di:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Fitur Mobile

- Login ke backend dengan Bearer token.
- Dashboard ringkas.
- POS mobile dengan pencarian produk/barcode.
- Keranjang, diskon, pembayaran, kembalian.
- Simpan transaksi ke backend.
- Riwayat transaksi dan struk.
- Refund untuk owner/admin.
- Daftar produk dan stok.
