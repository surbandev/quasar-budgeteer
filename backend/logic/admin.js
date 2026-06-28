const _ = require('lodash')
const userDal = require('../dal/user')
const { createFullUser } = require('./provisionUser')
const { isAdminUsername } = require('../middlware/admin')
const { sendAccountActivatedEmail } = require('./accountEmails')
const logger = require('./logger')

function sanitizeUser(user) {
  if (!user) return null
  const { password, ...safeUser } = user
  return safeUser
}

async function listUsers(req, res) {
  try {
    const users = await userDal.getAllUsers()
    res.json({ users: users.map(sanitizeUser) })
  } catch (e) {
    console.error('Error listing users:', e)
    res.statusMessage = 'Internal Server Error'
    res.status(500).send().end()
  }
}

async function createUser(req, res) {
  try {
    const { username, password, firstname, lastname, phone, email } = req.body

    if (!username || !password || !firstname || !lastname || !email) {
      res.statusMessage = 'Missing required fields'
      res.status(400).send().end()
      return
    }

    const result = await createFullUser({
      username,
      password,
      firstname,
      lastname,
      phone,
      email,
    })

    const error = _.get(result, 'error')
    if (error) {
      const status = String(error).includes('already exists') ? 409 : 400
      res.status(status).json({ error })
      return
    }

    // Best-effort: let the new user know their account is active. Email failure
    // must not fail account creation, so we don't await/throw on it.
    sendAccountActivatedEmail({ email, firstname, username }).catch((mailErr) => {
      console.error('Error sending activation email:', mailErr)
    })

    res.status(201).json({ user: sanitizeUser(result.user) })
  } catch (e) {
    console.error('Error creating user:', e)
    const message = e.sqlMessage || e.message || 'Internal Server Error'
    logger.logError('Admin createUser failed', message)
    res.status(500).json({ error: message })
  }
}

async function updateUser(req, res) {
  try {
    const { userID, username, email, password } = req.body

    if (!userID || !username || !email) {
      res.statusMessage = 'Missing required fields'
      res.status(400).send().end()
      return
    }

    const result = await userDal.updateUser(
      userID,
      String(username).trim().toLowerCase(),
      email,
      password || null,
    )

    const error = _.get(result, 'error')
    if (error) {
      res.statusMessage = error
      res.status(404).send().end()
      return
    }

    const user = await userDal.getUser(userID)
    res.json({ user: sanitizeUser(user.user) })
  } catch (e) {
    console.error('Error updating user:', e)
    res.statusMessage = 'Internal Server Error'
    res.status(500).send().end()
  }
}

async function deleteUser(req, res) {
  try {
    const userID = req.body?.userID || req.query?.userID

    if (!userID) {
      res.statusMessage = 'User ID is required'
      res.status(400).send().end()
      return
    }

    if (String(userID) === String(req.user.id)) {
      res.statusMessage = 'You cannot delete your own account'
      res.status(400).send().end()
      return
    }

    const target = await userDal.getUser(userID)
    if (target.error) {
      res.statusMessage = target.error
      res.status(404).send().end()
      return
    }

    if (isAdminUsername(target.user.username)) {
      res.statusMessage = 'Admin accounts cannot be deleted'
      res.status(400).send().end()
      return
    }

    const result = await userDal.deleteUser(userID)
    const error = _.get(result, 'error')
    if (error) {
      res.statusMessage = error
      res.status(409).send().end()
      return
    }

    res.status(200).send().end()
  } catch (e) {
    console.error('Error deleting user:', e)
    res.statusMessage = 'Internal Server Error'
    res.status(500).send().end()
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
}
