import { getCollections } from '../_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  const { products } = await getCollections()
  const rows = await products.find().sort({ createdAt: -1 }).toArray()

  const items = rows.map((row) => ({
    id: row._id.toString(),
    name: row.name,
    category: row.category,
    price: row.price || '',
    description: row.description || '',
    images: Array.isArray(row.images) ? row.images : [],
    createdAt: row.createdAt ? row.createdAt.toISOString() : '',
  }))

  res.status(200).json({ products: items })
}
