const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

function getLocalDatabaseUrl() {
  const envPath = path.join(process.cwd(), ".env");
  const parsed = dotenv.parse(fs.readFileSync(envPath));
  return parsed.DATABASE_URL;
}

async function main() {
  const localDatabaseUrl = getLocalDatabaseUrl();
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: localDatabaseUrl
      }
    }
  });

  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "asc"
      }
    });

    const payload = products.map((product) => ({
      name: product.name,
      breweryName: product.breweryName,
      description: product.description,
      imageUrl: product.imageUrl,
      imageAttribution: product.imageAttribution,
      price: product.price,
      status: product.status,
      orderDeadline: product.orderDeadline,
      orderStep: product.orderStep,
      totalAvailableQuantity: product.totalAvailableQuantity,
      sortOrder: product.sortOrder
    }));

    const outputPath = path.join(process.cwd(), "scripts", "local-products-export.json");
    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
    console.log(`EXPORTED_PRODUCTS=${payload.length}`);
    console.log(`OUTPUT=${outputPath}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
