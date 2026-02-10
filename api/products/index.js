import Busboy from 'busboy'
import { getCollections } from '../_lib/db.js'
import { getUserFromRequest, isAdminUser } from '../_lib/auth.js'
import { readJsonBody } from '../_lib/body.js'

const parseMultipart = async (req) => {
  const fields = {}
  const busboy = Busboy({ headers: req.headers, limits: { fileSize: 6 * 1024 * 1024 } })

  busboy.on('field', (name, value) => {
    fields[name] = value
  })

  busboy.on('file', (_, file) => {
    file.resume()
  })

  await new Promise((resolve, reject) => {
    busboy.on('finish', resolve)
    busboy.on('error', reject)
    req.pipe(busboy)
  })

  return fields
}

export default async function handler(req, res) {
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

  if (req.method === 'GET') {
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
    return
  }

  if (req.method === 'POST') {
    const contentType = req.headers['content-type'] || ''
    const data = contentType.includes('multipart/form-data')
      ? await parseMultipart(req)
      : await readJsonBody(req)

    const { name, category, price, description } = data

    if (!name || !category) {
      res.status(400).json({ message: 'Name and category required' })
      return
    }

    const createdAt = new Date()
    const result = await products.insertOne({
      name,
      category,
      price: price || '',
      description: description || '',
      images: [],
      createdAt,
    })

    res.status(201).json({
      product: {
        id: result.insertedId.toString(),
        name,
        category,
        price: price || '',
        description: description || '',
        images: [],
        createdAt: createdAt.toISOString(),
      },
    })
    return
  }

  res.status(405).json({ message: 'Method not allowed' })
}
