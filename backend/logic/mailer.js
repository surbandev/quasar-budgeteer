const nodemailer = require('nodemailer')
const logger = require('./logger')

const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || 'surbanwebdev@gmail.com'

let cachedTransporter
let transporterResolved = false

function buildTransporter() {
  const host = process.env.SMTP_HOST
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASSWORD

  if (!host || !user || !pass) {
    return null
  }

  const port = Number(process.env.SMTP_PORT) || 587
  // `secure` is true for port 465 (implicit TLS), false otherwise (STARTTLS).
  const secure =
    process.env.SMTP_SECURE != null
      ? String(process.env.SMTP_SECURE).toLowerCase() === 'true'
      : port === 465

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}

function getTransporter() {
  if (!transporterResolved) {
    cachedTransporter = buildTransporter()
    transporterResolved = true
  }
  return cachedTransporter
}

function getFromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || ADMIN_NOTIFICATION_EMAIL
}

/**
 * Best-effort email send. Never throws: if SMTP is not configured the message is
 * logged to the console so the surrounding request still succeeds.
 * @returns {Promise<{ sent: boolean, skipped?: boolean, error?: string }>}
 */
async function sendMail({ to, subject, text, html, replyTo }) {
  const transporter = getTransporter()

  if (!transporter) {
    console.warn(
      `[mailer] SMTP not configured (set SMTP_HOST/SMTP_USER/SMTP_PASSWORD). ` +
        `Skipping email to "${to}" with subject "${subject}".`,
    )
    console.info(`[mailer] Email body that would have been sent:\n${text || html || ''}`)
    logger.logEmail(`Skipped (SMTP not configured): ${subject}`, { to, status: 'skipped' })
    return { sent: false, skipped: true }
  }

  try {
    await transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      text,
      html,
      replyTo,
    })
    logger.logEmail(`Sent: ${subject}`, { to, status: 'sent' })
    return { sent: true }
  } catch (error) {
    console.error('[mailer] Failed to send email:', error)
    logger.logEmail(`Failed: ${subject}`, {
      to,
      status: 'failed',
      error: error.message || String(error),
    })
    logger.logError(`Email send failed: ${subject}`, {
      to,
      error: error.message || String(error),
    })
    return { sent: false, error: error.message || 'Failed to send email' }
  }
}

module.exports = {
  sendMail,
  ADMIN_NOTIFICATION_EMAIL,
}
