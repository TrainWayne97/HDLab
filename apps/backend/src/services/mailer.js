// -----------------------------
// HDLab Backend – Mailversand
// -----------------------------
// Versand über SMTP (z.B. das Funktionspostfach der Hochschule). Ohne SMTP_HOST und
// MAIL_FROM ist der Versand aus, und alles, was eine Mail braucht (Passwort-Reset),
// meldet sich als nicht verfügbar.
//
// Variablen (in .env.secrets): SMTP_HOST, SMTP_PORT (Standard 587), SMTP_SECURE
// (true = TLS ab Verbindungsbeginn, typisch Port 465; sonst STARTTLS), SMTP_USER,
// SMTP_PASSWORD, MAIL_FROM (z.B. "HDLab <hdlab@htwk-leipzig.de>")

import nodemailer from 'nodemailer';

let transporter = null;

function getConfig() {
  return {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.MAIL_FROM,
  };
}

export function isMailConfigured() {
  const config = getConfig();
  return !!(config.host && config.from);
}

function getTransporter() {
  if (transporter) return transporter;
  const config = getConfig();
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    // Ohne TLS kein Versand: Zugangsdaten und Reset-Links nie im Klartext übertragen
    requireTLS: !config.secure,
    auth: config.user ? { user: config.user, pass: config.password } : undefined,
    // Inhalte nie aus Dateien oder URLs nachladen
    disableFileAccess: true,
    disableUrlAccess: true,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });
  return transporter;
}

/**
 * Verschickt eine reine Textmail.
 * @param {{to: string, subject: string, text: string}} mail
 */
export async function sendMail({ to, subject, text }) {
  if (!isMailConfigured()) throw new Error('Mail is not configured');
  await getTransporter().sendMail({ from: getConfig().from, to, subject, text });
}
