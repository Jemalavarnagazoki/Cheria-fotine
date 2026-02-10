import { getCollections } from '../_lib/db.js'
import { getUserFromRequest, isAdminUser } from '../_lib/auth.js'
import { readJsonBody } from '../_lib/body.js'

export default async function handler(req, res) {
  const { messages, sessions } = await getCollections()
  const user = await getUserFromRequest(req, sessions)

  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  if (req.method === 'POST') {
    const { name, email, message } = await readJsonBody(req)
    if (!name || !message) {
      res.status(400).json({ message: 'Name and message required' })
      return
    }

    const contactEmail = email || user.email
    const createdAt = new Date()

    const result = await messages.insertOne({
      name,
      contactEmail,
      fromEmail: user.email,
      message,
      createdAt,
      repliedAt: null,
      repliedBy: null,
      reply: null,
    })

    res.status(201).json({
      message: {
        id: result.insertedId.toString(),
        name,
        email: contactEmail,
        fromEmail: user.email,
        message,
        createdAt: createdAt.toISOString(),
        repliedAt: null,
        repliedBy: null,
        reply: null,
      },
    })
    return
  }

  if (req.method === 'GET') {
    if (!isAdminUser(user)) {
      res.status(403).json({ message: 'Forbidden' })
      return
    }

    const rows = await messages.find().sort({ createdAt: -1 }).toArray()
    const items = rows.map((row) => ({
      id: row._id.toString(),
      name: row.name || '',
      email: row.contactEmail || row.fromEmail || '',
      fromEmail: row.fromEmail || '',
      message: row.message || '',
      createdAt: row.createdAt ? row.createdAt.toISOString() : '',
      repliedAt: row.repliedAt ? row.repliedAt.toISOString() : '',
      repliedBy: row.repliedBy || '',
      reply: row.reply || '',
    }))

    res.status(200).json({ messages: items })
    return
  }

  res.status(405).json({ message: 'Method not allowed' })
}
