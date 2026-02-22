const express = require("express");
const projectsController = require("../controllers/projectsController");
const requireAuth = require("../middlewares/requireAuth");
const asyncHandler = require("../utils/asyncHandler");
const router = express.Router();

router.post(
  "/analyze-requirement",
  requireAuth,
  asyncHandler(projectsController.analyzeRequirement),
);

router.post(
  "/clarifications/:projectId",
  requireAuth,
  asyncHandler(projectsController.submitClarifications),
);

router.get(
  "/project/:projectId",
  requireAuth,
  asyncHandler(projectsController.getProjectById),
);

router.delete(
  "/project/:projectId",
  requireAuth,
  asyncHandler(projectsController.deleteProject),
);

router.get(
  "/user/me",
  requireAuth,
  asyncHandler(projectsController.getProjectsByUser),
);

module.exports = router;
