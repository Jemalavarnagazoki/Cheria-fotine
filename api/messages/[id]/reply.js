import { ObjectId } from 'mongodb'
import { getCollections } from '../../_lib/db.js'
import { getUserFromRequest, isAdminUser } from '../../_lib/auth.js'
import { readJsonBody } from '../../_lib/body.js'

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  const { messages, sessions } = await getCollections()
  const user = await getUserFromRequest(req, sessions)

  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  if (!isAdminUser(user)) {
    res.status(403).json({ message: 'Forbidden' })
    return
  }

  const { reply } = await readJsonBody(req)
  if (!reply) {
    res.status(400).json({ message: 'Reply required' })
    return
  }

  const { id } = req.query
  let messageId
  try {
    messageId = new ObjectId(id)
  } catch {
    res.status(400).json({ message: 'Invalid message id' })
    return
  }

  const result = await messages.findOneAndUpdate(
    { _id: messageId },
    { $set: { reply, repliedAt: new Date(), repliedBy: user.email } },
    { returnDocument: 'after' },
  )

  if (!result.value) {
    res.status(404).json({ message: 'Message not found' })
    return
  }

  res.status(200).json({
    message: {
      id: result.value._id.toString(),
      name: result.value.name || '',
      email: result.value.contactEmail || result.value.fromEmail || '',
      fromEmail: result.value.fromEmail || '',
      message: result.value.message || '',
      createdAt: result.value.createdAt ? result.value.createdAt.toISOString() : '',
      repliedAt: result.value.repliedAt ? result.value.repliedAt.toISOString() : '',
      repliedBy: result.value.repliedBy || '',
      reply: result.value.reply || '',
    },
  })
}
