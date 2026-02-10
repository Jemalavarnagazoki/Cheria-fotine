import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { getCollections, getAdminEmail } from './_lib/db.js'
import { readJsonBody } from './_lib/body.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  const { email, password } = await readJsonBody(req)
  if (!email || !password) {
    res.status(400).json({ message: 'Email and password required' })
    return
  }

  const { admins, users, sessions } = await getCollections()

  let account = await admins.findOne({ email })
  let isAdmin = Boolean(account)

  if (!account) {
    account = await users.findOne({ email })
  }

  if (!account) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }

  const match = await bcrypt.compare(password, account.passwordHash)
  if (!match) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }

  if (email === getAdminEmail()) {
    isAdmin = true
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await sessions.insertOne({
    token,
    email,
    isAdmin,
    expiresAt,
  })

  res.status(200).json({ token, email, isAdmin })
}
