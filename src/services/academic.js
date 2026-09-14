import {
  collection, query, where, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase.js'

// Academic hierarchy data-access: Stream → Subject → Unit. These are the
// admin-managed collections every piece of educational content hangs off of.
// Queries use a single `where` and sort by `order` client-side to avoid
// composite-index friction (datasets are small: a handful of subjects/units per
// stream). `stream`/`streamId` values are BAC stream ids from constants/streams.

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || (a.name || '').localeCompare(b.name || '')
const mapDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }))

// ── Subjects ──────────────────────────────────────────────────────────
export async function getSubjects(streamId) {
  const col = collection(db, 'subjects')
  const snap = await getDocs(streamId ? query(col, where('streamId', '==', streamId)) : col)
  return mapDocs(snap).sort(byOrder)
}

export function createSubject({ name, streamId, order = 0 }, adminId) {
  return addDoc(collection(db, 'subjects'), {
    name: name.trim(), streamId, order: Number(order) || 0, status: 'ACTIVE',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: adminId || null
  })
}

export function updateSubject(id, patch) {
  return updateDoc(doc(db, 'subjects', id), { ...patch, updatedAt: serverTimestamp() })
}

export function deleteSubject(id) {
  return deleteDoc(doc(db, 'subjects', id))
}

export async function getSubjectById(id) {
  const s = await getDoc(doc(db, 'subjects', id))
  return s.exists() ? { id: s.id, ...s.data() } : null
}

export async function getUnitById(id) {
  const u = await getDoc(doc(db, 'units', id))
  return u.exists() ? { id: u.id, ...u.data() } : null
}

// ── Units ─────────────────────────────────────────────────────────────
export async function getUnits(subjectId) {
  const col = collection(db, 'units')
  const snap = await getDocs(subjectId ? query(col, where('subjectId', '==', subjectId)) : col)
  return mapDocs(snap).sort(byOrder)
}

export function createUnit({ name, description = '', streamId, subjectId, order = 0 }, adminId) {
  return addDoc(collection(db, 'units'), {
    name: name.trim(), description, streamId, subjectId, order: Number(order) || 0, status: 'ACTIVE',
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: adminId || null
  })
}

export function updateUnit(id, patch) {
  return updateDoc(doc(db, 'units', id), { ...patch, updatedAt: serverTimestamp() })
}

export function deleteUnit(id) {
  return deleteDoc(doc(db, 'units', id))
}

// ── Teachers (admin-managed content providers, NOT authenticated users) ──
export async function getTeachers() {
  const snap = await getDocs(collection(db, 'teachers'))
  return mapDocs(snap).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
}

export function createTeacher({ name, photoURL = '', bio = '', specialization = '', assignedStreamIds = [] }, adminId) {
  return addDoc(collection(db, 'teachers'), {
    name: name.trim(), photoURL, bio, specialization, assignedStreamIds,
    status: 'ACTIVE', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: adminId || null
  })
}

export function updateTeacher(id, patch) {
  return updateDoc(doc(db, 'teachers', id), { ...patch, updatedAt: serverTimestamp() })
}

export function deleteTeacher(id) {
  return deleteDoc(doc(db, 'teachers', id))
}
