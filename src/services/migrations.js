import {
  collection, query, where, getDocs, doc, writeBatch, addDoc, serverTimestamp
} from 'firebase/firestore'
import { db } from '../firebase.js'

// One-time data migration: the app used to model "Technical" as 4 separate BAC
// streams (technique-mathematique + genie-mecanique/electrique/civil) when the
// real curriculum has exactly one ("تقني رياضي" / Technique Mathématique). This
// consolidates any existing data on the 3 retired ids into the single canonical
// one. Every write here is a field REMAP on an existing document — nothing is
// ever deleted — so no student/content data is lost, only re-tagged.
//
// Runs as an in-app admin tool (client SDK, gated by RequireAdmin + the
// isAdmin() Firestore rule) rather than an external script, since this repo has
// no firebase-admin/service-account infrastructure — and because a preview step
// the admin can see and re-run gives a real safety check before anything writes.

export const LEGACY_STREAM_IDS = ['genie-mecanique', 'genie-electrique', 'genie-civil']
export const TARGET_STREAM_ID = 'technique-mathematique'

// { collection, field } pairs — the exact field name each collection actually
// uses for its stream tag (confirmed by reading every create*() function):
//   users → bacStream · subjects/units → streamId
//   videoCourses/videos/quizzes/flashcards/resources → stream
const SCALAR_TARGETS = [
  { collection: 'users', field: 'bacStream' },
  { collection: 'subjects', field: 'streamId' },
  { collection: 'units', field: 'streamId' },
  { collection: 'videoCourses', field: 'stream' },
  { collection: 'videos', field: 'stream' },
  { collection: 'quizzes', field: 'stream' },
  { collection: 'flashcards', field: 'stream' },
  { collection: 'resources', field: 'stream' }
]

// Teachers store streams as an array (assignedStreamIds), so they need
// array-membership remapping rather than a plain field overwrite.
const ARRAY_TARGET = { collection: 'teachers', field: 'assignedStreamIds' }

async function findScalarMatches({ collection: name, field }) {
  const snap = await getDocs(query(collection(db, name), where(field, 'in', LEGACY_STREAM_IDS)))
  return snap.docs.map((d) => ({ id: d.id, value: d.data()[field] }))
}

async function findArrayMatches() {
  const snap = await getDocs(query(
    collection(db, ARRAY_TARGET.collection),
    where(ARRAY_TARGET.field, 'array-contains-any', LEGACY_STREAM_IDS)
  ))
  return snap.docs.map((d) => ({ id: d.id, value: d.data()[ARRAY_TARGET.field] || [] }))
}

// Read-only: reports how many documents in each collection still reference a
// retired stream id. Call again after runStreamConsolidation() — every count
// must read 0 before it's safe to remove the retired ids from constants/streams.js.
export async function previewStreamConsolidation() {
  const results = []
  for (const target of SCALAR_TARGETS) {
    const matches = await findScalarMatches(target)
    results.push({ collection: target.collection, field: target.field, count: matches.length })
  }
  const teacherMatches = await findArrayMatches()
  results.push({ collection: ARRAY_TARGET.collection, field: ARRAY_TARGET.field, count: teacherMatches.length })
  return results
}

// Writes: remaps every matched document's stream tag(s) to the single
// canonical id. Batched (chunks of 500 — Firestore's per-batch write limit),
// never a delete. Logs one auditLogs entry summarizing what changed.
export async function runStreamConsolidation(adminId) {
  const summary = []
  let totalWrites = 0

  for (const target of SCALAR_TARGETS) {
    const matches = await findScalarMatches(target)
    if (matches.length === 0) continue
    for (let i = 0; i < matches.length; i += 500) {
      const chunk = matches.slice(i, i + 500)
      const batch = writeBatch(db)
      for (const m of chunk) {
        batch.update(doc(db, target.collection, m.id), { [target.field]: TARGET_STREAM_ID, updatedAt: serverTimestamp() })
      }
      await batch.commit()
      totalWrites += chunk.length
    }
    summary.push({ collection: target.collection, field: target.field, updated: matches.length })
  }

  const teacherMatches = await findArrayMatches()
  if (teacherMatches.length > 0) {
    for (let i = 0; i < teacherMatches.length; i += 500) {
      const chunk = teacherMatches.slice(i, i + 500)
      const batch = writeBatch(db)
      for (const m of chunk) {
        const next = Array.from(new Set(
          m.value.map((id) => (LEGACY_STREAM_IDS.includes(id) ? TARGET_STREAM_ID : id))
        ))
        batch.update(doc(db, ARRAY_TARGET.collection, m.id), { [ARRAY_TARGET.field]: next, updatedAt: serverTimestamp() })
      }
      await batch.commit()
      totalWrites += chunk.length
    }
    summary.push({ collection: ARRAY_TARGET.collection, field: ARRAY_TARGET.field, updated: teacherMatches.length })
  }

  await addDoc(collection(db, 'auditLogs'), {
    action: 'stream_consolidation',
    legacyIds: LEGACY_STREAM_IDS,
    targetId: TARGET_STREAM_ID,
    summary,
    totalWrites,
    performedBy: adminId || null,
    createdAt: serverTimestamp()
  })

  return { summary, totalWrites }
}
