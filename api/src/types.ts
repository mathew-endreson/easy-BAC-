export type Env = {
  DB: D1Database
  FILES: R2Bucket
  APP_ORIGIN: string
  ENVIRONMENT: string
  LESSON_SIGNING_SECRET: string
}

export type Role = 'student' | 'teacher' | 'staff'

export type AuthUser = {
  id: string
  email: string
  role: Role
  isSuperAdmin: boolean
  permissions: string[]
  displayName: string
}

export type Variables = {
  user: AuthUser | null
}

export type AppBindings = { Bindings: Env; Variables: Variables }
