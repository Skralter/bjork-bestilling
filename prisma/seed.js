require("dotenv").config();

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { PrismaClient, UserRole, UserStatus, ProductStatus } = require("@prisma/client");

const prisma = new PrismaClient();

async function upsertAdmin() {
  const { ADMIN_NAME, ADMIN_USERNAME, ADMIN_PASSWORD } = process.env;

  if (!ADMIN_NAME || !ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.log("Hopper over admin-seeding fordi ADMIN_NAME, ADMIN_USERNAME eller ADMIN_PASSWORD mangler.");
    return;
  }

  const existing = await prisma.user.findUnique({
    where: { username: ADMIN_USERNAME.toLowerCase() }
  });

  if (existing) {
    console.log("Administrator finnes allerede. Ingen endringer gjort.");
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await prisma.user.create({
    data: {
      fullName: ADMIN_NAME.trim(),
      username: ADMIN_USERNAME.trim().toLowerCase(),
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED
    }
  });

  console.log("Administrator ble opprettet.");
}

async function seedTestData() {
  if (process.env.SEED_TEST_DATA !== "true") {
    return;
  }

  const users = [
    { fullName: "Anna Godkjent", username: "anna", password: "Passord123!", status: UserStatus.APPROVED },
    { fullName: "Bjørn Godkjent", username: "bjorn", password: "Passord123!", status: UserStatus.APPROVED },
    { fullName: "Petter Venter", username: "petter", password: "Passord123!", status: UserStatus.PENDING }
  ];

  for (const user of users) {
    const exists = await prisma.user.findUnique({ where: { username: user.username } });
    if (!exists) {
      await prisma.user.create({
        data: {
          fullName: user.fullName,
          username: user.username,
          passwordHash: await bcrypt.hash(user.password, 12),
          role: UserRole.USER,
          status: user.status
        }
      });
    }
  }

  const products = [
    {
      breweryName: "Bjørk Bryggeri",
      name: "Bjørk Lager",
      description: "En lettdrikkelig lager med frisk avslutning.",
      price: "49.00",
      totalAvailableQuantity: 120,
      orderStep: 1,
      status: ProductStatus.ACTIVE,
      sortOrder: 1
    },
    {
      breweryName: "Bjørk Bryggeri",
      name: "Bjørk Amber",
      description: "Ravfarget øl med karamell og mild bitterhet.",
      price: "56.00",
      totalAvailableQuantity: 80,
      orderStep: 4,
      status: ProductStatus.ACTIVE,
      sortOrder: 2
    },
    {
      breweryName: "Bjørk Bryggeri",
      name: "Bjørk IPA",
      description: "Humledrevet IPA med tydelig sitruspreg.",
      price: "62.00",
      totalAvailableQuantity: 60,
      orderStep: 1,
      status: ProductStatus.ACTIVE,
      sortOrder: 3
    },
    {
      breweryName: "Bjørk Bryggeri",
      name: "Bjørk Stout",
      description: "Mørk stout med kaffe, kakao og fyldig munnfølelse.",
      price: "68.00",
      totalAvailableQuantity: 0,
      orderStep: 1,
      status: ProductStatus.SOLD_OUT,
      sortOrder: 4
    }
  ];

  for (const product of products) {
    const exists = await prisma.product.findFirst({ where: { name: product.name } });
    if (!exists) {
      await prisma.product.create({ data: product });
    }
  }

  const anna = await prisma.user.findUnique({ where: { username: "anna" } });
  const bjorn = await prisma.user.findUnique({ where: { username: "bjorn" } });
  const lager = await prisma.product.findFirst({ where: { name: "Bjørk Lager" } });
  const amber = await prisma.product.findFirst({ where: { name: "Bjørk Amber" } });

  if (anna && lager) {
    await prisma.order.upsert({
      where: { userId_productId: { userId: anna.id, productId: lager.id } },
      update: { quantity: 4 },
      create: { userId: anna.id, productId: lager.id, quantity: 4 }
    });
  }

  if (bjorn && amber) {
    await prisma.order.upsert({
      where: { userId_productId: { userId: bjorn.id, productId: amber.id } },
      update: { quantity: 2 },
      create: { userId: bjorn.id, productId: amber.id, quantity: 2 }
    });
  }

  console.log("Testdata ble kontrollert/opprettet.");
}

async function importProductsFromExportFile() {
  if (process.env.SEED_IMPORT_PRODUCTS !== "true") {
    return;
  }

  const filePath = path.join(process.cwd(), "scripts", "local-products-export.json");
  if (!fs.existsSync(filePath)) {
    console.log("Ingen lokal produkteksport funnet. Hopper over produktimport.");
    return;
  }

  const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const existingProducts = await prisma.product.findMany({
    select: {
      name: true,
      breweryName: true
    }
  });

  const existingKeys = new Set(
    existingProducts.map((product) => `${product.breweryName || ""}::${product.name}`.toLowerCase())
  );

  const toCreate = payload.filter((product) => {
    const key = `${product.breweryName || ""}::${product.name}`.toLowerCase();
    return !existingKeys.has(key);
  });

  if (!toCreate.length) {
    console.log("Ingen nye produkter å importere fra eksportfilen.");
    return;
  }

  await prisma.product.createMany({
    data: toCreate
  });

  console.log(`${toCreate.length} produkter ble importert fra lokal eksportfil.`);
}

async function main() {
  await upsertAdmin();
  await seedTestData();
  await importProductsFromExportFile();
}

main()
  .catch((error) => {
    console.error("Seeding feilet:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
