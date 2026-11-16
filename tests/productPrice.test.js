const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const session = require("express-session");
const csrf = require("csurf");
const request = require("supertest");
const { Prisma } = require("@prisma/client");
const { prisma } = require("../src/config/prisma");
const adminRoutes = require("../src/routes/adminRoutes");
const { errorHandler } = require("../src/middleware/errorHandlers");
const { validateProductPrice } = require("../src/validators/productValidators");

test("priser valideres uten avrunding av ugyldige beløp", () => {
  for (const [input, expected] of [["200", "200.00"], ["220", "220.00"], ["215,50", "215.50"], ["0", "0.00"], [".50", "0.50"], ["99999999,99", "99999999.99"], ["", null], [null, null]]) {
    assert.deepEqual(validateProductPrice({ price: input }), { error: null, price: expected });
  }
  for (const input of [undefined, -1, "1e3", "NaN", "Infinity", "200,123", "100000000", [], {}]) {
    assert.ok(validateProductPrice({ price: input }).error, `Skal avvise ${JSON.stringify(input)}`);
  }
});

function createPriceTestApp(user = { role: "ADMIN", status: "APPROVED" }) {
  const app = express();
  app.use(express.urlencoded({ extended: false }));
  app.use(session({ secret: "price-route-test-only", resave: false, saveUninitialized: false }));
  app.use(csrf());
  app.use((req, res, next) => {
    req.currentUser = user;
    next();
  });
  app.get("/csrf", (req, res) => res.json({ csrfToken: req.csrfToken() }));
  app.use("/admin", adminRoutes);
  app.use(errorHandler);
  return app;
}

async function agentWithToken(user) {
  const agent = request.agent(createPriceTestApp(user));
  const response = await agent.get("/csrf");
  return { agent, token: response.body.csrfToken };
}

function mockProductUpdate(t, implementation) {
  const original = prisma.product.update;
  const update = t.mock.fn(implementation);
  prisma.product.update = update;
  t.after(() => { prisma.product.update = original; });
  return update;
}

test("prisruten lagrer kun prisen og bevarer resten av varen", async (t) => {
  const update = mockProductUpdate(t, async ({ data }) => ({ price: data.price === null ? null : new Prisma.Decimal(data.price) }));
  const { agent, token } = await agentWithToken();
  for (const [price, expected] of [["200", "200.00"], ["220", "220.00"], ["215,50", "215.50"], ["0", "0.00"], ["", null]]) {
    const response = await agent.post("/admin/products/beer-1/price")
      .set("Accept", "application/json").type("form")
      .send({ _csrf: token, price, name: "Skal ikke endres", orderStep: 99 });
    assert.equal(response.status, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.price, expected);
    assert.deepEqual(update.mock.calls.at(-1).arguments[0], {
      where: { id: "beer-1" }, data: { price: expected }, select: { price: true }
    });
  }
});

test("ugyldig pris sendes ikke til databasen", async (t) => {
  const update = mockProductUpdate(t, async () => assert.fail("Skal ikke skrive ugyldig pris"));
  const { agent, token } = await agentWithToken();
  for (const price of ["-1", "220,123", "100000000", "tekst"]) {
    const response = await agent.post("/admin/products/beer-1/price")
      .set("Accept", "application/json").type("form").send({ _csrf: token, price });
    assert.equal(response.status, 422);
    assert.equal(response.body.success, false);
  }
  assert.equal(update.mock.callCount(), 0);
});

test("kun godkjente administratorer kan endre priser", async (t) => {
  const update = mockProductUpdate(t, async () => assert.fail("Skal ikke skrive uten adminrettighet"));
  for (const [user, status] of [[null, 401], [{ role: "USER", status: "APPROVED" }, 403], [{ role: "ADMIN", status: "PENDING" }, 403]]) {
    const { agent, token } = await agentWithToken(user);
    const response = await agent.post("/admin/products/beer-1/price")
      .set("Accept", "application/json").type("form").send({ _csrf: token, price: "220" });
    assert.equal(response.status, status);
    assert.equal(response.body.success, false);
  }
  assert.equal(update.mock.callCount(), 0);
});

test("prisendring krever gyldig CSRF-token", async (t) => {
  t.mock.method(console, "error", () => {});
  const update = mockProductUpdate(t, async () => assert.fail("Skal ikke skrive uten CSRF"));
  const { agent } = await agentWithToken();
  const response = await agent.post("/admin/products/beer-1/price")
    .set("Accept", "application/json").type("form").send({ price: "220" });
  assert.equal(response.status, 403);
  assert.equal(response.body.success, false);
  assert.equal(update.mock.callCount(), 0);
});

test("slettet vare og databasefeil rapporteres uten falsk lagringsbekreftelse", async (t) => {
  t.mock.method(console, "error", () => {});
  let databaseError = { code: "P2025" };
  mockProductUpdate(t, async () => { throw databaseError; });
  const { agent, token } = await agentWithToken();
  const send = () => agent.post("/admin/products/deleted/price")
    .set("Accept", "application/json").type("form").send({ _csrf: token, price: "220" });
  const missing = await send();
  assert.equal(missing.status, 404);
  assert.equal(missing.body.success, false);
  databaseError = new Error("Database unavailable");
  const failed = await send();
  assert.equal(failed.status, 500);
  assert.equal(failed.body.success, false);
});
