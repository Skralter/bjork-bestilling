const { ProductStatus } = require("@prisma/client");

function normalizeOptionalNumber(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return null;
  }

  const numericValue = Number(trimmed.replace(",", "."));
  return Number.isFinite(numericValue) ? numericValue : Number.NaN;
}

function normalizeOptionalInteger(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) {
    return null;
  }

  const numericValue = Number(trimmed);
  return Number.isInteger(numericValue) ? numericValue : Number.NaN;
}

function validateProductInput(body, { requireDescription = true } = {}) {
  const payload = {
    breweryName: String(body.breweryName || "").trim() || null,
    name: String(body.name || "").trim(),
    description: String(body.description || "").trim(),
    imageUrl: String(body.imageUrl || "").trim() || null,
    imageAttribution: String(body.imageAttribution || "").trim() || null,
    price: normalizeOptionalNumber(body.price),
    status: String(body.status || ProductStatus.ACTIVE),
    orderDeadline: String(body.orderDeadline || "").trim() || null,
    orderStep: normalizeOptionalInteger(body.orderStep),
    totalAvailableQuantity: normalizeOptionalInteger(body.totalAvailableQuantity),
    sortOrder: 0,
    autoFetchImage: body.autoFetchImage === "on"
  };

  const errors = [];

  if (!payload.name) {
    errors.push("Produktnavn er obligatorisk.");
  }

  if (requireDescription && !payload.description) {
    errors.push("Beskrivelse er obligatorisk.");
  }

  if (!Object.values(ProductStatus).includes(payload.status)) {
    errors.push("Ugyldig produktstatus.");
  }

  if (payload.price !== null && (!Number.isFinite(payload.price) || payload.price < 0)) {
    errors.push("Pris må være et positivt tall eller stå tom.");
  }

  if (payload.orderStep === null) {
    payload.orderStep = 1;
  }

  if (Number.isNaN(payload.orderStep) || payload.orderStep < 1) {
    errors.push("Bestillingstrinn må være et heltall større enn 0.");
  }

  if (
    payload.totalAvailableQuantity !== null &&
    (Number.isNaN(payload.totalAvailableQuantity) || payload.totalAvailableQuantity < 0)
  ) {
    errors.push("Tilgjengelig antall må være et heltall lik eller større enn 0 eller stå tom.");
  }

  if (payload.orderDeadline) {
    const parsedDate = new Date(payload.orderDeadline);
    if (Number.isNaN(parsedDate.getTime())) {
      errors.push("Bestillingsfrist må være en gyldig dato.");
    } else {
      payload.orderDeadline = parsedDate;
    }
  }

  if (payload.imageUrl) {
    try {
      const url = new URL(payload.imageUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        errors.push("Bildelenken må starte med http eller https.");
      }
    } catch (error) {
      errors.push("Bildelenken må være en gyldig URL.");
    }
  }

  return { errors, payload };
}

function validateProductPrice(body) {
  const value = body?.price;
  const rawPrice = typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : value === null ? "" : null;

  if (rawPrice === null || (rawPrice && !/^(?:\d+(?:[.,]\d{1,2})?|[.,]\d{1,2})$/.test(rawPrice))) {
    return { error: "Skriv en gyldig pris med høyst to desimaler.", price: null };
  }

  if (!rawPrice) {
    return { error: null, price: null };
  }

  const price = Number(rawPrice.replace(",", "."));
  if (!Number.isFinite(price) || price > 99999999.99) {
    return { error: "Pris må være mellom 0 og 99 999 999,99 kr.", price: null };
  }

  return { error: null, price: price.toFixed(2) };
}

module.exports = {
  validateProductInput,
  validateProductPrice
};
