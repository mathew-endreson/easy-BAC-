import { getQuizzes, getFlashcards } from './content.js'

// "Decks" are the personal-tracking unit shown on the quiz/flashcard browse
// pages (one deck = one progress card). A quiz document already IS one deck
// (title + a questions[] array), so quiz decks need no transformation.
//
// Flashcards are stored as one Firestore DOCUMENT PER CARD (no grouping field
// existed before this feature). Going forward, Admin's "Add Flashcard" form
// stamps every card saved in the same submission with a shared `setId`+
// `setTitle` (see Admin.jsx), so those group into a real deck. Cards saved
// before this change have no setId — they're grouped by subject instead so
// nothing existing disappears or breaks; they just show up as one deck named
// after their subject.

export async function getQuizDecks(stream) {
  const quizzes = await getQuizzes(stream)
  return quizzes.map((q) => ({
    id: q.id,
    type: 'quiz',
    title: q.title || q.subject || 'Quiz',
    subject: q.subject || '',
    subjectId: q.subjectId || '',
    unitId: q.unitId || '',
    stream: q.stream || '',
    total: Array.isArray(q.questions) ? q.questions.length : 0
  }))
}

// The single grouping key used everywhere a flashcard's deck must be derived.
const cardDeckKey = (c) => c.setId || `subject:${c.subject || 'general'}`

export async function getFlashcardDecks(stream) {
  const cards = await getFlashcards(stream)
  const groups = new Map()
  for (const c of cards) {
    const key = cardDeckKey(c)
    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        type: 'flashcard',
        title: c.setTitle || c.subject || 'Flashcards',
        subject: c.subject || '',
        subjectId: c.subjectId || '',
        unitId: c.unitId || '',
        stream: c.stream || '',
        cardIds: [],
        total: 0
      })
    }
    const g = groups.get(key)
    g.cardIds.push(c.id)
    g.total += 1
  }
  return Array.from(groups.values())
}

// The literal card documents belonging to one deck, for actually studying it.
export async function getDeckCards(stream, deckId) {
  const cards = await getFlashcards(stream)
  return cards.filter((c) => cardDeckKey(c) === deckId)
}
