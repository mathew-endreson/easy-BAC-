import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore'
import { db } from '../firebase.js'
import { filterByStream, matchesStream } from '../utils/streamFilter.js'

// Content data-access layer. Every read goes through here so stream filtering is
// applied uniformly and pages stay free of Firestore query details. Reads fetch
// the collection then filter by stream client-side (the dataset is small; this
// avoids composite-index requirements and correctly keeps untagged content
// visible to all streams). Functions throw on failure — callers show the error.

async function readCollection(name) {
  const snap = await getDocs(collection(db, name))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// All docs of a collection the given student is allowed to see.
export async function getForStream(name, stream) {
  return filterByStream(await readCollection(name), stream)
}

export const getQuizzes = (stream) => getForStream('quizzes', stream)
export const getFlashcards = (stream) => getForStream('flashcards', stream)
export const getResources = (stream) => getForStream('resources', stream)

// Docs of a collection matching a subject AND visible to the student's stream.
export async function getBySubjectForStream(name, subject, stream) {
  const snap = await getDocs(query(collection(db, name), where('subject', '==', subject)))
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return filterByStream(items, stream)
}

// Docs of a collection attached to a specific Unit (unitId), stream-filtered.
export async function getByUnitForStream(name, unitId, stream) {
  const snap = await getDocs(query(collection(db, name), where('unitId', '==', unitId)))
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  return filterByStream(items, stream)
}

// A single content document by id, re-validated against the student's stream
// (returns null if it isn't visible to them — used when opening a favorite or a
// specific quiz). Untagged content stays visible per matchesStream.
export async function getContentById(name, id, stream) {
  const s = await getDoc(doc(db, name, id))
  if (!s.exists()) return null
  const item = { id: s.id, ...s.data() }
  return matchesStream(item, stream) ? item : null
}

// Count of a unit's content by type — used for unit cards. Returns
// { quizzes, flashcards, resources }.
export async function getUnitCounts(unitId, stream) {
  const [q, f, r] = await Promise.all([
    getByUnitForStream('quizzes', unitId, stream),
    getByUnitForStream('flashcards', unitId, stream),
    getByUnitForStream('resources', unitId, stream)
  ])
  return { quizzes: q.length, flashcards: f.length, resources: r.length }
}
