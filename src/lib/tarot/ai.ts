import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-sonnet-4-6";

type ReadingGenerationLimits = {
  maxTokens: number;
  maxCharacters: number;
};

export async function generateReadingAI(
  prompt: string,
  limits: ReadingGenerationLimits
) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey, timeout: 45_000, maxRetries: 2 });
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL,
    max_tokens: limits.maxTokens,
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error("Anthropic reading exceeded the output token limit");
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Anthropic returned an empty reading");
  }
  if (text.length > limits.maxCharacters) {
    throw new Error("Anthropic reading exceeded the character limit");
  }

  return text;
}
