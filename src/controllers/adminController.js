const { ProductStatus } = require("@prisma/client");
const { prisma } = require("../config/prisma");
const {
  getDashboardData,
  getUsersOverview,
  getOrdersSummary,
  updateUserStatus,
  toggleUserRole,
  buildProductOrdersCsv
} = require("../services/adminService");
const { validateProductInput } = require("../validators/productValidators");
const { getProductOverview } = require("../services/productService");
const { formatCurrency, formatDate } = require("../utils/formatters");
const { fetchBeerImageFromGoogle } = require("../services/beerImageService");
const { parseBulkProductLines } = require("../utils/bulkImport");
const { hasGoogleImageSearchCredentials } = require("../config/googleImageSearch");

async function showDashboard(req, res, next) {
  try {
    const data = await getDashboardData();
    return res.render("admin/dashboard", {
      pageTitle: "Admin",
      ...data,
      formatCurrency,
      formatDate
    });
  } catch (error) {
    return next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const { users, adminCount } = await getUsersOverview();
    return res.render("admin/users", {
      pageTitle: "Brukere",
      users,
      adminCount
    });
  } catch (error) {
    return next(error);
  }
}

async function showOrdersSummary(req, res, next) {
  try {
    const { ordersByUser, ordersByProduct } = await getOrdersSummary();
    return res.render("admin/orders-summary", {
      pageTitle: "Bestillinger",
      ordersByUser,
      ordersByProduct,
      formatCurrency,
      formatDate
    });
  } catch (error) {
    return next(error);
  }
}

async function changeUserStatus(req, res, next) {
  try {
    await updateUserStatus({
      targetUserId: req.params.userId,
      status: req.body.status,
      currentUserId: req.currentUser.id
    });
    req.flash("success", "Brukerstatus ble oppdatert.");
    return res.redirect("/admin/users");
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/admin/users");
  }
}

async function changeUserRole(req, res, next) {
  try {
    await toggleUserRole({
      targetUserId: req.params.userId,
      makeAdmin: req.body.role === "ADMIN",
      currentUserId: req.currentUser.id
    });
    req.flash("success", "Brukerrollen ble oppdatert.");
    return res.redirect("/admin/users");
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/admin/users");
  }
}

async function listProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      include: {
        _count: {
          select: {
            orders: true
          }
        }
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    });

    return res.render("admin/products", {
      pageTitle: "Produktadministrasjon",
      products,
      ProductStatus,
      formatCurrency,
      formatDate,
      hasGoogleImageSearchCredentials: hasGoogleImageSearchCredentials()
    });
  } catch (error) {
    return next(error);
  }
}

function showNewProduct(req, res) {
  res.render("admin/product-form", {
    pageTitle: "Opprett produkt",
    product: null,
    formData: { orderStep: 1 },
    ProductStatus,
    hasGoogleImageSearchCredentials: hasGoogleImageSearchCredentials()
  });
}

async function createProduct(req, res, next) {
  const { errors, payload } = validateProductInput(req.body);

  if (errors.length > 0) {
    return res.status(422).render("admin/product-form", {
      pageTitle: "Opprett produkt",
      errors,
      formData: req.body,
      ProductStatus,
      product: null,
      hasGoogleImageSearchCredentials: hasGoogleImageSearchCredentials()
    });
  }

  try {
    if (payload.autoFetchImage && !payload.imageUrl) {
      const imageData = await fetchBeerImageFromGoogle({
        breweryName: payload.breweryName,
        beerName: payload.name
      });

      if (imageData) {
        payload.imageUrl = imageData.imageUrl;
        payload.imageAttribution = imageData.attribution;
      }
    }

    delete payload.autoFetchImage;
    await prisma.product.create({ data: payload });
    req.flash("success", "Produktet ble opprettet.");
    return res.redirect("/admin/products");
  } catch (error) {
    return next(error);
  }
}

async function showEditProduct(req, res, next) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.productId }
    });

    if (!product) {
      return res.status(404).render("errors/404", { pageTitle: "Siden finnes ikke" });
    }

    return res.render("admin/product-form", {
      pageTitle: "Rediger produkt",
      product,
      formData: product,
      ProductStatus,
      hasGoogleImageSearchCredentials: hasGoogleImageSearchCredentials()
    });
  } catch (error) {
    return next(error);
  }
}

