const mongoose = require("mongoose");
const Project = require("../models/Project");
const User = require("../models/User");
const { generateQuestions } = require("../services/ai/questionGeneration");
const { generateSpecification } = require("../services/ai/generateSpecification");
const createError = require("../utils/createError");

const BASE_ROUNDS = Number(process.env.ROUNDS || 3);

const isPlainObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;
const VALID_ACTIONS = new Set(["GENERATE", "EXTRA_ROUND"]);
const getTotalRounds = (project) =>
  BASE_ROUNDS + (project.allowExtraRound ? 1 : 0);

const analyzeRequirement = async (req, res) => {
  const { requirement } = req.body;
  const userId = req.user?.id;

  if (!userId || !requirement) {
    throw createError(400, "Authenticated user and requirement are required");
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw createError(400, "Invalid userId");
  }
  if (typeof requirement !== "string" || requirement.trim().length === 0) {
    throw createError(400, "Requirement must be a non-empty string");
  }
  const user = await User.findById(userId);
  if (!user) {
    throw createError(404, "User not found");
  }

  const project = await Project.create({
    userId,
    requirement,
    clarifications: [],
  });

  const questions = await generateQuestions(
    project.requirement,
    project.clarifications,
  );
  if (!Array.isArray(questions)) {
    throw createError(500, "Failed to generate questions");
  }

  if (!Array.isArray(project.clarifications)) {
    throw createError(500, "Project clarifications are invalid");
  }
  project.clarifications = [
    {
      questions,
      answers: {},
    },
  ];
  project.markModified("clarifications");

  await project.save();

  res.status(201).json({
    projectId: project._id,
    round: project.clarifications.length,
    currentRound: project.clarifications.length,
    totalRounds: getTotalRounds(project),
    questions,
  });
};

