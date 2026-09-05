import { Hono } from 'hono'
import type { AppBindings } from '../types'
import { requireAuth, requireRole, requireCap } from '../middleware/auth'
import { newId } from '../lib/ids'
import { hashPassword } from '../lib/password'
import {
  staffCourseCreateSchema,
  staffCourseUpdateSchema,
  teacherCreateSchema,
  teacherProfileUpdateSchema,
  lessonCreateSchema,
  lessonUpdateSchema,
  courseWithTeacherSchema
} from '../validation'

const consoleApi = new Hono<AppBindings>()
consoleApi.use('*', requireAuth, requireRole('staff'))

consoleApi.get('/approvals', requireCap('publish'), async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT a.id, a.entity_id, a.kind, a.created_at, c.title, c.teacher_id, u.display_name AS teacher_name
     FROM approval_requests a
     JOIN courses c ON c.id = a.entity_id
     JOIN users u ON u.id = c.teacher_id
     WHERE a.status = 'pending'
     ORDER BY a.created_at ASC`
  ).all()
  return c.json({ approvals: results })
})

consoleApi.post('/approvals/:id/approve', requireCap('publish'), async (c) => {
  const user = c.get('user')!
  const request = await c.env.DB.prepare('SELECT * FROM approval_requests WHERE id = ?')
    .bind(c.req.param('id'))
    .first<Record<string, unknown>>()
  if (!request || request.status !== 'pending') return c.json({ error: 'not_found' }, 404)

  await c.env.DB.batch([
    c.env.DB.prepare(
      `UPDATE approval_requests SET status = 'approved', reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?`
    ).bind(user.id, request.id),
    c.env.DB.prepare(`UPDATE courses SET status = 'published' WHERE id = ?`).bind(request.entity_id)
  ])
  await c.env.DB.prepare(
    `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'course.publish', 'course', ?)`
  )
    .bind(newId(), user.id, request.entity_id)
    .run()

  return c.json({ ok: true })
})

consoleApi.post('/approvals/:id/reject', requireCap('publish'), async (c) => {
  const user = c.get('user')!
  const body = await c.req.json().catch(() => ({}) as { reason?: string })
  const request = await c.env.DB.prepare('SELECT * FROM approval_requests WHERE id = ?')
    .bind(c.req.param('id'))
    .first<Record<string, unknown>>()
  if (!request || request.status !== 'pending') return c.json({ error: 'not_found' }, 404)

  await c.env.DB.prepare(
    `UPDATE approval_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = datetime('now'), payload = ? WHERE id = ?`
  )
    .bind(user.id, JSON.stringify({ reason: body?.reason ?? '' }), request.id)
    .run()

  return c.json({ ok: true })
})

consoleApi.get('/courses', requireCap('courses'), async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT c.*, u.display_name AS teacher_name,
            (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS lesson_count,
            (SELECT status FROM approval_requests a WHERE a.entity_id = c.id AND a.status = 'pending' LIMIT 1) AS pending_status
     FROM courses c JOIN users u ON u.id = c.teacher_id
     ORDER BY c.created_at DESC`
  ).all()
  return c.json({ courses: results })
})

consoleApi.get('/courses/:id', requireCap('courses'), async (c) => {
  const course = await c.env.DB.prepare(
    `SELECT c.*, u.display_name AS teacher_name FROM courses c JOIN users u ON u.id = c.teacher_id WHERE c.id = ?`
  )
    .bind(c.req.param('id'))
    .first<Record<string, unknown>>()
  if (!course) return c.json({ error: 'not_found' }, 404)

  const { results: lessons } = await c.env.DB.prepare(
    'SELECT id, position, title, duration_seconds, is_free_preview FROM lessons WHERE course_id = ? ORDER BY position'
  )
    .bind(course.id)
    .all()
  const latestApproval = await c.env.DB.prepare(
    `SELECT status, payload, created_at FROM approval_requests WHERE entity_id = ? ORDER BY created_at DESC LIMIT 1`
  )
    .bind(course.id)
    .first()
  return c.json({ course, lessons, latestApproval: latestApproval ?? null })
})

