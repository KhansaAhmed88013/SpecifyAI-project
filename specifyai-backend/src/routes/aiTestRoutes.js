const express = require("express");
const aiTestController = require("../controllers/aiTestController");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.post("/questions", asyncHandler(aiTestController.testQuestions));
router.post("/specification", asyncHandler(aiTestController.testSpecification));

module.exports = router;
