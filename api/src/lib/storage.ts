// Short-lived HMAC-signed lesson access, and byte-range streaming from R2 —
// the same pattern L'Externe uses for its PDFs (see architecture doc §2.3c).

function base64url(bytes: Uint8Array): string {
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign'
  ])
}

async function sign(secret: string, lessonId: string, exp: number): Promise<string> {
  const key = await hmacKey(secret)
  const data = new TextEncoder().encode(`${lessonId}.${exp}`)
  const sigBuf = await crypto.subtle.sign('HMAC', key, data)
  return base64url(new Uint8Array(sigBuf))
}

export async function signLessonAccess(
  secret: string,
  lessonId: string,
  ttlSeconds = 300
): Promise<{ exp: number; sig: string }> {
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const sig = await sign(secret, lessonId, exp)
  return { exp, sig }
}

export async function verifyLessonAccess(secret: string, lessonId: string, exp: number, sig: string): Promise<boolean> {
  if (!Number.isFinite(exp) || Math.floor(Date.now() / 1000) > exp) return false
  const expected = await sign(secret, lessonId, exp)
  return timingSafeEqual(expected, sig)
}

export async function streamR2Range(bucket: R2Bucket, key: string, rangeHeader: string | null): Promise<Response> {
  const head = await bucket.head(key)
  if (!head) return new Response('Not found', { status: 404 })
  const size = head.size

  let start = 0
  let end = size - 1
  const match = rangeHeader ? /bytes=(\d*)-(\d*)/.exec(rangeHeader) : null
  if (match) {
    const [, startStr, endStr] = match
    if (startStr === '' && endStr !== '') {
      // suffix range: last N bytes
      start = Math.max(0, size - parseInt(endStr, 10))
      end = size - 1
    } else {
      if (startStr !== '') start = parseInt(startStr, 10)
      if (endStr !== '') end = parseInt(endStr, 10)
    }
  }
  start = Math.max(0, start)
  end = Math.min(size - 1, end)
  const length = end - start + 1

  const object = await bucket.get(key, { range: { offset: start, length } })
  if (!object) return new Response('Not found', { status: 404 })

  const headers = new Headers()
  headers.set('Content-Range', `bytes ${start}-${end}/${size}`)
  headers.set('Accept-Ranges', 'bytes')
  headers.set('Content-Length', String(length))
  headers.set('Content-Type', object.httpMetadata?.contentType || 'video/mp4')
  headers.set('Cache-Control', 'private, no-store')

  return new Response(object.body, { status: match ? 206 : 200, headers })
}
