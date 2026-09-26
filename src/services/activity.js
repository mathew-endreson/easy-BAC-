import {
  collection, addDoc, setDoc, doc, getDocs, query, where, orderBy, limit, serverTimestamp, Timestamp
} from 'firebase/firestore'
import { db } from '../firebase.js'

// Student activity tracking for the Super Admin "Activity" tab.
//   activityLogs/{id}  — append-only event log (session_start, page_view)
//   presence/{uid}     — one doc per student, refreshed by a heartbeat; "online
//                        now" = lastSeen within the last few minutes
// Writes are tiny and best-effort (tracking must never break the app); reads
// are bounded queries, so cost stays flat as the log grows.

export const ONLINE_WINDOW_MS = 3 * 60 * 1000

const who = (user, profile) => ({
  uid: user.uid,
  name: profile?.displayName || user.displayName || '',
  email: user.email || profile?.email || '',
  stream: profile?.bacStream || ''
})

export function logActivity(user, profile, type, path = '') {
  return addDoc(collection(db, 'activityLogs'), {
    ...who(user, profile), type, path, createdAt: serverTimestamp()
  }).catch(() => {})
}

export function touchPresence(user, profile, path = '') {
  return setDoc(doc(db, 'presence', user.uid), {
    ...who(user, profile), path, lastSeen: serverTimestamp()
  }).catch(() => {})
}

// ── Admin reads ──────────────────────────────────────────────────────
export async function getOnlineNow() {
  const cutoff = Timestamp.fromMillis(Date.now() - ONLINE_WINDOW_MS)
  const snap = await getDocs(query(collection(db, 'presence'), where('lastSeen', '>', cutoff)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getLogsSince(sinceMs, max = 1000) {
  const snap = await getDocs(query(
    collection(db, 'activityLogs'),
    where('createdAt', '>=', Timestamp.fromMillis(sinceMs)),
    orderBy('createdAt', 'desc'),
    limit(max)
  ))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
