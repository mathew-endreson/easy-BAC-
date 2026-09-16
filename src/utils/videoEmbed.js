// Detects the video provider from a raw URL (as admins type it into the
// course-video form: "Video URL (YouTube, Dailymotion, Drive…)") and returns a
// safe embeddable URL for it. Returns `{ provider: null, embedUrl: null }` for
// anything unrecognized/invalid so callers can fall back to an "open
// externally" link instead of rendering a broken iframe.

const PATTERNS = [
  {
    provider: 'youtube',
    match: (url) => {
      const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/)
      return m ? m[1] : null
    },
    embed: (id) => `https://www.youtube.com/embed/${id}`
  },
  {
    provider: 'dailymotion',
    match: (url) => {
      const m = url.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([\w-]+)/)
      return m ? m[1] : null
    },
    embed: (id) => `https://www.dailymotion.com/embed/video/${id}`
  },
  {
    provider: 'drive',
    match: (url) => {
      const m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/) || url.match(/drive\.google\.com\/open\?id=([\w-]+)/)
      return m ? m[1] : null
    },
    embed: (id) => `https://drive.google.com/file/d/${id}/preview`
  }
]

export function parseVideoUrl(url) {
  const trimmed = (url || '').trim()
  if (!trimmed) return { provider: null, embedUrl: null }
  for (const p of PATTERNS) {
    const id = p.match(trimmed)
    if (id) return { provider: p.provider, embedUrl: p.embed(id) }
  }
  return { provider: null, embedUrl: null }
}
