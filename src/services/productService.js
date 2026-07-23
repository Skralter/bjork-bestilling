const { ProductStatus } = require("@prisma/client");
const { prisma } = require("../config/prisma");
const { getRemainingStock, getAvailabilityState } = require("../utils/productAvailability");

async function listActiveProductsWithOrders(userId, options = {}) {
  const breweryFilter = String(options.brewery || "").trim();
  const sort = String(options.sort || "newest");
  const products = await prisma.product.findMany({
    where: {
      status: ProductStatus.ACTIVE,
      ...(breweryFilter
        ? {
            breweryName: breweryFilter
          }
        : {})
    },
    include: {
      orders: {
        select: {
          quantity: true,
          userId: true
        }
      }
    },
    orderBy:
      sort === "alphabetical"
        ? [{ name: "asc" }]
        : [{ createdAt: "desc" }]
  });

  return products.map((product) => {
    const totalReserved = product.orders.reduce((sum, order) => sum + order.quantity, 0);
    const currentOrder = product.orders.find((order) => order.userId === userId);
    return {
      ...product,
      userQuantity: currentOrder ? currentOrder.quantity : 0,
      totalReserved,
      remainingStock: getRemainingStock(product, totalReserved),
      availability: getAvailabilityState(product, totalReserved)
    };
  });
}

async function listActiveBreweries() {
  const rows = await prisma.product.findMany({
    where: {
      status: ProductStatus.ACTIVE,
      breweryName: {
        not: null
      }
    },
    select: {
      breweryName: true
    },
    distinct: ["breweryName"],
    orderBy: {
      breweryName: "asc"
    }
  });

  return rows.map((row) => row.breweryName).filter(Boolean);
}

async function getProductOverview(productId) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      orders: {
        include: {
          user: true
        },
        orderBy: [{ updatedAt: "desc" }]
      }
    }
  });

  if (!product) {
    return null;
  }

  const totalOrdered = product.orders.reduce((sum, order) => sum + order.quantity, 0);
  const totalUsers = product.orders.length;

  return {
    product,
    totalOrdered,
    totalUsers,
    remainingStock: getRemainingStock(product, totalOrdered),
    lastOrderAt: product.orders[0] ? product.orders[0].updatedAt : null
  };
}

module.exports = {
  listActiveProductsWithOrders,
  listActiveBreweries,
  getProductOverview
};
