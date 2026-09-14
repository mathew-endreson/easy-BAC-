// Stream-based content visibility. A student may see a piece of content when:
//   • it carries no stream tag (legacy / "all streams" content — visible to all), OR
//   • its stream tag matches the student's bacStream.
//
// This is the single rule used everywhere content is listed, so filtering stays
// consistent across the dashboard, catalog, quizzes, flashcards, resources,
// favorites and search. Server-side hardening lives in firestore.rules (see the
// commented strict per-stream read variant there).

export function matchesStream(item, stream) {
  const tag = item?.stream
  if (!tag) return true          // untagged content is visible to everyone
  if (!stream) return true       // no student stream yet → don't hide anything
  return tag === stream
}

export function filterByStream(items, stream) {
  if (!Array.isArray(items)) return []
  return items.filter((item) => matchesStream(item, stream))
}
