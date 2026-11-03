type BrevoEmailInput = {
  to: string;
  subject: string;
  textContent: string;
  htmlContent: string;
  senderEmail?: string;
  replyTo?: string;
  tags?: string[];
  headers?: Record<string, string>;
};

function clean(value: string | undefined) {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "").trim();
}

export function brevoApiConfigured() {
  return Boolean(clean(process.env.BREVO_API_KEY) && clean(process.env.PDU_EMAIL_FROM));
}

export async function sendBrevoEmail(input: BrevoEmailInput): Promise<string> {
  const apiKey = clean(process.env.BREVO_API_KEY);
  const senderEmail = input.senderEmail ?? clean(process.env.PDU_EMAIL_FROM);
  if (!apiKey || !senderEmail) throw new Error("BREVO_API_NOT_CONFIGURED");

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json", "api-key": apiKey },
    body: JSON.stringify({
      sender: { name: "Palavras do Universo", email: senderEmail },
      to: [{ email: input.to }],
      ...(input.replyTo ? { replyTo: { email: input.replyTo } } : {}),
      subject: input.subject,
      textContent: input.textContent,
      htmlContent: input.htmlContent,
      ...(input.tags ? { tags: input.tags } : {}),
      ...(input.headers ? { headers: input.headers } : {}),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Brevo returned HTTP ${response.status}`);
  const result = await response.json() as { messageId?: string };
  if (!result.messageId) throw new Error("Brevo accepted without a message ID");
  return result.messageId;
}
