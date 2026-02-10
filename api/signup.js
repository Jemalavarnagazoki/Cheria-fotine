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

  if (email === getAdminEmail()) {
    res.status(403).json({ message: 'Admin account already exists' })
    return
  }

  const { users, sessions } = await getCollections()
  const existing = await users.findOne({ email })
  if (existing) {
    res.status(409).json({ message: 'Account already exists' })
    return
  }

  const hash = await bcrypt.hash(password, 10)
  await users.insertOne({
    email,
    passwordHash: hash,
    createdAt: new Date(),
  })

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await sessions.insertOne({
    token,
    email,
    isAdmin: false,
    expiresAt,
  })

  res.status(201).json({ token, email, isAdmin: false })
}
