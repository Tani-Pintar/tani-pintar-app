# Product Requirements Document (PRD)
# Tani Pintar

**Versi:** 1.0
**Kategori:** AgriTech — Harvest & Market Decision Intelligence Platform

---

## 1. Ringkasan Produk

Tani Pintar adalah platform berbasis web yang membantu petani kecil di Indonesia mengambil keputusan optimal soal **kapan memanen, ke mana menjual, dan bagaimana menyelamatkan hasil panen** — dengan menggabungkan data harga pasar, cuaca, jarak logistik, dan daya tahan simpan komoditas ke dalam satu rekomendasi yang mudah dipahami.

Platform utama berupa **web dashboard** tempat petani mendaftar, memasukkan data lahan/panen, dan menerima rekomendasi. WhatsApp digunakan sebagai kanal notifikasi tambahan bagi petani yang sudah terdaftar di web.

---

## 2. Problem Statement

Petani kecil Indonesia tidak memiliki akses ke informasi dan rekomendasi yang memungkinkan mereka membuat keputusan optimal tentang kapan memanen, ke mana menjual, dan bagaimana mempreservasi hasil panen mereka. Tujuan utama Tani Pintar adalah **mencegah kerugian finansial petani** yang berulang setiap musim panen — bukan sekadar menyediakan data, melainkan mengubah data menjadi keputusan yang menyelamatkan pendapatan mereka.

### 2.1 Skala Kerugian Nasional (Food Loss & Waste)

| Indikator | Data | Sumber |
|---|---|---|
| Total food loss & waste per tahun | 23–48 juta ton | Bappenas (2021) |
| Kerugian ekonomi per tahun | Rp 213–551 triliun | Bappenas (2021) |
| Persentase dari PDB Indonesia | 4–5% | Bappenas (2021) |
| Kehilangan pangan per kapita per tahun | 115–184 kg | Bappenas (2021) |
| Ranking food waste global | #4 dunia (setelah China, India, Nigeria) | Bappenas (2021) |
| Populasi yang bisa diberi makan dari pangan terbuang | 61–125 juta orang (29–47% populasi) | Bappenas (2021) |
| Kehilangan komoditas hortikultura perishable (tomat, cabai, bawang) | 23–50% dari total hasil panen | Bappenas / FAO |

### 2.2 Bukti Empiris: Volatilitas Harga Menghancurkan Margin Petani

Data resmi maupun laporan lapangan terbaru menunjukkan pola kerugian yang berulang dan konsisten dengan problem statement di atas — bukan kasus yang jarang terjadi, melainkan siklus tahunan:

- Riset dinamika Nilai Tukar Petani (NTP) di Nusa Tenggara Timur mencatat NTP bulanan Januari–Agustus 2025 yang sering berada di bawah titik impas 100, menandakan biaya produksi petani lebih tinggi dibandingkan pendapatan yang diterima, dengan empat dari lima subsektor pertanian — tanaman pangan, hortikultura, perkebunan, dan perikanan — secara konsisten mencatat NTP di bawah 100. Artinya, di banyak daerah petani beroperasi dalam kondisi rugi struktural, bukan hanya insidental.
- Kasus cabai di Kediri (Januari 2026): panen raya yang terjadi bersamaan di banyak sentra produksi membuat harga di tingkat pasar jatuh hingga sebagian petani terancam rugi karena pendapatan tidak sebanding dengan biaya produksi.
- Kasus cabai di Karanganyar (Januari 2026): harga di tingkat petani anjlok dari Rp35.000/kg menjadi hanya Rp9.500/kg dalam hitungan minggu — jauh di bawah titik impas petani yang sekitar Rp15.000/kg — dipicu oleh melimpahnya pasokan lokal ditambah pasokan tambahan dari luar daerah.
- Kasus kentang di Dieng, Banjarnegara (Januari 2026): harga jatuh ke kisaran Rp9.000–10.000/kg akibat panen raya serentak di beberapa sentra penghasil lain (Jawa Timur, Jawa Barat), sementara biaya produksi terus naik — membuat petani merugi meski hasil panen melimpah.
- Kasus kubis di Magelang: harga sempat anjlok hingga hanya Rp300/kg, jauh di bawah biaya modal, akibat melimpahnya pasokan saat panen raya — mendorong sebagian petani memilih membuang hasil panennya.
- Secara nasional, risiko ini juga bersifat struktural: Harga Pembelian Pemerintah (HPP) untuk gabah/beras pernah ditetapkan di bawah ongkos produksi petani, artinya bahkan instrumen perlindungan harga pemerintah tidak selalu cukup melindungi margin petani saat pasokan berlebih.

