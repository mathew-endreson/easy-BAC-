import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { AppBindings } from './types'
import { attachUser } from './middleware/auth'
import auth from './routes/auth'
import courses from './routes/courses'
import consoleApi from './routes/console'

const app = new Hono<AppBindings>()

app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') || ''
  const isLocalDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)

  return cors({
    origin: isLocalDevOrigin ? origin : c.env.APP_ORIGIN,
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization']
  })(c, next)
})
app.use('*', attachUser)

app.get('/v1/health', (c) => c.json({ ok: true, environment: c.env.ENVIRONMENT }))

app.route('/v1/auth', auth)
app.route('/v1', courses)
app.route('/console/api', consoleApi)

app.notFound((c) => c.json({ error: 'not_found' }, 404))
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'internal_error' }, 500)
})

export default app
