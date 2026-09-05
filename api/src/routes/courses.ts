import { Hono } from 'hono'
import type { AppBindings, Env } from '../types'
import { signLessonAccess, verifyLessonAccess, streamR2Range } from '../lib/storage'

const courses = new Hono<AppBindings>()

courses.get('/courses', async (c) => {
  const subject = c.req.query('subject')
  const bacStream = c.req.query('bacStream')

  let query = `SELECT c.id, c.title, c.subject, c.bac_stream, c.price_da, c.cover_key, c.created_at, c.teacher_id, u.display_name AS teacher_name,
                      (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS lesson_count,
                      (SELECT COUNT(*) FROM access a WHERE a.course_id = c.id) AS enrolled_count
               FROM courses c JOIN users u ON u.id = c.teacher_id WHERE c.status = 'published'`
  const binds: string[] = []
  if (subject) { query += ' AND c.subject = ?'; binds.push(subject) }
  if (bacStream) { query += ' AND c.bac_stream = ?'; binds.push(bacStream) }
  query += ' ORDER BY c.created_at DESC'

  const { results } = await c.env.DB.prepare(query).bind(...binds).all()
  return c.json({ courses: results })
})

courses.get('/courses/:id', async (c) => {
  const course = await c.env.DB.prepare(
    `SELECT c.*, u.display_name AS teacher_name,
            (SELECT COUNT(*) FROM access a WHERE a.course_id = c.id) AS enrolled_count
     FROM courses c JOIN users u ON u.id = c.teacher_id
     WHERE c.id = ? AND c.status = 'published'`
  )
    .bind(c.req.param('id'))
    .first<Record<string, unknown>>()
  if (!course) return c.json({ error: 'not_found' }, 404)

  const { results: lessons } = await c.env.DB.prepare(
    'SELECT id, position, title, duration_seconds, is_free_preview FROM lessons WHERE course_id = ? ORDER BY position'
  )
    .bind(course.id)
    .all()
  return c.json({ course, lessons })
})

courses.get('/courses/:id/cover', async (c) => {
  const course = await c.env.DB.prepare('SELECT cover_key FROM courses WHERE id = ?')
    .bind(c.req.param('id'))
    .first<{ cover_key: string | null }>()
  if (!course?.cover_key) return c.json({ error: 'not_found' }, 404)

  const object = await c.env.FILES.get(course.cover_key)
  if (!object) return c.json({ error: 'not_found' }, 404)

  const headers = new Headers()
  headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
  headers.set('Cache-Control', 'public, max-age=3600')
  return new Response(object.body, { headers })
})

courses.get('/teachers/:id/avatar', async (c) => {
  const teacher = await c.env.DB.prepare('SELECT avatar_key FROM teacher_profiles WHERE user_id = ?')
    .bind(c.req.param('id'))
    .first<{ avatar_key: string | null }>()
  if (!teacher?.avatar_key) return c.json({ error: 'not_found' }, 404)

  const object = await c.env.FILES.get(teacher.avatar_key)
  if (!object) return c.json({ error: 'not_found' }, 404)

  const headers = new Headers()
  headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg')
  headers.set('Cache-Control', 'public, max-age=3600')
  return new Response(object.body, { headers })
})

async function hasAccess(env: Env, userId: string | undefined, courseId: string): Promise<boolean> {
  if (!userId) return false
  const row = await env.DB.prepare('SELECT 1 FROM access WHERE user_id = ? AND course_id = ?').bind(userId, courseId).first()
  return !!row
}

courses.get('/lessons/:id/watch', async (c) => {
  const user = c.get('user')
  const lesson = await c.env.DB.prepare('SELECT * FROM lessons WHERE id = ?')
    .bind(c.req.param('id'))
    .first<Record<string, unknown>>()
  if (!lesson || !lesson.video_key) return c.json({ error: 'not_found' }, 404)

  const allowed = lesson.is_free_preview === 1 || (await hasAccess(c.env, user?.id, lesson.course_id as string))
  if (!allowed) return c.json({ error: 'access_denied' }, 403)

  const { exp, sig } = await signLessonAccess(c.env.LESSON_SIGNING_SECRET, lesson.id as string)
  return c.json({ url: `/v1/lessons/${lesson.id}/file?exp=${exp}&sig=${sig}`, expiresAt: exp })
})

courses.get('/lessons/:id/file', async (c) => {
  const id = c.req.param('id')
  const exp = Number(c.req.query('exp'))
  const sig = c.req.query('sig') || ''
  if (!exp || !sig) return c.json({ error: 'missing_signature' }, 400)

  const valid = await verifyLessonAccess(c.env.LESSON_SIGNING_SECRET, id, exp, sig)
  if (!valid) return c.json({ error: 'invalid_or_expired_signature' }, 401)

  const lesson = await c.env.DB.prepare('SELECT video_key FROM lessons WHERE id = ?')
    .bind(id)
    .first<{ video_key: string | null }>()
  if (!lesson?.video_key) return c.json({ error: 'not_found' }, 404)

  return streamR2Range(c.env.FILES, lesson.video_key, c.req.header('Range') ?? null)
})

export default courses