**Pola yang konsisten dari seluruh data di atas:** penyebab utama kerugian bukan gagal panen, melainkan **panen raya yang terjadi bersamaan di banyak sentra produksi** — berulang di berbagai komoditas (cabai, kentang, kubis, bawang) dan berbagai wilayah (Jawa Tengah, Jawa Timur, NTT) setiap tahun. Ini menegaskan bahwa masalahnya bersifat **struktural dan dapat diprediksi**, bukan kejadian acak — sehingga sangat mungkin dicegah dengan sistem peringatan dini berbasis data.

### 2.3 Tiga Akar Masalah

1. **Oversupply massal tanpa koordinasi waktu panen** — Petani di daerah yang sama menanam dan memanen komoditas serupa secara bersamaan, membuat harga jatuh drastis di bawah biaya produksi, seperti terlihat konsisten pada seluruh kasus di atas.
2. **Asimetri informasi pasar & logistik** — Petani tidak tahu ada pasar/pembeli di daerah lain dengan harga lebih baik, dan tidak punya cara menghitung apakah keuntungan dari menjual jauh masih sepadan setelah dikurangi ongkos kirim dan risiko pembusukan di jalan.
3. **Tidak ada rencana cadangan saat kondisi buruk** — Ketika harga anjlok atau distribusi terhambat cuaca, petani kehilangan hampir seluruh nilai hasil panen karena tidak ada panduan preservasi atau opsi penyelamatan nilai.

### 2.4 Skenario Masalah yang Divalidasi Data

| Skenario | Deskripsi | Dampak Terukur |
|---|---|---|
| Oversupply massal | Ratusan petani di satu daerah panen komoditas sama dalam minggu yang sama | Harga anjlok 60–75% dalam hitungan minggu (kasus cabai, kentang, kubis di atas) |
| Salah timing panen | Panen dipercepat karena kebutuhan uang mendesak, lalu cuaca buruk menghambat distribusi | Kerugian hingga 40% volume panen |
| Buta pasar alternatif | Harga di kota/wilayah lain jauh lebih tinggi, tapi petani tidak punya visibilitas ke sana | Petani menjual rugi ke tengkulak lokal, padahal ada wilayah dengan permintaan lebih tinggi |
| Margin struktural negatif | NTP subsektor di bawah titik impas (100) dalam periode berkepanjangan | Petani rugi meski panen berhasil secara fisik |

### 2.5 Kesenjangan pada Solusi yang Ada

Platform marketplace pertanian yang ada saat ini (mis. TaniHub, SayurBox) berfokus pada distribusi, bukan pencegahan kerugian; sementara dashboard harga pemerintah (PIHPS/BAPANAS) menyediakan data tapi tidak actionable — tidak ada rekomendasi kapan dan ke mana harus menjual. Belum ada platform yang menyatukan harga real-time, cuaca, shelf life, dan logistik ke dalam satu rekomendasi keputusan yang secara aktif **mencegah** petani mengambil keputusan yang berujung rugi.

### 2.6 Sumber Data

