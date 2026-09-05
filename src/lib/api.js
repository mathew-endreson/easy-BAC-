const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'
export const API_BASE_URL = BASE_URL

async function request(path, { method = 'GET', body, isFormData = false } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include',
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined
  })

  const contentType = res.headers.get('content-type') || ''
  const data = contentType.includes('application/json') ? await res.json() : null

  if (!res.ok) {
    const error = new Error(data?.error || `request_failed_${res.status}`)
    error.status = res.status
    error.data = data
    throw error
  }
  return data
}

export const api = {
  register: (payload) => request('/v1/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/v1/auth/login', { method: 'POST', body: payload }),
  logout: () => request('/v1/auth/logout', { method: 'POST' }),
  me: () => request('/v1/auth/me'),

  listCourses: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/v1/courses${qs ? `?${qs}` : ''}`)
  },
  getCourse: (id) => request(`/v1/courses/${id}`),
  watchLesson: (id) => request(`/v1/lessons/${id}/watch`),

  consoleCourses: () => request('/console/api/courses'),
  consoleCourse: (id) => request(`/console/api/courses/${id}`),
  consoleCreateCourse: (payload) => request('/console/api/courses', { method: 'POST', body: payload }),
  consoleCreateCourseWithTeacher: (payload) => request('/console/api/courses/with-teacher', { method: 'POST', body: payload }),
  consoleUpdateCourse: (id, payload) => request(`/console/api/courses/${id}`, { method: 'PATCH', body: payload }),
  consolePublishCourse: (id) => request(`/console/api/courses/${id}/publish`, { method: 'POST' }),
  consoleUnpublishCourse: (id) => request(`/console/api/courses/${id}/unpublish`, { method: 'POST' }),
  consoleUploadCover: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return request(`/console/api/courses/${id}/cover`, { method: 'POST', body: form, isFormData: true })
  },
  consoleAddLesson: (courseId, { title, isFreePreview, video }) => {
    const form = new FormData()
    form.append('title', title)
    form.append('isFreePreview', String(!!isFreePreview))
    form.append('video', video)
    return request(`/console/api/courses/${courseId}/lessons`, { method: 'POST', body: form, isFormData: true })
  },
  consoleUpdateLesson: (id, payload) => request(`/console/api/lessons/${id}`, { method: 'PATCH', body: payload }),
  consoleDeleteLesson: (id) => request(`/console/api/lessons/${id}`, { method: 'DELETE' }),

  consoleUserStats: () => request('/console/api/users/stats'),

  consoleTeachers: () => request('/console/api/teachers'),
  consoleCreateTeacher: (payload) => request('/console/api/teachers', { method: 'POST', body: payload }),
  consoleUpdateTeacher: (id, payload) => request(`/console/api/teachers/${id}`, { method: 'PATCH', body: payload }),
  consoleUploadTeacherAvatar: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return request(`/console/api/teachers/${id}/avatar`, { method: 'POST', body: form, isFormData: true })
  },

  consoleApprovals: () => request('/console/api/approvals'),
  consoleApprove: (id) => request(`/console/api/approvals/${id}/approve`, { method: 'POST' }),
  consoleReject: (id, reason) => request(`/console/api/approvals/${id}/reject`, { method: 'POST', body: { reason } })
}
