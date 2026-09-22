// Stream-based content visibility. A student may see a piece of content when:
//   • it carries no stream tag (legacy / "all streams" content — visible to all), OR
//   • its stream tag(s) include the student's bacStream.
//
// Content can be tagged with several streams at once (`streams: [...]`, set via
// the admin's multi-select picker) or, for older documents, a single scalar
// `stream` field — both are honored so nothing already saved stops matching.
//
// This is the single rule used everywhere content is listed, so filtering stays
// consistent across the dashboard, catalog, quizzes, flashcards, resources,
// favorites and search. Server-side hardening lives in firestore.rules (see the
// commented strict per-stream read variant there).

export function matchesStream(item, stream) {
  const tags = Array.isArray(item?.streams) && item.streams.length ? item.streams : (item?.stream ? [item.stream] : [])
  if (tags.length === 0) return true // untagged content is visible to everyone
  if (!stream) return true           // no student stream yet → don't hide anything
  return tags.includes(stream)
}

export function filterByStream(items, stream) {
  if (!Array.isArray(items)) return []
  return items.filter((item) => matchesStream(item, stream))
}