1. Bappenas (2021). *Laporan Kajian Food Loss and Waste di Indonesia.*
2. BPS — Rilis Nilai Tukar Petani (NTP), berbagai periode 2025–2026, bps.go.id.
3. Kompas.id (2023). *Kerugian Mengintai Petani Jelang Panen Raya.*
4. BeritaJatim (2026). *Harga Cabai di Kediri Anjlok — Panen Raya Upper Supply.*
5. Espos.id (2026). *Musim Panen, Petani Cabai Karanganyar Rugi karena Harga Anjlok.*
6. Berita Bersatu (2026). *Harga Kentang Anjlok, Petani Dieng Banjarnegara Terjepit Biaya Produksi.*
7. Jurnal Kesejahteraan Bersama — Pengabdian dan Keberlanjutan Masyarakat, kasus harga kubis di Magelang.
8. Jurnal Statistika Terapan (JSTAR) — *Analisis Dinamika Nilai Tukar Petani di Provinsi Nusa Tenggara Timur.*

---

## 3. Target Pengguna

| Segmen | Deskripsi | Kebutuhan Utama |
|---|---|---|
| **Petani kecil (hortikultura, perishable)** | Pemilik/penggarap lahan skala kecil–menengah | Kapan panen, ke mana jual, cara preservasi |
| **Buyer B2B** (pasar induk, koperasi, restoran, pabrik olahan) | Membutuhkan pasokan komoditas dengan volume & waktu tertentu | Visibilitas stok petani, kepastian pasokan |
| **Pemerintah daerah / NGO / koperasi** (sekunder) | Pemangku kepentingan yang ingin memantau kondisi food loss di wilayahnya | Data agregat, indikator wilayah rawan oversupply |

---

## 4. Tujuan Produk

1. Mengurangi tingkat food loss petani mitra dari baseline ~14% menuju target di bawah 10% dalam 12 bulan operasi di wilayah pilot.
2. Meningkatkan rata-rata pendapatan bersih petani per siklus panen melalui rekomendasi waktu panen dan destinasi jual yang lebih optimal.
3. Membangun basis data pasar & perilaku panen yang, seiring waktu, memungkinkan prediksi oversupply dan harga yang semakin akurat.

---

## 5. Solusi

Tani Pintar menjawab tiga pertanyaan inti petani melalui satu alur keputusan terintegrasi:

> **Kapan sebaiknya saya panen → ke mana saya jual dan berapa untung bersihnya → apa yang saya lakukan kalau kondisinya tidak ideal?**

Sistem menggabungkan:
- **Data harga real-time** (BAPANAS/PIHPS) untuk memprediksi tren harga jangka pendek
- **Data cuaca** (BMKG) untuk memperhitungkan risiko distribusi dan kelayakan preservasi
- **Data shelf life komoditas** (FAO) untuk memfilter opsi jual yang secara fisik tidak layak (waktu tempuh > umur simpan)
- **Data jarak & biaya logistik** (geocoding lokasi petani–pembeli) untuk menghitung margin keuntungan bersih riil
- **AI recommendation engine** yang menerjemahkan seluruh variabel di atas menjadi rekomendasi berbahasa natural yang mudah dipahami petani

---

## 6. Fitur Produk

### 6.1 Modul Petani (Web Dashboard)

#### F1 — Onboarding & Profil Lahan
- Registrasi akun via nomor HP + OTP
- Input profil lahan: lokasi (pin di peta), jenis komoditas, luas lahan, fase tanam saat ini
- **User story:** Sebagai petani, saya ingin mendaftar dan melengkapi profil lahan saya dengan mudah, agar sistem bisa memberi rekomendasi yang sesuai kondisi saya.

#### F2 — Harvest Timing Optimizer
- Input rencana panen: komoditas, estimasi volume, tanggal siap panen
- Output: grafik proyeksi harga 1–2 minggu ke depan, indikator status wilayah (aman/waspada/oversupply), rekomendasi "panen sekarang" atau "tunda sekian hari"
- **User story:** Sebagai petani, saya ingin tahu apakah sebaiknya saya panen sekarang atau menunggu, agar saya tidak menjual di harga terendah.

