// Algerian BAC streams (الشعب). The `id` is the STABLE value stored on every
// student profile (`bacStream`) and on every piece of content, so it must never
// change once data exists. Labels are localized; render `label[lang]`.
//
// This is the single source of truth for streams across the whole platform —
// onboarding, content tagging in the admin, and stream-based filtering all read
// from here. Do NOT hardcode stream strings anywhere else.

export const STREAMS = [
  {
    id: 'sciences-experimentales',
    icon: '🧪',
    label: { ar: 'علوم تجريبية', fr: 'Sciences expérimentales', en: 'Experimental Sciences' }
  },
  {
    id: 'mathematiques',
    icon: '📐',
    label: { ar: 'رياضيات', fr: 'Mathématiques', en: 'Mathematics' }
  },
  {
    id: 'technique-mathematique',
    icon: '⚙️',
    label: { ar: 'تقني رياضي', fr: 'Technique mathématique', en: 'Technical Mathematics' }
  },
  {
    id: 'gestion-economie',
    icon: '📊',
    label: { ar: 'تسيير و اقتصاد', fr: 'Gestion et économie', en: 'Management & Economics' }
  },
  {
    id: 'lettres-philosophie',
    icon: '📚',
    label: { ar: 'آداب و فلسفة', fr: 'Lettres et philosophie', en: 'Literature & Philosophy' }
  },
  {
    id: 'langues-etrangeres',
    icon: '🗣️',
    label: { ar: 'لغات أجنبية', fr: 'Langues étrangères', en: 'Foreign Languages' }
  },
  {
    id: 'genie-mecanique',
    icon: '🔧',
    label: { ar: 'هندسة ميكانيكية', fr: 'Génie mécanique', en: 'Mechanical Engineering' }
  },
  {
    id: 'genie-electrique',
    icon: '💡',
    label: { ar: 'هندسة كهربائية', fr: 'Génie électrique', en: 'Electrical Engineering' }
  },
  {
    id: 'genie-civil',
    icon: '🏗️',
    label: { ar: 'هندسة مدنية', fr: 'Génie civil', en: 'Civil Engineering' }
  }
]

const STREAM_MAP = Object.fromEntries(STREAMS.map((s) => [s.id, s]))

export const STREAM_IDS = STREAMS.map((s) => s.id)

export function getStream(id) {
  return STREAM_MAP[id] || null
}

// Localized label for a stream id, with graceful fallbacks. Unknown/legacy ids
// are returned verbatim so nothing ever renders blank.
export function streamLabel(id, lang = 'en') {
  const s = STREAM_MAP[id]
  if (!s) return id || ''
  return s.label[lang] || s.label.en || id
}

export function isValidStream(id) {
  return Object.prototype.hasOwnProperty.call(STREAM_MAP, id)
}
