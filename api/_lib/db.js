import bcrypt from 'bcrypt'
import { MongoClient } from 'mongodb'

const MONGODB_URI = process.env.MONGODB_URI || ''
const MONGODB_DB = process.env.MONGODB_DB || 'cheria'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'fotine27@gmail.com'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

const globalScope = globalThis

const getClient = async () => {
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI')
  }

  if (!globalScope._mongoClientPromise) {
    const client = new MongoClient(MONGODB_URI)
    globalScope._mongoClientPromise = client.connect()
  }

  return globalScope._mongoClientPromise
}

const ensureIndexes = async (collections) => {
  if (globalScope._mongoIndexesReady) {
    return
  }

  await Promise.all([
    collections.admins.createIndex({ email: 1 }, { unique: true }),
    collections.users.createIndex({ email: 1 }, { unique: true }),
    collections.sessions.createIndex({ token: 1 }, { unique: true }),
    collections.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    collections.products.createIndex({ createdAt: -1 }),
    collections.carts.createIndex({ email: 1 }, { unique: true }),
    collections.messages.createIndex({ createdAt: -1 }),
    collections.messages.createIndex({ fromEmail: 1 }),
  ])

  globalScope._mongoIndexesReady = true
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

export const getCollections = async () => {
  const client = await getClient()
  const db = client.db(MONGODB_DB)
  const collections = {
    admins: db.collection('admins'),
    users: db.collection('users'),
    sessions: db.collection('sessions'),
    products: db.collection('products'),
    carts: db.collection('carts'),
    messages: db.collection('messages'),
  }

  await ensureIndexes(collections)
  await seedAdmin(collections.admins)

  return collections
}

export const getAdminEmail = () => ADMIN_EMAIL