#### F3 — Sell Destination Matcher
- Tampilan peta & daftar 3 destinasi jual terbaik (pasar induk / buyer B2B / koperasi)
- Kalkulasi otomatis margin bersih: `Net Profit = (Harga Jual × Volume) − (Jarak km × Tarif Logistik/km)`
- Filter otomatis: opsi dieliminasi bila estimasi waktu tempuh melebihi sisa shelf life komoditas
- **User story:** Sebagai petani, saya ingin tahu ke mana saya bisa menjual dengan untung bersih terbaik, bukan sekadar harga tertinggi di kertas.

#### F4 — Preservation Recommender
- Saat harga jelek atau cuaca buruk menghambat distribusi: panduan preservasi (pengeringan cepat, fermentasi sederhana, packaging minimal) berbasis kondisi cuaca lokal
- **User story:** Sebagai petani, saya ingin tahu cara memperpanjang umur simpan hasil panen saya ketika kondisi pasar sedang tidak mendukung.

#### F5 — Waste Value Recovery
- Rekomendasi konversi hasil panen yang kualitasnya menurun ke produk olahan (mis. cabai → sambal kering), matching ke pembeli pakan ternak, estimasi nilai yang masih bisa diselamatkan
- **User story:** Sebagai petani, saya ingin tetap mendapat nilai dari hasil panen saya walau kondisinya sudah tidak ideal untuk dijual segar.

#### F6 — Riwayat & Analitik Pribadi
- Log seluruh keputusan panen/jual dan hasil aktualnya, dibandingkan dengan proyeksi sistem
- **User story:** Sebagai petani, saya ingin melihat riwayat keputusan saya dan seberapa besar rekomendasi sistem membantu pendapatan saya.

### 6.2 Modul Buyer/B2B (Web Dashboard)

#### F7 — Demand Listing
- Buyer (pasar induk, koperasi, restoran, pabrik olahan) mendaftar dan memposting kebutuhan komoditas: jenis, volume, lokasi, tenggat waktu
- **User story:** Sebagai buyer, saya ingin memasang kebutuhan pasokan saya agar bisa dicocokkan otomatis dengan petani yang punya stok sesuai.

#### F8 — Sale List & Auto-Matching
- Petani yang terdeteksi oversupply otomatis masuk antrean Sale List
- Sistem mencocokkan Sale List dengan Demand Listing berdasarkan kesesuaian volume, jarak, dan kelayakan shelf life
- **User story:** Sebagai buyer, saya ingin melihat opsi pasokan yang sudah tersaring berdasarkan kelayakan logistik, bukan daftar mentah semua petani.

### 6.3 Kanal Pendukung (WhatsApp Bot)

#### F9 — Notifikasi Proaktif
- Alert otomatis ke petani terdaftar bila sistem mendeteksi potensi oversupply atau penurunan harga tajam di wilayahnya
- **User story:** Sebagai petani, saya ingin diingatkan lewat WhatsApp kalau ada risiko harga anjlok, meski saya sedang tidak membuka dashboard.

#### F10 — Quick Query
- Petani terdaftar dapat menanyakan info cepat (harga komoditas hari ini, status wilayah) langsung lewat chat
- **User story:** Sebagai petani, saya ingin cek harga komoditas dengan cepat tanpa harus membuka web setiap saat.

> Catatan: WhatsApp bot hanya dapat diakses oleh akun yang sudah terdaftar melalui web dashboard. Registrasi baru tidak dilakukan lewat WhatsApp.

### 6.4 Modul Admin & Analitik Wilayah (Web Dashboard)

