import {
  collection, query, where, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase.js'
import { filterByStream } from '../utils/streamFilter.js'

// Teacher video-course data access: videoCourses/{id} + videos/{id} (FK
// courseId). Both collections already exist in firestore.rules (authed read,
// admin write) from the academic-hierarchy slab — no rule changes needed.
// Video hosting stays URL-based (YouTube/Dailymotion/Drive link), matching how
// `resources` already works — no Storage/upload infra is introduced here.

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0)
const mapDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))

// ── Courses ───────────────────────────────────────────────────────────
export async function getAllCourses() {
  const snap = await getDocs(collection(db, 'videoCourses'))
  return mapDocs(snap)
}

// Published courses visible to a student's stream (untagged-visible-to-all,
// same rule as every other content type in this app).
export async function getPublishedCourses(stream) {
  const all = await getAllCourses()
  return filterByStream(all.filter((c) => c.status === 'PUBLISHED'), stream)
}

// A single teacher's published courses, visible to the student's stream — used
// by the Teacher detail page.
export async function getCoursesByTeacher(teacherId, stream) {
  const snap = await getDocs(query(collection(db, 'videoCourses'), where('teacherId', '==', teacherId)))
  return filterByStream(mapDocs(snap).filter((c) => c.status === 'PUBLISHED'), stream)
}

export async function getCourseById(id) {
  const s = await getDoc(doc(db, 'videoCourses', id))
  return s.exists() ? { id: s.id, ...s.data() } : null
}

export function createCourse({ title, description = '', coverURL = '', teacherId, streamId, subjectId, unitId }, adminId) {
  return addDoc(collection(db, 'videoCourses'), {
    title: title.trim(), description, coverURL, teacherId: teacherId || '',
    stream: streamId || '', subjectId: subjectId || '', unitId: unitId || '',
    status: 'DRAFT', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: adminId || null
  })
}

export function updateCourse(id, patch) {
  return updateDoc(doc(db, 'videoCourses', id), { ...patch, updatedAt: serverTimestamp() })
}

export function deleteCourse(id) {
  return deleteDoc(doc(db, 'videoCourses', id))
}

export const publishCourse = (id) => updateCourse(id, { status: 'PUBLISHED' })
export const unpublishCourse = (id) => updateCourse(id, { status: 'UNPUBLISHED' })

// ── Videos ────────────────────────────────────────────────────────────
export async function getVideosForCourse(courseId) {
  const snap = await getDocs(query(collection(db, 'videos'), where('courseId', '==', courseId)))
  return mapDocs(snap).sort(byOrder)
}

export function addVideo({ courseId, teacherId, streamId, subjectId, unitId, title, videoURL, duration = 0, order = 0 }, adminId) {
  return addDoc(collection(db, 'videos'), {
    courseId, teacherId: teacherId || '', stream: streamId || '', subjectId: subjectId || '', unitId: unitId || '',
    title: title.trim(), videoURL: videoURL.trim(), duration: Number(duration) || 0, order: Number(order) || 0,
    status: 'PUBLISHED', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: adminId || null
  })
}

export function updateVideo(id, patch) {
  return updateDoc(doc(db, 'videos', id), { ...patch, updatedAt: serverTimestamp() })
}

export function deleteVideo(id) {
  return deleteDoc(doc(db, 'videos', id))
}
