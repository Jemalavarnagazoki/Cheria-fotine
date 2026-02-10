import { ObjectId } from 'mongodb'
import { getCollections } from '../_lib/db.js'
import { getUserFromRequest } from '../_lib/auth.js'

export default async function handler(req, res) {
  const { carts, products, sessions } = await getCollections()
  const user = await getUserFromRequest(req, sessions)

  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  if (req.method === 'GET') {
    const cart = await carts.findOne({ email: user.email })
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      res.status(200).json({ items: [] })
      return
    }

    const ids = cart.items
      .map((item) => {
        try {
          return new ObjectId(item.productId)
        } catch {
          return null
        }
      })
      .filter(Boolean)

    const productsList = await products.find({ _id: { $in: ids } }).toArray()
    const productMap = new Map(
      productsList.map((product) => [product._id.toString(), product]),
    )

    const items = cart.items
      .map((item) => {
        const product = productMap.get(item.productId)
        if (!product) {
          return null
        }
        return {
          product: {
            id: product._id.toString(),
            name: product.name,
            category: product.category,
            price: product.price || '',
            description: product.description || '',
            images: Array.isArray(product.images) ? product.images : [],
            createdAt: product.createdAt ? product.createdAt.toISOString() : '',
          },
          quantity: item.quantity || 1,
        }
      })
      .filter(Boolean)

    res.status(200).json({ items })
    return
  }

  if (req.method === 'DELETE') {
    await carts.deleteOne({ email: user.email })
    res.status(200).json({ message: 'Cleared' })
    return
  }

  res.status(405).json({ message: 'Method not allowed' })
}