#### F11 — Dashboard Agregat Wilayah
- Peta panas (heatmap) potensi oversupply per wilayah, tren adopsi petani, estimasi volume pangan yang berhasil diselamatkan
- Ditujukan untuk pemangku kepentingan sekunder (pemerintah daerah, koperasi, NGO)
- **User story:** Sebagai dinas pertanian daerah, saya ingin melihat kondisi risiko oversupply di wilayah saya secara agregat untuk perencanaan kebijakan.

---

## 7. Prioritas Fitur (MoSCoW)

| Fitur | Prioritas |
|---|---|
| F1 Onboarding & Profil Lahan | Must Have |
| F2 Harvest Timing Optimizer | Must Have |
| F3 Sell Destination Matcher | Must Have |
| F6 Riwayat & Analitik Pribadi | Should Have |
| F9 Notifikasi Proaktif (WA) | Should Have |
| F4 Preservation Recommender | Should Have |
| F7 Demand Listing (Buyer) | Should Have |
| F8 Sale List & Auto-Matching | Could Have |
| F5 Waste Value Recovery | Could Have |
| F10 Quick Query (WA) | Could Have |
| F11 Dashboard Agregat Wilayah | Could Have |

---

## 8. Roadmap Produk

### Tahap 1 — Fondasi (Bulan 1–3)
Membangun inti platform dan memvalidasi proposisi nilai di satu wilayah pilot.
- Web dashboard petani: onboarding, Harvest Timing Optimizer, Sell Destination Matcher
- Integrasi data BAPANAS/PIHPS, BMKG, dan geocoding jarak
- Notifikasi WhatsApp dasar untuk petani terdaftar
- Onboarding petani pilot di satu wilayah (target: 100–300 petani)

### Tahap 2 — Penguatan Nilai (Bulan 4–6)
Melengkapi fitur yang memperkuat retensi dan proposisi ekonomi bagi petani.
- Preservation Recommender & Waste Value Recovery
- Riwayat & Analitik Pribadi (bukti nilai kuantitatif ke petani)
- Modul Buyer/B2B: Demand Listing dan Sale List dasar
- Evaluasi akurasi model prediksi harga & oversupply berdasarkan data riil yang terkumpul

### Tahap 3 — Ekspansi Wilayah & Komoditas (Bulan 7–12)
- Perluasan ke wilayah dan komoditas tambahan berdasarkan hasil validasi Tahap 1–2
- Auto-Matching Sale List–Demand Listing yang lebih matang
- Dashboard Agregat Wilayah untuk pemda/koperasi/NGO sebagai kanal kemitraan/pendapatan tambahan
- Mulai eksplorasi model machine learning internal untuk prediksi harga dan oversupply, menggantikan sebagian logika berbasis aturan (rule-based) di tahap awal

### Tahap 4 — Skalabilitas & Monetisasi (Bulan 13+)
- Integrasi logistik pihak ketiga untuk data ongkos kirim real-time (menggantikan estimasi tarif tetap)
- Model bisnis: komisi transaksi Buyer–Petani, langganan data agregat untuk pemda/NGO, atau kemitraan dengan koperasi
- Ekspansi ke komoditas non-hortikultura sesuai permintaan pasar

---

## 9. Metrik Keberhasilan

| Metrik | Deskripsi |
|---|---|
| Petani aktif terdaftar | Jumlah akun petani yang aktif menggunakan dashboard per bulan |
| Tingkat kepatuhan rekomendasi | % keputusan panen/jual petani yang mengikuti rekomendasi sistem |
| Kenaikan pendapatan bersih | Rata-rata selisih pendapatan petani dibanding baseline tanpa sistem |
| Volume pangan terselamatkan | Estimasi volume (ton) yang tidak terbuang berkat rekomendasi sistem |
| Retensi petani | % petani yang kembali menginput data panen pada siklus berikutnya |
| Volume transaksi Buyer–Petani | Jumlah dan nilai transaksi yang terjadi lewat Demand Listing/Sale List |
