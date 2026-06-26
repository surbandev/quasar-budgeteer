const _ = require('lodash')
const userDal = require('../dal/user')
const accountDal = require('../dal/account')

async function createFullUser({ username, password, firstname, lastname, phone, email }) {
  const normalizedUsername = String(username).trim().toLowerCase()
  const result = await userDal.addUser(
    normalizedUsername,
    password,
    firstname,
    lastname,
    phone || '',
    email,
    '',
  )

  const error = _.get(result, 'error')
  if (error) {
    return { error }
  }

  const createdUser = await userDal.getUserByUsername(normalizedUsername)
  if (!createdUser?.id) {
    return { error: 'User was created but could not be loaded' }
  }

  try {
    await accountDal.addAccount(createdUser.id, firstname, lastname, phone || '', email)
  } catch (provisionError) {
    await userDal.deleteUser(createdUser.id)
    throw provisionError
  }

  const user = await userDal.getUser(createdUser.id)
  return { user: user.user }
}

module.exports = {
  createFullUser,
}
