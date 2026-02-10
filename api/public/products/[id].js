import { ObjectId } from 'mongodb'
import { getCollections } from '../../_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' })
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

  const { products } = await getCollections()
  const product = await products.findOne({ _id: productId })
  if (!product) {
    res.status(404).json({ message: 'Product not found' })
    return
  }

  res.status(200).json({
    product: {
      id: product._id.toString(),
      name: product.name,
      category: product.category,
      price: product.price || '',
      description: product.description || '',
      images: Array.isArray(product.images) ? product.images : [],
      createdAt: product.createdAt ? product.createdAt.toISOString() : '',
    },
  })
}
