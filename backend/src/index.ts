import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'

// Import routes
import playersRouter from './routes/players.js'
import gamesRouter from './routes/games.js'
import matchHistoryRouter from './routes/match-history.js'
import matchesRouter from './routes/matches.js'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', secureHeaders())
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// Health check
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'LoL Custom Game Helper API',
    version: '2.0.0'
  })
})

// API Routes
app.route('/api/players', playersRouter)
app.route('/api/games', gamesRouter)
app.route('/api/match-history', matchHistoryRouter)
app.route('/api/matches', matchesRouter)

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Route not found' }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = Number(process.env.PORT) || 3001

console.log(`🚀 LoL Custom Game Helper API starting...`)
console.log(`📡 Server running on http://localhost:${port}`)
console.log(`🎮 Ready to organize epic custom games!`)

serve({
  fetch: app.fetch,
  port: port,
})