const DO_MODEL_ACCESS_KEY = process.env.DO_MODEL_ACCESS_KEY;

const getFetch = () => {
  if (typeof fetch === "function") {
    return fetch;
  }
  try {
    return require("node-fetch");
  } catch (err) {
    throw new Error(
      "Fetch API is not available. Use Node 18+ or install node-fetch.",
    );
  }
};

const generateText = async ({ prompt, maxTokens = 1500 }) => {
  if (!prompt) {
    throw new Error("Prompt is required and cannot be empty");
  }
  
  if (!DO_MODEL_ACCESS_KEY) {
    throw new Error("DO_MODEL_ACCESS_KEY is not configured");
  }

  const fetchFn = getFetch();

  const requestBody = {
    model: "mistral-nemo-instruct-2407",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
    max_tokens: maxTokens,
  };

  console.log("[DigitalOcean] Request - Prompt length:", prompt.length, ", Max tokens:", maxTokens);

  const response = await fetchFn(
    "https://inference.do-ai.run/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DO_MODEL_ACCESS_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    },
  );

  let data;
  try {
    data = await response.json();
  } catch (err) {
    data = null;
  }

  console.log("[DigitalOcean] Response status:", response.status);

  if (!response.ok) {
    const message =
      data?.error?.message ||
      `DigitalOcean inference failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  if (!data?.choices?.length) {
    const error = new Error("Invalid DigitalOcean response");
    error.payload = data;
    throw error;
  }

  return data.choices[0].message.content;
};

module.exports = {
  generateText,
};
