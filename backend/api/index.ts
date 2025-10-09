import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import { secureHeaders } from 'hono/secure-headers'

// Import routes
import playersRouter from '../src/routes/players.js'
import gamesRouter from '../src/routes/games.js'
import matchHistoryRouter from '../src/routes/match-history.js'
import matchesRouter from '../src/routes/matches.js'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', prettyJSON())
app.use('*', secureHeaders())
app.use('*', cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173',
    'https://*.vercel.app', // Allow all Vercel apps
    'https://league-custom-game-helper-frontend.vercel.app' // Your specific frontend
  ],
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

app.get('/', (c) => {
  return c.json({ 
    message: 'LoL Custom Game Helper API',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      players: '/api/players',
      games: '/api/games',
      matches: '/api/matches',
      history: '/api/match-history'
    }
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

// Export for Vercel
export default app