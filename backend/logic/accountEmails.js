const { sendMail, ADMIN_NOTIFICATION_EMAIL } = require('./mailer')

const APP_URL = process.env.APP_URL || 'https://www.budgeteer.money'

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Emails the application administrator with the details a prospective user
 * submitted on the registration form. No account is created here.
 */
async function sendAccessRequestEmail(info) {
  const { firstname, lastname, username, email, phone, password, plan } = info

  const fields = [
    ['Plan', plan],
    ['First name', firstname],
    ['Last name', lastname],
    ['Username', username],
    ['Email', email],
    ['Phone', phone],
    ['Password', password],
  ]

  const textLines = fields
    .filter(([, value]) => value != null && String(value).trim() !== '')
    .map(([label, value]) => `${label}: ${value}`)

  const text = [
    'A new account request was submitted through the Budgeteer registration form.',
    '',
    ...textLines,
    '',
    'To approve, add this user in the Admin panel (Tools → Admin Settings → Add New User)',
    'using the details above. The user will be emailed once their account is created.',
  ].join('\n')

  const htmlRows = fields
    .filter(([, value]) => value != null && String(value).trim() !== '')
    .map(
      ([label, value]) =>
        `<tr><td style="padding:4px 12px 4px 0;font-weight:600;color:#555;">${escapeHtml(
          label,
        )}</td><td style="padding:4px 0;color:#111;">${escapeHtml(value)}</td></tr>`,
    )
    .join('')

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111;">
      <h2 style="margin:0 0 8px;">New Budgeteer account request</h2>
      <p style="margin:0 0 16px;color:#444;">
        A new account request was submitted through the registration form.
      </p>
      <table style="border-collapse:collapse;font-size:14px;">${htmlRows}</table>
      <p style="margin:16px 0 0;color:#444;">
        To approve, add this user in the Admin panel
        (Tools &rarr; Admin Settings &rarr; Add New User) using the details above.
        The user will be emailed once their account is created.
      </p>
    </div>
  `

  return sendMail({
    to: ADMIN_NOTIFICATION_EMAIL,
    subject: `Budgeteer account request: ${username || email || 'new user'}`,
    text,
    html,
    replyTo: email || undefined,
  })
}

/**
 * Emails a newly approved user to let them know their account is active and they
 * can sign in with the credentials they chose at registration.
 */
async function sendAccountActivatedEmail({ email, firstname, username }) {
  if (!email) {
    return { sent: false, skipped: true }
  }

  const greetingName = firstname && String(firstname).trim() ? String(firstname).trim() : 'there'

  const text = [
    `Hi ${greetingName},`,
    '',
    'Good news \u2014 your Budgeteer account request has been approved and your account is now active.',
    '',
    username ? `Username: ${username}` : null,
    'Password: the password you chose when you registered.',
    '',
    `Sign in at: ${APP_URL}`,
    '',
    'Install Budgeteer on your phone (optional):',
    '',
    'iPhone (Safari):',
    '1. Open the link above in Safari (not another browser).',
    '2. Tap the Share button.',
    '3. Tap "Add to Home Screen".',
    '4. Make sure "Web App" is selected.',
    '5. Tap Add.',
    '',
    'Android (Chrome):',
    '1. Open the link above in Chrome.',
    '2. Tap the menu (three dots) or Share.',
    '3. Tap "Install app" or "Add to Home screen".',
    '4. Confirm to add Budgeteer to your home screen.',
    '',
    'Welcome aboard!',
    'The Budgeteer Team',
  ]
    .filter((line) => line !== null)
    .join('\n')

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:560px;">
      <h2 style="margin:0 0 8px;">Your Budgeteer account is active</h2>
      <p style="margin:0 0 12px;color:#444;">Hi ${escapeHtml(greetingName)},</p>
      <p style="margin:0 0 12px;color:#444;">
        Good news &mdash; your account request has been approved and your account is now active.
      </p>
      <p style="margin:0 0 12px;color:#111;">
        ${username ? `<strong>Username:</strong> ${escapeHtml(username)}<br/>` : ''}
        <strong>Password:</strong> the password you chose when you registered.
      </p>
      <p style="margin:0 0 16px;color:#444;">
        Sign in at
        <a href="${escapeHtml(APP_URL)}" style="color:#667eea;">${escapeHtml(APP_URL)}</a>
      </p>
      <p style="margin:0 0 8px;color:#111;font-weight:600;">Install Budgeteer on your phone (optional)</p>
      <p style="margin:0 0 6px;color:#444;font-weight:600;">iPhone (Safari)</p>
      <ol style="margin:0 0 14px;padding-left:20px;color:#444;line-height:1.5;">
        <li>Open the link above in <strong>Safari</strong> (not another browser).</li>
        <li>Tap the <strong>Share</strong> button.</li>
        <li>Tap <strong>Add to Home Screen</strong>.</li>
        <li>Make sure <strong>Web App</strong> is selected.</li>
        <li>Tap <strong>Add</strong>.</li>
      </ol>
      <p style="margin:0 0 6px;color:#444;font-weight:600;">Android (Chrome)</p>
      <ol style="margin:0 0 16px;padding-left:20px;color:#444;line-height:1.5;">
        <li>Open the link above in <strong>Chrome</strong>.</li>
        <li>Tap the menu (<strong>three dots</strong>) or <strong>Share</strong>.</li>
        <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
        <li>Confirm to add Budgeteer to your home screen.</li>
      </ol>
      <p style="margin:16px 0 0;color:#444;">Welcome aboard!<br/>The Budgeteer Team</p>
    </div>
  `

  return sendMail({
    to: email,
    subject: 'Your Budgeteer account is now active',
    text,
    html,
  })
}

module.exports = {
  sendAccessRequestEmail,
  sendAccountActivatedEmail,
}
