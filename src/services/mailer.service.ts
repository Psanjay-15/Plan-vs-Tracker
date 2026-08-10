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

export const getMailTransporter = () => {
  if (!isSmtpConfigured()) {
    if (!warnedMissingConfig) {
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
    await mailer.sendMail({
      from: readEnv("SMTP_FROM"),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });
    return true;
  } catch {
    transporter = null;
    return false;
  }
};