const submitClarifications = async (req, res) => {
  const { projectId } = req.params;
  const { answers, action } = req.body;
  // action is optional: "GENERATE" | "EXTRA_ROUND"

  if (action && !VALID_ACTIONS.has(action)) {
    throw createError(400, "Invalid action");
  }

  // 1️⃣ Validate projectId
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw createError(400, "Invalid projectId");
  }

  // 2️⃣ Validate answers (can be empty object in decision step)
  if (answers && !isPlainObject(answers)) {
    throw createError(
      400,
      "Answers must be an object with question IDs as keys",
    );
  }

  // 3️⃣ Load project
  const project = await Project.findById(projectId);
  if (!project) {
    throw createError(404, "Project not found");
  }

  // 4️⃣ Ownership check
  if (String(project.userId) !== String(req.user?.id)) {
    throw createError(403, "Forbidden");
  }

  // 5️⃣ State check
  if (project.status === "COMPLETED") {
    throw createError(400, "Project is already completed");
  }

  if (project.allowExtraRound && action === "EXTRA_ROUND") {
    throw createError(400, "Extra round has already been used");
  }

  if (!Array.isArray(project.clarifications)) {
    throw createError(500, "Project clarifications are invalid");
  }

  const currentRound = project.clarifications.length;

  // 6️⃣ Handle DECISION step (after base rounds)
  if (
    project.status === "READY_FOR_SPEC" &&
    currentRound === BASE_ROUNDS &&
    !project.allowExtraRound
  ) {
    if (answers && Object.keys(answers).length > 0) {
      throw createError(400, "No answers expected at decision stage");
    }

    if (action === "GENERATE") {
      // User chose to generate spec
      console.log("[GENERATE] Starting specification generation...");
      console.log("[GENERATE] Requirement:", project.requirement);
      console.log("[GENERATE] Clarifications count:", project.clarifications.length);
      
      const finalSpec = await generateSpecification(
        project.requirement,
        project.clarifications,
      );

      console.log("[GENERATE] Specification generated successfully");

      project.finalSpec = finalSpec;
      project.status = "COMPLETED";
      await project.save();

      console.log("[GENERATE] Project saved, returning response");

      return res.json({
        projectId: project._id,
        screen: "SPEC_VIEW",
        finalSpec,
        currentRound,
        totalRounds: getTotalRounds(project),
      });
    }

    if (action === "EXTRA_ROUND") {
      // User allowed one extra round
      project.allowExtraRound = true;
      project.status = "IN_PROGRESS";

      const questions = await generateQuestions(
        project.requirement,
        project.clarifications,
      );

      project.clarifications.push({
        questions,
        answers: {},
      });

      await project.save();

      return res.json({
        projectId: project._id,
        screen: "QUESTIONS",
        round: project.clarifications.length,
        currentRound: project.clarifications.length,
        totalRounds: getTotalRounds(project),
        questions,
      });
    }

    // No action provided → frontend should show decision UI
    return res.json({
      projectId: project._id,
      screen: "DECISION",
      message: "Do you want to refine further or generate the specification?",
      options: ["GENERATE", "EXTRA_ROUND"],
      currentRound,
      totalRounds: getTotalRounds(project),
    });
  }

  if (project.status === "READY_FOR_SPEC" && !action) {
    throw createError(400, "No answers expected at decision stage");
  }

  // 7️⃣ Normal clarification answer submission
  if (currentRound === 0) {
    throw createError(
      400,
      "No questions have been generated for this project yet",
    );
  }

  const currentClarification = project.clarifications[currentRound - 1];
  const existingAnswers =
    currentClarification.answers instanceof Map
      ? Object.fromEntries(currentClarification.answers)
      : isPlainObject(currentClarification.answers)
        ? currentClarification.answers
        : {};
  if (Object.keys(existingAnswers).length > 0) {
    throw createError(400, "Answers already submitted for this round");
  }

  if (!currentClarification || !Array.isArray(currentClarification.questions)) {
    throw createError(500, "Current clarification is invalid");
  }

  const questionIds = currentClarification.questions
    .map((q) => q && q.id)
    .filter(Boolean);

  const answerIds = Object.keys(answers || {});
  const unknownAnswerIds = answerIds.filter((id) => !questionIds.includes(id));

  if (unknownAnswerIds.length > 0) {
    throw createError(400, "Answers contain unknown question IDs");
  }

  const missingAnswerIds = questionIds.filter((id) => !answerIds.includes(id));
  if (missingAnswerIds.length > 0) {
    throw createError(400, "Please answer all questions");
  }

  const emptyAnswerIds = questionIds.filter(
    (id) => !isNonEmptyString((answers || {})[id]),
  );
  if (emptyAnswerIds.length > 0) {
    throw createError(400, "Please answer all questions");
  }

  currentClarification.answers = answers || {};

  // 8️⃣ After extra round → auto-generate spec
  if (project.allowExtraRound && currentRound === BASE_ROUNDS + 1) {
    const finalSpec = await generateSpecification(
      project.requirement,
      project.clarifications,
    );

    project.finalSpec = finalSpec;
    project.status = "COMPLETED";
    await project.save();

    return res.json({
      projectId: project._id,
      screen: "SPEC_VIEW",
      finalSpec,
      currentRound,
      totalRounds: getTotalRounds(project),
    });
  }

  // 9️⃣ If reached base rounds → decision state
  if (currentRound === BASE_ROUNDS) {
    project.status = "READY_FOR_SPEC";
    await project.save();

    return res.json({
      projectId: project._id,
      screen: "DECISION",
      options: ["GENERATE", "EXTRA_ROUND"],
      currentRound,
      totalRounds: getTotalRounds(project),
    });
  }

  // 🔁 Continue normal rounds
  const questions = await generateQuestions(
    project.requirement,
    project.clarifications,
  );

  if (!Array.isArray(questions)) {
    throw createError(500, "Failed to generate questions");
  }

  project.clarifications.push({
    questions,
    answers: {},
  });

  await project.save();

  res.json({
    projectId: project._id,
    screen: "QUESTIONS",
    round: project.clarifications.length,
    currentRound: project.clarifications.length,
    totalRounds: getTotalRounds(project),
    questions,
  });
};

