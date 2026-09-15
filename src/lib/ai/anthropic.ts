import "server-only";

import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-sonnet-4-6";
const DEFAULT_TIMEOUT_MS = 45_000;
const DEFAULT_MAX_RETRIES = 0;

export type AnthropicTextOptions = {
  system?: string;
  user: string;
  maxTokens: number;
  maxCharacters?: number;
  temperature?: number;
  model?: string;
  timeoutMs?: number;
  capability?: "lume" | "reading";
  requestId?: string;
};

function readBoundedNumber(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.trunc(parsed), min), max);
}

function normalizeText(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, (match) =>
      match.replace(/^```[a-z]*\s*/i, "").replace(/```$/i, "")
    )
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function generateViaGateway({
  gatewayUrl,
  gatewayToken,
  system,
  user,
  maxTokens,
  temperature,
  timeoutMs,
  capability,
  requestId,
}: {
  gatewayUrl: string;
  gatewayToken: string;
  system?: string;
  user: string;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  capability: "lume" | "reading";
  requestId?: string;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(gatewayUrl.replace(/\/$/, ""), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${gatewayToken}`,
        "Content-Type": "application/json",
        "x-ai-gateway-version": "1",
      },
      body: JSON.stringify({
        product: "pdu",
        capability,
        system: system || "",
        user,
        max_tokens: maxTokens,
        temperature,
        ...(requestId ? { request_id: requestId } : {}),
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`AI gateway error ${response.status}`);

    const payload = await response.json() as { text?: unknown };
    const text = typeof payload.text === "string" ? normalizeText(payload.text) : "";
    if (!text) throw new Error("AI gateway returned an empty response");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateAnthropicText({
  system,
  user,
  maxTokens,
  maxCharacters,
  temperature = 0.7,
  model,
  timeoutMs,
  capability = "reading",
  requestId,
}: AnthropicTextOptions) {
  const effectiveTimeoutMs = readBoundedNumber(
    timeoutMs === undefined ? process.env.ANTHROPIC_TIMEOUT_MS : String(timeoutMs),
    DEFAULT_TIMEOUT_MS,
    5_000,
    45_000
  );
  const gatewayUrl = process.env.PDU_AI_GATEWAY_URL?.trim();
  const gatewayToken = process.env.PDU_AI_GATEWAY_TOKEN?.trim();
  if (gatewayUrl && gatewayToken) {
    const text = await generateViaGateway({
      gatewayUrl,
      gatewayToken,
      system,
      user,
      maxTokens,
      temperature,
      timeoutMs: effectiveTimeoutMs,
      capability,
      requestId,
    });
    if (maxCharacters && text.length > maxCharacters) {
      throw new Error("Anthropic response exceeded the character limit");
    }
    return text;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const client = new Anthropic({
    apiKey,
    timeout: effectiveTimeoutMs,
    maxRetries: readBoundedNumber(
      process.env.ANTHROPIC_MAX_RETRIES,
      DEFAULT_MAX_RETRIES,
      0,
      1
    ),
  });
  const response = await client.messages.create({
    model: model?.trim() || process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL,
    max_tokens: maxTokens,
    temperature,
    ...(system?.trim() ? { system: system.trim() } : {}),
    messages: [{ role: "user", content: user }],
  });

  if (response.stop_reason === "max_tokens") {
    throw new Error("Anthropic response exceeded the output token limit");
  }

  const text = normalizeText(
    response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
  );

  if (!text) throw new Error("Anthropic returned an empty response");
  if (maxCharacters && text.length > maxCharacters) {
    throw new Error("Anthropic response exceeded the character limit");
  }

  return text;
}
