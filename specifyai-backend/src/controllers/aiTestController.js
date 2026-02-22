const createError = require("../utils/createError");
const { generateQuestions } = require("../services/ai/questionGeneration");
const { generateSpecification } = require("../services/ai/generateSpecification");

const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

const validatePayload = (requirement, clarifications) => {
  if (!isNonEmptyString(requirement)) {
    throw createError(400, "Requirement must be a non-empty string");
  }
  if (!Array.isArray(clarifications)) {
    throw createError(400, "Clarifications must be an array");
  }
};

const testQuestions = async (req, res) => {
  const { requirement, clarifications } = req.body || {};
  validatePayload(requirement, clarifications);

  const questions = await generateQuestions(requirement, clarifications);

  res.json(questions);
};

const testSpecification = async (req, res) => {
  const { requirement, clarifications } = req.body || {};
  validatePayload(requirement, clarifications);

  const specification = await generateSpecification(requirement, clarifications);

  res.json(specification);
};

module.exports = {
  testQuestions,
  testSpecification,
};
