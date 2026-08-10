import nodemailer, { type Transporter } from "nodemailer";

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

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

const getSmtpConfig = (): SmtpConfig | null => {
  const host = readEnv("SMTP_HOST");
  const user = readEnv("SMTP_USER");
  const pass = readEnv("SMTP_PASS");
  const from = readEnv("SMTP_FROM") || user;

  if (!host || !user || !pass || !from) return null;

  const configuredPort = Number(readEnv("SMTP_PORT") || 587);
  const configuredSecure =
    readEnv("SMTP_SECURE") === "true" ||
    readEnv("SMTP_SECURE") === "1" ||
    configuredPort === 465;

  return {
    host,
    port: configuredPort,
    secure: configuredSecure,
    user,
    pass,
    from,
  };
};

export const isSmtpConfigured = () => Boolean(getSmtpConfig());

const createTransport = (config: {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}): Transporter =>
  nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure && config.port === 587,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
    tls: {
      minVersion: "TLSv1.2",
    },
  });

const buildCandidates = (config: SmtpConfig) => {
  const primary = {
    host: config.host,
    port: config.port,
    secure: config.secure,
    user: config.user,
    pass: config.pass,
  };

  const candidates = [primary];

  // Render and many cloud hosts block outbound 587; 465/SSL usually works for Gmail.
  if (!(primary.port === 465 && primary.secure)) {
    candidates.push({
      ...primary,
      port: 465,
      secure: true,
    });
  }

  if (!(primary.port === 587 && !primary.secure)) {
    candidates.push({
      ...primary,
      port: 587,
      secure: false,
    });
  }

  return candidates;
};

export const sendEmail = async (input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}) => {
  const config = getSmtpConfig();
  if (!config) return false;

  const candidates = buildCandidates(config);
  let lastError: unknown;

  for (const candidate of candidates) {
    const mailer = createTransport(candidate);
    try {
      await mailer.sendMail({
        from: config.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });
      return true;
    } catch (error) {
      lastError = error;
    } finally {
      mailer.close();
    }
  }

  console.error(
    "[mailer] All SMTP attempts failed:",
    lastError instanceof Error ? lastError.message : lastError,
  );
  return false;
};
