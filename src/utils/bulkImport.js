function parseBulkProductLines(rawText) {
  const lines = String(rawText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const products = [];
  const errors = [];

  lines.forEach((line, index) => {
    const parts = line.split(";").map((part) => part.trim());

    if (parts.length < 2) {
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
      status
    });
  });

  return { products, errors };
}

module.exports = {
  parseBulkProductLines
};
