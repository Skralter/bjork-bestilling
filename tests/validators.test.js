const test = require("node:test");
const assert = require("node:assert/strict");

const { validateRegistration } = require("../src/validators/authValidators");
const { validateQuantity } = require("../src/validators/orderValidators");
const { getAvailabilityState } = require("../src/utils/productAvailability");

test("validateRegistration godtar gyldige data", () => {
  const result = validateRegistration({
    fullName: "Ola Nordmann",
    username: "ola.nordmann",
    password: "Passord123!",
    confirmPassword: "Passord123!"
  });

  assert.equal(result.errors.length, 0);
  assert.equal(result.values.username, "ola.nordmann");
});

test("validateRegistration stopper ugyldig brukernavn og korte passord", () => {
  const result = validateRegistration({
    fullName: "",
    username: "x",
    password: "123",
    confirmPassword: "321"
  });

  assert.ok(result.errors.length >= 3);
});

test("validateQuantity stopper negative tall", () => {
  const result = validateQuantity(-1);
  assert.equal(result.quantity, null);
  assert.match(result.error, /heltall/);
});

test("getAvailabilityState stopper utløpt bestillingsfrist", () => {
  const state = getAvailabilityState({
    status: "ACTIVE",
    orderDeadline: new Date("2026-01-01T10:00:00Z"),
    totalAvailableQuantity: 10
  }, 0);

  assert.equal(state.canOrder, false);
});
