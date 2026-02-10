require('dotenv').config()

const crypto = require('crypto')
const cors = require('cors')
const express = require('express')
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb')
const { initDb } = require('./db')

const PORT = process.env.PORT || 3001
const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN || 'http://localhost:5173,http://localhost:5174'
const ALLOWED_ORIGINS = CLIENT_ORIGIN.split(',').map((origin) => origin.trim())
const SESSION_DAYS = Number(process.env.SESSION_DAYS || 7)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'fotine27@gmail.com'

const app = express()
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    },
  }),
)
app.use(express.json())

const uploadDir = path.join(__dirname, 'uploads')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
    callback(null, `${Date.now()}-${safeName}`)
  },
})

const upload = multer({ storage, limits: { fileSize: 6 * 1024 * 1024 } })

const startServer = async () => {
  const { admins, users, carts, sessions, products, messages } = await initDb()

  const requireAuth = async (req, res, next) => {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const session = await sessions.findOne({ token })

    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    if (new Date(session.expiresAt) < new Date()) {
      await sessions.deleteOne({ token })
      return res.status(401).json({ message: 'Session expired' })
    }

    req.user = {
      email: session.email,
      token,
      isAdmin: Boolean(session.isAdmin),
    }
    return next()
  }

  const requireAdmin = (req, res, next) => {
    if (!req.user?.isAdmin && req.user?.email !== ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Forbidden' })
    }
    return next()
  }

  app.use('/uploads', express.static(uploadDir))

  app.get('/api/health', (_, res) => {
    res.json({ status: 'ok' })
  })

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' })
    }

    let account = await admins.findOne({ email })
    let isAdmin = Boolean(account)

    if (!account) {
      account = await users.findOne({ email })
    }

    if (!account) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const match = await bcrypt.compare(password, account.passwordHash)
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (email === ADMIN_EMAIL) {
      isAdmin = true
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(
      Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString()

    await sessions.insertOne({
      token,
      email,
      isAdmin,
      expiresAt: new Date(expiresAt),
    })

    return res.json({ token, email, isAdmin })
  })

  app.post('/api/signup', async (req, res) => {
    const { email, password } = req.body || {}

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' })
    }

    if (email === ADMIN_EMAIL) {
      return res.status(403).json({ message: 'Admin account already exists' })
    }

    const existing = await users.findOne({ email })
    if (existing) {
      return res.status(409).json({ message: 'Account already exists' })
    }

    const hash = await bcrypt.hash(password, 10)
    await users.insertOne({
      email,
      passwordHash: hash,
      createdAt: new Date(),
    })

    const token = crypto.randomUUID()
    const expiresAt = new Date(
      Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString()

    await sessions.insertOne({
      token,
      email,
      isAdmin: false,
      expiresAt: new Date(expiresAt),
    })

    return res.status(201).json({ token, email, isAdmin: false })
  })

  app.post('/api/logout', requireAuth, async (req, res) => {
    await sessions.deleteOne({ token: req.user.token })
    res.json({ message: 'Logged out' })
  })

  app.post('/api/messages', requireAuth, async (req, res) => {
    const { name, email, message } = req.body || {}

    if (!name || !message) {
      return res.status(400).json({ message: 'Name and message required' })
    }

    const contactEmail = email || req.user.email
    const createdAt = new Date()

    const result = await messages.insertOne({
      name,
      contactEmail,
      fromEmail: req.user.email,
      message,
      createdAt,
      repliedAt: null,
      repliedBy: null,
      reply: null,
    })

    return res.status(201).json({
      message: {
        id: result.insertedId.toString(),
        name,
        email: contactEmail,
        fromEmail: req.user.email,
        message,
        createdAt: createdAt.toISOString(),
        repliedAt: null,
        repliedBy: null,
        reply: null,
      },
    })
  })

  app.get('/api/messages', requireAuth, requireAdmin, async (_, res) => {
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

    return res.json({ messages: items })
  })

  app.patch(
    '/api/messages/:id/reply',
    requireAuth,
    requireAdmin,
    async (req, res) => {
      const { id } = req.params
      const { reply } = req.body || {}

      if (!reply) {
        return res.status(400).json({ message: 'Reply required' })
      }

      let messageId
      try {
        messageId = new ObjectId(id)
      } catch {
        return res.status(400).json({ message: 'Invalid message id' })
      }

      const result = await messages.findOneAndUpdate(
        { _id: messageId },
        {
          $set: {
            reply,
            repliedAt: new Date(),
            repliedBy: req.user.email,
          },
        },
        { returnDocument: 'after' },
      )

      if (!result.value) {
        return res.status(404).json({ message: 'Message not found' })
      }

      return res.json({
        message: {
          id: result.value._id.toString(),
          name: result.value.name || '',
          email: result.value.contactEmail || result.value.fromEmail || '',
          fromEmail: result.value.fromEmail || '',
          message: result.value.message || '',
          createdAt: result.value.createdAt
            ? result.value.createdAt.toISOString()
            : '',
          repliedAt: result.value.repliedAt
            ? result.value.repliedAt.toISOString()
            : '',
          repliedBy: result.value.repliedBy || '',
          reply: result.value.reply || '',
        },
      })
    },
  )

  app.get('/api/public/products', async (_, res) => {
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

    res.json({ products: items })
  })

  app.get('/api/public/products/:id', async (req, res) => {
    const { id } = req.params

    let productId
    try {
      productId = new ObjectId(id)
    } catch {
      return res.status(400).json({ message: 'Invalid product id' })
    }

    const product = await products.findOne({ _id: productId })
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    return res.json({
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
  })

  app.get('/api/products', requireAuth, requireAdmin, async (_, res) => {
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

    res.json({ products: items })
  })

  app.post(
    '/api/products',
    requireAuth,
    requireAdmin,
    upload.array('images', 6),
    async (req, res) => {
      const { name, category, price, description } = req.body || {}

      if (!name || !category) {
        return res.status(400).json({ message: 'Name and category required' })
      }

      const files = (req.files || []).map((file) => `/uploads/${file.filename}`)
      const createdAt = new Date()

      const result = await products.insertOne({
        name,
        category,
        price: price || '',
        description: description || '',
        images: files,
        createdAt,
      })

      res.status(201).json({
        product: {
          id: result.insertedId.toString(),
          name,
          category,
          price: price || '',
          description: description || '',
          images: files,
          createdAt: createdAt.toISOString(),
        },
      })
    },
  )

  app.get('/api/cart', requireAuth, async (req, res) => {
    const cart = await carts.findOne({ email: req.user.email })
    if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
      return res.json({ items: [] })
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

    return res.json({ items })
  })

  app.post('/api/cart/items', requireAuth, async (req, res) => {
    const { productId, quantity } = req.body || {}
    const safeQuantity = Number.isFinite(Number(quantity))
      ? Math.max(1, Number(quantity))
      : 1

    let resolvedId
    try {
      resolvedId = new ObjectId(productId)
    } catch {
      return res.status(400).json({ message: 'Invalid product id' })
    }

    const product = await products.findOne({ _id: resolvedId })
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    const cart = await carts.findOne({ email: req.user.email })
    if (!cart) {
      await carts.insertOne({
        email: req.user.email,
        items: [
          { productId: productId, quantity: safeQuantity, addedAt: new Date() },
        ],
        updatedAt: new Date(),
      })
      return res.status(201).json({ message: 'Added to cart' })
    }

    const items = Array.isArray(cart.items) ? [...cart.items] : []
    const existingIndex = items.findIndex(
      (item) => item.productId === productId,
    )

    if (existingIndex >= 0) {
      items[existingIndex] = {
        ...items[existingIndex],
        quantity: (items[existingIndex].quantity || 1) + safeQuantity,
      }
    } else {
      items.unshift({
        productId,
        quantity: safeQuantity,
        addedAt: new Date(),
      })
    }

    await carts.updateOne(
      { email: req.user.email },
      { $set: { items, updatedAt: new Date() } },
    )

    return res.status(201).json({ message: 'Added to cart' })
  })

  app.patch('/api/cart/items/:productId', requireAuth, async (req, res) => {
    const { productId } = req.params
    const { quantity } = req.body || {}
    const safeQuantity = Number(quantity)

    const cart = await carts.findOne({ email: req.user.email })
    if (!cart || !Array.isArray(cart.items)) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    const items = [...cart.items]
    const index = items.findIndex((item) => item.productId === productId)
    if (index === -1) {
      return res.status(404).json({ message: 'Item not found' })
    }

    if (!Number.isFinite(safeQuantity) || safeQuantity <= 0) {
      items.splice(index, 1)
    } else {
      items[index] = { ...items[index], quantity: safeQuantity }
    }

    await carts.updateOne(
      { email: req.user.email },
      { $set: { items, updatedAt: new Date() } },
    )

    return res.json({ message: 'Updated' })
  })

  app.delete('/api/cart/items/:productId', requireAuth, async (req, res) => {
    const { productId } = req.params
    const cart = await carts.findOne({ email: req.user.email })
    if (!cart || !Array.isArray(cart.items)) {
      return res.status(404).json({ message: 'Cart not found' })
    }

    const items = cart.items.filter((item) => item.productId !== productId)
    await carts.updateOne(
      { email: req.user.email },
      { $set: { items, updatedAt: new Date() } },
    )

    return res.json({ message: 'Removed' })
  })

  app.delete('/api/cart', requireAuth, async (req, res) => {
    await carts.deleteOne({ email: req.user.email })
    return res.json({ message: 'Cleared' })
  })

  app.delete('/api/products/:id', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.params

    if (!id) {
      return res.status(400).json({ message: 'Product id required' })
    }

    let productId
    try {
      productId = new ObjectId(id)
    } catch {
      return res.status(400).json({ message: 'Invalid product id' })
    }

    const result = await products.deleteOne({ _id: productId })

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Product not found' })
    }

    return res.json({ message: 'Deleted' })
  })

  app.listen(PORT, () => {
    console.log(`Cheria server listening on ${PORT}`)
  })
}

startServer().catch((error) => {
  console.error('Failed to start server', error)
  process.exit(1)
})
