import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export function createGeminiModel(temperature: number = 0.7): ChatGoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_API_KEY;
  let modelName = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  if (!apiKey) {
    throw new Error(`AI service is not configured. Add GOOGLE_API_KEY to enable the agent. [Diagnostic: GOOGLE_API_KEY=${!!apiKey}, GEMINI_MODEL=${!!process.env.GEMINI_MODEL}]`);
  }

  try {
    return new ChatGoogleGenerativeAI({
      model: modelName,
      temperature,
      apiKey,
    });
  } catch (error: any) {
    console.error("[Gemini Provider Error]:", error);
    throw new Error(`Gemini initialization failed: ${error.message || JSON.stringify(error)}`);
  }
}
