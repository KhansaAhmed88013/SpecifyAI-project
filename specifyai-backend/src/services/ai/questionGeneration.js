const { generateText } = require("./aiClient");
const { safeJSONParse } = require("../../utils/jsonUtils");

const generateQuestions = async (requirement, clarifications) => {
  // Extract already covered topics from previous rounds
  const previousTopics = clarifications && clarifications.length > 0 
    ? clarifications.map((round, idx) => {
        const questions = round.questions || [];
        const answers = round.answers || {};
        return questions.map(q => `Q: ${q.text} | A: ${answers[q.id] || 'not answered'}`).join('\n');
      }).join('\n\n') 
    : 'No previous questions yet.';

  const prompt = `
You are helping someone plan their software project. They may not have technical knowledge.

Your job is to ask clear, simple questions to understand their needs better.

Project Idea:
${requirement}

PREVIOUSLY ASKED QUESTIONS AND ANSWERS:
${previousTopics}

⚠️ CRITICAL: READ THE ABOVE CAREFULLY. DO NOT ASK ABOUT TOPICS ALREADY COVERED.

YOUR TASK:
Ask 4-5 NEW questions in SIMPLE, EVERYDAY LANGUAGE that anyone can understand.

TOPICS TO ASK ABOUT (choose topics NOT yet covered):
- Who will use this? (different types of users)
- What's the main goal or purpose?
- What features or actions should people be able to do?
- Should this work on phones, computers, or both?
- What extra features would make it better?
- How many people will use it at once?
- Does it need to connect to other services? (payment, email, etc.)
- How should people create accounts and log in?
- Any concerns about keeping data safe and private?
- When do they need this finished?
- Do they have a budget in mind?
- What would be nice to have but not required?

CRITICAL RULES:
- ANALYZE the previous Q&A above - DO NOT ask similar questions again or questions that have same context
- If a topic was already asked, SKIP IT completely and ask something new
- Use SIMPLE words - no technical jargon
- Ask open questions (What, How, Why) - NOT yes/no questions
- Keep questions short and clear (one topic per question)
- Be conversational and friendly
- Each question must be on a completely different topic
- Output ONLY valid JSON array
- Do NOT include markdown, code fences, or explanations
- IDs MUST be sequential: q1, q2, q3, q4, q5
- No duplicate IDs

Output format:
[
  { "id": "q1", "text": "Question text here" },
  { "id": "q2", "text": "Question text here" }
]
`;

  const text = await generateText({
    prompt,
    maxTokens: 800
  });

  return safeJSONParse(text);
};

module.exports = {
  generateQuestions,
};