async function updateProduct(req, res, next) {
  const { errors, payload } = validateProductInput(req.body);

  if (errors.length > 0) {
    return res.status(422).render("admin/product-form", {
      pageTitle: "Rediger produkt",
      errors,
      formData: { ...req.body, id: req.params.productId },
      ProductStatus,
      product: { id: req.params.productId },
      hasGoogleImageSearchCredentials: hasGoogleImageSearchCredentials()
    });
  }

  try {
    if (payload.autoFetchImage && !payload.imageUrl) {
      const imageData = await fetchBeerImageFromGoogle({
        breweryName: payload.breweryName,
        beerName: payload.name
      });

      if (imageData) {
        payload.imageUrl = imageData.imageUrl;
        payload.imageAttribution = imageData.attribution;
      }
    }

    delete payload.autoFetchImage;
    await prisma.product.update({
      where: { id: req.params.productId },
      data: payload
    });
    req.flash("success", "Produktet ble oppdatert.");
    return res.redirect("/admin/products");
  } catch (error) {
    return next(error);
  }
}

function showBulkCreate(req, res) {
  res.render("admin/bulk-products", {
    pageTitle: "Masseinnlegg produkter",
    formData: { rows: "" },
    ProductStatus,
    hasGoogleImageSearchCredentials: hasGoogleImageSearchCredentials()
  });
}

async function createBulkProducts(req, res) {
  const { products, errors } = parseBulkProductLines(req.body.rows);

  if (!products.length || errors.length) {
    return res.status(422).render("admin/bulk-products", {
      pageTitle: "Masseinnlegg produkter",
      errors: errors.length ? errors : ["Legg inn minst én linje."],
      formData: { rows: req.body.rows || "" },
      ProductStatus,
      hasGoogleImageSearchCredentials: hasGoogleImageSearchCredentials()
    });
  }

  try {
    const validatedProducts = [];

    for (const row of products) {
      const { errors: rowErrors, payload } = validateProductInput({
        ...row,
        autoFetchImage: req.body.autoFetchImage
      });

      if (rowErrors.length) {
        throw new Error(`${row.name || "Uten navn"}: ${rowErrors.join(" ")}`);
      }

      if (payload.autoFetchImage && !payload.imageUrl) {
        const imageData = await fetchBeerImageFromGoogle({
          breweryName: payload.breweryName,
          beerName: payload.name
        });

        if (imageData) {
          payload.imageUrl = imageData.imageUrl;
          payload.imageAttribution = imageData.attribution;
        }
      }

      delete payload.autoFetchImage;
      validatedProducts.push(payload);
    }

    await prisma.product.createMany({
      data: validatedProducts
    });

    req.flash("success", `${validatedProducts.length} produkter ble lagt inn.`);
    return res.redirect("/admin/products");
  } catch (error) {
    return res.status(422).render("admin/bulk-products", {
      pageTitle: "Masseinnlegg produkter",
      errors: [error.message],
      formData: { rows: req.body.rows || "" },
      ProductStatus,
      hasGoogleImageSearchCredentials: hasGoogleImageSearchCredentials()
    });
  }
}

async function changeProductStatus(req, res, next) {
  try {
    await prisma.product.update({
      where: { id: req.params.productId },
      data: { status: req.body.status }
    });
    req.flash("success", "Produktstatus ble oppdatert.");
    return res.redirect("/admin/products");
  } catch (error) {
    return next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.order.deleteMany({
        where: { productId: req.params.productId }
      });

      await tx.product.delete({
        where: { id: req.params.productId }
      });
    });

    req.flash("success", "Produktet og tilhørende bestillinger ble slettet.");
    return res.redirect("/admin/products");
  } catch (error) {
    return next(error);
  }
}

