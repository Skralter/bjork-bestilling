const express = require("express");
const accountController = require("../controllers/accountController");
const { requireApprovedUser } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireApprovedUser, accountController.showAccount);
router.post("/profile", requireApprovedUser, accountController.updateProfile);
router.post("/password", requireApprovedUser, accountController.changePassword);

module.exports = router;
