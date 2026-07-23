const express = require("express");
const productController = require("../controllers/productController");
const { requireApprovedUser } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireApprovedUser, productController.listProducts);
router.post("/:productId/order", requireApprovedUser, productController.saveOrder);
router.get("/my-orders", requireApprovedUser, productController.listMyOrders);

module.exports = router;
