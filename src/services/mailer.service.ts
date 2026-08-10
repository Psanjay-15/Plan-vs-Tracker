import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;
let warnedMissingConfig = false;

const readEnv = (key: string) => {
  const value = process.env[key];
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

export const isSmtpConfigured = () =>
  Boolean(
    readEnv("SMTP_HOST") &&
      readEnv("SMTP_FROM") &&
      readEnv("SMTP_USER") &&
      readEnv("SMTP_PASS"),
  );

export const logMailerStatus = () => {
  if (!isSmtpConfigured()) {
    console.warn(
      "[mailer] SMTP env vars missing (SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM). Budget email alerts are disabled on this host.",
    );
    return;
  }

  console.log(
    `[mailer] SMTP ready via ${readEnv("SMTP_HOST")}:${readEnv("SMTP_PORT") || "587"} as ${readEnv("SMTP_USER")}`,
  );
};

export const getMailTransporter = () => {
  if (!isSmtpConfigured()) {
    if (!warnedMissingConfig) {
      logMailerStatus();
      warnedMissingConfig = true;
    }
    return null;
  }

  if (!transporter) {
    const port = Number(readEnv("SMTP_PORT") || 587);
    const secure =
      readEnv("SMTP_SECURE") === "true" ||
      readEnv("SMTP_SECURE") === "1" ||
      port === 465;

    transporter = nodemailer.createTransport({
      host: readEnv("SMTP_HOST"),
      port,
      secure,
      requireTLS: !secure && port === 587,
      auth: {
        user: readEnv("SMTP_USER"),
        pass: readEnv("SMTP_PASS"),
      },
      connectionTimeout: 20_000,
      greetingTimeout: 20_000,
      socketTimeout: 30_000,
    });
  }

  return transporter;
};

export const sendEmail = async (input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => {
  const mailer = getMailTransporter();
  if (!mailer) return false;

  try {
    const info = await mailer.sendMail({
      from: readEnv("SMTP_FROM"),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    console.log(
      `[mailer] Sent "${input.subject}" to ${input.to} (${info.messageId})`,
    );
    return true;
  } catch (error) {
    console.error(
      `[mailer] Failed to send "${input.subject}" to ${input.to}:`,
      error instanceof Error ? error.message : error,
    );
    transporter = null;
    return false;
  }
};
