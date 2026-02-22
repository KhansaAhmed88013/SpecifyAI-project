const express = require("express");
const usersController = require("../controllers/usersController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/", asyncHandler(usersController.createUser));
router.post("/login", asyncHandler(usersController.loginUser));
router.post("/forgot-password", asyncHandler(usersController.forgotPassword));
router.post("/verify-reset-code", asyncHandler(usersController.verifyResetCode));
router.post("/reset-password", asyncHandler(usersController.resetPassword));

module.exports = router;
