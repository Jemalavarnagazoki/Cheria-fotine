import { getCollections } from './_lib/db.js'
import { getUserFromRequest } from './_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  const { sessions } = await getCollections()
  const user = await getUserFromRequest(req, sessions)
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  await sessions.deleteOne({ token: user.token })
  res.status(200).json({ message: 'Logged out' })
}
