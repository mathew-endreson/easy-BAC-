import { Hono, type Context } from 'hono'
import { setCookie, deleteCookie, getCookie } from 'hono/cookie'
import type { AppBindings } from '../types'
import { hashPassword, verifyPassword } from '../lib/password'
import { createSession, revokeSession } from '../lib/sessions'
import { newId } from '../lib/ids'
import { registerSchema, loginSchema } from '../validation'
import { SESSION_COOKIE } from '../middleware/auth'

const auth = new Hono<AppBindings>()

function setSessionCookie(c: Context<AppBindings>, token: string, expiresAt: string) {
  setCookie(c, SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    secure: c.env.ENVIRONMENT === 'production',
    expires: new Date(expiresAt)
  })
}

auth.post('/register', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_input', details: parsed.error.flatten() }, 400)
  const { email, password, firstName, lastName, phoneNumber, wilaya, bacStream, studyYear } = parsed.data
  const displayName = `${firstName} ${lastName}`.trim()

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) return c.json({ error: 'email_taken' }, 409)

  const id = newId()
  const passwordHash = await hashPassword(password)
  await c.env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, role, display_name, first_name, last_name, phone_number, wilaya, bac_stream, study_year)
     VALUES (?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, email, passwordHash, displayName, firstName, lastName, phoneNumber ?? null, wilaya ?? null, bacStream ?? null, studyYear ?? null)
    .run()

  const { token, expiresAt } = await createSession(c.env.DB, id)
  setSessionCookie(c, token, expiresAt)
  await c.env.DB.prepare(`INSERT INTO audit_log (id, user_id, action) VALUES (?, ?, 'user.register')`).bind(newId(), id).run()

  return c.json({ user: { id, email, role: 'student', displayName, isSuperAdmin: false } }, 201)
})

auth.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_input' }, 400)
  const { email, password } = parsed.data

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<Record<string, unknown>>()
  if (!user) return c.json({ error: 'invalid_credentials' }, 401)

  const valid = await verifyPassword(password, user.password_hash as string)
  if (!valid) return c.json({ error: 'invalid_credentials' }, 401)
  if (user.is_suspended) return c.json({ error: 'account_suspended' }, 403)

  const { token, expiresAt } = await createSession(c.env.DB, user.id as string)
  setSessionCookie(c, token, expiresAt)
  await c.env.DB.prepare(`INSERT INTO audit_log (id, user_id, action) VALUES (?, ?, 'user.login')`)
    .bind(newId(), user.id)
    .run()

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name,
      isSuperAdmin: !!user.is_super_admin
    }
  })
})

auth.post('/logout', async (c) => {
  const token = getCookie(c, SESSION_COOKIE)
  if (token) await revokeSession(c.env.DB, token)
  deleteCookie(c, SESSION_COOKIE, { path: '/' })
  return c.json({ ok: true })
})

auth.get('/me', async (c) => {
  return c.json({ user: c.get('user') })
})

export default auth
