import nodemailer, { type Transporter } from "nodemailer";

const DEFAULT_FROM = "no-reply@palavrasdouniverso.com";
const DEFAULT_REPLY_TO = "suporte@palavrasdouniverso.com";
const SMTP_HOST = "smtp-relay.brevo.com";
const SMTP_PORT = 587;
// Voucher emails contain access links. Retrying an SMTP request after an
// ambiguous network failure can deliver the same invitation twice, so retries
// must be explicit from the admin panel after checking the provider log.
const MAX_SEND_ATTEMPTS = 1;

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
  email_locale: VoucherEmailLocale;
};

export type VoucherEmailLocale = "pt-BR" | "en";

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

function getAccessDuration(days: number | null, locale: VoucherEmailLocale) {
  if (!days || days <= 0) return locale === "pt-BR" ? "acesso especial" : "special access";
  if (locale === "pt-BR") return days === 1 ? "1 dia" : `${days} dias`;
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
  const locale = voucher.email_locale === "pt-BR" ? "pt-BR" : "en";
  const isPortuguese = locale === "pt-BR";
  const duration = getAccessDuration(voucher.grant_expires_days, locale);
  const recipientName = getRecipientName(voucher.recipient_name);
  const isDiscount = voucher.kind === "discount";
  const isHybrid = voucher.kind === "hybrid";
  const benefit = isHybrid
    ? isPortuguese
      ? "um convite com desconto especial"
      : "an invitation with a special discount"
    : isDiscount
      ? isPortuguese
        ? "um desconto especial"
        : "a special discount"
      : isPortuguese
        ? "um convite especial"
        : "a special invitation";
  const benefitLabel = isHybrid
    ? isPortuguese
      ? "Acesso e desconto"
      : "Access and discount"
    : isDiscount
      ? isPortuguese
        ? "Desconto"
        : "Discount"
      : isPortuguese
        ? "Acesso"
        : "Access";
  const actionLabel = isHybrid
    ? isPortuguese
      ? "Ativar meu convite e desconto"
      : "Activate my invitation and discount"
    : isDiscount
      ? isPortuguese
        ? "Ativar meu desconto"
        : "Activate my discount"
      : isPortuguese
        ? "Resgatar meu convite"
        : "Redeem my invitation";
  const manualActionLabel = isHybrid
    ? isPortuguese
      ? "Ative seu convite e desconto"
      : "Activate your invitation and discount"
    : isDiscount
      ? isPortuguese
        ? "Ative seu desconto"
        : "Activate your discount"
      : isPortuguese
        ? "Resgate seu convite"
        : "Redeem your invitation";
  const recipientSuffix = recipientName ? `, ${recipientName}` : "";
  const subject = isHybrid
    ? `${isPortuguese ? "Seu convite e desconto chegaram" : "Your invitation and discount have arrived"}${recipientSuffix}`
    : isDiscount
      ? `${isPortuguese ? "Seu desconto chegou" : "Your discount has arrived"}${recipientSuffix}`
      : `${isPortuguese ? "Seu convite chegou" : "Your invitation has arrived"}${recipientSuffix}`;
  const durationLine = voucher.grant_expires_days
    ? isPortuguese
      ? `O acesso dura ${duration} após o resgate`
      : `Access lasts for ${duration} after redemption`
    : null;
  const introLine = isHybrid
    ? isPortuguese
      ? "Seu convite e desconto estão prontos para você."
      : "Your invitation and discount are ready for you."
    : isDiscount
      ? isPortuguese
        ? "Seu desconto está pronto para você."
        : "Your discount is ready for you."
      : isPortuguese
        ? "Seu convite está pronto para você."
        : "Your invitation is ready for you.";
  const greeting = recipientName
    ? isPortuguese
      ? `Olá ${recipientName}, você recebeu ${benefit} do Palavras do Universo.`
      : `Hi ${recipientName}, you’ve received ${benefit} from Palavras do Universo.`
    : isPortuguese
      ? `Olá, você recebeu ${benefit} do Palavras do Universo.`
      : `Hi, you’ve received ${benefit} from Palavras do Universo.`;
  const codeLabel = isPortuguese ? "Código" : "Code";
  const autoAction = isPortuguese
    ? "Ou clique aqui para ativar automaticamente com a sua conta:"
    : "Or click here to activate automatically with your account:";
  const autoActivationNote = isPortuguese
    ? "Se você ainda não estiver conectado, pediremos seu login e continuaremos o resgate automaticamente."
    : "If you’re not signed in, we’ll ask you to log in and continue the redemption automatically.";
  const accountNote = isPortuguese
    ? "Use o mesmo e-mail que recebeu esta mensagem para criar ou acessar sua conta."
    : "Use the same email address that received this message to create or access your account.";
  const directPathLabel = isPortuguese ? "Ou escolha o caminho direto:" : "Or choose the direct path:";
  const autoButtonLabel = isPortuguese
    ? "Ativar automaticamente com a minha conta"
    : "Activate automatically with my account";
  const signoff = isPortuguese ? "Com carinho," : "With care,";
  const closingLine = isPortuguese
    ? "Seu convite está pronto quando você estiver."
    : "Your invitation is ready whenever you are.";
  const autoActivationUrl = getAutoActivationUrl(voucher.share_url);
  const text = [
    greeting,
    "",
    `${benefitLabel}: ${title}`,
    ...(durationLine ? [durationLine] : []),
    "",
    `${codeLabel}: ${voucher.code}`,
    `${manualActionLabel}: ${voucher.share_url}`,
    "",
    autoAction,
    autoActivationUrl,
    autoActivationNote,
    "",
    accountNote,
    "",
    signoff,
    "Palavras do Universo",
  ].join("\n");

  const html = `
    <div style="margin:0;background:#120f16;padding:32px 16px;font-family:Arial,sans-serif;color:#f3eadf">
      <div style="max-width:560px;margin:0 auto;border:1px solid #4e473f;border-radius:24px;background:#1b171f;padding:32px">
        <p style="margin:0 0 20px;color:#f4d58d;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Palavras do Universo</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#fff7e8">${escapeHtml(greeting.replace(/\.$/, ""))}</h1>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#dbcfc1">${introLine}</p>
        <div style="margin:0 0 24px;border:1px solid #5e5137;border-radius:16px;background:#231d18;padding:20px">
          <p style="margin:0 0 8px;color:#cdbfae;font-size:13px">${escapeHtml(benefitLabel)}</p>
          <p style="margin:0;color:#fff7e8;font-size:18px;font-weight:700">${escapeHtml(title)}</p>
          ${durationLine ? `<p style="margin:10px 0 0;color:#f4d58d;font-size:14px">${escapeHtml(durationLine)}</p>` : ""}
        </div>
        <p style="margin:0 0 8px;color:#cdbfae;font-size:13px">${codeLabel}</p>
        <p style="margin:0 0 24px;color:#fff7e8;font-size:22px;font-weight:700;letter-spacing:1px">${escapeHtml(voucher.code)}</p>
        <a href="${escapeHtml(voucher.share_url)}" style="display:inline-block;border-radius:999px;background:#f4d58d;padding:13px 20px;color:#211a14;font-size:15px;font-weight:700;text-decoration:none">${escapeHtml(actionLabel)}</a>
        <p style="margin:18px 0 8px;color:#cdbfae;font-size:12px;line-height:1.7">Se o botão não abrir, copie este endereço e cole no Safari:</p>
        <p style="margin:0;color:#f4d58d;font-size:13px;line-height:1.7;word-break:break-all">${escapeHtml(voucher.share_url)}</p>
        <p style="margin:22px 0 8px;color:#cdbfae;font-size:13px;line-height:1.7">${directPathLabel}</p>
        <a href="${escapeHtml(autoActivationUrl)}" style="display:inline-block;border-radius:999px;border:1px solid #8faea3;padding:11px 17px;color:#c6eadb;font-size:14px;font-weight:700;text-decoration:none">${autoButtonLabel}</a>
        <p style="margin:18px 0 8px;color:#cdbfae;font-size:12px;line-height:1.7">Ativação automática:</p>
        <p style="margin:0;color:#c6eadb;font-size:13px;line-height:1.7;word-break:break-all">${escapeHtml(autoActivationUrl)}</p>
        <p style="margin:12px 0 0;color:#9f9488;font-size:12px;line-height:1.7">${autoActivationNote}</p>
        <p style="margin:24px 0 0;color:#cdbfae;font-size:13px;line-height:1.7">${accountNote}</p>
        <p style="margin:24px 0 0;color:#cdbfae;font-size:14px;line-height:1.7">${closingLine}</p>
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
      const delivery = await mailer.sendMail({
        from: `Palavras do Universo <${sender}>`,
        to: targetEmail,
        replyTo: getReplyTo(),
        subject: content.subject,
        text: content.text,
        html: content.html,
        headers: {
          // Brevo documents support for custom SMTP headers. These relay
          // headers request suppression of tracking wrappers around critical
          // access links when account-level controls are unavailable.
          "X-Mailin-Track": "false",
          "X-Mailin-Track-Clicks": "false",
          "X-Mailin-Track-Opens": "false",
        },
      });
      const accepted = delivery.accepted.map((value) => String(value).toLowerCase());
      if (!accepted.includes(targetEmail)) {
        throw new Error("SMTP did not accept the voucher recipient");
      }
      return { status: "sent" };
    } catch (caught) {
      lastError = caught;
      if (attempt < MAX_SEND_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  console.error("[voucher-email] SMTP delivery failed", {
    voucherId: voucher.id,
    error: lastError instanceof Error ? lastError.message : String(lastError),
  });
  return { status: "failed", reason: "send_failed" };
}
