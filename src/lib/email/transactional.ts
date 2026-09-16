import nodemailer, { type Transporter } from "nodemailer";

const DEFAULT_FROM = "no-reply@palavrasdouniverso.com";
const DEFAULT_REPLY_TO = "suporte@palavrasdouniverso.com";
const SMTP_HOST = "smtp-relay.brevo.com";
const SMTP_PORT = 587;
const MAX_SEND_ATTEMPTS = 2;

let transporter: Transporter | null = null;

export type VoucherEmailInput = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  kind: "invite" | "discount" | "hybrid";
  share_url: string;
  primary_title: string | null;
  target_email: string | null;
  recipient_name: string | null;
  grant_expires_days: number | null;
};

export type VoucherEmailDelivery =
  | { status: "sent" }
  | { status: "skipped"; reason: "missing_recipient" | "missing_recipient_name" }
  | {
      status: "failed";
      reason: "not_configured" | "invalid_sender" | "send_failed";
    };

function clean(value: string | undefined) {
  return (value ?? "").trim().replace(/^['"]|['"]$/g, "").trim();
}

function escapeHtml(value: string) {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character
  );
}

function getTransporter() {
  if (transporter) return transporter;

  const user = clean(process.env.BREVO_SMTP_USER);
  const pass = clean(process.env.BREVO_SMTP_KEY);
  if (!user || !pass) return null;

  transporter = nodemailer.createTransport({
    host: clean(process.env.BREVO_SMTP_HOST) || SMTP_HOST,
    port: Number(process.env.BREVO_SMTP_PORT) || SMTP_PORT,
    secure: false,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  return transporter;
}

function getSender() {
  const configured = clean(process.env.PDU_EMAIL_FROM);
  if (configured && configured !== DEFAULT_FROM) return null;
  return DEFAULT_FROM;
}

function getReplyTo() {
  return clean(process.env.NEXT_PUBLIC_SUPPORT_EMAIL) || DEFAULT_REPLY_TO;
}

function getAccessDuration(days: number | null) {
  if (!days || days <= 0) return "special access";
  return days === 1 ? "1 day" : `${days} days`;
}

function getRecipientName(value: string | null) {
  return value?.replace(/[\r\n]+/g, " ").trim().slice(0, 120) || null;
}

function getAutoActivationUrl(shareUrl: string) {
  return `${shareUrl}${shareUrl.includes("?") ? "&" : "?"}auto=1`;
}

function buildVoucherEmail(voucher: VoucherEmailInput) {
  const title = (voucher.primary_title || "Meu Universo")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, 120);
  const duration = getAccessDuration(voucher.grant_expires_days);
  const recipientName = getRecipientName(voucher.recipient_name);
  const isDiscount = voucher.kind === "discount";
  const isHybrid = voucher.kind === "hybrid";
  const benefit = isHybrid
    ? "an invitation with a special discount"
    : isDiscount
      ? "a special discount"
      : "a special invitation";
  const benefitLabel = isHybrid ? "Access and discount" : isDiscount ? "Discount" : "Access";
  const actionLabel = isHybrid
    ? "Activate my invitation and discount"
    : isDiscount
      ? "Activate my discount"
      : "Redeem my invitation";
  const manualActionLabel = isHybrid
    ? "Activate your invitation and discount"
    : isDiscount
      ? "Activate your discount"
      : "Redeem your invitation";
  const recipientSuffix = recipientName ? `, ${recipientName}` : "";
  const subject = isHybrid
    ? `Your invitation and discount have arrived${recipientSuffix}`
    : isDiscount
      ? `Your discount has arrived${recipientSuffix}`
      : `Your invitation has arrived${recipientSuffix}`;
  const durationLine = voucher.grant_expires_days
    ? `Access lasts for ${duration} after redemption`
    : null;
  const introLine = isHybrid
    ? "Your invitation and discount are ready for you."
    : isDiscount
      ? "Your discount is ready for you."
      : "Your invitation is ready for you.";
  const autoActivationUrl = getAutoActivationUrl(voucher.share_url);
  const text = [
    recipientName
      ? `Hi ${recipientName}, you’ve received ${benefit} from Palavras do Universo.`
      : `Hi, you’ve received ${benefit} from Palavras do Universo.`,
    "",
    `${benefitLabel}: ${title}`,
    ...(durationLine ? [durationLine] : []),
    "",
    `Code: ${voucher.code}`,
    `${manualActionLabel}: ${voucher.share_url}`,
    "",
    "Or click here to activate automatically with your account:",
    autoActivationUrl,
    "If you’re not signed in, we’ll ask you to log in and continue the redemption automatically.",
    "",
    "Use the same email address that received this message to create or access your account.",
    "",
    "With care,",
    "Palavras do Universo",
  ].join("\n");

  const html = `
    <div style="margin:0;background:#120f16;padding:32px 16px;font-family:Arial,sans-serif;color:#f3eadf">
      <div style="max-width:560px;margin:0 auto;border:1px solid #4e473f;border-radius:24px;background:#1b171f;padding:32px">
        <p style="margin:0 0 20px;color:#f4d58d;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Palavras do Universo</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#fff7e8">${escapeHtml(recipientName ? `Hi ${recipientName}, you’ve received ${benefit}` : `You’ve received ${benefit}`)}</h1>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#dbcfc1">${introLine}</p>
        <div style="margin:0 0 24px;border:1px solid #5e5137;border-radius:16px;background:#231d18;padding:20px">
          <p style="margin:0 0 8px;color:#cdbfae;font-size:13px">${escapeHtml(benefitLabel)}</p>
          <p style="margin:0;color:#fff7e8;font-size:18px;font-weight:700">${escapeHtml(title)}</p>
          ${durationLine ? `<p style="margin:10px 0 0;color:#f4d58d;font-size:14px">${escapeHtml(durationLine)}</p>` : ""}
        </div>
        <p style="margin:0 0 8px;color:#cdbfae;font-size:13px">Your code</p>
        <p style="margin:0 0 24px;color:#fff7e8;font-size:22px;font-weight:700;letter-spacing:1px">${escapeHtml(voucher.code)}</p>
        <a href="${escapeHtml(voucher.share_url)}" style="display:inline-block;border-radius:999px;background:#f4d58d;padding:13px 20px;color:#211a14;font-size:15px;font-weight:700;text-decoration:none">${escapeHtml(actionLabel)}</a>
        <p style="margin:22px 0 8px;color:#cdbfae;font-size:13px;line-height:1.7">Or choose the direct path:</p>
        <a href="${escapeHtml(autoActivationUrl)}" style="display:inline-block;border-radius:999px;border:1px solid #8faea3;padding:11px 17px;color:#c6eadb;font-size:14px;font-weight:700;text-decoration:none">Activate automatically with my account</a>
        <p style="margin:12px 0 0;color:#9f9488;font-size:12px;line-height:1.7">If you’re not signed in, we’ll ask you to log in and continue the redemption automatically.</p>
        <p style="margin:24px 0 0;color:#cdbfae;font-size:13px;line-height:1.7">Use the same email address that received this message to create or access your account.</p>
        <p style="margin:24px 0 0;color:#cdbfae;font-size:14px;line-height:1.7">Your invitation is ready whenever you are.</p>
      </div>
    </div>
  `;

  return { subject, text, html };
}

export async function sendVoucherEmail(
  voucher: VoucherEmailInput
): Promise<VoucherEmailDelivery> {
  const targetEmail = clean(voucher.target_email ?? undefined).toLowerCase();
  if (!targetEmail) return { status: "skipped", reason: "missing_recipient" };
  if (!getRecipientName(voucher.recipient_name)) {
    console.error("[voucher-email] recipient name is missing", { voucherId: voucher.id });
    return { status: "skipped", reason: "missing_recipient_name" };
  }

  const mailer = getTransporter();
  if (!mailer) {
    console.error("[voucher-email] SMTP is not configured", { voucherId: voucher.id });
    return { status: "failed", reason: "not_configured" };
  }

  const sender = getSender();
  if (!sender) {
    console.error("[voucher-email] configured sender is not allowed", {
      voucherId: voucher.id,
    });
    return { status: "failed", reason: "invalid_sender" };
  }

  const content = buildVoucherEmail(voucher);
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt += 1) {
    try {
      await mailer.sendMail({
        from: `Palavras do Universo <${sender}>`,
        to: targetEmail,
        replyTo: getReplyTo(),
        subject: content.subject,
        text: content.text,
        html: content.html,
      });
      return { status: "sent" };
    } catch (caught) {
      lastError = caught;
      if (attempt < MAX_SEND_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
    }
  }

  console.error("[voucher-email] SMTP delivery failed", {
    voucherId: voucher.id,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });
  return { status: "failed", reason: "send_failed" };
}
