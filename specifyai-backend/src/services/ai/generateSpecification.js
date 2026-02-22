const { generateText } = require("./aiClient");
const { safeJSONParse } = require("../../utils/jsonUtils");

const generateSpecification = async (requirement, clarifications) => {
  const prompt = `
You are a senior software architect and requirements analyst.

Your task is to generate a COMPREHENSIVE, DETAILED software specification
by analyzing the requirement and all user clarifications.

IMPORTANT: This specification must be thorough and actionable for developers.

Original Requirement:
${requirement}

User Clarifications & Answers (from multiple rounds of Q&A):
${JSON.stringify(clarifications, null, 2)}

Generate a detailed specification following this JSON SCHEMA (keep structure):

{
  "overview": {
    "title": "Overview",
    "description": "What the system does and why it exists"
  },
  "problem_statement": {
    "title": "Problem Statement",
    "description": "What problem(s) this system solves",
    "pain_points": ["pain point 1", "pain point 2"]
  },
  "proposed_solution": {
    "title": "Proposed Solution",
    "description": "How this system solves the problems",
    "key_benefits": ["benefit 1", "benefit 2"]
  },
  "goals": {
    "title": "Goals",
    "items": [
      {
        "title": "Goal title",
        "description": "Goal description"
      }
    ]
  },
  "user_roles": {
    "title": "User Roles",
    "roles": [
      {
        "name": "Role name",
        "description": "What they need to do"
      }
    ]
  },
  "functional_requirements": {
    "title": "Functional Requirements",
    "requirements": [
      {
        "id": "FR-1",
        "title": "Requirement title",
        "description": "Detailed requirement",
        "priority": "HIGH | MEDIUM | LOW"
      }
    ]
  },
  "non_functional_requirements": {
    "title": "Non-Functional Requirements",
    "requirements": [
      {
        "id": "NFR-1",
        "category": "Performance | Security | Scalability | Usability | Reliability",
        "description": "Requirement description"
      }
    ]
  },
  "assumptions": {
    "title": "Assumptions",
    "items": ["Assumption 1", "Assumption 2"]
  },
  "constraints": {
    "title": "Constraints",
    "items": ["Constraint 1", "Constraint 2"]
  },
  "dependencies": {
    "title": "Dependencies",
    "items": ["Dependency 1", "Dependency 2"]
  },
  "risks": {
    "title": "Risks & Mitigation",
    "items": [
      {
        "risk": "Risk description",
        "impact": "Impact if it occurs",
        "mitigation": "How to reduce or handle it"
      }
    ]
  }
}

GENERATION INSTRUCTIONS:
1. Use all clarification info.
2. Keep language clear and specific.
3. Include 6-10 functional requirements.
4. Include at least 5 non-functional requirements.
5. Output ONLY valid JSON. No markdown or extra text.`;

 const text = await generateText({
  prompt,
  maxTokens: 2500
});

  try {
    return safeJSONParse(text);
  } catch (err) {
    const repairPrompt = `
You are a JSON repair tool.

TASK:
- Convert the following content into VALID JSON that matches the schema below.
- Output ONLY JSON. No markdown, no comments, no extra text.
- Keep all meaningful content, but fix any JSON errors.

SCHEMA (for reference only):
${prompt}

CONTENT TO FIX:
${text}
`;

    const repaired = await generateText({
      prompt: repairPrompt,
      maxTokens: 5000
    });

    return safeJSONParse(repaired);
  }
};

module.exports = {
  generateSpecification,
};
