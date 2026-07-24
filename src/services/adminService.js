const bcrypt = require("bcrypt");
const { UserRole, UserStatus, ProductStatus } = require("@prisma/client");
const { prisma } = require("../config/prisma");
const { toCsv } = require("../utils/csv");

async function getDashboardData() {
  const [
    pendingUsers,
    approvedUsers,
    activeProducts,
    soldOutProducts,
    totalOrders,
    recentUsers,
    recentOrders,
    lowStockProducts
  ] = await Promise.all([
    prisma.user.count({ where: { status: UserStatus.PENDING } }),
    prisma.user.count({ where: { status: UserStatus.APPROVED } }),
    prisma.product.count({ where: { status: ProductStatus.ACTIVE } }),
    prisma.product.count({ where: { status: ProductStatus.SOLD_OUT } }),
    prisma.order.count(),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.order.findMany({
      include: { user: true, product: true },
      orderBy: { updatedAt: "desc" },
      take: 5
    }),
    prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        totalAvailableQuantity: { not: null }
      },
      include: {
        orders: true
      },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  return {
    pendingUsers,
    approvedUsers,
    activeProducts,
    soldOutProducts,
    totalOrders,
    recentUsers,
    recentOrders,
    lowStockProducts: lowStockProducts.filter((product) => {
      const reserved = product.orders.reduce((sum, order) => sum + order.quantity, 0);
      const remaining = product.totalAvailableQuantity - reserved;
      return remaining <= 10;
    })
  };
}

async function getUsersOverview() {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          orders: true
        }
      }
    },
    orderBy: [{ role: "desc" }, { createdAt: "desc" }]
  });

  const adminCount = users.filter((user) => user.role === UserRole.ADMIN).length;

  return {
    users,
    adminCount
  };
}

async function updateUserStatus({ targetUserId, status, currentUserId }) {
  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new Error("Brukeren finnes ikke.");
  }

  if (user.id === currentUserId && status === UserStatus.DISABLED) {
    throw new Error("Du kan ikke deaktivere din egen konto.");
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: { status }
  });
}

async function toggleUserRole({ targetUserId, makeAdmin, currentUserId }) {
  const [user, admins] = await Promise.all([
    prisma.user.findUnique({ where: { id: targetUserId } }),
    prisma.user.findMany({ where: { role: UserRole.ADMIN } })
  ]);

  if (!user) {
    throw new Error("Brukeren finnes ikke.");
  }

  if (!makeAdmin && user.id === currentUserId && admins.length <= 1) {
    throw new Error("Du kan ikke fjerne adminrollen fra den siste administratoren.");
  }

  return prisma.user.update({
    where: { id: targetUserId },
    data: {
      role: makeAdmin ? UserRole.ADMIN : UserRole.USER
    }
  });
}

async function updateAccountProfile(userId, fullName) {
  return prisma.user.update({
    where: { id: userId },
    data: { fullName }
  });
}

async function updatePassword(userId, newPassword) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      passwordHash: await bcrypt.hash(newPassword, 12)
    }
  });
}

async function getOrdersSummary() {
  const [users, products] = await Promise.all([
    prisma.user.findMany({
      where: {
        orders: {
          some: {}
        }
      },
      include: {
        orders: {
          include: {
            product: true
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      },
      orderBy: {
        fullName: "asc"
      }
    }),
    prisma.product.findMany({
      where: {
        orders: {
          some: {}
        }
      },
      include: {
        orders: {
          include: {
            user: true
          },
          orderBy: {
            createdAt: "desc"
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    })
  ]);

  const ordersByUser = users.map((user) => {
    const totalQuantity = user.orders.reduce((sum, order) => sum + order.quantity, 0);
    const totalValue = user.orders.reduce((sum, order) => {
      return sum + Number(order.product.price || 0) * order.quantity;
    }, 0);
    const paidOrderCount = user.orders.filter((order) => Boolean(order.paidAt)).length;
    const pickedUpOrderCount = user.orders.filter((order) => Boolean(order.pickedUpAt)).length;

    return {
      ...user,
      totalQuantity,
      totalValue,
      paidOrderCount,
      pickedUpOrderCount
    };
  });

  const ordersByProduct = products.map((product) => {
    const totalQuantity = product.orders.reduce((sum, order) => sum + order.quantity, 0);
    const totalUsers = product.orders.length;
    const totalValue = product.orders.reduce((sum, order) => {
      return sum + Number(product.price || 0) * order.quantity;
    }, 0);
    const paidOrderCount = product.orders.filter((order) => Boolean(order.paidAt)).length;
    const pickedUpOrderCount = product.orders.filter((order) => Boolean(order.pickedUpAt)).length;

    return {
      ...product,
      totalQuantity,
      totalUsers,
      totalValue,
      paidOrderCount,
      pickedUpOrderCount
    };
  });

  return {
    ordersByUser,
    ordersByProduct
  };
}

function buildProductOrdersCsv(product, orders) {
  const rows = [
    ["Produktnavn", "Fullt navn", "Brukernavn", "Antall", "Betalt", "Hentet", "Pris per enhet", "Totalsum", "Opprettet", "Sist endret"]
  ];

  for (const order of orders) {
    const price = product.price ? Number(product.price) : 0;
    rows.push([
      product.name,
      order.user.fullName,
      order.user.username,
      order.quantity,
      order.paidAt ? new Date(order.paidAt).toISOString() : "",
      order.pickedUpAt ? new Date(order.pickedUpAt).toISOString() : "",
      price.toFixed(2),
      (price * order.quantity).toFixed(2),
      new Date(order.createdAt).toISOString(),
      new Date(order.updatedAt).toISOString()
    ]);
  }

  return toCsv(rows);
}

module.exports = {
  getDashboardData,
  getUsersOverview,
  getOrdersSummary,
  updateUserStatus,
  toggleUserRole,
  updateAccountProfile,
  updatePassword,
  buildProductOrdersCsv
};
