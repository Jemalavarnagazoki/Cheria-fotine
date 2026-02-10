const bcrypt = require('bcrypt')
const { MongoClient } = require('mongodb')

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017'
const MONGODB_DB = process.env.MONGODB_DB || 'cheria'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'fotine27@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Kokaia123'

let cachedClient

const initDb = async () => {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI)
    await cachedClient.connect()
  }

  const db = cachedClient.db(MONGODB_DB)
  const admins = db.collection('admins')
  const users = db.collection('users')
  const sessions = db.collection('sessions')
  const products = db.collection('products')
  const carts = db.collection('carts')
  const messages = db.collection('messages')

  await Promise.all([
    admins.createIndex({ email: 1 }, { unique: true }),
    users.createIndex({ email: 1 }, { unique: true }),
    sessions.createIndex({ token: 1 }, { unique: true }),
    sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    products.createIndex({ createdAt: -1 }),
    carts.createIndex({ email: 1 }, { unique: true }),
    messages.createIndex({ createdAt: -1 }),
    messages.createIndex({ fromEmail: 1 }),
  ])

  await seedAdmin(admins)

  return { db, admins, users, sessions, products, carts, messages }
}

const seedAdmin = async (admins) => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return
  }

  const existing = await admins.findOne({ email: ADMIN_EMAIL })
  if (existing) {
    return
  }

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10)
  await admins.insertOne({
    email: ADMIN_EMAIL,
    passwordHash: hash,
    createdAt: new Date(),
  })
}

module.exports = { initDb }
