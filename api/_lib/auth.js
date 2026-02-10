import { getAdminEmail } from './db.js'

export const getTokenFromRequest = (req) => {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) {
    return null
  }
  return header.slice(7)
}

export const getUserFromRequest = async (req, sessions) => {
  const token = getTokenFromRequest(req)
  if (!token) {
    return null
  }

  const session = await sessions.findOne({ token })
  if (!session) {
    return null
  }

  if (new Date(session.expiresAt) < new Date()) {
    await sessions.deleteOne({ token })
    return null
  }

  return {
    email: session.email,
    token,
    isAdmin: Boolean(session.isAdmin),
  }
}

export const isAdminUser = (user) => {
  if (!user) {
    return false
  }
  return user.isAdmin || user.email === getAdminEmail()
}
