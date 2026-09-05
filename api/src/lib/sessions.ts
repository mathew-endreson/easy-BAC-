import { newId } from './ids'

const SESSION_TTL_DAYS = 30

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function createSession(db: D1Database, userId: string): Promise<{ token: string; expiresAt: string }> {
  const token = crypto.randomUUID() + crypto.randomUUID()
  const tokenHash = await sha256Hex(token)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
  await db
    .prepare('INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)')
    .bind(newId(), userId, tokenHash, expiresAt)
    .run()
  return { token, expiresAt }
}

export async function revokeSession(db: D1Database, token: string): Promise<void> {
  const tokenHash = await sha256Hex(token)
  await db.prepare("UPDATE sessions SET revoked_at = datetime('now') WHERE token_hash = ?").bind(tokenHash).run()
}

export async function resolveSession(db: D1Database, token: string): Promise<Record<string, unknown> | null> {
  const tokenHash = await sha256Hex(token)
  const row = await db
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > datetime('now')`
    )
    .bind(tokenHash)
    .first<Record<string, unknown>>()
  return row ?? null
}
