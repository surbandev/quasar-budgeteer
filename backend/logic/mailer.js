const nodemailer = require('nodemailer')
const logger = require('./logger')

const ADMIN_NOTIFICATION_EMAIL =
  process.env.ADMIN_NOTIFICATION_EMAIL || 'surbanwebdev@gmail.com'

const SMTP_TIMEOUT_MS = Number(process.env.SMTP_TIMEOUT_MS) || 10000

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
  const secure =
    process.env.SMTP_SECURE != null
      ? String(process.env.SMTP_SECURE).toLowerCase() === 'true'
      : port === 465

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
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
  return (
    process.env.RESEND_FROM ||
    process.env.SMTP_FROM ||
    process.env.SMTP_USER ||
    ADMIN_NOTIFICATION_EMAIL
  )
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    }),
  ])
}

async function sendViaResend({ to, subject, text, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return null
  }

  const payload = {
    from: getFromAddress(),
    to: Array.isArray(to) ? to : [to],
    subject,
    text,
    html,
  }
  if (replyTo) {
    payload.reply_to = replyTo
  }

  const response = await withTimeout(
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    }),
    SMTP_TIMEOUT_MS,
    'Resend API',
  )

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Resend API ${response.status}: ${body || response.statusText}`)
  }

  return { sent: true, provider: 'resend' }
}

async function sendViaSmtp({ to, subject, text, html, replyTo }) {
  const transporter = getTransporter()
  if (!transporter) {
    return null
  }

  await withTimeout(
    transporter.sendMail({
      from: getFromAddress(),
      to,
      subject,
      text,
      html,
      replyTo,
    }),
    SMTP_TIMEOUT_MS,
    'SMTP send',
  )

  return { sent: true, provider: 'smtp' }
}

/**
 * Best-effort email send. Never throws.
 * Prefers Resend HTTPS API (works on Railway Hobby); falls back to SMTP for local dev.
 */
async function sendMail({ to, subject, text, html, replyTo }) {
  const hasResend = Boolean(process.env.RESEND_API_KEY)
  const hasSmtp = Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD,
  )

  if (!hasResend && !hasSmtp) {
    console.warn(
      `[mailer] No email provider configured (set RESEND_API_KEY or SMTP_*). ` +
        `Skipping email to "${to}" with subject "${subject}".`,
    )
    console.info(`[mailer] Email body that would have been sent:\n${text || html || ''}`)
    logger.logEmail(`Skipped (not configured): ${subject}`, { to, status: 'skipped' })
    return { sent: false, skipped: true }
  }

  try {
    if (hasResend) {
      const result = await sendViaResend({ to, subject, text, html, replyTo })
      if (result) {
        logger.logEmail(`Sent via Resend: ${subject}`, { to, status: 'sent' })
        return result
      }
    }

    const smtpResult = await sendViaSmtp({ to, subject, text, html, replyTo })
    if (smtpResult) {
      logger.logEmail(`Sent via SMTP: ${subject}`, { to, status: 'sent' })
      return smtpResult
    }

    logger.logEmail(`Skipped (not configured): ${subject}`, { to, status: 'skipped' })
    return { sent: false, skipped: true }
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