consoleApi.post('/courses', requireCap('courses'), async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = staffCourseCreateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_input', details: parsed.error.flatten() }, 400)
  const d = parsed.data

  const teacher = await c.env.DB.prepare(`SELECT id FROM users WHERE id = ? AND role = 'teacher'`).bind(d.teacherId).first()
  if (!teacher) return c.json({ error: 'teacher_not_found' }, 400)

  const id = newId()
  await c.env.DB.prepare(
    `INSERT INTO courses (id, teacher_id, title, subject, bac_stream, price_da, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, d.teacherId, d.title, d.subject, d.bacStream, d.priceDa, d.description ?? '')
    .run()
  return c.json({ id }, 201)
})

// Combined "Add course" flow for the legacy /admin CMS, which has no teacher
// picker — admin types the teacher's details right there, and this route
// finds a teacher by that email or creates one on the spot. The created
// teacher gets a random, never-communicated password since nothing lets a
// teacher log in anymore (see EZBAC_TECHNICAL_ARCHITECTURE.md §5.6).
consoleApi.post('/courses/with-teacher', requireCap('courses'), async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = courseWithTeacherSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_input', details: parsed.error.flatten() }, 400)
  const d = parsed.data

  const existing = await c.env.DB.prepare('SELECT id, role FROM users WHERE email = ?')
    .bind(d.teacherEmail)
    .first<{ id: string; role: string }>()
  if (existing && existing.role !== 'teacher') {
    return c.json({ error: 'email_belongs_to_non_teacher' }, 409)
  }

  let teacherId: string
  if (existing) {
    teacherId = existing.id
  } else {
    teacherId = newId()
    const randomPassword = crypto.randomUUID() + crypto.randomUUID()
    const passwordHash = await hashPassword(randomPassword)
    const displayName = `${d.teacherFirstName} ${d.teacherLastName}`.trim()
    await c.env.DB.prepare(
      `INSERT INTO users (id, email, password_hash, role, display_name, first_name, last_name)
       VALUES (?, ?, ?, 'teacher', ?, ?, ?)`
    )
      .bind(teacherId, d.teacherEmail, passwordHash, displayName, d.teacherFirstName, d.teacherLastName)
      .run()
    await c.env.DB.prepare(
      `INSERT INTO teacher_profiles (user_id, headline, bio, subjects, verified) VALUES (?, '', '', '', 0)`
    )
      .bind(teacherId)
      .run()
  }

  const id = newId()
  await c.env.DB.prepare(
    `INSERT INTO courses (id, teacher_id, title, subject, bac_stream, price_da, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, teacherId, d.title, d.subject, d.bacStream, d.priceDa, d.description ?? '')
    .run()

  return c.json({ id, teacherId, teacherCreated: !existing }, 201)
})

consoleApi.patch('/courses/:id', requireCap('courses'), async (c) => {
  const course = await c.env.DB.prepare('SELECT id FROM courses WHERE id = ?').bind(c.req.param('id')).first()
  if (!course) return c.json({ error: 'not_found' }, 404)

  const body = await c.req.json().catch(() => null)
  const parsed = staffCourseUpdateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_input', details: parsed.error.flatten() }, 400)
  const d = parsed.data

  if (d.teacherId !== undefined) {
    const teacher = await c.env.DB.prepare(`SELECT id FROM users WHERE id = ? AND role = 'teacher'`).bind(d.teacherId).first()
    if (!teacher) return c.json({ error: 'teacher_not_found' }, 400)
  }

  const fields: string[] = []
  const values: unknown[] = []
  if (d.title !== undefined) { fields.push('title = ?'); values.push(d.title) }
  if (d.subject !== undefined) { fields.push('subject = ?'); values.push(d.subject) }
  if (d.bacStream !== undefined) { fields.push('bac_stream = ?'); values.push(d.bacStream) }
  if (d.priceDa !== undefined) { fields.push('price_da = ?'); values.push(d.priceDa) }
  if (d.description !== undefined) { fields.push('description = ?'); values.push(d.description) }
  if (d.teacherId !== undefined) { fields.push('teacher_id = ?'); values.push(d.teacherId) }
  if (fields.length === 0) return c.json({ ok: true })

  values.push(course.id)
  await c.env.DB.prepare(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  return c.json({ ok: true })
})

consoleApi.post('/courses/:id/cover', requireCap('courses'), async (c) => {
  const course = await c.env.DB.prepare('SELECT id FROM courses WHERE id = ?').bind(c.req.param('id')).first<{ id: string }>()
  if (!course) return c.json({ error: 'not_found' }, 404)

  const form = await c.req.formData()
  const file = form.get('file')
  if (!file || typeof file === 'string') return c.json({ error: 'file_required' }, 400)

  const key = `covers/${course.id}.jpg`
  await c.env.FILES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || 'image/jpeg' } })
  await c.env.DB.prepare('UPDATE courses SET cover_key = ? WHERE id = ?').bind(key, course.id).run()
  return c.json({ ok: true, key })
})

