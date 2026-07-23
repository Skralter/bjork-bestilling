const { prisma } = require("../config/prisma");
const { listActiveProductsWithOrders, listActiveBreweries } = require("../services/productService");
const { upsertOrder, getUserOrders } = require("../services/orderService");
const { validateQuantity } = require("../validators/orderValidators");
const { formatCurrency, formatDate } = require("../utils/formatters");

async function listProducts(req, res, next) {
  try {
    const brewery = String(req.query.brewery || "").trim();
    const sort = req.query.sort === "alphabetical" ? "alphabetical" : "newest";
    const [products, breweries] = await Promise.all([
      listActiveProductsWithOrders(req.currentUser.id, { brewery, sort }),
      listActiveBreweries()
    ]);

    return res.render("products/index", {
      pageTitle: "Produkter",
      products,
      breweries,
      filters: {
        brewery,
        sort
      },
      formatCurrency,
      formatDate
    });
  } catch (error) {
    return next(error);
  }
}

async function saveOrder(req, res, next) {
  const productId = String(req.params.productId || "");
  const wantsJson =
    req.xhr ||
    req.get("x-requested-with") === "XMLHttpRequest" ||
    (req.get("accept") || "").includes("application/json");

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { orderStep: true }
    });

    const { error, quantity } = validateQuantity(req.body.quantity, product?.orderStep || 1);
    if (error) {
      if (wantsJson) {
        return res.status(400).json({
          success: false,
          message: error
        });
      }

      req.flash("error", error);
      return res.redirect("/products");
    }

    const result = await upsertOrder({
      userId: req.currentUser.id,
      productId,
      quantity
    });

    if (wantsJson) {
      return res.json({
        success: true,
        message: "Bestillingen ble lagret.",
        quantity,
        totalOrdered: result.totalOrdered
      });
    }

    req.flash("success", "Bestillingen ble lagret.");
    return res.redirect("/products");
  } catch (serviceError) {
    if (wantsJson) {
      return res.status(400).json({
        success: false,
        message: serviceError.message
      });
    }

    req.flash("error", serviceError.message);
    return res.redirect("/products");
  }
}

async function listMyOrders(req, res, next) {
  try {
    const orders = await getUserOrders(req.currentUser.id);

    return res.render("products/my-orders", {
      pageTitle: "Mine bestillinger",
      orders,
      formatCurrency,
      formatDate
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listProducts,
  saveOrder,
  listMyOrders
};
