import { doc, getDoc, getDocs, setDoc, deleteDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'

// Personal, per-student progress on individual quiz/flashcard "decks", stored at
// users/{uid}/progress/{docId} (already owner-read/write in firestore.rules from
// the very first slab — no rule changes needed here).
//
// One doc per deck the student has actually studied — nothing is written on a
// timer or per-second; only on a completed attempt/session. `docId` is
// deterministic (`quiz_{contentId}` / `flashcard_{deckId}`) so re-attempting a
// deck updates the same doc instead of piling up duplicates.

const quizDocId = (contentId) => `quiz_${contentId}`
const flashDocId = (deckId) => `flashcard_${deckId}`

function toMillis(ts) {
  if (!ts) return 0
  if (typeof ts.toMillis === 'function') return ts.toMillis()
  if (ts.seconds) return ts.seconds * 1000
  return 0
}

export async function getAllProgress(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'progress'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Records one finished quiz attempt. Merges into the existing doc so
// `attempts`/`bestScore`/`bestTimeSpent` accumulate correctly across retries.
export async function recordQuizResult(uid, quiz, { correct, total, timeSpentSec }) {
  if (!uid || !quiz?.id || !total) return
  const ref = doc(db, 'users', uid, 'progress', quizDocId(quiz.id))
  const prev = await getDoc(ref)
  const prevData = prev.exists() ? prev.data() : null
  const scorePct = Math.round((correct / total) * 100)
  const payload = {
    type: 'quiz',
    contentId: quiz.id,
    title: quiz.title || quiz.subject || 'Quiz',
    subject: quiz.subject || '',
    subjectId: quiz.subjectId || '',
    unitId: quiz.unitId || '',
    stream: quiz.stream || '',
    total,
    lastCorrect: correct,
    lastScore: scorePct,
    bestScore: Math.max(scorePct, prevData?.bestScore || 0),
    lastTimeSpent: timeSpentSec || 0,
    bestTimeSpent: prevData?.bestTimeSpent ? Math.min(prevData.bestTimeSpent, timeSpentSec || Infinity) : (timeSpentSec || 0),
    attempts: (prevData?.attempts || 0) + 1,
    completed: true,
    lastAttemptAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  if (!prevData) payload.startedAt = serverTimestamp()
  await setDoc(ref, payload, { merge: true })
}

// Records how far a student got in a quiz they DIDN'T finish (exited early).
// Deliberately separate from recordQuizResult: it never touches `completed`,
// `attempts`, `bestScore` or `lastScore` (a half-answered quiz has no
// meaningful score yet) — it only tracks `answered`, so the deck browser can
// honestly show "3/10 answered" instead of resetting to 0 just because the
// student left before the last question.
export async function recordQuizProgress(uid, quiz, { answered, total, timeSpentSec }) {
  if (!uid || !quiz?.id || !total || !answered) return
  const ref = doc(db, 'users', uid, 'progress', quizDocId(quiz.id))
  const prev = await getDoc(ref)
  const prevData = prev.exists() ? prev.data() : null
  const payload = {
    type: 'quiz',
    contentId: quiz.id,
    title: quiz.title || quiz.subject || 'Quiz',
    subject: quiz.subject || '',
    subjectId: quiz.subjectId || '',
    unitId: quiz.unitId || '',
    stream: quiz.stream || '',
    total,
    answered: Math.max(answered, prevData?.answered || 0),
    lastTimeSpent: timeSpentSec || 0,
    completed: prevData?.completed || false,
    lastAttemptAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  if (!prevData) payload.startedAt = serverTimestamp()
  await setDoc(ref, payload, { merge: true })
}

// Records one finished flashcard study session for a deck. `mood` is the
// student's own 1-5 self-rating for that session (Anki-style "how did that
// go"), stored as the most recent rating — not averaged, since it reflects how
// the LAST session felt, not a lifetime score.
export async function recordFlashcardSession(uid, deck, { reviewed, mastered, timeSpentSec, mood }) {
  if (!uid || !deck?.id || !deck.total) return
  const ref = doc(db, 'users', uid, 'progress', flashDocId(deck.id))
  const prev = await getDoc(ref)
  const prevData = prev.exists() ? prev.data() : null
  const payload = {
    type: 'flashcard',
    contentId: deck.id,
    title: deck.title || deck.subject || 'Flashcards',
    subject: deck.subject || '',
    subjectId: deck.subjectId || '',
    unitId: deck.unitId || '',
    stream: deck.stream || '',
    total: deck.total,
    reviewed: Math.max(reviewed || 0, prevData?.reviewed || 0),
    mastered: typeof mastered === 'number' ? mastered : (prevData?.mastered || 0),
    lastTimeSpent: timeSpentSec || 0,
    bestTimeSpent: prevData?.bestTimeSpent ? Math.min(prevData.bestTimeSpent, timeSpentSec || Infinity) : (timeSpentSec || 0),
    mood: mood ?? prevData?.mood ?? null,
    sessions: (prevData?.sessions || 0) + 1,
    completed: (reviewed || 0) >= deck.total,
    lastReviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  if (!prevData) payload.startedAt = serverTimestamp()
  await setDoc(ref, payload, { merge: true })
}

// "Reset" a deck's personal stats (the trash icon on a deck card). This only
// removes the STUDENT's own progress record — never the underlying platform
// content, which stays admin-only to modify.
export async function resetDeckProgress(uid, type, contentId) {
  const id = type === 'quiz' ? quizDocId(contentId) : flashDocId(contentId)
  await deleteDoc(doc(db, 'users', uid, 'progress', id))
}

// Video progress: honest "started"/"completed" signals (there's no embedded
// player to derive real watch-time/position from — matches how Resources are
// tracked elsewhere in the app). `started` is recorded once, the first time a
// student opens the video; `completed` is a manual student toggle.
const videoDocId = (videoId) => `video_${videoId}`

export async function markVideoStarted(uid, video) {
  if (!uid || !video?.id) return
  const ref = doc(db, 'users', uid, 'progress', videoDocId(video.id))
  const prev = await getDoc(ref)
  if (prev.exists()) return // already tracked — don't overwrite completed/startedAt
  await setDoc(ref, {
    type: 'video',
    contentId: video.id,
    courseId: video.courseId || '',
    title: video.title || '',
    subjectId: video.subjectId || '',
    unitId: video.unitId || '',
    stream: video.stream || '',
    completed: false,
    startedAt: serverTimestamp(),
    lastActivityAt: serverTimestamp()
  })
}

export async function setVideoCompleted(uid, video, completed) {
  if (!uid || !video?.id) return
  const ref = doc(db, 'users', uid, 'progress', videoDocId(video.id))
  await setDoc(ref, {
    type: 'video',
    contentId: video.id,
    courseId: video.courseId || '',
    title: video.title || '',
    subjectId: video.subjectId || '',
    unitId: video.unitId || '',
    stream: video.stream || '',
    completed: Boolean(completed),
    completedAt: completed ? serverTimestamp() : null,
    lastActivityAt: serverTimestamp()
  }, { merge: true })
}

export { toMillis }
