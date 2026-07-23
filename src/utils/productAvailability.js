const { ProductStatus } = require("@prisma/client");

function getRemainingStock(product, reservedQuantity = 0) {
  if (product.totalAvailableQuantity === null || product.totalAvailableQuantity === undefined) {
    return null;
  }

  return Math.max(0, product.totalAvailableQuantity - reservedQuantity);
}

function getAvailabilityState(product, reservedQuantity = 0) {
  if (product.status !== ProductStatus.ACTIVE) {
    const messages = {
      INACTIVE: "Produktet er deaktivert.",
      SOLD_OUT: "Produktet er utsolgt.",
      ARCHIVED: "Produktet er arkivert."
    };

    return {
      canOrder: false,
      reason: messages[product.status] || "Produktet kan ikke bestilles."
    };
  }

  if (product.orderDeadline && new Date(product.orderDeadline) < new Date()) {
    return {
      canOrder: false,
      reason: "Bestillingsfristen er passert."
    };
  }

  const remainingStock = getRemainingStock(product, reservedQuantity);
  if (remainingStock !== null && remainingStock <= 0) {
    return {
      canOrder: false,
      reason: "Det er ikke flere enheter tilgjengelig."
    };
  }

  return {
    canOrder: true,
    reason: ""
  };
}

module.exports = {
  getRemainingStock,
  getAvailabilityState
};
