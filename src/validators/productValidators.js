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

function validateProductInput(body) {
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

  if (!payload.description) {
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

module.exports = {
  validateProductInput
};
