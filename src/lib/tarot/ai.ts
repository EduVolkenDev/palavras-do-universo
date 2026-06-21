import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-sonnet-4-6";

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

  const text = normalizeReadingText(
    response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
  );

  if (!text) {
    throw new Error("Anthropic returned an empty reading");
  }
  if (text.length > limits.maxCharacters) {
    throw new Error("Anthropic reading exceeded the character limit");
  }

  return text;
}
