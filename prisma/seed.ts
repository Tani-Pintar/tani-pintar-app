import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userId = process.env.MOCK_AUTH_USER_ID ?? "dev-petani-001";
  const phoneNumber = "628123456789";

  console.log(`[seed] Membuat user+profil petani dummy untuk userId=${userId}`);

  // Upsert user
  const user = await prisma.user.upsert({
    where: { phoneNumber },
    update: {},
    create: {
      id: userId,
      fullName: "Petani Dev Dummy",
      phoneNumber,
      passwordHash: "mock-no-auth-yet",
      role: "PETANI",
      isActive: true,
      isPhoneVerified: true,
    },
  });

  // Upsert farmer profile
  const farmerProfile = await prisma.farmerProfile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      fullName: "Petani Dev Dummy",
      locationName: "Kec. Brebes, Kabupaten Brebes",
      latitude: -6.8703,
      longitude: 109.0398,
      primaryCommodity: "Bawang Merah",
      contactPhone: phoneNumber,
      isVerified: true,
    },
  });

  // Buat 2 lahan contoh (hanya bila kosong)
  const existingLands = await prisma.land.count({
    where: { farmerProfileId: farmerProfile.id },
  });

  if (existingLands === 0) {
    await prisma.land.createMany({
      data: [
        {
          farmerProfileId: farmerProfile.id,
          name: "Lahan Bawang Utara",
          commodityType: "Bawang Merah",
          areaSize: 0.5,
          areaUnit: "hektar",
          plantingPhase: "PENANAMAN",
          latitude: -6.871,
          longitude: 109.0401,
          address: "Jl. Raya Brebes No. 12",
        },
        {
          farmerProfileId: farmerProfile.id,
          name: "Lahan Bawang Selatan",
          commodityType: "Bawang Merah",
          areaSize: 0.8,
          areaUnit: "hektar",
          plantingPhase: "PERSIAPAN_LAHAN",
          latitude: -6.875,
          longitude: 109.035,
          address: "Jl. Raya Brebes No. 50",
        },
      ],
    });
    console.log("[seed] 2 lahan contoh dibuat");
  } else {
    console.log(`[seed] ${existingLands} lahan sudah ada, skip`);
  }

  const farmer = await prisma.farmerProfile.findUnique({
    where: { userId: user.id },
    include: { lands: true },
  });

  console.log(`  User ID:        ${user.id}`)
  console.log(`  Farmer ID:      ${farmerProfile.id}`)
  console.log(`  Total lahan:    ${farmer?.lands.length ?? 0}`)

  // ----- Buyer dummy (untuk test /api/buyers) -----
  const buyerUserId = "dev-buyer-001";
  const buyerPhone = "6289988776600";

  console.log(`\n[seed] Membuat user+profil buyer dummy untuk userId=${buyerUserId}`);

  const buyerUser = await prisma.user.upsert({
    where: { phoneNumber: buyerPhone },
    update: {},
    create: {
      id: buyerUserId,
      fullName: "Buyer Dev Dummy",
      phoneNumber: buyerPhone,
      passwordHash: "mock-no-auth-yet",
      role: "BUYER",
      isActive: true,
      isPhoneVerified: true,
    },
  });

  const buyerProfile = await prisma.buyerProfile.upsert({
    where: { userId: buyerUser.id },
    update: {},
    create: {
      userId: buyerUser.id,
      businessName: "Pasar Induk Cipinang",
      businessType: "PASAR_INDUK",
      locationName: "Jakarta Timur",
      latitude: -6.2198,
      longitude: 106.8615,
      capacityAbsorption: 5000,
      capacityUnit: "kg",
      contactPhone: buyerPhone,
      isVerified: true,
    },
  });

  console.log(`  Buyer User ID:  ${buyerUser.id}`)
  console.log(`  Buyer ID:       ${buyerProfile.id}`)

  console.log("\n[seed] Selesai. Tips test:")
  console.log('  - Petani: MOCK_AUTH_USER_ID="dev-petani-001" MOCK_AUTH_ROLE="PETANI"')
  console.log('  - Buyer:  MOCK_AUTH_USER_ID="dev-buyer-001"  MOCK_AUTH_ROLE="BUYER"')
}

main()
  .catch((e) => {
    console.error("[seed] Gagal:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });