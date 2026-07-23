const express = require("express");
const authController = require("../controllers/authController");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

router.get("/login", authController.showLogin);
router.post("/login", authController.login);
router.get("/register", authController.showRegister);
router.post("/register", authController.register);
router.get("/pending", requireLogin, authController.showPending);
router.post("/logout", requireLogin, authController.logout);

module.exports = router;
