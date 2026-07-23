const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

async function main() {
  const filePath = process.argv[2] || "/app/tmp/local-products-export.json";
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Fant ikke importfil: ${resolvedPath}`);
  }

  const prisma = new PrismaClient();

  try {
    const payload = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
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
      console.log("Ingen nye produkter å importere.");
      return;
    }

    const result = await prisma.product.createMany({
      data: toCreate
    });

    console.log(`IMPORTED_PRODUCTS=${result.count}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
