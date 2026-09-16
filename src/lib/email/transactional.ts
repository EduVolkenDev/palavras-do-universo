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
  share_url: string;
  primary_title: string | null;
  target_email: string | null;
  grant_expires_days: number | null;
};

export type VoucherEmailDelivery =
  | { status: "sent" }
  | { status: "skipped"; reason: "missing_recipient" }
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
  if (!days || days <= 0) return "acesso especial";
  return days === 1 ? "1 dia" : `${days} dias`;
}

function buildVoucherEmail(voucher: VoucherEmailInput) {
  const title = (voucher.primary_title || "Meu Universo")
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, 120);
  const duration = getAccessDuration(voucher.grant_expires_days);
  const subject = `Seu convite para o ${title}`;
  const text = [
    "Olá,",
    "",
    "Você recebeu um convite especial do Palavras do Universo.",
    `Acesso: ${title}`,
    `Validade: ${duration} a partir do resgate`,
    "",
    `Código: ${voucher.code}`,
    `Resgate seu convite: ${voucher.share_url}`,
    "",
    "Use o mesmo e-mail para o qual esta mensagem foi enviada ao criar ou acessar sua conta.",
    "",
    "Com carinho,",
    "Palavras do Universo",
  ].join("\n");

  const html = `
    <div style="margin:0;background:#120f16;padding:32px 16px;font-family:Arial,sans-serif;color:#f3eadf">
      <div style="max-width:560px;margin:0 auto;border:1px solid #4e473f;border-radius:24px;background:#1b171f;padding:32px">
        <p style="margin:0 0 20px;color:#f4d58d;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Palavras do Universo</p>
        <h1 style="margin:0 0 16px;font-size:28px;line-height:1.2;color:#fff7e8">Você recebeu um convite</h1>
        <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#dbcfc1">Um acesso especial foi preparado para você.</p>
        <div style="margin:0 0 24px;border:1px solid #5e5137;border-radius:16px;background:#231d18;padding:20px">
          <p style="margin:0 0 8px;color:#cdbfae;font-size:13px">Acesso</p>
          <p style="margin:0;color:#fff7e8;font-size:18px;font-weight:700">${escapeHtml(title)}</p>
          <p style="margin:10px 0 0;color:#f4d58d;font-size:14px">${escapeHtml(duration)} a partir do resgate</p>
        </div>
        <p style="margin:0 0 8px;color:#cdbfae;font-size:13px">Seu código</p>
        <p style="margin:0 0 24px;color:#fff7e8;font-size:22px;font-weight:700;letter-spacing:1px">${escapeHtml(voucher.code)}</p>
        <a href="${escapeHtml(voucher.share_url)}" style="display:inline-block;border-radius:999px;background:#f4d58d;padding:13px 20px;color:#211a14;font-size:15px;font-weight:700;text-decoration:none">Resgatar meu convite</a>
        <p style="margin:24px 0 0;color:#cdbfae;font-size:13px;line-height:1.7">Use o mesmo e-mail para o qual esta mensagem foi enviada ao criar ou acessar sua conta.</p>
        <p style="margin:24px 0 0;color:#cdbfae;font-size:14px;line-height:1.7">${escapeHtml(voucher.description || "Com carinho, Palavras do Universo")}</p>
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
