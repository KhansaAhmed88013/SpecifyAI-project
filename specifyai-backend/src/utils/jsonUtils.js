// src/utils/jsonUtils.js
const stripJsonFence = (text) => {
  if (typeof text !== "string") {
    return text;
  }
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) {
    return text;
  }
  return trimmed
    .replace(/^```\s*json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
};

const escapeNewlinesInStrings = (text) => {
  if (typeof text !== "string") {
    return text;
  }
  let result = "";
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (inString) {
      if (!isEscaped && char === "\\") {
        isEscaped = true;
        result += char;
        continue;
      }

      if (!isEscaped && char === '"') {
        inString = false;
        result += char;
        continue;
      }

      if (!isEscaped && (char === "\n" || char === "\r")) {
        result += "\\n";
        continue;
      }

      isEscaped = false;
      result += char;
      continue;
    }

    if (char === '"') {
      inString = true;
    }

    result += char;
  }

  return result;
};

const safeJSONParse = (text) => {
  try {
    const normalized = escapeNewlinesInStrings(stripJsonFence(text));
    return JSON.parse(normalized);
  } catch (err) {
    const error = new Error("AI returned invalid JSON");
    error.originalOutput = text; // super useful for debugging
    throw error;
  }
};

module.exports = {
  safeJSONParse,
};
