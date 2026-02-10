import { ObjectId } from 'mongodb'
import { getCollections } from '../_lib/db.js'
import { getUserFromRequest, isAdminUser } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  const { sessions, products } = await getCollections()
  const user = await getUserFromRequest(req, sessions)

  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  if (!isAdminUser(user)) {
    res.status(403).json({ message: 'Forbidden' })
    return
  }

  const { id } = req.query
  let productId
  try {
    productId = new ObjectId(id)
  } catch {
    res.status(400).json({ message: 'Invalid product id' })
    return
  }

  const result = await products.deleteOne({ _id: productId })
  if (result.deletedCount === 0) {
    res.status(404).json({ message: 'Product not found' })
    return
  }

  res.status(200).json({ message: 'Deleted' })
}
