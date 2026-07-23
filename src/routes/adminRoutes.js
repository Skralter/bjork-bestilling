const express = require("express");
const adminController = require("../controllers/adminController");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAdmin, adminController.showDashboard);
router.get("/users", requireAdmin, adminController.listUsers);
router.get("/orders", requireAdmin, adminController.showOrdersSummary);
router.post("/users/:userId/status", requireAdmin, adminController.changeUserStatus);
router.post("/users/:userId/role", requireAdmin, adminController.changeUserRole);

router.get("/products", requireAdmin, adminController.listProducts);
router.get("/products/new", requireAdmin, adminController.showNewProduct);
router.get("/products/bulk", requireAdmin, adminController.showBulkCreate);
router.post("/products", requireAdmin, adminController.createProduct);
router.post("/products/bulk", requireAdmin, adminController.createBulkProducts);
router.get("/products/:productId/edit", requireAdmin, adminController.showEditProduct);
router.post("/products/:productId", requireAdmin, adminController.updateProduct);
router.post("/products/:productId/status", requireAdmin, adminController.changeProductStatus);
router.post("/products/:productId/delete", requireAdmin, adminController.deleteProduct);
router.get("/products/:productId/orders", requireAdmin, adminController.showProductOrders);
router.get("/products/:productId/orders/export", requireAdmin, adminController.exportProductOrdersCsv);

module.exports = router;
