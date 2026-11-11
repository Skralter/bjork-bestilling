function parseBulkProductLines(rawText, { breweryName: commonBrewery } = {}) {
  const lines = String(rawText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const products = [];
  const errors = [];

  lines.forEach((line, index) => {
    const parts = commonBrewery === undefined
      ? line.split(";").map((part) => part.trim())
      : [String(commonBrewery || "").trim(), line];

    if (parts.length < 2 || !parts[0] || !parts[1]) {
      errors.push(`Linje ${index + 1}: Du må minst oppgi bryggeri og ølnavn.`);
      return;
    }

    const [
      breweryName,
      name,
      description = "",
      price = "",
      totalAvailableQuantity = "",
      orderStep = "",
      orderDeadline = "",
      status = "ACTIVE"
    ] = parts;

    products.push({
      breweryName,
      name,
      description,
      price,
      totalAvailableQuantity,
      orderStep,
      orderDeadline,
      status: status || "ACTIVE"
    });
  });

  return { products, errors };
}

module.exports = {
  parseBulkProductLines
};
