import { getCollections } from '../../_lib/db.js'
import { getUserFromRequest } from '../../_lib/auth.js'
import { readJsonBody } from '../../_lib/body.js'

export default async function handler(req, res) {
  const { carts, sessions } = await getCollections()
  const user = await getUserFromRequest(req, sessions)

  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const { productId } = req.query

  if (req.method === 'PATCH') {
    const { quantity } = await readJsonBody(req)
    const safeQuantity = Number(quantity)

    const cart = await carts.findOne({ email: user.email })
    if (!cart || !Array.isArray(cart.items)) {
      res.status(404).json({ message: 'Cart not found' })
      return
    }

    const items = [...cart.items]
    const index = items.findIndex((item) => item.productId === productId)
    if (index === -1) {
      res.status(404).json({ message: 'Item not found' })
      return
    }

    if (!Number.isFinite(safeQuantity) || safeQuantity <= 0) {
      items.splice(index, 1)
    } else {
      items[index] = { ...items[index], quantity: safeQuantity }
    }

    await carts.updateOne(
      { email: user.email },
      { $set: { items, updatedAt: new Date() } },
    )

    res.status(200).json({ message: 'Updated' })
    return
  }

  if (req.method === 'DELETE') {
    const cart = await carts.findOne({ email: user.email })
    if (!cart || !Array.isArray(cart.items)) {
      res.status(404).json({ message: 'Cart not found' })
      return
    }

    const items = cart.items.filter((item) => item.productId !== productId)
    await carts.updateOne(
      { email: user.email },
      { $set: { items, updatedAt: new Date() } },
    )

    res.status(200).json({ message: 'Removed' })
    return
  }

  res.status(405).json({ message: 'Method not allowed' })
}
