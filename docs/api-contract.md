# API Contract — Tani Pintar Platform

**Versi:** 1.0
**Sumber:** SRS Tani Pintar v1 — Section 6 (Desain API)
**Base URL:** `https://api.tanipintar.id/v1` *(production) · `http://localhost:3000/api` *(pengembangan)*
**Format:** `application/json` (request & response)
**Charset:** UTF-8
**Bahasa antarmuka default:** Bahasa Indonesia (pesan error)

---

## Daftar Isi

1. [Konvensi Umum](#1-konvensi-umum)
   1.1 Konvensi Penamaan · 1.2 Autentikasi & Otorisasi · 1.3 Format Error · 1.4 Pagination · 1.5 Filtering · 1.6 Idempotency · 1.7 Rate Limiting
2. [Tipe Data Bersama](#2-tipe-data-bersama)
3. `/api/auth` — Autentikasi & OTP (FR-01, FR-15, FR-18)
4. `/api/farmers` — Profil Petani & Lahan (FR-02, FR-08)
5. `/api/buyers` — Profil Buyer B2B (FR-09)
6. `/api/harvest-plans` — Rencana Panen (FR-03)
7. `/api/recommendations` — Rekomendasi AI (FR-04, FR-05, FR-06, FR-07, FR-08)
8. `/api/listings/demand` — Demand Listing (FR-10)
9. `/api/listings/sale` — Sale Listing (FR-11)
10. `/api/matching` — Auto-Matching Engine (FR-12)
11. `/api/notifications` — WhatsApp Bot & Notifikasi (FR-13, FR-14, FR-15)
12. `/api/admin` — Admin & Analitik (FR-16, FR-17)
13. [Ringkasan Kode Status HTTP](#13-ringkasan-kode-status-http)
14. [Ringkasan Environment Variables](#14-ringkasan-environment-variables)

---

## 1. Konvensi Umum

### 1.1 Konvensi Penamaan

| Elemen | Konvensi | Contoh |
|---|---|---|
| Path | `kebab-case`, jamak untuk koleksi | `/api/harvest-plans` |
| Field JSON | `camelCase` | `fullName`, `readyToHarvestDate` |
| Enum value | `UPPER_SNAKE_CASE` | `PERSIAPAN_LAHAN`, `OPEN`, `MATCHED` |
| Header | `Header-Case` standar HTTP | `Authorization`, `X-Request-Id` |
| ID resource | `cuid` (string) | `clx...` |

### 1.2 Autentikasi & Otorisasi

- Skema: **JWT Bearer** custom (diimplementasi sendiri, tanpa library pihak ketiga). Access token (15 menit) + refresh token (7 hari).
- Header wajib pada endpoint terproteksi:
  ```
  Authorization: Bearer <access_token>
  ```
- Tiga peran (`UserRole`): `PETANI`, `BUYER`, `ADMIN` — RBAC per endpoint (FR-18).

| Simbol pada dokumen | Arti |
|---|---|
| 🔓 Publik | tanpa autentikasi |
| 🔐 Petani | `role: PETANI` |
| 🔐 Buyer | `role: BUYER` |
| 🔐 Admin | `role: ADMIN` |
| 🔐 Terproteksi | user terautentikasi (peran apa pun) |
| 🔑 Internal | hanya dipanggil job/service backend (bukan publik) |

### 1.3 Format Error

Seluruh endpoint mengembalikan error dalam format tunggal & konsisten:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Payload tidak valid.",
    "issues": [ { "path": ["fullName"], "message": "Nama lengkap minimal 3 karakter" } ]
  }
}
```

- `code`: salah satu dari kode baku (lihat §13).
- `message`: deskripsi singkat bahasa Indonesia.
- `issues`: opsional, hadir saat `code = VALIDATION_ERROR` (berisi detail field error dari Zod).

### 1.4 Pagination

Endpoint list memakai cursor-offset hybrid dengan **query parameter**:

| Param | Tipe | Default | Batas |
|---|---|---|---|
| `page` | integer | 1 | ≥ 1 |
| `pageSize` | integer | 20 | 1–100 |

> **Sorting:** urutan hasil **ditentukan server-side (hardcode)** per endpoint, bukan via query param.
> Default seluruh list adalah `createdAt DESC` (terbaru di atas) kecuali dinyatakan lain
> secara eksplisit pada dokumen endpoint. Klien tidak dapat mengubah kriteria sort.
> Alasan: dataset scope sebagian besar collection bersifat per-user dan kecil;
> pengurutan ulang dapat dilakukan client-side bila diperlukan.

Response list selalu membungkus `{ data, meta }`:

```json
{
  "data": [ /* array resource */ ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 137,
    "totalPages": 7
  }
}
```

### 1.5 Filtering

- Field filter dilewatkan sebagai query param dengan nama field, mis. `?commodityType=Bawang%20Merah&status=OPEN`.
- Sorting **tidak diekspos** sebagai query param — urutan ditentukan server-side (lihat §1.4).

### 1.6 Idempotency

- Endpoint `POST` yang berpotensi duplikasi (auth OTP, kirim notifikasi) menerima header opsional:
  ```
  Idempotency-Key: <uuid-v4>
  ```
- Backend cache key ini di Redis (TTL 24 jam) untuk mengembalikan response pertama yang sama.

### 1.7 Rate Limiting (NFR: Keamanan)

| Endpoint group | Batas |
|---|---|
| `/api/auth/*` (publik) | 10 req/menit per IP |
| `/api/notifications/webhook` (Twilio) | 100 req/menit per IP (verifikasi signature) |
| Endpoint terautentikasi lainnya | 60 req/menit per user |
| `/api/admin/*` | 120 req/menit per user |

Header response: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

---

## 2. Tipe Data Bersama

### 2.1 Tipe Primitif

| Nama | Tipe JSON | Catatan |
|---|---|---|
| `UUID` | string | `cuid` |
| `ISO8601` | string | `2026-07-17T04:05:11.560Z` |
| `Coordinate` | `{ latitude: number, longitude: number }` | WGS-84; lat −90..90, lng −180..180 |
| `Money` | number | float IDR; `pricePerUnit` dll |
| `Volume` | `{ value: number, unit: string }` | `unit` ∈ {`kg`,`ton`,`kwintal`} |

### 2.2 Enum Bersama (extends SRS Section 5)

```ts
enum UserRole { PETANI, BUYER, ADMIN }
enum PlantingPhase { PERSIAPAN_LAHAN, PENANAMAN, PEMELIHARAAN, PANEN, PASCA_PANEN }
enum HarvestPlanStatus { DRAFT, PLANNED, READY, HARVESTED, CANCELLED }
enum DemandListingStatus { OPEN, FULFILLED, CLOSED, CANCELLED }
enum SaleListingStatus { OPEN, MATCHED, CLOSED, CANCELLED }
enum MatchStatus { PROPOSED, ACCEPTED, REJECTED, EXPIRED }
enum TransactionStatus { PENDING, IN_PROGRESS, COMPLETED, CANCELLED }
enum NotificationChannel { WHATSAPP, SMS, EMAIL }
enum NotificationStatus { QUEUED, SENT, DELIVERED, FAILED }
enum RecommendationType { HARVEST_TIMING, SELL_DESTINATION, PRESERVATION, WASTE_RECOVERY }
enum BuyerBusinessType { PASAR_INDUK, KOPERASI, RESTORAN, PABRIK_OLAHAN, LAINNYA }
```

### 2.3 Resource Object Bentukan

**UserObject**
```jsonc
{
  "id": "clx...",
  "email": "string|null",
  "phoneNumber": "628123456789",
  "role": "PETANI",
  "isActive": true,
  "isPhoneVerified": false,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

**CoordinateObject**
```jsonc
{ "latitude": -6.8703, "longitude": 109.0398, "locationName": "Kec. Brebes" }
```

**PageMeta** — lihat §1.4.

---

## 3. `/api/auth` — Autentikasi & OTP

Sesuai FR-01 (registrasi+OTP), FR-15 (validasi akun WA), FR-18 (RBAC). Diimplementasi custom (JWT + OTP), tanpa library auth pihak ketiga.

### 3.1 🔓 `POST /api/auth/register`

Mendaftarkan akun baru petani/buyer. OTP dikirim via SMS/WhatsApp.

**Request**
```json
{
  "fullName": "Marchella Putri Sannie",
  "phoneNumber": "8123456789",
  "password": "••••••••",
  "role": "PETANI"
}
```

| Field | Validasi |
|---|---|
| `fullName` | string 3–120 char |
| `phoneNumber` | string 9–13 digit |
| `password` | string ≥ 8 char (hash bcrypt di backend) |
| `role` | enum `PETANI` \| `BUYER` |

**Response 201**
```json
{
  "userId": "clx...",
  "phoneNumber": "628123456789",
  "role": "PETANI",
  "otpSent": true,
  "otpExpiresAt": "ISO8601"
}
```

**Error**
- `400 VALIDATION_ERROR`
- `409 CONFLICT` — nomor HP/email sudah terdaftar

### 3.2 🔓 `POST /api/auth/verify-otp`

Verifikasi OTP dari registrasi (FR-01) atau login OTP.

**Request**
```json
{ "phoneNumber": "628123456789", "code": "123456", "purpose": "REGISTER" }
```

| Field | Validasi |
|---|---|
| `code` | string 6 digit |
| `purpose` | enum `REGISTER` \| `LOGIN` \| `RESET` |

**Response 200**
```json
{
  "user": { /* UserObject */ },
  "session": { "token": "...", "refreshToken": "...", "expiresAt": "ISO8601" }
}
```

**Error**
- `400 VALIDATION_ERROR`
- `410 OTP_EXPIRED` — OTP lewat TTL 5 menit
- `429 OTP_MAX_ATTEMPTS` — >5 kesalahan percobaan

### 3.3 🔓 `POST /api/auth/resend-otp`

**Request** `{ "phoneNumber": "628123456789", "purpose": "REGISTER" }`
**Response 200** `{ "otpSent": true, "otpExpiresAt": "ISO8601" }`

### 3.4 🔓 `POST /api/auth/login`

Login dengan nomor HP + password.

**Request**
```json
{ "phoneNumber": "628123456789", "password": "••••••••" }
```

**Response 200**
```json
{
  "user": { /* UserObject */ },
  "session": { "token": "...", "refreshToken": "...", "expiresAt": "ISO8601" }
}
```

**Error**
- `401 UNAUTHORIZED` — kredensial salah
- `403 ACCOUNT_DISABLED` — `isActive = false`

### 3.5 🔐 `POST /api/auth/refresh`

Refresh access token.

**Request** `{ "refreshToken": "..." }`
**Response 200** `{ "token": "...", "expiresAt": "ISO8601" }`
**Error** `401 UNAUTHORIZED` — refresh token invalid/expired.

### 3.6 🔐 `POST /api/auth/logout`

**Request** kosong.
**Response 204** (no content).

### 3.7 🔐 `GET /api/auth/me`

Mengambil user & sesi saat ini.

**Response 200**
```json
{
  "user": { /* UserObject, plus farmerProfile/buyerProfile jika ada */ }
}
```

---

## 4. `/api/farmers` — Profil Petani & Lahan (FR-02, FR-08)

### 4.1 🔐 `POST /api/farmers/profile`

**Role:** `PETANI`.

**Request**
```json
{
  "fullName": "Marchella Putri Sannie",
  "locationName": "Kec. Brebes, Kabupaten Brebes",
  "latitude": -6.8703,
  "longitude": 109.0398,
  "primaryCommodity": "Bawang Merah",
  "contactPhone": "628123456789"
}
```

**Response 201** — `FarmerProfileObject`:
```json
{
  "id": "clx...",
  "userId": "clx...",
  "fullName": "Marchella Putri Sannie",
  "locationName": "Kec. Brebes, Kabupaten Brebes",
  "latitude": -6.8703,
  "longitude": 109.0398,
  "primaryCommodity": "Bawang Merah",
  "contactPhone": "628123456789",
  "isVerified": false,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

**Error**
- `400 VALIDATION_ERROR` — payload tidak valid (Zod).
- `401 UNAUTHORIZED`, `403 FORBIDDEN_ROLE`.
- `409 CONFLICT` — profil untuk `userId` sudah ada (gunakan `PATCH`).

### 4.2 🔐 `GET /api/farmers/profile`

**Role:** `PETANI`.
**Response 200** — `FarmerProfileObject` (sama struktur dengan 4.1).
**Error** `401`, `403`, `404 NOT_FOUND`.

### 4.3 🔐 `PATCH /api/farmers/profile`

**Role:** `PETANI`, hanya pemilik. Partial update — semua field pada §4.1 opsional.
**Response 200** — `FarmerProfileObject` diperbarui.
**Error** `400`, `401`, `403`, `404`.

### 4.4 🔐 `POST /api/farmers/lands`

**Role:** `PETANI`.

**Request**
```json
{
  "name": "Lahan Bawang Utara",
  "commodityType": "Bawang Merah",
  "areaSize": 0.5,
  "areaUnit": "hektar",
  "plantingPhase": "PENANAMAN",
  "latitude": -6.8710,
  "longitude": 109.0401,
  "address": "Jl. Raya Brebes No. 12"
}
```

| Field | Validasi |
|---|---|
| `name` | string 2–120 char |
| `commodityType` | string 2–100 char |
| `areaSize` | number > 0 |
| `areaUnit` | enum `hektar` \| `are` \| `meter_persegi`; default `hektar` |
| `plantingPhase` | enum `PlantingPhase`; default `PERSIAPAN_LAHAN` |
| `latitude`/`longitude` | number valid range; opsional |
| `address` | string ≤ 500 char; opsional |

**Response 201** — `LandObject`:
```json
{
  "id": "clx...",
  "farmerProfileId": "clx...",
  "name": "Lahan Bawang Utara",
  "commodityType": "Bawang Merah",
  "areaSize": 0.5,
  "areaUnit": "hektar",
  "plantingPhase": "PENANAMAN",
  "latitude": -6.871,
  "longitude": 109.0401,
  "address": "Jl. Raya Brebes No. 12",
  "photoUrl": null,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### 4.5 🔐 `GET /api/farmers/lands`

**Role:** `PETANI`.

**Query Params**
| Param | Tipe | Default | Catatan |
|---|---|---|---|
| `commodityType` | string | — | filter |
| `plantingPhase` | enum | — | filter |
| `page` | int | 1 | §1.4 |
| `pageSize` | int | 20 | §1.4 |

**Response 200** — `{ data: LandObject[], meta: PageMeta }` (urutan: `createdAt DESC`).

### 4.6 🔐 `GET /api/farmers/lands/{id}`

**Role:** `PETANI`, ownership check (`land.farmerProfileId === profile.id`).
**Response 200** — `LandObject`.
**Error** `401`, `403 FORBIDDEN_OWNERSHIP`, `404 NOT_FOUND`.

### 4.7 🔐 `PATCH /api/farmers/lands/{id}`

**Role:** `PETANI`, ownership check. Partial update.
**Response 200** — `LandObject` diperbarui.

### 4.8 🔐 `DELETE /api/farmers/lands/{id}`

**Role:** `PETANI`, ownership check. Cascade delete `HarvestPlan` terkait (sesuai skema Prisma).
**Response 204** (no content).

---

## 5. `/api/buyers` — Profil Buyer B2B (FR-09)

### 5.1 🔐 `POST /api/buyers/profile`

**Role:** `BUYER`.

**Request**
```json
{
  "businessName": "Pasar Induk Cipinang",
  "businessType": "PASAR_INDUK",
  "locationName": "Jakarta Timur",
  "latitude": -6.2198,
  "longitude": 106.8615,
  "capacityAbsorption": 5000,
  "capacityUnit": "kg",
  "contactPhone": "628123456789"
}
```

| Field | Validasi |
|---|---|
| `businessName` | string 3–150 char |
| `businessType` | enum `BuyerBusinessType`; default `LAINNYA` |
| `locationName` | string ≤ 200; opsional |
| `latitude`/`longitude` | number valid; opsional |
| `capacityAbsorption` | number > 0; opsional |
| `capacityUnit` | string ≤ 20; opsional |
| `contactPhone` | string 9–13 digit; opsional |

**Response 201** — `BuyerProfileObject`:
```json
{
  "id": "clx...",
  "userId": "clx...",
  "businessName": "Pasar Induk Cipinang",
  "businessType": "PASAR_INDUK",
  "locationName": "Jakarta Timur",
  "latitude": -6.2198,
  "longitude": 106.8615,
  "capacityAbsorption": 5000,
  "capacityUnit": "kg",
  "contactPhone": "628123456789",
  "isVerified": false,
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

**Error** `400`, `401`, `403`, `409 CONFLICT`.

### 5.2 🔐 `GET /api/buyers/profile`

**Role:** `BUYER`. Mengembalikan `BuyerProfileObject`. Error `401`, `403`, `404`.

### 5.3 🔐 `PATCH /api/buyers/profile`

**Role:** `BUYER`. Partial update. Response 200 — `BuyerProfileObject`.

### 5.4 🔐 `GET /api/buyers/search` *(opsional, internal)*

Pencarian buyer publik (untuk referensi matching). Filter `businessType`, `commodity` (dari demand listing). Response list ringkas `BuyerProfileSummaryObject`.

---

## 6. `/api/harvest-plans` — Rencana Panen (FR-03)

### 6.1 🔐 `POST /api/harvest-plans`

**Role:** `PETANI`. Membuat rencana panen; dapat memicu kalkulasi rekomendasi async (FR-04).

**Request**
```json
{
  "landId": "clx...",
  "commodity": "Bawang Merah",
  "estimatedVolume": 1200,
  "volumeUnit": "kg",
  "readyToHarvestDate": "2026-08-15",
  "notes": "Tanaman 80 hari"
}
```

| Field | Validasi |
|---|---|
| `landId` | UUID eksisting milik petani; opsional (`onDelete: SetNull`) |
| `commodity` | string 2–100 char |
| `estimatedVolume` | number > 0 |
| `volumeUnit` | enum `kg` \| `ton` \| `kwintal`; default `kg` |
| `readyToHarvestDate` | ISO date, harus ≥ hari ini |
| `notes` | string ≤ 1000; opsional |

**Response 201** — `HarvestPlanObject`:
```json
{
  "id": "clx...",
  "farmerProfileId": "clx...",
  "landId": "clx...",
  "commodity": "Bawang Merah",
  "estimatedVolume": 1200,
  "volumeUnit": "kg",
  "readyToHarvestDate": "2026-08-15",
  "actualVolume": null,
  "status": "PLANNED",
  "notes": "Tanaman 80 hari",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

**Error** `400`, `401`, `403`, `404 NOT_FOUND` (landId tidak ditemukan/bukan milik).

### 6.2 🔐 `GET /api/harvest-plans`

**Role:** `PETANI` (milik sendiri) atau `ADMIN` (semua).

**Query Params**
| Param | Tipe | Default |
|---|---|---|
| `status` | enum `HarvestPlanStatus` | — |
| `commodity` | string | — |
| `dateFrom` / `dateTo` | ISO date | — |
| `page`, `pageSize` | — | §1.4 |

**Response 200** — `{ data: HarvestPlanObject[], meta: PageMeta }` (urutan: `readyToHarvestDate ASC`).

### 6.3 🔐 `GET /api/harvest-plans/{id}`

**Role:** `PETANI` (ownership) atau `ADMIN`.
**Response 200** — `HarvestPlanObject` (+ `land` bila include).

### 6.4 🔐 `PATCH /api/harvest-plans/{id}`

**Role:** `PETANI` (ownership). Partial update.
Catatan: transisi status `READY → HARVESTED` wajib mengisi `actualVolume`.

### 6.5 🔐 `DELETE /api/harvest-plans/{id}`

**Role:** `PETANI` (ownership). Hanya bila `status = DRAFT` atau `PLANNED`.
**Response 204**.

### 6.6 🔐 `POST /api/harvest-plans/{id}/trigger-recommendations`

**Role:** `PETANI`. Memicu backend menjalankan kalkulasi Harvest Timing Optimizer (FR-04), Sell Destination Matcher (FR-05), Preservation Recommender (FR-06), Waste Value Recovery (FR-07).

**Request** opsional `{ "force": false }`.
**Response 202**:
```json
{
  "jobId": "clx...",
  "status": "QUEUED",
  "estimatedCompletionAt": "ISO8601"
}
```

---

## 7. `/api/recommendations` — Rekomendasi AI (FR-04..08)

### 7.1 🔐 `GET /api/recommendations?harvestPlanId={id}`

**Role:** `PETANI` (ownership plan) atau `ADMIN`. Ambil daftar rekomendasi untuk satu `harvestPlan`.

**Query Params**
| Param | Tipe | Default |
|---|---|---|
| `harvestPlanId` | UUID | wajib |
| `type` | enum `RecommendationType` | — |
| `isRead` | boolean | — |
| `page`, `pageSize` | — | §1.4 |

**Response 200** — `{ data: RecommendationObject[], meta: PageMeta }` (urutan: `createdAt DESC`).

**RecommendationObject**
```json
{
  "id": "clx...",
  "harvestPlanId": "clx...",
  "type": "HARVEST_TIMING",
  "jsonData": {
    "projectedPrice": 32000,
    "projectedPriceDate": "2026-08-20",
    "oversupplyStatus": "AMAN",
    "suggestedHarvestDate": "2026-08-18",
    "confidence": 0.78
  },
  "naturalLanguageText": "Disarankan panen 18 Agustus 2026...",
  "modelVersion": "rule-based-v1",
  "isRead": false,
  "createdAt": "ISO8601"
}
```

**Detail tipe pada `jsonData` per `type`:**

| `type` | field kunci di `jsonData` | FR |
|---|---|---|
| `HARVEST_TIMING` | `projectedPrice`, `oversupplyStatus`, `suggestedHarvestDate`, `confidence` | FR-04 |
| `SELL_DESTINATION` | `destinations: [{ buyerId, buyerName, netMargin, distanceKm, logisticsCost, shelfLifeFeasible }]` (top 3) | FR-05 |
| `PRESERVATION` | `weatherSummary`, `recommendedActions[]`, `shelfLifeDays` | FR-06 |
| `WASTE_RECOVERY` | `recommendations: [{ option, expectedRecoveryValue, description }]` | FR-07 |

### 7.2 🔐 `GET /api/recommendations/{id}`

**Response 200** — `RecommendationObject`.

### 7.3 🔐 `PATCH /api/recommendations/{id}/read`

**Role:** `PETANI`. Menandai sudah dibaca.
**Response 200** — `{ "id": "...", "isRead": true }`.

### 7.4 🔐 `GET /api/recommendations/history`

**Role:** `PETANI`. Riwayat keputusan + perbandingan aktual vs proyeksi (FR-08).

**Query** `?farmerProfileId=` (auto dari sesi), `?dateFrom`, `?dateTo`.
**Response 200**
```json
{
  "data": [
    {
      "harvestPlanId": "clx...",
      "commodity": "Bawang Merah",
      "createdAt": "ISO8601",
      "type": "HARVEST_TIMING",
      "projected": { "pricePerUnit": 32000 },
      "actual":    { "pricePerUnit": 31000 },
      "deltaPercent": -3.125
    }
  ],
  "meta": { /* PageMeta */ }
}
```

---

## 8. `/api/listings/demand` — Demand Listing (FR-10)

### 8.1 🔐 `POST /api/listings/demand`

**Role:** `BUYER`.

**Request**
```json
{
  "commodity": "Bawang Merah",
  "volume": 3000,
  "unit": "kg",
  "locationName": "Pasar Induk Cipinang",
  "latitude": -6.2198,
  "longitude": 106.8615,
  "maxPricePerUnit": 35000,
  "deadline": "2026-08-25",
  "description": "Kualitas grade A, ukuran sedang"
}
```

| Field | Validasi |
|---|---|
| `commodity` | string 2–100 |
| `volume` | number > 0 |
| `unit` | enum `kg` \| `ton` \| `kwintal` |
| `maxPricePerUnit` | number > 0; opsional |
| `deadline` | ISO date ≥ hari ini |

**Response 201** — `DemandListingObject`:
```json
{
  "id": "clx...",
  "buyerProfileId": "clx...",
  "commodity": "Bawang Merah",
  "volume": 3000,
  "unit": "kg",
  "locationName": "Pasar Induk Cipinang",
  "latitude": -6.2198,
  "longitude": 106.8615,
  "maxPricePerUnit": 35000,
  "deadline": "2026-08-25",
  "description": "Kualitas grade A, ukuran sedang",
  "status": "OPEN",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### 8.2 🔐 `GET /api/listings/demand`

**Role:** `BUYER` (milik sendiri), `PETANI` (baca semua untuk browse), `ADMIN`.

**Query Params**
| Param | Tipe |
|---|---|
| `commodity` | string |
| `status` | enum |
| `buyerProfileId` | UUID |
| `minVolume`, `maxVolume` | number |
| `dateFrom`, `dateTo` | ISO date |
| `near` | `{ latitude, longitude, radiusKm }` (geospatial filter) |
| `page`, `pageSize` | §1.4 |

**Response 200** — `{ data: DemandListingObject[], meta: PageMeta }` (urutan: `deadline ASC`).

### 8.3 🔐 `GET /api/listings/demand/{id}`

Ownership: `BUYER` pemilik / `PETANI` lihat / `ADMIN`.

### 8.4 🔐 `PATCH /api/listings/demand/{id}`

**Role:** `BUYER` pemilik. Partial update. Status `CLOSED`/`FULFILLED` tidak dapat di-edit fieldnon-status.

### 8.5 🔐 `DELETE /api/listings/demand/{id}`

**Role:** `BUYER` pemilik atau `ADMIN`. Soft-cancel (`status = CANCELLED`).

---

## 9. `/api/listings/sale` — Sale Listing (FR-11)

### 9.1 🔐 `POST /api/listings/sale`

**Role:** `PETANI`. Dapat dibuat manual atau auto-generated saat oversupply terdeteksi (FR-11).

**Request**
```json
{
  "harvestPlanId": "clx...",
  "commodity": "Bawang Merah",
  "volume": 800,
  "unit": "kg",
  "pricePerUnit": 30000,
  "locationName": "Kec. Brebes",
  "latitude": -6.8703,
  "longitude": 109.0398,
  "isOversupply": true
}
```

| Field | Validasi |
|---|---|
| `harvestPlanId` | UUID, harus milik petani; opsional |
| `commodity` | string 2–100 |
| `volume` | number > 0 |
| `pricePerUnit` | number > 0; opsional |
| `isOversupply` | boolean; default `false` |

**Response 201** — `SaleListingObject` (struktur analog DemandListingObject, plus `isOversupply`, `farmerProfileId`).

### 9.2 🔐 `GET /api/listings/sale`

**Role:** `BUYER` (browse), `PETANI` (milik sendiri), `ADMIN`.

**Query Params** — serupa §8.2, plus:
| Param | Catatan |
|---|---|
| `isOversupply` | boolean |
| `minPricePerUnit`, `maxPricePerUnit` | number |
| `near` | filter geospatial |

### 9.3 🔐 `GET /api/listings/sale/{id}`, `PATCH`, `DELETE`

Operasi tunggal; ownership `PETANI` pemilik atau `ADMIN`.

---

## 10. `/api/matching` — Auto-Matching Engine (FR-12)

### 10.1 🔐 `POST /api/matching/run`

**Role:** `ADMIN` (job terjadwal) atau sistem internal. Memicu engine mencocokkan sale & demand listing berdasarkan jarak, volume, shelf life.

**Request** opsional:
```json
{ "filters": { "commodity": "Bawang Merah", "region": "BREBES" } }
```

**Response 202**
```json
{
  "jobId": "clx...",
  "status": "RUNNING",
  "estimatedMatches": 42,
  "estimatedCompletionAt": "ISO8601"
}
```

### 10.2 🔐 `GET /api/matching/jobs/{jobId}`

**Response 200**
```json
{
  "jobId": "clx...",
  "status": "COMPLETED",
  "matchesCreated": 38,
  "startedAt": "ISO8601",
  "finishedAt": "ISO8601"
}
```

### 10.3 🔐 `GET /api/matches`

**Role:** `PETANI` (miliknya sebagai farmer), `BUYER` (miliknya sebagai buyer), `ADMIN` (semua).

**Query Params**
| Param | Tipe |
|---|---|
| `status` | enum `MatchStatus` |
| `saleListingId` / `demandListingId` | UUID |
| `farmerProfileId` / `buyerProfileId` | UUID |
| `minScore` | number 0–100 |
| `page`, `pageSize` | §1.4 |

**Response 200** — `{ data: MatchObject[], meta }` (urutan: `score DESC`).

**MatchObject**
```json
{
  "id": "clx...",
  "saleListingId": "clx...",
  "demandListingId": "clx...",
  "farmerProfileId": "clx...",
  "buyerProfileId": "clx...",
  "score": 87.5,
  "netMargin": 2400000,
  "distanceKm": 312.4,
  "logisticsCost": 600000,
  "shelfLifeFeasible": true,
  "recommendation": "Pertemukan di gudang Brebes",
  "status": "PROPOSED",
  "createdAt": "ISO8601",
  "updatedAt": "ISO8601"
}
```

### 10.4 🔐 `GET /api/matches/{id}`

### 10.5 🔐 `PATCH /api/matches/{id}/accept`

**Role:** `PETANI` atau `BUYER` pihak match. Mengubah `status` → `ACCEPTED`, memicu creation `transaction`.

**Response 200** — `{ match: MatchObject, transactionId: "clx..." }`.

### 10.6 🔐 `PATCH /api/matches/{id}/reject`

**Request** opsional `{ "reason": "..." }`. `status` → `REJECTED`.

### 10.7 🔐 `POST /api/matches/{id}/transaction`

Konfirmasi transaksi & update `Transaction.status`. (Lihat entitas `Transaction` di skema.)

**Request** `{ "actualVolume": 800, "pricePerUnit": 30000, "notes": "..." }`.
**Response 201** — `TransactionObject`.

---

## 11. `/api/notifications` — WhatsApp Bot & Notifikasi (FR-13, FR-14, FR-15)

### 11.1 🔓 `POST /api/notifications/webhook`

Webhook masuk dari Twilio (WhatsApp). Verifikasi signature `X-Twilio-Signature` wajib (rate limit 100/min).

**Request** (form-urlencoded)
```
From=whatsapp%3A%2B628123456789
Body=STATUS+wilayah+Brebes
MessageSid=SM...
```

**Response 200** — `{ "received": true }`.

Bot akan:
1. Validasi nomor terdaftar & terverifikasi di web (FR-15). Jika tidak: balas "Akun belum terdaftar. Silakan mendaftar di https://tanipintar.id/register".
2. Bila valid, proses quick query (FR-14) atau panggil internal API untuk reply.

### 11.2 🔑 `POST /api/notifications/send` *(internal)*

Dipanggil job scheduler (FR-13) untuk mengirim notifikasi proaktif (oversupply/price drop).

**Request**
```json
{
  "userId": "clx...",
  "channel": "WHATSAPP",
  "type": "OVERSUPPLY_ALERT",
  "messageContent": "⚠️ Deteksi potensi oversupply bawang merah di wilayah Anda. Harga proyeksi turun 12%. Lihat dashboard: https://tanipintar.id/dashboard",
  "metadata": { "harvestPlanId": "clx..." }
}
```

**Response 202** — `{ "notificationId": "clx...", "status": "QUEUED" }`.

### 11.3 🔑 `POST /api/notifications/quick-query` *(internal)*

Dipanggil oleh webhook handler untuk reply chat petani (FR-14).

**Request**
```json
{
  "phoneNumber": "628123456789",
  "query": "harga bawang merah hari ini"
}
```

**Response 200**
```json
{
  "reply": "Harga Bawang Merah di Brebes: Rp 32.000/kg (naik 2% kemarin). Sumber: BAPANAS/PIHPS."
}
```

### 11.4 🔐 `GET /api/notifications`

**Role:** `PETANI` (miliknya), `ADMIN` (semua). Log pengirim notifikasi.

**Query** `?status`, `?channel`, `?type`, `?dateFrom`, `?dateTo`, `page`, `pageSize`.

**Response 200** — `{ data: NotificationLogObject[], meta }`:
```json
{
  "id": "clx...",
  "userId": "clx...",
  "channel": "WHATSAPP",
  "type": "OVERSUPPLY_ALERT",
  "toAddress": "628123456789",
  "messageContent": "...",
  "status": "DELIVERED",
  "externalSid": "SM...",
  "errorMessage": null,
  "sentAt": "ISO8601",
  "deliveredAt": "ISO8601",
  "createdAt": "ISO8601"
}
```

---

## 12. `/api/admin` — Admin & Analitik (FR-16, FR-17)

### 12.1 🔐 `GET /api/admin/analytics/overview`

**Role:** `ADMIN`. Dashboard agregat wilayah (FR-16).

**Query** `?region`, `?province`, `?dateFrom`, `?dateTo`.

**Response 200**
```json
{
  "totalFarmers": 1240,
  "totalBuyers": 87,
  "totalHarvestPlans": 5300,
  "totalMatches": 1820,
  "totalTransactionsValue": 4500000000,
  "volumeSaved": 24000,
  "adoptionTrend": [
    { "month": "2026-01", "newFarmers": 120, "newBuyers": 8 }
  ]
}
```

### 12.2 🔐 `GET /api/admin/analytics/oversupply-heatmap`

**Response 200** — array titik heatmap:
```json
{
  "points": [
    { "region": "Brebes", "latitude": -6.87, "longitude": 109.03, "intensity": 0.78, "commodity": "Bawang Merah", "volumeAtRisk": 21000 }
  ],
  "generatedAt": "ISO8601"
}
```

### 12.3 🔐 `GET /api/admin/analytics/commodity-trend`

**Query** `?commodity`, `?region`, `?days` (default 30).
**Response 200** — time series harga & volume:
```json
{
  "commodity": "Bawang Merah",
  "series": [
    { "date": "2026-07-01", "price": 30000, "volume": 12000 }
  ]
}
```

### 12.4 🔐 `GET /api/admin/users`

**Role:** `ADMIN`. Daftar pengguna + filter (FR-17).

**Query** `?role`, `?isActive`, `?isPhoneVerified`, `?q` (search), `page`, `pageSize`.

**Response 200** — `{ data: UserObject[], meta }`.

### 12.5 🔐 `PATCH /api/admin/users/{id}`

**Role:** `ADMIN`. Aktifkan/nonaktifkan akun atau tandai verified.
**Request** `{ "isActive": false }` atau `{ "isPhoneVerified": true }`.
**Response 200** — `UserObject` diperbarui.

### 12.6 🔐 `GET /api/admin/users/{id}`

Detail akun + profile terkait. **Response 200** — `UserObject` + `farmerProfile`/`buyerProfile`.

---

## 13. Ringkasan Kode Status HTTP

| Kode | `code` (error.code) | Kapan |
|---|---|---|
| 200 | — | GET/PATCH berhasil |
| 201 | — | POST create berhasil |
| 202 | — | Async job diterima (matching, recommendation trigger, send notification) |
| 204 | — | DELETE berhasil / logout |
| 400 | `VALIDATION_ERROR` | payload tidak lolos Zod |
| 401 | `UNAUTHORIZED` | sesi tidak ada/expired |
| 403 | `FORBIDDEN_ROLE` | peran tidak diizinkan (RBAC) |
| 403 | `FORBIDDEN_OWNERSHIP` | bukan pemilik resource |
| 403 | `ACCOUNT_DISABLED` | `isActive=false` saat login |
| 404 | `NOT_FOUND` | resource tidak ditemukan |
| 409 | `CONFLICT` | duplikat(unique constraint) |
| 410 | `OTP_EXPIRED` | OTP lewat TTL |
| 422 | `BUSINESS_RULE_VIOLATION` | lolos validasi tapi melanggar aturan bisnis |
| 429 | `RATE_LIMITED` | rate limit |
| 429 | `OTP_MAX_ATTEMPTS` | salah OTP > 5x |
| 500 | `INTERNAL_ERROR` | error tak terduga |
| 502 | `EXTERNAL_API_ERROR` | BAPANAS/BMKG/Twilio/Claude gagal |
| 503 | `SERVICE_UNAVAILABLE` | maintenance/dependency down |

---

## 14. Ringkasan Environment Variables

| Var | Wajib | Catatan |
|---|---|---|
| `DATABASE_URL` | ✓ | pooler transaksi Supabase (port 6543, runtime app) |
| `DIRECT_URL` | ✓ | session pooler (port 5432, untuk prisma migrate/db push) |
| `JWT_SECRET` | ✓ | secret JWT ≥ 32 char |
| `JWT_ISSUER` | opsional | `iss` claim JWT (default `tani-pintar`) |
| `API_BASE_URL` | ✓ | base URL backend (dipakai OTP link, dll.) |
| `TWILIO_ACCOUNT_SID` | ✓ | WhatsApp Business API |
| `TWILIO_AUTH_TOKEN` | ✓ | verifikasi signature webhook |
| `TWILIO_WHATSAPP_FROM` | ✓ | nomor sandbox/produksi |
| `ANTHROPIC_API_KEY` | ✓ | Claude API untuk natural language recommendation |
| `BAPANAS_SCRAPER_URL` | ✓ | endpoint internal scraper harga BAPANAS/PIHPS |
| `BMKG_API_URL` | ✓ | endpoint API prakiraan cuaca BMKG |
| `NOMINATIM_URL` | opsional | self-hosted bila volume tinggi; default API publik OSM |
| `FAO_DATASET_URL` | opsional | referensi shelf life (di-cache di DB) |
| `REDIS_URL` | ✓ | cache + queue + rate limit + idempotency |
| `LOGISTIC_COST_PER_KM` | ✓ | tarif tetap awal (lihat Asumsi SRS §9) |

---

## 15. Catatan & Dependency Lintas Modul

- **Alur utama:** `register (FR-01)` → `create profile (FR-02/09)` → `create harvest plan (FR-03)` → `trigger recommendations (FR-04..07)` → `oversupply → sale listing auto (FR-11)` → `matching engine (FR-12)` → `accept match → transaction (FR-10 demand match)` → `notification proaktif (FR-13)`.
- **Sales Listing otomatis:** dibuat oleh job backend ketika rekomendasi `HARVEST_TIMING` menandai `oversupplyStatus = "BERISIKO_TINGGI"`.
- **External API fallback:** bila BAPANAS/BMKG/Claude gagal, endpoint rekomendasi mengembalikan hasil rule-based ter-cache dengan header `X-Source: cached` agar frontend dapat menampilkan disclaimer.
- **Webhook WA:** handler tidak menyimpan logika bisnis; ia memvalidasi akun (FR-15) lalu memanggil endpoint internal yang sama (`/api/notifications/quick-query`, dll) — konsisten dengan SRS §2.1 "WhatsApp sebagai kanal tambahan".
- **Geocoding:** frontend mengubah alamat teks → `latitude`/`longitude` via OSM/Nominatim, lalu kirim koordinat ke API. Backend tidak menerima alamat teks untuk field `Land`/`BuyerProfile`/listings (cuma `locationName` sebagai label).