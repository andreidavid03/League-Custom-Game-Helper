import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema.js'

// Create the database client
const client = createClient({
  url: process.env.DATABASE_URL || 'file:./data/lol-helper.db',
})

// Create the database instance
export const db = drizzle(client, { schema })

export default db