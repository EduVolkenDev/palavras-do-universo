import type { SkyEmailLocale } from "./consent";
import { brevoApiConfigured, sendBrevoEmail } from "@/lib/email/brevo-api";

const SITE_URL = "https://palavrasdouniverso.com";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] ?? character);
}

export function skyEmailConfigured() {
  return brevoApiConfigured();
}

export async function sendSkyEmail(input: {
  to: string;
  locale: SkyEmailLocale;
  subject: string;
  paragraphs: string[];
  action?: { label: string; url: string };
  unsubscribeUrl?: string;
  tag: "daily-sky-confirmation" | "daily-sky";
}) {
  if (!skyEmailConfigured()) throw new Error("Daily sky email provider is not configured");
  const en = input.locale === "en";
  const safeParagraphs = input.paragraphs.map((part) => `<p style="font-size:17px;line-height:1.65;color:#41352f">${escapeHtml(part)}</p>`).join("");
  const action = input.action
    ? `<p style="padding:16px 0"><a href="${escapeHtml(input.action.url)}" style="display:inline-block;background:#efd08b;color:#211a23;border-radius:999px;padding:14px 22px;text-decoration:none;font-weight:bold">${escapeHtml(input.action.label)}</a></p><p style="font-size:13px;line-height:1.6;color:#41352f">${en ? "If the button does not open, copy this full address into your browser:" : "Se o botão não abrir, copie este endereço completo no navegador:"}</p><p style="font-size:13px;line-height:1.6;word-break:break-all;color:#41352f">${escapeHtml(input.action.url)}</p>`
    : "";
  const footer = input.unsubscribeUrl
    ? `<p style="font-size:13px;line-height:1.5;color:#71665c">${input.tag === "daily-sky-confirmation" ? (en ? "You requested a newsletter subscription. You may cancel it here." : "Você solicitou a inscrição no boletim. Pode cancelá-la aqui.") : (en ? "You received this because you confirmed the daily sky email." : "Você recebeu este e-mail porque confirmou a assinatura do céu diário.")} <a href="${escapeHtml(input.unsubscribeUrl)}">${en ? "Unsubscribe" : "Cancelar inscrição"}</a>.</p><p style="font-size:13px;line-height:1.6;word-break:break-all;color:#71665c">${en ? "You can also copy this cancellation address into your browser:" : "Você também pode copiar este endereço de cancelamento no navegador:"}<br>${escapeHtml(input.unsubscribeUrl)}</p>`
    : "";
  const htmlContent = `<!doctype html><html lang="${en ? "en" : "pt-BR"}"><body style="margin:0;background:#f4ecdf;font-family:Arial,sans-serif"><div style="max-width:600px;margin:0 auto;padding:32px 24px"><div style="background:#201923;color:#efd08b;padding:22px 28px;border-radius:20px 20px 0 0;letter-spacing:.14em;font-size:13px">PALAVRAS DO UNIVERSO</div><div style="background:#fffaf2;padding:28px;border-radius:0 0 20px 20px"><h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.2;color:#231b21">${escapeHtml(input.subject)}</h1>${safeParagraphs}${action}<hr style="border:0;border-top:1px solid #e8dbc6;margin:28px 0"><p style="font-size:13px;color:#71665c">${en ? "A symbolic reading of the sky, for reflection — not a prediction." : "Uma leitura simbólica do céu, para reflexão — não uma previsão."} <a href="${SITE_URL}">${SITE_URL}</a></p>${footer}</div></div></body></html>`;
  const textContent = [input.subject, ...input.paragraphs, input.action ? `${input.action.label}: ${input.action.url}` : "", input.unsubscribeUrl ? `${en ? "Unsubscribe" : "Cancelar inscrição"}: ${input.unsubscribeUrl}` : ""].filter(Boolean).join("\n\n");
  return sendBrevoEmail({
    to: input.to,
    subject: input.subject,
    htmlContent,
    textContent,
    tags: [input.tag],
    senderEmail: "suporte@palavrasdouniverso.com",
  });
}
