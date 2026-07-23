function validateQuantity(value, orderStep = 1) {
  const quantity = Number(value);

  if (!Number.isInteger(quantity) || quantity < 0) {
    return {
      error: "Antall må være et heltall som er 0 eller høyere.",
      quantity: null
    };
  }

  if (quantity > 0 && quantity % orderStep !== 0) {
    return {
      error: `Antall må bestilles i trinn på ${orderStep}.`,
      quantity: null
    };
  }

  return {
    error: null,
    quantity
  };
}

module.exports = {
  validateQuantity
};
