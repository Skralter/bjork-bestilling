const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const IMAGE_DIR = path.join(__dirname, "..", "public", "images", "products", "treehouse");
const IMAGE_WEB_PREFIX = "/images/products/treehouse";
const IMAGE_ATTRIBUTION = "Produktbilde fra lokal Tree House-import";

const aliasMap = new Map([
  ["tripple drippy", "triple drippy"],
  ["julius hydrangea", "hazy king hydrangea mix"],
  ["guavaganger", "guava super treat"],
  ["jjjuiceee machine pineapple", "jjjuiceee machine"],
  ["king juicelius", "king julius"],
]);

function normalizeName(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\b\d+\s*(pack|oz|ml|case)\b/gi, " ")
    .replace(/[–—-]/g, " ")
    .replace(/[_&/+]/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function tokenize(value) {
  return normalizeName(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function toAliasKey(value) {
  const normalized = normalizeName(value);
  return aliasMap.get(normalized) || normalized;
}

function buildImageIndex() {
  const files = fs
    .readdirSync(IMAGE_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name);

  return files.map((fileName) => {
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const aliasKey = toAliasKey(baseName);
    const tokens = tokenize(aliasKey);

    return {
      fileName,
      baseName,
      aliasKey,
      tokens,
    };
  });
}

function levenshtein(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[a.length][b.length];
}

function similarityScore(left, right) {
  const leftKey = toAliasKey(left);
  const rightKey = toAliasKey(right);

  if (leftKey === rightKey) {
    return 1;
  }

  const leftTokens = tokenize(leftKey);
  const rightTokens = tokenize(rightKey);
  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  const overlap = leftTokens.filter((token) => rightSet.has(token)).length;
  const unionSize = new Set([...leftSet, ...rightSet]).size || 1;
  const jaccard = overlap / unionSize;

  const distance = levenshtein(leftKey, rightKey);
  const maxLength = Math.max(leftKey.length, rightKey.length) || 1;
  const editScore = 1 - distance / maxLength;

  const containsBonus =
    leftKey.includes(rightKey) || rightKey.includes(leftKey) ? 0.08 : 0;

  return jaccard * 0.65 + editScore * 0.35 + containsBonus;
}

function chooseMatch(productName, imageEntries) {
  const productKey = toAliasKey(productName);

  const exact = imageEntries.find((entry) => entry.aliasKey === productKey);
  if (exact) {
    return { entry: exact, confidence: 1, mode: "exact" };
  }

  let best = null;

  for (const entry of imageEntries) {
    const score = similarityScore(productKey, entry.aliasKey);

    if (!best || score > best.confidence) {
      best = { entry, confidence: score, mode: "approximate" };
    }
  }

  if (!best) {
    return null;
  }

  if (best.confidence >= 0.88) {
    return best;
  }

  return null;
}

function buildImageUrl(fileName) {
  return `${IMAGE_WEB_PREFIX}/${encodeURIComponent(fileName).replace(/%2F/g, "/")}`;
}

async function main() {
  if (!fs.existsSync(IMAGE_DIR)) {
    throw new Error(`Fant ikke bildemappen: ${IMAGE_DIR}`);
  }

  const imageEntries = buildImageIndex();
  const prisma = new PrismaClient();

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { breweryName: { contains: "Tree House", mode: "insensitive" } },
          { breweryName: { contains: "Treehouse", mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        breweryName: true,
        name: true,
        imageUrl: true,
      },
      orderBy: [{ breweryName: "asc" }, { name: "asc" }],
    });

    const updates = [];
    const unmatched = [];
    const skipped = [];

    for (const product of products) {
      const match = chooseMatch(product.name, imageEntries);

      if (!match) {
        unmatched.push(product.name);
        continue;
      }

      const nextUrl = buildImageUrl(match.entry.fileName);

      if (product.imageUrl === nextUrl) {
        skipped.push({
          name: product.name,
          fileName: match.entry.fileName,
          confidence: Number(match.confidence.toFixed(3)),
          mode: match.mode,
          reason: "allerede satt til samme lokale fil",
        });
        continue;
      }

      updates.push({
        id: product.id,
        name: product.name,
        fileName: match.entry.fileName,
        imageUrl: nextUrl,
        confidence: Number(match.confidence.toFixed(3)),
        mode: match.mode,
      });
    }

    for (const update of updates) {
      await prisma.product.update({
        where: { id: update.id },
        data: {
          imageUrl: update.imageUrl,
          imageAttribution: IMAGE_ATTRIBUTION,
        },
      });
    }

    console.log(
      JSON.stringify(
        {
          matched: updates,
          unmatched,
          skipped,
          summary: {
            totalProductsChecked: products.length,
            matchedCount: updates.length,
            unmatchedCount: unmatched.length,
            skippedCount: skipped.length,
          },
        },
        null,
        2
      )
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
