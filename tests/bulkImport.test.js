const test = require("node:test");
const assert = require("node:assert/strict");
const { parseBulkProductLines } = require("../src/utils/bulkImport");
const { validateProductInput } = require("../src/validators/productValidators");

test("masseinnlegging godtar bare bryggeri og ølnavn med riktige standardverdier", () => {
  const { products, errors } = parseBulkProductLines(" Tree House ; Julius \r\n\nLervig; Lucky Jack");
  assert.deepEqual(errors, []);
  assert.equal(products.length, 2);
  const result = validateProductInput(products[0], { requireDescription: false });
  assert.deepEqual(result.errors, []);
  assert.equal(result.payload.breweryName, "Tree House");
  assert.equal(result.payload.name, "Julius");
  assert.equal(result.payload.description, "");
  assert.equal(result.payload.price, null);
  assert.equal(result.payload.totalAvailableQuantity, null);
  assert.equal(result.payload.orderDeadline, null);
  assert.equal(result.payload.orderStep, 1);
  assert.equal(result.payload.status, "ACTIVE");
  assert.ok(validateProductInput(products[0]).errors.includes("Beskrivelse er obligatorisk."));
});

test("masseinnlegging beholder valgfrie felt og godtar tom status", () => {
  const { products, errors } = parseBulkProductLines("Lervig; Lucky Jack; Frisk pale ale; 59,50; 48; 4; ; INACTIVE\nTree House; Green;;;;;;");
  assert.deepEqual(errors, []);
  const result = validateProductInput(products[0], { requireDescription: false });
  assert.deepEqual(result.errors, []);
  assert.equal(result.payload.description, "Frisk pale ale");
  assert.equal(result.payload.price, 59.5);
  assert.equal(result.payload.totalAvailableQuantity, 48);
  assert.equal(result.payload.orderStep, 4);
  assert.equal(result.payload.status, "INACTIVE");
  assert.equal(products[1].status, "ACTIVE");
});

test("masseinnlegging avviser manglende bryggeri eller ølnavn", () => {
  for (const row of ["Bare ett felt", "; Julius", "Tree House;", " ; "]) {
    const result = parseBulkProductLines(row);
    assert.equal(result.products.length, 0);
    assert.match(result.errors[0], /bryggeri og ølnavn/);
  }
});

test("masseinnlegging validerer fortsatt pris, lager, trinn og status", () => {
  const { products } = parseBulkProductLines("Lervig; Lucky Jack;; feil; -1; 0;; UKJENT");
  const result = validateProductInput(products[0], { requireDescription: false });
  assert.equal(result.errors.length, 4);
});

test("masseinnlegging lagrer bryggeri og ølnavn gjennom controlleren", async () => {
  const { prisma } = require("../src/config/prisma");
  const { createBulkProducts } = require("../src/controllers/adminController");
  const original = prisma.product.createMany;
  let saved;
  prisma.product.createMany = async ({ data }) => { saved = data; };
  try {
    let redirect;
    await createBulkProducts({
      body: { breweryName: "Tree House", rows: "Julius\nGreen" },
      flash: () => {}
    }, {
      redirect: (url) => { redirect = url; },
      status: () => { throw new Error("Importen ble avvist"); }
    });
    assert.equal(redirect, "/admin/products");
    assert.equal(saved.length, 2);
    assert.equal(saved[0].breweryName, "Tree House");
    assert.equal(saved[0].name, "Julius");
    assert.equal(saved[1].breweryName, "Tree House");
    assert.equal(saved[1].name, "Green");
    assert.equal(saved[0].description, "");
  } finally {
    prisma.product.createMany = original;
    await prisma.$disconnect();
  }
});

test("to separate bokser bruker felles bryggeri og ett ølnavn per linje", () => {
  const result = parseBulkProductLines(" Julius \r\nGreen\n\nHaze", { breweryName: " Tree House " });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.products.map(p => [p.breweryName, p.name]), [
    ["Tree House", "Julius"], ["Tree House", "Green"], ["Tree House", "Haze"]
  ]);
  assert.equal(parseBulkProductLines("Julius", { breweryName: " " }).errors.length, 1);
});
