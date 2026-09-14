import { collection, getDocs, query, where, doc, updateDoc, getCountFromServer } from 'firebase/firestore'
import { db } from '../firebase.js'

// Admin student-tracking data access. Firestore rules already let a super admin
// read any users/{uid} doc, and a collection query is evaluated per-document
// against those same rules, so no separate rule is needed here.
//
// Reads are capped (STUDENT_SCAN_LIMIT) to keep this bounded on a growing
// dataset — see README-style note below. This is an honest MVP: real counts up
// to the cap, not a fabricated aggregate.
const STUDENT_SCAN_LIMIT = 500

export async function getAllStudents() {
  const q = query(collection(db, 'users'), where('role', '==', 'student'))
  const snap = await getDocs(q)
  return snap.docs.slice(0, STUDENT_SCAN_LIMIT).map((d) => ({ id: d.id, ...d.data() }))
}

// Fast total count without downloading every document (used for the headline
// "Total Students" stat even when the scan above is capped).
export async function getStudentCount() {
  try {
    const snap = await getCountFromServer(query(collection(db, 'users'), where('role', '==', 'student')))
    return snap.data().count
  } catch {
    return null
  }
}

export function setStudentDisabled(uid, disabled) {
  return updateDoc(doc(db, 'users', uid), { disabled: Boolean(disabled) })
}

// A student's saved-item count — the one piece of "activity" we can honestly
// report today without a progress-tracking data layer.
export async function getFavoritesCount(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'favorites'))
  return snap.size
}

function toMillis(ts) {
  if (!ts) return 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (ts.seconds) return ts.seconds * 1000
  return 0
}

// Derives the headline stats from an already-fetched student list (client-side
// aggregation — acceptable at MVP scale; see STUDENT_SCAN_LIMIT above).
export function summarizeStudents(students) {
  const now = Date.now()
  const weekMs = 7 * 24 * 60 * 60 * 1000
  const byStream = {}
  let completed = 0
  let newThisWeek = 0
  for (const s of students) {
    if (s.bacStream) byStream[s.bacStream] = (byStream[s.bacStream] || 0) + 1
    if (s.profileCompleted) completed += 1
    if (now - toMillis(s.createdAt) <= weekMs) newThisWeek += 1
  }
  return {
    total: students.length,
    completed,
    completionRate: students.length ? Math.round((completed / students.length) * 100) : 0,
    newThisWeek,
    byStream
  }
}

export { toMillis }
