import { ObjectId } from 'mongodb'
import { getCollections } from '../../_lib/db.js'
import { getUserFromRequest } from '../../_lib/auth.js'
import { readJsonBody } from '../../_lib/body.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  const { carts, products, sessions } = await getCollections()
  const user = await getUserFromRequest(req, sessions)

  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const { productId, quantity } = await readJsonBody(req)
  const safeQuantity = Number.isFinite(Number(quantity))
    ? Math.max(1, Number(quantity))
    : 1

  let resolvedId
  try {
    resolvedId = new ObjectId(productId)
  } catch {
    res.status(400).json({ message: 'Invalid product id' })
    return
  }

  const product = await products.findOne({ _id: resolvedId })
  if (!product) {
    res.status(404).json({ message: 'Product not found' })
    return
  }

  const cart = await carts.findOne({ email: user.email })
  if (!cart) {
    await carts.insertOne({
      email: user.email,
      items: [
        {
          productId,
          quantity: safeQuantity,
          addedAt: new Date(),
        },
      ],
      updatedAt: new Date(),
    })
    res.status(201).json({ message: 'Added to cart' })
    return
  }

  const items = Array.isArray(cart.items) ? [...cart.items] : []
  const existingIndex = items.findIndex((item) => item.productId === productId)

  if (existingIndex >= 0) {
    items[existingIndex] = {
      ...items[existingIndex],
      quantity: (items[existingIndex].quantity || 1) + safeQuantity,
    }
  } else {
    items.unshift({ productId, quantity: safeQuantity, addedAt: new Date() })
  }

  await carts.updateOne(
    { email: user.email },
    { $set: { items, updatedAt: new Date() } },
  )

  res.status(201).json({ message: 'Added to cart' })
}
