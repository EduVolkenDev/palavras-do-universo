import OpenAI from "openai";

export async function generateReadingAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey });
  const res = await client.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
    temperature: 0.7,
    max_output_tokens: 1200,
  });

  return res.output_text.trim();
}
