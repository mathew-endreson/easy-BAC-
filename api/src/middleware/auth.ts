import type { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import type { AppBindings, AuthUser, Role } from '../types'
import { resolveSession } from '../lib/sessions'
import { can, type Capability } from '../lib/permissions'

export const SESSION_COOKIE = 'ezbac_session'

export async function attachUser(c: Context<AppBindings>, next: Next) {
  const token = getCookie(c, SESSION_COOKIE)
  if (!token) {
    c.set('user', null)
    return next()
  }
  const row = await resolveSession(c.env.DB, token)
  if (!row) {
    c.set('user', null)
    return next()
  }
  const user: AuthUser = {
    id: row.id as string,
    email: row.email as string,
    role: row.role as Role,
    isSuperAdmin: !!row.is_super_admin,
    permissions: row.permissions ? String(row.permissions).split(',').filter(Boolean) : [],
    displayName: row.display_name as string
  }
  c.set('user', user)
  return next()
}

export async function requireAuth(c: Context<AppBindings>, next: Next) {
  if (!c.get('user')) return c.json({ error: 'unauthorized' }, 401)
  await next()
}

export function requireRole(role: Role) {
  return async (c: Context<AppBindings>, next: Next) => {
    const user = c.get('user')
    if (!user || user.role !== role) return c.json({ error: 'forbidden' }, 403)
    await next()
  }
}

export function requireCap(cap: Capability) {
  return async (c: Context<AppBindings>, next: Next) => {
    const user = c.get('user')
    if (!user || !can(user, cap)) return c.json({ error: 'forbidden' }, 403)
    await next()
  }
}
