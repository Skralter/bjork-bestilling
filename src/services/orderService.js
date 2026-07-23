const { Prisma } = require("@prisma/client");
const { prisma } = require("../config/prisma");
const { getAvailabilityState } = require("../utils/productAvailability");

async function upsertOrder({ userId, productId, quantity }) {
  return prisma.$transaction(
    async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: {
          orders: true
        }
      });

      if (!product) {
        throw new Error("Produktet finnes ikke.");
      }

      const existingOrder = product.orders.find((order) => order.userId === userId) || null;
      const totalReserved = product.orders.reduce((sum, order) => sum + order.quantity, 0);
      const reservedByOthers = totalReserved - (existingOrder ? existingOrder.quantity : 0);
      const availability = getAvailabilityState(product, reservedByOthers + quantity);

      if (!availability.canOrder && quantity > 0) {
        throw new Error(availability.reason);
      }

      if (
        product.totalAvailableQuantity !== null &&
        reservedByOthers + quantity > product.totalAvailableQuantity
      ) {
        throw new Error("Bestillingen overstiger tilgjengelig lager.");
      }

      if (quantity > 0 && quantity % product.orderStep !== 0) {
        throw new Error(`Dette produktet må bestilles i trinn på ${product.orderStep}.`);
      }

      if (quantity === 0) {
        if (existingOrder) {
          await tx.order.delete({
            where: {
              userId_productId: {
                userId,
                productId
              }
            }
          });
        }

        const totals = await tx.order.aggregate({
          where: { productId },
          _sum: {
            quantity: true
          }
        });

        return {
          action: "deleted",
          totalOrdered: totals._sum.quantity || 0
        };
      }

      if (existingOrder) {
        await tx.order.update({
          where: {
            userId_productId: {
              userId,
              productId
            }
          },
          data: { quantity }
        });

        const totals = await tx.order.aggregate({
          where: { productId },
          _sum: {
            quantity: true
          }
        });

        return {
          action: "updated",
          totalOrdered: totals._sum.quantity || 0
        };
      }

      await tx.order.create({
        data: {
          userId,
          productId,
          quantity
        }
      });

      const totals = await tx.order.aggregate({
        where: { productId },
        _sum: {
          quantity: true
        }
      });

      return {
        action: "created",
        totalOrdered: totals._sum.quantity || 0
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );
}

async function getUserOrders(userId) {
  return prisma.order.findMany({
    where: { userId },
    include: {
      product: true
    },
    orderBy: [{ updatedAt: "desc" }]
  });
}

module.exports = {
  upsertOrder,
  getUserOrders
};