consoleApi.post('/teachers/:id/avatar', requireCap('users'), async (c) => {
  const teacherId = c.req.param('id')
  const teacher = await c.env.DB.prepare(`SELECT id FROM users WHERE id = ? AND role = 'teacher'`).bind(teacherId).first()
  if (!teacher) return c.json({ error: 'not_found' }, 404)

  const form = await c.req.formData()
  const file = form.get('file')
  if (!file || typeof file === 'string') return c.json({ error: 'file_required' }, 400)

  const key = `avatars/${teacherId}.jpg`
  await c.env.FILES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || 'image/jpeg' } })
  await c.env.DB.prepare('UPDATE teacher_profiles SET avatar_key = ? WHERE user_id = ?').bind(key, teacherId).run()
  return c.json({ ok: true, key })
})

consoleApi.post('/courses/:id/lessons', requireCap('courses'), async (c) => {
  const course = await c.env.DB.prepare('SELECT id FROM courses WHERE id = ?').bind(c.req.param('id')).first<{ id: string }>()
  if (!course) return c.json({ error: 'not_found' }, 404)

  const form = await c.req.formData()
  const file = form.get('video')
  const title = String(form.get('title') || '').trim()
  const isFreePreview = form.get('isFreePreview') === 'true'
  if (!file || typeof file === 'string') return c.json({ error: 'video_required' }, 400)

  const parsed = lessonCreateSchema.safeParse({ title, isFreePreview })
  if (!parsed.success) return c.json({ error: 'invalid_input', details: parsed.error.flatten() }, 400)

  const nextPosition = await c.env.DB.prepare(
    'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM lessons WHERE course_id = ?'
  )
    .bind(course.id)
    .first<{ next: number }>()
  const position = nextPosition?.next ?? 0

  const id = newId()
  const key = `videos/${id}.mp4`
  await c.env.FILES.put(key, file.stream(), { httpMetadata: { contentType: file.type || 'video/mp4' } })
  await c.env.DB.prepare(
    `INSERT INTO lessons (id, course_id, position, title, video_key, is_free_preview) VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(id, course.id, position, parsed.data.title, key, parsed.data.isFreePreview ? 1 : 0)
    .run()

  return c.json({ id, position }, 201)
})

consoleApi.patch('/lessons/:id', requireCap('courses'), async (c) => {
  const lesson = await c.env.DB.prepare('SELECT id FROM lessons WHERE id = ?').bind(c.req.param('id')).first<{ id: string }>()
  if (!lesson) return c.json({ error: 'not_found' }, 404)

  const body = await c.req.json().catch(() => null)
  const parsed = lessonUpdateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_input', details: parsed.error.flatten() }, 400)
  const d = parsed.data

  const fields: string[] = []
  const values: unknown[] = []
  if (d.title !== undefined) { fields.push('title = ?'); values.push(d.title) }
  if (d.isFreePreview !== undefined) { fields.push('is_free_preview = ?'); values.push(d.isFreePreview ? 1 : 0) }
  if (d.position !== undefined) { fields.push('position = ?'); values.push(d.position) }
  if (fields.length === 0) return c.json({ ok: true })

  values.push(lesson.id)
  await c.env.DB.prepare(`UPDATE lessons SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  return c.json({ ok: true })
})

consoleApi.delete('/lessons/:id', requireCap('courses'), async (c) => {
  const lesson = await c.env.DB.prepare('SELECT id, video_key FROM lessons WHERE id = ?')
    .bind(c.req.param('id'))
    .first<{ id: string; video_key: string | null }>()
  if (!lesson) return c.json({ error: 'not_found' }, 404)

  if (lesson.video_key) await c.env.FILES.delete(lesson.video_key)
  await c.env.DB.prepare('DELETE FROM lessons WHERE id = ?').bind(lesson.id).run()
  return c.json({ ok: true })
})

consoleApi.post('/courses/:id/publish', requireCap('publish'), async (c) => {
  const user = c.get('user')!
  const course = await c.env.DB.prepare('SELECT id FROM courses WHERE id = ?').bind(c.req.param('id')).first()
  if (!course) return c.json({ error: 'not_found' }, 404)

  await c.env.DB.prepare(`UPDATE courses SET status = 'published' WHERE id = ?`).bind(course.id).run()
  await c.env.DB.prepare(
    `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'course.publish', 'course', ?)`
  ).bind(newId(), user.id, course.id).run()
  return c.json({ ok: true })
})

consoleApi.post('/courses/:id/unpublish', requireCap('publish'), async (c) => {
  const user = c.get('user')!
  const course = await c.env.DB.prepare('SELECT id FROM courses WHERE id = ?').bind(c.req.param('id')).first()
  if (!course) return c.json({ error: 'not_found' }, 404)

  await c.env.DB.prepare(`UPDATE courses SET status = 'draft' WHERE id = ?`).bind(course.id).run()
  await c.env.DB.prepare(
    `INSERT INTO audit_log (id, user_id, action, entity_type, entity_id) VALUES (?, ?, 'course.unpublish', 'course', ?)`
  ).bind(newId(), user.id, course.id).run()
  return c.json({ ok: true })
})

consoleApi.get('/users/stats', requireCap('users'), async (c) => {
  const byRole = await c.env.DB.prepare(
    `SELECT role, COUNT(*) AS count FROM users GROUP BY role`
  ).all<{ role: string; count: number }>()

  const counts = { student: 0, teacher: 0, staff: 0 }
  for (const row of byRole.results) {
    if (row.role in counts) counts[row.role as keyof typeof counts] = row.count
  }
  const total = counts.student + counts.teacher + counts.staff

  const suspended = await c.env.DB.prepare(`SELECT COUNT(*) AS count FROM users WHERE is_suspended = 1`)
    .first<{ count: number }>()
  const newLast7Days = await c.env.DB.prepare(
    `SELECT COUNT(*) AS count FROM users WHERE created_at >= datetime('now', '-7 days')`
  ).first<{ count: number }>()
  const newLast30Days = await c.env.DB.prepare(
    `SELECT COUNT(*) AS count FROM users WHERE created_at >= datetime('now', '-30 days')`
  ).first<{ count: number }>()

  return c.json({
    total,
    students: counts.student,
    teachers: counts.teacher,
    staff: counts.staff,
    suspended: suspended?.count ?? 0,
    newLast7Days: newLast7Days?.count ?? 0,
    newLast30Days: newLast30Days?.count ?? 0
  })
})

consoleApi.get('/teachers', requireCap('users'), async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT u.id, u.email, u.display_name, u.is_suspended, u.created_at,
            tp.headline, tp.bio, tp.subjects, tp.verified, tp.avatar_key,
            (SELECT COUNT(*) FROM courses c WHERE c.teacher_id = u.id) AS course_count,
            (SELECT COUNT(*) FROM courses c WHERE c.teacher_id = u.id AND c.status = 'published') AS published_count
     FROM users u LEFT JOIN teacher_profiles tp ON tp.user_id = u.id
     WHERE u.role = 'teacher'
     ORDER BY u.created_at DESC`
  ).all()
  return c.json({ teachers: results })
})

consoleApi.post('/teachers', requireCap('users'), async (c) => {
  const body = await c.req.json().catch(() => null)
  const parsed = teacherCreateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_input', details: parsed.error.flatten() }, 400)
  const d = parsed.data

  const existing = await c.env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(d.email).first()
  if (existing) return c.json({ error: 'email_taken' }, 409)

  const id = newId()
  const passwordHash = await hashPassword(d.password)
  const displayName = `${d.firstName} ${d.lastName}`.trim()
  await c.env.DB.prepare(
    `INSERT INTO users (id, email, password_hash, role, display_name, first_name, last_name) VALUES (?, ?, ?, 'teacher', ?, ?, ?)`
  )
    .bind(id, d.email, passwordHash, displayName, d.firstName, d.lastName)
    .run()
  await c.env.DB.prepare(
    `INSERT INTO teacher_profiles (user_id, headline, bio, subjects, verified) VALUES (?, ?, ?, ?, ?)`
  )
    .bind(id, d.headline ?? '', d.bio ?? '', d.subjects ?? '', d.verified ? 1 : 0)
    .run()

  return c.json({ id }, 201)
})

consoleApi.patch('/teachers/:id', requireCap('users'), async (c) => {
  const teacherId = c.req.param('id')
  const teacher = await c.env.DB.prepare(`SELECT id FROM users WHERE id = ? AND role = 'teacher'`).bind(teacherId).first()
  if (!teacher) return c.json({ error: 'not_found' }, 404)

  const body = await c.req.json().catch(() => null)
  const parsed = teacherProfileUpdateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'invalid_input', details: parsed.error.flatten() }, 400)
  const d = parsed.data

  const fields: string[] = []
  const values: unknown[] = []
  if (d.headline !== undefined) { fields.push('headline = ?'); values.push(d.headline) }
  if (d.bio !== undefined) { fields.push('bio = ?'); values.push(d.bio) }
  if (d.subjects !== undefined) { fields.push('subjects = ?'); values.push(d.subjects) }
  if (d.verified !== undefined) { fields.push('verified = ?'); values.push(d.verified ? 1 : 0) }
  if (fields.length === 0) return c.json({ ok: true })

  values.push(teacherId)
  await c.env.DB.prepare(`UPDATE teacher_profiles SET ${fields.join(', ')} WHERE user_id = ?`).bind(...values).run()
  return c.json({ ok: true })
})

export default consoleApi