const getProjectById = async (req, res) => {
  const { projectId } = req.params;

  // 1️⃣ Validate projectId
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw createError(400, "Invalid projectId");
  }

  // 2️⃣ Fetch project
  const project = await Project.findById(projectId).populate(
    "userId",
    "username email",
  );

  if (!project) {
    throw createError(404, "Project not found");
  }
  if (String(project.userId?._id || project.userId) !== String(req.user?.id)) {
    throw createError(403, "Forbidden");
  }

  // 3️⃣ Base response (safe user mapping)
  const baseResponse = {
    projectId: project._id,
    user: project.userId
      ? {
          id: project.userId._id,
          username: project.userId.username,
          email: project.userId.email,
        }
      : null,
    status: project.status,
    currentRound: project.clarifications?.length ?? 0,
    totalRounds: getTotalRounds(project),
  };

  // 4️⃣ COMPLETED → show final spec
  if (project.status === "COMPLETED") {
    if (!project.finalSpec) {
      throw createError(
        500,
        "Project marked COMPLETED but finalSpec is missing",
      );
    }

    return res.json({
      ...baseResponse,
      screen: "SPEC_VIEW",
      finalSpec: project.finalSpec,
    });
  }

  // 5️⃣ Clarification safety checks
  const clarifications = Array.isArray(project.clarifications)
    ? project.clarifications
    : [];

  const lastRound =
    clarifications.length > 0
      ? clarifications[clarifications.length - 1]
      : null;

  const questions = Array.isArray(lastRound?.questions)
    ? lastRound.questions
    : [];

  const answers =
    lastRound?.answers instanceof Map
      ? Object.fromEntries(lastRound.answers)
      : isPlainObject(lastRound?.answers)
        ? lastRound.answers
        : {};

  // 6️⃣ IN_PROGRESS with questions
  if (project.status === "IN_PROGRESS" && questions.length > 0) {
    return res.json({
      ...baseResponse,
      screen: "QUESTIONS",
      requirement: project.requirement,
      questions,
      answers,
      canGenerateSpec: false,
    });
  }

  // 7️⃣ READY_FOR_SPEC → review & generate
  if (project.status === "READY_FOR_SPEC") {
    return res.json({
      ...baseResponse,
      screen: "QUESTIONS_REVIEW",
      requirement: project.requirement,
      questions,
      answers,
      canGenerateSpec: true,
    });
  }

  // 8️⃣ IN_PROGRESS but no questions yet
  if (project.status === "IN_PROGRESS") {
    return res.json({
      ...baseResponse,
      screen: "REQUIREMENT_ONLY",
      requirement: project.requirement,
      canGenerateSpec: false,
    });
  }

  // 9️⃣ Fallback (should never happen)
  throw createError(500, "Invalid project state");
};

const getProjectsByUser = async (req, res) => {
  const userId = req.user?.id;
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw createError(400, "Invalid userId");
  }
  const user = await User.findById(userId);
  if (!user) {
    throw createError(404, "User not found");
  }
  const projects = await Project.find({ userId }).select(
    "requirement status createdAt",
  );
  res.json(
    projects.map((project) => ({
      projectId: project._id,
      requirement: project.requirement,
      status: project.status,
      createdAt: project.createdAt,
    })),
  );
};

const deleteProject = async (req, res) => {
  const { projectId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw createError(400, "Invalid projectId");
  }

  const project = await Project.findById(projectId);
  if (!project) {
    throw createError(404, "Project not found");
  }

  if (String(project.userId) !== String(req.user?.id)) {
    throw createError(403, "Forbidden");
  }

  await Project.deleteOne({ _id: projectId });

  res.status(204).send();
};

module.exports = {
  analyzeRequirement,
  submitClarifications,
  getProjectById,
  getProjectsByUser,
  deleteProject,
};