async function showProductOrders(req, res, next) {
  try {
    const overview = await getProductOverview(req.params.productId);

    if (!overview) {
      return res.status(404).render("errors/404", { pageTitle: "Siden finnes ikke" });
    }

    const query = String(req.query.q || "").trim().toLowerCase();
    const sort = String(req.query.sort || "updatedAt");
    const direction = req.query.direction === "asc" ? "asc" : "desc";

    const filteredOrders = overview.product.orders.filter((order) => {
      if (!query) {
        return true;
      }

      return (
        order.user.fullName.toLowerCase().includes(query) ||
        order.user.username.toLowerCase().includes(query)
      );
    });

    const sortedOrders = filteredOrders.sort((a, b) => {
      const directionFactor = direction === "asc" ? 1 : -1;

      if (sort === "fullName") {
        return a.user.fullName.localeCompare(b.user.fullName, "nb") * directionFactor;
      }

      if (sort === "username") {
        return a.user.username.localeCompare(b.user.username, "nb") * directionFactor;
      }

      if (sort === "quantity") {
        return (a.quantity - b.quantity) * directionFactor;
      }

      return (new Date(a.updatedAt) - new Date(b.updatedAt)) * directionFactor;
    });

    return res.render("admin/product-orders", {
      pageTitle: "Bestillingsoversikt",
      ...overview,
      orders: sortedOrders,
      query,
      sort,
      direction,
      formatCurrency,
      formatDate
    });
  } catch (error) {
    return next(error);
  }
}

async function exportProductOrdersCsv(req, res, next) {
  try {
    const overview = await getProductOverview(req.params.productId);
    if (!overview) {
      return res.status(404).render("errors/404", { pageTitle: "Siden finnes ikke" });
    }

    const csv = buildProductOrdersCsv(overview.product, overview.product.orders);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${overview.product.name}.csv"`);
    return res.send(csv);
  } catch (error) {
    return next(error);
  }
}

async function toggleOrderFlag(req, res, next) {
  const redirectTo = String(req.body.redirectTo || req.get("referer") || "/admin/orders");
  const action = String(req.body.action || "").trim();
  const wantsJson =
    req.body.ajax === "1" ||
    req.xhr ||
    req.get("x-requested-with") === "XMLHttpRequest" ||
    (req.get("accept") || "").includes("application/json");

  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId }
    });

    if (!order) {
      if (wantsJson) {
        return res.status(404).json({ success: false, message: "Bestillingen finnes ikke." });
      }
      req.flash("error", "Bestillingen finnes ikke.");
      return res.redirect(redirectTo);
    }

    if (action !== "paid" && action !== "pickedUp") {
      if (wantsJson) {
        return res.status(400).json({ success: false, message: "Ugyldig handling." });
      }
      req.flash("error", "Ugyldig handling.");
      return res.redirect(redirectTo);
    }

    const fieldName = action === "paid" ? "paidAt" : "pickedUpAt";
    const nextValue = order[fieldName] ? null : new Date();

    const updatedOrder = await prisma.order.update({
      where: { id: req.params.orderId },
      data: {
        [fieldName]: nextValue
      }
    });

    if (wantsJson) {
      return res.json({
        success: true,
        action,
        active: Boolean(updatedOrder[fieldName]),
        timestamp: updatedOrder[fieldName]
          ? new Intl.DateTimeFormat("nb-NO", {
              dateStyle: "long",
              timeStyle: "short"
            }).format(new Date(updatedOrder[fieldName]))
          : null,
        message: action === "paid" ? "Betalingsstatus ble oppdatert." : "Hentestatus ble oppdatert."
      });
    }

    req.flash("success", action === "paid" ? "Betalingsstatus ble oppdatert." : "Hentestatus ble oppdatert.");
    return res.redirect(redirectTo);
  } catch (error) {
    if (wantsJson) {
      return res.status(500).json({
        success: false,
        message: error.message || "Kunne ikke oppdatere status."
      });
    }

    return next(error);
  }
}

module.exports = {
  showDashboard,
  listUsers,
  showOrdersSummary,
  changeUserStatus,
  changeUserRole,
  listProducts,
  showNewProduct,
  showBulkCreate,
  createProduct,
  createBulkProducts,
  showEditProduct,
  updateProduct,
  changeProductStatus,
  deleteProduct,
  showProductOrders,
  exportProductOrdersCsv,
  toggleOrderFlag
};
