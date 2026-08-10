import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;
let warnedMissingConfig = false;

const isSmtpConfigured = () =>
  Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_FROM?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim(),
  );

export const getMailTransporter = () => {
  if (!isSmtpConfigured()) {
    if (!warnedMissingConfig) {
      console.warn(
        "[mailer] SMTP is not configured. Budget email alerts are disabled.",
      );
      warnedMissingConfig = true;
    }
    return null;
  }

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure:
        process.env.SMTP_SECURE === "true" ||
        process.env.SMTP_SECURE === "1" ||
        port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
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
      from: process.env.SMTP_FROM,
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
    return false;
  }
};
