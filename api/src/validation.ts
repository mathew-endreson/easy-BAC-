import { z } from 'zod'

// Public self-registration is student-only — teacher accounts are created
// by staff via the console (see teacherCreateSchema below), never self-served.
export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  phoneNumber: z.string().min(8).max(20).optional(),
  wilaya: z.string().min(1).max(40).optional(),
  bacStream: z.string().max(80).optional(),
  studyYear: z.number().int().min(1).max(3).optional()
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
})

export const courseCreateSchema = z.object({
  title: z.string().min(3).max(140),
  subject: z.string().min(1).max(80),
  bacStream: z.string().min(1).max(80),
  priceDa: z.number().int().min(0),
  description: z.string().max(4000).optional()
})

export const courseUpdateSchema = courseCreateSchema.partial()

export const lessonCreateSchema = z.object({
  title: z.string().min(1).max(140),
  isFreePreview: z.boolean().optional().default(false)
})

export const lessonUpdateSchema = z.object({
  title: z.string().min(1).max(140).optional(),
  isFreePreview: z.boolean().optional(),
  position: z.number().int().min(0).optional()
})

export const staffCourseCreateSchema = courseCreateSchema.extend({
  teacherId: z.string().min(1)
})

export const staffCourseUpdateSchema = courseCreateSchema.partial().extend({
  teacherId: z.string().min(1).optional()
})

export const teacherCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  headline: z.string().max(140).optional(),
  bio: z.string().max(2000).optional(),
  subjects: z.string().max(200).optional(),
  verified: z.boolean().optional()
})

// Used by the "Add course" form on the legacy /admin CMS page — admin enters
// the teacher's details and the course's details in one combined submit.
// The route finds-or-creates the teacher by email rather than requiring a
// pre-existing teacherId, since that page has no teacher picker.
export const courseWithTeacherSchema = courseCreateSchema.extend({
  teacherFirstName: z.string().min(1).max(60),
  teacherLastName: z.string().min(1).max(60),
  teacherEmail: z.string().email()
})

export const teacherProfileUpdateSchema = z.object({
  headline: z.string().max(140).optional(),
  bio: z.string().max(2000).optional(),
  subjects: z.string().max(200).optional(),
  verified: z.boolean().optional()
})
