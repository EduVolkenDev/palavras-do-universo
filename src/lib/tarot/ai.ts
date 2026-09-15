import { generateAnthropicText } from "@/lib/ai/anthropic";

type ReadingGenerationLimits = {
  maxTokens: number;
  maxCharacters: number;
};

function normalizeReadingText(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, (match) =>
      match.replace(/^```[a-z]*\s*/i, "").replace(/```$/i, "")
    )
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/^#{1,6}\s*/g, "")
        .replace(/^\s*[-*_]{3,}\s*$/g, "")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/^>\s?/g, "")
        .trim()
    )
    .filter((line) => line && !/^[^\p{L}\p{N}]*palavras do universo$/iu.test(line))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function generateReadingAI(
  prompt: string,
  limits: ReadingGenerationLimits
) {
  let text: string;
  try {
    text = normalizeReadingText(
      await generateAnthropicText({
        user: prompt,
        maxTokens: limits.maxTokens,
        temperature: 0.7,
        model: process.env.ANTHROPIC_MODEL,
        capability: "reading",
      })
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("output token limit")) {
      throw new Error("Anthropic reading exceeded the output token limit");
    }
    throw error;
  }

  if (!text) {
    throw new Error("Anthropic returned an empty reading");
  }
  if (text.length > limits.maxCharacters) {
    throw new Error("Anthropic reading exceeded the character limit");
  }

  return text;
}
